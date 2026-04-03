import {
  ArrowRight,
  Check,
  Clock,
  Download,
  FileText,
  MessageSquare,
  MessageSquareWarning,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PlanInfo, SubscriptionPlan } from '@/shared/types';
import { icuLocaleFor } from '@/shared/i18n/icuLocale';
import { useFxRates } from '@/features/billing/hooks/useBilling';
import { useBillingDisplayCurrency } from '@/shared/money/useBillingDisplayCurrency';
import { formatRubAmountForUi, BillingDisplayCurrency } from '@/shared/money/billingCurrency';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/ui';

type ComparisonCell = string | boolean;
type ComparisonRow = {
  feature: string;
  lawyer: ComparisonCell;
  template: ComparisonCell;
  service: ComparisonCell;
};

type FaqItem = { q: string; a: string };

type PainPoint = { title: string; description: string };
type Step = { number: string; title: string; description: string };
type Testimonial = { name: string; role: string; text: string; initials: string };
type TrustPoint = { title: string; description: string };

type HeroSectionProps = {
  contractsTotal?: number | null;
  onPrimary: () => void;
  onGuest: () => void;
};

export const HeroSection = ({ contractsTotal, onPrimary, onGuest }: HeroSectionProps) => {
  const { t, i18n } = useTranslation('landing');
  const localeTag = icuLocaleFor(i18n.language);
  const totalLabel =
    contractsTotal === null || contractsTotal === undefined
      ? '—'
      : contractsTotal.toLocaleString(localeTag);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl mb-6">{t('hero.title')}</h1>

          <p className="text-lg md:text-xl text-gray-600 mb-8">{t('hero.subtitle')}</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <Button size="lg" className="text-lg px-8 py-6" onClick={onPrimary}>
              <FileText className="mr-2" />
              {t('hero.ctaPrimary')}
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6" onClick={onGuest}>
              {t('hero.ctaGuest')}
            </Button>
          </div>
          <p className="text-sm text-gray-700 mb-6">{t('hero.noCard')}</p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <span>{t('hero.benefit1')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <span>{t('hero.benefit2')}</span>
            </div>
          </div>

          <div className="mt-8 text-3xl md:text-4xl text-blue-600">
            {t('hero.contractsPrefix')}{' '}
            <span className="font-semibold">{totalLabel}</span>{' '}
            {t('hero.contractsSuffix')}
          </div>
        </div>
      </div>
    </section>
  );
};

const painIcons = [XCircle, MessageSquareWarning, Clock, FileText] as const;

