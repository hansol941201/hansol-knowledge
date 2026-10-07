// Read-only projection of CRM MOU meeting schedules. No customer records are changed.
(function (root) {
  'use strict';
  function dateKey(value) {
    const match = String(value || '').match(/(?:^|\D)(\d{2}|\d{4})[.\-](\d{1,2})[.\-](\d{1,2})(?:\D|$)/);
    if (!match) return '';
    let year = Number(match[1]); if (year < 100) year += 2000;
    const month = Number(match[2]), day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return '';
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  function seoulToday() {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type).value).join('-');
  }
  function project(companies, today = seoulToday()) {
    const rows = new Map();
    for (const co of Array.isArray(companies) ? companies : []) {
      if (!co || !co.id || !co.name || co.deletedAt || co.deleted || co.agreementInvalidated?.at || co.agreementStatus === 'terminated') continue;
      const pd = co.partnerDashboard || {}, nm = pd.newMou || {}, corrections = pd.stageCorrections || {};
      for (const [prefix, label] of [['m1', '1차 미팅'], ['m2', '2차 미팅']]) {
        const correction = corrections[`${prefix}Scheduled`];
        let date = '', time = '';
        if (correction) {
          // The CRM's own scheduled-row correction is the final source of truth.
          if (correction.status !== 'scheduled') continue;
          date = dateKey(correction.dateText); time = correction.timeText || '';
        } else {
          const done = corrections[`${prefix}Done`];
          if (done) {
            if (done.status !== 'scheduled') continue;
            date = dateKey(done.dateText); time = done.timeText || '';
          } else {
            const legacyDate = dateKey(nm[`${prefix}Label`]);
            if (nm[`${prefix}Done`] || nm[`${prefix}Skipped`] || (legacyDate && legacyDate <= today)) continue;
            date = dateKey(nm[`${prefix}ScheduledLabel`] || nm[`${prefix}Scheduled`]) || legacyDate;
            time = nm[`${prefix}ScheduledTime`] || '';
          }
        }
        if (!date) continue;
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) time = '';
        const id = `crm-meeting:${encodeURIComponent(co.id)}:${prefix}`;
        rows.set(id, { id, type: 'schedule', source: 'crm-meeting', title: `${co.name} · ${label}`, date, time, memo: '고객관리 MOU 일정 · 고객관리에서 수정' });
      }
    }
    return [...rows.values()].sort((a, b) => `${a.date} ${a.time || '99:99'}`.localeCompare(`${b.date} ${b.time || '99:99'}`));
  }
  const api = { dateKey, project };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CRM_MEETING_MODEL = api;
})(typeof window === 'object' ? window : globalThis);
