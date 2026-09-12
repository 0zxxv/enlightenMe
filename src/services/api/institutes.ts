import type { ApiPaginated, ApiSuccess } from '@/types/api';
import type { Institute } from '@/types/models';
import { apiRequest } from './client';

export type ListInstitutesParams = {
  q?: string;
  page?: number;
  pageSize?: number;
};

function toQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function listInstitutes(params: ListInstitutesParams = {}) {
  return apiRequest<ApiPaginated<Institute>>(`/institutes${toQuery(params)}`);
}

export async function getInstitute(id: string) {
  const result = await apiRequest<ApiSuccess<Institute>>(`/institutes/${id}`);
  return result.data;
}
