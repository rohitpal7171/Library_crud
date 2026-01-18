import {
  Box,
  Collapse,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TableFooter,
} from '@mui/material';
import { Fragment, useMemo, useState } from 'react';
import { defaultBoxPadding, formatDate, safeValue } from '../../utils/utils';
import { CurrencyRupee, KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { Spin } from 'antd';

const PaymentList = (props) => {
  const { data, loading } = props;

  const footerTotals = useMemo(() => {
    const totals = data.reduce(
      (acc, student) => {
        const bills = student?.subcollections?.monthlyBilling || [];

        bills.forEach((b) => {
          acc.basic += Number(b?.basicFee || 0);
          acc.seat += Number(b?.seatFee || 0);
          acc.locker += Number(b?.lockerFee || 0);
        });

        return acc;
      },
      { basic: 0, seat: 0, locker: 0 }
    );

    return {
      ...totals,
      grand: totals.basic + totals.seat + totals.locker,
    };
  }, [data]);

  function IndividualEntries(props) {
    const { row } = props;
    const [open, setOpen] = useState(false);

    const totalBasicFees = row?.subcollections?.monthlyBilling.length
      ? row?.subcollections?.monthlyBilling?.reduce(
          (acc, cur) => Number(acc) + Number(cur?.basicFee),
          0
        )
      : 0;

    const totalSeatFees = row?.subcollections?.monthlyBilling.length
      ? row?.subcollections?.monthlyBilling?.reduce(
          (acc, cur) => Number(acc) + Number(cur?.seatFee),
          0
        )
      : 0;

    const totalLockerFees = row?.subcollections?.monthlyBilling.length
      ? row?.subcollections?.monthlyBilling?.reduce(
          (acc, cur) => Number(acc) + Number(cur?.lockerFee),
          0
        )
      : 0;

    const grandTotal = Number(totalBasicFees) + Number(totalSeatFees) + Number(totalLockerFees);

    return (
      <Fragment>
        <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
          <TableCell>
            <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
              {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
            </IconButton>
          </TableCell>
          <TableCell component="th" scope="row">
            {safeValue(row.studentName)}
          </TableCell>
          <TableCell align="right">
            {row?.monthlyBillingLatest?.paymentDate
              ? formatDate(row?.monthlyBillingLatest?.paymentDate)
              : '-'}
          </TableCell>
          <TableCell align="right">
            {totalBasicFees ? (
              <div className="table-cell-display-flex table-cell-display-flex-right">
                <CurrencyRupee fontSize="5px" /> {safeValue(totalBasicFees)}
              </div>
            ) : (
              '-'
            )}{' '}
          </TableCell>
          <TableCell align="right">
            {totalSeatFees ? (
              <div className="table-cell-display-flex table-cell-display-flex-right">
                <CurrencyRupee fontSize="5px" /> {safeValue(totalSeatFees)}
              </div>
            ) : (
              '-'
            )}{' '}
          </TableCell>
          <TableCell align="right">
            {totalLockerFees ? (
              <div className="table-cell-display-flex table-cell-display-flex-right">
                <CurrencyRupee fontSize="5px" /> {safeValue(totalLockerFees)}
              </div>
            ) : (
              '-'
            )}{' '}
          </TableCell>
          <TableCell align="right">
            {grandTotal ? (
              <div className="table-cell-display-flex table-cell-display-flex-right">
                <CurrencyRupee fontSize="5px" /> {safeValue(grandTotal)}
              </div>
            ) : (
              '-'
            )}{' '}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ margin: 4 }}>
                <Typography variant="subtitle2" className="font-bold" sx={{ marginBottom: 2 }}>
                  Payment History
                </Typography>
                <Table size="small" aria-label="purchases">
                  <TableHead>
                    <TableRow>
                      <TableCell className="table-header">Payment Date</TableCell>
                      <TableCell className="table-header">Payment Method</TableCell>
                      <TableCell className="table-header">Basic Fee</TableCell>
                      <TableCell align="right" className="table-header">
                        Seat Fee
                      </TableCell>
                      <TableCell align="right" className="table-header">
                        Locker Fee
                      </TableCell>
                      <TableCell align="right" className="table-header">
                        Total
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {row?.subcollections?.monthlyBilling?.length > 0 ? (
                      row?.subcollections?.monthlyBilling?.map((historyRow) => (
                        <TableRow key={historyRow.paymentDate}>
                          <TableCell component="th" scope="row">
                            {historyRow?.paymentDate ? formatDate(historyRow.paymentDate) : '-'}
                          </TableCell>
                          <TableCell component="th" scope="row">
                            {historyRow?.paymentBy ? historyRow.paymentBy : '-'}
                          </TableCell>
                          <TableCell>
                            {historyRow?.basicFee ? safeValue(historyRow.basicFee) : '-'}
                          </TableCell>
                          <TableCell align="right">
                            {historyRow?.seatFee ? safeValue(historyRow.seatFee) : '-'}
                          </TableCell>
                          <TableCell align="right">
                            {historyRow?.lockerFee ? safeValue(historyRow.lockerFee) : '-'}
                          </TableCell>
                          <TableCell align="right">
                            {Number(historyRow.basicFee) +
                              Number(historyRow.seatFee) +
                              Number(historyRow.lockerFee)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <>No history available</>
                    )}
                  </TableBody>
                </Table>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      </Fragment>
    );
  }

  return (
    <Fragment>
      <Box sx={{ flexGrow: 1, p: defaultBoxPadding }}>
        <Spin spinning={loading}>
          <TableContainer component={Paper} sx={{ height: innerHeight - 220, overflowY: 'auto' }}>
            <Table stickyHeader aria-label="collapsible table">
              <TableHead>
                <TableRow>
                  <TableCell className="table-header" />
                  <TableCell className="table-header">Student</TableCell>
                  <TableCell className="table-header" align="right">
                    Payment Date
                  </TableCell>
                  <TableCell className="table-header" align="right">
                    Basic Fees
                  </TableCell>
                  <TableCell className="table-header" align="right">
                    Seat Fees
                  </TableCell>
                  <TableCell className="table-header" align="right">
                    Locker Fees
                  </TableCell>
                  <TableCell className="table-header" align="right">
                    Total
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row) => (
                  <IndividualEntries key={row.id} row={row} />
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="table-footer" />
                  <TableCell className="table-footer">
                    <div className="table-cell-display-flex font-bold">
                      {data?.length ? data.length : 0} Students
                    </div>
                  </TableCell>
                  <TableCell className="table-footer">
                    <div className="table-cell-display-flex table-cell-display-flex-right">
                      Grand Total
                    </div>
                  </TableCell>

                  <TableCell align="right" className="table-footer">
                    <div className="table-cell-display-flex table-cell-display-flex-right font-bold">
                      <CurrencyRupee fontSize="10px" /> {safeValue(footerTotals.basic)}
                    </div>
                  </TableCell>

                  <TableCell align="right" className="table-footer">
                    <div className="table-cell-display-flex table-cell-display-flex-right font-bold">
                      <CurrencyRupee fontSize="10px" /> {safeValue(footerTotals.seat)}
                    </div>
                  </TableCell>

                  <TableCell align="right" className="table-footer">
                    <div className="table-cell-display-flex table-cell-display-flex-right font-bold">
                      <CurrencyRupee fontSize="10px" />
                      {safeValue(footerTotals.locker)}
                    </div>
                  </TableCell>

                  <TableCell align="right" className="table-footer">
                    <div className="table-cell-display-flex table-cell-display-flex-right font-bold">
                      <CurrencyRupee fontSize="10px" /> {safeValue(footerTotals.grand)}
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
export default PaymentList;
