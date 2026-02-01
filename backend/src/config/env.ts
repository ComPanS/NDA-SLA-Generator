import dotenv from 'dotenv';

dotenv.config();

const adminRouteRaw = process.env.ADMIN_ROUTE || '/internal-admin';

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
  yandexOauthClientId: process.env.YANDEX_OAUTH_CLIENT_ID || '',
  yandexOauthClientSecret: process.env.YANDEX_OAUTH_CLIENT_SECRET || '',
  yandexOauthRedirectUri: process.env.YANDEX_OAUTH_REDIRECT_URI || '',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT || 0),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpFrom: process.env.SMTP_FROM || 'no-reply@example.com',
  verificationCodeTtlMinutes: Number(process.env.VERIFICATION_CODE_TTL_MINUTES || 15),
  verificationResendIntervalSeconds: Number(process.env.VERIFICATION_RESEND_INTERVAL_SECONDS || 60),
  verificationResendMaxPerHour: Number(process.env.VERIFICATION_RESEND_MAX_PER_HOUR || 3),
  adminLogin: process.env.ADMIN_LOGIN || '',
  adminPassword: process.env.ADMIN_PASSWORD || '',
  adminRoute: adminRouteRaw.startsWith('/') ? adminRouteRaw : `/${adminRouteRaw}`,
  adminTokenExpiresMinutes: Number(process.env.ADMIN_TOKEN_EXPIRES_MINUTES || 60),
};
