import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 8001,
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/nda_sla',
  jwtSecret: process.env.JWT_SECRET || 'change-me',
  jwtExpiresMinutes: Number(process.env.JWT_ACCESS_TOKEN_EXPIRES_MINUTES || 30),
  jwtRefreshDays: Number(process.env.JWT_REFRESH_TOKEN_EXPIRES_DAYS || 7),
  corsOrigins: (process.env.CORS_ORIGINS || '*').split(',').map((s) => s.trim()),
  yandexApiKey: process.env.YANDEX_GPT_API_KEY || '',
  yandexEndpoint:
    process.env.YANDEX_GPT_ENDPOINT ||
    'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
  // Модель без folder — сам folder подставляем ниже в modelUri
  yandexModel: process.env.YANDEX_GPT_MODEL || 'yandexgpt/latest',
  yandexFolderId: process.env.YANDEX_GPT_FOLDER_ID || '',
  yandexTimeoutMs: Number(process.env.YANDEX_GPT_TIMEOUT || 30000),
};
