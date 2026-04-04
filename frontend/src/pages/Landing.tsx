import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
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

const LANDING_FAQ_JSON_LD_ID = 'contractai-landing-faq-jsonld';

export const Landing = () => {
  const navigate = useLocalizedNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation('landing');
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

  useEffect(() => {
    const faqItems = t('faq.items', { returnObjects: true }) as { q: string; a: string }[];
    if (!Array.isArray(faqItems) || faqItems.length === 0) return;

    let el = document.getElementById(LANDING_FAQ_JSON_LD_ID) as HTMLScriptElement | null;
    if (!el) {
      el = document.createElement('script');
      el.id = LANDING_FAQ_JSON_LD_ID;
      el.type = 'application/ld+json';
      el.setAttribute('data-contractai-page-meta', '');
      document.head.appendChild(el);
    }

    const url =
      typeof window !== 'undefined' ? `${window.location.origin}${location.pathname}` : '';
    const graph = [
      {
        '@type': 'WebPage',
        name: t('meta.title'),
        description: t('meta.description'),
        url,
        inLanguage: i18n.language,
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqItems.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.a,
          },
        })),
      },
    ];

    el.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': graph,
    });

    return () => {
      document.getElementById(LANDING_FAQ_JSON_LD_ID)?.remove();
    };
  }, [t, i18n.language, location.pathname]);

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
