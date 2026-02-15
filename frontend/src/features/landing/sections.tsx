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
import { PlanInfo } from '@/shared/types';
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

type HeroSectionProps = {
  contractsTotal?: number | null;
  onPrimary: () => void;
  onGuest: () => void;
};

export const HeroSection = ({ contractsTotal, onPrimary, onGuest }: HeroSectionProps) => {
  const totalLabel =
    contractsTotal === null || contractsTotal === undefined
      ? '—'
      : contractsTotal.toLocaleString('ru-RU');

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl mb-6">
            Защитите свои деньги от недобросовестных клиентов за 5 минут — без юриста и без риска
          </h1>

          <p className="text-lg md:text-xl text-gray-600 mb-8">
            AI-конструктор NDA, ГПХ, оферт и других договоров для фрилансеров, самозанятых и ИП.
            Готовый документ в PDF/DOCX за минуты.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <Button size="lg" className="text-lg px-8 py-6" onClick={onPrimary}>
              <FileText className="mr-2" />
              Создать договор бесплатно
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6" onClick={onGuest}>
              Без регистрации
            </Button>
          </div>
          <p className="text-sm text-gray-700 mb-6">Без ввода платежных данных</p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <span>Первый документ бесплатно</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <span>PDF и DOCX без лишних кликов</span>
            </div>
          </div>

          <div className="mt-8 text-3xl md:text-4xl text-blue-600">
            Уже <span className="font-semibold">{totalLabel}</span> договоров создано
          </div>
        </div>
      </div>
    </section>
  );
};

const painPoints = [
  { icon: XCircle, title: 'Клиент не заплатил', description: 'Работа выполнена, а денег нет' },
  {
    icon: MessageSquareWarning,
    title: 'Требует больше, чем договорились',
    description: 'Постоянные правки без доплаты',
  },
  { icon: Clock, title: 'Спор по срокам', description: 'Кто виноват в задержке?' },
  { icon: FileText, title: 'Ничего не доказать', description: 'Только переписка в мессенджере' },
];

