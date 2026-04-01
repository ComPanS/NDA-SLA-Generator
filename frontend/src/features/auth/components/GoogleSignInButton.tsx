import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, CircularProgress, Alert } from '@mui/material';
import { authApi } from '@/shared/api';

type Props = {
  disabled?: boolean;
};

export const GoogleSignInButton = ({ disabled }: Props) => {
  const { t } = useTranslation('auth');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const { url } = await authApi.googleUrl();
      window.location.assign(url);
    } catch (e) {
      setIsLoading(false);
      setError((e as Error)?.message || t('login.googleStartError'));
    }
  }, [t]);

  const isBlocked = disabled || isLoading;

  return (
    <Box sx={{ mt: 2 }}>
      <Button
        fullWidth
        variant="outlined"
        size="large"
        disabled={isBlocked}
        onClick={() => void handleClick()}
        sx={{
          textTransform: 'none',
          borderColor: 'divider',
          color: 'text.primary',
        }}
      >
        {isLoading ? (
          <CircularProgress size={22} />
        ) : (
          t('login.googleButton')
        )}
      </Button>
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};
