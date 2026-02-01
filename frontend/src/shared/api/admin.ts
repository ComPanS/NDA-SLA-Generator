import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from './client';
import { ADMIN_ROUTE } from '../constants';
import {
  AdminLoginRequest,
  AdminLoginResponse,
  AdminOverview,
  AdminUserSummary,
} from '../types';
import { adminStore } from '@/features/admin/store/adminStore';

const adminClient = axios.create({
  baseURL: `${API_BASE_URL}${ADMIN_ROUTE}`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

adminClient.interceptors.request.use((config) => {
  const token = adminStore.getState().token;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      adminStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

export const adminApi = {
  async login(payload: AdminLoginRequest): Promise<AdminLoginResponse> {
    const { data } = await adminClient.post<AdminLoginResponse>('/login', payload);
    return data;
  },
  async getOverview(): Promise<AdminOverview> {
    const { data } = await adminClient.get<AdminOverview>('/overview');
    return data;
  },
  async getUsers(): Promise<AdminUserSummary[]> {
    const { data } = await adminClient.get<{ users: AdminUserSummary[] }>('/users');
    return data.users;
  },
};
