import * as React from 'react';
import { styled } from '@mui/material/styles';
import Switch from '@mui/material/Switch';

const BaseCustomSwitch = React.forwardRef(function BaseCustomSwitch(props, ref) {
  return <Switch ref={ref} focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />;
});

const CustomSwitch = styled(BaseCustomSwitch)(({ theme }) => ({
  width: 44, // slightly longer than default
  height: 22, // smaller height for compact design
  padding: 0,
  display: 'flex',
  alignItems: 'center',

  '& .MuiSwitch-switchBase': {
    padding: 0,
    margin: 2,
    transitionDuration: '250ms',
    '&.Mui-checked': {
      transform: 'translateX(20px)', // move slightly more due to longer width
      color: '#fff',
      '& + .MuiSwitch-track': {
        backgroundColor: '#4cd964', // classic iOS green
        opacity: 1,
        border: 0,
        ...theme.applyStyles?.('dark', {
          backgroundColor: '#2ECA45',
        }),
      },
      '&.Mui-disabled + .MuiSwitch-track': {
        opacity: 0.5,
      },
    },
    '&.Mui-focusVisible .MuiSwitch-thumb': {
      color: '#33cf4d',
      border: '4px solid #fff',
    },
    '&.Mui-disabled .MuiSwitch-thumb': {
      color: theme.palette.grey[100],
      ...theme.applyStyles?.('dark', {
        color: theme.palette.grey[600],
      }),
    },
    '&.Mui-disabled + .MuiSwitch-track': {
      opacity: 0.5,
      ...theme.applyStyles?.('dark', {
        opacity: 0.3,
      }),
    },
  },

  '& .MuiSwitch-thumb': {
    boxSizing: 'border-box',
    width: 18, // slightly smaller thumb
    height: 18,
    transition: 'all 0.2s ease',
  },

  '& .MuiSwitch-track': {
    borderRadius: 22 / 2,
    backgroundColor: '#E9E9EA',
    opacity: 1,
    transition: theme.transitions.create(['background-color'], {
      duration: 250,
    }),
    ...theme.applyStyles?.('dark', {
      backgroundColor: '#39393D',
    }),
  },
}));

export default CustomSwitch;
