import apiClient from './client';

export const publicApi = {
  getGeoHint: async (): Promise<{ countryCode: string | null }> => {
    const res = await apiClient.get<{ countryCode: string | null }>('/public/geo-hint');
    return res.data;
  },
};
