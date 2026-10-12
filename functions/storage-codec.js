/* Shared lossless storage format. No AI secrets or SDKs in this file. */
(function (root) {
  'use strict';
  const MAX_BYTES = 6000000, PART_BYTES = 180000;
  const bytes = value => new TextEncoder().encode(value).length;
  function stable(value) {
    if (value === undefined) return '';
    const sort = data => Array.isArray(data) ? data.map(sort) : data && typeof data === 'object'
      ? Object.fromEntries(Object.keys(data).sort().map(key => [key, sort(data[key])])) : data;
    return JSON.stringify(sort(JSON.parse(JSON.stringify(value))));
  }
  function split(text, limit = PART_BYTES) {
    const out = []; let part = '', size = 0;
    for (const char of text) {
      const n = bytes(char);
      if (size + n > limit) { out.push(part); part = ''; size = 0; }
      part += char; size += n;
    }
    if (part) out.push(part);
    return out;
  }
  async function hash(text) {
    const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('');
  }
  async function pack(state, force = false) {
    const text = JSON.stringify(state), size = bytes(text);
    if (size > MAX_BYTES) throw new Error('전체 동기화 자료가 6 MB 한도를 넘었습니다. JSON 백업 후 자료를 줄여 주세요. 원문은 잘라 저장하지 않습니다.');
    if (!force && size < 600000) return { root: state, parts: [] };
    const parts = await Promise.all(split(text).map(async data => ({ id: await hash(data), data })));
    if (parts.reduce((sum, p) => sum + bytes(JSON.stringify(p)), 0) > 8000000) throw new Error('분할 저장 요청이 8 MB 안전 한도를 넘었습니다.');
    return { root: { storageVersion: 2, shards: parts.map(p => p.id), stateHash: await hash(text), stateBytes: size }, parts };
  }
  async function unpack(root, read) {
    if (!root || root.storageVersion !== 2) return root || {};
    if (!Array.isArray(root.shards) || root.shards.length > 40 || root.shards.some(id => !/^[a-f0-9]{64}$/.test(id))) throw new Error('분할 저장 목록이 올바르지 않습니다.');
    const chunks = await Promise.all(root.shards.map(async id => {
      const part = await read(id);
      if (!part || typeof part.data !== 'string' || await hash(part.data) !== id) throw new Error('저장된 원문 일부를 읽지 못했습니다. 다시 연결해 주세요.');
      return part.data;
    }));
    const text = chunks.join('');
    if (bytes(text) !== root.stateBytes || await hash(text) !== root.stateHash) throw new Error('저장된 원문 검증 실패');
    return JSON.parse(text);
  }
  const api = { MAX_BYTES, PART_BYTES, bytes, stable, split, hash, pack, unpack };
  if (typeof module !== 'undefined') module.exports = api;
  else root.HANSOL_STORAGE_CODEC = api;
})(globalThis);
