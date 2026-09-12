import { useQuery } from '@tanstack/react-query';
import * as institutesApi from '@/services/api/institutes';
import type { ListInstitutesParams } from '@/services/api/institutes';

export function useInstitutes(params: ListInstitutesParams = {}) {
  return useQuery({
    queryKey: ['institutes', params],
    queryFn: () => institutesApi.listInstitutes(params),
  });
}

export function useInstitute(id: string) {
  return useQuery({
    queryKey: ['institute', id],
    queryFn: () => institutesApi.getInstitute(id),
    enabled: Boolean(id),
  });
}
