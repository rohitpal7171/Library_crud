import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { defaultBoxBorderRadius, defaultBoxPadding } from '../../utils/utils';
import {
  Box,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import {
  AccountBalanceWallet,
  AirlineSeatReclineNormal,
  CurrencyRupee,
  LockClock,
  People,
  Person,
  PersonAdd,
  Savings,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { StatCard } from '../../components/customComponents/CustomCard';
import { BarChart, LineChart } from '@mui/x-charts';
import { useFirebase } from '../../context/Firebase';
import MiniStudentList from '../Common/MiniStudentList';
import { PaymentDetail } from './PaymentDetail';

const Dashboard = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [openPaymentDetail, setOpenPaymentDetail] = useState(false);
  const [currentYearEarningVisibility, setCurrentYearEarningVisibility] = useState(false);

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

  const activeStudents = useMemo(
    () => (students?.length ? students.filter((s) => s.active) : []),
    [students]
  );

  const stats = useMemo(() => {
    const total = students.length;
    const active = activeStudents.length;
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

    // ✅ Students with no documents
    const studentsWithNoDocuments = students.filter(
      (s) => !s.documents || s.documents.length === 0
    ).length;

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
      studentsWithNoDocuments,
    };
  }, [students, activeStudents]);

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

    const dueAmount = (students, today = new Date()) => {
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      const list_of_student = [];
      let total_due_amount = 0;

      for (const s of students) {
        const bill0 = s?.subcollections?.monthlyBilling?.[0];
        if (!bill0 || !bill0.nextPaymentDate) continue;

        // Handle Firestore-like timestamp object {seconds, nanoseconds}
        const ts = bill0.nextPaymentDate;
        const dueDate = ts?.seconds != null ? new Date(ts.seconds * 1000) : new Date(ts);

        // Compare by date (not time of day)
        const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        const isDue = dueDateOnly <= startOfToday;

        if (isDue) {
          const basic = parseInt(bill0.basicFee || 0, 10) || 0;
          const seat = parseInt(bill0.seatFee || 0, 10) || 0;
          const locker = parseInt(bill0.lockerFee || 0, 10) || 0;
          const due_amount = basic + seat + locker;

          list_of_student.push({
            ...s,
            due_amount,
          });

          // 🔽 Sort by latest date first
          list_of_student.sort((a, b) => a.due_date - b.due_date);

          total_due_amount += due_amount;
        }
      }

      return { list_of_student, total_due_amount };
    };

    const dueInNextDays = (students, days = 7, today = new Date()) => {
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startOfTomorrow = new Date(
        startOfToday.getFullYear(),
        startOfToday.getMonth(),
        startOfToday.getDate() + 1
      );
      const endOfWindow = new Date(
        startOfToday.getFullYear(),
        startOfToday.getMonth(),
        startOfToday.getDate() + days
      );

      const list_of_student = [];
      let total_due_amount = 0;

      for (const s of students) {
        const bill0 = s?.subcollections?.monthlyBilling?.[0];
        if (!bill0 || !bill0.nextPaymentDate) continue;

        // Normalize Firestore Timestamp or other inputs to a Date
        const ts = bill0.nextPaymentDate;
        const dueDate = ts?.seconds != null ? new Date(ts.seconds * 1000) : new Date(ts); // supports Date, ms number, or ISO string

        if (isNaN(dueDate)) continue;

        // Compare by date (ignore time of day)
        const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

        const isWithinNextWindow = dueDateOnly >= startOfTomorrow && dueDateOnly <= endOfWindow;

        if (isWithinNextWindow) {
          const basic = parseInt(bill0.basicFee || 0, 10) || 0;
          const seat = parseInt(bill0.seatFee || 0, 10) || 0;
          const locker = parseInt(bill0.lockerFee || 0, 10) || 0;
          const due_amount = basic + seat + locker;

          list_of_student.push({
            ...s,
            due_amount,
            due_date: dueDateOnly, // optional: handy for sorting/display
          });

          // 🔽 Sort latest first (ascending order)
          list_of_student.sort((a, b) => a.due_date - b.due_date);

          total_due_amount += due_amount;
        }
      }

      return { list_of_student, total_due_amount };
    };

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

    const getCurrentYearEarnings = (entries = allEntries, today = new Date()) => {
      const currentYear = today.getFullYear();

      // Determine financial year start and end
      // (If current month < April, financial year started last year)
      const fyStartYear = today.getMonth() + 1 < 4 ? currentYear - 1 : currentYear;
      const fyStart = new Date(fyStartYear, 3, 1); // 1 April (month index 3)
      const fyEnd = new Date(fyStartYear + 1, 2, 31, 23, 59, 59, 999); // 31 March next year

      // Filter entries by paymentDate in FY range
      const entriesInYear = entries.filter((e) => {
        if (!e.paymentDate) return false;
        const d = e.paymentDate?.seconds
          ? new Date(e.paymentDate.seconds * 1000)
          : new Date(e.paymentDate);
        return d >= fyStart && d <= fyEnd;
      });

      // Sum totals
      const totalRevenue = entriesInYear.reduce((sum, e) => sum + getEntryTotal(e), 0);
      const totalBasicFees = entriesInYear.reduce((sum, e) => sum + Number(e.basicFee || 0), 0);
      const totalSeatFees = entriesInYear.reduce((sum, e) => sum + Number(e.seatFee || 0), 0);
      const totalLockerFees = entriesInYear.reduce((sum, e) => sum + Number(e.lockerFee || 0), 0);

      return {
        financialYear: `${fyStart.getFullYear()}-${fyEnd.getFullYear()}`,
        totalRevenue,
        totalBasicFees,
        totalSeatFees,
        totalLockerFees,
      };
    };

    // Helper: Generate "YYYY-MM" keys from Date
    const ymKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    // Helper: Move forward/backward by N months
    const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);

    // Helper: Format as "Oct 25" style for chart labels
    const labelMMMYY = (d) =>
      d.toLocaleString('en-US', { month: 'short' }) + ' ' + String(d.getFullYear()).slice(-2);

    // Helper: Build last N consecutive months (default: 12)
    const buildMonthSpan = (endDate = new Date(), count = 12) => {
      const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1); // start from 1st of current month
      const months = [];
      for (let i = count - 1; i >= 0; i--) months.push(addMonths(end, -i));
      return months;
    };

    // Function: Builds a 12-month growth dataset for total revenue (basic + seat + locker)
    const getMonthlyGrowthSeries = ({ months = 12, today = new Date() } = {}) => {
      // Map of YYYY-MM → total revenue for that month
      const revenueMap = new Map();
      for (const [key, arr] of Object.entries(entriesByMonth)) {
        const total = arr.reduce((sum, e) => sum + getEntryTotal(e), 0);
        revenueMap.set(key, total);
      }

      // Build contiguous 12-month range, filling missing months with 0
      const monthDates = buildMonthSpan(today, months);
      const labels = monthDates.map(labelMMMYY);
      const values = monthDates.map((d) => revenueMap.get(ymKey(d)) ?? 0);

      // Prepare LineChart-compatible structures
      const xAxis = [{ scaleType: 'point', data: labels }];
      const series = [
        {
          data: values,
          label: 'Total Revenue',
          valueFormatter: (v) => `₹${Number(v || 0).toLocaleString()}`, // Show ₹ formatted value
        },
      ];

      // Return ready-to-plot dataset
      return {
        labels,
        values,
        xAxis,
        series,
      };
    };

    return {
      totalRevenue,
      mrr,
      dueAmount,
      basicRevenue,
      lockerRevenue,
      seatRevenue,
      subscriptionMix,
      revenueByMonth,
      dueInNextDays,
      getCurrentYearEarnings,
      getMonthlyGrowthSeries,
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

  const handlePaymentClick = useCallback(
    (item) => {
      setSelectedStudent(item);
      setOpenPaymentDetail(true);
    },
    [setSelectedStudent]
  );

  const handleClosePaymentDetail = () => {
    setOpenPaymentDetail(false);
    setSelectedStudent(null);
  };

  return (
    <Fragment>
      {openPaymentDetail && (
        <PaymentDetail
          open={openPaymentDetail}
          onClose={() => handleClosePaymentDetail()}
          student={selectedStudent}
          fetchStudentData={fetchStudentData}
          serverFilters={null}
        />
      )}
      <Box sx={{ flexGrow: 1, p: defaultBoxPadding }}>
        <Grid container spacing={2}>
          <StatCard
            title="Total Students"
            count={stats?.total ?? 0}
            icon={People}
            loading={loading}
            key={'total_students'}
          />
          <StatCard
            title="Active Students"
            count={stats?.active ?? 0}
            icon={Person}
            iconColor="success"
            loading={loading}
            key={'active_students'}
          />
          <StatCard
            title="Inactive Students"
            count={stats?.inactive ?? 0}
            icon={Person}
            iconColor="error"
            loading={loading}
            key={'inactive_students'}
          />
          <StatCard
            title="This Month Enrollment"
            count={stats?.thisMonthEnrollments ?? 0}
            icon={PersonAdd}
            iconColor="primary"
            loading={loading}
            key={'this_month_enrollment'}
          />
        </Grid>

        <Grid container spacing={2}>
          <Grid item size={{ sm: 9 }}>
            <Paper
              variant="outlined"
              sx={{ p: 2, flex: 1, mt: 2, height: 300, borderRadius: defaultBoxBorderRadius }}
            >
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
          <Grid item size={{ sm: 3 }}>
            <Paper
              variant="outlined"
              sx={{ p: 2, flex: 1, mt: 2, height: 300, borderRadius: defaultBoxBorderRadius }}
            >
              <Typography
                variant="text"
                sx={{
                  fontWeight: 'bold',
                  display: 'flex',
                  justifyContent: 'space-between',
                  textAlign: 'center',
                }}
              >
                <Box>
                  Earning during current year : {billing.getCurrentYearEarnings().financialYear}
                </Box>
                <IconButton
                  size="small"
                  onClick={() => setCurrentYearEarningVisibility(!currentYearEarningVisibility)}
                >
                  {currentYearEarningVisibility ? <Visibility /> : <VisibilityOff />}
                </IconButton>
              </Typography>
              <List sx={{ mt: 3 }}>
                <ListItem
                  secondaryAction={`₹${
                    !currentYearEarningVisibility
                      ? '****'
                      : billing.getCurrentYearEarnings().totalRevenue
                  }`}
                >
                  <ListItemAvatar>
                    <AccountBalanceWallet />
                  </ListItemAvatar>
                  <ListItemText primary="Earning" sx={{ color: 'grey' }} />
                </ListItem>
                <ListItem
                  secondaryAction={`₹${
                    !currentYearEarningVisibility
                      ? '****'
                      : billing.getCurrentYearEarnings().totalBasicFees
                  }`}
                >
                  <ListItemAvatar>
                    <Savings />
                  </ListItemAvatar>
                  <ListItemText primary="Basic Fee" sx={{ color: 'grey' }} />
                </ListItem>
                <ListItem
                  secondaryAction={`₹${
                    !currentYearEarningVisibility
                      ? '****'
                      : billing.getCurrentYearEarnings().totalSeatFees
                  }`}
                >
                  <ListItemAvatar>
                    <AirlineSeatReclineNormal />
                  </ListItemAvatar>
                  <ListItemText primary="Seat Reservation Fee" sx={{ color: 'grey' }} />
                </ListItem>
                <ListItem
                  secondaryAction={`₹${
                    !currentYearEarningVisibility
                      ? '****'
                      : billing.getCurrentYearEarnings().totalLockerFees
                  }`}
                >
                  <ListItemAvatar>
                    <LockClock />
                  </ListItemAvatar>
                  <ListItemText primary="Locker Reservation Fee" sx={{ color: 'grey' }} />
                </ListItem>
              </List>
            </Paper>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item size={{ sm: 12, md: 9 }}>
            <Paper
              variant="outlined"
              sx={{ p: 2, flex: 1, mt: 2, height: 310, borderRadius: defaultBoxBorderRadius }}
            >
              <Typography variant="text" sx={{ fontWeight: 'bold' }}>
                Revenue Growth (Last 12 Months)
              </Typography>
              <Box sx={{ mt: 2 }}>
                {(() => {
                  const growth = billing.getMonthlyGrowthSeries({ months: 12 }); // Get growth data
                  return (
                    <LineChart
                      xAxis={growth.xAxis} // Month labels
                      series={growth.series} // Total revenue values
                      height={280}
                      loading={loading}
                      margin={{
                        bottom: 40,
                      }}
                    />
                  );
                })()}
              </Box>
            </Paper>
          </Grid>
          <Grid item size={{ sm: 12, md: 3 }}>
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item sx={{ width: '100%' }}>
                <StatCard
                  title="This Month Earning"
                  count={`₹${(billing.mrr || 0).toLocaleString()}`}
                  loading={loading}
                  icon={CurrencyRupee}
                  iconColor="success"
                  showVisibleFunctionality
                  grid={{ xs: 12, sm: 12, md: 12 }}
                />
              </Grid>
              <Grid item sx={{ width: '100%' }}>
                <StatCard
                  title="Documents Attached"
                  count={`${stats?.totalDocuments ?? 0} / ${stats?.total ? stats.total * 5 : 0}`}
                  tooltipHtml="Number of Documents attached."
                  loading={loading}
                  grid={{ xs: 12, sm: 12, md: 12 }}
                />
              </Grid>
              <Grid item sx={{ width: '100%' }}>
                <StatCard
                  title="Students without Documents"
                  count={stats?.studentsWithNoDocuments ?? 0}
                  tooltipHtml="Number of Students don't have Documents attached."
                  loading={loading}
                  iconColor="error"
                  grid={{ xs: 12, sm: 12, md: 12 }}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* Table for Due Amount and Upcoming Due */}
        <Grid container spacing={2} sx={{ p: 1 }}>
          <Grid item size={{ xs: 12, sm: 6 }}>
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                transition: 'all 240ms ease-in-out',
                mt: 2,
                mb: 1,
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: '500' }}>
                  Due Amount
                </Typography>
              </Box>
            </Box>
            <MiniStudentList
              students={billing.dueAmount(activeStudents).list_of_student}
              loading={loading}
              amountTextColor="error.main"
              handlePaymentClick={handlePaymentClick}
            />
          </Grid>
          <Grid item size={{ xs: 12, sm: 6 }}>
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                transition: 'all 240ms ease-in-out',
                mt: 2,
                mb: 1,
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: '500' }}>
                  Upcoming Due ( 7 Days )
                </Typography>
              </Box>
            </Box>
            <MiniStudentList
              students={billing.dueInNextDays(activeStudents, 7).list_of_student}
              loading={loading}
              amountTextColor="warning.main"
              handlePaymentClick={handlePaymentClick}
            />
          </Grid>
        </Grid>
      </Box>
    </Fragment>
  );
};

export default Dashboard;
