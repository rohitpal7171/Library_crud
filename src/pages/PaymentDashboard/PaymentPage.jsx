import { Fragment, useCallback, useEffect, useState } from 'react';
import { useFirebase } from '../../context/Firebase';
import PaymentFilterAndAction from './PaymentFilterAndAction';
import PaymentList from './PaymentList';
import dayjs from 'dayjs';
import { useSnackbar } from '../../components/customComponents/CustomNotifications';

const PaymentPage = () => {
  const [studentPayments, setStudentPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState(1000);
  const [selectedDataForEdit, setSelectedDataForEdit] = useState(null);
  const [rowSelectionModel, setRowSelectionModel] = useState({
    type: 'include',
    ids: new Set(),
  });

  const [clientFilters, setClientFilters] = useState({
    startPaymentDate: null,
    endPaymentDate: null,
  });

  const firebaseContext = useFirebase();
  const { showSnackbar } = useSnackbar();

  const fetcheData = useCallback(() => {
    setLoading(true);
    firebaseContext
      .getCollectionWithSubcollections({
        collectionName: 'students',
        subcollections: ['monthlyBilling'],
      })
      .then((response) => {
        setStudentPayments(response?.data ?? []);
        setFilteredPayments(response?.data ?? []);
        setLoading(false);
      })
      .catch((err) => {
        console.log('Error fetching expense data:', err);
        setStudentPayments([]);
        setFilteredPayments([]);
        setLoading(false);
      });
  }, [firebaseContext, setStudentPayments, setLoading]);

  useEffect(() => {
    fetcheData();
  }, [fetcheData]);

  const applyFilter = () => {
    const { startPaymentDate, endPaymentDate } = clientFilters;

    if (!startPaymentDate && !endPaymentDate) {
      showSnackbar({ severity: 'warning', message: 'Filter not selected!' });
      return;
    }

    if (!startPaymentDate || !endPaymentDate) {
      showSnackbar({ severity: 'error', message: 'Both start and end date are required!' });
      return;
    }

    const start = dayjs(startPaymentDate).startOf('day');
    const end = dayjs(endPaymentDate).endOf('day');
    setLoading(true);
    const filtered = studentPayments
      .map((student) => {
        const billings = student?.subcollections?.monthlyBilling || [];

        const filteredBillings = billings.filter((item) => {
          const payment = dayjs(item.paymentDate);
          return (
            (payment.isAfter(start) && payment.isBefore(end)) ||
            payment.isSame(start, 'day') ||
            payment.isSame(end, 'day')
          );
        });

        if (filteredBillings.length === 0) return null;

        return {
          ...student,
          subcollections: {
            ...student.subcollections,
            monthlyBilling: filteredBillings, // 🔥 this is the key fix
          },
        };
      })
      .filter(Boolean);

    setFilteredPayments(filtered);
    setLoading(false);
  };

  const resetFilters = () => {
    setClientFilters({
      startPaymentDate: null,
      endPaymentDate: null,
    });
    setFilteredPayments(studentPayments);
  };

  return (
    <Fragment>
      <PaymentFilterAndAction
        applyFilter={applyFilter}
        clientFilters={clientFilters}
        setClientFilters={setClientFilters}
        resetFilters={resetFilters}
      />
      <PaymentList
        data={filteredPayments}
        loading={loading}
        pageSize={pageSize}
        setPageSize={setPageSize}
        setLoading={setLoading}
        fetchData={fetcheData}
        selectedDataForEdit={selectedDataForEdit}
        setSelectedDataForEdit={setSelectedDataForEdit}
        rowSelectionModel={rowSelectionModel}
        setRowSelectionModel={setRowSelectionModel}
      />
    </Fragment>
  );
};

export default PaymentPage;
