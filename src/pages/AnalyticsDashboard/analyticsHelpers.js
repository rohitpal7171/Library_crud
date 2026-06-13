import dayjs from 'dayjs';

export function tsToDate(ts) {
  if (!ts) return null;
  if (ts?.seconds != null) return new Date(ts.seconds * 1000);
  return new Date(ts);
}

// Returns last N calendar months as 'MMM YY' labels, oldest first
export function getLastNMonths(n = 12) {
  return Array.from({ length: n }, (_, i) =>
    dayjs().subtract(n - 1 - i, 'month').format('MMM YY')
  );
}

// Groups billing docs by paymentDate month → sum of all fees
// Returns { 'Jun 25': 3500, 'Jul 25': 4200, ... }
export function getRevenueByMonth(billingDocs) {
  const map = {};
  billingDocs.forEach(doc => {
    if (!doc.paymentDate) return;
    const key = dayjs(tsToDate(doc.paymentDate)).format('MMM YY');
    const fee = Number(doc.basicFee || 0) + Number(doc.lockerFee || 0) + Number(doc.seatFee || 0);
    map[key] = (map[key] || 0) + fee;
  });
  return map;
}

// Groups expenses by expenseDate (ISO string) month → sum
export function getExpensesByMonth(expenses) {
  const map = {};
  expenses.forEach(exp => {
    if (!exp.expenseDate) return;
    const key = dayjs(exp.expenseDate).format('MMM YY');
    map[key] = (map[key] || 0) + Number(exp.expensePaid || 0);
  });
  return map;
}

// Groups items by a field value → [{label, value}] sorted desc by value
export function groupByCount(items, field) {
  const map = {};
  items.forEach(item => {
    const val = item[field] || 'Unknown';
    map[val] = (map[val] || 0) + 1;
  });
  return Object.entries(map)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

// Groups expenses by type → [{label, value}] sorted desc by value
export function groupExpensesByType(expenses) {
  const map = {};
  expenses.forEach(exp => {
    const type =
      exp.expenseType === 'Miscellaneous'
        ? exp.miscellaneous || 'Miscellaneous'
        : exp.expenseType || 'Unknown';
    map[type] = (map[type] || 0) + Number(exp.expensePaid || 0);
  });
  return Object.entries(map)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

// Attaches the latest billing doc to each student from subcollections
export function getLatestBillingPerStudent(students) {
  return students.map(s => {
    const docs = s.subcollections?.monthlyBilling || [];
    const sorted = [...docs].sort(
      (a, b) => (b.paymentDate?.seconds ?? 0) - (a.paymentDate?.seconds ?? 0)
    );
    return { ...s, latestBilling: sorted[0] || null };
  });
}

// Formats number as Indian currency string: ₹1,00,000
export function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
}

// Returns all-time enrollment grouped by month, chronologically sorted
export function getEnrollmentByMonth(students) {
  const map = {};
  students.forEach(s => {
    if (!s.dateOfJoining) return;
    const key = dayjs(s.dateOfJoining).format('MMM YY');
    map[key] = (map[key] || 0) + 1;
  });
  return Object.entries(map)
    .map(([label, value]) => ({ label, value }))
    .sort(
      (a, b) =>
        dayjs(a.label, 'MMM YY').valueOf() - dayjs(b.label, 'MMM YY').valueOf()
    );
}
