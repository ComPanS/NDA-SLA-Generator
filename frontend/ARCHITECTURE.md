# Архитектура Frontend

## Обзор

Фронтенд построен на основе современного стека React с использованием принципов Feature-Sliced Design для организации кода.

## Технологический стек

### Core
- **React 18** - UI библиотека
- **TypeScript** - статическая типизация
- **Vite** - сборщик и dev-сервер

### UI & Styling
- **Material-UI (MUI)** - компонентная библиотека
- **Emotion** - CSS-in-JS (встроено в MUI)

### State Management
- **Zustand** - локальное состояние (аутентификация)
- **TanStack Query (React Query)** - серверное состояние и кэширование

### Routing & Network
- **React Router v7** - клиентский роутинг
- **Axios** - HTTP клиент

### Forms & Validation
- **Zod** - валидация схем данных

## Архитектурные паттерны

### Feature-Sliced Design

Проект организован по feature-модулям с четким разделением ответственности:

```
src/
├── app/           # Конфигурация приложения (providers, router, theme)
├── features/      # Feature-модули (auth, contracts, templates, billing)
├── shared/        # Общий переиспользуемый код
└── pages/         # Компоненты страниц
```

### Слои ответственности

#### 1. App Layer (`src/app/`)
Отвечает за глобальную конфигурацию:
- Провайдеры (Theme, Query Client)
- Роутинг
- Глобальная тема

#### 2. Features Layer (`src/features/`)
Изолированные бизнес-модули:

**Структура feature:**
```
features/
└── feature-name/
    ├── hooks/        # React Query хуки и кастомные хуки
    ├── components/   # Компоненты специфичные для фичи
    ├── store/        # Zustand store (если нужен)
    └── index.ts      # Public API фичи
```

**Принципы:**
- Фичи должны быть максимально изолированы
- Фичи могут зависеть от `shared`, но не от других фич
- Экспортировать только необходимый API через `index.ts`

#### 3. Shared Layer (`src/shared/`)
Переиспользуемый код без бизнес-логики:

```
shared/
├── api/          # API клиенты и HTTP конфигурация
├── components/   # Общие UI компоненты
├── types/        # TypeScript типы и интерфейсы
├── hooks/        # Универсальные React хуки
├── utils/        # Утилиты и хелперы
└── constants/    # Константы
```

#### 4. Pages Layer (`src/pages/`)
Компоненты страниц, которые:
- Композируют фичи и shared компоненты
- Связывают роуты с UI
- Минимальная логика (только композиция)

## State Management стратегия

### Серверное состояние (React Query)
Используется для:
- Запросы к API
- Кэширование данных
- Синхронизация с сервером
- Оптимистичные обновления

**Конфигурация:**
```typescript
{
  retry: 1,                    // Одна попытка повтора
  refetchOnWindowFocus: false, // Не обновлять при фокусе
  staleTime: 30000,           // 30 секунд актуальности
}
```

**Query Keys структура:**
```typescript
['templates']              // Список шаблонов
['contracts']              // Список договоров
['contracts', id]          // Конкретный договор
['billing']                // Информация о подписке
```

### Локальное состояние (Zustand)
Используется для:
- Аутентификация (токены, состояние входа)
- UI состояние (модалки, темы)

**Принципы:**
- Минимальное использование
- Только для действительно глобального состояния
- Persist важные данные (auth tokens)

### Component State (useState)
Используется для:
- Локальное UI состояние (формы, toggles)
- Временные данные
- Состояние, не нуждающееся в sharing

## API Layer

### Структура

```
api/
├── client.ts      # Axios instance с interceptors
├── auth.ts        # Auth endpoints
├── contracts.ts   # Contracts endpoints
├── templates.ts   # Templates endpoints
└── billing.ts     # Billing endpoints
```

### Interceptors

**Request Interceptor:**
- Добавляет JWT токен из Zustand store
- Логирование запросов (в dev режиме)

**Response Interceptor:**
- Автоматическое обновление токена при 401
- Централизованная обработка ошибок
- Логаут при невозможности обновить токен

## Routing стратегия

### Защищенные роуты

```typescript
<ProtectedRoute>
  <ProtectedPage />
</ProtectedRoute>
```

Проверяет `isAuthenticated` из Zustand и редиректит на `/login`.

### Роуты

