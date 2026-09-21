import type { ApiPaginated, ApiSuccess } from '@/types/api';
import type {
  Course,
  CourseFormat,
  CourseSession,
  CourseStatus,
  CourseType,
} from '@/types/models';
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
  status?: CourseStatus;
  mine?: boolean;
  tutorId?: string;
  courseCode?: string;
};

function toQuery(params: Record<string, string | number | boolean | undefined>) {
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

export async function updateCourse(id: string, body: Record<string, unknown>) {
  const result = await apiRequest<ApiSuccess<Course>>(`/courses/${id}`, {
    method: 'PATCH',
    body,
    auth: true,
  });
  return result.data;
}

export async function publishCourse(id: string) {
  const result = await apiRequest<ApiSuccess<Course>>(`/courses/${id}/publish`, {
    method: 'POST',
    auth: true,
  });
  return result.data;
}

export async function pauseCourse(id: string) {
  const result = await apiRequest<ApiSuccess<Course>>(`/courses/${id}/pause`, {
    method: 'POST',
    auth: true,
  });
  return result.data;
}

export async function archiveCourse(id: string) {
  const result = await apiRequest<ApiSuccess<Course>>(`/courses/${id}/archive`, {
    method: 'POST',
    auth: true,
  });
  return result.data;
}

export async function listCourseSessions(courseId: string) {
  const result = await apiRequest<ApiSuccess<CourseSession[]>>(`/courses/${courseId}/sessions`);
  return result.data;
}

export async function createCourseSession(
  courseId: string,
  body: { startsAt: string; endsAt: string; seatsTotal?: number },
) {
  const result = await apiRequest<ApiSuccess<CourseSession>>(`/courses/${courseId}/sessions`, {
    method: 'POST',
    body,
    auth: true,
  });
  return result.data;
}

export async function updateCourseSession(
  courseId: string,
  sessionId: string,
  body: Record<string, unknown>,
) {
  const result = await apiRequest<ApiSuccess<CourseSession>>(
    `/courses/${courseId}/sessions/${sessionId}`,
    { method: 'PATCH', body, auth: true },
  );
  return result.data;
}

export async function deleteCourseSession(courseId: string, sessionId: string) {
  const result = await apiRequest<ApiSuccess<CourseSession>>(
    `/courses/${courseId}/sessions/${sessionId}`,
    { method: 'DELETE', auth: true },
  );
  return result.data;
}
