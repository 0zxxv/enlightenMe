import type { ApiSuccess } from '@/types/api';
import type { Booking, Course } from '@/types/models';
import { apiRequest } from './client';

export type TutorEarnings = {
  currency: string;
  paidTotal: number;
  paidCount: number;
  pendingPayoutAmount: number;
};

export type TutorStudentGroup = {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
  };
  bookings: Booking[];
};

export async function getTutorUpcoming() {
  const result = await apiRequest<ApiSuccess<unknown[]>>('/tutor/dashboard/upcoming', {
    auth: true,
  });
  return result.data;
}

export async function getTutorEarnings() {
  const result = await apiRequest<ApiSuccess<TutorEarnings>>('/tutor/dashboard/earnings', {
    auth: true,
  });
  return result.data;
}

export async function getTutorCourses() {
  const result = await apiRequest<ApiSuccess<Course[]>>('/tutor/dashboard/courses', {
    auth: true,
  });
  return result.data;
}

export async function getTutorStudents() {
  const result = await apiRequest<ApiSuccess<TutorStudentGroup[]>>('/tutor/dashboard/students', {
    auth: true,
  });
  return result.data;
}
