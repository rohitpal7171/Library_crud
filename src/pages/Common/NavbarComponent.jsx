import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Avatar from '@mui/material/Avatar';
import { ListItemText } from '@mui/material';
import ButtonBase from '@mui/material/ButtonBase';
import { useCallback, useEffect, useState } from 'react';
import { useFirebase } from '../../context/Firebase';
import { useSnackbar } from '../../components/customComponents/CustomNotifications';

const NavbarComponent = () => {
  const firebaseContext = useFirebase();
  const { showSnackbar } = useSnackbar();

  const [adminData, setAdminData] = useState(undefined);
  const [uploading, setUploading] = useState(false);

  const getAdminData = useCallback(async () => {
    const adminData = await firebaseContext.firebaseGetAdminData();
    if (!adminData) return;

    try {
      localStorage.setItem(
        import.meta.env.VITE_SHIVAAY_LIBRARY_LOCALSTORAGE_KEY,
        JSON.stringify(adminData)
      );
      if (adminData.id) {
        setAdminData(adminData);
      }
    } catch (err) {
      showSnackbar({
        severity: 'error',
        message: err?.message ?? 'Error Storing Admin Data in LocalStorage!',
      });
    }
  }, [firebaseContext, showSnackbar]);

  const loadFromLocalStorage = useCallback(() => {
    try {
      const raw = localStorage.getItem(import.meta.env.VITE_SHIVAAY_LIBRARY_LOCALSTORAGE_KEY);
      if (!raw) {
        getAdminData();
        return;
      }
      const parsed = JSON.parse(raw);
      if (parsed?.id) setAdminData(parsed);
    } catch (err) {
      showSnackbar({
        severity: 'error',
        message: err?.message ?? 'Error Parsing Admin Data from LocalStorage!',
      });
    }
  }, [getAdminData, showSnackbar]);

  useEffect(() => {
    loadFromLocalStorage();
  }, [loadFromLocalStorage]);

  const uploadToCloudinary = async (file) => {
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    if (!uploadPreset || !cloudName) {
      throw new Error(
        'Cloudinary upload preset or cloud name not configured. Set VITE_CLOUDINARY_UPLOAD_PRESET and VITE_CLOUDINARY_CLOUD_NAME.'
      );
    }

    const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', uploadPreset);

    fd.append('folder', 'admin/profile');

    const res = await fetch(url, {
      method: 'POST',
      body: fd,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Cloudinary upload failed: ${res.status} ${text}`);
    }
    const json = await res.json();
    return json;
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file) {
      try {
        setUploading(true);

        // Upload to Cloudinary
        const result = await uploadToCloudinary(file);
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
        alert('Upload failed: ' + err.message);
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
      }}
    >
      <Avatar alt="Upload new avatar" src={adminData?.profile_image} />
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
    </ButtonBase>
  );
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
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
