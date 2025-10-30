import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  useTheme,
  useMediaQuery,
  Avatar,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PhoneIcon from '@mui/icons-material/Phone';
import MaleIcon from '@mui/icons-material/Male';
import FemaleIcon from '@mui/icons-material/Female';
import { DataGrid } from '@mui/x-data-grid';
import { defaultBoxPadding, formatDate, getDueDateDisplay } from '../../utils/utils';
import { useFirebase } from '../../context/Firebase';
import StudentAddEdit from './StudentAddEdit';
import { useSnackbar } from '../../components/customComponents/CustomNotifications';
import StudentDetail from './StudentDetail';
import CustomSwitch from '../../components/customComponents/CustomSwitch';
import { PaymentDetail } from './PaymentDetail';

const safeValue = (val) => (val ? val : '--');

export default function StudentList(props) {
  const {
    students,
    loading,
    pageSize,
    setPageSize,
    setLoading,
    fetchStudentData,
    selectedStudentForEdit,
    setSelectedStudentForEdit,
    studentRowSelectionModel,
    setStudentRowSelectionModel,
    serverFilters,
  } = props;

  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const isMd = useMediaQuery(theme.breakpoints.up('md'));

  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuRow, setMenuRow] = useState(null);
  const [openEditForm, setOpenEditForm] = useState(false);
  const [openStudentDetail, setOpenStudentDetail] = useState(false);
  const [openPaymentDetail, setOpenPaymentDetail] = useState(false);

  const firebaseContext = useFirebase();
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    fetchStudentData({ filters: serverFilters });
  }, [fetchStudentData, serverFilters]);

  const openMenu = useCallback((event, row) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuRow(row);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuAnchorEl(null);
    setMenuRow(null);
  }, []);

  const onEditDirect = useCallback(
    (item) => {
      setOpenEditForm(true);
      setSelectedStudentForEdit(item);
    },
    [setSelectedStudentForEdit]
  );

  const onDeleteDirect = useCallback(
    async (id) => {
      try {
        setLoading(true);
        const response = await firebaseContext.deleteDocumentById('students', id, {
          subcollections: ['monthlyBilling'],
        });
        if (response?.success) {
          setLoading(false);
          showSnackbar({ severity: 'success', message: 'Student Deleted Successfully!' });
          fetchStudentData(serverFilters);
        }
      } catch (err) {
        setLoading(false);
        showSnackbar({ severity: 'error', message: 'Error Deleting Student!' });
        console.log(err);
      }
    },
    [setLoading, firebaseContext, showSnackbar, fetchStudentData, serverFilters]
  );

  const handleEdit = useCallback(() => {
    onEditDirect(menuRow);
    closeMenu();
  }, [menuRow, closeMenu, onEditDirect]);

  const handleDelete = useCallback(() => {
    onDeleteDirect(menuRow?.id);
    closeMenu();
  }, [menuRow, closeMenu, onDeleteDirect]);

  const handleStudentDetail = useCallback(
    (item) => {
      setSelectedStudentForEdit(item);
      setOpenStudentDetail(true);
    },
    [setSelectedStudentForEdit]
  );

  const handlePaymentDueClick = useCallback(
    (item) => {
      setSelectedStudentForEdit(item);
      setOpenPaymentDetail(true);
    },
    [setSelectedStudentForEdit]
  );

  const onToggleActive = useCallback(
    async (item) => {
      try {
        setLoading(true);
        const response = await firebaseContext.updateDocument('students', item.id, {
          active: !item.active,
        });
        if (response?.success) {
          setLoading(false);
          showSnackbar({
            severity: 'success',
            message: 'Student Active Status Updated Successfully!',
          });
          fetchStudentData(serverFilters);
        }
      } catch (err) {
        setLoading(false);
        showSnackbar({ severity: 'error', message: 'Error Updating Student Active Status!' });
        console.log(err);
      }
    },
    [firebaseContext, fetchStudentData, setLoading, showSnackbar, serverFilters]
  );

  const columns = useMemo(() => {
    const cols = [
      {
        field: 'studentName',
        headerName: 'Student',
        flex: 1.5,
        minWidth: 180,
        renderCell: (params) => {
          const initials = (params.row.studentName || 'Student')
            .split(' ')
            .map((p) => p[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
          return (
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                marginTop: '20px',
              }}
            >
              <Avatar
                alt={params.row.studentName}
                // src={params?.row?.studentProfile ? params.row.studentProfile : params.row.studentName}
                sx={{ bgcolor: 'primary.main' }}
              >
                {initials}
              </Avatar>

              <Box sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Tooltip title={params.row.studentName ?? ''} placement="top" arrow>
                  <Typography
                    variant="caption"
                    component="a"
                    onClick={() => handleStudentDetail(params.row)}
                    sx={{
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      color: 'primary.main',
                      cursor: 'pointer',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    {safeValue(params.value)}
                  </Typography>
                </Tooltip>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <PhoneIcon sx={{ fontSize: 15, color: '#4CAF50' }} />
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {safeValue(params.row.phoneNumber)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <PhoneIcon sx={{ fontSize: 15, color: '#4c7fafff' }} />
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {safeValue(params.row.phoneNumber2)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          );
        },
      },
    ];

    if (!isXs)
      if (isMd) {
        // cols.push({
        //   field: 'fatherName',
        //   headerName: 'Parent',
        //   flex: 0.8,
        //   minWidth: 90,
        //   renderCell: (p) => safeValue(p.value),
        // });

        // cols.push({
        //   field: 'dateOfBirth',
        //   headerName: 'DOB',
        //   flex: 0.6,
        //   width: 80,
        //   renderCell: (p) => safeValue(p.value),
        // });
        cols.push({
          field: 'dateOfJoining',
          headerName: 'DOJ',
          flex: 0.8,
          width: 100,
          renderCell: (p) => safeValue(formatDate(p.value)),
        });
      }

    if (!isXs) {
      cols.push({
        field: 'gender',
        headerName: 'Gender',
        width: 80,
        flex: 0.6,
        renderCell: (p) =>
          p.value ? (
            <Box sx={{ display: 'flex', marginTop: '20px', gap: 1 }}>
              {p.value === 'Male' ? (
                <MaleIcon sx={{ color: 'primary.main', fontSize: 18 }} />
              ) : (
                <FemaleIcon sx={{ color: 'error.main', fontSize: 18 }} />
              )}
              <Typography sx={{ fontWeight: 400 }}>{p.value}</Typography>
            </Box>
          ) : (
            '--'
          ),
      });
    }

    if (!isXs)
      cols.push({
        field: 'seatNumber',
        headerName: 'Seat | Locker',
        width: 180,
        flex: 0.7,
        renderCell: (p) => {
          const seat = p.row.seatNumber ? safeValue(p.row.seatNumber) : '--';
          const locker = p.row.lockerNumber ? safeValue(p.row.lockerNumber) : '--';

          if (!p.row.seatNumber && !p.row.lockerNumber) {
            return '--';
          }

          return (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                lineHeight: 2,
              }}
            >
              <span>Seat: {seat}</span>
              <span>Locker: {locker}</span>
            </Box>
          );
        },
      });

    if (isMd) {
      cols.push({
        field: 'aadhaarNumber',
        headerName: 'ID | Documents',
        flex: 1,
        width: 120,
        renderCell: (p) => {
          const aadhaar = p.row.aadhaarNumber ? safeValue(p.row.aadhaarNumber) : '--';
          const documents = p.row.documents?.length ?? 0;

          if (!aadhaar && !documents) {
            return '--';
          }

          return (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                lineHeight: 2,
              }}
            >
              <span>Aadhaar: {aadhaar}</span>
              <span>Documents: {documents}</span>
            </Box>
          );
        },
      });
      cols.push({
        field: 'monthlyBillingLatest.nextPaymentDate',
        headerName: 'Due Date',
        flex: 0.8,
        width: 80,
        renderCell: (p) => {
          const { text, color, fontWeight } = getDueDateDisplay(
            p.row?.monthlyBillingLatest?.nextPaymentDate
          );
          return (
            <Typography
              color={color}
              fontWeight={fontWeight}
              sx={{ cursor: 'pointer', mt: 2, textDecoration: 'underline' }}
              onClick={() => handlePaymentDueClick(p.row)}
            >
              {text}
            </Typography>
          );
        },
      });

      // cols.push({
      //   field: 'address',
      //   headerName: 'Address',
      //   flex: 0.8,
      //   minWidth: 140,
      //   sortable: false,
      //   filterable: false,
      //   renderCell: (p) => (
      //     <Typography
      //       variant="body2"
      //       sx={{
      //         whiteSpace: 'nowrap',
      //         overflow: 'hidden',
      //         textOverflow: 'ellipsis',
      //         color: 'text.primary',
      //         marginTop: '20px',
      //       }}
      //       title={safeValue(p.row.address)}
      //     >
      //       {safeValue(p.row.address)}
      //     </Typography>
      //   ),
      // });
    }

    cols.push({
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      width: 80,
      renderCell: (params) => {
        if (!isXs) {
          return (
            <Box sx={{ display: 'flex', gap: 1, marginTop: '20px' }}>
              <CustomSwitch
                checked={params.row.active}
                onChange={() => onToggleActive(params.row)}
                inputProps={{ 'aria-label': 'toggle active' }}
              />
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
  }, [
    isXs,
    isMd,
    handleStudentDetail,
    handlePaymentDueClick,
    onToggleActive,
    onEditDirect,
    onDeleteDirect,
    openMenu,
  ]);

  const innerHeight = 'calc(75vh - 16px)';

  const handleAddEditFormClose = () => {
    setOpenEditForm(false);
    setSelectedStudentForEdit(null);
  };

  const handleCloseStudentDetail = () => {
    setOpenStudentDetail(false);
    setSelectedStudentForEdit(null);
  };

  const handleClosePaymentDetail = () => {
    setOpenPaymentDetail(false);
    setSelectedStudentForEdit(null);
  };

  return (
    <React.Fragment>
      {openEditForm && (
        <StudentAddEdit
          open={openEditForm}
          onClose={() => handleAddEditFormClose()}
          fetchStudentData={fetchStudentData}
          type="EDIT"
          editData={selectedStudentForEdit}
        />
      )}
      {openStudentDetail && (
        <StudentDetail
          open={openStudentDetail}
          onClose={() => handleCloseStudentDetail()}
          parentStudent={selectedStudentForEdit}
          fetchStudentData={fetchStudentData}
          serverFilters={serverFilters}
        />
      )}
      {openPaymentDetail && (
        <PaymentDetail
          open={openPaymentDetail}
          onClose={() => handleClosePaymentDetail()}
          student={selectedStudentForEdit}
          fetchStudentData={fetchStudentData}
          serverFilters={serverFilters}
        />
      )}
      <Box sx={{ flexGrow: 1, p: defaultBoxPadding }}>
        <Box sx={{ height: innerHeight, width: '100%' }}>
          <DataGrid
            rows={students}
            columns={columns}
            // checkboxSelection
            pageSize={pageSize}
            onPageSizeChange={(newSize) => setPageSize(newSize)}
            pageSizeOptions={[25, 50, 100, 200, 500]}
            pagination
            disableColumnMenu
            disableColumnSorting
            disableSelectionOnClick
            disableRowSelectionOnClick
            disableVirtualization
            // isRowSelectable={(params) => params.row.quantity > 4}
            // onRowSelectionModelChange={(newSelection) => {
            //   // 🧠 Max 10 validation
            //   if (newSelection.ids.size > 4 && newSelection.type === 'include') {
            //     alert('You can select a maximum of 4 students only.');
            //     return; // 🚫 Prevent state update
            //   } else {
            //     if (newSelection.type === 'exclude') {
            //       if (newSelection.ids.size === 0) {
            //         setSelectAll(true);
            //         setExcludedStudentIds(new Set());
            //         setSelectedStudentIds(new Set());
            //       } else {
            //         setSelectAll(true);
            //         setExcludedStudentIds(new Set(newSelection.ids));
            //         setSelectedStudentIds(new Set());
            //       }
            //     } else {
            //       setSelectAll(false);
            //       setExcludedStudentIds(new Set());
            //       setSelectedStudentIds(new Set(newSelection.ids));
            //     }
            //   }
            // }}
            // isRowSelectable={() =>
            //   !(
            //     studentRowSelectionModel.type === 'exclude' &&
            //     studentRowSelectionModel.ids.size === 0
            //   )
            // }
            onRowSelectionModelChange={(newRowSelectionModel) => {
              setStudentRowSelectionModel(newRowSelectionModel);
            }}
            rowSelectionModel={studentRowSelectionModel}
            showToolbar
            density="comfortable"
            rowHeight={60}
            headerHeight={50}
            style={{ height: '100%', width: '100%' }}
            loading={loading}
            sx={{
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
    </React.Fragment>
  );
}
