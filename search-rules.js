/* ==========================================================================
   검색 규칙 — 통합검색과 실시간 미리보기가 함께 쓴다.
   유사어를 늘리거나 고치려면 아래 SEARCH_SYNONYMS 만 손보면 된다.
   (화면에는 원본만 보여 주고, 여기서 만든 정규화 문자열은 비교용으로만 쓴다)
   ========================================================================== */

/* 같은 뜻으로 묶어 둘 표현들. 한 줄이 한 묶음이고, 그 안에서는 서로 바꿔 검색된다. */
const SEARCH_SYNONYMS = [
  ['자재', '재료', '제품', '품목'],
  ['시공사', '업체', '건설사', '협력업체'],
  ['아파트', '공동주택', '단지', '현장'],
  ['연락처', '전화번호', '전화', '번호'],
  ['매출', '구매액', '거래액'],
  ['실적', '시공실적', '공사실적'],
  ['협약', 'mou', '협력'],
  ['방수', '우레탄방수', '도막방수'],
  ['재도장', '도장', '페인트'],
  ['보수보강', '보수', '보강'],
  ['들어가는', '사용하는', '사용되는', '필요한', '사용', '들어가']
];

/* 토큰 끝에 붙는 조사. 긴 것부터 확인해서 하나만 떼어 낸다. */
const SEARCH_PARTICLES = ['에서', '으로', '이나', '에게', '은', '는', '이', '가', '을', '를', '의', '에', '로', '과', '와', '도'];

/* 유사어 묶음을 단어 → 묶음 전체로 펼쳐 두고 쓴다. */
const SEARCH_SYNONYM_MAP = (() => {
  const map = new Map();
  for (const group of SEARCH_SYNONYMS) {
    for (const word of group) {
      const key = word.toLowerCase();
      const set = map.get(key) || new Set();
      group.forEach(other => set.add(other.toLowerCase()));
      map.set(key, set);
    }
  }
  return map;
})();

