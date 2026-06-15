import { styled } from '@mui/material/styles';
import MuiDrawer from '@mui/material/Drawer';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import LogoutIcon from '@mui/icons-material/Logout';
import { Paid, PriceCheck } from '@mui/icons-material';
import InsightsIcon from '@mui/icons-material/Insights';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { useFirebase } from '../../context/Firebase';
import { Box, Tooltip } from '@mui/material';
import { sidebarColors } from '../../utils/utils';

const drawerWidth = 240;

const paperStyles = {
  background: sidebarColors.background,
  borderRight: `1px solid ${sidebarColors.border}`,
  top: 64,
  height: 'calc(100% - 64px)',
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
  { text: 'Dashboard', Icon: DashboardIcon, key: 'dashboard' },
  { text: 'Student List', Icon: PeopleAltIcon, key: 'students' },
  { text: 'Expense', Icon: Paid, key: 'expenses' },
  { text: 'Payment', Icon: PriceCheck, key: 'payments' },
  { text: 'Analytics', Icon: InsightsIcon, key: 'analytics' },
  { text: 'Reports', Icon: AssessmentIcon, key: 'reports' },
];

function NavItem({ item, isSelected, open, onClick }) {
  const { text, Icon } = item;

  return (
    <Tooltip title={open ? '' : text} placement="right" arrow>
      <Box
        onClick={onClick}
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          mx: 1,
          mb: 0.5,
          px: open ? 1.25 : 0,
          py: open ? 1 : 0.5,
          borderRadius: '12px',
          cursor: 'pointer',
          justifyContent: open ? 'flex-start' : 'center',
          background: isSelected && open ? sidebarColors.activeBg : 'transparent',
          boxShadow: isSelected && open ? sidebarColors.activeGlow : 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            background: isSelected
              ? open
                ? sidebarColors.activeHoverBg
                : 'transparent'
              : sidebarColors.itemHoverBg,
          },
        }}
      >
        {isSelected && open && (
          <Box
            sx={{
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 4,
              height: 22,
              borderRadius: '0 4px 4px 0',
              background: sidebarColors.activeAccent,
            }}
          />
        )}
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '10px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isSelected && !open ? sidebarColors.activeBg : 'transparent',
            boxShadow: isSelected && !open ? sidebarColors.activeGlow : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <Icon
            sx={{
              fontSize: 20,
              color: isSelected ? sidebarColors.activeContent : sidebarColors.iconInactive,
              transition: 'color 0.2s ease',
            }}
          />
        </Box>

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
            sx={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: isSelected ? 700 : 500,
              color: isSelected ? sidebarColors.activeContent : sidebarColors.labelInactive,
              whiteSpace: 'nowrap',
              lineHeight: 1.3,
              transition: 'color 0.2s ease',
            }}
          >
            {text}
          </Box>
        </Box>
      </Box>
    </Tooltip>
  );
}

export default function SidebarDrawer({ open, selectedPage, onNavigate }) {
  const firebaseContext = useFirebase();

  return (
    <Drawer variant="permanent" open={open}>
      {/* Nav items */}
      <Box sx={{ flex: 1, pt: 1.5, pb: 1 }}>
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
          borderTop: `1px solid ${sidebarColors.border}`,
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
              px: open ? 1.25 : 0,
              py: 1,
              borderRadius: '12px',
              cursor: 'pointer',
              justifyContent: open ? 'flex-start' : 'center',
              transition: 'all 0.2s ease',
              '&:hover': {
                background: sidebarColors.signOutHoverBg,
                '& .signout-icon': { color: sidebarColors.signOutHover },
                '& .signout-label': { color: sidebarColors.signOutHover },
              },
            }}
          >
            <LogoutIcon
              className="signout-icon"
              sx={{
                fontSize: 20,
                flexShrink: 0,
                color: sidebarColors.signOutIcon,
                transition: 'color 0.2s ease',
              }}
            />
            {open && (
              <Box
                component="span"
                className="signout-label"
                sx={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: sidebarColors.signOutLabel,
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
