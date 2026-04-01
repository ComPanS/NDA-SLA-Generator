import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocalizedNavigate } from '@/shared/i18n/useLocalizedPath';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/shared/components';
import { PageMeta } from '@/shared/components/PageMeta';
import { useAuthStore } from '@/features/auth/hooks/useAuth';
import { billingApi, contractsApi } from '@/shared/api';
import {
  ComparisonSection,
  FAQSection,
  FinalCTASection,
  HeroSection,
  PainSection,
  PricingSection,
  SocialProofSection,
  SolutionHowItWorksSection,
  TrustSection,
} from '@/features/landing/sections';

export const Landing = () => {
  const navigate = useLocalizedNavigate();
  const { t } = useTranslation('landing');
  const { t: tc } = useTranslation('common');
  const { isAuthenticated } = useAuthStore();
  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ['landing', 'plans'],
    queryFn: () => billingApi.getPlans(),
  });
  const { data: statsData } = useQuery({
    queryKey: ['contracts', 'public-stats'],
    queryFn: () => contractsApi.getPublicStats(),
  });

  const contractsTotal = statsData?.contracts_total ?? null;
  const plans = plansData?.plans || [];

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handlePrimary = () => navigate('/register');
  const handleGuest = () => navigate('/guest-contract');

  return (
    <Layout fullWidth>
      <PageMeta
        title={t('meta.title')}
        description={t('meta.description')}
        keywords={t('meta.keywords')}
        siteName={tc('brand.name')}
      />

      <HeroSection contractsTotal={contractsTotal} onPrimary={handlePrimary} onGuest={handleGuest} />
      <PainSection />
      <SolutionHowItWorksSection onPrimary={handlePrimary} />
      <SocialProofSection contractsTotal={contractsTotal} />
      <ComparisonSection />
      <TrustSection />
      <PricingSection plans={plans} loading={plansLoading} onSelectPlan={handlePrimary} />
      <FAQSection />
      <FinalCTASection
        onPrimary={handlePrimary}
        onGuest={handleGuest}
        contractsTotal={contractsTotal}
      />
    </Layout>
  );
};