/* 괄호·특수문자를 없애고 공백을 하나로 정리한다. 한글·숫자·영문은 그대로 둔다. */
function searchNormalize(text) {
  return String(text === undefined || text === null ? '' : text)
    .normalize('NFC')                                   // 자모가 분리돼 저장된 글자도 정상 한글로
    .toLowerCase()
    .replace(/[()[\]{}<>「」『』"'`]/g, ' ')             // 괄호는 지우되 안의 내용은 남긴다
    .replace(/[,./\\|·•~!?@#$%^&*_+=:;]/g, ' ')
    .replace(/[-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
/* 띄어쓰기를 무시하고 비교할 때 쓰는 문자열 */
function searchCompact(text) { return searchNormalize(text).replace(/\s+/g, ''); }

/* 토큰 끝에 붙은 조사만 떼어 낸다. 원래 토큰은 지우지 않고 "또 하나의 후보"로만 쓴다. */
function stripParticle(token) {
  for (const particle of SEARCH_PARTICLES) {
    if (token.length > particle.length + 1 && token.endsWith(particle)) return token.slice(0, -particle.length);
  }
  return token;
}
function searchTokens(text) {
  return searchNormalize(text).split(' ').filter(token => token.length > 0);
}
/* 한 토큰이 뜻할 수 있는 표현들 — 자기 자신, 조사를 뗀 형태, 그리고 각각의 유사어 */
function tokenVariants(token) {
  const set = new Set();
  for (const base of new Set([token, stripParticle(token)])) {
    if (!base) continue;
    set.add(base);
    const found = SEARCH_SYNONYM_MAP.get(base);
    if (found) found.forEach(word => set.add(word));
  }
  return [...set];
}

/* 띄어쓰기 없이 붙여 쓴 검색어를 아는 단어 단위로 잘라 본다.
   예) "에폭시자재종류" → 에폭시 · 자재 · 종류 */
const SEARCH_COMMON_WORDS = ['종류', '목록', '현황', '정보', '자료', '담당', '방법', '기준', '비용', '단가', '일정', '주소', '명단', '업체', '연락처'];
const SEARCH_VOCAB = new Set([...SEARCH_SYNONYMS.flat().map(word => word.toLowerCase()), ...SEARCH_COMMON_WORDS]);
function segmentCompact(compact, extraWords = []) {
  const vocab = new Set(SEARCH_VOCAB);
  for (const word of extraWords) {
    const clean = String(word || '').replace(/\s+/g, '');
    if (clean.length >= 2) vocab.add(clean);
  }
  const out = [];
  let buffer = '';
  let at = 0;
  while (at < compact.length) {
    let hit = '';
    for (let size = Math.min(10, compact.length - at); size >= 2; size -= 1) {
      const piece = compact.substr(at, size);
      if (vocab.has(piece)) { hit = piece; break; }
    }
    if (hit) {
      if (buffer.length >= 2) out.push(buffer);
      buffer = '';
      out.push(hit);
      at += hit.length;
    } else { buffer += compact[at]; at += 1; }
  }
  if (buffer.length >= 2) out.push(buffer);
  return out;
}

/* 한 글자 차이까지만 본다(그 이상이면 바로 포기해서 빠르다). */
function nearlySame(a, b) {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0; let j = 0; let diff = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i += 1; j += 1; continue; }
    diff += 1;
    if (diff > 1) return false;
    if (a.length > b.length) i += 1;
    else if (a.length < b.length) j += 1;
    else { i += 1; j += 1; }
  }
  return diff + (a.length - i) + (b.length - j) <= 1;
}
/* 긴 글 안에 "거의 같은" 조각이 있는지 — 오타 한 글자를 봐 준다. */
function containsNearly(haystack, needle, min = 3) {
  if (needle.length < min) return false;
  if (haystack.includes(needle)) return true;
  for (let at = 0; at + needle.length - 1 <= haystack.length; at += 1) {
    for (const size of [needle.length, needle.length - 1, needle.length + 1]) {
      const piece = haystack.substr(at, size);
      if (piece.length >= min && nearlySame(piece, needle)) return true;
    }
  }
  return false;
}

/* 자료 하나의 검색용 묶음 — 원문은 그대로 두고 비교용 문자열만 따로 만든다. */
function buildSearchDoc({ title = '', body = '', keywords = '', extra = '' }) {
  const titleNorm = searchNormalize(title);
  const bodyNorm = searchNormalize(`${body} ${extra}`);
  const keywordNorm = searchNormalize(keywords);
  return {
    titleNorm,
    titleCompact: titleNorm.replace(/\s+/g, ''),
    titleTokens: searchTokens(title),
    bodyCompact: bodyNorm.replace(/\s+/g, ''),
    keywordCompact: keywordNorm.replace(/\s+/g, ''),
    allCompact: `${titleNorm} ${keywordNorm} ${bodyNorm}`.replace(/\s+/g, '')
  };
}

/* 검색어 한 번 해석해서 여러 자료에 재사용한다. */
function buildSearchQuery(text) {
  const norm = searchNormalize(text);
  const tokens = searchTokens(text);
  const compact = norm.replace(/\s+/g, '');
  return {
    raw: String(text || '').trim(),
    norm,
    compact,
    tokens,
    variants: tokens.map(tokenVariants),
    single: tokens.length === 1,                          // 붙여 쓴 한 덩어리인지
    typoAllowed: compact.length >= 3                      // 2글자 이하는 오타 검색을 하지 않는다
  };
}

/* 조각 하나가 자료 안에 있는지 — 그대로 / 유사어 / 한 글자 오타 순으로 본다. */
function matchPart(haystack, variants, allowTypo) {
  const direct = variants[0];
  if (haystack.includes(direct)) return { how: 'direct', word: direct };
  for (const word of variants.slice(1)) {
    if (haystack.includes(word)) return { how: 'synonym', word };
  }
  if (allowTypo && containsNearly(haystack, direct, 2)) return { how: 'typo', word: direct };
  return null;
}

/* 토큰 묶음이 자료 안에 얼마나 들어 있는지 */
function matchAll(haystack, tokens, variants, allowTypo) {
  const words = [];
  let hits = 0;
  let synonym = 0;
  let typo = 0;
  tokens.forEach((token, at) => {
    const found = matchPart(haystack, variants[at] || [token], allowTypo);
    if (!found) return;
    hits += 1;
    words.push(found.word);
    if (found.how === 'synonym') synonym += 1;
    if (found.how === 'typo') typo += 1;
  });
  return { hits, total: tokens.length, words, synonym, typo, all: tokens.length > 0 && hits === tokens.length };
}

/* 점수와 "왜 걸렸는지" 를 함께 돌려준다. 큰 점수가 위로 간다. */
function matchSearchDoc(doc, query) {
  if (!query.compact) return null;
  const q = query.compact;
  const join = (list) => [...new Set(list)].join('·');

  if (doc.titleNorm === query.norm) return { points: 1000, reason: '제목이 검색어와 같음' };
  if (doc.titleCompact === q) return { points: 900, reason: '제목이 검색어와 같음' };
  if (doc.titleCompact.includes(q)) return { points: 800, reason: `제목에 ‘${query.raw}’ 포함` };

  // 1) 띄어 쓴 검색어 그대로
  let tokens = query.tokens;
  let variants = query.variants;
  let segmented = false;
  let title = matchAll(doc.titleCompact, tokens, variants, false);

  // 2) 붙여 쓴 한 덩어리면 아는 단어 단위로 잘라 다시 본다
  if (!title.all && query.single) {
    const parts = segmentCompact(q, doc.titleTokens);
    if (parts.length > 1) {
      tokens = parts;
      variants = parts.map(tokenVariants);
      segmented = true;
      title = matchAll(doc.titleCompact, tokens, variants, query.typoAllowed);
    }
  }

  if (title.all) {
    if (title.typo) return { points: 560, reason: `비슷한 제목 ‘${join(title.words)}’` };
    if (title.synonym) return { points: 600, reason: `관련 표현 ‘${join(title.words)}’ 일치` };
    return { points: segmented ? 680 : 700, reason: `제목에서 ‘${join(title.words)}’ 일치` };
  }

  // 제목에서 일부만 맞아도, 내용에서만 맞은 자료보다는 위에 둔다(‘에폭시자재종류’ 같은 검색).
  if (title.hits >= 2 && title.hits / title.total >= 0.6) {
    return { points: 450 + Math.round((title.hits / title.total) * 100), reason: `제목에서 ‘${join(title.words)}’ 일치` };
  }

  if (doc.keywordCompact && doc.keywordCompact.includes(q)) return { points: 500, reason: '등록한 검색어와 일치' };

  const body = matchAll(doc.allCompact, tokens, variants, false);
  if (body.all) {
    return { points: body.synonym ? 380 : 400, reason: `내용에서 ‘${join(body.words)}’ 일치` };
  }
  if (body.hits > 0) {
    const ratio = body.hits / body.total;                  // 일부만 맞으면 비율만큼 낮춘다
    if (ratio >= 0.5) return { points: 200 + Math.round(ratio * 100), reason: `내용에서 ‘${join(body.words)}’ 일치` };
  }

  // 정확히 맞는 게 없을 때만 오타를 봐 준다(제목이 짧으면 제외).
  if (query.typoAllowed && doc.titleCompact.length >= 3 && containsNearly(doc.titleCompact, q)) {
    return { points: 150, reason: '비슷한 제목' };
  }
  return null;
}
