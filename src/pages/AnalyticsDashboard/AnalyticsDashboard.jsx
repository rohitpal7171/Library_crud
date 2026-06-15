import { useState, useEffect, useMemo } from 'react';
import { CircularProgress } from '@mui/material';
import { useFirebase } from '../../context/Firebase';
import { useSnackbar } from '../../components/customComponents/CustomNotifications';
import SummaryCards from './components/SummaryCards';
import PaymentAlerts from './components/PaymentAlerts';
import OccupancyMap from './components/OccupancyMap';
import PLChart from './components/PLChart';
import DistributionCharts from './components/DistributionCharts';
import { getLatestBillingPerStudent, tsToDate } from './analyticsHelpers';

export default function AnalyticsDashboard() {
  const firebase = useFirebase();
  const { showSnackbar } = useSnackbar();

  const [students, setStudents]   = useState([]);
  const [expenses, setExpenses]   = useState([]);
  const [loading,  setLoading]    = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [sr, er] = await Promise.all([
          firebase.getCollectionWithSubcollections({
            collectionName: 'students',
            subcollections: ['monthlyBilling'],
            orderField: 'createdAt',
            orderDirection: 'desc',
          }),
          firebase.getOnlyCollectionData({
            collectionName: 'expenses',
            orderField: 'expenseDate',
            orderDirection: 'asc',
          }),
        ]);
        setStudents(sr?.data || []);
        setExpenses(er?.data || []);
      } catch {
        showSnackbar({ message: 'Failed to load analytics data', severity: 'error' });
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const studentsWithBilling = useMemo(() => getLatestBillingPerStudent(students), [students]);
  const activeStudents      = useMemo(() => studentsWithBilling.filter(s => s.active), [studentsWithBilling]);
  const allBillingDocs      = useMemo(() => students.flatMap(s => s.subcollections?.monthlyBilling || []), [students]);

  const now          = new Date();
  const todayStart   = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekEnd      = new Date(todayStart.getTime() + 7  * 86400000);
  const monthEnd     = new Date(todayStart.getTime() + 30 * 86400000);
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const overdueCount = useMemo(() =>
    activeStudents.filter(s => {
      if (!s.latestBilling?.nextPaymentDate) return false;
      const d = tsToDate(s.latestBilling.nextPaymentDate);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate()) < todayStart;
    }).length,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [activeStudents]);

  const dueThisMonth = useMemo(() =>
    activeStudents
      .filter(s => {
        if (!s.latestBilling?.nextPaymentDate) return false;
        const d    = tsToDate(s.latestBilling.nextPaymentDate);
        const dOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        return dOnly > weekEnd && dOnly <= monthEnd;
      })
      .sort((a, b) => {
        const da = tsToDate(a.latestBilling.nextPaymentDate);
        const db = tsToDate(b.latestBilling.nextPaymentDate);
        return da - db;
      }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [activeStudents]);

  const expectedRevenue = useMemo(() =>
    activeStudents.reduce((sum, s) => {
      const b = s.latestBilling;
      return sum + Number(b?.basicFee || 0) + Number(b?.lockerFee || 0) + Number(b?.seatFee || 0);
    }, 0),
  [activeStudents]);

  const thisMonthExpenses = useMemo(() =>
    expenses
      .filter(e => e.expenseDate?.startsWith(thisMonthKey))
      .reduce((sum, e) => sum + Number(e.expensePaid || 0), 0),
  [expenses, thisMonthKey]);

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-32">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="analytics-page w-full" style={{ minHeight: '100%' }}>
      {/* Page header */}
      <div className="w-full bg-white border-b border-slate-200 px-4 sm:px-5 py-2.5">
        <h1 className="text-lg font-bold text-slate-800">Analytics</h1>
      </div>

      <div className="w-full px-4 sm:px-5 py-3">
        <SummaryCards
          students={studentsWithBilling}
          activeCount={activeStudents.length}
          overdueCount={overdueCount}
          expectedRevenue={expectedRevenue}
          thisMonthExpenses={thisMonthExpenses}
        />

        <PaymentAlerts dueThisMonth={dueThisMonth} />

        <OccupancyMap activeStudents={activeStudents} />

        <PLChart allBillingDocs={allBillingDocs} expenses={expenses} />

        <DistributionCharts
          students={studentsWithBilling}
          allBillingDocs={allBillingDocs}
          expenses={expenses}
        />
      </div>
    </div>
  );
}
