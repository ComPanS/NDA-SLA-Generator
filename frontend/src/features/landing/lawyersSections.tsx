import {
  ArrowRight,
  Check,
  FileDown,
  FileText,
  Lock,
  Scale,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Card,
  CardContent,
} from '@/shared/ui';

type FaqItem = { q: string; a: string };
type BenefitItem = { title: string; description: string };
type StepItem = { number: string; title: string; description: string };
type GuaranteeItem = { title: string; description: string };

const benefitIcons = [FileText, Sparkles, Check, ShieldCheck, Scale, ArrowRight] as const;
const guaranteeIcons = [Lock, UserCheck, FileDown, ShieldCheck, Sparkles] as const;

type LawyersHeroProps = {
  onPrimary: () => void;
  onGuest: () => void;
};

export const LawyersHeroSection = ({ onPrimary, onGuest }: LawyersHeroProps) => {
  const { t } = useTranslation('lawyers');

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white py-16 md:py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-6">
            {t('hero.title')}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8">{t('hero.subtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
            <Button size="lg" className="text-lg px-8 py-6" onClick={onPrimary}>
              <FileText className="mr-2" />
              {t('hero.ctaPrimary')}
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6" onClick={onGuest}>
              {t('hero.ctaSecondary')}
            </Button>
          </div>
          <p className="text-sm text-gray-500">{t('hero.ctaSecondaryHint')}</p>
        </div>
      </div>
    </section>
  );
};

export const LawyersBenefitsSection = () => {
  const { t } = useTranslation('lawyers');
  const items = t('benefits.items', { returnObjects: true }) as BenefitItem[];

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-5xl text-center mb-4">{t('benefits.title')}</h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto text-lg">
          {t('benefits.subtitle')}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, idx) => {
            const Icon = benefitIcons[idx] ?? Check;
            return (
              <Card key={item.title} className="border border-gray-200 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-blue-700" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export const LawyersHowSection = () => {
  const { t } = useTranslation('lawyers');
  const steps = t('how.steps', { returnObjects: true }) as StepItem[];

  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-5xl text-center mb-4">{t('how.title')}</h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto text-lg">{t('how.subtitle')}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {steps.map((step) => (
            <Card key={step.number} className="border-2 border-blue-100 bg-white">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-blue-600 mb-3">{step.number}</div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export const LawyersGuaranteesSection = () => {
  const { t } = useTranslation('lawyers');
  const items = t('guarantees.items', { returnObjects: true }) as GuaranteeItem[];

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-5xl text-center mb-4">{t('guarantees.title')}</h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto text-lg">
          {t('guarantees.subtitle')}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, idx) => {
            const Icon = guaranteeIcons[idx] ?? ShieldCheck;
            return (
              <Card key={item.title} className="border-2 border-green-100 bg-white shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-green-800" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-gray-900">{item.title}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export const LawyersTrustSection = () => {
  const { t } = useTranslation('lawyers');

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl mb-6 font-semibold">{t('trust.title')}</h2>
        <p className="text-gray-600 text-lg leading-relaxed mb-10">{t('trust.body')}</p>
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-8 text-left">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('trust.bannerTitle')}</h3>
          <p className="text-gray-700">{t('trust.bannerBody')}</p>
        </div>
      </div>
    </section>
  );
};

export const LawyersFaqSection = () => {
  const { t } = useTranslation('lawyers');
  const items = t('faq.items', { returnObjects: true }) as FaqItem[];

  return (
    <section id="lawyers-faq" className="py-20 px-4 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-5xl text-center mb-12">{t('faq.title')}</h2>
        <Accordion type="single" collapsible className="w-full">
          {items.map((item, index) => (
            <AccordionItem key={item.q} value={`lawyers-faq-${index}`}>
              <AccordionTrigger className="text-left text-lg cursor-pointer">{item.q}</AccordionTrigger>
              <AccordionContent className="text-gray-600">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

type LawyersFinalCtaProps = {
  onPrimary: () => void;
  onGuest: () => void;
};

export const LawyersFinalCtaSection = ({ onPrimary, onGuest }: LawyersFinalCtaProps) => {
  const { t } = useTranslation('lawyers');

  return (
    <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-5xl mb-6 font-semibold">{t('finalCta.title')}</h2>
        <p className="text-xl mb-8 text-blue-100">{t('finalCta.subtitle')}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            size="lg"
            className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6"
            onClick={onPrimary}
          >
            <FileText className="mr-2" />
            {t('finalCta.ctaPrimary')}
            <ArrowRight className="ml-2" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="bg-white/10 border-white/40 text-white hover:bg-white/10 text-lg px-8 py-6"
            onClick={onGuest}
          >
            {t('finalCta.ctaSecondary')}
          </Button>
        </div>
      </div>
    </section>
  );
};
