# NDA / SLA Generator

Автоматический генератор и менеджер договоров NDA и SLA с AI-поддержкой для российского рынка

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.0+-blue.svg)](https://reactjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Быстрый старт

**За 5 минут:**

```bash
# 1. Клонировать репозиторий
git clone https://github.com/your-username/NDA-SLA-Generator.git
cd NDA-SLA-Generator

# 2. Docker способ (рекомендуется)
docker-compose up -d

# Или локальная установка
make install
make dev
```

📖 Подробнее: [QUICKSTART.md](./QUICKSTART.md)

## О проекте

**NDA/SLA Generator** — веб-сервис, который позволяет:

- быстро создавать договоры о неразглашении (NDA) и соглашения об уровне обслуживания (SLA)

- адаптировать их под конкретную сделку с помощью ввода параметров

- автоматически проверять текст на типичные риски и соответствие ГК РФ

- редактировать документ вручную или через уточняющие промпты к LLM

- хранить историю документов

- экспортировать в DOCX и PDF

- (в будущем) отправлять на подписание через системы ЭДО (Диадок, Контур и др.)

**Целевая аудитория**

IT-агентства, фриланс-команды, B2B-поставщики услуг, SaaS-компании

Основные пользователи: sales-менеджеры, аккаунт-менеджеры, юристы, фаундеры

**Основная ценность**

Сократить время на подготовку и согласование типовых договоров с 2–10 дней до 5–15 минут

Минимизировать типовые юридические ошибки в шаблонах

## Текущий функционал MVP

- Регистрация / авторизация (email + пароль, Google, VK)

- Один бесплатный NDA для неавторизованных пользователей

- Генерация NDA и SLA по шаблонам с использованием YandexGPT

- Структурированный просмотр и редактирование (WYSIWYG)

- Корректировка текста через дополнительные промпты к AI

- История документов (только для залогиненных пользователей)

- Экспорт → DOCX и PDF

- Простая система подписки (freemium + pay-per-document)

## Технологический стек

| Компонент | Технология | Примечание |

|-----------------|-------------------------------------|-------------------------------------------------|

| Frontend | React 18 + TypeScript | Vite |

| UI-компоненты | @mui/material | — |

| Редактор текста | Quill.js | с кастомными блендами для юридической структуры |

| Backend | Python 3.11+ / FastAPI | — |

| ORM | SQLAlchemy 2 + Alembic | — |

| База данных | PostgreSQL 15+ | — |

| LLM | YandexGPT (через Yandex Cloud API) | альтернатива: GigaChat, OpenAI |

| Экспорт DOCX | python-docx / docxtemplater | — |

| Экспорт PDF | WeasyPrint / pdfkit / pdfmake | — |

| Аутентификация | JWT (PyJWT) | refresh-токены |

| Платежи | ЮKassa (Yandex Kassa) | — |

| Контейнеризация | Docker + docker-compose | — |

| Хостинг | Yandex Cloud / VK Cloud / Selectel | — |

### Backend (Express + Prisma)

- Код: `backend/` (Express, Prisma, JWT, bcrypt, Zod).
- Настройка:
  1. Скопируйте `.env.example` в `.env` и задайте `DATABASE_URL` и другие переменные.
  2. Установите зависимости: `cd backend && npm install`.
  3. Примените миграции: `npx prisma migrate dev`.
- Запуск dev: `npm run dev` (порт по умолчанию 8001).
- Сборка/прод: `npm run build && npm start`.
- Тесты: `npm test` (vitest + supertest).

**Yandex OAuth (Паспорт)**

1. Создайте приложение на https://oauth.yandex.ru/ с правами `login:email` и `login:info`.
2. Redirect URI: `http://localhost:5173/oauth/yandex/callback` (или ваш домен).
3. В `backend/.env` заполните `YANDEX_OAUTH_CLIENT_ID`, `YANDEX_OAUTH_CLIENT_SECRET`, `YANDEX_OAUTH_REDIRECT_URI`, `FRONTEND_URL`.
4. Проверка: `GET /auth/yandex/url` → редирект в Яндекс, после возврата код и state отправляются на `/auth/yandex/callback`, токены записываются в клиент.

### Frontend (React + TypeScript)

- Код: `frontend/` (React 18, TypeScript, Vite, MUI, React Query, Zustand).
- Настройка:
  1. Установите зависимости: `cd frontend && npm install`.
  2. (Опционально) Создайте `.env` на основе `.env.example`.
- Запуск dev: `npm run dev` (порт по умолчанию 5173).
- Сборка/прод: `npm run build` и `npm run preview`.
- Тесты: `npm test` (vitest).

## Быстрый старт

### Предварительные требования

- Node.js 18+
- PostgreSQL 15+
- Аккаунт в Yandex Cloud с доступом к YandexGPT (для AI генерации)
- ЮKassa аккаунт (для платежей, опционально)

### Установка и запуск

#### 1. Клонирование репозитория

```bash
git clone https://github.com/your-username/NDA-SLA-Generator.git
cd NDA-SLA-Generator
```

#### 2. Настройка базы данных

Создайте базу данных PostgreSQL:

```bash
createdb nda_sla_generator
```

#### 3. Настройка Backend

```bash
cd backend

# Установка зависимостей
npm install

# Создайте .env файл
cp .env.example .env

# Отредактируйте .env и укажите:
# DATABASE_URL=postgresql://user:password@localhost:5432/nda_sla_generator
# JWT_SECRET=ваш-секретный-ключ
# YANDEX_GPT_API_KEY=ваш-ключ-yandex-gpt
# YANDEX_FOLDER_ID=ваш-folder-id

# Примените миграции
npx prisma migrate dev

# Запустите backend
npm run dev
```

Backend будет доступен на http://localhost:8001

#### 4. Настройка Frontend

В новом терминале:

```bash
cd frontend

# Установка зависимостей
npm install

# (Опционально) Создайте .env
cp .env.example .env

# Запустите frontend
npm run dev
```

Frontend будет доступен на http://localhost:5173

#### 5. Готово!

Откройте http://localhost:5173 в браузере и начните работу с приложением.

### Запуск через Docker (альтернатива)

```bash
# Из корневой директории проекта
docker-compose up -d

# Backend: http://localhost:8001
# Frontend: http://localhost:5173
# PostgreSQL: localhost:5432
```

## Структура проекта

```
nda-sla-generator/
├─ backend/                    # Node.js + Express + Prisma
│  ├─ src/
│  │  ├─ config/              # Конфигурация (env, prisma)
│  │  ├─ lib/                 # Библиотеки (jwt, yandex, mappers)
│  │  ├─ middleware/          # Express middleware (auth)
│  │  ├─ routes/              # API роуты
│  │  └─ index.ts
│  ├─ prisma/
│  │  ├─ schema.prisma
│  │  └─ migrations/
│  └─ package.json
│
├─ frontend/                   # React 18 + TypeScript
│  ├─ src/
│  │  ├─ app/                 # Конфигурация приложения
│  │  │  ├─ router.tsx
│  │  │  ├─ providers.tsx
│  │  │  └─ theme.ts
│  │  ├─ features/            # Feature-модули
│  │  │  ├─ auth/
│  │  │  ├─ contracts/
│  │  │  ├─ templates/
│  │  │  └─ billing/
│  │  ├─ shared/              # Общий код
│  │  │  ├─ api/              # API клиенты
│  │  │  ├─ components/       # Переиспользуемые компоненты
│  │  │  ├─ types/            # TypeScript типы
│  │  │  └─ utils/
│  │  └─ pages/               # Страницы
│  ├─ public/
│  └─ vite.config.ts
│
├─ docker-compose.yml
└─ README.md
```

## Монетизация (на старте)

- Free → 1 документ в месяц
- Pro → 1990 ₽ / мес → безлимит, история, проверка рисков
- Pay-per-use → 99 ₽ / документ (для тех, кто не хочет подписку)

## Юридические и compliance аспекты

- Все шаблоны созданы / проверены юристом и соответствуют ГК РФ (по состоянию на 2025–2026 гг.)
- В каждом сгенерированном документе присутствует дисклеймер:
  > Документ создан автоматически. Рекомендуется проверка квалифицированным юристом перед использованием.
- Хранение персональных данных — в соответствии с ФЗ-152
- Шифрование документов на уровне базы (pgcrypto) или файловой системы

## Лицензия

MIT © 2026 ComPanS

Контакты для вопросов по проекту:  
Telegram / email (указать в issues или в коде)
