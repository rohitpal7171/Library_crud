import { Box } from '@mui/material';
import CustomButton from '../../components/customComponents/CustomButton';
import { useFirebase } from '../../context/Firebase';
import { useSnackbar } from '../../components/customComponents/CustomNotifications';

export const LoginPage = () => {
  const firebaseContext = useFirebase();

  const { showSnackbar } = useSnackbar();

  const handleGoogleLogin = async () => {
    try {
      await firebaseContext.firebaseSignInWithGoogle();
      showSnackbar({
        message: 'Login successful!',
        severity: 'success',
      });
      // Redirect to home or dashboard after successful login
      window.location.href = '/';
    } catch (err) {
      showSnackbar({
        message: err?.message ?? 'Your email is not authorized for this application.',
        severity: 'error',
      });
    }
  };
  return (
    <Box
      sx={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <CustomButton colorType="primary" onClick={() => handleGoogleLogin()}>
        Login with Google
      </CustomButton>
    </Box>
  );
};
