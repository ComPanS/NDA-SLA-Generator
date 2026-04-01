import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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
        title="AI-конструктор договоров онлайн — создать NDA, SLA, оферты за 2 минуты"
        description="Создавайте договоры онлайн с помощью AI: NDA, SLA, подряды и оферты. Готовый документ за 2 минуты, экспорт в DOCX и PDF."
        keywords="AI конструктор договоров, генератор договоров, создание договоров онлайн, договор с ИИ, юридические документы онлайн, генератор NDA, генератор SLA, шаблон договора подряда, договор оказания услуг, публичная оферта, договор для фрилансера, договор с самозанятым, договор ИП с физлицом, автоматическое создание договоров, онлайн генератор контрактов"
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
