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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PhoneIcon from '@mui/icons-material/Phone';
import MaleIcon from '@mui/icons-material/Male';
import FemaleIcon from '@mui/icons-material/Female';
import { DataGrid } from '@mui/x-data-grid';
import { defaultBoxPadding } from '../../utils/utils';
import { useFirebase } from '../../context/Firebase';
import StudentAddEdit from './StudentAddEdit';
import { useSnackbar } from '../../components/customComponents/CustomNotifications';
import StudentDetail from './StudentDetail';

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
    // selectedStudentIds,
    // setSelectedStudentIds,
    // setExcludedStudentIds,
    // setSelectAll,
    studentRowSelectionModel,
    setStudentRowSelectionModel,
  } = props;

  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const isMd = useMediaQuery(theme.breakpoints.up('md'));

  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuRow, setMenuRow] = useState(null);
  const [openEditForm, setOpenEditForm] = useState(false);
  const [openStudentDetail, setOpenStudentDetail] = useState(false);

  const firebaseContext = useFirebase();
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

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
        const response = await firebaseContext.deleteDocumentById('students', id);
        if (response?.success) {
          setLoading(false);
          showSnackbar({ severity: 'success', message: 'Student Deleted Successfully!' });
          fetchStudentData();
        }
      } catch (err) {
        setLoading(false);
        showSnackbar({ severity: 'error', message: 'Error Deleting Student!' });
        console.log(err);
      }
    },
    [firebaseContext, fetchStudentData, setLoading, showSnackbar]
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

  const columns = useMemo(() => {
    const cols = [
      {
        field: 'studentName',
        headerName: 'Student',
        flex: 1,
        minWidth: 180,
        renderCell: (params) => (
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              marginTop: '20px',
            }}
          >
            <Avatar
              alt={params.row.studentName}
              src={params?.row?.studentProfile ? params.row.studentProfile : params.row.studentName}
              sx={{ bgcolor: 'primary.main' }}
            />

            <Box sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
            </Box>
          </Box>
        ),
      },
    ];

    if (!isXs)
      cols.push({
        field: 'fatherName',
        headerName: 'Parent',
        flex: 0.9,
        minWidth: 140,
        renderCell: (p) => safeValue(p.value),
      });

    if (isMd) {
      cols.push({
        field: 'dateOfBirth',
        headerName: 'DOB',
        flex: 0.8,
        width: 120,
        renderCell: (p) => safeValue(p.value),
      });
      cols.push({
        field: 'dateOfJoining',
        headerName: 'DOJ',
        flex: 0.8,
        width: 120,
        renderCell: (p) => safeValue(p.value),
      });
    }

    if (!isXs) {
      cols.push({
        field: 'gender',
        headerName: 'Gender',
        width: 120,
        flex: 0.8,
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
        headerName: 'Seat',
        width: 100,
        flex: 0.8,
        renderCell: (p) => (p.value ? `Reserved (${safeValue(p.row.seatNumber)})` : '--'),
      });

    if (isMd) {
      cols.push({
        field: 'timings',
        headerName: 'Timings',
        flex: 0.8,
        width: 90,
        renderCell: (p) => safeValue(p.value),
      });

      cols.push({
        field: 'address',
        headerName: 'Address',
        flex: 1,
        minWidth: 180,
        sortable: false,
        filterable: false,
        renderCell: (p) => (
          <Typography
            variant="body2"
            sx={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: 'text.primary',
              marginTop: '20px',
            }}
            title={safeValue(p.row.address)}
          >
            {safeValue(p.row.address)}
          </Typography>
        ),
      });
    }

    cols.push({
      field: 'actions',
      headerName: 'Actions',
      width: 100,
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
  }, [isXs, isMd, onEditDirect, onDeleteDirect, openMenu]);

  const innerHeight = 'calc(75vh - 16px)';

  const handleAddEditFormClose = () => {
    setOpenEditForm(false);
    setSelectedStudentForEdit(null);
  };

  const handleCloseStudentDetail = () => {
    setOpenStudentDetail(false);
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
          student={selectedStudentForEdit}
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
            rowHeight={64}
            headerHeight={56}
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
