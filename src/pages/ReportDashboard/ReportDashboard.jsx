import { useCallback, useEffect, useState } from 'react';
import { useFirebase } from '../../context/Firebase';
import { LinearProgress } from '@mui/material';
import {
  TrendingUp,
  Receipt,
  CompareArrows,
  NotificationImportant,
  People,
} from '@mui/icons-material';
import RevenueReport from './reports/RevenueReport';
import ExpenseReport from './reports/ExpenseReport';
import PLReport from './reports/PLReport';
import OverdueReport from './reports/OverdueReport';
import StudentReport from './reports/StudentReport';

const REPORT_TYPES = [
  {
    key: 'revenue',
    label: 'Revenue',
    desc: 'Payment collections',
    Icon: TrendingUp,
    gradient: 'from-emerald-500 to-teal-600',
    lightBg: 'bg-emerald-50',
    border: 'border-emerald-200',
    iconColor: '#10b981',
  },
  {
    key: 'expense',
    label: 'Expenses',
    desc: 'Operating costs',
    Icon: Receipt,
    gradient: 'from-rose-500 to-pink-600',
    lightBg: 'bg-rose-50',
    border: 'border-rose-200',
    iconColor: '#f43f5e',
  },
  {
    key: 'pl',
    label: 'P & L',
    desc: 'Revenue vs expenses',
    Icon: CompareArrows,
    gradient: 'from-blue-500 to-indigo-600',
    lightBg: 'bg-blue-50',
    border: 'border-blue-200',
    iconColor: '#3b82f6',
  },
  {
    key: 'overdue',
    label: 'Overdue',
    desc: 'Pending collections',
    Icon: NotificationImportant,
    gradient: 'from-amber-500 to-orange-600',
    lightBg: 'bg-amber-50',
    border: 'border-amber-200',
    iconColor: '#f59e0b',
  },
  {
    key: 'students',
    label: 'Students',
    desc: 'Enrollment data',
    Icon: People,
    gradient: 'from-violet-500 to-purple-600',
    lightBg: 'bg-violet-50',
    border: 'border-violet-200',
    iconColor: '#8b5cf6',
  },
];

const ReportDashboard = () => {
  const [activeReport, setActiveReport] = useState('revenue');
  const [students, setStudents] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const firebase = useFirebase();

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      firebase.getCollectionWithSubcollections({
        collectionName: 'students',
        subcollections: ['monthlyBilling'],
      }),
      firebase.getOnlyCollectionData({ collectionName: 'expenses' }),
    ])
      .then(([sRes, eRes]) => {
        setStudents(sRes?.data ?? []);
        setExpenses(eRes?.data ?? []);
      })
      .catch(() => {
        setStudents([]);
        setExpenses([]);
      })
      .finally(() => setLoading(false));
  }, [firebase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const reportProps = { students, expenses };

  return (
    <div className="analytics-page min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-800 to-slate-700 px-6 py-1 shadow-md">
        <h1 className="text-2xl font-bold text-white tracking-tight">Report Dashboard</h1>
        <p className="text-slate-400 text-sm mt-0">
          Generate flexible reports from your library data
        </p>
      </div>

      {loading && <LinearProgress />}

      {/* Report type selector */}
      <div className="px-6 pt-5 pb-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {REPORT_TYPES.map((type) => {
            const { Icon } = type;
            const isActive = activeReport === type.key;
            return (
              <button
                key={type.key}
                onClick={() => setActiveReport(type.key)}
                className={`flex flex-col items-start gap-2.5 p-4 rounded-2xl border-2 transition-all duration-200 text-left cursor-pointer w-full
                  ${
                    isActive
                      ? `bg-gradient-to-br ${type.gradient} border-transparent shadow-lg scale-[1.02]`
                      : `bg-white ${type.border} hover:shadow-md hover:scale-[1.01] hover:border-opacity-60`
                  }`}
              >
                <div className={`p-2 rounded-xl ${isActive ? 'bg-white/20' : type.lightBg}`}>
                  <Icon sx={{ fontSize: 20, color: isActive ? 'white' : type.iconColor }} />
                </div>
                <div>
                  <div
                    className={`font-bold text-sm leading-tight ${isActive ? 'text-white' : 'text-slate-800'}`}
                  >
                    {type.label}
                  </div>
                  <div
                    className={`text-xs mt-0.5 leading-snug ${isActive ? 'text-white/75' : 'text-slate-500'}`}
                  >
                    {type.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Report content */}
      <div className="px-6 pb-10">
        {!loading && (
          <>
            {activeReport === 'revenue' && <RevenueReport {...reportProps} />}
            {activeReport === 'expense' && <ExpenseReport {...reportProps} />}
            {activeReport === 'pl' && <PLReport {...reportProps} />}
            {activeReport === 'overdue' && <OverdueReport {...reportProps} />}
            {activeReport === 'students' && <StudentReport {...reportProps} />}
          </>
        )}
      </div>
    </div>
  );
};

export default ReportDashboard;
