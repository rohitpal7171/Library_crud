import { useMemo, useState } from 'react';
import { MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import ExportButtons from '../components/ExportButtons';
import { formatDate } from '../../../utils/utils';
import dayjs from 'dayjs';

export default function StudentReport({ students }) {
  const [status, setStatus] = useState('All');
  const [gender, setGender] = useState('All');
  const [hasSeat, setHasSeat] = useState('All');
  const [hasLocker, setHasLocker] = useState('All');
  const [applied, setApplied] = useState({ status: 'All', gender: 'All', hasSeat: 'All', hasLocker: 'All' });

  const filtered = useMemo(() => {
    return students
      .filter((s) => {
        if (applied.status === 'Active' && !s.active) return false;
        if (applied.status === 'Inactive' && s.active) return false;
        if (applied.gender !== 'All' && s.gender !== applied.gender) return false;
        if (applied.hasSeat === 'Yes' && !s.seatReserved) return false;
        if (applied.hasSeat === 'No' && s.seatReserved) return false;
        if (applied.hasLocker === 'Yes' && !s.locker) return false;
        if (applied.hasLocker === 'No' && s.locker) return false;
        return true;
      })
      .sort((a, b) => dayjs(b.dateOfJoining).valueOf() - dayjs(a.dateOfJoining).valueOf());
  }, [students, applied]);

  const stats = useMemo(
    () => ({
      total: filtered.length,
      active: filtered.filter((s) => s.active).length,
      inactive: filtered.filter((s) => !s.active).length,
      withSeat: filtered.filter((s) => s.seatReserved).length,
      withLocker: filtered.filter((s) => s.locker).length,
    }),
    [filtered]
  );

  const tableRows = filtered.map((s) => ({
    studentName: s.studentName || '-',
    humanId: s.humanId || '-',
    gender: s.gender || '-',
    status: s.active ? 'Active' : 'Inactive',
    dateOfJoining: s.dateOfJoining ? formatDate(s.dateOfJoining) : '-',
    timings: s.timings ? `${s.timings}:00` : '-',
    seatNumber: s.seatReserved ? (s.seatNumber || 'Yes') : '-',
    lockerNumber: s.locker ? (s.lockerNumber || 'Yes') : '-',
    phoneNumber: s.phoneNumber || '-',
  }));

  const csvColumns = [
    { key: 'studentName', label: 'Student' },
    { key: 'humanId', label: 'ID' },
    { key: 'gender', label: 'Gender' },
    { key: 'status', label: 'Status' },
    { key: 'dateOfJoining', label: 'Joining Date' },
    { key: 'timings', label: 'Timings' },
    { key: 'seatNumber', label: 'Seat' },
    { key: 'lockerNumber', label: 'Locker' },
    { key: 'phoneNumber', label: 'Phone' },
  ];

  return (
    <div className="space-y-5">
      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-end">
          {[
            { label: 'Status', value: status, set: setStatus, opts: ['All', 'Active', 'Inactive'] },
            { label: 'Gender', value: gender, set: setGender, opts: ['All', 'Male', 'Female'] },
            { label: 'Has Seat', value: hasSeat, set: setHasSeat, opts: ['All', 'Yes', 'No'] },
            { label: 'Has Locker', value: hasLocker, set: setHasLocker, opts: ['All', 'Yes', 'No'] },
          ].map(({ label, value, set, opts }) => (
            <FormControl key={label} size="small" sx={{ minWidth: 130 }}>
              <InputLabel>{label}</InputLabel>
              <Select value={value} label={label} onChange={(e) => set(e.target.value)}>
                {opts.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
              </Select>
            </FormControl>
          ))}
          <button
            onClick={() => setApplied({ status, gender, hasSeat, hasLocker })}
            className="px-5 py-2 bg-[#1a2f5e] hover:bg-[#243870] text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Apply Filter
          </button>
          <button
            onClick={() => {
              setStatus('All'); setGender('All'); setHasSeat('All'); setHasLocker('All');
              setApplied({ status: 'All', gender: 'All', hasSeat: 'All', hasLocker: 'All' });
            }}
            className="px-5 py-2 border border-red-300 text-red-600 hover:bg-red-50 text-sm font-semibold rounded-lg transition-colors"
          >
            Reset
          </button>
          <ExportButtons
            rows={tableRows}
            columns={csvColumns}
            filename="Student_Report"
            title="Student Report"
            subtitle={`${stats.total} students`}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'from-violet-500 to-purple-600', text: 'text-white' },
          { label: 'Active', value: stats.active, bg: 'bg-white border border-slate-200', val: 'text-emerald-600' },
          { label: 'Inactive', value: stats.inactive, bg: 'bg-white border border-slate-200', val: 'text-rose-600' },
          { label: 'With Seat', value: stats.withSeat, bg: 'bg-white border border-slate-200', val: 'text-blue-600' },
          { label: 'With Locker', value: stats.withLocker, bg: 'bg-white border border-slate-200', val: 'text-amber-600' },
        ].map((card) => (
          <div
            key={card.label}
            className={`rounded-2xl p-4 shadow-sm ${card.color ? `bg-gradient-to-br ${card.color}` : card.bg}`}
          >
            <div className={`text-xs font-medium uppercase tracking-wide ${card.color ? 'text-white/75' : 'text-slate-500'}`}>
              {card.label}
            </div>
            <div className={`text-2xl font-bold mt-1 ${card.color ? 'text-white' : card.val}`}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <span className="text-sm font-semibold text-slate-700">Students ({filtered.length})</span>
        </div>
        <div className="overflow-auto max-h-96">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">No students match the selected filters</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                  {['Student', 'Gender', 'Status', 'Joining Date', 'Timing', 'Seat', 'Locker', 'Phone'].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tableRows.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-slate-800">{row.studentName}</div>
                      <div className="text-xs text-slate-400">{row.humanId}</div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{row.gender}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${row.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{row.dateOfJoining}</td>
                    <td className="px-4 py-2.5 text-slate-600">{row.timings}</td>
                    <td className="px-4 py-2.5 text-slate-600">{row.seatNumber}</td>
                    <td className="px-4 py-2.5 text-slate-600">{row.lockerNumber}</td>
                    <td className="px-4 py-2.5 text-slate-500 text-xs">{row.phoneNumber}</td>
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
