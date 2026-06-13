import { styled, useTheme } from '@mui/material/styles';
import MuiDrawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LogoutIcon from '@mui/icons-material/Logout';
import { Paid, PriceCheck } from '@mui/icons-material';
import InsightsIcon from '@mui/icons-material/Insights';
import { useFirebase } from '../../context/Firebase';
import { Box, Tooltip } from '@mui/material';

const drawerWidth = 240;

const paperStyles = {
  background: '#0f172a',
  borderRight: '1px solid rgba(255,255,255,0.08)',
  overflowX: 'hidden',
};

const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  ...paperStyles,
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
  ...paperStyles,
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1.5),
  ...theme.mixins.toolbar,
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  flexShrink: 0,
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    position: 'fixed',
    top: 64,
    height: 'calc(100% - 64px)',
    ...(open && {
      ...openedMixin(theme),
      '& .MuiDrawer-paper': openedMixin(theme),
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme),
    }),
  })
);

const menuItems = [
  { text: 'Dashboard',    Icon: DashboardIcon,  key: 'dashboard' },
  { text: 'Student List', Icon: PeopleAltIcon,   key: 'students'  },
  { text: 'Expense',      Icon: Paid,            key: 'expenses'  },
  { text: 'Payment',      Icon: PriceCheck,      key: 'payments'  },
  { text: 'Analytics',   Icon: InsightsIcon,    key: 'analytics' },
];

function NavItem({ item, isSelected, open, onClick }) {
  const { text, Icon } = item;

  return (
    <Tooltip title={open ? '' : text} placement="right" arrow>
      <Box
        onClick={onClick}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          mx: 1,
          mb: 0.5,
          px: open ? 1 : 0,
          py: 0.75,
          borderRadius: '12px',
          cursor: 'pointer',
          justifyContent: open ? 'flex-start' : 'center',
          borderLeft: `2px solid ${isSelected ? '#06b6d4' : 'transparent'}`,
          backgroundColor: isSelected ? 'rgba(6,182,212,0.12)' : 'transparent',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backgroundColor: isSelected
              ? 'rgba(6,182,212,0.18)'
              : 'rgba(255,255,255,0.05)',
            '& .icon-chip': {
              backgroundColor: isSelected
                ? 'rgba(6,182,212,0.3)'
                : 'rgba(255,255,255,0.1)',
            },
            '& .nav-label': { color: isSelected ? '#67e8f9' : 'rgba(255,255,255,0.85)' },
          },
        }}
      >
        {/* Icon chip */}
        <Box
          className="icon-chip"
          sx={{
            width: 36,
            height: 36,
            borderRadius: '10px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isSelected
              ? 'rgba(6,182,212,0.2)'
              : 'rgba(255,255,255,0.06)',
            border: `1px solid ${isSelected ? 'rgba(6,182,212,0.45)' : 'rgba(255,255,255,0.08)'}`,
            boxShadow: isSelected ? '0 0 18px rgba(6,182,212,0.35)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <Icon
            sx={{
              fontSize: 18,
              color: isSelected ? '#22d3ee' : 'rgba(255,255,255,0.5)',
              transition: 'color 0.2s ease',
            }}
          />
        </Box>

        {/* Label */}
        <Box
          sx={{
            flex: 1,
            overflow: 'hidden',
            opacity: open ? 1 : 0,
            transition: 'opacity 0.2s ease',
          }}
        >
          <Box
            component="span"
            className="nav-label"
            sx={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: isSelected ? 700 : 500,
              color: isSelected ? '#f1f5f9' : 'rgba(255,255,255,0.55)',
              whiteSpace: 'nowrap',
              lineHeight: 1.3,
              transition: 'color 0.2s ease',
            }}
          >
            {text}
          </Box>
        </Box>

        {/* Active dot */}
        {open && (
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              flexShrink: 0,
              backgroundColor: isSelected ? '#06b6d4' : 'transparent',
              boxShadow: isSelected ? '0 0 8px #06b6d4' : 'none',
              transition: 'all 0.2s ease',
            }}
          />
        )}
      </Box>
    </Tooltip>
  );
}

export default function SidebarDrawer({ open, setOpen, selectedPage, onNavigate }) {
  const theme = useTheme();
  const firebaseContext = useFirebase();

  return (
    <Drawer variant="permanent" open={open}>

      {/* Header */}
      <DrawerHeader sx={{ justifyContent: open ? 'space-between' : 'center' }}>
        {open && (
          <Box
            component="span"
            sx={{
              fontSize: '10px',
              fontWeight: 800,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.28)',
              userSelect: 'none',
            }}
          >
            Navigation
          </Box>
        )}
        <IconButton
          onClick={() => setOpen(false)}
          size="small"
          sx={{
            color: 'rgba(255,255,255,0.3)',
            '&:hover': { color: '#fff', backgroundColor: 'rgba(255,255,255,0.08)' },
            borderRadius: '8px',
            p: 0.75,
          }}
        >
          {theme.direction === 'rtl' ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
        </IconButton>
      </DrawerHeader>

      {/* Section label */}
      {open && (
        <Box sx={{ px: 2, pt: 2, pb: 0.5 }}>
          <Box
            component="span"
            sx={{
              display: 'block',
              fontSize: '10px',
              fontWeight: 800,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.22)',
              userSelect: 'none',
            }}
          >
            Menu
          </Box>
        </Box>
      )}

      {/* Nav items */}
      <Box sx={{ flex: 1, pt: open ? 0.5 : 1, pb: 1 }}>
        {menuItems.map((item) => (
          <NavItem
            key={item.key}
            item={item}
            isSelected={selectedPage === item.key}
            open={open}
            onClick={() => onNavigate(item.key)}
          />
        ))}
      </Box>

      {/* Footer — Sign Out */}
      <Box
        sx={{
          mx: 1,
          mb: 1.5,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          pt: 1.5,
        }}
      >
        <Tooltip title={open ? '' : 'Sign Out'} placement="right" arrow>
          <Box
            onClick={() => firebaseContext.firebaseSignOut()}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: open ? 1 : 0,
              py: 0.75,
              borderRadius: '12px',
              cursor: 'pointer',
              justifyContent: open ? 'flex-start' : 'center',
              borderLeft: '2px solid transparent',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(239,68,68,0.08)',
                '& .signout-chip': {
                  backgroundColor: 'rgba(239,68,68,0.18)',
                  borderColor: 'rgba(239,68,68,0.35)',
                },
                '& .signout-label': { color: '#fca5a5' },
              },
            }}
          >
            <Box
              className="signout-chip"
              sx={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.18)',
                transition: 'all 0.2s ease',
              }}
            >
              <LogoutIcon sx={{ fontSize: 17, color: '#f87171' }} />
            </Box>

            {open && (
              <Box
                component="span"
                className="signout-label"
                sx={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'rgba(248,113,113,0.75)',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.2s ease',
                }}
              >
                Sign Out
              </Box>
            )}
          </Box>
        </Tooltip>
      </Box>

    </Drawer>
  );
}
