import axios from 'axios';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { env } from '../config/env';

const AUTH_URL = 'https://oauth.yandex.ru/authorize';
const TOKEN_URL = 'https://oauth.yandex.ru/token';
const PROFILE_URL = 'https://login.yandex.ru/info';

export interface YandexProfile {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}

export function createYandexState(): string {
  const raw = randomBytes(16).toString('hex');
  const signature = createHmac('sha256', env.jwtSecret).update(raw).digest('hex');
  return `${raw}:${signature}`;
}

export function verifyYandexState(state: string): boolean {
  const [raw, signature] = state.split(':');
  if (!raw || !signature) return false;
  const expected = createHmac('sha256', env.jwtSecret).update(raw).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function buildYandexAuthUrl(state: string) {
  if (!env.yandexOauthClientId || !env.yandexOauthRedirectUri) {
    throw new Error('Yandex OAuth is not configured');
  }
  const url = new URL(AUTH_URL);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', env.yandexOauthClientId);
  url.searchParams.set('redirect_uri', env.yandexOauthRedirectUri);
  url.searchParams.set('scope', 'login:email login:info');
  url.searchParams.set('force_confirm', 'yes');
  url.searchParams.set('state', state);
  return url.toString();
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  if (!env.yandexOauthClientId || !env.yandexOauthClientSecret || !env.yandexOauthRedirectUri) {
    throw new Error('Yandex OAuth is not configured');
  }

  const payload = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: env.yandexOauthClientId,
    client_secret: env.yandexOauthClientSecret,
    redirect_uri: env.yandexOauthRedirectUri,
  });

  const response = await axios.post<{ access_token: string }>(TOKEN_URL, payload.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    timeout: env.yandexTimeoutMs,
  });

  if (!response.data?.access_token) {
    throw new Error('No access token returned from Yandex');
  }

  return response.data.access_token;
}

export async function fetchYandexProfile(accessToken: string): Promise<YandexProfile> {
  const response = await axios.get(PROFILE_URL, {
    params: { format: 'json' },
    headers: {
      Authorization: `OAuth ${accessToken}`,
    },
    timeout: env.yandexTimeoutMs,
  });

  const data = response.data as {
    id?: string;
    default_email?: string;
    emails?: string[];
    real_name?: string;
    display_name?: string;
    default_avatar_id?: string;
    is_avatar_empty?: boolean;
  };

  if (!data.id) {
    throw new Error('Missing Yandex user id');
  }

  const email = data.default_email || data.emails?.[0];
  if (!email) {
    throw new Error('Email is required from Yandex profile');
  }

  const avatarId = data.is_avatar_empty ? undefined : data.default_avatar_id;
  const avatarUrl = avatarId ? `https://avatars.yandex.net/get-yapic/${avatarId}/islands-200` : undefined;
  const displayName = data.real_name || data.display_name;

  return { id: data.id, email, displayName, avatarUrl };
}
