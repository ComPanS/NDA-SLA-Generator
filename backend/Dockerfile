# Multi-stage build для оптимизации размера образа

# Stage 1: Dependencies
FROM node:18-alpine AS deps

WORKDIR /app

# Копируем package files
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем зависимости (включая dev для сборки)
RUN npm ci

# Stage 2: Builder
FROM node:18-alpine AS builder

WORKDIR /app

# Копируем node_modules из deps stage
COPY --from=deps /app/node_modules ./node_modules

# Копируем исходный код
COPY . .

# Генерируем Prisma Client
RUN npx prisma generate

# Собираем TypeScript
RUN npm run build

# Stage 3: Production
FROM node:18-alpine AS runner

WORKDIR /app

# Создаем non-root пользователя
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 express

# Копируем только необходимое для production
COPY --from=builder --chown=express:nodejs /app/dist ./dist
COPY --from=builder --chown=express:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=express:nodejs /app/prisma ./prisma
COPY --from=builder --chown=express:nodejs /app/package*.json ./

# Переключаемся на non-root пользователя
USER express

# Expose порт
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Запуск приложения
CMD ["npm", "start"]
