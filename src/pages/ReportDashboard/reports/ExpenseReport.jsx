import { useMemo, useState } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';
import { filterExpensesByDateRange, formatCurrency } from '../reportHelpers';
import ExportButtons from '../components/ExportButtons';
import { formatDate } from '../../../utils/utils';
import dayjs from 'dayjs';

const EXPENSE_TYPES = [
  'All', 'Rent', 'Salary', 'Cleaner', 'Water bill',
  'Electricity bill', 'Internet bill', 'Stationery', 'Repairs', 'Miscellaneous',
];

const PIE_COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#84cc16','#f97316'];

export default function ExpenseReport({ expenses }) {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [expenseType, setExpenseType] = useState('All');
  const [applied, setApplied] = useState({ start: null, end: null, type: 'All' });

  const filtered = useMemo(() => {
    let rows = filterExpensesByDateRange(expenses, applied.start, applied.end);
    if (applied.type !== 'All') rows = rows.filter((r) => r.expenseType === applied.type);
    return rows.sort((a, b) => dayjs(b.expenseDate).valueOf() - dayjs(a.expenseDate).valueOf());
  }, [expenses, applied]);

  const total = useMemo(() => filtered.reduce((s, r) => s + Number(r.expensePaid || 0), 0), [filtered]);

  const byType = useMemo(() => {
    const map = {};
    filtered.forEach((r) => {
      const key = r.expenseType === 'Miscellaneous' ? (r.miscellaneous || 'Miscellaneous') : (r.expenseType || 'Other');
      map[key] = (map[key] || 0) + Number(r.expensePaid || 0);
    });
    return Object.entries(map).map(([label, value], i) => ({ id: i, label, value }));
  }, [filtered]);

  const tableRows = filtered.map((r) => ({
    expenseDate: r.expenseDate ? formatDate(r.expenseDate) : '-',
    expenseType: r.expenseType === 'Miscellaneous' ? (r.miscellaneous || 'Miscellaneous') : (r.expenseType || '-'),
    expensePaid: r.expensePaid || 0,
    expensePaymentMethod: r.expensePaymentMethod || '-',
    remarks: r.remarks || '-',
  }));

  const csvColumns = [
    { key: 'expenseDate', label: 'Date' },
    { key: 'expenseType', label: 'Type' },
    { key: 'expensePaid', label: 'Amount (₹)' },
    { key: 'expensePaymentMethod', label: 'Method' },
    { key: 'remarks', label: 'Remarks' },
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
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Expense Type</InputLabel>
            <Select value={expenseType} label="Expense Type" onChange={(e) => setExpenseType(e.target.value)}>
              {EXPENSE_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </FormControl>
          <button onClick={() => setApplied({ start: startDate, end: endDate, type: expenseType })}
            className="px-5 py-2 bg-[#1a2f5e] hover:bg-[#243870] text-white text-sm font-semibold rounded-lg transition-colors">
            Apply Filter
          </button>
          <button onClick={() => { setStartDate(null); setEndDate(null); setExpenseType('All'); setApplied({ start: null, end: null, type: 'All' }); }}
            className="px-5 py-2 border border-red-300 text-red-600 hover:bg-red-50 text-sm font-semibold rounded-lg transition-colors">
            Reset
          </button>
          <ExportButtons
            rows={tableRows}
            columns={csvColumns}
            filename="Expense_Report"
            title="Expense Report"
            subtitle={`Total: ${formatCurrency(total)} | ${filtered.length} records`}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-5 text-white shadow-md">
          <div className="text-xs font-medium text-white/75 uppercase tracking-wide">Total Expenses</div>
          <div className="text-2xl font-bold mt-1">{formatCurrency(total)}</div>
          <div className="text-xs text-white/65 mt-1">{filtered.length} transactions</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Avg per Transaction</div>
          <div className="text-2xl font-bold mt-1 text-slate-800">
            {filtered.length ? formatCurrency(Math.round(total / filtered.length)) : '₹0'}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Expense Categories</div>
          <div className="text-2xl font-bold mt-1 text-slate-800">{byType.length}</div>
        </div>
      </div>

      {/* Chart + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {byType.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="text-sm font-semibold text-slate-700 mb-3">By Category</div>
            <PieChart
              series={[{ data: byType, innerRadius: 50, outerRadius: 90, paddingAngle: 2, colors: PIE_COLORS }]}
              height={220}
              margin={{ top: 0, bottom: 0, left: 10, right: 10 }}
              slotProps={{ legend: { hidden: true } }}
            />
            <div className="mt-3 space-y-1.5">
              {byType.slice(0, 5).map((d, i) => (
                <div key={d.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-slate-600 truncate max-w-[110px]">{d.label}</span>
                  </div>
                  <span className="font-semibold text-slate-700">{formatCurrency(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${byType.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="px-5 py-3 border-b border-slate-100">
            <span className="text-sm font-semibold text-slate-700">Expense Records ({filtered.length})</span>
          </div>
          <div className="overflow-auto max-h-72">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">No expenses found</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0 z-10">
                  <tr>
                    {['Date', 'Type', 'Amount', 'Method', 'Remarks'].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {tableRows.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{row.expenseDate}</td>
                      <td className="px-4 py-2.5"><span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full text-xs font-medium">{row.expenseType}</span></td>
                      <td className="px-4 py-2.5 font-semibold text-slate-800">{formatCurrency(row.expensePaid)}</td>
                      <td className="px-4 py-2.5"><span className="px-2 py-0.5 bg-slate-100 rounded-full text-xs text-slate-600">{row.expensePaymentMethod}</span></td>
                      <td className="px-4 py-2.5 text-slate-500 text-xs max-w-[180px] truncate">{row.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
