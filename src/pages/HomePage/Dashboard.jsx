import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { defaultBoxPadding } from '../../utils/utils';
import { Box, Grid, Paper, Typography } from '@mui/material';
import { CheckCircleOutline, DescriptionOutlined, People } from '@mui/icons-material';
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
      .getDocumentsByQuery()
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

  const genderData = Object.entries(stats.genderCount).map(([name, value]) => ({
    label: name,
    value,
  }));

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
          <StatCard title="Total Students" count={stats?.total ?? 0} icon={People} />
          <StatCard
            title="Active Students"
            count={stats?.active ?? 0}
            icon={CheckCircleOutline}
            iconColor="success"
          />
          <StatCard
            title="Inactive Students"
            count={stats?.inactive ?? 0}
            icon={CheckCircleOutline}
            iconColor="error"
          />
          <StatCard
            title="This Month Enrollment"
            count={stats?.thisMonthEnrollments ?? 0}
            icon={DescriptionOutlined}
            iconColor="primary"
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
          />
          <StatCard
            title="Students without Documents"
            count={stats?.missingDocuments ?? 0}
            tooltipHtml="Number of Students don't have Documents attached."
          />
          <StatCard
            title="Aadhaar Linked"
            count={stats?.aadhaarLinked ?? 0}
            tooltipHtml="Number of Students have Aadhaar Linked."
          />
          <StatCard
            title="Locker Reserved"
            count={stats?.withLockers ?? 0}
            tooltipHtml="Number of Students have Locker Reserved."
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
              Analytics
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={2}>
          <Grid item size={{ sm: 12, md: 9 }}>
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
          <Grid item size={{ sm: 12, md: 3 }}>
            <Paper variant="outlined" sx={{ p: 2, flex: 1, mt: 2, height: 300 }}>
              <Typography variant="text" sx={{ fontWeight: 'bold' }}>
                Gender wise Distribution
              </Typography>
              <PieChart
                width={300}
                height={300}
                loading={loading}
                series={[
                  {
                    data: genderData,
                    innerRadius: 30,
                    outerRadius: 100,
                    paddingAngle: 5,
                    cornerRadius: 5,
                    cx: 150,
                    cy: 150,
                    arcLabel: (params) => params.label ?? '',
                  },
                ]}
                hideLegend
                sx={{
                  margin: 'auto',
                  display: 'block',
                }}
              />
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Fragment>
  );
};

export default Dashboard;