export const PainSection = () => (
  <section className="py-20 px-4 bg-red-50">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl md:text-5xl text-center mb-12">Работа без договора — это риск.</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {painPoints.map((point) => (
          <Card key={point.title} className="border-red-200 bg-white">
            <CardContent className="pt-6">
              <point.icon className="w-12 h-12 text-red-500 mb-4" />
              <h3 className="text-lg mb-2">{point.title}</h3>
              <p className="text-sm text-gray-600">{point.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-xl md:text-3xl text-center font-semibold">
        Один юридически грамотный договор решает эти риски раз и навсегда.
      </p>
    </div>
  </section>
);

const steps = [
  {
    icon: MessageSquare,
    number: '1',
    title: 'Отвечаете на вопросы',
    description: '5–7 минут: простые вопросы о проекте, сроках и оплате',
  },
  {
    icon: Sparkles,
    number: '2',
    title: 'AI формирует договор по ГК РФ',
    description: 'Алгоритм создаёт юридически корректный документ по нормам закона',
  },
  {
    icon: Download,
    number: '3',
    title: 'Редактируете и скачиваете',
    description: 'Внесите правки и получите готовый PDF/DOCX',
  },
];

type HowItWorksProps = { onPrimary: () => void };

export const SolutionHowItWorksSection = ({ onPrimary }: HowItWorksProps) => (
  <section id="how-it-works" className="py-20 px-4 bg-white">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl md:text-5xl text-center mb-4">
        Превращаем договорённости в юридический документ за 3 шага
      </h2>
      <p className="text-center text-gray-600 mb-16 text-lg">Просто, быстро и без юриста</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {steps.map((step, index) => (
          <div key={step.title} className="relative">
            {index < steps.length - 1 && (
              <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-blue-200 z-0" />
            )}
            <div className="relative z-10 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-600 text-white mb-6 relative">
                <step.icon className="w-10 h-10" />
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white text-blue-600 flex items-center justify-center text-sm font-semibold">
                  {step.number}
                </div>
              </div>
              <h3 className="text-xl mb-3">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Button size="lg" className="text-lg px-8 py-6" onClick={onPrimary}>
          Попробовать бесплатно
        </Button>
      </div>
    </div>
  </section>
);

type SocialProofProps = { contractsTotal?: number | null };

export const SocialProofSection = ({ contractsTotal }: SocialProofProps) => {
  const totalLabel =
    contractsTotal === null || contractsTotal === undefined
      ? '—'
      : contractsTotal.toLocaleString('ru-RU');

  const testimonials = [
    {
      name: 'Анна Петрова',
      role: 'UX/UI дизайнер',
      text: 'Теперь на каждый проект — договор за 5 минут. Клиенты стали платить вовремя.',
      initials: 'АП',
    },
    {
      name: 'Дмитрий Соколов',
      role: 'Веб-разработчик',
      text: 'Договор помог отстоять оплату за доработки. Удобно, что можно редактировать текст.',
      initials: 'ДС',
    },
    {
      name: 'Мария Иванова',
      role: 'Контент-маркетолог',
      text: 'Экспорт в DOCX — спасение. Дорабатываю формулировки под каждого клиента.',
      initials: 'МИ',
    },
  ];

  return (
    <section id="reviews" className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="text-5xl md:text-7xl mb-2">
            <span className="text-blue-600 font-bold">{totalLabel}</span>
          </div>
          <p className="text-2xl md:text-3xl text-gray-700">договоров уже создано</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {[
            { icon: Users, value: totalLabel, label: 'Договоров создано' },
            { icon: ShieldCheck, value: 'Риски под контролем', label: 'Подсветка проблемных пунктов' },
            { icon: TrendingUp, value: 'Сохраняем версии', label: 'История правок и экспорт' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <stat.icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <div className="text-2xl md:text-3xl mb-2 font-semibold">{stat.value}</div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        <h2 className="text-3xl md:text-4xl text-center mb-12">Что говорят пользователи</h2>
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
                {/* <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Check key={i} className="w-4 h-4 text-green-500" />
                  ))}
                </div> */}
                <p className="text-sm text-gray-700">{testimonial.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

const comparisonData = [
  { feature: 'Стоимость', lawyer: '10 000–30 000 ₽', template: 'Бесплатно', service: 'от 0 ₽' },
  { feature: 'Время создания', lawyer: '3–7 дней', template: '2–3 часа', service: '5 минут' },
  { feature: 'Юридическая корректность', lawyer: true, template: false, service: true },
  { feature: 'Адаптация под вас', lawyer: true, template: false, service: true },
  { feature: 'Подсветка рисков', lawyer: true, template: false, service: true },
  { feature: 'Можно редактировать', lawyer: false, template: true, service: true },
  { feature: 'Экспорт DOCX/PDF', lawyer: true, template: true, service: true },
];

export const ComparisonSection = () => (
  <section className="py-20 px-4 bg-gray-50">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl md:text-5xl text-center mb-4">Сравнение с альтернативами</h2>
      <p className="text-center text-gray-600 mb-12 text-lg">
        Экономия времени и денег по сравнению с юристом или шаблоном из интернета
      </p>

      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded-lg overflow-hidden shadow-lg">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-6 py-4 text-left">Критерий</th>
              <th className="px-6 py-4 text-center">Нанять юриста</th>
              <th className="px-6 py-4 text-center">Скачать шаблон</th>
              <th className="px-6 py-4 text-center bg-green-50">
                <span className="text-green-700 font-semibold text-lg">Наш AI-конструктор</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {comparisonData.map((row) => (
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

const trustPoints = [
  {
    icon: ShieldCheck,
    title: 'Структура по ГК РФ',
    description:
      'Разделы договора соответствуют нормам ГК РФ. Документ можно использовать в переговорах и суде.',
  },
  {
    icon: Sparkles,
    title: 'Редактируйте как угодно',
    description:
      'Вы контролируете содержание: меняйте формулировки, добавляйте пункты или скрывайте лишнее.',
  },
  {
    icon: TrendingUp,
    title: 'Подсветка рисков',
    description: 'AI подсвечивает потенциально опасные места, чтобы вы не пропустили важное.',
  },
  {
    icon: Download,
    title: 'Версии и экспорт',
    description: 'Храним версии, экспортируем в PDF и DOCX без лишних действий.',
  },
];

export const TrustSection = () => (
  <section className="py-20 px-4 bg-white">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl md:text-5xl text-center mb-4">
        Договоры соответствуют ГК РФ и выдержат проверку
      </h2>
      <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto text-lg">
        Не просто генерация текста — юридически значимые документы с учётом рисков
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {trustPoints.map((point) => (
          <Card key={point.title} className="border-2 border-green-100">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <point.icon className="w-6 h-6 text-green-700" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg mb-2 font-semibold">{point.title}</h3>
                  <p className="text-gray-600">{point.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
        <p className="text-gray-700">
          <span className="font-semibold">Персональные данные под защитой.</span> Документы
          шифруются и обрабатываются по требованиям 152-ФЗ.
        </p>
      </div>
    </div>
  </section>
);

type PricingSectionProps = {
  plans: PlanInfo[];
  loading: boolean;
  onSelectPlan: () => void;
};

const formatPrice = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '—';
  if (value === 0) return 'Бесплатно';
  return `${new Intl.NumberFormat('ru-RU').format(value)} ₽`;
};

export const PricingSection = ({ plans, loading, onSelectPlan }: PricingSectionProps) => (
  <section id="pricing" className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl md:text-5xl text-center mb-4">Простые и честные цены</h2>
      <p className="text-center text-gray-600 mb-12 text-lg">
        Первый договор бесплатно. Экспорт в PDF/DOCX, история версий и подсветка рисков.
      </p>

      {loading ? (
        <div className="text-center text-gray-600">Загружаем тарифы...</div>
      ) : plans.length === 0 ? (
        <div className="text-center text-gray-600">Тарифы временно недоступны.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const highlighted = plan.id === 'pro' || plan.id === 'standard';
            const hasDiscount =
              !!plan.first_month_discount_available &&
              plan.first_month_price !== null &&
              plan.first_month_price !== undefined &&
              plan.price > 0 &&
              plan.first_month_price < plan.price;
            const discountPercent = hasDiscount
              ? Math.round((1 - (plan.first_month_price as number) / plan.price) * 100)
              : null;

            return (
              <Card
                key={plan.id}
                className={`relative ${
                  highlighted ? 'border-2 border-blue-500 shadow-xl scale-105' : 'border border-gray-200'
                }`}
              >
                {highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white px-4 py-1.5 text-sm">Самый популярный</Badge>
                  </div>
                )}

                <CardHeader>
                  <CardTitle className="text-xl mb-2">{plan.name}</CardTitle>
                  <div className="mb-2">
                    <span className="text-4xl font-bold">
                      {hasDiscount ? formatPrice(plan.first_month_price) : formatPrice(plan.price)}
                    </span>
                    {plan.price > 0 && <span className="text-gray-600 ml-2">/ месяц</span>}
                  </div>
                  {hasDiscount && (
                    <div className="text-sm text-gray-700 space-y-1">
                      <div>
                        <span className="line-through text-gray-400">{formatPrice(plan.price)}</span>{' '}
                        <span className="font-semibold text-green-700">
                          {discountPercent !== null ? `-${discountPercent}%` : ''}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">Скидка на первый месяц</div>
                    </div>
                  )}
                  <p className="text-sm text-gray-600 mt-2">
                    {plan.features[0] || 'Доступ ко всем основным функциям'}
                  </p>
                </CardHeader>

                <CardContent>
                  <Button
                    className={`w-full mb-6 ${highlighted ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    size="lg"
                    onClick={onSelectPlan}
                  >
                    {plan.price === 0 ? 'Попробовать бесплатно' : 'Выбрать тариф'}
                  </Button>

                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
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

const faqItems = [
  // Оригинальные вопросы
  {
    q: 'Сколько времени занимает подготовка договора?',
    a: 'Обычно генерация и базовые правки занимают 3–7 минут. Дальше можно сразу экспортировать в PDF/DOCX.',
  },
  {
    q: 'Нужна ли регистрация?',
    a: 'Первый тестовый договор можно сделать без регистрации. Для истории, версий и экспорта лучше войти.',
  },
  {
    q: 'Можно ли менять структуру разделов?',
    a: 'Да, разделы и поля можно включать/выключать и менять порядок перед генерацией.',
  },
  {
    q: 'Что такое шаблон и договор?',
    a: 'Шаблон задаёт поля и разделы. Договор создаётся на основе шаблона и хранится в аккаунте.',
  },
  {
    q: 'Как внести правки после генерации?',
    a: 'Откройте договор в редакторе, поправьте текст и экспортируйте обновлённую версию.',
  },
  {
    q: 'Какой формат экспорта доступен?',
    a: 'Поддерживаются DOCX и PDF. Экспорт доступен из карточки договора.',
  },
  {
    q: 'Работает ли без шаблона?',
    a: 'Да, можно сгенерировать договор без шаблона: укажите заголовок и подсказку — AI предложит структуру.',
  },
  {
    q: 'Можно ли использовать свои данные сторон?',
    a: 'Да, заполните поля в шаблоне или договоре перед генерацией — они попадут в финальный текст.',
  },
  // Вопросы из нового лендинга
  {
    q: 'Это законно?',
    a: 'Да. Сервис помогает составить договор, но финальную ответственность за содержание несёте вы. Мы используем стандартные формулировки по ГК РФ; при сложных кейсах стоит проконсультироваться с юристом.',
  },
  {
    q: 'Могу ли я использовать договор в суде?',
    a: 'Да, при подписании обеими сторонами договор соответствует нормам ГК РФ. Пользователи уже применяли такие договоры в спорах для взыскания оплаты.',
  },
  {
    q: 'Подойдёт ли для суда?',
    a: 'Структура документа соответствует требованиям ГК РФ. Для сложных сделок рекомендуем консультацию профильного юриста.',
  },
  {
    q: 'Кто отвечает за ошибки?',
    a: 'Финальное решение за вами: вы редактируете договор и утверждаете формулировки. AI подсвечивает риски, но документ нужно проверить перед использованием.',
  },
  {
    q: 'Можно ли менять формулировки?',
    a: 'Да, документ полностью редактируем: меняйте пункты, добавляйте условия, удаляйте лишнее. Экспорт в DOCX позволяет доработать в редакторе.',
  },
  {
    q: 'Что если клиент не хочет подписывать договор, созданный через AI?',
    a: 'Документ выглядит профессионально. Вы можете позиционировать его как типовой или составленный через сервис. Предложение подписать договор само по себе демонстрирует добросовестность.',
  },
  {
    q: 'Какие типы договоров можно создать?',
    a: 'ГПХ, NDA, договоры оказания услуг, подряда, агентские, лицензионные соглашения, публичные оферты и другие. База шаблонов пополняется.',
  },
  {
    q: 'Нужна ли регистрация для первого договора?',
    a: 'Нет. Первый договор можно создать и скачать бесплатно без регистрации. Регистрация нужна для сохранения истории и расширенных функций.',
  },
  {
    q: 'Что делать, если нужна консультация юриста?',
    a: 'На тарифе «Бизнес» доступна базовая консультация. Для сложных случаев можем порекомендовать партнёров-юристов.',
  },
];

export const FAQSection = () => (
  <section id="faq" className="py-20 px-4 bg-white">
    <div className="max-w-3xl mx-auto">
      <h2 className="text-3xl md:text-5xl text-center mb-4">Частые вопросы</h2>
      <p className="text-center text-gray-600 mb-12">Ответы на главные сомнения</p>
      <Accordion type="single" collapsible className="w-full">
        {faqItems.map((item, index) => (
          <AccordionItem key={item.q} value={`item-${index}`}>
            <AccordionTrigger className="text-left text-lg cursor-pointer">{item.q}</AccordionTrigger>
            <AccordionContent className="text-gray-600">{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);

type FinalCTASectionProps = { onPrimary: () => void; onGuest: () => void; contractsTotal?: number | null };

export const FinalCTASection = ({ onPrimary, onGuest, contractsTotal }: FinalCTASectionProps) => {
  const totalLabel =
    contractsTotal === null || contractsTotal === undefined
      ? ''
      : `Присоединяйтесь к ${contractsTotal.toLocaleString('ru-RU')} созданным договорам`;

  return (
    <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-5xl mb-6">Начните защищать свои доходы сегодня</h2>
        <p className="text-xl mb-8 text-blue-100">
          Создайте юридически грамотный договор за 5 минут. Экспортируйте в PDF или DOCX без лишних действий.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <Button
            size="lg"
            className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6"
            onClick={onPrimary}
          >
            <FileText className="mr-2" />
            Создать договор бесплатно
            <ArrowRight className="ml-2" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="bg-white/10 border-white/40 text-white hover:bg-white/10 text-lg px-8 py-6"
            onClick={onGuest}
          >
            Без регистрации
          </Button>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-blue-100 mb-6">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5" />
            <span>PDF и DOCX</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5" />
            <span>Без ввода карты</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5" />
            <span>Подсветка рисков</span>
          </div>
        </div>

        {totalLabel && <p className="text-sm text-blue-100 mt-4">{totalLabel}</p>}
      </div>
    </section>
  );
};
