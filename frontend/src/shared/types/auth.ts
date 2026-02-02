export interface User {
  id: string;
  email: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  email_verified?: boolean;
  requires_verification?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RegistrationResponse {
  requires_verification: boolean;
  email_verified?: boolean;
  access_token?: string;
  refresh_token?: string;
  token_type?: 'bearer';
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface YandexAuthUrlResponse {
  url: string;
  state: string;
}

export interface YandexCallbackPayload {
  code: string;
  state: string;
}

export interface YandexSuggestPayload {
  access_token: string;
}
