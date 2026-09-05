import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
} from '@mui/material';
import { Fragment, useMemo } from 'react';
import { CurrencyRupee } from '@mui/icons-material';
import { Spin } from 'antd';
import { defaultBoxPadding, formatAmount, formatDate, safeValue } from '../../utils/utils';
import { exportToExcel } from '../../utils/exportUtils';
import { FileDownload } from '@mui/icons-material';

const NormalPaymentList = ({ data, loading }) => {
  const flatRows = useMemo(() => {
    const rows = [];
    data.forEach((student) => {
      const bills = student?.subcollections?.monthlyBilling || [];
      bills.forEach((bill) => {
        rows.push({
          ...bill,
          studentName: student.studentName,
          humanId: student.humanId,
        });
      });
    });
    return rows.sort((a, b) => {
      if (!a?.paymentDate) return 1;
      if (!b?.paymentDate) return -1;
      return new Date(b.paymentDate) - new Date(a.paymentDate);
    });
  }, [data]);

  const footerTotals = useMemo(() => {
    const totals = flatRows.reduce(
      (acc, row) => {
        acc.basic += Number(row?.basicFee || 0);
        acc.seat += Number(row?.seatFee || 0);
        acc.locker += Number(row?.lockerFee || 0);
        return acc;
      },
      { basic: 0, seat: 0, locker: 0 }
    );
    return { ...totals, grand: totals.basic + totals.seat + totals.locker };
  }, [flatRows]);

  const handleExcelExport = () => {
    const rows = flatRows.map((r) => ({
      studentName: r.studentName || '-',
      humanId: r.humanId || '-',
      paymentDate: r.paymentDate
        ? formatDate(
            new Date(r.paymentDate?.seconds ? r.paymentDate.seconds * 1000 : r.paymentDate)
          )
        : '-',
      paymentBy: r.paymentBy || '-',
      basicFee: r.basicFee || 0,
      seatFee: r.seatFee || 0,
      lockerFee: r.lockerFee || 0,
      total: Number(r.basicFee || 0) + Number(r.seatFee || 0) + Number(r.lockerFee || 0),
    }));
    const columns = [
      { key: 'studentName', label: 'Student' },
      { key: 'humanId', label: 'ID' },
      { key: 'paymentDate', label: 'Payment Date' },
      { key: 'paymentBy', label: 'Method' },
      { key: 'basicFee', label: 'Basic Fee (₹)' },
      { key: 'seatFee', label: 'Seat Fee (₹)' },
      { key: 'lockerFee', label: 'Locker Fee (₹)' },
      { key: 'total', label: 'Total (₹)' },
    ];
    exportToExcel(rows, columns, 'Payment_List');
  };

  return (
    <Fragment>
      <Box sx={{ flexGrow: 1, p: defaultBoxPadding }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Box
            component="button"
            onClick={handleExcelExport}
            sx={{
              display: 'flex', alignItems: 'center', gap: 0.5,
              px: 2, py: 1, borderRadius: 1.5,
              border: '1px solid #d1d5db', cursor: 'pointer',
              bgcolor: '#fff', color: '#16a34a', fontSize: 13, fontWeight: 500,
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'all 200ms ease',
              '&:hover': { bgcolor: '#f0fdf4', borderColor: '#86efac' },
            }}
          >
            <FileDownload sx={{ fontSize: 16, color: '#16a34a' }} /> Export Excel
          </Box>
        </Box>
        <Spin spinning={loading}>
          <TableContainer component={Paper} sx={{ height: innerHeight - 300, overflowY: 'auto' }}>
            <Table stickyHeader aria-label="normal payments table">
              <TableHead>
                <TableRow>
                  <TableCell className="table-header">Student</TableCell>
                  <TableCell className="table-header">Payment Date</TableCell>
                  <TableCell className="table-header">Payment Method</TableCell>
                  <TableCell className="table-header" align="right">
                    Basic Fee
                  </TableCell>
                  <TableCell className="table-header" align="right">
                    Seat Fee
                  </TableCell>
                  <TableCell className="table-header" align="right">
                    Locker Fee
                  </TableCell>
                  <TableCell className="table-header" align="right">
                    Total
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {flatRows.map((row, index) => {
                  const total =
                    Number(row?.basicFee || 0) +
                    Number(row?.seatFee || 0) +
                    Number(row?.lockerFee || 0);
                  return (
                    <TableRow key={`${row.humanId}-${row.paymentDate}-${index}`}>
                      <TableCell>{safeValue(row.studentName)}</TableCell>
                      <TableCell>{row?.paymentDate ? formatDate(row.paymentDate) : '-'}</TableCell>
                      <TableCell>{row?.paymentBy || '-'}</TableCell>
                      <TableCell align="right">
                        {row?.basicFee ? (
                          <div className="table-cell-display-flex table-cell-display-flex-right">
                            <CurrencyRupee fontSize="5px" /> {safeValue(row.basicFee)}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {row?.seatFee ? (
                          <div className="table-cell-display-flex table-cell-display-flex-right">
                            <CurrencyRupee fontSize="5px" /> {safeValue(row.seatFee)}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {row?.lockerFee ? (
                          <div className="table-cell-display-flex table-cell-display-flex-right">
                            <CurrencyRupee fontSize="5px" /> {safeValue(row.lockerFee)}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {total ? (
                          <div className="table-cell-display-flex table-cell-display-flex-right">
                            <CurrencyRupee fontSize="5px" /> {formatAmount(total)}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="table-footer">
                    <div className="font-bold">{flatRows.length} Payments</div>
                  </TableCell>
                  <TableCell className="table-footer" colSpan={2}>
                    <div className="table-cell-display-flex table-cell-display-flex-right">
                      Grand Total
                    </div>
                  </TableCell>
                  <TableCell align="right" className="table-footer">
                    <div className="table-cell-display-flex table-cell-display-flex-right font-bold">
                      <CurrencyRupee fontSize="10px" /> {formatAmount(footerTotals.basic)}
                    </div>
                  </TableCell>
                  <TableCell align="right" className="table-footer">
                    <div className="table-cell-display-flex table-cell-display-flex-right font-bold">
                      <CurrencyRupee fontSize="10px" /> {formatAmount(footerTotals.seat)}
                    </div>
                  </TableCell>
                  <TableCell align="right" className="table-footer">
                    <div className="table-cell-display-flex table-cell-display-flex-right font-bold">
                      <CurrencyRupee fontSize="10px" /> {formatAmount(footerTotals.locker)}
                    </div>
                  </TableCell>
                  <TableCell align="right" className="table-footer">
                    <div className="table-cell-display-flex table-cell-display-flex-right font-bold">
                      <CurrencyRupee fontSize="10px" /> {formatAmount(footerTotals.grand)}
                    </div>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>
        </Spin>
      </Box>
    </Fragment>
  );
};

export default NormalPaymentList;
