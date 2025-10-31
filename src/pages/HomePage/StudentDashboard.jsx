import { Fragment, useCallback, useState } from 'react';
import FilterAndActions from './FilterAndActions';
import StudentList from './StudentList';
import { useFirebase } from '../../context/Firebase';
import { Box, Tab, Tabs } from '@mui/material';
import { defaultBorderColor, defaultBoxBorderRadius, defaultBoxPadding } from '../../utils/utils';

const StudentDashboard = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState(1000);
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState(null);

  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [excludedStudentIds, setExcludedStudentIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [studentRowSelectionModel, setStudentRowSelectionModel] = useState({
    type: 'include',
    ids: new Set(),
  });
  const [tabValue, setTabValue] = useState('active');
  const [serverFilters, setServerFilters] = useState([['active', '==', true]]);

  const firebaseContext = useFirebase();

  const fetchStudentData = useCallback(
    (filters) => {
      setLoading(true);
      firebaseContext
        .getDocumentsByQuery({
          collection: 'students',
          filters: filters,
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
    },
    [firebaseContext, setStudents, setLoading]
  );

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    let filters = null;
    if (newValue === 'active') {
      filters = [{ field: 'active', operator: '==', value: true }];
      setServerFilters(filters);
    } else if (newValue === 'inactive') {
      filters = [{ field: 'active', operator: '==', value: false }];
      setServerFilters(filters);
    }
    setServerFilters(filters);
    fetchStudentData(filters);
  };

  const tabSection = (
    <Box sx={{ pl: defaultBoxPadding, pr: defaultBoxPadding }}>
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="scrollable auto tabs example"
        sx={{ border: `1px solid ${defaultBorderColor}`, borderRadius: defaultBoxBorderRadius }}
      >
        <Tab value="active" label="Active Students" />
        <Tab value="inactive" label="Inactive Students" />
        <Tab value="all" label="All Students" />
      </Tabs>
    </Box>
  );

  const propsForStudentList = {
    students,
    loading,
    setLoading,
    pageSize,
    setPageSize,
    fetchStudentData,
    selectedStudentForEdit,
    setSelectedStudentForEdit,
    selectedStudentIds,
    setSelectedStudentIds,
    setExcludedStudentIds,
    setSelectAll,
    studentRowSelectionModel,
    setStudentRowSelectionModel,
    serverFilters,
  };

  const propsForAddEditForm = {
    fetchStudentData,
    excludedStudentIds,
    selectAll,
    serverFilters,
  };

  return (
    <Fragment>
      <FilterAndActions {...propsForAddEditForm} />
      <Box>{tabSection}</Box>
      <StudentList {...propsForStudentList} />
    </Fragment>
  );
};

export default StudentDashboard;
