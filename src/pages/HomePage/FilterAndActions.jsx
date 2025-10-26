import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { defaultBoxPadding } from '../../utils/utils';
import CustomButton from '../../components/customComponents/CustomButton';
import StudentAddEdit from './StudentAddEdit';

const FilterAndActions = (props) => {
  const { fetchStudentData, serverFilters } = props;

  // const [searchValue, setSearchValue] = useState('');
  const [openAddForm, setOpenAddForm] = useState(false);

  const handleAddStudent = () => {
    setOpenAddForm(true);
  };

  // const handleSearchChange = (event) => {
  //   setSearchValue(event.target.value);
  // };

  return (
    <React.Fragment>
      {openAddForm && (
        <StudentAddEdit
          open={openAddForm}
          onClose={() => setOpenAddForm(false)}
          fetchStudentData={fetchStudentData}
          serverFilters={serverFilters}
        />
      )}
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
          {/* <FormControl sx={{ m: 0 }}>
            <TextField
              label="Search Student"
              variant="outlined"
              size="medium"
              value={searchValue}
              onChange={handleSearchChange}
              sx={{
                width: { xs: '100%', sm: '320px' },
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: '50px',
                    backgroundColor: '#fff',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                    transition: 'box-shadow 0.2s ease',
                    '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.15)' },
                    '&.Mui-focused': {
                      boxShadow: '0 0 0 3px rgba(25,118,210,0.15)',
                    },
                  },
                },
                inputLabel: {
                  shrink: !!searchValue,
                  sx: {
                    color: '#999',
                    fontSize: '0.95rem',
                    transformOrigin: 'left center',
                    transition: 'all 0.2s ease',

                    ...(searchValue === '' && {
                      transform: 'translate(40px, 13px) scale(1)',
                    }),

                    '&.Mui-focused': {
                      color: '#1976d2',
                      transform: 'translate(14px, -9px) scale(0.8)',
                    },
                  },
                },
              }}
            />
          </FormControl> */}
          <Box>
            <Typography variant="h6" sx={{ fontWeight: '500' }}>
              Student Records
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
              onClick={() => handleAddStudent()}
              sx={{
                minWidth: '140px',
                transition: 'transform 140ms ease',
                '&:hover': { transform: 'translateY(-2px)' },
              }}
            >
              Add Student
            </CustomButton>
          </Box>
        </Box>
      </Box>
    </React.Fragment>
  );
};

export default FilterAndActions;
