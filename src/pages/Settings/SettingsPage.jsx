import { Fragment, useCallback, useEffect, useState } from 'react';
import { Box, Grid, LinearProgress, Paper, Tab, Tabs, TextField, Typography } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { useFirebase } from '../../context/Firebase';
import { useSnackbar } from '../../components/customComponents/CustomNotifications';
import CustomButton from '../../components/customComponents/CustomButton';
import {
  DEFAULT_RECEIPT_PREFIX,
  DEFAULT_RECEIPT_SETTINGS,
  defaultBoxPadding,
  labelSx,
} from '../../utils/utils';

const SettingsPage = () => {
  const firebaseContext = useFirebase();
  const { showSnackbar } = useSnackbar();

  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminId, setAdminId] = useState(null);
  // What the counter is on right now, so we can warn about reusing a spent number.
  const [currentNext, setCurrentNext] = useState(null);
  // A failed load must block saving — writing over live numbering with guessed values
  // would re-issue receipt numbers students already hold.
  const [loadError, setLoadError] = useState(false);

  const { control, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      ...DEFAULT_RECEIPT_SETTINGS,
      receiptPrefix: DEFAULT_RECEIPT_PREFIX,
      nextReceiptNumber: 1,
    },
  });

  const nextReceiptNumber = watch('nextReceiptNumber');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [admin, sequence] = await Promise.all([
        firebaseContext.firebaseGetAdminData(),
        firebaseContext.getReceiptNumbering(),
      ]);

      setAdminId(admin?.id ?? null);
      // null means the counter has never been written. A read failure throws instead,
      // so we can never show 1 here and let a Save reset live numbering.
      const next = sequence?.next ?? 1;
      setCurrentNext(next);

      reset({
        ...DEFAULT_RECEIPT_SETTINGS,
        ...(admin?.receipt ?? {}),
        receiptPrefix: sequence?.prefix || DEFAULT_RECEIPT_PREFIX,
        nextReceiptNumber: next,
      });
      setLoadError(false);
    } catch (err) {
      // Blank the counter so Save is blocked rather than writing a guessed value.
      setCurrentNext(null);
      setLoadError(true);
      showSnackbar({
        severity: 'error',
        message: err?.message ?? 'Could not load receipt settings',
      });
    } finally {
      setLoading(false);
    }
  }, [firebaseContext, reset, showSnackbar]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async ({ receiptPrefix, nextReceiptNumber: next, ...receipt }) => {
    if (loadError) {
      showSnackbar({
        severity: 'error',
        message: 'Settings failed to load — reload before saving.',
      });
      return;
    }
    if (!adminId) {
      showSnackbar({ severity: 'error', message: 'No admin document found to save settings on.' });
      return;
    }
    setSaving(true);
    try {
      await firebaseContext.updateDocument('admin', adminId, { receipt });
      await firebaseContext.updateReceiptNumbering({
        next: Number(next),
        prefix: receiptPrefix,
      });
      showSnackbar({ severity: 'success', message: 'Receipt settings saved!' });
      await load();
    } catch (err) {
      showSnackbar({ severity: 'error', message: err?.message ?? 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const numberGoesBackwards =
    currentNext !== null &&
    nextReceiptNumber !== '' &&
    Number(nextReceiptNumber) < Number(currentNext);

  return (
    <Fragment>
      <Box sx={{ p: defaultBoxPadding }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Settings
        </Typography>

        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Tabs
            value={tab}
            onChange={(_, value) => setTab(value)}
            sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}
          >
            <Tab label="Receipt Info" sx={{ textTransform: 'none', fontWeight: 600 }} />
          </Tabs>

          {loading && <LinearProgress />}

          <Box sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              These details print on every fee receipt. The logo comes from the profile picture in
              the header.
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 8 }}>
                <Typography sx={labelSx}>Address</Typography>
                <Controller
                  name="address"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth size="small" multiline minRows={2} />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Typography sx={labelSx}>Email</Typography>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => <TextField {...field} fullWidth size="small" />}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Typography sx={labelSx}>Contact Numbers</Typography>
                <Controller
                  name="phones"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size="small"
                      helperText="Printed as-is, e.g. 9810433369 / 8527688876"
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Typography sx={labelSx}>Receipt Number Prefix</Typography>
                <Controller
                  name="receiptPrefix"
                  control={control}
                  rules={{ required: 'Prefix is required' }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size="small"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message || 'e.g. SLCOW_'}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Typography sx={labelSx}>Next Receipt Number</Typography>
                <Controller
                  name="nextReceiptNumber"
                  control={control}
                  rules={{
                    required: 'Required',
                    validate: (v) =>
                      (Number.isInteger(Number(v)) && Number(v) >= 1) ||
                      'Must be a whole number of 1 or more',
                  }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      type="number"
                      inputProps={{ min: 1, step: 1 }}
                      fullWidth
                      size="small"
                      error={!!fieldState.error || numberGoesBackwards}
                      helperText={
                        fieldState.error?.message ||
                        (numberGoesBackwards
                          ? `Lower than the current ${currentNext} — numbers already issued can repeat.`
                          : 'The number the next receipt will use.')
                      }
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography sx={labelSx}>Important Terms &amp; Conditions</Typography>
                <Controller
                  name="terms"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size="small"
                      multiline
                      minRows={6}
                      helperText="One bullet per line."
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', gap: 1.5, mt: 3 }}>
              <CustomButton
                onClick={handleSubmit(submit)}
                loading={saving}
                disabled={loading || loadError}
              >
                Save
              </CustomButton>
              <CustomButton variant="outlined" colorType="neutral" onClick={load} disabled={saving}>
                Reset
              </CustomButton>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Fragment>
  );
};

export default SettingsPage;
