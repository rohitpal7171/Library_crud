import { BarChart } from '@mui/x-charts/BarChart';
import { groupByCount } from '../analyticsHelpers';

const barSx = {
  '& .MuiChartsAxis-line': { stroke: '#e2e8f0' },
  '& .MuiChartsAxis-tick': { stroke: '#e2e8f0' },
  '& .MuiChartsGrid-line': { stroke: '#f1f5f9', strokeDasharray: '4 3' },
};

export default function ReferralBreakdown({ students }) {
  const data = groupByCount(
    students.filter(s => s.referredBy?.trim()),
    'referredBy'
  ).slice(0, 12);

  if (!data.length) return null;

  return (
    <div className="w-full mb-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-1.5 h-7 rounded-full bg-teal-500 shrink-0" />
        <h2 className="text-base font-black text-slate-700 uppercase tracking-[0.08em] whitespace-nowrap">Referral Sources</h2>
        <div className="flex-1 h-[2px] bg-slate-200 rounded-full" />
      </div>

      <div className="bg-white rounded-xl shadow-xl p-5" style={{ maxWidth: 640 }}>
        <p className="text-xs font-semibold text-slate-400 mb-4">Who is sending students to the library</p>
        <BarChart
          layout="horizontal"
          yAxis={[{
            scaleType: 'band',
            data: data.map(d => d.label),
            tickLabelStyle: { fontSize: 11, fill: '#94a3b8' },
          }]}
          xAxis={[{
            scaleType: 'linear',
            tickLabelStyle: { fontSize: 11, fill: '#94a3b8' },
          }]}
          series={[{ data: data.map(d => d.value), color: '#14b8a6', valueFormatter: v => String(v) }]}
          height={Math.max(200, data.length * 40)}
          margin={{ left: 120, right: 24, top: 8, bottom: 32 }}
          grid={{ vertical: true }}
          borderRadius={6}
          sx={barSx}
        />
      </div>
    </div>
  );
}
