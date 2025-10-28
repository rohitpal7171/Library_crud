import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { defaultBoxPadding, firebaseTimestampToDate } from '../../utils/utils';
import { Box, Grid, Paper, Typography } from '@mui/material';
import {
  CheckCircleOutline,
  CurrencyRupee,
  DescriptionOutlined,
  People,
  Person,
  PersonAdd,
} from '@mui/icons-material';
import { StatCard } from '../../components/customComponents/CustomCard';
import { PieChart, BarChart } from '@mui/x-charts';
import { useFirebase } from '../../context/Firebase';

const Dashboard = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  const firebaseContext = useFirebase();

  const fetchStudentData = useCallback(() => {
    setLoading(true);
    firebaseContext
      .getCollectionWithSubcollections({
        collectionName: 'students',
        subcollections: ['monthlyBilling'],
      })
      .then((response) => {
        setStudents(response?.data ?? []);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setStudents([]);
        setLoading(false);
      });
  }, [firebaseContext, setStudents, setLoading]);

  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

  const stats = useMemo(() => {
    const total = students.length;
    const active = students.filter((s) => s.active).length;
    const inactive = total - active;

    // This month enrollments
    const currentMonth = new Date().getMonth();
    const thisMonthEnrollments =
      students.filter((s) => {
        const joinDate = new Date(s.dateOfJoining);
        return joinDate.getMonth() === currentMonth;
      })?.length ?? 0;

    // Documents stats
    const totalDocuments = students.reduce((sum, s) => sum + s.documents.length, 0);
    const missingDocuments =
      students.filter((s) => String(s.documents.length) === String(0))?.length ?? 0;
    const aadhaarLinked = students.filter((s) => s.aadhaarNumber)?.length ?? 0;
    const aadhaarPercentage = ((aadhaarLinked / total) * 100).toFixed(1);

    const withSeats = students.filter((s) => s.seatReserved)?.length ?? 0;
    const withLockers = students.filter((s) => s.locker)?.length ?? 0;

    const genderCount = students.reduce((acc, s) => {
      acc[s.gender] = (acc[s.gender] || 0) + 1;
      return acc;
    }, {});

    const monthlyJoining = students.reduce((acc, s) => {
      const date = new Date(s.dateOfJoining);
      const month = date.toLocaleString('default', { month: 'short' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      active,
      inactive,
      thisMonthEnrollments,
      totalDocuments,
      missingDocuments,
      aadhaarLinked,
      aadhaarPercentage,
      withSeats,
      withLockers,
      genderCount,
      monthlyJoining,
    };
  }, [students]);

  // const genderData = Object.entries(stats.genderCount).map(([name, value]) => ({
  //   label: name,
  //   value,
  // }));

  const monthOrder = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const monthlyData = monthOrder
    .map((month) => ({ month, count: stats.monthlyJoining[month] || 0 }))
    .filter((item) => item.count > 0);

  const valueFormatter = (value) => {
    return `${value}`;
  };

  const getEntryTotal = (e = {}) =>
    Number(e.basicFee || 0) + Number(e.lockerFee || 0) + Number(e.seatFee || 0);

  const normalizeMonthKey = (d) => {
    try {
      const date = typeof d === 'string' ? new Date(d) : d;
      if (!date || isNaN(date)) return null;
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // e.g. 2025-10
    } catch {
      return null;
    }
  };

  const billing = useMemo(() => {
    // flatten monthlyBilling entries across students
    const allEntries = students.flatMap((s) =>
      Array.isArray(s.subcollections.monthlyBilling)
        ? s.subcollections.monthlyBilling.map((mb) => ({ ...mb, __student: s }))
        : []
    );

    const totalRevenue = allEntries.reduce((sum, e) => sum + getEntryTotal(e), 0);

    // build month index (requires e.period on entries; gracefully skips if absent)
    const entriesByMonth = allEntries.reduce((acc, e) => {
      const key = e.paymentDate ? normalizeMonthKey(e.paymentDate) : null;
      if (!key) return acc;
      (acc[key] ||= []).push(e);
      return acc;
    }, {});

    // current month key
    const now = new Date();
    const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisMonthEntries = entriesByMonth[thisMonthKey] || [];
    const mrr = thisMonthEntries.reduce((sum, e) => sum + getEntryTotal(e), 0);

    const dueAmount = students.reduce((sum, student) => {
      // ensure subcollection exists and has entries
      const latestBilling = Array.isArray(student?.subcollections?.monthlyBilling)
        ? student.subcollections.monthlyBilling[0] // latest payment is first (index 0)
        : null;

      if (!latestBilling || !latestBilling.nextPaymentDate) return sum;

      const today = new Date();
      const dueDate = firebaseTimestampToDate(latestBilling.nextPaymentDate);
      const isDue =
        !isNaN(dueDate) && (dueDate <= today || dueDate.toDateString() === today.toDateString());

      if (isDue) {
        // add only the basic fee from latest billing
        return sum + Number(latestBilling.basicFee || 0);
      }

      return sum;
    }, 0);

    // fee buckets
    const basicRevenue = allEntries.reduce((s, e) => s + Number(e.basicFee || 0), 0);
    const lockerRevenue = allEntries.reduce((s, e) => s + Number(e.lockerFee || 0), 0);
    const seatRevenue = allEntries.reduce((s, e) => s + Number(e.seatFee || 0), 0);

    // subscription mix
    const subscriptionMix = allEntries.reduce((acc, e) => {
      const key = e.subscriptionType || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    // revenue trend
    const revenueByMonth = Object.entries(entriesByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, arr]) => ({
        monthKey, // "YYYY-MM"
        revenue: arr.reduce((sum, e) => sum + getEntryTotal(e), 0),
      }));

    // top payers this month
    const topPayersThisMonth = thisMonthEntries
      .map((e) => ({
        name: e.__student?.studentName || 'Unknown',
        amount: getEntryTotal(e),
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      totalRevenue,
      mrr,
      dueAmount,
      basicRevenue,
      lockerRevenue,
      seatRevenue,
      subscriptionMix,
      revenueByMonth,
      topPayersThisMonth,
    };
  }, [students]);

  const chartSetting = {
    xAxis: [{ dataKey: 'month', tickPlacement: 'middle', tickLabelPlacement: 'middle' }],
    yAxis: [
      {
        label: 'Number of Students',
        width: 60,
      },
    ],
    series: [{ dataKey: 'count', label: 'Student Enrolled', valueFormatter }],
    height: 290,
    margin: { left: 0 },
  };

  return (
    <Fragment>
      <Box sx={{ flexGrow: 1, p: defaultBoxPadding }}>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            transition: 'all 240ms ease-in-out',
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: '500' }}>
              Overview
            </Typography>
          </Box>
        </Box>
        <Grid container spacing={2} style={{ padding: 10 }}>
          <StatCard
            title="Total Students"
            count={stats?.total ?? 0}
            icon={People}
            loading={loading}
          />
          <StatCard
            title="Active Students"
            count={stats?.active ?? 0}
            icon={Person}
            iconColor="success"
            loading={loading}
          />
          <StatCard
            title="Inactive Students"
            count={stats?.inactive ?? 0}
            icon={Person}
            iconColor="error"
            loading={loading}
          />
          <StatCard
            title="This Month Enrollment"
            count={stats?.thisMonthEnrollments ?? 0}
            icon={PersonAdd}
            iconColor="primary"
            loading={loading}
          />
        </Grid>

        <Box
          sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            transition: 'all 240ms ease-in-out',
            mt: 2,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: '500' }}>
              Detailed Insights
            </Typography>
          </Box>
        </Box>
        <Grid container spacing={2} style={{ padding: 10 }}>
          <StatCard
            title="Students with Documents"
            count={stats?.totalDocuments ?? 0}
            tooltipHtml="Number of Students have Documents attached."
            loading={loading}
          />
          <StatCard
            title="Students without Documents"
            count={stats?.missingDocuments ?? 0}
            tooltipHtml="Number of Students don't have Documents attached."
            loading={loading}
            iconColor="error"
          />
          <StatCard
            title="This Month Earning"
            count={`₹${(billing.mrr || 0).toLocaleString()}`}
            loading={loading}
            icon={CurrencyRupee}
            iconColor="success"
          />
          <StatCard
            title="Due Amount"
            count={`₹${(billing.dueAmount || 0).toLocaleString()}`}
            iconColor="error"
            loading={loading}
            icon={CurrencyRupee}
            tooltipHtml="Number of Students have pending Basic Fees."
          />
        </Grid>

        {/* <Box
          sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            transition: 'all 240ms ease-in-out',
            mt: 2,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: '500' }}>
              Billing
            </Typography>
          </Box>
        </Box>
        <Grid container spacing={2} style={{ padding: 10 }}>
          <StatCard
            title="Total Revenue"
            count={`₹${(billing.totalRevenue || 0).toLocaleString()}`}
            loading={loading}
            tooltipHtml="Total Revenue generated from all Students and it includes due amount also"
          />
        </Grid> */}

        <Box
          sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            transition: 'all 240ms ease-in-out',
            mt: 2,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: '500' }}>
              Analytics
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={2}>
          <Grid item size={{ sm: 12 }}>
            <Paper variant="outlined" sx={{ p: 2, flex: 1, mt: 2, height: 300 }}>
              <Typography variant="text" sx={{ fontWeight: 'bold' }}>
                Student Enrolled in current Year : {new Date().getFullYear()}
              </Typography>
              <BarChart
                loading={loading}
                dataset={monthlyData}
                borderRadius={20}
                {...chartSetting}
              />
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Fragment>
  );
};

export default Dashboard;
