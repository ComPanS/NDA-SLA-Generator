import dotenv from 'dotenv';

/**
 * По умолчанию dotenv НЕ перезаписывает уже заданные переменные (PM2, systemd, shell).
 * Тогда значение SMTP_PORT из `.env` игнорируется, если оно уже есть в окружении процесса.
 * `override: true` — файл `.env` рядом с приложением считаем источником правды для деплоя.
 * Вернуть старое поведение: `DOTENV_NO_OVERRIDE=1` в окружении (не в `.env`).
 */
const dotenvNoOverride =
  process.env.DOTENV_NO_OVERRIDE === '1' || process.env.DOTENV_NO_OVERRIDE === 'true';

dotenv.config({
  override: !dotenvNoOverride,
  quiet: true,
});

function parseEnvBool(key: string, defaultValue: boolean): boolean {
  const v = process.env[key];
  if (v === undefined || v === '') return defaultValue;
  const l = v.toLowerCase();
  if (l === '0' || l === 'false' || l === 'no' || l === 'off') return false;
  if (l === '1' || l === 'true' || l === 'yes' || l === 'on') return true;
  return defaultValue;
}

const adminRouteRaw = process.env.ADMIN_ROUTE || '/internal-admin';

export const env = {
  port: Number(process.env.PORT) || 8001,
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/nda_sla',
  jwtSecret: process.env.JWT_SECRET || 'change-me',
  jwtExpiresMinutes: Number(process.env.JWT_ACCESS_TOKEN_EXPIRES_MINUTES || 30),
  jwtRefreshDays: Number(process.env.JWT_REFRESH_TOKEN_EXPIRES_DAYS || 7),
  corsOrigins: (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim()),
  // NeuroAPI (LLM)
  neuroapiApiKey: process.env.NEUROAPI_API_KEY || '',
  neuroapiBaseUrl: process.env.NEUROAPI_BASE_URL || 'https://neuroapi.host/v1',
  neuroapiModel: process.env.NEUROAPI_MODEL || 'grok-4-fast-non-reasoning',
  /** LLM generation can exceed 30s for long contracts; align with frontend CONTRACT_LLM_REQUEST_TIMEOUT_MS. */
  neuroapiTimeoutMs: Number(process.env.NEUROAPI_TIMEOUT || 180_000),
  /** Retries per LLM call on timeout / 5xx / empty body (not on 4xx except 429). */
  neuroapiMaxRetries: Math.max(1, Math.min(8, Number(process.env.NEUROAPI_MAX_RETRIES || 3))),
  /** Base delay before retry attempt n: n * this value (ms). */
  neuroapiRetryBaseDelayMs: Math.max(0, Number(process.env.NEUROAPI_RETRY_BASE_DELAY_MS || 2000)),
  // YandexGPT (закомментировано — используется NeuroAPI)
  // yandexApiKey: process.env.YANDEX_GPT_API_KEY || '',
  // yandexEndpoint:
  //   process.env.YANDEX_GPT_ENDPOINT ||
  //   'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
  // yandexModel: process.env.YANDEX_GPT_MODEL || 'yandexgpt/latest',
  // yandexFolderId: process.env.YANDEX_GPT_FOLDER_ID || '',
  // yandexTimeoutMs: Number(process.env.YANDEX_GPT_TIMEOUT || 30000),
  yandexTimeoutMs: Number(process.env.YANDEX_GPT_TIMEOUT || 30000), // для Yandex OAuth
  yandexOauthClientId: process.env.YANDEX_OAUTH_CLIENT_ID || '',
  yandexOauthClientSecret: process.env.YANDEX_OAUTH_CLIENT_SECRET || '',
  yandexOauthRedirectUri: process.env.YANDEX_OAUTH_REDIRECT_URI || '',
  googleOauthClientId: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
  googleOauthClientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
  googleOauthRedirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI || '',
  googleOauthTimeoutMs: Number(process.env.GOOGLE_OAUTH_TIMEOUT_MS || 30000),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  smtpHost: (process.env.SMTP_HOST || '').trim(),
  /** TCP target when DNS for SMTP_HOST is unreliable (IPv4/IPv6). TLS SNI defaults to SMTP_HOST. */
  smtpConnectHost: (process.env.SMTP_CONNECT_HOST || '').trim(),
  /** Optional TLS servername (SNI). If unset and host is IP, Nodemailer uses SMTP_HOST. */
  smtpTlsServername: (process.env.SMTP_TLS_SERVERNAME || '').trim(),
  smtpPort: (() => {
    const raw = process.env.SMTP_PORT;
    if (raw === undefined || raw === '') return 0;
    const n = Number(String(raw).trim());
    return Number.isFinite(n) && n > 0 ? n : 0;
  })(),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpFrom: process.env.SMTP_FROM || 'no-reply@example.com',
  /** Имя хоста в EHLO/HELO; на VPS Ubuntu os.hostname() часто режут антиспамом. Если пусто — домен из SMTP_FROM / SMTP_USER. */
  smtpEhloName: (process.env.SMTP_EHLO_NAME || '').trim(),
  /** If set, overrides port-based default (465 → implicit TLS, else plain + STARTTLS on 587). */
  smtpSecure:
    process.env.SMTP_SECURE === undefined || process.env.SMTP_SECURE === ''
      ? undefined
      : parseEnvBool('SMTP_SECURE', false),
  /**
   * For STARTTLS: require TLS upgrade. Default true for port 587. Set false for Mailhog (1025) etc.
   */
  smtpRequireTls:
    process.env.SMTP_REQUIRE_TLS === undefined || process.env.SMTP_REQUIRE_TLS === ''
      ? undefined
      : parseEnvBool('SMTP_REQUIRE_TLS', true),
  smtpTlsRejectUnauthorized: parseEnvBool('SMTP_TLS_REJECT_UNAUTHORIZED', true),
  smtpConnectionTimeoutMs: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 60_000),
  /**
   * Prefer A record over AAAA when resolving SMTP host.
   * Default: true on Linux/macOS (частые проблемы с IPv6 к почте), false на Windows — явно задайте переменную при необходимости.
   */
  smtpDnsIpv4First:
    process.env.SMTP_DNS_IPV4_FIRST === undefined || process.env.SMTP_DNS_IPV4_FIRST === ''
      ? process.platform !== 'win32'
      : parseEnvBool('SMTP_DNS_IPV4_FIRST', false),
  /** Nodemailer DNS resolve timeout (ms). Default 90s — Windows/EDNS sometimes needs more than 30s. */
  smtpDnsTimeoutMs: Number(process.env.SMTP_DNS_TIMEOUT_MS || 90_000),
  verificationCodeTtlMinutes: Number(process.env.VERIFICATION_CODE_TTL_MINUTES || 15),
  verificationResendIntervalSeconds: Number(process.env.VERIFICATION_RESEND_INTERVAL_SECONDS || 60),
  verificationResendMaxPerHour: Number(process.env.VERIFICATION_RESEND_MAX_PER_HOUR || 3),
  passwordResetTokenTtlMinutes: Number(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || 60),
  adminLogin: process.env.ADMIN_LOGIN || '',
  adminPassword: process.env.ADMIN_PASSWORD || '',
  adminRoute: adminRouteRaw.startsWith('/') ? adminRouteRaw : `/${adminRouteRaw}`,
  adminTokenExpiresMinutes: Number(process.env.ADMIN_TOKEN_EXPIRES_MINUTES || 60),
  // Subscription billing interval (ms). Default 2 minutes for testing.
  subscriptionBillingIntervalMs: Number(
    process.env.SUBSCRIPTION_BILLING_INTERVAL_MS || 2 * 60 * 1000,
  ),
  // How often to run expiry cleanup (ms). Default once per day.
  subscriptionExpiryCheckIntervalMs: Number(
    process.env.SUBSCRIPTION_EXPIRY_CHECK_INTERVAL_MS || 24 * 60 * 60 * 1000,
  ),
  // YooKassa payment integration
  yookassaShopId: process.env.YOOKASSA_SHOP_ID || '',
  yookassaSecretKey: process.env.YOOKASSA_SECRET_KEY || '',
  yookassaReturnUrl:
    process.env.YOOKASSA_RETURN_URL || process.env.FRONTEND_URL || 'http://localhost:5173',
  yookassaWebhookSecret: process.env.YOOKASSA_WEBHOOK_SECRET || '',
};
