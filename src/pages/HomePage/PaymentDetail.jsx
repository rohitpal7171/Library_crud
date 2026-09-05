import { Fragment, useCallback, useEffect, useState } from 'react';
import { useFirebase } from '../../context/Firebase';
import { useSnackbar } from '../../components/customComponents/CustomNotifications';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Drawer,
  FormControlLabel,
  Grid,
  IconButton,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Close, ThumbUpAltOutlined, WarningAmber, WhatsApp } from '@mui/icons-material';
import CustomDynamicTimeline from '../../components/customComponents/CustomDynamicTimeline';
import {
  basicFeeRules,
  computeNextPaymentDate,
  dateToString,
  DEFAULT_SUBSCRIPTION_FOR,
  defaultMonthlyPaymentSchema,
  formatDate,
  formatFirebaseTimestamp,
  labelSx,
  sendMessageOnWhatsApp,
  showSubscriptionType,
  SUBSCRIPTION_FOR,
} from '../../utils/utils';
import { useForm, Controller } from 'react-hook-form';
import CustomButton from '../../components/customComponents/CustomButton';

export const PaymentDetail = ({ open, onClose, student = {}, fetchStudentData, serverFilters }) => {
  const firebaseContext = useFirebase();
  const { showSnackbar } = useSnackbar();
  // A new payment starts with the student's current subscription and timings.
  const billingDefaults = useCallback(
    () => ({
      ...defaultMonthlyPaymentSchema,
      subscriptionFor: student?.subscriptionFor || DEFAULT_SUBSCRIPTION_FOR,
      timings: student?.timings || defaultMonthlyPaymentSchema.timings,
      paymentDate: '',
    }),
    [student?.subscriptionFor, student?.timings]
  );

  const { control, handleSubmit, reset, watch, formState, setValue, trigger } = useForm({
    defaultValues: billingDefaults(),
  });
  const { errors } = formState;

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [skipNextPaymentDateUpdate, setSkipNextPaymentDateUpdate] = useState(false);
  const [allowZeroBasicFee, setAllowZeroBasicFee] = useState(false);

  // Same as the student form: the checkbox does not touch the fee field, so re-check it.
  useEffect(() => {
    if (formState.isSubmitted) trigger('basicFee');
  }, [allowZeroBasicFee, formState.isSubmitted, trigger]);
  const [paymentPendingDelete, setPaymentPendingDelete] = useState(null);

  const subType = watch('subscriptionType');
  const subDuration = watch('subscriptionDuration');
  const paymentDate = watch('paymentDate');
  const nextPaymentDate = watch('nextPaymentDate');

  const fetchPaymentDetails = useCallback(async () => {
    setLoading(true);
    const response = await firebaseContext.getSubcollectionDocumentsByStudentId({
      parentCollection: 'students',
      studentId: student.id,
      subcollectionName: 'monthlyBilling',
    });
    if (response?.docs) {
      setPayments(response.docs);
    }
    setLoading(false);
  }, [firebaseContext, student]);

  useEffect(() => {
    if (!student.id) return;
    fetchPaymentDetails();
  }, [student.id, fetchPaymentDetails]);

  useEffect(() => {
    if (skipNextPaymentDateUpdate) return;
    if (!paymentDate) return;
    const startDate = paymentDate ? new Date(paymentDate) : null;
    const nextDue = computeNextPaymentDate(startDate, subType, subDuration);
    const nextDueInString = nextDue ? dateToString(nextDue) : '';
    if (!nextDueInString) return;
    setValue('nextPaymentDate', nextDueInString);
  }, [setValue, selectedPayment, paymentDate, subType, subDuration, skipNextPaymentDateUpdate]);

  const renderDescription = (fields = []) => (
    <Fragment>
      {fields.map(({ label, value, key }) => (
        <Box
          key={key || label}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            py: 1,
            px: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography
            key={`${key}-1`}
            variant="body2"
            color="text.secondary"
            sx={{ fontWeight: 600, flex: 1 }}
          >
            {label}
          </Typography>
          <Typography
            key={`${key}-2`}
            variant="body1"
            color="text.primary"
            sx={{ flex: 1, textAlign: 'right' }}
          >
            {value}
          </Typography>
        </Box>
      ))}
    </Fragment>
  );

  const getPaymentStatusList = useCallback(() => {
    return payments.map((payment) => ({
      ...payment,
      title: formatFirebaseTimestamp(payment.createdAt),
      description: renderDescription([
        {
          label: 'Subscription Type',
          value: showSubscriptionType(payment?.subscriptionType) ?? 'month',
        },
        {
          label: 'Payment Date',
          value: payment?.paymentDate ? formatDate(payment.paymentDate) : 'N/A',
        },
        { label: 'Subscription Duration', value: payment?.subscriptionDuration ?? '1' },
        {
          label: 'Subscription For',
          value: payment?.subscriptionFor || DEFAULT_SUBSCRIPTION_FOR,
        },
        { label: 'Timings', value: payment?.timings ?? '—' },
        { label: 'Basic Fees', value: payment?.basicFee ?? 0 },
        { label: 'Locker Reservation Fee', value: payment?.lockerFee ?? 0 },
        { label: 'Seat Reservation Fee', value: payment?.seatFee ?? 0 },
        {
          label: 'Next Payment Date',
          value: payment?.nextPaymentDate ? (
            <Box sx={{ fontWeight: 'bold' }}>
              {formatFirebaseTimestamp(payment.nextPaymentDate)}
            </Box>
          ) : (
            'N/A'
          ),
        },
        {
          label: 'Payment Method',
          value: payment?.paymentBy ?? 'CASH',
        },
      ]),
      canDelete: payments.length > 1,
      icon: <ThumbUpAltOutlined />,
      color: 'success',
    }));
  }, [payments]);

  const handleClickCancel = () => {
    reset(billingDefaults());
    setSelectedPayment(null);
    setAllowZeroBasicFee(false);
  };

  // We don't erase the payment. We mark it deleted:true and hide it everywhere,
  // so it can be brought back if someone deletes the wrong one.
  const confirmDeletePayment = async () => {
    const target = paymentPendingDelete;
    setPaymentPendingDelete(null);
    if (!target?.id) return;
    setLoading(true);
    try {
      await firebaseContext.editSubCollectionInFireStore(
        `students/${student.id}`,
        'monthlyBilling',
        target.id,
        { deleted: true, deletedAt: new Date().toISOString() }
      );
      showSnackbar({ severity: 'success', message: 'Payment Deleted Successfully!' });
      if (selectedPayment?.id === target.id) handleClickCancel();
      await fetchPaymentDetails();
      fetchStudentData?.(serverFilters);
    } catch (err) {
      showSnackbar({ severity: 'error', message: err?.message ?? 'Failed to delete payment' });
    } finally {
      setLoading(false);
    }
  };

  const submit = async (values) => {
    values = { ...values, basicFee: Number(values.basicFee || 0) };
    const monthlyBilling = {
      ...values,
      nextPaymentDate: nextPaymentDate,
    };
    setLoading(true);
    if (selectedPayment?.id) {
      await firebaseContext
        .editSubCollectionInFireStore(
          `students/${student.id}`,
          'monthlyBilling',
          selectedPayment.id,
          {
            ...values,
          }
        )
        .then(() => {
          setLoading(false);
          showSnackbar({ severity: 'success', message: 'Payment Edit Successfully!' });
          fetchPaymentDetails();
          fetchStudentData?.(serverFilters);
          handleClickCancel();
        })
        .catch((err) => {
          setLoading(false);
          showSnackbar({ severity: 'error', message: err.message || 'Failed to edit payment' });
        });
    } else {
      // add form
      await firebaseContext
        .makeSubCollectionInFireStore(`students/${student.id}`, 'monthlyBilling', {
          ...monthlyBilling,
          studentId: student.id,
        })
        .then(() => {
          setLoading(false);
          showSnackbar({ severity: 'success', message: 'Payment Added Successfully!' });
          fetchPaymentDetails();
          fetchStudentData?.(serverFilters);
          reset();
        })
        .catch((err) => {
          setLoading(false);
          showSnackbar({ severity: 'error', message: err.message || 'Failed to add payment' });
        });
    }
  };

  const handlePaymentReminder = () => {
    const number = student?.phoneNumber ?? student?.phoneNumber2;
    if (!number) {
      showSnackbar({ severity: 'error', message: 'Phone Number not found.' });
      return;
    }
    if (!payments[0]?.nextPaymentDate) {
      showSnackbar({ severity: 'error', message: 'No payment history for this student.' });
      return;
    }
    const text = `Hi, Sweet Payment Reminder from Shivaay Library & Co-working for date: ${formatFirebaseTimestamp(
      payments[0].nextPaymentDate
    )}`;
    sendMessageOnWhatsApp(number, text);
  };

  const openEditForm = (payment) => {
    setSelectedPayment(payment);
    setSkipNextPaymentDateUpdate(true);
    setAllowZeroBasicFee(Number(payment?.basicFee ?? 0) === 0);
    reset({
      subscriptionType: payment?.subscriptionType ?? 'month',
      subscriptionDuration: payment?.subscriptionDuration ?? 1,
      subscriptionFor: payment?.subscriptionFor || DEFAULT_SUBSCRIPTION_FOR,
      timings: payment?.timings ?? student?.timings ?? defaultMonthlyPaymentSchema.timings,
      paymentBy: payment?.paymentBy ?? 'CASH',
      nextPaymentDate: payment?.nextPaymentDate,
      paymentDate: payment?.paymentDate,
      basicFee: payment?.basicFee ?? 0,
      seatFee: payment?.seatFee ?? 0,
      lockerFee: payment?.lockerFee ?? 0,
    });
  };

  const addPaymentSection = (
    <Box sx={{ mt: 2 }}>
      <form onSubmit={handleSubmit(submit)} noValidate>
        <Grid container size={24} spacing={2}>
          <Grid item size={{ xs: 6, sm: 4 }}>
            <Typography sx={labelSx}>Subscription Type</Typography>
            <Controller
              name="subscriptionType"
              control={control}
              rules={{ required: 'Subscription type is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  size="small"
                  placeholder="Select type"
                  error={!!errors?.subscriptionType}
                  helperText={errors?.subscriptionType?.message || ''}
                >
                  <MenuItem value="month">Month</MenuItem>
                  <MenuItem value="year">Year</MenuItem>
                </TextField>
              )}
            />
          </Grid>
          <Grid item size={{ xs: 6, sm: 4 }}>
            <Typography sx={labelSx}>Subscription Duration</Typography>
            <Controller
              name="subscriptionDuration"
              control={control}
              defaultValue={1}
              rules={{
                required: 'Duration is required',
                validate: (v) => {
                  const num = Number(v);
                  if (!num || Number.isNaN(num)) return 'Enter a valid number';
                  if (subType === 'year') {
                    if (num < 1 || num > 12) return 'For yearly, duration must be 1–12 (years)';
                  } else if (subType === 'month') {
                    if (num < 1 || num > 31) return 'For monthly, duration must be 1–31 (months)';
                  } else {
                    return 'Select subscription type first';
                  }
                  return true;
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  placeholder="e.g., 1, 2, 3"
                  fullWidth
                  size="small"
                  error={!!errors?.subscriptionDuration}
                  helperText={errors?.subscriptionDuration?.message || ''}
                />
              )}
            />
          </Grid>
          <Grid item size={{ xs: 6, sm: 4 }}>
            <Typography sx={labelSx}>Subscription For</Typography>
            <Controller
              name="subscriptionFor"
              control={control}
              rules={{ required: 'Subscription for is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  size="small"
                  error={!!errors?.subscriptionFor}
                  helperText={errors?.subscriptionFor?.message || ''}
                >
                  {SUBSCRIPTION_FOR.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
          <Grid item size={{ xs: 6, sm: 4 }}>
            <Typography sx={labelSx}>Timings</Typography>
            <Controller
              name="timings"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  placeholder="6 hours"
                  fullWidth
                  size="small"
                  error={!!errors?.timings}
                  helperText={errors?.timings?.message || ''}
                />
              )}
            />
          </Grid>
          <Grid item size={{ xs: 6, sm: 4 }}>
            <Typography sx={labelSx}>Payment Method</Typography>
            <Controller
              name="paymentBy"
              control={control}
              rules={{ required: 'Please select a payment method' }}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  size="small"
                  // placeholder="Select type"
                  value={field.value} // ensures it's empty by default
                  error={!!error}
                  helperText={error ? error.message : ''}
                  SelectProps={{
                    displayEmpty: true,
                    renderValue: (selected) => {
                      // show "Select type" when empty
                      if (!selected) {
                        return <>Select type</>;
                      }
                      // optionally map value to label (if you prefer label text instead of raw value)
                      return selected;
                    },
                  }}
                >
                  {/* <MenuItem value="">Select type</MenuItem> optional default option */}
                  <MenuItem value="CASH">Cash</MenuItem>
                  <MenuItem value="ONLINE">Online</MenuItem>
                </TextField>
              )}
            />
          </Grid>

          <Grid item size={{ xs: 12, sm: 6, md: 4 }}>
            <Typography sx={labelSx}>Basic Fee</Typography>
            <Controller
              name="basicFee"
              control={control}
              rules={basicFeeRules(allowZeroBasicFee)}
              render={({ field }) => (
                <TextField
                  {...field}
                  placeholder="e.g., 500"
                  fullWidth
                  size="small"
                  error={!!errors?.basicFee}
                  helperText={errors?.basicFee?.message || ''}
                />
              )}
            />
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={allowZeroBasicFee}
                  onChange={(e) => setAllowZeroBasicFee(e.target.checked)}
                />
              }
              label="Allow Zero basic fees"
              slotProps={{ typography: { fontSize: 13 } }}
            />
          </Grid>
          <Grid item size={{ xs: 12, sm: 6, md: 4 }}>
            <Typography sx={labelSx}>Seat Reservation Fee</Typography>
            <Controller
              name="seatFee"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  placeholder="e.g.,100"
                  fullWidth
                  size="small"
                  error={!!errors?.seatFee}
                  helperText={errors?.seatFee?.message || ''}
                />
              )}
            />
          </Grid>
          <Grid item size={{ xs: 12, sm: 6, md: 4 }}>
            <Typography sx={labelSx}>Locker Reservation Fee</Typography>
            <Controller
              name="lockerFee"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  placeholder="e.g., 100"
                  fullWidth
                  size="small"
                  error={!!errors?.lockerFee}
                  helperText={errors?.lockerFee?.message || ''}
                />
              )}
            />
          </Grid>
          <Grid item size={{ xs: 6, sm: 6 }}>
            <Typography sx={labelSx}>Payment Date</Typography>
            <Controller
              name="paymentDate"
              control={control}
              rules={{ required: 'Payment date required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="date"
                  fullWidth
                  size="small"
                  error={!!errors.paymentDate}
                  helperText={errors.paymentDate?.message || ''}
                />
              )}
            />
          </Grid>
          <Grid item size={{ xs: 6, sm: 6 }}>
            <Typography sx={{ ...labelSx, color: 'red' }}>Next Payment Date</Typography>
            <Controller
              name="nextPaymentDate"
              control={control}
              rules={{ required: 'Next payment date required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="date"
                  fullWidth
                  size="small"
                  error={!!errors.nextPaymentDate}
                  helperText={errors.nextPaymentDate?.message || ''}
                />
              )}
            />
          </Grid>
          <Grid item size={24} sx={{ color: 'red' }}>
            {nextPaymentDate
              ? `Note: Next payment will be due on ${formatDate(nextPaymentDate)}.`
              : 'Note: Next payment date will appear after selecting type, duration, and Payment Date.'}
          </Grid>
          <Grid item size={24} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            {selectedPayment?.id ? (
              <CustomButton
                variant="contained"
                disabled={loading}
                loading={loading}
                colorType={'danger'}
                onClick={() => handleClickCancel()}
              >
                {loading ? 'Loading...' : 'Cancel'}
              </CustomButton>
            ) : null}
            &nbsp;
            <CustomButton type="submit" variant="contained" disabled={loading} loading={loading}>
              {loading ? 'Loading...' : selectedPayment?.id ? 'Edit Payment' : 'Add Payment'}
            </CustomButton>
          </Grid>
        </Grid>
      </form>
    </Box>
  );

  return (
    <Fragment>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{ sx: { width: { xs: '92%', sm: 480, md: 680 } } }}
      >
        <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header Starts */}
          <Box
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Box>
                <Typography variant="h6">{'Payment Details'}</Typography>
                <Typography
                  variant="title1"
                  color="text.primary"
                  sx={{ pl: 1, textTransform: 'capitalize', fontWeight: 'bold' }}
                >
                  {student.studentName || 'Unknown Student.'}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <Tooltip
                title={`Send Payment Reminder for ${
                  payments[0]?.nextPaymentDate
                    ? formatFirebaseTimestamp(payments[0].nextPaymentDate)
                    : '-Date Not Found-'
                }`}
              >
                <IconButton onClick={() => handlePaymentReminder()} aria-label="close">
                  <WhatsApp color="primary" />
                </IconButton>
              </Tooltip>
              <IconButton onClick={onClose} aria-label="close">
                <Close />
              </IconButton>
            </Stack>
          </Box>
          {/* Header Ends */}
          {/* Body Starts */}
          {/* Form Starts  */}
          {addPaymentSection}
          {/* Form Ends  */}
          {/* Payment History Starts  */}
          <Box>
            {loading ? (
              <LinearProgress sx={{ my: 2 }} />
            ) : (
              <CustomDynamicTimeline
                events={getPaymentStatusList()}
                onEditClick={openEditForm}
                onDeleteClick={setPaymentPendingDelete}
              />
            )}
          </Box>
          {/* Payment History Ends  */}
          {/* Body Ends */}
        </Box>
      </Drawer>

      <Dialog open={!!paymentPendingDelete} onClose={() => setPaymentPendingDelete(null)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmber color="error" />
          Are you sure you want to delete this payment?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            The payment recorded on{' '}
            <strong>
              {paymentPendingDelete?.paymentDate
                ? formatDate(paymentPendingDelete.paymentDate)
                : formatFirebaseTimestamp(paymentPendingDelete?.createdAt)}
            </strong>{' '}
            will be removed from this student&apos;s history and from all revenue totals.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentPendingDelete(null)}>No, keep it</Button>
          <Button color="error" variant="contained" onClick={confirmDeletePayment}>
            Yes, delete
          </Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  );
};
