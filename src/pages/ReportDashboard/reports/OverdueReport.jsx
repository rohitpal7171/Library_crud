import { useMemo } from 'react';
import dayjs from 'dayjs';
import { formatCurrency, tsToDate } from '../reportHelpers';
import ExportButtons from '../components/ExportButtons';
import { Phone } from '@mui/icons-material';
import { formatDate } from '../../../utils/utils';

export default function OverdueReport({ students }) {
  const today = dayjs();

  const overdueRows = useMemo(() => {
    const rows = [];
    students.forEach((student) => {
      const bills = student?.subcollections?.monthlyBilling || [];
      if (bills.length === 0) return;
      const sorted = [...bills].sort(
        (a, b) => (b.paymentDate?.seconds ?? 0) - (a.paymentDate?.seconds ?? 0)
      );
      const latest = sorted[0];
      if (!latest?.nextPaymentDate) return;
      const due = dayjs(tsToDate(latest.nextPaymentDate));
      const daysOverdue = today.diff(due, 'day');
      if (daysOverdue <= 0) return;

      const lastTotal =
        Number(latest.basicFee || 0) +
        Number(latest.seatFee || 0) +
        Number(latest.lockerFee || 0);

      rows.push({
        studentName: student.studentName,
        humanId: student.humanId,
        phoneNumber: student.phoneNumber || '-',
        lastPaymentDate: latest.paymentDate ? formatDate(tsToDate(latest.paymentDate)) : '-',
        nextPaymentDate: formatDate(tsToDate(latest.nextPaymentDate)),
        daysOverdue,
        lastAmount: lastTotal,
        rawDue: due.valueOf(),
      });
    });
    return rows.sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [students, today]);

  const csvColumns = [
    { key: 'studentName', label: 'Student' },
    { key: 'humanId', label: 'ID' },
    { key: 'phoneNumber', label: 'Phone' },
    { key: 'lastPaymentDate', label: 'Last Payment' },
    { key: 'nextPaymentDate', label: 'Due Date' },
    { key: 'daysOverdue', label: 'Days Overdue' },
    { key: 'lastAmount', label: 'Last Amt (₹)' },
  ];

  const urgencyColor = (days) => {
    if (days > 30) return 'bg-red-100 text-red-700';
    if (days > 14) return 'bg-amber-100 text-amber-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  return (
    <div className="space-y-5">
      {/* Header actions */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center gap-3">
        <div className="text-sm text-slate-500">
          Showing all students with overdue payments — sorted by most overdue first
        </div>
        <ExportButtons
          rows={overdueRows}
          columns={csvColumns}
          filename="Overdue_Report"
          title="Overdue Payments Report"
          subtitle={`${overdueRows.length} students overdue`}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-md">
          <div className="text-xs font-medium text-white/75 uppercase tracking-wide">Overdue Students</div>
          <div className="text-3xl font-bold mt-1">{overdueRows.length}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Critical (&gt; 30 days)</div>
          <div className="text-3xl font-bold mt-1 text-red-600">
            {overdueRows.filter((r) => r.daysOverdue > 30).length}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Avg Days Overdue</div>
          <div className="text-3xl font-bold mt-1 text-slate-800">
            {overdueRows.length
              ? Math.round(overdueRows.reduce((s, r) => s + r.daysOverdue, 0) / overdueRows.length)
              : 0}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <span className="text-sm font-semibold text-slate-700">Overdue Students ({overdueRows.length})</span>
        </div>
        <div className="overflow-auto">
          {overdueRows.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-4xl mb-3">✅</div>
              <div className="text-slate-500 font-medium">All payments are up to date!</div>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                  {['Student', 'Phone', 'Last Payment', 'Due Date', 'Days Overdue', 'Last Amt'].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {overdueRows.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{row.studentName}</div>
                      <div className="text-xs text-slate-400">{row.humanId}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-slate-600">
                        <Phone sx={{ fontSize: 13 }} />
                        <span className="text-xs">{row.phoneNumber}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{row.lastPaymentDate}</td>
                    <td className="px-4 py-3 text-red-600 font-medium whitespace-nowrap">{row.nextPaymentDate}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${urgencyColor(row.daysOverdue)}`}>
                        {row.daysOverdue} days
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{formatCurrency(row.lastAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
