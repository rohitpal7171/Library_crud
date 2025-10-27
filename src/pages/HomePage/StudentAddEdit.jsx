import { useEffect, useState } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Grid,
  TextField,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  Button,
  Typography,
  InputAdornment,
  Chip,
  MenuItem,
} from '@mui/material';
import { Close, CalendarToday, UploadFile } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useFirebase } from '../../context/Firebase';
import CustomButton from '../../components/customComponents/CustomButton';
import { useSnackbar } from '../../components/customComponents/CustomNotifications';
import { uploadToCloudinary } from '../../database/fileStorage/cloudinary';
import { computeNextPaymentDate, defaultSchemaValues, formatDate } from '../../utils/utils';

const MAX_FILES = 5;

const StudentAddEdit = ({
  open,
  onClose,
  editData,
  type = 'ADD',
  fetchStudentData,
  serverFilters,
}) => {
  const { control, handleSubmit, reset, setValue, watch, formState } = useForm({
    defaultValues: defaultSchemaValues,
  });
  const { errors } = formState;
  const [files, setFiles] = useState([]);
  const [formLoading, setFormLoading] = useState(false);

  const firebaseContext = useFirebase();

  const { showSnackbar } = useSnackbar();

  const seatReservedValue = watch('seatReserved');
  const lockerValue = watch('locker');
  const subType = watch('monthlyBilling.subscriptionType');
  const subDuration = watch('monthlyBilling.subscriptionDuration');
  const dateOfJoining = watch('dateOfJoining');

  const startDate = dateOfJoining ? new Date(dateOfJoining) : null;
  const nextDue = computeNextPaymentDate(startDate, subType, subDuration);

  // prefill for edit
  useEffect(() => {
    if (type === 'EDIT') {
      // make sure editData keys match defaultValues
      reset({ ...defaultSchemaValues, ...editData });
      // if editData has documents, set them into preview
      // if (editData.documents) setFiles(editData.documents || []);
    } else {
      reset(defaultSchemaValues);
      setFiles([]);
    }
  }, [type, editData, reset]);

  // keep react-hook-form documents field in sync
  useEffect(() => {
    setValue('documents', files);
  }, [files, setValue]);

  const handleFilesPicked = (event) => {
    const picked = Array.from(event.target.files || []);
    const newFiles = [...files, ...picked].slice(0, MAX_FILES);
    setFiles(newFiles);
    // clear input value (so same file can be picked again if removed)
    event.target.value = '';
  };

  const removeFile = (index) => {
    setFiles((f) => f.filter((_, i) => i !== index));
  };

  // central close handler: blur active element, reset form + files, then call onClose
  const handleClose = () => {
    // remove focus from any active element to avoid aria-hidden on focused element
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }

    // reset form values and files
    reset(defaultSchemaValues);
    setFiles([]);

    // propagate close
    onClose && onClose();
  };

  const submit = async (data) => {
    setFormLoading(true);

    if (type === 'ADD') {
      const modifiedData = {
        ...data,
        documents: [],
        monthlyBilling: {
          ...data.monthlyBilling,
          nextPaymentDate: nextDue,
        },
      };
      firebaseContext
        .createDataInFireStore('students', modifiedData)
        .then(async (response) => {
          if (files?.length) {
            let generatedDataId = response?.data?.id;
            if (!generatedDataId)
              return showSnackbar({ severity: 'error', message: 'Error Generating Student ID!' });
            const uploadPromises = Array.from(files).map(async (file) => {
              const result = await uploadToCloudinary(
                file,
                `students/documents/${generatedDataId}`
              );
              const url = result?.secure_url ?? result?.url;
              return {
                originalName: file.name,
                url,
                mimeType: file.type,
                size: file.size,
                uploadedAt: new Date().toISOString(),
              };
            });

            const uploadedFilesURL = await Promise.all(uploadPromises);
            firebaseContext
              .updateDocument('students', generatedDataId, { documents: uploadedFilesURL })
              .then(() => {
                setFormLoading(false);
                fetchStudentData?.(serverFilters);
                showSnackbar({ severity: 'success', message: 'Student Added Successfully!' });
                handleClose();
              })
              .catch((err) => {
                showSnackbar({
                  severity: 'error',
                  message: err?.message ?? 'Error Uploading Documents!',
                });
              });
          } else {
            setFormLoading(false);
            fetchStudentData?.(serverFilters);
            showSnackbar({ severity: 'success', message: 'Student Added Successfully!' });
            handleClose();
          }
        })
        .catch((err) => {
          setFormLoading(false);
          showSnackbar({ severity: 'error', message: err?.message ?? 'Error Adding Student!' });
        });
    } else if (type === 'EDIT') {
      // eslint-disable-next-line no-unused-vars
      const { documents, monthlyBilling, ...restData } = data;
      firebaseContext
        .updateDocument('students', data.id, restData)
        .then(() => {
          setFormLoading(false);
          fetchStudentData?.(serverFilters);
          showSnackbar({ severity: 'success', message: 'Student Updated Successfully!' });
          handleClose();
        })
        .catch((err) => {
          console.log(err);
          setFormLoading(false);
          showSnackbar({ severity: 'error', message: err?.message ?? 'Error Updating Student!' });
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
      maxWidth="lg"
      disableEnforceFocus
      disableAutoFocus
      disableRestoreFocus
    >
      <DialogTitle id="scroll-dialog-title" sx={{ pr: 6, fontWeight: 700 }}>
        {type === 'EDIT' ? 'Edit Student' : 'Add Student'}
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
          <Grid container spacing={2}>
            {/* Row 1 */}
            <Grid item size={{ xs: 12, sm: 6 }}>
              <Typography sx={labelSx}>Student Name</Typography>
              <Controller
                name="studentName"
                control={control}
                rules={{ required: 'Student name required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    placeholder="e.g., Riya Sharma"
                    fullWidth
                    size="small"
                    error={!!errors.studentName}
                    helperText={errors.studentName?.message || ''}
                  />
                )}
              />
            </Grid>

            <Grid item size={{ xs: 12, sm: 6 }}>
              <Typography sx={labelSx}>Father Name</Typography>
              <Controller
                name="fatherName"
                control={control}
                // rules={{ required: 'Father name required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    placeholder="e.g., Rajesh Sharma"
                    fullWidth
                    size="small"
                    error={!!errors.fatherName}
                    helperText={errors.fatherName?.message || ''}
                  />
                )}
              />
            </Grid>

            {/* Row 2 */}
            <Grid item size={{ xs: 12, sm: 6 }}>
              <Typography sx={labelSx}>Date of Birth</Typography>
              <Controller
                name="dateOfBirth"
                control={control}
                // rules={{ required: 'Date of birth required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="date"
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <CalendarToday fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    error={!!errors.dateOfBirth}
                    helperText={errors.dateOfBirth?.message || ''}
                  />
                )}
              />
            </Grid>

            <Grid item size={{ xs: 12, sm: 6 }}>
              <Typography sx={labelSx}>Gender</Typography>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <RadioGroup row {...field}>
                    <FormControlLabel value="Male" control={<Radio size="small" />} label="Male" />
                    <FormControlLabel
                      value="Female"
                      control={<Radio size="small" />}
                      label="Female"
                    />
                  </RadioGroup>
                )}
              />
            </Grid>

            {/* Row 3 */}
            <Grid item size={{ xs: 12, sm: 6 }}>
              <Typography sx={labelSx}>Date of Joining</Typography>
              <Controller
                name="dateOfJoining"
                control={control}
                rules={{ required: 'Date of joining required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="date"
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <CalendarToday fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    error={!!errors.dateOfJoining}
                    helperText={errors.dateOfJoining?.message || ''}
                  />
                )}
              />
            </Grid>

            <Grid item size={{ xs: 12, sm: 6 }}>
              <Typography sx={labelSx}>ID Proof - Aadhaar Number</Typography>
              <Controller
                name="aadhaarNumber"
                control={control}
                // rules={{
                //   // required: 'Aadhaar number is required',
                //   pattern: {
                //     value: /^[2-9]{1}[0-9]{11}$/,
                //     message: 'Enter a valid 12-digit Aadhaar number',
                //   },
                //   validate: {
                //     lengthCheck: (value) =>
                //       value.length === 12 || 'Aadhaar number must be 12 digits',
                //   },
                // }}
                rules={{
                  pattern: {
                    value: /^[2-9]{1}[0-9]{11}$/,
                    message: 'Enter a valid 12-digit Aadhaar number',
                  },
                  validate: (value) => {
                    if (!value) return true; // ✅ No Aadhaar entered — skip validation
                    if (!/^[2-9]{1}[0-9]{11}$/.test(value)) {
                      return 'Enter a valid 12-digit Aadhaar number';
                    }
                    if (value.length !== 12) {
                      return 'Aadhaar number must be 12 digits';
                    }
                    return true;
                  },
                }}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    placeholder="e.g., 123456789012"
                    fullWidth
                    size="small"
                    error={!!error}
                    helperText={error ? error.message : ''}
                    inputProps={{
                      maxLength: 12,
                      inputMode: 'numeric',
                      pattern: '[0-9]*',
                    }}
                  />
                )}
              />
            </Grid>

            {/* Row 4 */}
            <Grid item size={{ xs: 12, sm: 6 }}>
              <Typography sx={labelSx}>Phone Number</Typography>
              <Controller
                name="phoneNumber"
                control={control}
                rules={{
                  //   required: 'Phone number required',
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message: 'Enter a valid 10-digit number',
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    placeholder="e.g., 9876543210"
                    fullWidth
                    size="small"
                    error={!!errors.phoneNumber}
                    helperText={errors.phoneNumber?.message || 'Digits only'}
                  />
                )}
              />
            </Grid>

            <Grid item size={{ xs: 12, sm: 6 }}>
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
                    error={!!errors.timings}
                    helperText={errors.timings?.message || ''}
                  />
                )}
              />
            </Grid>

            {/* Row 5 - Seat Reserved */}
            <Grid item size={{ xs: 12, sm: 6 }} container alignItems="center">
              <Grid item size={{ xs: 6 }}>
                <Controller
                  name="seatReserved"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Checkbox {...field} checked={!!field.value} />}
                      label="Seat Reserved"
                    />
                  )}
                />
              </Grid>
              {seatReservedValue && (
                <Grid item size={{ xs: 6 }}>
                  <Typography sx={labelSx}>Seat Number</Typography>
                  <Controller
                    name="seatNumber"
                    control={control}
                    // rules={{ required: 'Seat number required' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        placeholder="e.g., A-101"
                        fullWidth
                        size="small"
                        error={!!errors.seatNumber}
                        helperText={errors.seatNumber?.message || ''}
                      />
                    )}
                  />
                </Grid>
              )}
            </Grid>

            <Grid item size={{ xs: 12, sm: 6 }} container alignItems="center">
              <Grid item size={{ xs: 6 }}>
                <Controller
                  name="locker"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Checkbox {...field} checked={!!field.value} />}
                      label="Locker"
                    />
                  )}
                />
              </Grid>
              {lockerValue && (
                <Grid item size={{ xs: 6 }}>
                  <Typography sx={labelSx}>Locker Number</Typography>
                  <Controller
                    name="lockerNumber"
                    control={control}
                    // rules={{ required: 'Locker number required' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        placeholder="e.g., L-21"
                        fullWidth
                        size="small"
                        error={!!errors.lockerNumber}
                        helperText={errors.lockerNumber?.message || ''}
                      />
                    )}
                  />
                </Grid>
              )}
            </Grid>

            {/* Address */}
            <Grid item size={{ xs: 12 }}>
              <Typography sx={labelSx}>Address</Typography>
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    placeholder="Flat / Street, City, State, PIN"
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                  />
                )}
              />
            </Grid>

            {/* First Payment Section */}
            {type !== 'EDIT' && (
              <Grid container size={24}>
                <Grid item size={24}>
                  <Typography variant="subtitle1">Fees (First Payment)</Typography>
                </Grid>

                <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography sx={labelSx}>Subscription Type</Typography>
                  <Controller
                    name="monthlyBilling.subscriptionType"
                    control={control}
                    rules={{ required: 'Subscription type is required' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        select
                        fullWidth
                        size="small"
                        placeholder="Select type"
                        error={!!errors?.monthlyBilling?.subscriptionType}
                        helperText={errors?.monthlyBilling?.subscriptionType?.message || ''}
                      >
                        <MenuItem value="month">Month</MenuItem>
                        <MenuItem value="year">Year</MenuItem>
                      </TextField>
                    )}
                  />
                </Grid>
                <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography sx={labelSx}>Subscription Duration</Typography>
                  <Controller
                    name="monthlyBilling.subscriptionDuration"
                    control={control}
                    defaultValue={1}
                    rules={{
                      required: 'Duration is required',
                      validate: (v) => {
                        const num = Number(v);
                        if (!num || Number.isNaN(num)) return 'Enter a valid number';
                        if (subType === 'year') {
                          if (num < 1 || num > 12)
                            return 'For yearly, duration must be 1–12 (years)';
                        } else if (subType === 'month') {
                          if (num < 1 || num > 31)
                            return 'For monthly, duration must be 1–31 (months)';
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
                        error={!!errors?.monthlyBilling?.subscriptionDuration}
                        helperText={errors?.monthlyBilling?.subscriptionDuration?.message || ''}
                      />
                    )}
                  />
                </Grid>

                <Grid item size={{ xs: 12, sm: 6, md: 2 }}>
                  <Typography sx={labelSx}>Basic Fee</Typography>
                  <Controller
                    name="monthlyBilling.basicFee"
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
                        error={!!errors?.monthlyBilling?.basicFee}
                        helperText={errors?.monthlyBilling?.basicFee?.message || ''}
                      />
                    )}
                  />
                </Grid>
                {seatReservedValue && (
                  <Grid item size={{ xs: 12, sm: 6, md: 2 }}>
                    <Typography sx={labelSx}>Seat Fee</Typography>
                    <Controller
                      name="monthlyBilling.seatFee"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          placeholder="e.g.,100"
                          fullWidth
                          size="small"
                          error={!!errors?.monthlyBilling?.seatFee}
                          helperText={errors?.monthlyBilling?.seatFee?.message || ''}
                        />
                      )}
                    />
                  </Grid>
                )}
                {lockerValue && (
                  <Grid item size={{ xs: 12, sm: 6, md: 2 }}>
                    <Typography sx={labelSx}>Locker Fee</Typography>
                    <Controller
                      name="monthlyBilling.lockerFee"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          placeholder="e.g., 100"
                          fullWidth
                          size="small"
                          error={!!errors?.monthlyBilling?.lockerFee}
                          helperText={errors?.monthlyBilling?.lockerFee?.message || ''}
                        />
                      )}
                    />
                  </Grid>
                )}
                <Grid item size={24} sx={{ color: 'red' }}>
                  {nextDue
                    ? `Note: Next payment will be due on ${formatDate(nextDue)}.`
                    : 'Note: Next payment date will appear after selecting type, duration, and date of joining.'}
                </Grid>
              </Grid>
            )}

            {/* Upload Documents */}
            {type !== 'EDIT' && (
              <Grid item size={{ xs: 12 }}>
                <Typography sx={labelSx}>Upload Documents (max 5)</Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <input
                    id="doc-upload"
                    type="file"
                    multiple
                    // accept="image/*,application/pdf"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFilesPicked}
                  />
                  <label htmlFor="doc-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<UploadFile />}
                      size="small"
                    >
                      Choose Files
                    </Button>
                  </label>

                  <Typography variant="body2" sx={{ ml: 1 }}>
                    {files.length}/{MAX_FILES} selected
                  </Typography>
                </Box>

                <Box mt={1} display="flex" gap={1} flexWrap="wrap">
                  {files.map((f, i) => (
                    <Chip
                      key={i}
                      label={f.name || `File ${i + 1}`}
                      onDelete={() => removeFile(i)}
                      size="small"
                    />
                  ))}
                </Box>
              </Grid>
            )}
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
            {type === 'EDIT' ? 'Update Student' : 'Add Student'}
          </CustomButton>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default StudentAddEdit;
