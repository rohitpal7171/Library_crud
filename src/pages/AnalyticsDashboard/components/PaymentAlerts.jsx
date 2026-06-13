import dayjs from 'dayjs';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { tsToDate } from '../analyticsHelpers';

function DaysLeft({ nextPaymentDate }) {
  const d = tsToDate(nextPaymentDate);
  if (!d) return null;
  const diff = dayjs(d).startOf('day').diff(dayjs().startOf('day'), 'day');
  const urgent = diff <= 14;
  return (
    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
      urgent ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
    }`}>
      {diff}d left
    </span>
  );
}

export default function PaymentAlerts({ dueThisMonth }) {
  if (!dueThisMonth?.length) return null;

  return (
    <div className="w-full mb-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-1.5 h-7 rounded-full bg-amber-400 shrink-0" />
        <h2 className="text-base font-black text-slate-700 uppercase tracking-[0.08em] whitespace-nowrap">Upcoming Payments</h2>
        <span className="bg-amber-100 text-amber-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
          {dueThisMonth.length} due in 8–30 days
        </span>
        <div className="flex-1 h-[2px] bg-slate-200 rounded-full" />
      </div>

      <div className="bg-white rounded-xl shadow-xl overflow-hidden" style={{ maxWidth: 480 }}>
        <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
          {dueThisMonth.map((s, i) => {
            const name = s.studentName || 'Unknown';
            const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            return (
              <div key={s.id || i} className="flex items-center gap-3 px-5 py-3.5 hover:bg-amber-50/50 transition-colors">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700 flex items-center justify-center text-xs font-black shrink-0 ring-1 ring-amber-200">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{name}</p>
                  <p className="text-xs text-slate-400">{s.humanId}</p>
                </div>
                <DaysLeft nextPaymentDate={s.latestBilling?.nextPaymentDate} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
