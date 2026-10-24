/* Read-only projection of poursolution/pour-contract.
 * Source: index.html TodayDday.items filters p.deadline === seoulDate(now).
 * Its ddayInfo(dl) also labels a zero day difference D-Day. No completion,
 * bid, issue, or contractor condition is added here. briefingDate is separate.
 */
(function (root) {
  'use strict';
  function seoulDate(now = new Date()) {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone:'Asia/Seoul', year:'numeric', month:'2-digit', day:'2-digit' }).formatToParts(now);
    const part = type => parts.find(value => value.type === type).value;
    return `${part('year')}-${part('month')}-${part('day')}`;
  }
  function project(value) {
    if (value === null) return [];
    if (!Array.isArray(value)) throw new Error('Unexpected project data');
    return value.filter(row => row !== null).map(row => {
      if (!row || typeof row !== 'object' || Array.isArray(row)) throw new Error('Unexpected project row');
      // Drop every field that the two lists do not need. Never persist source data.
      return { name:row.name, briefingDate:row.briefingDate, deadline:row.deadline };
    });
  }
  function lists(rows, now = new Date()) {
    const today = seoulDate(now);
    const names = field => rows.filter(row => row[field] === today).map(row => {
      if (typeof row.name !== 'string' || !row.name.trim()) throw new Error('Missing apartment name');
      return row.name;
    });
    return { today, briefing:names('briefingDate'), dday:names('deadline') };
  }
  const api = { seoulDate, project, lists };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CONTRACT_TODAY_MODEL = api;
})(typeof window !== 'undefined' ? window : globalThis);
