import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  IconButton,
  Badge,
  MenuItem,
  Menu,
  Avatar,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMobileMenu = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Home', path: '/' },
    { text: 'Jobs', path: '/jobs' },
    { text: 'Post Job', path: '/post-job' },
  ];

  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          aria-label="menu"
          sx={{ mr: 2, display: { md: 'none' } }}
          onClick={handleMobileMenu}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: 'inherit',
            fontWeight: 'bold',
          }}
        >
          SmallJobs
        </Typography>

        <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
          {menuItems.map((item) => (
            <Button
              key={item.text}
              color="inherit"
              component={RouterLink}
              to={item.path}
              sx={{ mx: 1 }}
            >
              {item.text}
            </Button>
          ))}
        </Box>

        <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
          {isAuthenticated ? (
            <>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <Avatar alt={user?.name} src={user?.avatar} />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem component={RouterLink} to="/profile" onClick={handleClose}>
                  Profile
                </MenuItem>
                <MenuItem onClick={logout}>Logout</MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button color="inherit" component={RouterLink} to="/login">
                Login
              </Button>
              <Button color="inherit" component={RouterLink} to="/register">
                Register
              </Button>
            </>
          )}
        </Box>

        {/* Mobile menu */}
        <Drawer
          anchor="right"
          open={mobileOpen}
          onClose={handleMobileMenu}
        >
          <Box sx={{ width: 250 }} role="presentation">
            <List>
              {menuItems.map((item) => (
                <ListItem
                  key={item.text}
                  button
                  component={RouterLink}
                  to={item.path}
                  onClick={handleMobileMenu}
                >
                  <ListItemText primary={item.text} />
                </ListItem>
              ))}
              <Divider />
              {isAuthenticated ? (
                <>
                  <ListItem
                    button
                    component={RouterLink}
                    to="/profile"
                    onClick={handleMobileMenu}
                  >
                    <ListItemText primary="Profile" />
                  </ListItem>
                  <ListItem button onClick={logout}>
                    <ListItemText primary="Logout" />
                  </ListItem>
                </>
              ) : (
                <>
                  <ListItem
                    button
                    component={RouterLink}
                    to="/login"
                    onClick={handleMobileMenu}
                  >
                    <ListItemText primary="Login" />
                  </ListItem>
                  <ListItem
                    button
                    component={RouterLink}
                    to="/register"
                    onClick={handleMobileMenu}
                  >
                    <ListItemText primary="Register" />
                  </ListItem>
                </>
              )}
            </List>
          </Box>
        </Drawer>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
