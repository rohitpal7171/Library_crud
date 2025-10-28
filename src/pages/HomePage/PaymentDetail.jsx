import { Fragment, useCallback, useEffect, useState } from 'react';
import { useFirebase } from '../../context/Firebase';
import { useSnackbar } from '../../components/customComponents/CustomNotifications';
import {
  Box,
  Drawer,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  ListItem,
  ListItemText,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Close, ThumbUpAltOutlined } from '@mui/icons-material';
import CustomDynamicTimeline from '../../components/customComponents/CustomDynamicTimeline';
import {
  computeNextPaymentDate,
  defaultMonthlyPaymentSchema,
  formatDate,
  formatFirebaseTimestamp,
  labelSx,
} from '../../utils/utils';
import { useForm, Controller } from 'react-hook-form';
import CustomButton from '../../components/customComponents/CustomButton';

export const PaymentDetail = ({ open, onClose, student = {}, fetchStudentData, serverFilters }) => {
  const firebaseContext = useFirebase();
  const { showSnackbar } = useSnackbar();
  const { control, handleSubmit, reset, watch, formState } = useForm({
    defaultValues: {
      ...defaultMonthlyPaymentSchema,
      paymentDate: '',
    },
  });
  const { errors } = formState;

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const subType = watch('subscriptionType');
  const subDuration = watch('subscriptionDuration');
  const paymentDate = watch('paymentDate');

  const startDate = paymentDate ? new Date(paymentDate) : null;
  const nextDue = computeNextPaymentDate(startDate, subType, subDuration);

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
      title: formatFirebaseTimestamp(payment.createdAt),
      description: renderDescription([
        { label: 'Subscription Type', value: payment?.subscriptionType ?? 'month' },
        { label: 'Subscription Duration', value: payment?.subscriptionDuration ?? '1' },
        { label: 'Basic Fees', value: payment?.basicFee ?? 0 },
        { label: 'Locker Fees', value: payment?.lockerFee ?? 0 },
        { label: 'Seat Fees', value: payment?.seatFee ?? 0 },
        {
          label: 'Next Payment Date',
          value: payment?.nextPaymentDate
            ? formatFirebaseTimestamp(payment.nextPaymentDate)
            : 'N/A',
        },
      ]),
      icon: <ThumbUpAltOutlined />,
      color: 'success',
    }));
  }, [payments]);

  const submit = async (values) => {
    const monthlyBilling = {
      ...values,
      nextPaymentDate: nextDue,
    };
    setLoading(true);
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
  };

  const addPaymentSection = (
    <Box sx={{ mt: 2 }}>
      <form onSubmit={handleSubmit(submit)} noValidate>
        <Grid container size={24} spacing={2}>
          <Grid item size={{ xs: 12, sm: 6 }}>
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
          <Grid item size={{ xs: 12, sm: 6 }}>
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
          <Grid item size={{ xs: 12, sm: 6 }}>
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
          <Grid item size={{ xs: 12, sm: 6 }}>
            <Typography sx={labelSx}>Basic Fee</Typography>
            <Controller
              name="basicFee"
              control={control}
              rules={{
                required: 'Basic fee is required',
                validate: (v) => Number(v) > 0 || 'Must be greater than 0',
              }}
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
          </Grid>
          <Grid item size={{ xs: 12, sm: 6 }}>
            <Typography sx={labelSx}>Seat Fee</Typography>
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
          <Grid item size={{ xs: 12, sm: 6 }}>
            <Typography sx={labelSx}>Locker Fee</Typography>
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
          <Grid item size={24} sx={{ color: 'red' }}>
            {nextDue
              ? `Note: Next payment will be due on ${formatDate(nextDue)}.`
              : 'Note: Next payment date will appear after selecting type, duration, and Payment Date.'}
          </Grid>
          <Grid item size={24} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <CustomButton type="submit" variant="contained" disabled={loading} loading={loading}>
              {loading ? 'Loading...' : 'Add Payment'}
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
                <Typography variant="body2" color="text.secondary">
                  {student.studentName || 'Unknown Student.'}
                </Typography>
              </Box>
            </Stack>

            <IconButton onClick={onClose} aria-label="close">
              <Close />
            </IconButton>
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
              <CustomDynamicTimeline events={getPaymentStatusList()} />
            )}
          </Box>
          {/* Payment History Ends  */}
          {/* Body Ends */}
        </Box>
      </Drawer>
    </Fragment>
  );
};
