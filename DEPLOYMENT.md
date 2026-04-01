# Deployment Guide

Руководство по развертыванию NDA/SLA Generator в production.

## Требования

### Инфраструктура

- PostgreSQL 15+ database
- Node.js 20+ runtime (LTS)
- Nginx (для статики и reverse proxy)
- SSL сертификат (Let's Encrypt рекомендуется)

### Сервисы

- Yandex Cloud аккаунт (для YandexGPT API)
- ЮKassa аккаунт (для платежей, опционально)
- Хостинг (Yandex Cloud, VK Cloud, Selectel, или другой)

## Клонирование приватного репозитория (SSH deploy key)

```bash
# На сервере
ssh-keygen -t ed25519 -C "deploy@nda-sla" -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub
# Скопируйте public key в GitHub → Repo Settings → Deploy Keys → Add (Allow read-only)

# Добавьте GitHub в known_hosts
ssh-keyscan github.com >> ~/.ssh/known_hosts

# Клонирование по SSH
git clone git@github.com:your-username/NDA-SLA-Generator.git
```

Альтернатива: использовать GitHub Deploy Token/Personal Access Token и `https://<token>@github.com/...`, но SSH-ключ безопаснее.

## Backend Deployment

### 1. Подготовка сервера

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Node.js LTS 20 или 22 (рекомендуется для production; пропустите, если уже стоит >=20)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Установка PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Установка PM2 для управления процессами
sudo npm install -g pm2

# Установка системных библиотек для экспорта PDF
sudo apt-get install -y \
  libatk1.0-0 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libgbm1 \
  libasound2 libpangocairo-1.0-0 libpango-1.0-0 libx11-xcb1 libxcomposite1 \
  libxcursor1 libxdamage1 libxi6 libxrandr2 libxrender1 libxss1 libnss3 \
  libcups2 libxshmfence1 libgtk-3-0 fonts-liberation ca-certificates

sudo apt-get install -y ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 \
  libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 \
  libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 \
  libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 \
  libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 \
  libxss1 libxtst6 lsb-release wget xdg-utils
```

### 2. Настройка PostgreSQL

```bash
# Создание пользователя и базы данных
sudo -u postgres psql
CREATE DATABASE nda_sla_generator;
CREATE USER nda_user WITH ENCRYPTED PASSWORD 'FQstJKMhsCb35YhL';
GRANT ALL PRIVILEGES ON DATABASE nda_sla_generator TO nda_user;
\q
```

### 3. Деплой Backend

```bash
# Клонирование репозитория
git clone https://github.com/your-username/NDA-SLA-Generator.git
cd NDA-SLA-Generator/backend

# Установка зависимостей
npm ci --production

# Создание .env файла (полный список переменных)
# Ручной вариант (локально на сервере):
cat > .env << 'EOF'
PORT=8001
NODE_ENV=production

# База
DATABASE_URL=postgresql://nda_user:strong_password@localhost:5432/nda_sla_generator

# JWT
JWT_SECRET=$(openssl rand -base64 32)
JWT_ACCESS_TOKEN_EXPIRES_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRES_DAYS=7

# CORS / фронтенд
FRONTEND_URL=https://dogovarai.ru
CORS_ORIGINS=https://dogovarai.ru

# YandexGPT
YANDEX_GPT_API_KEY=your_api_key
YANDEX_GPT_FOLDER_ID=your_folder_id
YANDEX_GPT_MODEL=yandexgpt/latest
YANDEX_GPT_ENDPOINT=https://llm.api.cloud.yandex.net/foundationModels/v1/completion
YANDEX_GPT_TIMEOUT=30000

# Yandex OAuth (кнопка логина)
YANDEX_OAUTH_CLIENT_ID=
YANDEX_OAUTH_CLIENT_SECRET=
YANDEX_OAUTH_REDIRECT_URI=https://dogovarai.ru/oauth/yandex/callback

# Google OAuth (редирект на API после логина; в Google Cloud → Authorized redirect URI)
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=https://dogovarai.ru/api/auth/google/callback
# GOOGLE_OAUTH_TIMEOUT_MS=30000

# SMTP (email)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=no-reply@dogovarai.ru

# Верификация email
VERIFICATION_CODE_TTL_MINUTES=15
VERIFICATION_RESEND_INTERVAL_SECONDS=60
VERIFICATION_RESEND_MAX_PER_HOUR=3

# Админка
ADMIN_LOGIN=
ADMIN_PASSWORD=
ADMIN_ROUTE=/internal-admin
ADMIN_TOKEN_EXPIRES_MINUTES=60

# Подписки / биллинг
SUBSCRIPTION_BILLING_INTERVAL_MS=120000            # 2 минуты (для прод выставьте периодичность)
SUBSCRIPTION_EXPIRY_CHECK_INTERVAL_MS=86400000     # сутки
YOOKASSA_SHOP_ID=
YOOKASSA_SECRET_KEY=
YOOKASSA_RETURN_URL=https://dogovarai.ru/billing
YOOKASSA_WEBHOOK_SECRET=
EOF

# Вариант через GitHub Actions (автоматически на сервере):
# - Все переменные выше положите в GitHub Secrets (repository/env).
# - Добавьте секреты путей:
#     BACKEND_ENV_FILE=/opt/nda/backend.env
#     DEPLOY_COMPOSE_PATH=/opt/nda/docker-compose.yml
# - В workflow `cd.yml` секреты попадут в SSH-сессию и соберут файл
#   `${BACKEND_ENV_FILE}` перед запуском `docker compose`. Ручное создание .env
#   на сервере не нужно.

# Генерация Prisma клиента
npx prisma generate

# Применение миграций
npx prisma migrate deploy

# Сборка
npm run build

# Запуск с PM2
pm2 start dist/index.js --name nda-backend
pm2 save
pm2 startup
```

### 4. Мониторинг Backend

```bash
# Просмотр логов
pm2 logs nda-backend

# Статус
pm2 status

# Перезапуск
pm2 restart nda-backend
```

## Frontend Deployment

### 1. Сборка Frontend

Локально или в CI/CD:

```bash
cd frontend

# Создание production .env (используются только эти ключи)
cat > .env << EOF
VITE_API_URL=https://api.dogovarai.ru   # обязательный (build arg)
VITE_ADMIN_ROUTE=/internal-admin
VITE_YANDEX_CLIENT_ID=
VITE_YANDEX_SUGGEST_REDIRECT_URI=
VITE_YANDEX_ORIGIN=https://dogovarai.ru
EOF
# Примечание: DEV_ALLOWED_HOSTS и BACKEND_URL в коде не используются.

# Установка зависимостей
npm ci

# Сборка
npm run build
```

Результат в `frontend/dist/`.

### 2. Nginx + HTTPS для dogovarai.ru (один сервер, прокси на Docker Compose)

Цель: `dogovarai.ru` → фронтенд контейнера (порт 5173 наружу), `/api` → бэкенд контейнера (порт 8001 наружу). `VITE_API_URL` в сборке уже равен `/api`, поэтому достаточно path-based прокси.

1. DNS (уже задано):
   - `A @` → `95.163.244.138`
   - `A www` → `95.163.244.138`
   - (опционально) `A api` → `95.163.244.138`, если захотите отдельный поддомен для API.
   - MX/TXT/DKIM/DMARC оставьте как есть.

2. Установите Nginx и Certbot на сервере:

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

3. Получите сертификат Let’s Encrypt (одним сертификатом на домен и www):

```bash
sudo certbot --nginx -d dogovarai.ru -d www.dogovarai.ru
```

Если добавите `api.dogovarai.ru`, добавьте его сразу: `-d api.dogovarai.ru`.

4. Создайте конфиг `/etc/nginx/sites-available/dogovorai`:

```nginx
# /etc/nginx/sites-available/dogovarai

server {
    listen 80;
    listen [::]:80;
    server_name dogovarai.ru www.dogovarai.ru;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name dogovarai.ru www.dogovarai.ru;

    ssl_certificate     /etc/letsencrypt/live/dogovarai.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dogovarai.ru/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Frontend контейнер (порт 5173 опубликован на хосте)
    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API → бэкенд контейнер (порт 8001 на хосте)
    location /api/ {
        proxy_pass http://127.0.0.1:8001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # Опционально: страна посетителя для авто-языка (см. GET /public/geo-hint).
        # Если перед прокси стоит GeoIP (nginx geoip2 / Cloudflare), пробросьте код страны:
        # proxy_set_header X-Geo-Country $geoip2_data_country_code;
        # либо для Cloudflare на стороне CF уже есть CF-IPCountry до вашего origin.
    }

    # Базовые security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

5. Включите конфиг и перезагрузите Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/dogovorai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

6. Проверка:

- Откройте https://dogovarai.ru — должен открыться фронт из контейнера.
- https://dogovarai.ru/api/health (или `/health` вашего бэкенда) — должен отвечать бэкенд.
- После деплоя из GitHub Actions `docker compose` поднимет контейнеры, а Nginx будет только проксировать.

### 4. SSL сертификат

```bash
# Установка Certbot
sudo apt install -y certbot python3-certbot-nginx

# Получение сертификата
sudo certbot --nginx -d dogovarai.ru -d api.dogovarai.ru

# Автообновление
sudo certbot renew --dry-run
```

## Docker Deployment

### 1. Docker Compose Production

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_DB: nda_sla_generator
      POSTGRES_USER: nda_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: always
    environment:
      DATABASE_URL: postgresql://nda_user:${DB_PASSWORD}@postgres:5432/nda_sla_generator
      NODE_ENV: production
      JWT_SECRET: ${JWT_SECRET}
      YANDEX_GPT_API_KEY: ${YANDEX_GPT_API_KEY}
      YANDEX_FOLDER_ID: ${YANDEX_FOLDER_ID}
    depends_on:
      - postgres
    networks:
      - app-network
    ports:
      - '8001:8001'

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_URL: https://api.dogovarai.ru
    restart: always
    networks:
      - app-network
    ports:
      - '80:80'

volumes:
  postgres_data:

networks:
  app-network:
    driver: bridge
```

### 2. Dockerfiles

**Backend Dockerfile:**

```dockerfile
# backend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

EXPOSE 8001

CMD ["npm", "start"]
```

**Frontend Dockerfile:**

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**Frontend nginx.conf:**

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 3. Запуск через Docker

```bash
# Создание .env файла
cat > .env << EOF
DB_PASSWORD=strong_password
JWT_SECRET=$(openssl rand -base64 32)
YANDEX_GPT_API_KEY=your_key
YANDEX_FOLDER_ID=your_folder
EOF

# Запуск
docker-compose -f docker-compose.prod.yml up -d

# Применение миграций
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Просмотр логов
docker-compose -f docker-compose.prod.yml logs -f
```

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Build Backend
        run: |
          cd backend
          npm ci
          npm run build

      - name: Build Frontend
        run: |
          cd frontend
          npm ci
          npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}

      - name: Deploy to Server
        uses: appleboy/scp-action@master
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_KEY }}
          source: 'backend/dist,frontend/dist'
          target: '/var/www/nda-generator'

      - name: Restart Services
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            pm2 restart nda-backend
            sudo systemctl reload nginx
```

## Мониторинг и Логирование

### PM2 Monitoring

```bash
# Установка PM2 Plus (опционально)
pm2 install pm2-logrotate

# Настройка ротации логов
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### Логирование

```bash
# Backend логи
pm2 logs nda-backend

# Nginx логи
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PostgreSQL логи
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

## Backup Strategy

### Database Backup

```bash
# Создание бэкапа
pg_dump -U nda_user nda_sla_generator > backup_$(date +%Y%m%d).sql

# Автоматический бэкап (cron)
0 2 * * * pg_dump -U nda_user nda_sla_generator > /backups/nda_$(date +\%Y\%m\%d).sql
```

### Восстановление

```bash
psql -U nda_user nda_sla_generator < backup_20260130.sql
```

## Security Checklist

- [ ] SSL сертификат настроен
- [ ] Firewall настроен (только 80, 443, 22)
- [ ] PostgreSQL доступна только локально
- [ ] Секретные ключи в environment variables
- [ ] CORS настроен корректно
- [ ] Rate limiting настроен
- [ ] Логи защищены от несанкционированного доступа
- [ ] Регулярные бэкапы настроены
- [ ] Мониторинг работает

## Performance Optimization

### Backend

- Включить gzip сжатие в Nginx
- Настроить connection pooling в Prisma
- Использовать Redis для кэширования (опционально)

### Frontend

- Использовать CDN для статики
- Включить HTTP/2
- Настроить кэширование браузера

## Troubleshooting

### Backend не запускается

```bash
# Проверить логи
pm2 logs nda-backend

# Проверить переменные окружения
pm2 env nda-backend

# Проверить подключение к БД
psql -U nda_user -d nda_sla_generator
```

### Frontend показывает белый экран

```bash
# Проверить Nginx конфигурацию
sudo nginx -t

# Проверить логи Nginx
sudo tail -f /var/log/nginx/error.log

# Проверить права доступа к файлам
ls -la /var/www/nda-frontend
```

## Масштабирование

### Horizontal Scaling

- Используйте load balancer (Nginx, HAProxy)
- Несколько инстансов backend через PM2 cluster mode
- Shared PostgreSQL или managed DB сервис
- Redis для shared sessions

### Vertical Scaling

- Увеличьте ресурсы сервера
- Оптимизируйте PostgreSQL (shared_buffers, work_mem)
- Увеличьте PM2 instances

## Поддержка

Для вопросов и проблем:

- GitHub Issues: https://github.com/your-username/NDA-SLA-Generator/issues
- Email: support@dogovarai.ru

```
cd /var/www/dogovorai

# Зависимости: только каталоги `backend/` и `frontend/` содержат `package.json` и `package-lock.json`.
# Не запускайте `npm audit fix` из корня клона без lockfile — будет ENOLOCK. Аудит/обновление lockfile делайте локально и коммитьте; на сервере после `git pull` — `npm ci`.

# обновиться
git pull

# backend deps
cd backend
npm ci
# если нужно применить миграции:
npx prisma migrate deploy
cd ..

# frontend deps + сборка
cd frontend
npm ci
npm run build
cd ..

# вернуть стэш при необходимости
# git stash pop

# перезапуск процессов
pm2 restart nda-backend
```
