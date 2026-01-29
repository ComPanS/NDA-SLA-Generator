import { Outlet } from 'react-router-dom';
import { Container, Stack } from '@mui/material';

import Header from './components/Header';

export default function App() {
  return (
    <Stack minHeight="100vh">
      <Header />
      <Container sx={{ py: 3, flex: 1 }}>
        <Outlet />
      </Container>
    </Stack>
  );
}
