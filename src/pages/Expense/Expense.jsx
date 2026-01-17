import { Fragment, useCallback, useEffect, useState } from 'react';
import ExpenseFilterAndActions from './ExpenseFilterAndActions';
import ExpenseList from './ExpenseList';
import { useFirebase } from '../../context/Firebase';

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

  const firebaseContext = useFirebase();

  const fetchExpenseData = useCallback(
    (filters) => {
      setLoading(true);
      firebaseContext
        .getOnlyCollectionData({
          collectionName: 'expenses',
          filters: filters,
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
    [firebaseContext, setExpenses, setLoading]
  );

  useEffect(() => {
    fetchExpenseData(serverFilters);
  }, [fetchExpenseData, serverFilters]);

  return (
    <Fragment>
      <ExpenseFilterAndActions fetchData={fetchExpenseData} />
      <ExpenseList
        expenses={expenses}
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
