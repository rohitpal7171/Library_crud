// Quick checks for the tricky date and billing logic. Run: npm test
import assert from 'node:assert/strict';
import {
  monthLabelValue,
  getLatestBilling,
  computeNextPaymentDate,
  firebaseTimestampToDate,
  formatCurrency,
  formatDate,
  isDeletedBilling,
  defaultMonthlyPaymentSchema,
  defaultSchemaValues,
  DEFAULT_SUBSCRIPTION_FOR,
  SUBSCRIPTION_FOR,
  basicFeeRules,
} from './utils.js';

// 'MMM YY' labels must sort oldest to newest, even across a year change.
{
  const labels = ['Jan 26', 'Feb 26', 'Mar 26', 'Dec 25', 'Jun 25'];
  const sorted = [...labels].sort((a, b) => monthLabelValue(a) - monthLabelValue(b));
  assert.deepEqual(sorted, ['Jun 25', 'Dec 25', 'Jan 26', 'Feb 26', 'Mar 26']);
  assert.ok(monthLabelValue('Dec 25') < monthLabelValue('Jan 26'));
  assert.equal(monthLabelValue('nonsense'), Number.NEGATIVE_INFINITY);
}

// The newest payment wins, whatever order the list is in.
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

  // If there's no createdAt, fall back to paymentDate.
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

// Jan 31 + 1 month should be Feb 28, not Mar 3.
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

// Bad input should give null, not a broken Date.
{
  assert.equal(firebaseTimestampToDate(null), null);
  assert.equal(firebaseTimestampToDate('not a date'), null);
  assert.equal(firebaseTimestampToDate({ seconds: 0 }).getTime(), 0);
}

console.log('utils self-check passed');

// Adding fees can produce things like 165050.000000003. Never show that.
{
  assert.equal(formatCurrency(165050.000000003), '₹1,65,050');
  assert.equal(formatCurrency(158050.000000003), '₹1,58,050');
  assert.equal(formatCurrency(1234.567), '₹1,234.57');
  assert.equal(formatCurrency(1234.5), '₹1,234.5');
  assert.equal(formatCurrency(6600), '₹6,600');
  assert.equal(formatCurrency(0), '₹0');
  assert.equal(formatCurrency(null), '₹0');
  assert.equal(formatCurrency(undefined), '₹0');
}

// Deleted payments must never count as the newest one.
{
  const withDeleted = {
    subcollections: {
      monthlyBilling: [
        { id: 'live', createdAt: { seconds: 1700000000 }, basicFee: 100 },
        { id: 'wiped', createdAt: { seconds: 1760000000 }, basicFee: 999, deleted: true },
      ],
    },
  };
  assert.equal(getLatestBilling(withDeleted).id, 'live');

  // All deleted = same as no payments, and no crash.
  const allDeleted = {
    subcollections: { monthlyBilling: [{ id: 'a', deleted: true }, { id: 'b', deleted: true }] },
  };
  assert.equal(getLatestBilling(allDeleted), null);

  // Only deleted: true hides a payment. Missing or false stays visible.
  assert.equal(isDeletedBilling({ deleted: true }), true);
  assert.equal(isDeletedBilling({ deleted: false }), false);
  assert.equal(isDeletedBilling({}), false);
  assert.equal(isDeletedBilling(undefined), false);
}

// New payments get the new fields with sensible defaults.
{
  assert.equal(defaultMonthlyPaymentSchema.subscriptionFor, DEFAULT_SUBSCRIPTION_FOR);
  assert.equal(defaultMonthlyPaymentSchema.subscriptionFor, 'Library');
  assert.equal(defaultMonthlyPaymentSchema.timings, '6');
  assert.equal(defaultSchemaValues.subscriptionFor, 'Library');
  assert.deepEqual(SUBSCRIPTION_FOR, ['Library', 'Co-working']);
}

console.log('feature self-check passed');

// formatDate must never return an object — React crashes if you try to show one.
// Old records store dates as Firestore Timestamps, new ones as 'YYYY-MM-DD' text.
{
  const shapes = [
    { seconds: 1760000000, nanoseconds: 0 },
    '2025-10-09',
    new Date(2025, 9, 9),
    1760000000000,
    'not a date',
    null,
    undefined,
    '',
    {},
  ];
  for (const v of shapes) {
    const out = formatDate(v);
    assert.notEqual(typeof out, 'object', `formatDate returned an object for ${JSON.stringify(v)}`);
  }
  // Both date formats should show the same day.
  assert.equal(formatDate({ seconds: 1760000000, nanoseconds: 0 }), formatDate('2025-10-09'));
  assert.equal(formatDate(null), '—');
  assert.equal(formatDate({}), '—');
}

console.log('render-safety self-check passed');

// The "Allow Zero basic fees" rule, using the same function both forms use.
{
  const off = basicFeeRules(false);
  const on = basicFeeRules(true);

  // Unticked: the box must be filled in, and zero is rejected
  assert.equal(off.required, 'Basic fee is required');
  assert.equal(off.validate(0), 'Must be greater than 0');
  assert.equal(off.validate('0'), 'Must be greater than 0');
  assert.equal(off.validate(''), 'Must be greater than 0');
  assert.equal(off.validate(500), true);

  // Ticked: "required" must be off, or the form blocks on an empty box
  assert.equal(on.required, false);
  assert.equal(on.validate(0), true);
  assert.equal(on.validate('0'), true);
  assert.equal(on.validate(''), true);
  assert.equal(on.validate(500), true);
  assert.equal(on.validate('abc'), 'Enter a valid amount');
}

console.log('zero-fee rule self-check passed');
