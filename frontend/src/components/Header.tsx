import { AppBar, Box, Button, Stack, Toolbar, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export default function Header() {
  return (
    <AppBar position="static" color="transparent" elevation={0}>
      <Toolbar>
        <Typography variant="h6" component={RouterLink} to="/" sx={{ textDecoration: 'none' }}>
          NDA/SLA Generator
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Stack direction="row" spacing={1}>
          <Button component={RouterLink} to="/login" variant="outlined" size="small">
            Login
          </Button>
          <Button component={RouterLink} to="/register" variant="contained" size="small">
            Register
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
