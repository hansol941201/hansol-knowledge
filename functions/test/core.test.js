const { test } = require('node:test');
const assert = require('node:assert/strict');
const codec = require('../storage-codec');
const { recordsFromState, chunkRecords, lexicalScores, retrieve, validateAnswer, NOT_FOUND } = require('../retrieval');
const { revisionOf } = require('../engine');

test('UTF-8 split storage round trip preserves every character including emoji and tail', async () => {
  const state = { knowledge: [{ id: 'long', title: '혼합 기록', answer: '앞부분\n' + '긴 대본😀\n'.repeat(70000) + '마지막 고유 문장' }], mailConfig: { retained: true } };
  const packed = await codec.pack(state), parts = new Map(packed.parts.map(p => [p.id, p]));
  assert.equal(packed.root.storageVersion, 2);
  assert.ok(packed.parts.every(p => codec.bytes(p.data) <= 180000));
  assert.deepEqual(await codec.unpack(packed.root, id => parts.get(id)), state);
  await assert.rejects(codec.unpack(packed.root, () => ({ data: 'corrupt' })), /원문/);
  await assert.rejects(codec.pack({ data: '가'.repeat(2100000) }), /6 MB/);
});

test('legacy state stays readable; migrated state stays version 2 even after deleting long records', async () => {
  const state = { knowledge: [{ id: 'a', answer: 'abc' }] };
  assert.deepEqual((await codec.pack(state)).root, state);
  assert.equal((await codec.pack(state, true)).root.storageVersion, 2);
  assert.deepEqual(await codec.unpack(state, () => assert.fail()), state);
  assert.equal(codec.stable([{ title: '제목', answer: '본문', meta: { x: 1, y: 2 } }]), codec.stable([{ meta: { y: 2, x: 1 }, answer: '본문', title: '제목' }]));
});

test('all mixed long record characters are covered and front/middle/end independently retrieved', () => {
  const body = '입구 열쇠는 관리실에서 수령합니다.\n' + '일반적인 회의 내용과 메모입니다.\n'.repeat(300) + '냉각장비 점검 담당자는 김보라입니다.\n' + '배송 업무와 별도 보고 기록입니다.\n'.repeat(300) + '출입증 반납함은 서문 옆에 있습니다.';
  const chunks = chunkRecords([{ id: 'long', title: '혼합 대본', body }]);
  const coverage = new Uint8Array(body.length);
  for (const c of chunks) { assert.equal(c.text, body.slice(c.start, c.end)); coverage.fill(1, c.start, c.end); }
  assert.ok(coverage.every(n => n === 1));
  for (const [query, phrase] of [['입구열쇠', '관리실'], ['냉각 장비 담당', '김보라'], ['출입증 반남함', '서문']]) {
    const scores = lexicalScores(chunks, query);
    assert.ok(chunks[scores.indexOf(Math.max(...scores))].text.includes(phrase), query);
  }
});

test('hybrid retrieval includes a semantic-only match independently of keyword matching', () => {
  const chunks = [{ id: 'a', recordId: 'a', title: '안내', text: '물건은 중앙 창구에서 받아갑니다.' }, { id: 'b', recordId: 'b', title: '날씨', text: '내일은 맑음' }];
  const hits = retrieve(chunks, [[1, 0], [0, 1]], ['수령 위치'], [[1, 0]], 1);
  assert.equal(hits[0].id, 'a'); // vectors are synthetic: this checks fusion, not live AI quality.
});

test('add/edit/delete change active revision and obsolete raw text never enters index', () => {
  const state = { knowledge: [{ id: 'a', title: '규칙', answer: '신규 규칙', raw: '폐기 규칙', text: '폐기 규칙' }], accountMeta: [{ password: 'secret' }], vaultSecrets: { x: 'secret' } };
  assert.equal(recordsFromState(state)[0].body, '신규 규칙');
  const first = revisionOf(state);
  state.knowledge.push({ id: 'b', title: '추가', answer: '추가 내용' }); assert.notEqual(first, revisionOf(state));
  const added = revisionOf(state); state.knowledge[0].answer = '수정 내용'; assert.notEqual(added, revisionOf(state));
  state.knowledge[0].deleted = true; assert.equal(recordsFromState(state).length, 1);
  assert.ok(!JSON.stringify(recordsFromState(state)).includes('secret'));
});

test('exact evidence validation, missing evidence, conflict and no-answer contract', () => {
  const sources = [{ recordId: '1', title: '안내 1', start: 0, text: '접수는 월요일입니다.' }, { recordId: '2', title: '안내 2', start: 0, text: '접수는 화요일입니다.' }];
  const draft = { status: 'conflict', format: 'conditions', lines: ['접수일이 월요일/화요일로 다르게 적혀 있어 확인이 필요합니다.'], citations: [{ source: 0, quote: sources[0].text }, { source: 1, quote: sources[1].text }] };
  assert.equal(validateAnswer(draft, sources).citations.length, 2);
  assert.throws(() => validateAnswer({ ...draft, citations: [{ source: 0, quote: '수요일' }] }, sources), /근거/);
  assert.throws(() => validateAnswer({ ...draft, citations: [draft.citations[0]] }, sources), /충돌/);
  assert.equal(validateAnswer({ status: 'not_found' }, sources).lines[0], NOT_FOUND);
});
