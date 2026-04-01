import type { NextFunction, Request, Response } from 'express';

// Адреса Яндекс.Метрики для CSP (справка: Установка счетчика на сайт с CSP)
const YANDEX_METRIKA_HTTPS =
  'https://mc.yandex.ru https://mc.yandex.az https://mc.yandex.by https://mc.yandex.co.il https://mc.yandex.com https://mc.yandex.com.am https://mc.yandex.com.ge https://mc.yandex.com.tr https://mc.yandex.ee https://mc.yandex.fr https://mc.yandex.kg https://mc.yandex.kz https://mc.yandex.lt https://mc.yandex.lv https://mc.yandex.md https://mc.yandex.tj https://mc.yandex.tm https://mc.yandex.uz https://mc.webvisor.com https://mc.webvisor.org https://yastatic.net';
const YANDEX_METRIKA_WSS =
  'wss://mc.yandex.ru wss://mc.yandex.az wss://mc.yandex.by wss://mc.yandex.co.il wss://mc.yandex.com wss://mc.yandex.com.am wss://mc.yandex.com.ge wss://mc.yandex.com.tr wss://mc.yandex.ee wss://mc.yandex.fr wss://mc.yandex.kg wss://mc.yandex.kz wss://mc.yandex.lt wss://mc.yandex.lv wss://mc.yandex.md wss://mc.yandex.tj wss://mc.yandex.tm wss://mc.yandex.uz wss://mc.webvisor.com wss://mc.webvisor.org';
// Яндекс ID / кнопка «Войти через Яндекс» (sdk-suggest): iframe autofill + запросы к картам
const YANDEX_SUGGEST = 'https://autofill.yandex.ru https://suggest-maps.yandex.net';

export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "img-src 'self' data: https: https://mc.yandex.ru",
      // tag.js метрики часто ходит на mc.yandex.com и др. зоны, не только .ru
      `script-src 'self' ${YANDEX_METRIKA_HTTPS}`,
      `connect-src 'self' blob: ${YANDEX_METRIKA_HTTPS} ${YANDEX_METRIKA_WSS} ${YANDEX_SUGGEST}`,
      `child-src blob: ${YANDEX_METRIKA_HTTPS} ${YANDEX_SUGGEST}`,
      `frame-src blob: ${YANDEX_METRIKA_HTTPS} ${YANDEX_SUGGEST}`,
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  );
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

  next();
}
