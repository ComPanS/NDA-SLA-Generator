import { Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/shared/components';
import { PageMeta } from '@/shared/components/PageMeta';
import { getLegalBundle } from '@/shared/i18n/getLegalBundle';
import { LegalBlocks } from '@/shared/i18n/LegalBlocks';

export const TermsOfUse = () => {
  const { i18n, t } = useTranslation('common');
  const { terms } = getLegalBundle(i18n.language);

  return (
    <Layout maxWidth="md">
      <PageMeta
        title={terms.metaTitle}
        description={terms.metaDescription}
        path={terms.path}
        siteName={t('brand.name')}
      />
      <Stack spacing={3}>
        <Typography variant="h4" component="h1">
          {terms.h1}
        </Typography>
        <LegalBlocks blocks={terms.blocks} />
      </Stack>
    </Layout>
  );
};
