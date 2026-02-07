import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Drawer,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  useMediaQuery,
} from '@mui/material';
import { AccountCircle, Menu as MenuIcon, Close as CloseIcon } from '@mui/icons-material';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, useLogout } from '@/features/auth/hooks/useAuth';

export const Header = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const logout = useLogout();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isTablet = useMediaQuery('(max-width:1024px)');

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
  };

  const handleProfile = () => {
    navigate('/profile');
    handleClose();
  };

  const toggleDrawer = () => setDrawerOpen((prev) => !prev);

  const closeDrawerAnd = (cb: () => void) => () => {
    setDrawerOpen(false);
    cb();
  };

  const authLinks = useMemo(
    () => [
      { label: 'Мои договоры', to: '/dashboard' },
      { label: 'Шаблоны', to: '/templates' },
      { label: 'Новый договор', to: '/new-contract' },
      { label: 'Подписка', to: '/billing' },
    ],
    []
  );

  const guestLinks = useMemo(
    () => [
      { label: 'Войти', to: '/login' },
      { label: 'Регистрация', to: '/register' },
    ],
    []
  );

  return (
    <AppBar position="static">
      <Toolbar sx={{ minHeight: 64, px: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            width: '100%',
            maxWidth: 1400,
            mx: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            justifyContent: 'space-between',
          }}
        >
          <Typography
            variant="h5"
            component={Link}
            to={isAuthenticated ? '/dashboard' : '/'}
            sx={{ textDecoration: 'none', color: 'inherit', fontWeight: 800, mr: 2 }}
          >
            ДоговорAI
          </Typography>

          {isTablet ? (
            <>
              <IconButton color="inherit" onClick={toggleDrawer} aria-label="Открыть меню">
                <MenuIcon />
              </IconButton>
              <Drawer anchor="right" open={drawerOpen} onClose={toggleDrawer}>
                <Box
                  sx={{
                    width: 300,
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                  role="presentation"
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Меню
                    </Typography>
                    <IconButton onClick={toggleDrawer} aria-label="Закрыть меню">
                      <CloseIcon />
                    </IconButton>
                  </Stack>
                  <Divider />
                  <List sx={{ p: 0 }}>
                    {(isAuthenticated ? authLinks : guestLinks).map((item) => (
                      <ListItemButton
                        key={item.to}
                        onClick={closeDrawerAnd(() => navigate(item.to))}
                        sx={{ borderRadius: 1 }}
                      >
                        <ListItemText primary={item.label} />
                      </ListItemButton>
                    ))}
                  </List>
                  {isAuthenticated && (
                    <>
                      <Divider />
                      <List sx={{ p: 0 }}>
                        <ListItemButton
                          onClick={closeDrawerAnd(handleProfile)}
                          sx={{ borderRadius: 1 }}
                        >
                          <ListItemText primary="Профиль" />
                        </ListItemButton>
                        <ListItemButton
                          onClick={closeDrawerAnd(handleLogout)}
                          sx={{ borderRadius: 1 }}
                        >
                          <ListItemText primary="Выйти" />
                        </ListItemButton>
                      </List>
                    </>
                  )}
                </Box>
              </Drawer>
            </>
          ) : isAuthenticated ? (
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{ flexGrow: 1, justifyContent: 'flex-end' }}
            >
              {authLinks.map((link) => (
                <Button
                  key={link.to}
                  color="inherit"
                  onClick={() => navigate(link.to)}
                  size="medium"
                >
                  {link.label}
                </Button>
              ))}
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <AccountCircle />
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
                <MenuItem onClick={handleProfile}>Профиль</MenuItem>
                <MenuItem onClick={handleLogout}>Выйти</MenuItem>
              </Menu>
            </Stack>
          ) : (
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{ flexGrow: 1, justifyContent: 'flex-end' }}
            >
              {guestLinks.map((link) => (
                <Button
                  key={link.to}
                  color="inherit"
                  onClick={() => navigate(link.to)}
                  size="medium"
                >
                  {link.label}
                </Button>
              ))}
            </Stack>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};
