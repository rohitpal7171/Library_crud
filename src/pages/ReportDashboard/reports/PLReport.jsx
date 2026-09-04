import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { BarChart } from '@mui/x-charts/BarChart';
import {
  flattenBillingDocs,
  filterBillingByDateRange,
  filterExpensesByDateRange,
  formatCurrency,
  tsToDate,
} from '../reportHelpers';
import { monthLabelValue } from '../../../utils/utils';
import ExportButtons from '../components/ExportButtons';

export default function PLReport({ students, expenses }) {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [applied, setApplied] = useState({ start: null, end: null });

  const allBilling = useMemo(() => flattenBillingDocs(students), [students]);

  const filteredBilling = useMemo(
    () => filterBillingByDateRange(allBilling, applied.start, applied.end),
    [allBilling, applied]
  );

  const filteredExpenses = useMemo(
    () => filterExpensesByDateRange(expenses, applied.start, applied.end),
    [expenses, applied]
  );

  const monthlyData = useMemo(() => {
    const revenueMap = {};
    filteredBilling.forEach((r) => {
      if (!r.paymentDate) return;
      const key = dayjs(tsToDate(r.paymentDate)).format('MMM YY');
      revenueMap[key] = (revenueMap[key] || 0) +
        Number(r.basicFee || 0) + Number(r.seatFee || 0) + Number(r.lockerFee || 0);
    });

    const expenseMap = {};
    filteredExpenses.forEach((r) => {
      if (!r.expenseDate) return;
      const key = dayjs(r.expenseDate).format('MMM YY');
      expenseMap[key] = (expenseMap[key] || 0) + Number(r.expensePaid || 0);
    });

    const allKeys = [...new Set([...Object.keys(revenueMap), ...Object.keys(expenseMap)])];
    allKeys.sort((a, b) => monthLabelValue(a) - monthLabelValue(b));

    return allKeys.map((month) => {
      const rev = revenueMap[month] || 0;
      const exp = expenseMap[month] || 0;
      return { month, revenue: rev, expenses: exp, net: rev - exp };
    });
  }, [filteredBilling, filteredExpenses]);

  const totals = useMemo(
    () =>
      monthlyData.reduce(
        (acc, r) => { acc.revenue += r.revenue; acc.expenses += r.expenses; return acc; },
        { revenue: 0, expenses: 0 }
      ),
    [monthlyData]
  );
  const netPL = totals.revenue - totals.expenses;

  const csvColumns = [
    { key: 'month', label: 'Month' },
    { key: 'revenue', label: 'Revenue (₹)' },
    { key: 'expenses', label: 'Expenses (₹)' },
    { key: 'net', label: 'Net P&L (₹)' },
  ];

  return (
    <div className="space-y-5">
      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker label="Start Date" value={startDate} onChange={setStartDate} slotProps={{ textField: { size: 'small' } }} />
            <DatePicker label="End Date" value={endDate} onChange={setEndDate} slotProps={{ textField: { size: 'small' } }} />
          </LocalizationProvider>
          <button onClick={() => setApplied({ start: startDate, end: endDate })}
            className="px-5 py-2 bg-[#1a2f5e] hover:bg-[#243870] text-white text-sm font-semibold rounded-lg transition-colors">
            Apply Filter
          </button>
          <button onClick={() => { setStartDate(null); setEndDate(null); setApplied({ start: null, end: null }); }}
            className="px-5 py-2 border border-red-300 text-red-600 hover:bg-red-50 text-sm font-semibold rounded-lg transition-colors">
            Reset
          </button>
          <ExportButtons
            rows={monthlyData}
            columns={csvColumns}
            filename="PL_Report"
            title="P&L Report"
            subtitle={`Net P&L: ${formatCurrency(netPL)}`}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-md">
          <div className="text-xs font-medium text-white/75 uppercase tracking-wide">Total Revenue</div>
          <div className="text-2xl font-bold mt-1">{formatCurrency(totals.revenue)}</div>
        </div>
        <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-5 text-white shadow-md">
          <div className="text-xs font-medium text-white/75 uppercase tracking-wide">Total Expenses</div>
          <div className="text-2xl font-bold mt-1">{formatCurrency(totals.expenses)}</div>
        </div>
        <div className={`bg-gradient-to-br ${netPL >= 0 ? 'from-blue-500 to-indigo-600' : 'from-red-600 to-rose-700'} rounded-2xl p-5 text-white shadow-md`}>
          <div className="text-xs font-medium text-white/75 uppercase tracking-wide">Net P&L</div>
          <div className="text-2xl font-bold mt-1">{formatCurrency(netPL)}</div>
          <div className="text-xs text-white/65 mt-1">{netPL >= 0 ? 'Profitable' : 'Running at loss'}</div>
        </div>
      </div>

      {/* Chart */}
      {monthlyData.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="text-sm font-semibold text-slate-700 mb-3">Monthly Revenue vs Expenses</div>
          <BarChart
            xAxis={[{ scaleType: 'band', data: monthlyData.map((d) => d.month) }]}
            series={[
              { data: monthlyData.map((d) => d.revenue), label: 'Revenue', color: '#10b981' },
              { data: monthlyData.map((d) => d.expenses), label: 'Expenses', color: '#f43f5e' },
            ]}
            height={280}
            margin={{ left: 65, right: 20, top: 20, bottom: 30 }}
          />
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <span className="text-sm font-semibold text-slate-700">Monthly Breakdown</span>
        </div>
        <div className="overflow-auto">
          {monthlyData.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">No data found for selected range</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {['Month', 'Revenue', 'Expenses', 'Net P&L'].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {monthlyData.map((row) => (
                  <tr key={row.month} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-700">{row.month}</td>
                    <td className="px-4 py-3 text-emerald-700 font-medium">{formatCurrency(row.revenue)}</td>
                    <td className="px-4 py-3 text-rose-600 font-medium">{formatCurrency(row.expenses)}</td>
                    <td className={`px-4 py-3 font-bold ${row.net >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                      {row.net >= 0 ? '+' : ''}{formatCurrency(row.net)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                <tr>
                  <td className="px-4 py-3 font-bold text-slate-700">Total</td>
                  <td className="px-4 py-3 font-bold text-emerald-700">{formatCurrency(totals.revenue)}</td>
                  <td className="px-4 py-3 font-bold text-rose-600">{formatCurrency(totals.expenses)}</td>
                  <td className={`px-4 py-3 font-bold ${netPL >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                    {netPL >= 0 ? '+' : ''}{formatCurrency(netPL)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
