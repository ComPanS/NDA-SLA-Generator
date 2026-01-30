# NDA/SLA Generator - Frontend

Современный фронтенд для генератора NDA и SLA договоров, построенный на React 18 + TypeScript.

## Технологический стек

- **React 18** - библиотека для построения UI
- **TypeScript** - строгая типизация
- **Vite** - быстрый сборщик
- **Material-UI (MUI)** - компоненты UI
- **React Router v7** - роутинг
- **TanStack Query (React Query)** - управление серверным состоянием и кэширование
- **Zustand** - управление локальным состоянием (аутентификация)
- **Axios** - HTTP клиент
- **Quill.js** - WYSIWYG редактор для документов
- **Zod** - валидация данных

## Архитектура

Проект использует модифицированный Feature-Sliced Design подход:

```
src/
├── app/              # Конфигурация приложения
│   ├── router.tsx    # Роутинг
│   ├── providers.tsx # Провайдеры (Theme, Query)
│   └── theme.ts      # Тема MUI
│
├── features/         # Фичи (модули)
│   ├── auth/         # Аутентификация
│   │   ├── hooks/    # React Query хуки
│   │   └── store/    # Zustand store
│   ├── contracts/    # Договоры
│   ├── templates/    # Шаблоны
│   └── billing/      # Подписка
│
├── shared/           # Общий код
│   ├── api/          # API клиенты
│   ├── components/   # Переиспользуемые компоненты
│   └── types/        # TypeScript типы
│
└── pages/            # Страницы
    ├── Landing.tsx
    ├── Login.tsx
    ├── Register.tsx
    ├── Dashboard.tsx
    ├── NewContract.tsx
    ├── ContractView.tsx
    └── Billing.tsx
```

## Быстрый старт

### Установка зависимостей

```bash
npm install
```

### Запуск dev сервера

```bash
npm run dev
```

Приложение будет доступно по адресу http://localhost:5173

### Сборка для продакшена

```bash
npm run build
```

### Предварительный просмотр продакшн билда

```bash
npm run preview
```

## Переменные окружения

Создайте файл `.env` на основе `.env.example`:

```bash
VITE_API_URL=http://localhost:8001
```

## Основные фичи

### Аутентификация

- Регистрация и вход через email/пароль
- JWT токены (access + refresh)
- Автоматическое обновление токенов
- Protected routes

### Генерация договоров

- Выбор из готовых шаблонов
- Генерация через YandexGPT API
- Уточнение (refine) сгенерированного текста
- Экспорт в DOCX и PDF

### Управление подписками

- 3 тарифа: Free, Pro, Pay-per-use
- Просмотр текущего тарифа
- Переключение тарифов

## Структура данных

### Основные типы

```typescript
// Аутентификация
interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
}

// Документ
interface Document {
  id: string;
  title: string;
  owner_id: string;
  template_id: string | null;
  status: 'draft' | 'final';
  created_at: string;
  updated_at: string;
  versions: DocumentVersion[];
}

// Шаблон
interface Template {
  id: string;
  name: string;
  description: string | null;
  content: string;
  is_active: boolean;
}
```

## API клиент

API клиент настроен с автоматическими перехватчиками:

- Добавление JWT токена в заголовки
- Автоматическое обновление токена при 401 ошибке
- Централизованная обработка ошибок

## React Query

Все серверные запросы управляются через React Query:

```typescript
// Пример использования
const { data, isLoading, error } = useTemplates();
const { mutate } = useGenerateContract();
```

Конфигурация по умолчанию:
- `retry: 1` - одна попытка повтора при ошибке
- `refetchOnWindowFocus: false` - не обновлять при фокусе окна
- `staleTime: 30000` - данные считаются актуальными 30 секунд

## Стилизация

Используется MUI с кастомной темой:

- Основной цвет: `#1976d2` (синий)
- Вторичный цвет: `#9c27b0` (фиолетовый)
- Радиус скругления: `8px`
- Адаптивный дизайн из коробки

## Расширяемость

### Добавление новой фичи

1. Создайте папку в `src/features/`:
```
features/
└── my-feature/
    ├── hooks/
    │   └── useMyFeature.ts
    ├── components/
    │   └── MyComponent.tsx
    └── store/ (если нужен)
        └── myStore.ts
```

2. Добавьте API методы в `src/shared/api/`
3. Создайте типы в `src/shared/types/`
4. Добавьте страницы в `src/pages/`
5. Обновите роутер в `src/app/router.tsx`

### Добавление новой страницы

1. Создайте компонент в `src/pages/MyPage.tsx`
2. Добавьте роут в `src/app/router.tsx`:

```typescript
{
  path: '/my-page',
  element: <MyPage />,
}
```

### Добавление защищенного роута

Оберните компонент в `ProtectedRoute`:

```typescript
import { ProtectedRoute } from '@/shared/components';

export const MyProtectedPage = () => {
  return (
    <ProtectedRoute>
      <Layout>
        {/* Контент */}
      </Layout>
    </ProtectedRoute>
  );
};
```

## Скрипты

```bash
npm run dev          # Запуск dev сервера
npm run build        # Сборка для продакшена
npm run preview      # Предпросмотр продакшн билда
npm run lint         # Запуск ESLint
npm run format       # Форматирование кода Prettier
npm test             # Запуск тестов (Vitest)
```

## Требования

- Node.js 18+
- npm 9+ или pnpm 8+

## Дальнейшее развитие

### Планируемые фичи:

- [ ] Интеграция Quill.js редактора для просмотра и редактирования договоров
- [ ] История документов на Dashboard
- [ ] Версионирование документов
- [ ] Реальная интеграция с экспортом DOCX/PDF
- [ ] OAuth авторизация (Google, VK)
- [ ] Интеграция с ЮKassa для оплаты
- [ ] Темная тема
- [ ] i18n (мультиязычность)
- [ ] PWA поддержка
- [ ] Unit и E2E тесты

## Лицензия

MIT © 2026 ComPanS
