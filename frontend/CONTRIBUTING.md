# Contributing to NDA/SLA Generator Frontend

Спасибо за интерес к проекту! Этот документ описывает процесс разработки и лучшие практики.

## Начало работы

### Требования
- Node.js 18+
- npm или pnpm

### Установка

```bash
# Клонировать репозиторий
git clone https://github.com/your-username/NDA-SLA-Generator.git
cd NDA-SLA-Generator/frontend

# Установить зависимости
npm install

# Запустить dev сервер
npm run dev
```

## Структура проекта

Читайте [ARCHITECTURE.md](./ARCHITECTURE.md) для детального понимания архитектуры.

## Coding Standards

### TypeScript

- Строгий режим включен
- Избегайте `any`, используйте `unknown` если тип неизвестен
- Всегда типизируйте props компонентов
- Используйте интерфейсы для объектов, type для unions

### Naming Conventions

```typescript
// Компоненты - PascalCase
export const MyComponent = () => { ... }

// Хуки - camelCase с префиксом use
export const useMyHook = () => { ... }

// Файлы компонентов - PascalCase
MyComponent.tsx

// Файлы хуков - camelCase
useMyHook.ts

// Константы - UPPER_SNAKE_CASE
export const API_BASE_URL = '...'

// Типы и интерфейсы - PascalCase
interface UserData { ... }
type Status = 'active' | 'inactive'
```

### Component Structure

```typescript
import { useState, useEffect } from 'react';
import { Box, Button } from '@mui/material';

// 1. Types & Interfaces
interface MyComponentProps {
  title: string;
  onSave?: () => void;
}

// 2. Component
export const MyComponent = ({ title, onSave }: MyComponentProps) => {
  // 2.1. Hooks
  const [isOpen, setIsOpen] = useState(false);
  const { data, isLoading } = useQuery(...);

  // 2.2. Handlers
  const handleClick = () => {
    setIsOpen(true);
    onSave?.();
  };

  // 2.3. Effects
  useEffect(() => {
    // Side effects
  }, []);

  // 2.4. Early returns
  if (isLoading) return <LoadingSpinner />;

  // 2.5. Render
  return (
    <Box>
      <Button onClick={handleClick}>{title}</Button>
    </Box>
  );
};
```

### Import Order

```typescript
// 1. React and third-party libraries
import { useState } from 'react';
import { Box } from '@mui/material';
import { useQuery } from '@tanstack/react-query';

// 2. Абсолютные импорты (алиасы @/)
import { Layout } from '@/shared/components';
import { useAuth } from '@/features/auth';

// 3. Относительные импорты
import { helper } from './utils';
import styles from './styles';
```

## Git Workflow

### Branching Strategy

```
main                 # Production-ready code
├── develop          # Development branch
    ├── feature/...  # Feature branches
    ├── bugfix/...   # Bug fix branches
    └── hotfix/...   # Hot fixes
```

### Branch Naming

```
feature/auth-login
feature/contract-editor
bugfix/login-validation
hotfix/security-patch
```

### Commit Messages

Используйте conventional commits:

```
feat: add user authentication
fix: resolve login form validation
docs: update README
style: format code with prettier
refactor: simplify API client
test: add unit tests for useAuth
chore: update dependencies
```

### Pull Request Process

1. Создайте feature branch от `develop`
2. Сделайте свои изменения
3. Убедитесь что тесты проходят: `npm test`
4. Убедитесь что код отформатирован: `npm run format`
5. Убедитесь что нет линтер ошибок: `npm run lint`
6. Создайте PR в `develop`
7. Дождитесь code review
8. После approve - мержим

## Adding New Features

### 1. Новая фича

```bash
# Создайте структуру
mkdir -p src/features/my-feature/{hooks,components,store}
touch src/features/my-feature/index.ts
```

Структура:
```
features/
└── my-feature/
    ├── hooks/
    │   └── useMyFeature.ts
    ├── components/
    │   └── MyComponent.tsx
    ├── store/              # Если нужен
    │   └── myStore.ts
    └── index.ts            # Public exports
```

