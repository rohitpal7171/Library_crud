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
import {
  defaultBoxBorderRadius,
  defaultBoxPadding,
  formatDate,
  getDueDateDisplay,
} from '../../utils/utils';
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
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({
    fatherName: false,
    dateOfBirth: false,
    timings: false,
    address: false,
    documents: false,
  });

  // payments - if possible

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
        console.error(err);
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
          closeMenu?.();
          fetchStudentData(serverFilters);
        }
      } catch (err) {
        setLoading(false);
        showSnackbar({ severity: 'error', message: 'Error Updating Student Active Status!' });
        console.error(err);
      }
    },
    [closeMenu, firebaseContext, fetchStudentData, setLoading, showSnackbar, serverFilters]
  );

  const getStudentNameValueGetter = (row) => {
    const name = row?.studentName || '--';
    const phone1 = row?.phoneNumber;
    const phone2 = row?.phoneNumber2;

    const parts = [name];

    if (phone1) parts.push(phone1);
    if (phone2) parts.push(phone2);

    return parts.join('\r\n'); // multiline (better for Excel)
  };

  const getDateOfJoiningValueGetter = (row) => {
    const doj = row?.dateOfJoining ? formatDate(row?.dateOfJoining) : '--';
    const humanId = row?.humanId ? row.humanId : 'ID not present';

    return `${doj}\r\n${humanId}`;
  };

  const getSeatLockerValueGetter = (row) => {
    if (!row?.seatNumber && !row?.lockerNumber) return '--';

    const parts = [];

    if (row?.seatReserved && row?.seatNumber) {
      parts.push(`Seat: ${row.seatNumber}`);
    }

    if (row?.locker && row?.lockerNumber) {
      parts.push(`Locker: ${row.lockerNumber}`);
    }

    // return parts.join(' | ') || '--';
    return parts.join('\r\n');
  };

  const getIDorDocumentsValueGetter = (row) => {
    const aadhaar = row?.aadhaarNumber ? row.aadhaarNumber : '--';
    const documents = row?.documents?.length ?? 0;

    if (!row?.aadhaarNumber && !documents) {
      return '--';
    }

    const parts = [];

    if (row?.aadhaarNumber) {
      parts.push(`Aadhaar: ${aadhaar}`);
    }

    if (documents) {
      parts.push(`Documents: ${documents}`);
    }

    return parts.join('\r\n'); // multiline for CSV/Excel
  };

  const getDueDateValueGetter = (row) => {
    const { text } = getDueDateDisplay(row?.monthlyBillingLatest?.nextPaymentDate);
    return text || '--';
  };

  const getDocumentsValueGetter = (row) => {
    const docs = row?.documents;
    // ✅ empty checks
    if (!Array.isArray(docs) || docs.length === 0) {
      return '';
    }

    return docs
      .filter((doc) => doc?.url) // remove invalid entries
      .map((doc) => {
        return `${doc.url}`;
      })
      .join(' \n');
  };

  const columns = useMemo(() => {
    const cols = [
      {
        field: 'studentName',
        headerName: 'Student',
        flex: 1.5,
        minWidth: 180,
        valueGetter: (_, row) => getStudentNameValueGetter(row),
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
                      textTransform: 'capitalize',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    {safeValue(params.row.studentName)}
                  </Typography>
                </Tooltip>
                {params?.row?.phoneNumber ? (
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
                ) : null}
                {params?.row?.phoneNumber2 ? (
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
                ) : null}
              </Box>
            </Box>
          );
        },
      },
      {
        field: 'fatherName',
        headerName: 'Father Name',
        flex: 1,
        minWidth: 120,
        renderCell: (params) => safeValue(params.row.fatherName),
      },
    ];

    if (!isXs)
      if (isMd) {
        cols.push({
          field: 'dateOfJoining',
          headerName: 'DOJ',
          flex: 0.8,
          width: 100,
          valueGetter: (_, row) => getDateOfJoiningValueGetter(row),
          renderCell: (params) => (
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                flexDirection: 'column',
                lineHeight: 1,
                mt: 2,
              }}
            >
              <Box>{safeValue(formatDate(params.row.dateOfJoining))}</Box>
              <Box sx={{ fontWeight: 'bold' }}>
                {params.row.humanId ? params.row.humanId : 'ID not present'}
              </Box>
            </Box>
          ),
        });
        cols.push({
          field: 'dateOfBirth',
          headerName: 'DOB',
          flex: 0.8,
          width: 100,
          renderCell: (params) => safeValue(formatDate(params.row.dateOfBirth)),
        });
        cols.push({
          field: 'timings',
          headerName: 'Timing',
          flex: 0.8,
          width: 100,
          renderCell: (params) => safeValue(params.row.timings),
        });
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
        valueGetter: (_, row) => getSeatLockerValueGetter(row),
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
              {p.row.seatReserved ? <span>Seat: {seat}</span> : null}
              {p.row.locker ? <span>Locker: {locker}</span> : null}
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
        valueGetter: (_, row) => getIDorDocumentsValueGetter(row),
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
    }

    cols.push({
      field: 'monthlyBillingLatest.nextPaymentDate',
      headerName: 'Due Date',
      flex: 0.8,
      width: 80,
      valueGetter: (_, row) => getDueDateValueGetter(row),
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

    cols.push({
      field: 'address',
      headerName: 'Address',
      flex: 0.8,
      width: 100,
      renderCell: (params) => safeValue(params.row.address),
    });

    cols.push({
      field: 'documents',
      headerName: 'Documents',
      flex: 1.5,
      minWidth: 200,
      valueGetter: (_, row) => getDocumentsValueGetter(row),
      renderCell: (params) => {
        const docs = params?.row?.documents;
        if (!Array.isArray(docs) || docs.length === 0) return '-';
        return (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {docs.map((doc, index) =>
              doc?.url ? (
                <a
                  key={index}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 12,
                    lineHeight: '16px',
                    display: 'block',
                  }}
                >
                  {index + 1}. {doc.originalName || 'Document'}
                </a>
              ) : null
            )}
          </div>
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

  const handleColumnVisibilityChange = (newModel) => {
    setColumnVisibilityModel(newModel);
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
            columnVisibilityModel={columnVisibilityModel}
            onColumnVisibilityModelChange={handleColumnVisibilityChange}
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
            slotProps={{
              toolbar: {
                csvOptions: {
                  fields: columns.filter((col) => col.field !== 'actions').map((col) => col.field),
                },
              },
            }}
            density="comfortable"
            rowHeight={70}
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
          <MenuItem>
            <CustomSwitch
              checked={menuRow?.active}
              onChange={() => onToggleActive(menuRow)}
              inputProps={{ 'aria-label': 'toggle active' }}
            />
          </MenuItem>
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
