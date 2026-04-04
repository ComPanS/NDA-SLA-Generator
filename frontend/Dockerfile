# Multi-stage build для оптимизации размера образа

# Stage 1: Build (bookworm — Chromium для post-build prerender лендинга)
FROM node:18-bookworm-slim AS builder

WORKDIR /app

# Копируем package files
COPY package*.json ./

# Зависимости + системные библиотеки для headless Chromium (Playwright)
RUN npm ci && npx playwright install --with-deps chromium

# Копируем исходный код
COPY . .

# Build аргументы
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
# Публичный URL сайта (canonical, og:url, prerender post-replace с preview origin)
ARG VITE_SITE_URL
ENV VITE_SITE_URL=$VITE_SITE_URL

# Сборка Vite + prerender (публичные URL из scripts/seo-paths.mjs)
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Копируем собранные файлы
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем nginx конфигурацию
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose порт
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Запуск nginx
CMD ["nginx", "-g", "daemon off;"]
