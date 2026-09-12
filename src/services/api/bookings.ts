import type { ApiSuccess } from '@/types/api';
import type { Booking } from '@/types/models';
import { apiRequest } from './client';

export async function createBooking(input: { courseId: string; sessionId: string }) {
  const result = await apiRequest<ApiSuccess<Booking>>('/bookings', {
    method: 'POST',
    body: input,
    auth: true,
  });
  return result.data;
}

export async function listMyBookings() {
  const result = await apiRequest<ApiSuccess<Booking[]>>('/bookings/mine', { auth: true });
  return result.data;
}

export async function getBooking(id: string) {
  const result = await apiRequest<ApiSuccess<Booking>>(`/bookings/${id}`, { auth: true });
  return result.data;
}

export async function cancelBooking(id: string) {
  const result = await apiRequest<ApiSuccess<Booking>>(`/bookings/${id}/cancel`, {
    method: 'POST',
    auth: true,
  });
  return result.data;
}