export const PainSection = () => {
  const { t } = useTranslation('landing');
  const points = t('pain.points', { returnObjects: true }) as PainPoint[];

  return (
    <section className="py-20 px-4 bg-red-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-5xl text-center mb-12">{t('pain.heading')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {points.map((point, idx) => {
            const Icon = painIcons[idx] ?? XCircle;
            return (
              <Card key={point.title} className="border-red-200 bg-white">
                <CardContent className="pt-6">
                  <Icon className="w-12 h-12 text-red-500 mb-4" />
                  <h3 className="text-lg mb-2">{point.title}</h3>
                  <p className="text-sm text-gray-600">{point.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <p className="text-xl md:text-3xl text-center font-semibold">{t('pain.footer')}</p>
      </div>
    </section>
  );
};

const stepIcons = [MessageSquare, Sparkles, Download] as const;

type HowItWorksProps = { onPrimary: () => void };

export const SolutionHowItWorksSection = ({ onPrimary }: HowItWorksProps) => {
  const { t } = useTranslation('landing');
  const steps = t('howItWorks.steps', { returnObjects: true }) as Step[];

  return (
    <section id="how-it-works" className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-5xl text-center mb-4">{t('howItWorks.title')}</h2>
        <p className="text-center text-gray-600 mb-16 text-lg">{t('howItWorks.subtitle')}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {steps.map((step, index) => {
            const Icon = stepIcons[index] ?? MessageSquare;
            return (
              <div key={step.title} className="relative">
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-blue-200 z-0" />
                )}
                <div className="relative z-10 text-center">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-600 text-white mb-6 relative">
                    <Icon className="w-10 h-10" />
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white text-blue-600 flex items-center justify-center text-sm font-semibold">
                      {step.number}
                    </div>
                  </div>
                  <h3 className="text-xl mb-3">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <Button size="lg" className="text-lg px-8 py-6" onClick={onPrimary}>
            {t('howItWorks.cta')}
          </Button>
        </div>
      </div>
    </section>
  );
};

type SocialProofProps = { contractsTotal?: number | null };

export const SocialProofSection = ({ contractsTotal }: SocialProofProps) => {
  const { t, i18n } = useTranslation('landing');
  const localeTag = icuLocaleFor(i18n.language);
  const totalLabel =
    contractsTotal === null || contractsTotal === undefined
      ? '—'
      : contractsTotal.toLocaleString(localeTag);

  const testimonials = t('social.testimonials', { returnObjects: true }) as Testimonial[];

  return (
    <section id="reviews" className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="text-5xl md:text-7xl mb-2">
            <span className="text-blue-600 font-bold">{totalLabel}</span>
          </div>
          <p className="text-2xl md:text-3xl text-gray-700">{t('social.contractsCreatedLine')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {[
            { icon: Users, value: totalLabel, label: t('social.statContractsLabel') },
            { icon: ShieldCheck, value: t('social.statRiskValue'), label: t('social.statRiskLabel') },
            { icon: TrendingUp, value: t('social.statHistoryValue'), label: t('social.statHistoryLabel') },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <stat.icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <div className="text-2xl md:text-3xl mb-2 font-semibold">{stat.value}</div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        <h2 className="text-3xl md:text-4xl text-center mb-12">{t('social.testimonialsHeading')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar>
                    <AvatarFallback>{testimonial.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-semibold">{testimonial.name}</div>
                    <div className="text-xs text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
                <p className="text-sm text-gray-700">{testimonial.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export const ComparisonSection = () => {
  const { t } = useTranslation('landing');
  const rows = t('comparison.rows', { returnObjects: true }) as ComparisonRow[];

  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-5xl text-center mb-4">{t('comparison.title')}</h2>
        <p className="text-center text-gray-600 mb-12 text-lg">{t('comparison.subtitle')}</p>

        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-lg overflow-hidden shadow-lg">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-6 py-4 text-left">{t('comparison.colCriterion')}</th>
                <th className="px-6 py-4 text-center">{t('comparison.colLawyer')}</th>
                <th className="px-6 py-4 text-center">{t('comparison.colTemplate')}</th>
                <th className="px-6 py-4 text-center bg-green-50">
                  <span className="text-green-700 font-semibold text-lg">{t('comparison.colService')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.feature} className="border-t border-gray-100">
                  <td className="px-6 py-4 font-medium">{row.feature}</td>
                  <td className="px-6 py-4 text-center">
                    {typeof row.lawyer === 'boolean' ? (
                      row.lawyer ? (
                        <Check className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-red-500 mx-auto" />
                      )
                    ) : (
                      <span className="text-gray-700">{row.lawyer}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {typeof row.template === 'boolean' ? (
                      row.template ? (
                        <Check className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-red-500 mx-auto" />
                      )
                    ) : (
                      <span className="text-gray-700">{row.template}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center bg-green-50">
                    {typeof row.service === 'boolean' ? (
                      row.service ? (
                        <Check className="w-5 h-5 text-green-700 mx-auto font-bold" />
                      ) : (
                        <X className="w-5 h-5 text-red-500 mx-auto" />
                      )
                    ) : (
                      <span className="text-green-700 font-semibold">{row.service}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

const trustIcons = [ShieldCheck, Sparkles, TrendingUp, Download] as const;

export const TrustSection = () => {
  const { t } = useTranslation('landing');
  const trustPoints = t('trust.points', { returnObjects: true }) as TrustPoint[];

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-5xl text-center mb-4">{t('trust.title')}</h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto text-lg">{t('trust.subtitle')}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {trustPoints.map((point, idx) => {
            const Icon = trustIcons[idx] ?? ShieldCheck;
            return (
              <Card key={point.title} className="border-2 border-green-100">
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-green-700" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg mb-2 font-semibold">{point.title}</h3>
                      <p className="text-gray-600">{point.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <p className="text-gray-700">{t('trust.banner')}</p>
        </div>
      </div>
    </section>
  );
};

type PricingSectionProps = {
  plans: PlanInfo[];
  loading: boolean;
  onSelectPlan: () => void;
};

function landingPlanFeatures(
  tb: (key: string, opts?: { returnObjects?: boolean }) => unknown,
  planId: SubscriptionPlan,
) {
  const v = tb(`plans.${planId}.features`, { returnObjects: true });
  return Array.isArray(v) ? (v as string[]) : [];
}

export const PricingSection = ({ plans, loading, onSelectPlan }: PricingSectionProps) => {
  const { t, i18n } = useTranslation('landing');
  const { t: tb } = useTranslation('billing');
  const localeTag = icuLocaleFor(i18n.language);
  const { currency, setCurrency, currencies } = useBillingDisplayCurrency();
  const { data: fxData, isError: fxError } = useFxRates();
  const rates = fxData?.rates;
  const priceOpts = {
    currency,
    rates,
    fxFailed: fxError,
    locale: localeTag,
    freeLabel: tb('free'),
  };

  return (
    <section id="pricing" className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-5xl text-center mb-4">{t('pricing.title')}</h2>
        <p className="text-center text-gray-600 mb-6 text-lg">{t('pricing.subtitle')}</p>

        {!loading && plans.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <label htmlFor="landing-pricing-currency" className="text-sm text-gray-600">
              {tb('currency.label')}
            </label>
            <select
              id="landing-pricing-currency"
              className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as BillingDisplayCurrency)}
            >
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}
        {fxError && (
          <p className="text-center text-amber-700 text-sm mb-6">{tb('fxStale')}</p>
        )}

        {loading ? (
          <div className="text-center text-gray-600">{t('pricing.loading')}</div>
        ) : plans.length === 0 ? (
          <div className="text-center text-gray-600">{t('pricing.empty')}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => {
              const highlighted = plan.id === 'basic';
              const hasDiscount =
                !!plan.first_month_discount_available &&
                plan.first_month_price !== null &&
                plan.first_month_price !== undefined &&
                plan.price > 0 &&
                plan.first_month_price < plan.price;
              const discountPercent = hasDiscount
                ? Math.round((1 - (plan.first_month_price as number) / plan.price) * 100)
                : null;
              const features = landingPlanFeatures(tb, plan.id);

              return (
                <Card
                  key={plan.id}
                  className={`relative ${
                    highlighted ? 'border-2 border-blue-500 shadow-xl scale-105' : 'border border-gray-200'
                  }`}
                >
                  {highlighted && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-blue-600 text-white px-4 py-1.5 text-sm">
                        {t('pricing.popular')}
                      </Badge>
                    </div>
                  )}

                  <CardHeader>
                    <CardTitle className="text-xl mb-2">{tb(`plans.${plan.id}.title`)}</CardTitle>
                    <div className="mb-2">
                      <span className="text-4xl font-bold">
                        {hasDiscount
                          ? formatRubAmountForUi(plan.first_month_price, priceOpts)
                          : formatRubAmountForUi(plan.price, priceOpts)}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-gray-600 ml-2">{t('pricing.perMonth')}</span>
                      )}
                    </div>
                    {hasDiscount && (
                      <div className="text-sm text-gray-700 space-y-1">
                        <div>
                          <span className="line-through text-gray-400">
                            {formatRubAmountForUi(plan.price, priceOpts)}
                          </span>{' '}
                          <span className="font-semibold text-green-700">
                            {discountPercent !== null ? `-${discountPercent}%` : ''}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">{t('pricing.discountFirstMonth')}</div>
                      </div>
                    )}
                  </CardHeader>

                  <CardContent>
                    <Button
                      className={`w-full mb-6 ${highlighted ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                      size="lg"
                      onClick={onSelectPlan}
                    >
                      {plan.price === 0 ? t('pricing.tryFree') : t('pricing.choosePlan')}
                    </Button>

                    <ul className="space-y-3">
                      {features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export const FAQSection = () => {
  const { t } = useTranslation('landing');
  const items = t('faq.items', { returnObjects: true }) as FaqItem[];

  return (
    <section id="faq" className="py-20 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-5xl text-center mb-4">{t('faq.title')}</h2>
        <p className="text-center text-gray-600 mb-12">{t('faq.subtitle')}</p>
        <Accordion type="single" collapsible className="w-full">
          {items.map((item, index) => (
            <AccordionItem key={item.q} value={`item-${index}`}>
              <AccordionTrigger className="text-left text-lg cursor-pointer">{item.q}</AccordionTrigger>
              <AccordionContent className="text-gray-600">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

type FinalCTASectionProps = {
  onPrimary: () => void;
  onGuest: () => void;
  contractsTotal?: number | null;
};

export const FinalCTASection = ({ onPrimary, onGuest, contractsTotal }: FinalCTASectionProps) => {
  const { t, i18n } = useTranslation('landing');
  const localeTag = icuLocaleFor(i18n.language);
  const totalLabel =
    contractsTotal === null || contractsTotal === undefined
      ? ''
      : t('finalCta.joinLine', { count: contractsTotal.toLocaleString(localeTag) });

  return (
    <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-5xl mb-6">{t('finalCta.title')}</h2>
        <p className="text-xl mb-8 text-blue-100">{t('finalCta.subtitle')}</p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
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
            {t('finalCta.ctaGuest')}
          </Button>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-blue-100 mb-6">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5" />
            <span>{t('finalCta.check1')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5" />
            <span>{t('finalCta.check2')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5" />
            <span>{t('finalCta.check3')}</span>
          </div>
        </div>

        {totalLabel && <p className="text-sm text-blue-100 mt-4">{totalLabel}</p>}
      </div>
    </section>
  );
};
