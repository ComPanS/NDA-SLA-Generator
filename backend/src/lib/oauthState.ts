import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { env } from '../config/env';

export function createSignedOAuthState(): string {
  const raw = randomBytes(16).toString('hex');
  const signature = createHmac('sha256', env.jwtSecret).update(raw).digest('hex');
  return `${raw}:${signature}`;
}

export function verifySignedOAuthState(state: string): boolean {
  const [raw, signature] = state.split(':');
  if (!raw || !signature) return false;
  const expected = createHmac('sha256', env.jwtSecret).update(raw).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}
