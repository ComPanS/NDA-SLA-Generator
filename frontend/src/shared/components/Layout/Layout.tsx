import { Box, Container } from '@mui/material';
import { Header } from './Header';
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
}

export const Layout = ({ children, maxWidth = 'lg' }: LayoutProps) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Container
        maxWidth={maxWidth}
        sx={{
          flex: 1,
          py: 4,
        }}
      >
        {children}
      </Container>
    </Box>
  );
};
