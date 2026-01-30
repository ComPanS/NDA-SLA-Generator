# Multi-stage build для оптимизации размера образа

# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Копируем package files
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код
COPY . .

# Build аргументы
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Собираем приложение
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
