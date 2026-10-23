(function (root) {
  function parseTodoDate(text, now = new Date()) {
    const key = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const value = String(text || '').trim();
    const relative = value.match(/^(오늘|내일|모레)/);
    if (relative) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      date.setDate(date.getDate() + { 오늘: 0, 내일: 1, 모레: 2 }[relative[1]]);
      return key(date);
    }
    const match = value.match(/^(?:(\d{4})[.\-/년]\s*)?(\d{1,2})[.\/월-]\s*(\d{1,2})(?:일)?(?=\s|까지|에|$)/);
    if (!match) return '';
    const year = Number(match[1] || now.getFullYear());
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return '';
    return key(date);
  }
  if (typeof module !== 'undefined') module.exports = { parseTodoDate };
  else root.HANSOL_DATES = { parseTodoDate };
})(typeof window !== 'undefined' ? window : globalThis);
