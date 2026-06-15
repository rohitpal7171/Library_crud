import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import ExpenseFilterAndActions from './ExpenseFilterAndActions';
import ExpenseList from './ExpenseList';
import { useFirebase } from '../../context/Firebase';
import dayjs from 'dayjs';
import { useSnackbar } from '../../components/customComponents/CustomNotifications';

const Expense = () => {
  const [expenses, setExpenses] = useState([]);
  const [serverFilters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState(1000);
  const [selectedDataForEdit, setSelectedDataForEdit] = useState(null);
  const [rowSelectionModel, setRowSelectionModel] = useState({
    type: 'include',
    ids: new Set(),
  });

  const [clientFilters, setClientFilters] = useState({
    startDate: null,
    endDate: null,
  });

  const firebaseContext = useFirebase();
  const { showSnackbar } = useSnackbar();

  const fetchExpenseData = useCallback(
    (filters) => {
      setLoading(true);
      firebaseContext
        .getOnlyCollectionData({
          collectionName: 'expenses',
          filters: filters,
          orderField: 'expenseDate',
          orderDirection: 'desc',
        })
        .then((response) => {
          setExpenses(response?.data ?? []);
          setLoading(false);
        })
        .catch((err) => {
          console.log('Error fetching expense data:', err);
          setExpenses([]);
          setLoading(false);
        });
    },
    [firebaseContext]
  );

  useEffect(() => {
    fetchExpenseData(serverFilters);
  }, [fetchExpenseData, serverFilters]);

  const applyFilter = () => {
    const { startDate, endDate } = clientFilters;
    if (!startDate && !endDate) {
      showSnackbar({ severity: 'warning', message: 'Filter not selected!' });
      return;
    }
    if (!startDate || !endDate) {
      showSnackbar({ severity: 'error', message: 'Both start and end date are required!' });
      return;
    }
  };

  const resetFilters = () => {
    setClientFilters({ startDate: null, endDate: null });
  };

  const filteredExpenses = useMemo(() => {
    const { startDate, endDate } = clientFilters;
    if (!startDate && !endDate) return expenses;
    const start = startDate ? dayjs(startDate).startOf('day') : null;
    const end = endDate ? dayjs(endDate).endOf('day') : null;
    return expenses.filter((exp) => {
      if (!exp.expenseDate) return false;
      const d = dayjs(exp.expenseDate);
      if (start && d.isBefore(start)) return false;
      if (end && d.isAfter(end)) return false;
      return true;
    });
  }, [expenses, clientFilters]);

  return (
    <Fragment>
      <ExpenseFilterAndActions
        fetchData={fetchExpenseData}
        expenses={filteredExpenses}
        clientFilters={clientFilters}
        setClientFilters={setClientFilters}
        applyFilter={applyFilter}
        resetFilters={resetFilters}
      />
      <ExpenseList
        expenses={filteredExpenses}
        loading={loading}
        pageSize={pageSize}
        setPageSize={setPageSize}
        setLoading={setLoading}
        fetchData={fetchExpenseData}
        selectedDataForEdit={selectedDataForEdit}
        setSelectedDataForEdit={setSelectedDataForEdit}
        rowSelectionModel={rowSelectionModel}
        setRowSelectionModel={setRowSelectionModel}
      />
    </Fragment>
  );
};

export default Expense;
