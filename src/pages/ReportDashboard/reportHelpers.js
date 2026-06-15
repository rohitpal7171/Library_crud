import dayjs from 'dayjs';

export function tsToDate(ts) {
  if (!ts) return null;
  if (ts?.seconds != null) return new Date(ts.seconds * 1000);
  return new Date(ts);
}

export function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
}

export function flattenBillingDocs(students) {
  const rows = [];
  students.forEach((student) => {
    const bills = student?.subcollections?.monthlyBilling || [];
    bills.forEach((bill) => {
      rows.push({
        ...bill,
        studentName: student.studentName,
        humanId: student.humanId,
        studentDocId: student.id,
      });
    });
  });
  return rows;
}

export function filterBillingByDateRange(billingDocs, start, end) {
  if (!start && !end) return billingDocs;
  return billingDocs.filter((doc) => {
    if (!doc.paymentDate) return false;
    const date = dayjs(tsToDate(doc.paymentDate));
    if (start && date.isBefore(dayjs(start).startOf('day'))) return false;
    if (end && date.isAfter(dayjs(end).endOf('day'))) return false;
    return true;
  });
}

export function filterExpensesByDateRange(expenses, start, end) {
  if (!start && !end) return expenses;
  return expenses.filter((exp) => {
    if (!exp.expenseDate) return false;
    const date = dayjs(exp.expenseDate);
    if (start && date.isBefore(dayjs(start).startOf('day'))) return false;
    if (end && date.isAfter(dayjs(end).endOf('day'))) return false;
    return true;
  });
}

export function groupAmountByMonth(docs, getDate, getAmount) {
  const map = {};
  docs.forEach((doc) => {
    const d = getDate(doc);
    if (!d) return;
    const key = dayjs(d).format('MMM YY');
    map[key] = (map[key] || 0) + getAmount(doc);
  });
  return Object.entries(map)
    .sort(([a], [b]) => dayjs(a, 'MMM YY').valueOf() - dayjs(b, 'MMM YY').valueOf())
    .map(([label, value]) => ({ label, value }));
}

export function exportToCSV(rows, columns, filename) {
  const header = columns.map((c) => `"${c.label}"`).join(',');
  const body = rows
    .map((row) => columns.map((c) => `"${row[c.key] ?? ''}"`).join(','))
    .join('\n');
  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
