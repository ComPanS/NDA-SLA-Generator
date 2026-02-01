import apiClient from './client';
import { Notice } from '../types';

export const noticeApi = {
  async getNotice(): Promise<Notice> {
    const { data } = await apiClient.get<Notice>('/notice');
    return data;
  },
};
