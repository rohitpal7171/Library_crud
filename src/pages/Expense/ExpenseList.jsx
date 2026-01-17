import {
  Box,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
  Menu,
  MenuItem,
} from '@mui/material';
import { Fragment, useCallback, useMemo, useState } from 'react';
import {
  defaultBoxBorderRadius,
  defaultBoxPadding,
  formatDate,
  safeValue,
} from '../../utils/utils';
import { DataGrid } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useFirebase } from '../../context/Firebase';
import { useSnackbar } from '../../components/customComponents/CustomNotifications';
import ExpenseAddEdit from './ExpenseAddEdit';
import { CurrencyRupee } from '@mui/icons-material';

const ExpenseList = (props) => {
  const {
    expenses,
    loading,
    pageSize,
    setPageSize,
    setLoading,
    fetchData,
    selectedDataForEdit,
    setSelectedDataForEdit,
    rowSelectionModel,
    setRowSelectionModel,
  } = props;

  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const isMd = useMediaQuery(theme.breakpoints.up('md'));

  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuRow, setMenuRow] = useState(null);
  const [openEditForm, setOpenEditForm] = useState(false);

  const firebaseContext = useFirebase();
  const { showSnackbar } = useSnackbar();

  const openMenu = useCallback((event, row) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuRow(row);
  }, []);

  const onEditDirect = useCallback(
    (item) => {
      setOpenEditForm(true);
      setSelectedDataForEdit(item);
    },
    [setSelectedDataForEdit]
  );

  const onDeleteDirect = useCallback(
    async (id) => {
      try {
        setLoading(true);
        const response = await firebaseContext.deleteDocumentById('expenses', id, {
          subcollections: [],
        });
        if (response?.success) {
          setLoading(false);
          showSnackbar({ severity: 'success', message: 'Expenses Deleted Successfully!' });
          fetchData([]);
        }
      } catch (err) {
        setLoading(false);
        showSnackbar({ severity: 'error', message: 'Error Deleting Expense!' });
        console.log(err);
      }
    },
    [setLoading, firebaseContext, showSnackbar, fetchData]
  );

  const closeMenu = useCallback(() => {
    setMenuAnchorEl(null);
    setMenuRow(null);
  }, []);

  const handleEdit = useCallback(() => {
    onEditDirect(menuRow);
    closeMenu();
  }, [menuRow, closeMenu, onEditDirect]);

  const handleDelete = useCallback(() => {
    onDeleteDirect(menuRow?.id);
    closeMenu();
  }, [menuRow, closeMenu, onDeleteDirect]);

  const handleAddEditFormClose = () => {
    setOpenEditForm(false);
    setSelectedDataForEdit(null);
  };

  const columns = useMemo(() => {
    const cols = [
      {
        field: 'expenseType',
        headerName: 'Expense Type',
        flex: 1.5,
        minWidth: 180,
        renderCell: (params) => {
          return (
            <Box sx={{ marginTop: '15px' }}>
              <Typography variant="body1" sx={{ fontWeight: '500' }}>
                {params.row.expenseType === 'miscellaneous'
                  ? safeValue(params.row.miscellaneous)
                  : params.row.expenseType}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <CurrencyRupee fontSize="10px" /> {safeValue(params.row.expensePaid)}
              </Typography>
            </Box>
          );
        },
      },
    ];

    if (isMd) {
      cols.push({
        field: 'expenseDate',
        headerName: 'Expense Date',
        flex: 1,
        minWidth: 180,
        renderCell: (params) => {
          return safeValue(formatDate(params.row.expenseDate));
        },
      });
      cols.push({
        field: 'expensePaymentMethod',
        headerName: 'Payment Method',
        flex: 1,
        minWidth: 180,
        renderCell: (params) => {
          return safeValue(params.row.expensePaymentMethod) ?? 'CASH';
        },
      });
      cols.push({
        field: 'expensePaid',
        headerName: 'Expense Paid',
        flex: 1,
        minWidth: 180,
        renderCell: (params) => {
          return (
            <Typography
              variant="body2"
              sx={{
                display: 'flex',
                alignItems: 'center',
                marginTop: '25px',
              }}
            >
              <CurrencyRupee fontSize="10px" /> {safeValue(params.row.expensePaid)}
            </Typography>
          );
        },
      });
    }

    cols.push({
      field: 'actions',
      headerName: 'Actions',
      flex: 0.5,
      width: 80,
      renderCell: (params) => {
        if (!isXs) {
          return (
            <Box sx={{ display: 'flex', gap: 1, marginTop: '20px' }}>
              <IconButton
                size="small"
                color="primary"
                onClick={() => onEditDirect(params.row)}
                aria-label={`edit-${params.row.id}`}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                color="error"
                onClick={() => onDeleteDirect(params.row.id)}
                aria-label={`delete-${params.row.id}`}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          );
        }

        return (
          <IconButton
            size="small"
            onClick={(e) => {
              openMenu(e, params.row);
            }}
            aria-label={`menu-${params.row.id}`}
          >
            <MoreVertIcon />
          </IconButton>
        );
      },
    });
    return cols;
  }, [isMd, isXs, onDeleteDirect, onEditDirect, openMenu]);

  const innerHeight = 'calc(75vh - 16px)';

  return (
    <Fragment>
      {openEditForm && (
        <ExpenseAddEdit
          open={openEditForm}
          onClose={() => handleAddEditFormClose()}
          fetchData={fetchData}
          type="EDIT"
          editData={selectedDataForEdit}
        />
      )}
      <Box sx={{ flexGrow: 1, p: defaultBoxPadding }}>
        <Box sx={{ height: innerHeight, width: '100%' }}>
          <DataGrid
            rows={expenses}
            columns={columns}
            pageSize={pageSize}
            onPageSizeChange={(newSize) => setPageSize(newSize)}
            pageSizeOptions={[25, 50, 100, 200, 500]}
            pagination
            disableColumnMenu
            disableColumnSorting
            disableSelectionOnClick
            disableRowSelectionOnClick
            disableVirtualization
            onRowSelectionModelChange={(newRowSelectionModel) => {
              setRowSelectionModel(newRowSelectionModel);
            }}
            rowSelectionModel={rowSelectionModel}
            showToolbar
            density="comfortable"
            rowHeight={60}
            headerHeight={50}
            style={{ height: '100%', width: '100%' }}
            loading={loading}
            sx={{
              borderRadius: defaultBoxBorderRadius,
              '& .MuiDataGrid-columnHeader, & .MuiDataGrid-scrollbarFiller': {
                backgroundColor: '#f0f4ff !important',
                color: '#4d4d4d !important',
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: 'bold !important',
              },
              '& .MuiDataGrid-cell:focus': {
                outline: 'none !important',
              },
              '& .MuiDataGrid-cell:focus-within': {
                outline: 'none !important',
              },
              '& .MuiDataGrid-columnHeader:focus': {
                outline: 'none !important',
              },
              '& .MuiDataGrid-columnHeader:focus-within': {
                outline: 'none !important',
              },
            }}
          />
        </Box>
        <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={closeMenu}>
          <MenuItem onClick={handleEdit}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
          </MenuItem>
          <MenuItem onClick={handleDelete}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
          </MenuItem>
        </Menu>
      </Box>
    </Fragment>
  );
};
export default ExpenseList;
