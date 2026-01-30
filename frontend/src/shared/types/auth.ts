export interface User {
  id: string;
  email: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
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