```typescript
/                  # Landing page (публичная)
/login             # Вход (редирект если авторизован)
/register          # Регистрация (редирект если авторизован)
/dashboard         # Дашборд (защищенная)
/new-contract      # Новый договор (защищенная)
/contract/:id      # Просмотр договора (защищенная)
/billing           # Подписка (защищенная)
```

## Типизация

### Naming conventions

```typescript
// Интерфейсы для данных
interface User { ... }
interface Document { ... }

// Props для компонентов
interface ButtonProps { ... }
interface ModalProps { ... }

// Request/Response
interface LoginRequest { ... }
interface LoginResponse { ... }
```

### Типы vs Interfaces

**Interface** для:
- Объектные структуры данных
- Props компонентов
- Расширяемые типы

**Type** для:
- Union types: `type Status = 'active' | 'inactive'`
- Mapped types
- Сложные композиции типов

## Styling подход

### MUI Theme

Централизованная тема в `app/theme.ts`:
- Цветовая палитра
- Типография
- Spacing system
- Компонентные overrides

### Styling pattern

```typescript
// Предпочтительный способ - sx prop
<Box sx={{ p: 2, bgcolor: 'primary.main' }}>
  Content
</Box>

// Для переиспользуемых стилей - styled components
const StyledCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
}));
```

## Performance оптимизации

### Code splitting
- React.lazy для lazy loading страниц
- Dynamic imports для больших библиотек

### Memoization
- `React.memo` для тяжелых компонентов
- `useMemo` для дорогих вычислений
- `useCallback` для стабильных функций

### React Query оптимизации
- Правильный staleTime для редко меняющихся данных
- Prefetching для предсказуемых переходов
- Query invalidation вместо refetch

## Error Handling

### Уровни обработки

1. **API Layer** - interceptors обрабатывают HTTP ошибки
2. **React Query** - error state в хуках
3. **Component** - ErrorMessage компонент для отображения
4. **Error Boundaries** - для критических ошибок (TODO)

### Примеры

```typescript
// В компоненте
const { data, isLoading, error } = useQuery(...);

if (error) {
  return <ErrorMessage message="Не удалось загрузить данные" />;
}
```

## Testing стратегия (TODO)

### Unit tests
- Утилиты и хелперы
- Кастомные хуки
- Чистые функции

### Integration tests
- API клиенты (mock axios)
- React Query хуки
- Форм-валидация

### E2E tests
- Критические user flows
- Авторизация
- Создание договора

## Развертывание

### Build
```bash
npm run build
```
Создает оптимизированный production build в `dist/`.

### Preview
```bash
npm run preview
```
Запускает локальный сервер для тестирования production build.

### Environment Variables
```
VITE_API_URL - URL бэкенда
```

Переменные должны начинаться с `VITE_` чтобы быть доступными в коде.

## Best Practices

### Именование
- Компоненты: PascalCase (`Button.tsx`)
- Хуки: camelCase с префиксом `use` (`useAuth.ts`)
- Утилиты: camelCase (`formatDate.ts`)
- Константы: UPPER_SNAKE_CASE (`API_URL`)

### Imports
```typescript
// Абсолютные импорты через alias
import { Button } from '@/shared/components';
import { useAuth } from '@/features/auth';

// Относительные только для локальных файлов
import { helper } from './utils';
```

### Component structure
```typescript
// 1. Imports
import { ... } from '...';

// 2. Types/Interfaces
interface Props { ... }

// 3. Component
export const Component = ({ prop }: Props) => {
  // 3.1. Hooks
  const [state, setState] = useState();
  const { data } = useQuery();
  
  // 3.2. Handlers
  const handleClick = () => { ... };
  
  // 3.3. Effects
  useEffect(() => { ... }, []);
  
  // 3.4. Render
  return <div>...</div>;
};
```

### Comments
- Комментируйте "почему", а не "что"
- JSDoc для публичных API функций и компонентов
- TODO комментарии для отложенной работы

## Roadmap

### Near term
- [ ] Интеграция Quill.js редактора
- [ ] Error Boundaries
- [ ] Loading skeletons
- [ ] Оптимистичные обновления

### Mid term
- [ ] Unit тесты для критичных частей
- [ ] E2E тесты основных флоу
- [ ] Темная тема
- [ ] i18n поддержка

### Long term
- [ ] PWA функциональность
- [ ] Offline mode
- [ ] Notifications system
- [ ] Analytics интеграция
