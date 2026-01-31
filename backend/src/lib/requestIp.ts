import { Request } from 'express';

// Определяем IP клиента с учётом прокси и IPv6-представлений
export function getClientIp(req: Request): string | null {
  const forwarded = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim();
  const realIp = (req.headers['x-real-ip'] as string | undefined)?.trim();
  const socketIp = req.socket.remoteAddress || null;

  const raw = forwarded || realIp || socketIp;
  if (!raw) return null;

  // Убираем префикс ::ffff: и порт, если пришёл вместе с IP
  return raw.replace(/^::ffff:/, '').replace(/:\d+$/, '');
}
