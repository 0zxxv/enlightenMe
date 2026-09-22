import type { ApiPaginated, ApiSuccess } from '@/types/api';
import type { ProviderType, Tutor } from '@/types/models';
import { apiRequest } from './client';

export type ListTutorsParams = {
  q?: string;
  page?: number;
  pageSize?: number;
  providerType?: ProviderType;
};

function toQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function listTutors(params: ListTutorsParams = {}) {
  return apiRequest<ApiPaginated<Tutor>>(`/tutors${toQuery(params)}`);
}

export async function getTutor(id: string) {
  const result = await apiRequest<ApiSuccess<Tutor>>(`/tutors/${id}`);
  return result.data;
}
