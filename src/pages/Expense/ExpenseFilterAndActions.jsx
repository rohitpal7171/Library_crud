import { Box, Typography } from '@mui/material';
import { defaultBoxPadding } from '../../utils/utils';
import CustomButton from '../../components/customComponents/CustomButton';
import ExpenseAddEdit from './ExpenseAddEdit';
import { useState } from 'react';

const ExpenseFilterAndActions = (props) => {
  const { fetchData } = props;
  const [openAddForm, setOpenAddForm] = useState(false);

  const handleAddExpense = () => {
    setOpenAddForm(true);
  };

  return (
    <Box sx={{ flexGrow: 1, p: defaultBoxPadding }}>
      {openAddForm && (
        <ExpenseAddEdit
          open={openAddForm}
          onClose={() => setOpenAddForm(false)}
          fetchData={fetchData}
        />
      )}
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
            Expense Records
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
            onClick={() => handleAddExpense()}
            sx={{
              minWidth: '140px',
              transition: 'transform 140ms ease',
              '&:hover': { transform: 'translateY(-2px)' },
            }}
          >
            Add Expense
          </CustomButton>
        </Box>
      </Box>
    </Box>
  );
};

export default ExpenseFilterAndActions;
