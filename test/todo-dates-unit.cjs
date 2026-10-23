const assert = require('node:assert/strict');
const { parseTodoDate } = require('../todo-dates.js');
const now = new Date(2026, 9, 23, 23, 59);
for (const [text, expected] of [
  ['오늘OO 해야함', '2026-10-23'], ['내일 00보내기', '2026-10-24'],
  ['10.30까지 뭐하기', '2026-10-30'], ['10월 30일까지 발송', '2026-10-30'],
  ['2027-01-02 발송', '2027-01-02'], ['2.30까지 발송', ''],
  ['13.01 발송', ''], ['자료 보내기', '']
]) assert.equal(parseTodoDate(text, now), expected, text);
assert.equal(parseTodoDate('내일 보내기', new Date(2026, 11, 31)), '2027-01-01');
assert.equal(parseTodoDate('2028.2.29 발송', now), '2028-02-29');
assert.equal(parseTodoDate('2026.2.29 발송', now), '');
console.log('Date parsing: 11 cases passed');
