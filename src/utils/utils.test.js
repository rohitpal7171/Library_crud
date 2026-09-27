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
  buildReceiptModel,
  receiptTermsList,
  paymentTotal,
  toAmount,
  billingDueAmount,
  numberToWords,
  amountInWords,
  DEFAULT_RECEIPT_SETTINGS,
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
    subcollections: {
      monthlyBilling: [
        { id: 'a', deleted: true },
        { id: 'b', deleted: true },
      ],
    },
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

// Terms are typed as free text, so the receipt has to cope with blank lines and
// bullet characters the user pasted in.
{
  assert.deepEqual(receiptTermsList(''), []);
  assert.deepEqual(receiptTermsList(null), []);
  assert.deepEqual(receiptTermsList('  Only one  '), ['Only one']);
  // Pasted terms often arrive indented — the bullet must still come off.
  assert.deepEqual(receiptTermsList('  - Indented\n\t\u2022 Tabbed'), ['Indented', 'Tabbed']);
  assert.deepEqual(receiptTermsList('• First\n\n- Second\n   \n* Third'), [
    'First',
    'Second',
    'Third',
  ]);
  assert.equal(receiptTermsList(DEFAULT_RECEIPT_SETTINGS.terms).length, 5);
}

// The receipt describes the payment, not the student's standing flags.
{
  assert.equal(paymentTotal(undefined), 0);
  assert.equal(paymentTotal({ basicFee: 1000, seatFee: 200, lockerFee: 50 }), 1250);
  assert.equal(paymentTotal({ basicFee: '1000', seatFee: '', lockerFee: null }), 1000);

  const student = {
    studentName: 'Asha',
    timings: '8',
    seatReserved: true,
    locker: true,
    subscriptionFor: 'Library',
  };

  // Seat and locker were not paid for this month — both must read No even though
  // the student record has both flags on.
  const noFacilities = buildReceiptModel({
    payment: { basicFee: 1000, seatFee: 0, lockerFee: 0, paymentBy: 'UPI', timings: '6' },
    student,
  });
  assert.equal(noFacilities.seatReserved, false);
  assert.equal(noFacilities.lockerReserved, false);
  assert.equal(noFacilities.amountPaid, 1000);
  assert.equal(noFacilities.modeOfPayment, 'UPI');
  assert.equal(noFacilities.timings, '6 hours');
  assert.equal(noFacilities.studentName, 'Asha');

  const withFacilities = buildReceiptModel({
    payment: { basicFee: 1000, seatFee: 200, lockerFee: 50 },
    student,
  });
  assert.equal(withFacilities.seatReserved, true);
  assert.equal(withFacilities.lockerReserved, true);
  assert.equal(withFacilities.amountPaid, 1250);
  // Old payments have no paymentBy, subscriptionFor or timings of their own.
  assert.equal(withFacilities.modeOfPayment, 'Cash');
  assert.equal(withFacilities.subscriptionFor, 'Library');
  assert.equal(withFacilities.timings, '8 hours');
}

// Settings come from the admin doc; anything missing falls back to the defaults.
{
  const bare = buildReceiptModel({ payment: {}, student: {} });
  assert.equal(bare.org.email, DEFAULT_RECEIPT_SETTINGS.email);
  assert.equal(bare.receiptNo, '—');
  assert.equal(bare.timings, '—');
  assert.equal(bare.amountPaid, 0);

  const custom = buildReceiptModel({
    payment: { receiptNo: 'SLCOW_0007' },
    student: {},
    settings: { email: 'new@shivaay.in', terms: 'Single rule' },
  });
  assert.equal(custom.receiptNo, 'SLCOW_0007');
  assert.equal(custom.org.email, 'new@shivaay.in');
  assert.equal(custom.org.address, DEFAULT_RECEIPT_SETTINGS.address);
  assert.deepEqual(custom.terms, ['Single rule']);
}

// formatDate must never hand the PDF an object — Firestore Timestamps included.
{
  const model = buildReceiptModel({
    payment: { paymentDate: { seconds: 1_760_000_000 }, nextPaymentDate: '2026-10-06' },
    student: {},
  });
  assert.equal(typeof model.paidOn, 'string');
  assert.equal(typeof model.nextDueDate, 'string');
  assert.ok(!model.paidOn.includes('object'));
  assert.ok(!model.nextDueDate.includes('object'));
}

