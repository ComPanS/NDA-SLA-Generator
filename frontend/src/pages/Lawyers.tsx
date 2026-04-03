import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/shared/components';
import { PageMeta } from '@/shared/components/PageMeta';
import { PricingSection } from '@/features/landing/sections';
import {
  LawyersBenefitsSection,
  LawyersFaqSection,
  LawyersFinalCtaSection,
  LawyersGuaranteesSection,
  LawyersHeroSection,
  LawyersHowSection,
  LawyersTrustSection,
} from '@/features/landing/lawyersSections';
import { billingApi } from '@/shared/api';
import { useLocalizedNavigate } from '@/shared/i18n/useLocalizedPath';

const JSON_LD_SCRIPT_ID = 'contractai-lawyers-jsonld';

export const Lawyers = () => {
  const navigate = useLocalizedNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation('lawyers');
  const { t: tc } = useTranslation('common');
  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ['landing', 'plans'],
    queryFn: () => billingApi.getPlans(),
  });
  const plans = plansData?.plans ?? [];

  useEffect(() => {
    const faqItems = t('faq.items', { returnObjects: true }) as { q: string; a: string }[];
    if (!Array.isArray(faqItems) || faqItems.length === 0) return;

    let el = document.getElementById(JSON_LD_SCRIPT_ID) as HTMLScriptElement | null;
    if (!el) {
      const script = document.createElement('script');
      script.id = JSON_LD_SCRIPT_ID;
      script.type = 'application/ld+json';
      script.setAttribute('data-contractai-page-meta', '');
      document.head.appendChild(script);
      el = script;
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
      document.getElementById(JSON_LD_SCRIPT_ID)?.remove();
    };
  }, [t, i18n.language, location.pathname]);

  return (
    <Layout fullWidth>
      <PageMeta
        title={t('meta.title')}
        description={t('meta.description')}
        keywords={t('meta.keywords')}
        path={location.pathname}
        siteName={tc('brand.name')}
      />

      <LawyersHeroSection
        onPrimary={() => navigate('/register')}
        onGuest={() => navigate('/guest-contract')}
      />
      <LawyersBenefitsSection />
      <LawyersHowSection />
      <LawyersTrustSection />
      <LawyersGuaranteesSection />
      <PricingSection plans={plans} loading={plansLoading} onSelectPlan={() => navigate('/register')} />
      <LawyersFaqSection />
      <LawyersFinalCtaSection
        onPrimary={() => navigate('/register')}
        onGuest={() => navigate('/guest-contract')}
      />
    </Layout>
  );
};
