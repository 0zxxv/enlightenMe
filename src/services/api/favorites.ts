import type { ApiSuccess } from '@/types/api';
import type { Favorite } from '@/types/models';
import { apiRequest } from './client';

export async function listFavorites() {
  const result = await apiRequest<ApiSuccess<Favorite[]>>('/favorites', { auth: true });
  return result.data;
}

export async function addFavorite(input: {
  courseId?: string;
  tutorId?: string;
  instituteId?: string;
}) {
  const result = await apiRequest<ApiSuccess<Favorite>>('/favorites', {
    method: 'POST',
    body: input,
    auth: true,
  });
  return result.data;
}

export async function removeFavorite(id: string) {
  const result = await apiRequest<ApiSuccess<{ success: boolean }>>(`/favorites/${id}`, {
    method: 'DELETE',
    auth: true,
  });
  return result.data;
}
