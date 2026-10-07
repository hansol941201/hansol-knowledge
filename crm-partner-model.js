// Minimal read-only contact projection. Local partner edits remain separate.
(function (root) {
  'use strict';
  const text = value => typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
  const key = name => text(name).normalize('NFKC').toLowerCase().replace(/주식회사|\(주\)|㈜|\s/g, '');
  function project(companies) {
    const rows = new Map();
    for (const co of Array.isArray(companies) ? companies : []) {
      if (!co || co.deletedAt || co.deleted || !text(co.name)) continue;
      const pd = co.partnerDashboard || {};
      const item = { name: text(co.name), phone: text(co.phone) || text(co.mobile) || text(pd.phone), email: text(co.email) || text(pd.email), source: 'crm-partner', sourceName: `crm-partner:${text(co.id) || key(co.name)}` };
      const previous = rows.get(key(item.name));
      rows.set(key(item.name), previous ? { ...previous, phone: item.phone || previous.phone, email: item.email || previous.email } : item);
    }
    return [...rows.values()];
  }
  function merge(base, imported) {
    const rows = base.map(item => ({ ...item }));
    for (const item of imported) {
      const index = rows.findIndex(row => key(row.name) === key(item.name));
      if (index < 0) rows.push(item);
      else rows[index] = { ...rows[index], phone: item.phone || rows[index].phone, email: item.email || rows[index].email };
    }
    return rows;
  }
  const api = { project, merge };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CRM_PARTNER_MODEL = api;
})(typeof window !== 'undefined' ? window : globalThis);
