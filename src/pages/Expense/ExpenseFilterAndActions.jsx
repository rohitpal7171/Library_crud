import { Box, Typography } from '@mui/material';
import { defaultBoxPadding, formatDate } from '../../utils/utils';
import CustomButton from '../../components/customComponents/CustomButton';
import ExpenseAddEdit from './ExpenseAddEdit';
import { useState } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { exportToExcel } from '../../utils/exportUtils';
import { FileDownload } from '@mui/icons-material';

const ExpenseFilterAndActions = (props) => {
  const { fetchData, expenses, clientFilters, setClientFilters, applyFilter, resetFilters } = props;
  const [openAddForm, setOpenAddForm] = useState(false);

  const handleExcelExport = () => {
    const rows = (expenses || []).map((e) => ({
      expenseDate: e.expenseDate ? formatDate(e.expenseDate) : '-',
      expenseType:
        e.expenseType === 'Miscellaneous' ? (e.miscellaneous || 'Miscellaneous') : (e.expenseType || '-'),
      expensePaid: e.expensePaid || 0,
      expensePaymentMethod: e.expensePaymentMethod || '-',
      remarks: e.remarks || '-',
    }));
    const columns = [
      { key: 'expenseDate', label: 'Date' },
      { key: 'expenseType', label: 'Type' },
      { key: 'expensePaid', label: 'Amount (₹)' },
      { key: 'expensePaymentMethod', label: 'Method' },
      { key: 'remarks', label: 'Remarks' },
    ];
    exportToExcel(rows, columns, 'Expense_List');
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
            flexWrap: 'wrap',
            gap: 2,
            justifyContent: { xs: 'flex-start', sm: 'flex-end' },
            width: { xs: '100%', sm: 'auto' },
          }}
        >
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DemoContainer components={['DatePicker', 'DatePicker']}>
              <DatePicker
                label="Start Date"
                value={clientFilters?.startDate ?? null}
                onChange={(v) => setClientFilters({ ...clientFilters, startDate: v })}
              />
              <DatePicker
                label="End Date"
                value={clientFilters?.endDate ?? null}
                onChange={(v) => setClientFilters({ ...clientFilters, endDate: v })}
              />
            </DemoContainer>
          </LocalizationProvider>

          <CustomButton
            onClick={applyFilter}
            sx={{
              minWidth: '120px',
              background: '#1a2f5e !important',
              transition: 'all 140ms ease',
              '&:hover': { background: '#243870 !important', transform: 'translateY(-2px)' },
            }}
          >
            Apply Filter
          </CustomButton>
          <CustomButton
            onClick={resetFilters}
            colorType="danger"
            variant="outlined"
            sx={{ minWidth: '100px', transition: 'transform 140ms ease', '&:hover': { transform: 'translateY(-2px)' } }}
          >
            Reset
          </CustomButton>
          <Box
            component="button"
            onClick={handleExcelExport}
            sx={{
              display: 'flex', alignItems: 'center', gap: 0.5,
              px: 2, py: 1.25, minHeight: 40, borderRadius: '10px',
              border: '1px solid #d1d5db', cursor: 'pointer', minWidth: 130,
              bgcolor: '#fff', color: '#16a34a', fontSize: 14, fontWeight: 500,
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'all 200ms ease',
              '&:hover': { bgcolor: '#f0fdf4', borderColor: '#86efac', transform: 'translateY(-2px)' },
            }}
          >
            <FileDownload fontSize="small" sx={{ color: '#16a34a', mr: 0.5 }} /> Export Excel
          </Box>
          <CustomButton
            onClick={() => setOpenAddForm(true)}
            sx={{ minWidth: '130px', transition: 'transform 140ms ease', '&:hover': { transform: 'translateY(-2px)' } }}
          >
            Add Expense
          </CustomButton>
        </Box>
      </Box>
    </Box>
  );
};

export default ExpenseFilterAndActions;
