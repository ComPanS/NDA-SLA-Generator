import { Box, Container, Stack, Typography, Link as MuiLink } from '@mui/material';
import { Link } from 'react-router-dom';
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
      <Box component="footer" sx={{ py: 4, borderTop: '1px solid', borderColor: 'divider' }}>
        <Container
          maxWidth="xl"
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Stack spacing={0.5}>
            <Typography variant="body2" color="text.secondary">
              ДоговорAI
            </Typography>
            <Typography variant="caption" color="text.secondary">
              © {new Date().getFullYear()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Почта для сотрудничества и поддержки:{' '}
              <MuiLink href="mailto:support@dogovorai.com" color="inherit" underline="hover">
                support@dogovorai.com
              </MuiLink>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              С уважением, команда ДоговорAI
            </Typography>
          </Stack>
          <Stack direction="row" spacing={2}>
            <MuiLink component={Link} to="/privacy" color="text.secondary" underline="hover">
              Политика конфиденциальности
            </MuiLink>
            <MuiLink component={Link} to="/terms" color="text.secondary" underline="hover">
              Правила использования
            </MuiLink>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};
