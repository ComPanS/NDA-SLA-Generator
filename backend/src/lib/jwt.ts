import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export type TokenType = 'access' | 'refresh';

export function signToken(sub: string, type: TokenType) {
  const expiresIn =
    type === 'access' ? env.jwtExpiresMinutes * 60 : env.jwtRefreshDays * 24 * 60 * 60;
  const options: SignOptions = { expiresIn };
  return jwt.sign({ sub, type }, env.jwtSecret as Secret, options);
}

export function verifyToken(token: string, expectedType: TokenType) {
  const payload = jwt.verify(token, env.jwtSecret as Secret) as { sub: string; type: TokenType };
  if (payload.type !== expectedType) {
    throw new Error('Invalid token type');
  }
  return payload.sub;
}
