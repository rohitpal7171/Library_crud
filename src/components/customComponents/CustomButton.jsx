import React from 'react';
import { Button, styled } from '@mui/material';

const BaseButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'colorType' && prop !== 'variantProp',
})(({ theme, colorType, variantProp }) => {
  const base = {
    borderRadius: '10px',
    textTransform: 'none',
    fontWeight: 500,
    padding: theme.spacing(1, 2),
    minHeight: 40,
    transition: 'all 200ms ease',
    boxShadow: variantProp === 'contained' ? '0 2px 6px rgba(25,118,210,0.25)' : 'none',
  };

  const colors = {
    primary: {
      contained: {
        background: 'linear-gradient(135deg,#1976d2 0%,#42a5f5 100%)',
        color: '#fff',
        '&:hover': {
          background: 'linear-gradient(135deg,#1565c0 0%,#1e88e5 100%)',
          boxShadow: '0 4px 10px rgba(25,118,210,0.35)',
        },
      },
      outlined: {
        color: theme.palette.primary.main,
        border: `1px solid ${theme.palette.primary.main}`,
        '&:hover': {
          background: 'rgba(25,118,210,0.06)',
        },
      },
      text: {
        color: theme.palette.primary.main,
      },
    },
    danger: {
      contained: {
        background: 'linear-gradient(135deg,#d32f2f 0%,#ef5350 100%)',
        color: '#fff',
        '&:hover': {
          background: 'linear-gradient(135deg,#c62828 0%,#e53935 100%)',
        },
      },
      outlined: {
        color: theme.palette.error.main,
        border: `1px solid ${theme.palette.error.main}`,
        '&:hover': {
          background: 'rgba(211,47,47,0.06)',
        },
      },
    },
    neutral: {
      contained: {
        background: theme.palette.grey[100],
        color: theme.palette.text.primary,
        '&:hover': {
          background: theme.palette.grey[200],
        },
      },
    },
  };

  const type = colors[colorType] || colors.primary;
  const variantStyles = type[variantProp] || {};

  return { ...base, ...variantStyles };
});

const CustomButton = React.forwardRef(
  (
    {
      children,
      variant = 'contained',
      colorType = 'primary',
      size = 'medium',
      startIcon,
      endIcon,
      sx,
      fullWidth = false,
      disabled = false,
      onClick,
      ...rest
    },
    ref
  ) => {
    return (
      <BaseButton
        ref={ref}
        variant={variant}
        size={size}
        startIcon={startIcon}
        endIcon={endIcon}
        onClick={onClick}
        disabled={disabled}
        fullWidth={fullWidth}
        colorType={colorType}
        variantProp={variant}
        sx={sx}
        {...rest}
      >
        {children}
      </BaseButton>
    );
  }
);

export default CustomButton;