### 2. Новая страница

```typescript
// src/pages/MyPage.tsx
import { Layout, PageHeader } from '@/shared/components';

export const MyPage = () => {
  return (
    <Layout>
      <PageHeader title="My Page" />
      {/* Content */}
    </Layout>
  );
};
```

Добавьте в роутер:
```typescript
// src/app/router.tsx
{
  path: '/my-page',
  element: <MyPage />,
}
```

### 3. Новый API endpoint

```typescript
// src/shared/api/myApi.ts
import apiClient from './client';
import { MyData } from '@/shared/types';

export const myApi = {
  getAll: async (): Promise<MyData[]> => {
    const response = await apiClient.get<MyData[]>('/my-endpoint');
    return response.data;
  },
};
```

Создайте React Query хук:
```typescript
// src/features/my-feature/hooks/useMyData.ts
import { useQuery } from '@tanstack/react-query';
import { myApi } from '@/shared/api/myApi';

export const useMyData = () => {
  return useQuery({
    queryKey: ['my-data'],
    queryFn: () => myApi.getAll(),
  });
};
```

### 4. Новый тип

```typescript
// src/shared/types/myType.ts
export interface MyData {
  id: string;
  name: string;
  createdAt: string;
}

// Экспорт из index
// src/shared/types/index.ts
export * from './myType';
```

## Testing

### Unit Tests

```typescript
// Component.test.tsx
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage
```

## Code Review Guidelines

### Reviewer Checklist

- [ ] Код следует стандартам проекта
- [ ] Нет линтер ошибок
- [ ] Тесты написаны и проходят
- [ ] TypeScript типы корректны
- [ ] Нет дублирования кода
- [ ] Компоненты переиспользуемые где возможно
- [ ] Performance оптимизации применены
- [ ] Доступность (a11y) учтена
- [ ] Мобильная версия работает

### Code Review Process

1. Проверьте изменения в GitHub
2. Локально протестируйте ветку
3. Оставьте конструктивные комментарии
4. Approve или Request changes
5. После исправлений - re-review

## Performance Guidelines

### React Performance

```typescript
// ✅ Good - мемоизация для тяжелых вычислений
const expensiveValue = useMemo(() => 
  computeExpensiveValue(data), 
  [data]
);

// ✅ Good - мемоизация компонента
export const MyComponent = React.memo(({ data }) => {
  return <div>{data}</div>;
});

// ❌ Bad - вычисления в render
const MyComponent = ({ data }) => {
  const result = computeExpensiveValue(data); // Каждый рендер!
  return <div>{result}</div>;
};
```

### Bundle Size

- Используйте dynamic imports для больших библиотек
- Проверяйте размер bundle: `npm run build`
- Избегайте импорта всей библиотеки если нужна одна функция

```typescript
// ✅ Good
import { debounce } from 'lodash-es/debounce';

// ❌ Bad
import _ from 'lodash';
```

## Accessibility (a11y)

### Checklist

- [ ] Семантичные HTML элементы
- [ ] ARIA атрибуты где нужно
- [ ] Keyboard navigation работает
- [ ] Достаточный цветовой контраст
- [ ] Alt текст для изображений
- [ ] Labels для форм

### Примеры

```typescript
// ✅ Good
<button aria-label="Закрыть" onClick={handleClose}>
  <CloseIcon />
</button>

<img src="..." alt="Описание изображения" />

<label htmlFor="email">Email</label>
<input id="email" type="email" />

// ❌ Bad
<div onClick={handleClose}> {/* Не keyboard accessible */}
  <CloseIcon />
</div>
```

## Questions?

Если у вас есть вопросы:
- Откройте issue на GitHub
- Спросите в команде
- Прочитайте [ARCHITECTURE.md](./ARCHITECTURE.md)

Спасибо за вклад в проект! 🎉
