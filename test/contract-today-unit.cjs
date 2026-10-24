const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const model = require('../contract-today-model.js');
const at = new Date('2026-10-23T15:00:00Z'); // Seoul midnight October 24.
const records = [
  { name:'현설만', briefingDate:'2026-10-24', deadline:'2026-10-25' },
  { name:'D-DAY만', briefingDate:'2026-10-23', deadline:'2026-10-24' },
  { name:'양쪽', briefingDate:'2026-10-24', deadline:'2026-10-24', isFailedBid:true, completed:true },
  { name:'다른 연도', briefingDate:'2025-10-24', deadline:'2025-10-24' },
  { name:'미정', briefingDate:null, deadline:null }
];
assert.equal(model.seoulDate(new Date('2026-10-23T14:59:59Z')), '2026-10-23');
assert.equal(model.seoulDate(at), '2026-10-24');
assert.equal(model.seoulDate(new Date('2026-12-31T15:00:00Z')), '2027-01-01');
const result = model.lists(model.project(records), at);
assert.deepEqual(result.briefing, ['현설만','양쪽']);
assert.deepEqual(result.dday, ['D-DAY만','양쪽']);
assert.deepEqual(model.lists(model.project(null), at).dday, []);
assert.throws(() => model.project({ unexpected:true }));
assert.throws(() => model.lists(model.project([{ deadline:'2026-10-24' }]), at));
assert.deepEqual(Object.keys(model.project(records)[2]), ['name','briefingDate','deadline']);
if (process.argv[2]) {
  const original = fs.readFileSync(process.argv[2], 'utf8');
  const end = original.indexOf('root.TodayDday=api');
  const start = original.lastIndexOf('(function', end);
  const script = original.slice(start, original.indexOf('</script>', end));
  const context = { module:{ exports:{} }, Intl, Date };
  vm.runInNewContext(script, context);
  const names = Array.from(context.module.exports.items(records, at), item => item.name);
  assert.deepEqual(result.dday, names, 'Must match actual source TodayDday.items');
}
console.log('Contract dates: Seoul midnight/year, separate lists, both conditions, source D-DAY parity passed.');
