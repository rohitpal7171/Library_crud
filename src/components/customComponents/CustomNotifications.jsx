import React, { createContext, useContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Slide from '@mui/material/Slide';
import Grow from '@mui/material/Grow';
import Fade from '@mui/material/Fade';

// --- Transition mapper ---
const TRANSITIONS = {
  slide: (props) => <Slide {...props} direction={props.direction || 'up'} />,
  grow: (props) => <Grow {...props} />,
  fade: (props) => <Fade {...props} />,
};

// --- Context so any component can trigger the snackbar ---
const SnackbarContext = createContext(null);

export function useSnackbar() {
  const ctx = useContext(SnackbarContext);
  if (!ctx) throw new Error('useSnackbar must be used inside a SnackbarProvider');
  return ctx;
}

export function SnackbarProvider({ children }) {
  const [state, setState] = useState({
    open: false,
    message: '',
    severity: 'info',
    autoHideDuration: 6000,
    anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
    variant: 'filled',
    transition: 'slide',
    transitionProps: { direction: 'up' },
    action: null,
  });

  const showSnackbar = useCallback((options = {}) => {
    setState((s) => ({ ...s, ...options, open: true }));
  }, []);

  const closeSnackbar = useCallback((event, reason) => {
    if (reason === 'clickaway') return;
    setState((s) => ({ ...s, open: false }));
  }, []);

  return (
    <SnackbarContext.Provider value={{ showSnackbar, closeSnackbar, state }}>
      {children}
      <CustomNotifications
        open={state.open}
        message={state.message}
        severity={state.severity}
        autoHideDuration={state.autoHideDuration}
        anchorOrigin={state.anchorOrigin}
        onClose={closeSnackbar}
        variant={state.variant}
        transition={state.transition}
        transitionProps={state.transitionProps}
        action={state.action}
      />
    </SnackbarContext.Provider>
  );
}

SnackbarProvider.propTypes = {
  children: PropTypes.node,
};

// --- The actual reusable snackbar component ---
export default function CustomNotifications({
  open: controlledOpen,
  onClose,
  severity = 'success',
  message = '',
  autoHideDuration = 6000,
  anchorOrigin = { vertical: 'bottom', horizontal: 'right' },
  variant = 'filled',
  transition = 'slide',
  transitionProps = { direction: 'up' },
  action = null,
}) {
  // If parent supplies "open" as undefined, component is uncontrolled — but in provider usage it's controlled.
  const [open, setOpen] = useState(Boolean(controlledOpen));

  React.useEffect(() => {
    if (typeof controlledOpen === 'boolean') setOpen(controlledOpen);
  }, [controlledOpen]);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setOpen(false);
    if (typeof onClose === 'function') onClose(event, reason);
  };

  const TransitionComponent = TRANSITIONS[transition] || TRANSITIONS.slide;

  return (
    <Snackbar
      open={open}
      onClose={handleClose}
      autoHideDuration={autoHideDuration}
      anchorOrigin={anchorOrigin}
      TransitionComponent={(props) => TransitionComponent({ ...props, ...transitionProps })}
    >
      <Alert
        onClose={handleClose}
        severity={severity}
        variant={variant}
        sx={{ width: '100%', boxShadow: 3 }}
        action={action}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}

CustomNotifications.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  severity: PropTypes.oneOf(['error', 'warning', 'info', 'success']),
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  autoHideDuration: PropTypes.number,
  anchorOrigin: PropTypes.object,
  variant: PropTypes.oneOf(['standard', 'filled', 'outlined']),
  transition: PropTypes.oneOf(['slide', 'grow', 'fade']),
  transitionProps: PropTypes.object,
  action: PropTypes.node,
};
