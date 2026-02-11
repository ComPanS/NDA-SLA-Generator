import { useEffect } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Container,
  Typography,
  Stack,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Description,
  Speed,
  Security,
  ExpandMore,
  Check,
  Star,
  WarningAmber,
  AccessTime,
  Savings,
  Shield,
  PeopleAlt,
  Layers,
  FlashOn,
  TableChart,
} from '@mui/icons-material';
import { Layout } from '@/shared/components';
import { useAuthStore } from '@/features/auth/hooks/useAuth';
import { PageMeta } from '@/shared/components/PageMeta';
import { useQuery } from '@tanstack/react-query';
import { billingApi, contractsApi } from '@/shared/api';

const faqItems = [
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
];

const whyUsItems = [
  {
    title: 'Договоры не теряются',
    desc: 'Храним сохранения и версии в аккаунте — можно откатиться и сравнить.',
  },
  {
    title: 'AI — соавтор, а не разовая генерация',
    desc: 'Уточняйте и редактируйте текст вместе с моделью, пока не будет «та самое» формулировка.',
  },
  {
    title: 'Живой редактор в браузере',
    desc: 'Правьте финальный вариант прямо на сайте, без скачиваний и пересборок.',
  },
  {
    title: 'Шаблоны под ваш процесс',
    desc: 'Гибко настраивайте поля и разделы, а при использовании сразу правьте данные шаблона.',
  },
  {
    title: 'Экспорт без лишних кликов',
    desc: 'DOCX и PDF готовы сразу после правок — не нужно копировать вручную.',
  },
  {
    title: 'Структура под контролем',
    desc: 'Задайте разделы договора, и AI будет писать строго по ним.',
  },
  {
    title: 'Проверка на юрриски',
    desc: 'Сервис подсветит потенциальные проблемы и даст рекомендации, что поправить.',
  },
];

const audience = ['Самозанятые', 'Фрилансеры', 'ИП', 'IT', 'Маркетинг', 'Дизайн'];

const painItems = [
  {
    title: 'Клиент не заплатил',
    desc: 'Без договора сложно доказать, что работа выполнена и должна быть оплачена.',
  },
  {
    title: 'Спор по объёму работ',
    desc: 'Нет зафиксированных условий — заказчик может требовать больше или оспорить результат.',
  },
  {
    title: 'Срывы сроков',
    desc: 'Нечёткие даты и ответственность — рискуете штрафами или потерей проекта.',
  },
  {
    title: 'Ничего не доказать в суде',
    desc: 'Переписка в мессенджере — слабое доказательство, нужна юридическая форма.',
  },
];

const howItWorks = [
  {
    icon: Layers,
    title: 'Выбираете тип договора',
    desc: 'NDA, ГПХ, SLA, оферта или свой шаблон под задачу.',
  },
  {
    icon: Description,
    title: 'Отвечаете на вопросы',
    desc: 'Без юртерминов: просто заполните ключевые детали — мы сформулируем сами.',
  },
  {
    icon: Speed,
    title: 'Получаете готовый документ',
    desc: 'PDF/DOCX за 5 минут вместо часов поиска и правок.',
  },
];

const comparisonRows = [
  {
    label: 'Стоимость',
    lawyer: '3 000–10 000 ₽',
    template: 'Бесплатно, но риски',
    ai: 'От 0 ₽, экономия до 90%',
  },
  {
    label: 'Скорость',
    lawyer: '1–2 дня',
    template: 'Часы правок',
    ai: '≈5 минут',
  },
  {
    label: 'Адаптация под задачу',
    lawyer: 'Да',
    template: 'Часто нет',
    ai: 'Под ваши ответы',
  },
  {
    label: 'Риски ошибок',
    lawyer: 'Низкие',
    template: 'Высокие',
    ai: 'Подсветка рисков',
  },
  {
    label: 'Удобство',
    lawyer: 'Переписка и правки',
    template: 'Копирование вручную',
    ai: 'Редактор + экспорт',
  },
];

