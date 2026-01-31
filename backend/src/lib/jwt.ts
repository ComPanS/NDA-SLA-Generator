import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export type UserTokenType = 'access' | 'refresh';
export type TokenType = UserTokenType | 'admin';

export function signToken(sub: string, type: UserTokenType) {
  const expiresIn =
    type === 'access' ? env.jwtExpiresMinutes * 60 : env.jwtRefreshDays * 24 * 60 * 60;
  const options: SignOptions = { expiresIn };
  return jwt.sign({ sub, type }, env.jwtSecret as Secret, options);
}

export function verifyToken(token: string, expectedType: TokenType) {
  const payload = jwt.verify(token, env.jwtSecret as Secret) as {
    sub?: string;
    type: TokenType;
  };
  if (payload.type !== expectedType) {
    throw new Error('Invalid token type');
  }
  if (!payload.sub) {
    throw new Error('Missing subject');
  }
  return payload.sub;
}

export function signAdminToken() {
  const expiresIn = env.adminTokenExpiresMinutes * 60;
  const options: SignOptions = { expiresIn };
  return jwt.sign({ type: 'admin' }, env.jwtSecret as Secret, options);
}

export function verifyAdminToken(token: string) {
  const payload = jwt.verify(token, env.jwtSecret as Secret) as { type: TokenType };
  if (payload.type !== 'admin') {
    throw new Error('Invalid token type');
  }
  return true;
}
