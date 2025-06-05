import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  IconButton, 
  Typography, 
  Avatar, 
  Menu, 
  MenuItem, 
  Divider, 
  useTheme, 
  useMediaQuery, 
  Tooltip,
  Breadcrumbs,
  Link as MuiLink
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  ShoppingCart as TransactionsIcon,
  CompareArrows as AdjustmentsIcon,
  Business as SuppliersIcon,
  Warehouse as WarehouseIcon,
  Link as MappingIcon,
  Assessment as ReportsIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  NavigateNext as NavigateNextIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';

import { useAuth } from '../../context/AuthContext';

const drawerWidth = 260;

const Main = styled('main', { 
  shouldForwardProp: (prop) => prop !== 'open' && prop !== 'isMobile'
})(({ theme, open, isMobile }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && !isMobile && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'space-between',
}));

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Purchase', icon: <TransactionsIcon />,
    children: [
      { text: 'Purchase Dashboard', path: '/purchase/dashboard' },
      { text: 'Indent', path: '/purchase/indent' },
      { text: 'Indent Approval', path: '/purchase/indent-approval' },
      { text: 'PO', path: '/purchase/po' },
      { text: 'Credit/Debit Note', path: '/purchase/credit-debit-note' },
    ]
  },
  { text: 'Sales', icon: <PersonIcon />,
    children: [
      { text: 'Sales Dashboard', path: '/sales/dashboard' },
      { text: 'Sales Order', path: '/sales/order' },
      { text: 'Invoice', path: '/sales/invoice' },
      { text: 'Debit Note', path: '/sales/debit-note' },
    ]
  },
  { text: 'SKU Management', icon: <InventoryIcon />, path: '/skus' },
  { text: 'Transactions', icon: <TransactionsIcon />, path: '/transactions' },
  { text: 'Stock Adjustments', icon: <AdjustmentsIcon />, path: '/stock-adjustments' },
  { text: 'Suppliers', icon: <SuppliersIcon />, path: '/suppliers' },
  { text: 'Warehouses', icon: <WarehouseIcon />, path: '/warehouses' },
  { text: 'SKU-Vendor Mapping', icon: <MappingIcon />, path: '/sku-vendor-mapping' },
  { text: 'Reports', icon: <ReportsIcon />, path: '/reports' },
  { text: 'Customers', icon: <PersonIcon />, path: '/customers' },
];

function Layout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState(null);
  const [openMenus, setOpenMenus] = useState({});
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/login');
  };

  const getBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter((x) => x);

    if (pathnames.length === 0) {
      return [{ name: 'Dashboard', path: '/' }];
    }

    const breadcrumbs = [{ name: 'Dashboard', path: '/' }];

    let currentPath = '';
    pathnames.forEach((value, index) => {
      currentPath += `/${value}`;

      // Format the breadcrumb name
      let name = value.charAt(0).toUpperCase() + value.slice(1);
      name = name.replace(/-/g, ' ');

      // Handle special cases
      if (name === 'Skus') name = 'SKU Management';
      if (name === 'Edit' && index > 0) name = `Edit ${pathnames[index-1].slice(0, -1).toUpperCase()}`;
      if (name === 'Add' && index > 0) name = `Add ${pathnames[index-1].slice(0, -1).toUpperCase()}`;
      if (name === 'Id') name = 'Details';

      breadcrumbs.push({ name, path: currentPath });
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
          bgcolor: 'background.paper',
          color: 'text.primary',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600, flexGrow: 1 }}>
            Inventory Management System
          </Typography>
          <IconButton
            size="large"
            edge="end"
            aria-label="account"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              {currentUser?.name.charAt(0)}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => {
              handleMenuClose();
              navigate('/profile');
            }}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Profile</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => {
              handleMenuClose();
              navigate('/settings');
            }}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Settings</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Drawer
        variant={isMobile ? "temporary" : "persistent"}
        open={open}
        onClose={isMobile ? handleDrawerToggle : undefined}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: 'background.paper',
            boxShadow: 'none',
            borderRight: '1px solid rgba(0, 0, 0, 0.08)',
          },
        }}
      >
        <DrawerHeader>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600, pl: 2 }}>
            Inventory Pro
          </Typography>
          {!isMobile && (
            <IconButton onClick={handleDrawerToggle}>
              <ChevronLeftIcon />
            </IconButton>
          )}
        </DrawerHeader>
        <Divider />
        <List>
          {menuItems.map((item) => {
            if (item.children) {
              const isParentActive = item.children.some(child => location.pathname.startsWith(child.path));
              return (
                <Box key={item.text}>
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => setOpenMenus(prev => ({ ...prev, [item.text]: !prev[item.text] }))}
                      sx={{
                        py: 1.2,
                        position: 'relative',
                        bgcolor: isParentActive ? 'action.selected' : undefined,
                      }}
                    >
                      <ListItemIcon sx={{ color: isParentActive ? 'primary.main' : 'text.secondary' }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: isParentActive ? 600 : 400 }} />
                    </ListItemButton>
                  </ListItem>
                  {openMenus[item.text] && (
                    <List component="div" disablePadding sx={{ pl: 4 }}>
                      {item.children.map(child => (
                        <ListItem key={child.text} disablePadding>
                          <ListItemButton
                            onClick={() => navigate(child.path)}
                            sx={{
                              py: 1,
                              bgcolor: location.pathname === child.path ? 'action.selected' : undefined,
                            }}
                          >
                            <ListItemText primary={child.text} primaryTypographyProps={{ fontWeight: location.pathname === child.path ? 600 : 400 }} />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              );
            }
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <ListItem key={item.text} disablePadding>
                <ListItemButton 
                  component={motion.div}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(item.path)}
                  sx={{ 
                    py: 1.2,
                    position: 'relative',
                    ...(isActive && {
                      bgcolor: 'action.selected',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 4,
                        bgcolor: 'primary.main',
                      },
                    }),
                  }}
                >
                  <ListItemIcon sx={{ color: isActive ? 'primary.main' : 'text.secondary' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{ 
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? 'primary.main' : 'text.primary'
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Drawer>
      <Main open={open} isMobile={isMobile}>
        <Toolbar />
        <Box sx={{ mb: 3 }}>
          <Breadcrumbs 
            separator={<NavigateNextIcon fontSize="small" />} 
            aria-label="breadcrumb"
          >
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return isLast ? (
                <Typography color="text.primary" key={crumb.path} sx={{ fontWeight: 600 }}>
                  {crumb.name}
                </Typography>
              ) : (
                <MuiLink
                  component={motion.a}
                  whileHover={{ scale: 1.05 }}
                  underline="hover"
                  color="inherit"
                  href="#"
                  key={crumb.path}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(crumb.path);
                  }}
                >
                  {crumb.name}
                </MuiLink>
              );
            })}
          </Breadcrumbs>
        </Box>
        <Outlet />
      </Main>
    </Box>
  );
}

export default Layout;