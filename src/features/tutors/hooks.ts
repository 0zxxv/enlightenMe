import { useQuery } from '@tanstack/react-query';
import * as tutorsApi from '@/services/api/tutors';
import type { ListTutorsParams } from '@/services/api/tutors';

export function useTutors(params: ListTutorsParams = {}) {
  return useQuery({
    queryKey: ['tutors', params],
    queryFn: () => tutorsApi.listTutors(params),
  });
}

export function useTutor(id: string) {
  return useQuery({
    queryKey: ['tutor', id],
    queryFn: () => tutorsApi.getTutor(id),
    enabled: Boolean(id),
  });
}
