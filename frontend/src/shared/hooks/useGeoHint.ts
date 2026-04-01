import { useQuery } from '@tanstack/react-query';
import { publicApi } from '@/shared/api/publicApi';

export function useGeoHint() {
  return useQuery({
    queryKey: ['public', 'geo-hint'],
    queryFn: () => publicApi.getGeoHint(),
    staleTime: 1000 * 60 * 30,
  });
}
