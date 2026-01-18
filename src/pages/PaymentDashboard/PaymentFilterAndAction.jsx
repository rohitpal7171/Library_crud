import { Box, Typography } from '@mui/material';
import { defaultBoxPadding } from '../../utils/utils';
import CustomButton from '../../components/customComponents/CustomButton';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

const PaymentFilterAndAction = (props) => {
  const { applyFilter, clientFilters, setClientFilters, resetFilters } = props;
  const handleApplyFilter = () => {
    applyFilter();
  };

  const handleResetFilter = () => {
    resetFilters();
  };

  return (
    <Box sx={{ flexGrow: 1, p: defaultBoxPadding }}>
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          transition: 'all 240ms ease-in-out',
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: '500' }}>
            Payments
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: {
              xs: 'flex-start',
              sm: 'flex-end',
            },
            width: {
              xs: '100%',
              sm: 'auto',
            },
            gap: 2,
          }}
        >
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DemoContainer components={['DatePicker', 'DatePicker']}>
              <DatePicker
                label="Start Payment Date"
                value={clientFilters.startPaymentDate}
                onChange={(newValue) =>
                  setClientFilters({ ...clientFilters, startPaymentDate: newValue })
                }
              />
              <DatePicker
                label="End Payment Date"
                value={clientFilters.endPaymentDate}
                onChange={(newValue) =>
                  setClientFilters({ ...clientFilters, endPaymentDate: newValue })
                }
              />
            </DemoContainer>
          </LocalizationProvider>

          <CustomButton
            onClick={() => handleApplyFilter()}
            sx={{
              minWidth: '140px',
              transition: 'transform 140ms ease',
              '&:hover': { transform: 'translateY(-2px)' },
            }}
          >
            Apply Filter
          </CustomButton>
          <CustomButton
            onClick={() => handleResetFilter()}
            colorType="danger"
            variant="outlined"
            sx={{
              minWidth: '140px',
              transition: 'transform 140ms ease',
              '&:hover': { transform: 'translateY(-2px)' },
            }}
          >
            Reset Filter
          </CustomButton>
        </Box>
      </Box>
    </Box>
  );
};

export default PaymentFilterAndAction;
