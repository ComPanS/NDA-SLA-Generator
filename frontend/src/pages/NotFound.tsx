import { Button, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { Layout } from '@/shared/components';
import { PageMeta } from '@/shared/components/PageMeta';
import { useLocalizedNavigate } from '@/shared/i18n/useLocalizedPath';

export const NotFound = () => {
  const { t } = useTranslation('errors');
  const { t: tc } = useTranslation('common');
  const navigate = useLocalizedNavigate();
  const location = useLocation();

  return (
    <Layout maxWidth="sm">
      <PageMeta
        title={t('notFound.metaTitle')}
        description={t('notFound.metaDescription')}
        path={location.pathname}
        siteName={tc('brand.name')}
        robots="noindex,nofollow"
      />
      <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
        <Typography variant="h3" component="h1">
          404
        </Typography>
        <Typography variant="h5">{t('notFound.title')}</Typography>
        <Typography variant="body2" color="text.secondary">
          {t('notFound.hint')}
        </Typography>
        <Button variant="contained" onClick={() => navigate('/')}>
          {t('notFound.home')}
        </Button>
      </Stack>
    </Layout>
  );
};
