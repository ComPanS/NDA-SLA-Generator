import { api } from './http';
import { LoginPayload, RegisterPayload, TokenPair } from '../types/auth';

export async function login(payload: LoginPayload): Promise<TokenPair> {
  const { data } = await api.post<TokenPair>('/auth/login', payload);
  return data;
}

export async function register(payload: RegisterPayload): Promise<TokenPair> {
  const { data } = await api.post<TokenPair>('/auth/register', payload);
  return data;
}
