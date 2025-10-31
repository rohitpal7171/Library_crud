import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Avatar from '@mui/material/Avatar';
import { CircularProgress, IconButton, ListItemText } from '@mui/material';
import ButtonBase from '@mui/material/ButtonBase';
import { useCallback, useEffect, useState } from 'react';
import { useFirebase } from '../../context/Firebase';
import { useSnackbar } from '../../components/customComponents/CustomNotifications';
import { uploadToCloudinary } from '../../database/fileStorage/cloudinary';
import { MenuOutlined } from '@mui/icons-material';

const NavbarComponent = (props) => {
  const { onDrawerOpen } = props;
  const firebaseContext = useFirebase();
  const { showSnackbar } = useSnackbar();

  const [adminData, setAdminData] = useState(undefined);
  const [uploading, setUploading] = useState(false);

  const fetchAdminData = useCallback(async () => {
    try {
      const data = await firebaseContext.firebaseGetAdminData();
      if (data?.id) setAdminData(data);
    } catch (err) {
      showSnackbar({
        severity: 'error',
        message: err?.message || 'Failed to load admin data!',
      });
    }
  }, [firebaseContext, showSnackbar]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const drawerIcon = (
    <IconButton
      color="secondary"
      size="large"
      edge="start"
      onClick={onDrawerOpen}
      sx={{ color: 'white' }}
    >
      <MenuOutlined />
    </IconButton>
  );

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!adminData.id) {
      showSnackbar({
        severity: 'error',
        message: 'Create folder named - admin , in firestore first and then try again.',
      });
      return;
    }
    if (!file) return;
    if (file) {
      try {
        setUploading(true);

        // Upload to Cloudinary
        const result = await uploadToCloudinary(file, 'admin/profile');
        firebaseContext
          .updateDocument('admin', adminData.id, { profile_image: result.secure_url || result.url })
          .then((response) => {
            setAdminData(response?.data);
            setUploading(false);
            showSnackbar({ severity: 'success', message: 'Profile Image Updated Successfully!' });
          })
          .catch((err) => {
            showSnackbar({
              severity: 'error',
              message: err?.message ?? 'Error Updating Profile Image!',
            });
          });
      } catch (err) {
        showSnackbar({
          severity: 'error',
          message: err?.message ?? 'Error Updating Profile Image!',
        });
      } finally {
        setUploading(false);
        event.target.value = '';
      }
    }
  };

  const profileImage = (
    <ButtonBase
      component="label"
      role={undefined}
      tabIndex={-1}
      aria-label="Avatar image"
      sx={{
        borderRadius: '40px',
        '&:has(:focus-visible)': {
          outline: '2px solid',
          outlineOffset: '2px',
        },
        display: 'inline-flex',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: 56, // outer size (spinner diameter)
          height: 56,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* spinner — shown only while uploading */}
        {uploading && (
          <CircularProgress
            size={56}
            thickness={2}
            color="inherit"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              // keep spinner behind the avatar
              zIndex: 0,
            }}
          />
        )}

        {/* avatar sits centered above the spinner */}
        <Avatar
          alt="Upload new avatar"
          src={adminData?.profile_image}
          sx={{
            width: 40, // avatar size (smaller than spinner)
            height: 40,
            zIndex: 1,
            // optionally add a subtle border so it stands out over spinner
            border: (theme) => `2px solid ${theme.palette.background.paper}`,
          }}
        />

        {/* hidden file input */}
        <input
          type="file"
          accept="image/*"
          style={{
            border: 0,
            clip: 'rect(0 0 0 0)',
            height: '1px',
            margin: '-1px',
            overflow: 'hidden',
            padding: 0,
            position: 'absolute',
            whiteSpace: 'nowrap',
            width: '1px',
          }}
          onChange={handleAvatarChange}
          disabled={uploading}
        />
      </Box>
    </ButtonBase>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="fixed">
        <Toolbar>
          {drawerIcon} &nbsp;
          {profileImage}
          &emsp;
          <ListItemText
            primary={'Shivaay Library & Co-working'}
            secondary={'( Where focus meets comfort )'}
            secondaryTypographyProps={{
              color: 'white',
            }}
          />
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default NavbarComponent;
