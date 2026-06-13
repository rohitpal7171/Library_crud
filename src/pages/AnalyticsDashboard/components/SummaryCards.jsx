import ChairIcon from '@mui/icons-material/Chair';
import LockIcon from '@mui/icons-material/Lock';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { formatCurrency } from '../analyticsHelpers';

function StatCard({ icon, iconBg, iconColor, accentColor, value, label, sub, badge }) {
  const Icon = icon;
  return (
    <div className={`bg-white rounded-xl p-3 flex flex-col shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default border-t-[3px] ${accentColor}`}>
      <div className="flex items-start justify-between mb-1">
        <p className="text-4xl font-black text-slate-900 leading-none tabular-nums">{value}</p>
        <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon sx={{ fontSize: 16 }} className={iconColor} />
        </div>
      </div>
      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.15em] mt-1">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      {badge && (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 self-start ${badge.cls}`}>
          {badge.text}
        </span>
      )}
    </div>
  );
}

function GradientCard({ icon, gradient, value, label, sub }) {
  const Icon = icon;
  return (
    <div className={`rounded-xl p-3 flex flex-col shadow-sm hover:-translate-y-0.5 transition-all duration-200 cursor-default ${gradient}`}>
      <div className="flex items-start justify-between mb-1">
        <p className="text-4xl font-black text-white leading-none tabular-nums">{value}</p>
        <div className="w-7 h-7 rounded-md bg-white/20 flex items-center justify-center ring-1 ring-white/30 shrink-0">
          <Icon sx={{ fontSize: 16 }} className="!text-white" />
        </div>
      </div>
      <p className="text-[10px] font-extrabold text-white/70 uppercase tracking-[0.15em] mt-1">{label}</p>
      {sub && <p className="text-xs text-white/60 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function SummaryCards({
  students,
  activeCount,
  overdueCount,
  expectedRevenue,
  thisMonthExpenses,
}) {
  const seatsOccupied = students.filter((s) => s.active && s.seatReserved).length;
  const lockersOccupied = students.filter((s) => s.active && s.locker).length;
  const net = expectedRevenue - thisMonthExpenses;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
      <StatCard
        icon={overdueCount > 0 ? WarningAmberIcon : CheckCircleOutlineIcon}
        iconBg={overdueCount > 0 ? 'bg-red-50' : 'bg-emerald-50'}
        iconColor={overdueCount > 0 ? 'text-red-500' : 'text-emerald-500'}
        accentColor={overdueCount > 0 ? 'border-red-400' : 'border-emerald-400'}
        value={overdueCount}
        label="Overdue Payments"
        badge={
          overdueCount > 0
            ? { text: 'Needs attention', cls: 'bg-red-50 text-red-500' }
            : { text: 'All clear', cls: 'bg-emerald-50 text-emerald-600' }
        }
      />
      <StatCard
        icon={ChairIcon}
        iconBg="bg-blue-50"
        iconColor="text-blue-500"
        accentColor="border-blue-400"
        value={seatsOccupied}
        label="Seats Occupied"
        sub={`${activeCount - seatsOccupied} without reservation`}
      />
      <StatCard
        icon={LockIcon}
        iconBg="bg-violet-50"
        iconColor="text-violet-500"
        accentColor="border-violet-400"
        value={lockersOccupied}
        label="Lockers Occupied"
        sub={`${activeCount - lockersOccupied} without locker`}
      />
      <GradientCard
        icon={TrendingUpIcon}
        gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
        value={formatCurrency(expectedRevenue)}
        label="Projected Revenue"
        sub="Based on active student fees"
      />
      <GradientCard
        icon={ReceiptLongIcon}
        gradient={
          net >= 0
            ? 'bg-gradient-to-br from-blue-500 to-indigo-700'
            : 'bg-gradient-to-br from-rose-500 to-rose-700'
        }
        value={formatCurrency(thisMonthExpenses)}
        label="This Month Expenses"
        sub={
          net >= 0
            ? `Net profit: +${formatCurrency(net)}`
            : `Net loss: −${formatCurrency(Math.abs(net))}`
        }
      />
    </div>
  );
}
