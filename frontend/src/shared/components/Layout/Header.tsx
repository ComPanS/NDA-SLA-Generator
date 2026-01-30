import { AppBar, Toolbar, Typography, Button, Box, IconButton, Menu, MenuItem } from '@mui/material';
import { AccountCircle } from '@mui/icons-material';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, useLogout } from '@/features/auth/hooks/useAuth';

export const Header = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const logout = useLogout();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component={Link}
          to={isAuthenticated ? '/dashboard' : '/'}
          sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}
        >
          NDA / SLA Generator
        </Typography>

        {isAuthenticated ? (
          <>
            <Button color="inherit" onClick={() => navigate('/dashboard')}>
              Дашборд
            </Button>
            <Button color="inherit" onClick={() => navigate('/templates')}>
              Шаблоны
            </Button>
            <Button color="inherit" onClick={() => navigate('/new-contract')}>
              Новый договор
            </Button>
            <Box>
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
                <MenuItem onClick={() => { navigate('/billing'); handleClose(); }}>
                  Подписка
                </MenuItem>
                <MenuItem onClick={handleLogout}>Выйти</MenuItem>
              </Menu>
            </Box>
          </>
        ) : (
          <>
            <Button color="inherit" onClick={() => navigate('/login')}>
              Войти
            </Button>
            <Button color="inherit" onClick={() => navigate('/register')}>
              Регистрация
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};