export const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ['landing', 'plans'],
    queryFn: () => billingApi.getPlans(),
  });
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['contracts', 'public-stats'],
    queryFn: () => contractsApi.getPublicStats(),
  });
  const contractsTotal = statsData?.contracts_total ?? null;

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <Layout>
      <PageMeta
        title="AI-конструктор договоров: NDA, SLA, ГПХ и любые соглашения"
        description="Создавайте договоры с помощью AI за минуты: NDA, SLA, ГПХ, оферты и индивидуальные соглашения с экспортом DOCX/PDF."
      />
      <Box
        sx={{
          textAlign: 'center',
          py: 10,
          px: 2,
          bgcolor: 'background.paper',
        }}
      >
        <Chip label="Без договора вы юридически не защищены" color="warning" sx={{ mb: 2 }} />
        <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
          Работаете без договора? Рискуете деньгами.
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph sx={{ mb: 4 }}>
          Создайте юридически корректный договор за 5 минут без юриста. Экономия до 90% по сравнению
          с юристом за 3 000–10 000 ₽.
        </Typography>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          justifyContent="center"
          sx={{ mb: 3 }}
        >
          <Button variant="contained" size="large" onClick={() => navigate('/register')}>
            Создать договор бесплатно
          </Button>
          <Button variant="outlined" size="large" onClick={() => navigate('/guest-contract')}>
            Создать без регистрации
          </Button>
          <Button variant="text" size="large" onClick={() => navigate('/login')}>
            Войти
          </Button>
        </Stack>
        <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
          {audience.map((item) => (
            <Chip key={item} label={item} variant="outlined" />
          ))}
        </Stack>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          justifyContent="center"
          alignItems="center"
          sx={{ mt: 4 }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Security color="primary" />
            <Typography variant="body1">Защита оплаты и условий</Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Speed color="primary" />
            <Typography variant="body1">Готовый документ за ≈5 минут</Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Savings color="primary" />
            <Typography variant="body1">Экономия до 90% без юриста</Typography>
          </Stack>
        </Stack>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Shield color="primary" />
                  <Box>
                    <Typography variant="h6">Докажете свои договорённости</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Переписка в мессенджере — не защита. Договор фиксирует оплату, сроки и объём.
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <AccessTime color="primary" />
                  <Box>
                    <Typography variant="h6">5 минут вместо часов</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Отвечаете на вопросы — сервис формулирует юридический текст и готовит
                      PDF/DOCX.
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Savings color="primary" />
                  <Box>
                    <Typography variant="h6">Экономия до 90%</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Юрист стоит 3 000–10 000 ₽. Здесь — от 0 ₽ по подписке.
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      <Container maxWidth="lg" sx={{ pb: 8 }}>
        <Card sx={{ p: { xs: 3, md: 4 } }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center">
            <PeopleAlt color="primary" sx={{ fontSize: 48 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" gutterBottom>
                Социальное доказательство
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Уже создано реальных договоров пользователями сервиса.
              </Typography>
              <Stack direction="row" spacing={3} alignItems="baseline">
                <Typography variant="h3" color="primary" fontWeight={800}>
                  {statsLoading ? '...' : (contractsTotal ?? '—')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  договоров создано
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Card>
      </Container>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Stack spacing={3}>
          <Stack direction="row" spacing={1} alignItems="center">
            <WarningAmber color="warning" />
            <Typography variant="h4" component="h2">
              Что будет, если договора нет
            </Typography>
          </Stack>
          <Grid container spacing={2}>
            {painItems.map((item) => (
              <Grid item xs={12} md={3} key={item.title}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.desc}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Container>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Stack spacing={3}>
          <Stack direction="row" spacing={1} alignItems="center">
            <FlashOn color="primary" />
            <Typography variant="h4" component="h2">
              Как это работает
            </Typography>
          </Stack>
          <Grid container spacing={2}>
            {howItWorks.map((item) => {
              const Icon = item.icon;
              return (
                <Grid item xs={12} md={4} key={item.title}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Stack direction="row" spacing={2} alignItems="flex-start">
                        <Icon color="primary" />
                        <Box>
                          <Typography variant="subtitle1" fontWeight={700}>
                            {item.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.desc}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Stack>
      </Container>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Description color="primary" />
                <Typography variant="h4" component="h2">
                  Пример реального договора
                </Typography>
              </Stack>
              <Typography variant="body1" color="text.secondary">
                Фрагмент с типовой структурой: так выглядит документ после генерации, готовый к
                экспорту.
              </Typography>
              <Box
                component="pre"
                sx={{
                  bgcolor: 'grey.100',
                  color: 'grey.900',
                  borderRadius: 2,
                  p: 2,
                  fontSize: 13,
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {`1. Преамбула
«___» _________ 20__ г. между Стороной 1, в лице Самозанятого, действующего на основании свидетельства о постановке на учёт в качестве плательщика налога на профессиональный доход, и Стороной 2, в лице Физического лица, действующего на основании паспорта, заключён настоящий Договор о нижеследующем:

2. Предмет договора
2.1. Сторона 1 обязуется оказать Стороне 2 услуги, а Сторона 2 обязуется оплатить эти услуги в порядке и на условиях, предусмотренных настоящим Договором.

2.2. Перечень и объём оказываемых услуг указаны в Приложении №1 к настоящему Договору.

3. Права и обязанности сторон
3.1. Сторона 1 обязуется:

3.1.1. Оказать услуги в соответствии с условиями настоящего Договора.
3.1.2. Обеспечить качество и соответствие оказываемых услуг требованиям законодательства.
3.2. Сторона 2 обязуется:

3.2.1. Оплатить оказанные услуги в порядке и на условиях, предусмотренных настоящим Договором.
3.2.2. Предоставить Стороне 1 всю необходимую информацию и документы для оказания услуг.
4. Ответственность сторон
4.1. Стороны несут ответственность за неисполнение или ненадлежащее исполнение своих обязательств по настоящему Договору в соответствии с действующим законодательством.

4.2. В случае просрочки оплаты услуг Сторона 2 обязуется уплатить Стороне 1 пени в размере __% от суммы задолженности за каждый день просрочки.

5. Срок действия и порядок расторжения
5.1. Настоящий Договор вступает в силу с момента его подписания обеими Сторонами и действует до выполнения Сторонами своих обязательств.

5.2. Договор может быть расторгнут по соглашению Сторон или в одностороннем порядке через суд при наличии оснований, предусмотренных действующим законодательством.

6. Урегулирование споров
6.1. Все споры и разногласия, возникающие из настоящего Договора или в связи с ним, разрешаются Сторонами путём переговоров.

6.2. В случае невозможности урегулирования споров путём переговоров они подлежат рассмотрению в суде в соответствии с действующим законодательством.

7. Заключительные положения
7.1. Любые изменения и дополнения к настоящему Договору должны быть совершены в письменной форме и подписаны обеими Сторонами.

7.2. Настоящий Договор составлен в двух экземплярах, по одному для каждой из Сторон, имеющих равную юридическую силу.

8. Реквизиты и подписи сторон
Сторона 1:

Наименование: _________________________________________

ИНН: _________________________________________________

Адрес: _______________________________________________

Подпись: _____________________________________________

Дата: «___» _________ 20__ г.

Расшифровка подписи: ________________________________

Сторона 2:

ФИО: _______________________________________________

Паспорт: ___________________________________________

Адрес: _______________________________________________

Подпись: _____________________________________________

Дата: «___» _________ 20__ г.

Расшифровка подписи: ________________________________`}
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Container>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Stack spacing={3}>
          <Stack direction="row" spacing={1} alignItems="center">
            <TableChart color="primary" />
            <Typography variant="h4" component="h2">
              Чем ДоговорAI лучше альтернатив
            </Typography>
          </Stack>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>Юрист</TableCell>
                  <TableCell>Шаблон из интернета</TableCell>
                  <TableCell>ДоговорAI</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {comparisonRows.map((row) => (
                  <TableRow key={row.label}>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 600 }}>
                      {row.label}
                    </TableCell>
                    <TableCell>{row.lawyer}</TableCell>
                    <TableCell>{row.template}</TableCell>
                    <TableCell>{row.ai}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </Container>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Stack spacing={3}>
          <Typography variant="h4" component="h2">
            Наши абсолютные преимущества
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Чтобы не тратить недели на переписки, мы собрали инструменты, которые реально экономят
            время юристов и продактов.
          </Typography>
          <Grid container spacing={2}>
            {whyUsItems.map((item) => (
              <Grid item xs={12} md={6} key={item.title}>
                <Card
                  variant="outlined"
                  sx={{
                    height: '100%',
                    borderColor: 'primary.light',
                    boxShadow: '0 12px 28px rgba(0,0,0,0.04)',
                  }}
                >
                  <CardContent>
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          bgcolor: 'primary.light',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Check fontSize="small" color="primary" />
                      </Box>
                      <Stack spacing={0.5}>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {item.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.desc}
                        </Typography>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Container>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Stack spacing={3}>
          <Typography variant="h4" component="h2">
            Частые вопросы
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Короткие ответы на популярные вопросы о работе сервиса.
          </Typography>
          <Stack spacing={1}>
            {faqItems.map((item, idx) => (
              <Accordion key={idx}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {item.q}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary">
                    {item.a}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        </Stack>
      </Container>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Stack spacing={3} sx={{ mb: 4 }}>
          <Typography variant="h4" component="h2">
            Тарифы без разовых оплат
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Подписка: бесплатный старт, гибкие лимиты, экспорт в PDF/DOCX. Экономия до 90% по
            сравнению с юристом за 3 000–10 000 ₽.
          </Typography>
        </Stack>
        {plansLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {(plansData?.plans || []).map((plan) => {
              const isPro = plan.id === 'pro';
              const hasDiscount =
                !!plan.first_month_discount_available &&
                plan.first_month_price !== null &&
                plan.first_month_price !== undefined &&
                plan.price > 0 &&
                plan.first_month_price < plan.price;
              const discountPercent = hasDiscount
                ? Math.round((1 - (plan.first_month_price as number) / plan.price) * 100)
                : null;
              const displayPrice =
                hasDiscount && plan.first_month_price !== null
                  ? plan.first_month_price
                  : plan.price;
              return (
                <Grid item xs={12} sm={6} md={3} key={plan.id}>
                  <Card
                    sx={{
                      position: 'relative',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      border: isPro ? 2 : 1,
                      borderColor: isPro ? 'primary.main' : 'divider',
                    }}
                  >
                    {isPro && (
                      <Chip
                        icon={<Star />}
                        label="Популярный"
                        color="primary"
                        size="small"
                        sx={{ position: 'absolute', top: 12, right: 12 }}
                      />
                    )}
                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="h5" gutterBottom>
                        {plan.name}
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="h3" component="span" color="primary">
                          {displayPrice === 0 ? 'Бесплатно' : `${displayPrice} ₽`}
                        </Typography>
                        {plan.price > 0 && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            component="span"
                            sx={{ ml: 0.5 }}
                          >
                            / месяц
                          </Typography>
                        )}
                        {hasDiscount && (
                          <Typography variant="body2" color="text.secondary" component="div">
                            <span style={{ textDecoration: 'line-through' }}>{plan.price} ₽</span>{' '}
                            {discountPercent !== null ? `-${discountPercent}%` : ''}
                            <Typography variant="caption" color="text.secondary" component="div">
                              Скидка только на первый месяц
                            </Typography>
                          </Typography>
                        )}
                      </Box>
                      {/* <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Договоров: {formatLimit(plan.limits.contracts_per_month)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Шаблонов: {formatLimit(plan.limits.max_templates)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Уточнений: {formatLimit(plan.limits.ai_clarifications)}
                        </Typography>
                      </Box> */}
                      <List dense>
                        {plan.features.map((feature, idx) => (
                          <ListItem key={idx} disableGutters sx={{ py: 0.25 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <Check color="primary" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                              primary={feature}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                    <Box sx={{ p: 2, pt: 0 }}>
                      <Button
                        fullWidth
                        variant={isPro ? 'contained' : 'outlined'}
                        onClick={() => navigate('/register')}
                      >
                        Создать договор бесплатно
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Container>

      <Box sx={{ py: 8, textAlign: 'center', bgcolor: 'background.paper' }}>
        <Typography variant="h4" gutterBottom>
          Готовы начать?
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Первый документ бесплатно, без регистрации. Подписка вместо разовых оплат.
        </Typography>
        <Button variant="contained" size="large" onClick={() => navigate('/register')}>
          Создать договор
        </Button>
        <Button
          variant="outlined"
          size="large"
          sx={{ ml: 2 }}
          onClick={() => navigate('/guest-contract')}
        >
          Создать без регистрации
        </Button>
      </Box>
    </Layout>
  );
};
