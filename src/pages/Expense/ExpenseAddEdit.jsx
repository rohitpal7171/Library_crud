import { useEffect, useState } from 'react';
import { useFirebase } from '../../context/Firebase';
import { useSnackbar } from '../../components/customComponents/CustomNotifications';
import { Close } from '@mui/icons-material';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Grid,
  Typography,
  TextField,
  MenuItem,
} from '@mui/material';
import { Controller, useForm, useWatch } from 'react-hook-form';
import CustomButton from '../../components/customComponents/CustomButton';
import { defaultExpenseSchemaValues, expenseType } from '../../utils/utils';

const ExpenseAddEdit = ({ open, onClose, editData, type = 'ADD', fetchData }) => {
  const { control, handleSubmit, reset, setValue, formState } = useForm({
    defaultValues: defaultExpenseSchemaValues,
  });
  const { errors } = formState;
  const selectedExpenseType = useWatch({
    control,
    name: 'expenseType',
  });

  const [formLoading, setFormLoading] = useState(false);

  const firebaseContext = useFirebase();
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    if (selectedExpenseType !== expenseType.Miscellaneous) {
      setValue('miscellaneous', '');
    }
  }, [selectedExpenseType, setValue]);

  useEffect(() => {
    if (type === 'EDIT' && editData) {
      reset({ ...defaultExpenseSchemaValues, ...editData });
    } else {
      reset(defaultExpenseSchemaValues);
    }
  }, [type, editData, reset]);

  const handleClose = () => {
    // remove focus from any active element to avoid aria-hidden on focused element
    //   if (document.activeElement && typeof document.activeElement.blur === 'function') {
    //     document.activeElement.blur();
    //   }

    // reset form values and files
    //   reset(defaultSchemaValues);
    //   setFiles([]);

    // propagate close
    onClose && onClose();
  };

  const submit = async (data) => {
    setFormLoading(true);

    if (type === 'ADD') {
      // hello add
      firebaseContext
        .createDataInFireStore('expenses', data, 'expenseId')
        .then(async () => {
          setFormLoading(false);
          showSnackbar({ severity: 'success', message: 'Expense Added Successfully!' });
          fetchData();
          handleClose();
        })
        .catch((err) => {
          setFormLoading(false);
          showSnackbar({ severity: 'error', message: err?.message ?? 'Error Adding Expense!' });
        });
    } else if (type === 'EDIT') {
      firebaseContext
        .updateDocument('expenses', data.id, data)
        .then(() => {
          setFormLoading(false);
          fetchData();
          showSnackbar({ severity: 'success', message: 'Expense Updated Successfully!' });
          handleClose();
        })
        .catch((err) => {
          setFormLoading(false);
          showSnackbar({ severity: 'error', message: err?.message ?? 'Error Updating Expense!' });
        });
    }
  };

  // small layout helpers
  const labelSx = { fontSize: 13, fontWeight: 600, mb: 0.5 };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      disableEnforceFocus
      disableAutoFocus
      disableRestoreFocus
    >
      <DialogTitle id="scroll-dialog-title" sx={{ pr: 6, fontWeight: 700 }}>
        {type === 'EDIT' ? 'Edit Expense' : 'Add Expense'}
      </DialogTitle>
      <IconButton
        aria-label="close"
        onClick={() => handleClose()}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: (t) => t.palette.grey[500],
        }}
      >
        <Close />
      </IconButton>
      <form onSubmit={handleSubmit(submit)} noValidate>
        <DialogContent
          sx={{
            pl: 5,
            pr: 5,
            pt: 1,
            pb: 1,
          }}
          dividers
        >
          <Grid container spacing={3}>
            <Grid item size={{ xs: 24 }}>
              <Typography sx={labelSx}>Expense Type</Typography>
              <Controller
                name="expenseType"
                control={control}
                rules={{ required: 'Expense type is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    size="small"
                    placeholder="Select type"
                    error={!!errors?.expenseType}
                    helperText={errors?.expenseType?.message || ''}
                  >
                    {Object.values(expenseType).map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            {selectedExpenseType === expenseType.Miscellaneous && (
              <Grid item size={{ xs: 24 }}>
                <Typography sx={labelSx}>Specify Miscellaneous</Typography>
                <Controller
                  name="miscellaneous"
                  control={control}
                  rules={{
                    required: 'Please specify the miscellaneous expense',
                    minLength: { value: 2, message: 'Must be at least 2 characters' },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., Staff Snacks, Printer Ink, etc."
                      fullWidth
                      size="small"
                      error={!!errors?.miscellaneous}
                      helperText={errors?.miscellaneous?.message || ''}
                    />
                  )}
                />
              </Grid>
            )}

            <Grid item size={{ xs: 24 }}>
              <Typography sx={labelSx}>Expense Paid</Typography>
              <Controller
                name="expensePaid"
                control={control}
                rules={{
                  required: 'Expense paid is required',
                  validate: (v) => Number(v) > 0 || 'Must be greater than 0',
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    placeholder="e.g., 500"
                    fullWidth
                    size="small"
                    error={!!errors?.expensePaid}
                    helperText={errors?.expensePaid?.message || ''}
                  />
                )}
              />
            </Grid>

            <Grid item size={{ xs: 24 }}>
              <Typography sx={labelSx}>Date of Expense</Typography>
              <Controller
                name="expenseDate"
                control={control}
                rules={{ required: 'Date of expense is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="date"
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.expenseDate}
                    helperText={errors.expenseDate?.message || ''}
                  />
                )}
              />
            </Grid>

            <Grid item size={{ xs: 24 }}>
              <Typography sx={labelSx}>Payment Method</Typography>
              <Controller
                name="expensePaymentMethod"
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
          </Grid>
        </DialogContent>
        <DialogActions
          sx={{
            position: 'sticky',
            bottom: 0,
            backgroundColor: 'background.paper',
            borderTop: (theme) => `1px solid ${theme.palette.divider}`,
            px: 3,
            py: 2,
            zIndex: 1,
          }}
        >
          <CustomButton variant="outlined" colorType="danger" onClick={() => handleClose()}>
            Close
          </CustomButton>

          <CustomButton
            type="submit"
            variant="contained"
            disabled={formLoading}
            loading={formLoading}
          >
            {type === 'EDIT' ? 'Update Expense' : 'Add Expense'}
          </CustomButton>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ExpenseAddEdit;
