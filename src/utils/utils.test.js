// Self-check for the non-obvious date/billing logic. Run: node src/utils/utils.test.js
import assert from 'node:assert/strict';
import {
  monthLabelValue,
  getLatestBilling,
  computeNextPaymentDate,
  firebaseTimestampToDate,
} from './utils.js';

// monthLabelValue: 'MMM YY' labels must sort chronologically across a year boundary.
// dayjs cannot do this without the customParseFormat plugin, which is not installed.
{
  const labels = ['Jan 26', 'Feb 26', 'Mar 26', 'Dec 25', 'Jun 25'];
  const sorted = [...labels].sort((a, b) => monthLabelValue(a) - monthLabelValue(b));
  assert.deepEqual(sorted, ['Jun 25', 'Dec 25', 'Jan 26', 'Feb 26', 'Mar 26']);
  assert.ok(monthLabelValue('Dec 25') < monthLabelValue('Jan 26'));
  assert.equal(monthLabelValue('nonsense'), Number.NEGATIVE_INFINITY);
}

// getLatestBilling: newest createdAt wins, regardless of array order or date encoding
{
  assert.equal(getLatestBilling(undefined), null);
  assert.equal(getLatestBilling({ subcollections: { monthlyBilling: [] } }), null);

  const student = {
    subcollections: {
      monthlyBilling: [
        { id: 'old', createdAt: { seconds: 1_700_000_000 }, basicFee: 100 },
        { id: 'new', createdAt: { seconds: 1_760_000_000 }, basicFee: 300 },
        { id: 'mid', createdAt: { seconds: 1_730_000_000 }, basicFee: 200 },
      ],
    },
  };
  assert.equal(getLatestBilling(student).id, 'new');

  // Falls back to paymentDate when createdAt is absent (string dates, as written today)
  const legacy = {
    subcollections: {
      monthlyBilling: [
        { id: 'a', paymentDate: '2025-01-15' },
        { id: 'b', paymentDate: '2025-09-01' },
      ],
    },
  };
  assert.equal(getLatestBilling(legacy).id, 'b');
}

// computeNextPaymentDate: month-end clamping must not roll into the next month
{
  assert.equal(
    computeNextPaymentDate(new Date(2025, 0, 31), 'month', 1).getTime(),
    new Date(2025, 1, 28).getTime()
  );
  assert.equal(
    computeNextPaymentDate(new Date(2024, 1, 29), 'year', 1).getTime(),
    new Date(2025, 1, 28).getTime()
  );
  assert.equal(computeNextPaymentDate(null, 'month', 1), null);
  assert.equal(computeNextPaymentDate(new Date(2025, 0, 1), 'month', 0), null);
}

// firebaseTimestampToDate: invalid input must be null, not an Invalid Date that
// callers then try to render
{
  assert.equal(firebaseTimestampToDate(null), null);
  assert.equal(firebaseTimestampToDate('not a date'), null);
  assert.equal(firebaseTimestampToDate({ seconds: 0 }).getTime(), 0);
}

console.log('utils self-check passed');
