import NavbarComponent from '../Common/NavbarComponent';
import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import SidebarDrawer from '../Common/SidebarDrawer';
import { Box, Toolbar } from '@mui/material';

const drawerWidth = 240;
const closedWidth = 57; // ~theme.spacing(7) + 1px

const HomePage = () => {
  const [openSidebar, setOpenSidebar] = useState(false);
  const [sidebarSelectedPage, setSidebarSelectedPage] = useState('dashboard');

  const navigate = useNavigate();
  const location = useLocation();

  // ✅ keep URL and local setSidebarSelectedPage state in sync (e.g., on refresh)
  useEffect(() => {
    if (location.pathname.startsWith('/students')) {
      setSidebarSelectedPage('students');
    } else {
      setSidebarSelectedPage('dashboard');
    }
  }, [location.pathname]);

  const handleNavigate = (key) => {
    setSidebarSelectedPage(key);
    if (key === 'dashboard') navigate('/');
    if (key === 'students') navigate('/students');
    setOpenSidebar(false);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <NavbarComponent onDrawerOpen={() => setOpenSidebar(!openSidebar)} />

      <SidebarDrawer
        open={openSidebar}
        setOpen={setOpenSidebar}
        selectedPage={sidebarSelectedPage}
        onNavigate={handleNavigate}
      />
      <Box
        component="main"
        sx={(theme) => {
          const leftOffset = openSidebar ? drawerWidth : closedWidth;
          return {
            flexGrow: 1,
            transition: theme.transitions.create(['width', 'margin-left'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
            width: `calc(100% - ${leftOffset}px)`,
            ml: `${leftOffset}px`,
            boxSizing: 'border-box',
            minHeight: '100vh',
          };
        }}
      >
        <Toolbar />
        {/* INNER wrapper ensures every page gets the same padding & shrink behavior */}
        <Box
          sx={{
            p: 3, // consistent padding for all pages
            width: '100%',
            minHeight: 'calc(100vh - 64px)',
            boxSizing: 'border-box',
            minWidth: 0, // IMPORTANT: allows flex children to shrink and prevents overflow
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default HomePage;
