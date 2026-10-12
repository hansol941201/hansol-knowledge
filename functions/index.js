'use strict';
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const { OpenAIProvider } = require('./provider');
const { answerQuestion, revisionOf } = require('./engine');
const codec = require('./storage-codec');
initializeApp();
const key = defineSecret('OPENAI_API_KEY');
const db = getFirestore();
const owner = () => process.env.ALLOWED_UID || 'Lsuxm4H1s0Zm1sy93P378Bce2tt1';
async function readState() {
  return db.runTransaction(async tx => {
    const root = await tx.get(db.doc('shared/state'));
    return codec.unpack(root.data(), async id => (await tx.get(db.doc(`stateParts/${id}`))).data());
  }, { readOnly: true });
}
const cache = {
  async get(keys) {
    const result = [];
    for (let i = 0; i < keys.length; i += 200) {
      const rows = await db.getAll(...keys.slice(i, i + 200).map(id => db.doc(`aiEmbeddings/${id}`)));
      result.push(...rows.map(row => row.data()?.vector));
    }
    return result;
  },
  async set(entries) {
    const batch = db.batch();
    for (const row of entries) batch.set(db.doc(`aiEmbeddings/${row.key}`), { vector: row.vector, expiresAt: Timestamp.fromMillis(Date.now() + 86400000) });
    await batch.commit();
  }
};
exports.answerKnowledge = onRequest({ region: 'asia-northeast3', secrets: [key], timeoutSeconds: 540, memory: '1GiB', maxInstances: 2, concurrency: 2, invoker: 'public' }, async (req, res) => {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://hansol941201.github.io';
  const origin = req.get('origin');
  res.set('Vary', 'Origin'); res.set('Cache-Control', 'no-store');
  if (origin && origin !== allowedOrigin) return res.status(403).json({ error: '허용되지 않은 사이트입니다.' });
  res.set('Access-Control-Allow-Origin', allowedOrigin);
  res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST 요청이 필요합니다.' });
  let user;
  try { user = await getAuth().verifyIdToken((req.get('authorization') || '').replace(/^Bearer /, ''), true); }
  catch { return res.status(401).json({ error: '동기화 로그인 후 다시 검색해 주세요.' }); }
  if (user.uid !== owner()) return res.status(403).json({ error: '기록 접근 권한이 없습니다.' });
  const question = req.body?.question;
  if (typeof question !== 'string' || !question.trim() || question.length > 1000) return res.status(400).json({ error: '질문은 1~1,000자로 입력해 주세요.' });
  const lease = db.doc(`aiRequests/${user.uid}`), requestId = globalThis.crypto.randomUUID();
  try {
    await db.runTransaction(async tx => {
      const previous = (await tx.get(lease)).data();
      if (previous?.until > Date.now()) throw new Error('다른 검색을 처리 중입니다. 잠시 후 다시 검색해 주세요.');
      tx.set(lease, { requestId, until: Date.now() + 560000 });
    });
  } catch (error) { return res.status(429).json({ error: error.message }); }
  try {
    const state = await readState(), revision = revisionOf(state);
    const answer = await answerQuestion({ state, question: question.trim(), provider: new OpenAIProvider(key.value()), cache });
    // No cached answers: recheck the authoritative state after every model call.
    if (revisionOf(await readState()) !== revision) return res.status(409).json({ error: '검색 중 기록이 변경됐어요. 최신 기록으로 다시 검색해 주세요.' });
    return res.json({ ...answer, revision });
  } catch (error) {
    console.error('AI search failed', error.name); // Never log user records, queries or secrets.
    const safe = /한도|검증|근거|AI 제공자|AI가|OPENAI_API_KEY|원문/.test(error.message) ? error.message : 'AI 검색 처리에 실패했습니다. 서버 연결과 설정을 확인해 주세요.';
    return res.status(503).json({ error: safe });
  } finally {
    await db.runTransaction(async tx => { const current = await tx.get(lease); if (current.data()?.requestId === requestId) tx.delete(lease); }).catch(() => {});
  }
});
