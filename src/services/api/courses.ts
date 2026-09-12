import type { ApiPaginated, ApiSuccess } from '@/types/api';
import type { Course, CourseFormat, CourseType } from '@/types/models';
import { apiRequest } from './client';

export type ListCoursesParams = {
  q?: string;
  page?: number;
  pageSize?: number;
  type?: CourseType;
  category?: string;
  format?: CourseFormat;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
};

function toQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function listCourses(params: ListCoursesParams = {}) {
  return apiRequest<ApiPaginated<Course>>(`/courses${toQuery(params)}`);
}

export async function getCourse(id: string) {
  const result = await apiRequest<ApiSuccess<Course>>(`/courses/${id}`);
  return result.data;
}

export async function createCourse(body: Record<string, unknown>) {
  const result = await apiRequest<ApiSuccess<Course>>('/courses', {
    method: 'POST',
    body,
    auth: true,
  });
  return result.data;
}
