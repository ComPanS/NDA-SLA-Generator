import { Alert, AlertTitle, Box } from '@mui/material';

interface ErrorMessageProps {
  title?: string;
  message: string;
}

export const ErrorMessage = ({ title = 'Ошибка', message }: ErrorMessageProps) => {
  return (
    <Box sx={{ my: 2 }}>
      <Alert severity="error">
        <AlertTitle>{title}</AlertTitle>
        {message}
      </Alert>
    </Box>
  );
};
