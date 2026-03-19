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
        title="AI-конструктор договоров: NDA, SLA, ГПХ и любые соглашения"
        description="Создавайте договоры с помощью AI за минуты: NDA, SLA, ГПХ, оферты и индивидуальные соглашения с экспортом DOCX/PDF."
        keywords="AI конструктор договоров, NDA, SLA, договор о неразглашении, сервис соглашений, генератор контрактов, шаблоны договоров, экспорт DOCX, экспорт PDF, ГПХ, договор подряда, оферта, договор оказания услуг, ИИ договоры, юридические документы, онлайн договоры, договор с ИИ, автоматические договоры, NDA шаблон, SLA шаблон, конфиденциальность, договор о неразглашении коммерческой тайны, ДоговорAI, dogovarai, создание договоров онлайн, договоры для фриланса, договоры для ИП, договоры для бизнеса, юридические шаблоны, генератор юридических документов, AI договоры, нейросеть договоры, договор субподряда, договор возмездного оказания услуг, публичная оферта, договор на разработку, договор на услуги, договор подряда с физлицом, шаблон NDA бесплатно, шаблон SLA"
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
