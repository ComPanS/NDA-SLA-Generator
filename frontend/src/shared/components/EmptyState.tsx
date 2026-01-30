import { Box, Typography, Button } from '@mui/material';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState = ({ icon, title, message, action }: EmptyStateProps) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 2,
        textAlign: 'center',
      }}
    >
      {icon && (
        <Box sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }}>
          {icon}
        </Box>
      )}
      <Typography variant="h5" gutterBottom>
        {title}
      </Typography>
      {message && (
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 500 }}>
          {message}
        </Typography>
      )}
      {action && (
        <Button variant="contained" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </Box>
  );
};
