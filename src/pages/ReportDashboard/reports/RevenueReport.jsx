import { useMemo, useState } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import {
  flattenBillingDocs,
  filterBillingByDateRange,
  groupAmountByMonth,
  formatCurrency,
  tsToDate,
} from '../reportHelpers';
import ExportButtons from '../components/ExportButtons';
import { formatDate } from '../../../utils/utils';

const PAYMENT_METHODS = ['All', 'Cash', 'UPI', 'Online', 'Cheque', 'Other'];

export default function RevenueReport({ students }) {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('All');
  const [applied, setApplied] = useState({ start: null, end: null, method: 'All' });

  const allBilling = useMemo(() => flattenBillingDocs(students), [students]);

  const filtered = useMemo(() => {
    let rows = filterBillingByDateRange(allBilling, applied.start, applied.end);
    if (applied.method !== 'All') {
      rows = rows.filter((r) => (r.paymentBy || '').toLowerCase() === applied.method.toLowerCase());
    }
    return rows.sort((a, b) => {
      const da = tsToDate(a.paymentDate);
      const db = tsToDate(b.paymentDate);
      return (db?.getTime() ?? 0) - (da?.getTime() ?? 0);
    });
  }, [allBilling, applied]);

  const totals = useMemo(
    () =>
      filtered.reduce(
        (acc, r) => {
          acc.basic += Number(r.basicFee || 0);
          acc.seat += Number(r.seatFee || 0);
          acc.locker += Number(r.lockerFee || 0);
          return acc;
        },
        { basic: 0, seat: 0, locker: 0 }
      ),
    [filtered]
  );
  const grand = totals.basic + totals.seat + totals.locker;

  const chartData = useMemo(
    () =>
      groupAmountByMonth(
        filtered,
        (r) => tsToDate(r.paymentDate),
        (r) => Number(r.basicFee || 0) + Number(r.seatFee || 0) + Number(r.lockerFee || 0)
      ),
    [filtered]
  );

  const tableRows = filtered.map((r) => ({
    studentName: r.studentName,
    humanId: r.humanId,
    paymentDate: r.paymentDate ? formatDate(tsToDate(r.paymentDate)) : '-',
    paymentBy: r.paymentBy || '-',
    basicFee: r.basicFee || 0,
    seatFee: r.seatFee || 0,
    lockerFee: r.lockerFee || 0,
    total: Number(r.basicFee || 0) + Number(r.seatFee || 0) + Number(r.lockerFee || 0),
  }));

  const csvColumns = [
    { key: 'studentName', label: 'Student' },
    { key: 'humanId', label: 'ID' },
    { key: 'paymentDate', label: 'Payment Date' },
    { key: 'paymentBy', label: 'Method' },
    { key: 'basicFee', label: 'Basic Fee' },
    { key: 'seatFee', label: 'Seat Fee' },
    { key: 'lockerFee', label: 'Locker Fee' },
    { key: 'total', label: 'Total' },
  ];

  return (
    <div className="space-y-5">
      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={setStartDate}
              slotProps={{ textField: { size: 'small' } }}
            />
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={setEndDate}
              slotProps={{ textField: { size: 'small' } }}
            />
          </LocalizationProvider>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Payment Method</InputLabel>
            <Select
              value={paymentMethod}
              label="Payment Method"
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              {PAYMENT_METHODS.map((m) => (
                <MenuItem key={m} value={m}>
                  {m}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <button
            onClick={() => setApplied({ start: startDate, end: endDate, method: paymentMethod })}
            className="px-5 py-2 bg-[#1a2f5e] hover:bg-[#243870] text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Apply Filter
          </button>
          <button
            onClick={() => {
              setStartDate(null);
              setEndDate(null);
              setPaymentMethod('All');
              setApplied({ start: null, end: null, method: 'All' });
            }}
            className="px-5 py-2 border border-red-300 text-red-600 hover:bg-red-50 text-sm font-semibold rounded-lg transition-colors"
          >
            Reset
          </button>
          <ExportButtons
            rows={tableRows}
            columns={csvColumns}
            filename="Revenue_Report"
            title="Revenue Report"
            subtitle={`Total: ${formatCurrency(grand)} | ${filtered.length} payments`}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-md">
          <div className="text-xs font-medium text-white/75 uppercase tracking-wide">
            Total Revenue
          </div>
          <div className="text-2xl font-bold mt-1">{formatCurrency(grand)}</div>
          <div className="text-xs text-white/65 mt-1">{filtered.length} payments</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Basic Fees
          </div>
          <div className="text-2xl font-bold mt-1 text-slate-800">
            {formatCurrency(totals.basic)}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Seat Fees
          </div>
          <div className="text-2xl font-bold mt-1 text-slate-800">
            {formatCurrency(totals.seat)}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Locker Fees
          </div>
          <div className="text-2xl font-bold mt-1 text-slate-800">
            {formatCurrency(totals.locker)}
          </div>
        </div>
      </div>

      {/* Chart + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {chartData.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="text-sm font-semibold text-slate-700 mb-3">Revenue by Month</div>
            <BarChart
              xAxis={[{ scaleType: 'band', data: chartData.map((d) => d.label) }]}
              series={[{ data: chartData.map((d) => d.value), color: '#10b981', label: 'Revenue' }]}
              height={240}
              margin={{ left: 60, right: 10, top: 10, bottom: 30 }}
            />
          </div>
        )}

        <div
          className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${chartData.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}`}
        >
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">
              Payment Records ({filtered.length})
            </span>
          </div>
          <div className="overflow-auto max-h-72">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">No payments found</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0 z-10">
                  <tr>
                    {['Student', 'Date', 'Method', 'Basic', 'Seat', 'Locker', 'Total'].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {tableRows.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-2.5 text-slate-800 font-medium whitespace-nowrap">
                        {row.studentName}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">
                        {row.paymentDate}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-full text-xs text-slate-600">
                          {row.paymentBy}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">{formatCurrency(row.basicFee)}</td>
                      <td className="px-4 py-2.5 text-slate-700">{formatCurrency(row.seatFee)}</td>
                      <td className="px-4 py-2.5 text-slate-700">{formatCurrency(row.lockerFee)}</td>
                      <td className="px-4 py-2.5 font-semibold text-slate-800">{formatCurrency(row.total)}</td>
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
