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
} from '@mui/material';
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
      <Toolbar sx={{ minHeight: 64 }}>
        <Box
          sx={{
            width: '100%',
            maxWidth: 1400,
            mx: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
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

          {isAuthenticated ? (
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{ flexGrow: 1, justifyContent: 'flex-end' }}
            >
              <Button color="inherit" onClick={() => navigate('/dashboard')} size="medium">
                Дашборд
              </Button>
              <Button color="inherit" onClick={() => navigate('/templates')} size="medium">
                Шаблоны
              </Button>
              <Button color="inherit" onClick={() => navigate('/new-contract')} size="medium">
                Новый договор
              </Button>
              <Button color="inherit" onClick={() => navigate('/billing')} size="medium">
                Подписка
              </Button>
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
              <Button color="inherit" onClick={() => navigate('/login')} size="medium">
                Войти
              </Button>
              <Button color="inherit" onClick={() => navigate('/register')} size="medium">
                Регистрация
              </Button>
            </Stack>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};
