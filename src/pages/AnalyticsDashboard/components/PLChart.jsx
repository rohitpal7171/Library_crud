import { BarChart } from '@mui/x-charts/BarChart';
import { getLastNMonths, getRevenueByMonth, getExpensesByMonth, formatCurrency } from '../analyticsHelpers';

const chartSx = {
  '& .MuiChartsAxis-line': { stroke: '#e2e8f0' },
  '& .MuiChartsAxis-tick': { stroke: '#e2e8f0' },
  '& .MuiChartsGrid-line': { stroke: '#f1f5f9', strokeDasharray: '4 3' },
  '& .MuiChartsLegend-label': { fontSize: '12px !important', fill: '#64748b !important' },
};

export default function PLChart({ allBillingDocs, expenses }) {
  const months      = getLastNMonths(12);
  const revenueMap  = getRevenueByMonth(allBillingDocs);
  const expensesMap = getExpensesByMonth(expenses);

  const revenueData  = months.map(m => revenueMap[m]  || 0);
  const expensesData = months.map(m => expensesMap[m] || 0);
  const profitData   = months.map((_, i) => revenueData[i] - expensesData[i]);

  const totalRevenue  = revenueData.reduce((s, v) => s + v, 0);
  const totalExpenses = expensesData.reduce((s, v) => s + v, 0);
  const totalProfit   = totalRevenue - totalExpenses;

  const fmt = v => `₹${Number(v || 0).toLocaleString('en-IN')}`;

  const pills = [
    { label: 'Total Revenue',  value: formatCurrency(totalRevenue),  valueColor: 'text-emerald-600', bg: 'bg-emerald-50',  border: 'border-emerald-300' },
    { label: 'Total Expenses', value: formatCurrency(totalExpenses), valueColor: 'text-rose-600',    bg: 'bg-rose-50',     border: 'border-rose-300' },
    { label: 'Net P&L',        value: formatCurrency(totalProfit),
      valueColor: totalProfit >= 0 ? 'text-blue-600' : 'text-red-600',
      bg:    totalProfit >= 0 ? 'bg-blue-50'   : 'bg-red-50',
      border: totalProfit >= 0 ? 'border-blue-300' : 'border-red-300' },
  ];

  return (
    <div className="w-full mb-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-1.5 h-7 rounded-full bg-emerald-500 shrink-0" />
        <h2 className="text-base font-black text-slate-700 uppercase tracking-[0.08em] whitespace-nowrap">Revenue vs Expenses</h2>
        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full shrink-0">Last 12 months</span>
        <div className="flex-1 h-[2px] bg-slate-200 rounded-full" />
      </div>

      <div className="w-full bg-white rounded-xl shadow-xl p-5">
        <div className="flex flex-wrap gap-3 mb-4">
          {pills.map(p => (
            <div key={p.label} className={`${p.bg} border-2 ${p.border} rounded-xl px-4 py-3 flex flex-col gap-1 min-w-[130px]`}>
              <span className={`text-2xl font-black tabular-nums leading-none ${p.valueColor}`}>{p.value}</span>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{p.label}</span>
            </div>
          ))}
        </div>

        <BarChart
          xAxis={[{
            scaleType: 'band',
            data: months,
            tickLabelStyle: { fontSize: 11, fill: '#94a3b8' },
          }]}
          yAxis={[{
            tickLabelStyle: { fontSize: 11, fill: '#94a3b8' },
          }]}
          series={[
            { data: revenueData,  label: 'Revenue',  color: '#10b981', valueFormatter: fmt },
            { data: expensesData, label: 'Expenses', color: '#f43f5e', valueFormatter: fmt },
            { data: profitData,   label: 'Net',      color: '#3b82f6', valueFormatter: fmt },
          ]}
          height={300}
          margin={{ bottom: 40, left: 64, right: 16, top: 8 }}
          grid={{ horizontal: true }}
          borderRadius={6}
          sx={chartSx}
          slotProps={{
            legend: {
              direction: 'row',
              position: { vertical: 'top', horizontal: 'right' },
              itemMarkWidth: 10,
              itemMarkHeight: 10,
              labelStyle: { fontSize: 12 },
            },
          }}
        />
      </div>
    </div>
  );
}
