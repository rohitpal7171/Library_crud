import { Box, Typography } from '@mui/material';
import { defaultBoxPadding } from '../../utils/utils';
import CustomButton from '../../components/customComponents/CustomButton';

const PaymentFilterAndAction = (props) => {
  const { fetchData } = props;
  const handleApplyFilter = () => {
    console.log('Apply Filter clicked');
    fetchData();
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
          }}
        >
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
        </Box>
      </Box>
    </Box>
  );
};

export default PaymentFilterAndAction;
