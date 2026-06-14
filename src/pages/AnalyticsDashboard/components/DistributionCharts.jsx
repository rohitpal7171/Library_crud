import { PieChart } from '@mui/x-charts/PieChart';
import { groupByCount, groupExpensesByType } from '../analyticsHelpers';

const COLORS = ['#3b82f6','#10b981','#f97316','#8b5cf6','#06b6d4','#f43f5e','#eab308','#6366f1','#14b8a6','#ec4899'];

function ChartCard({ title, subtitle, children, empty }) {
  return (
    <div className="bg-white rounded-xl shadow-xl p-5 flex flex-col">
      <p className="text-sm font-black text-slate-800">{title}</p>
      {subtitle && <p className="text-xs font-medium text-slate-400 mt-0.5">{subtitle}</p>}
      <div className="h-px bg-slate-100 mt-3 mb-2" />
      {empty
        ? <div className="flex-1 flex items-center justify-center py-10">
            <p className="text-sm text-slate-300 font-semibold">No data yet</p>
          </div>
        : children
      }
    </div>
  );
}

function Donut({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex flex-col items-center">
      <PieChart
        series={[{
          data: data.map((d, i) => ({
            id: i,
            value: d.value,
            label: d.label,
            color: COLORS[i % COLORS.length],
          })),
          arcLabel: item => total > 0 ? `${Math.round((item.value / total) * 100)}%` : '',
          arcLabelMinAngle: 18,
          innerRadius: 46,
          outerRadius: 82,
          paddingAngle: 2,
          cornerRadius: 4,
        }]}
        height={190}
        margin={{ top: 8, bottom: 8, left: 8, right: 8 }}
        legend={{ hidden: true }}
        sx={{
          '& .MuiChartsArcLabel-root': {
            fontSize: '11px !important',
            fontWeight: '800 !important',
            fill: '#fff !important',
          },
        }}
      />

      {/* Custom legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-1 px-2">
        {data.map((d, i) => {
          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
          return (
            <div key={d.label} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-xs font-semibold text-slate-600">{d.label}</span>
              <span className="text-xs font-bold text-slate-400">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DistributionCharts({ students, allBillingDocs, expenses }) {
  const expenseByType    = groupExpensesByType(expenses);
  const paymentMethods   = groupByCount(allBillingDocs, 'paymentBy');
  const genderCounts = groupByCount(students, 'gender');

  const charts = [
    { title: 'Expense Categories',  subtitle: 'Where money is spent',    data: expenseByType },
    { title: 'Payment Methods',     subtitle: 'Cash, UPI, etc.',          data: paymentMethods },
    { title: 'Gender Distribution', subtitle: 'Student gender breakdown', data: genderCounts },
  ];

  return (
    <div className="w-full mb-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-1.5 h-7 rounded-full bg-violet-500 shrink-0" />
        <h2 className="text-base font-black text-slate-700 uppercase tracking-[0.08em] whitespace-nowrap">Distributions</h2>
        <div className="flex-1 h-[2px] bg-slate-200 rounded-full" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {charts.map(c => (
          <ChartCard key={c.title} title={c.title} subtitle={c.subtitle} empty={!c.data?.length}>
            <Donut data={c.data} />
          </ChartCard>
        ))}
      </div>
    </div>
  );
}
