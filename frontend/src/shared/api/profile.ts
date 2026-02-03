import apiClient from './client';
import { UserProfile } from '@/shared/types';

export const profileApi = {
  getProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get<UserProfile>('/profile');
    return response.data;
  },

  deleteAccount: async (): Promise<void> => {
    await apiClient.delete('/profile');
  },
};
