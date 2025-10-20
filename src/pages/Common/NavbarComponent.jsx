import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import { ListItemText } from '@mui/material';

const NavbarComponent = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Avatar alt="Shivaay Library" src="" /> &emsp;
          {/* <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Shivaay Library & Co-working
          </Typography> */}
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
