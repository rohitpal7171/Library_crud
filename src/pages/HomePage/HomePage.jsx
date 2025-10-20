import NavbarComponent from '../Common/NavbarComponent';
import StudentList from './StudentList';
import FilterAndActions from './FilterAndActions';
import { useCallback, useState } from 'react';
import { useFirebase } from '../../context/Firebase';

const HomePage = () => {
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
  };

  const propsForAddEditForm = {
    fetchStudentData,
    excludedStudentIds,
    selectAll,
    // selectedStudentForEdit,
    // setSelectedStudentForEdit,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <NavbarComponent />
      <FilterAndActions {...propsForAddEditForm} />
      <StudentList {...propsForStudentList} />
    </div>
  );
};

export default HomePage;
