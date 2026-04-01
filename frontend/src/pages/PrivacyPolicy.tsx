import { Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/shared/components';
import { PageMeta } from '@/shared/components/PageMeta';
import { getLegalBundle } from '@/shared/i18n/getLegalBundle';
import { LegalBlocks } from '@/shared/i18n/LegalBlocks';

export const PrivacyPolicy = () => {
  const { i18n, t } = useTranslation('common');
  const { privacy } = getLegalBundle(i18n.language);

  return (
    <Layout maxWidth="md">
      <PageMeta
        title={privacy.metaTitle}
        description={privacy.metaDescription}
        path={privacy.path}
        siteName={t('brand.name')}
      />
      <Stack spacing={3}>
        <Typography variant="h4" component="h1">
          {privacy.h1}
        </Typography>
        <LegalBlocks blocks={privacy.blocks} />
      </Stack>
    </Layout>
  );
};
