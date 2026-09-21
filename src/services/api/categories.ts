import type { ApiSuccess } from '@/types/api';
import type { Category, Subject } from '@/types/models';
import { apiRequest } from './client';

export type CategoryNode = Category & {
  children?: CategoryNode[];
  subjects?: Subject[];
};

export async function listCategories() {
  const result = await apiRequest<ApiSuccess<CategoryNode[]>>('/categories');
  return result.data;
}