// Words are printed next to the figure, so a wrong grouping is a wrong receipt.
{
  assert.equal(numberToWords(0), 'Zero');
  assert.equal(numberToWords(7), 'Seven');
  assert.equal(numberToWords(15), 'Fifteen');
  assert.equal(numberToWords(90), 'Ninety');
  assert.equal(numberToWords(101), 'One Hundred One');
  assert.equal(numberToWords(1000), 'One Thousand');
  assert.equal(numberToWords(1250), 'One Thousand Two Hundred Fifty');
  // Indian grouping, not thousands-of-thousands.
  assert.equal(numberToWords(150000), 'One Lakh Fifty Thousand');
  assert.equal(numberToWords(10000000), 'One Crore');
  // Fees can arrive as strings, and rounding noise must not spill into the words.
  assert.equal(numberToWords('1000'), 'One Thousand');
  assert.equal(numberToWords(1650.5), 'One Thousand Six Hundred Fifty');
  assert.equal(amountInWords(1000), 'One Thousand Rupees Only');
}

// Amount due is what is STILL UNPAID on this payment, and it defaults to 0. It is not the
// renewal amount — the dashboard due lists and the reminder use paymentTotal() for that.
{
  const fees = { basicFee: 1000, seatFee: 200, lockerFee: 50 };
  assert.equal(defaultMonthlyPaymentSchema.amountDue, 0);

  // Paid in full is the default, and every payment recorded before this field existed.
  assert.equal(billingDueAmount(fees), 0);
  assert.equal(billingDueAmount({ ...fees, amountDue: 0 }), 0);
  assert.equal(billingDueAmount(undefined), 0);
  assert.equal(billingDueAmount({ ...fees, amountDue: 400 }), 400);
  assert.equal(billingDueAmount({ ...fees, amountDue: '400' }), 400);
  assert.equal(billingDueAmount({ ...fees, amountDue: '1,400' }), 1400);

  // A receipt for an old payment must not claim money is still owed.
  const old = buildReceiptModel({ payment: fees, student: {} });
  assert.equal(old.amountPaid, 1250);
  assert.equal(old.amountDue, 0);
  assert.equal(old.amountPaidWords, 'One Thousand Two Hundred Fifty Rupees Only');

  // A real part payment still prints its balance.
  const partial = buildReceiptModel({ payment: { ...fees, amountDue: 400 }, student: {} });
  assert.equal(partial.amountDue, 400);

  // The renewal figure is a different question and still answers the old way.
  assert.equal(paymentTotal({ ...fees, amountDue: 400 }), 1250);
}

// Fees are typed into plain text boxes, so "1,000" can reach Firestore as a string.
// Number('1,000') is NaN, and one NaN turns a whole revenue column into NaN.
{
  assert.equal(toAmount('1,000'), 1000);
  assert.equal(toAmount('1,00,000'), 100000);
  assert.equal(toAmount(' 500 '), 500);
  assert.equal(toAmount(500), 500);
  assert.equal(toAmount('500.5'), 500.5);
  // Nothing usable counts as nothing — never NaN, which would poison every total.
  assert.equal(toAmount('abc'), 0);
  assert.equal(toAmount(''), 0);
  assert.equal(toAmount(null), 0);
  assert.equal(toAmount(undefined), 0);

  // A comma in any fee used to make the whole total NaN.
  assert.equal(paymentTotal({ basicFee: '1,000', seatFee: '200', lockerFee: 50 }), 1250);
  assert.ok(!Number.isNaN(paymentTotal({ basicFee: '1,000' })));
  // Missing fields must not produce NaN either.
  assert.equal(paymentTotal({ basicFee: 1000 }), 1000);
  assert.equal(billingDueAmount({ basicFee: '1,000', amountDue: '1,200' }), 1200);
  assert.equal(billingDueAmount({ basicFee: '1,000', amountDue: 'abc' }), 0);

  // The form still refuses a fee that is not a number, but now accepts a comma.
  const off = basicFeeRules(false);
  assert.equal(off.validate('1,000'), true);
  assert.equal(off.validate('abc'), 'Must be greater than 0');
}

console.log('receipt model self-check passed');
