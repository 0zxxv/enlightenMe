import type { ApiSuccess } from '@/types/api';
import type { Review } from '@/types/models';
import { apiRequest } from './client';

export async function createReview(input: {
  bookingId: string;
  rating: number;
  comment?: string;
}) {
  const result = await apiRequest<ApiSuccess<Review>>('/reviews', {
    method: 'POST',
    body: input,
    auth: true,
  });
  return result.data;
}
