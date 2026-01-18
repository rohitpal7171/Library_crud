import { Fragment, useCallback, useEffect, useState } from 'react';
import { useFirebase } from '../../context/Firebase';
import PaymentFilterAndAction from './PaymentFilterAndAction';
import PaymentList from './PaymentList';

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

  const firebaseContext = useFirebase();

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

  const applyFilter = (filterBody) => {
    const { startDate, endDate } = filterBody;
    const hasFilter = startDate && endDate;

    return studentPayments
      .map((student) => {
        const billings = student?.subcollections?.monthlyBilling || [];

        // Filter only if date range selected
        const filteredBillings = hasFilter
          ? billings.filter((item) => {
              const payment = new Date(item.paymentDate);
              return payment >= new Date(startDate) && payment <= new Date(endDate);
            })
          : billings;

        // If filter applied and no records → remove student
        if (hasFilter && filteredBillings.length === 0) return null;

        // Calculate totals safely (string/number issue handled)
        const totals = filteredBillings.reduce(
          (acc, item) => {
            acc.basic += Number(item.basicFee || 0);
            acc.seat += Number(item.seatFee || 0);
            acc.locker += Number(item.lockerFee || 0);
            return acc;
          },
          { basic: 0, seat: 0, locker: 0 }
        );

        return {
          ...student,
          filteredBilling: filteredBillings,
          totals: {
            basicFee: totals.basic,
            seatFee: totals.seat,
            lockerFee: totals.locker,
            grandTotal: totals.basic + totals.seat + totals.locker,
          },
        };
      })
      .filter(Boolean); // removes null students
  };

  return (
    <Fragment>
      <PaymentFilterAndAction fetchData={fetcheData} applyFilter={applyFilter} />
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
