import axios from 'axios';
import { env } from '../config/env';
import { createSignedOAuthState, verifySignedOAuthState } from './oauthState';

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';

export interface GoogleProfile {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}

export function createGoogleState(): string {
  return createSignedOAuthState();
}

export function verifyGoogleState(state: string): boolean {
  return verifySignedOAuthState(state);
}

export function buildGoogleAuthUrl(state: string) {
  if (!env.googleOauthClientId || !env.googleOauthRedirectUri) {
    throw new Error('Google OAuth is not configured');
  }
  const url = new URL(AUTH_URL);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', env.googleOauthClientId);
  url.searchParams.set('redirect_uri', env.googleOauthRedirectUri);
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', state);
  return url.toString();
}

export async function exchangeGoogleCodeForToken(code: string): Promise<string> {
  if (!env.googleOauthClientId || !env.googleOauthClientSecret || !env.googleOauthRedirectUri) {
    throw new Error('Google OAuth is not configured');
  }

  const payload = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: env.googleOauthClientId,
    client_secret: env.googleOauthClientSecret,
    redirect_uri: env.googleOauthRedirectUri,
  });

  const response = await axios.post<{ access_token?: string }>(TOKEN_URL, payload.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    timeout: env.googleOauthTimeoutMs,
  });

  if (!response.data?.access_token) {
    throw new Error('No access token returned from Google');
  }

  return response.data.access_token;
}

export async function fetchGoogleProfile(accessToken: string): Promise<GoogleProfile> {
  const response = await axios.get<{
    sub?: string;
    email?: string;
    name?: string;
    picture?: string;
  }>(USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    timeout: env.googleOauthTimeoutMs,
  });

  const data = response.data;
  if (!data.sub) {
    throw new Error('Missing Google user id');
  }
  if (!data.email) {
    throw new Error('Email is required from Google profile');
  }

  return {
    id: data.sub,
    email: data.email,
    displayName: data.name,
    avatarUrl: data.picture,
  };
}
