import { useQuery } from '@tanstack/react-query';
import * as coursesApi from '@/services/api/courses';
import type { ListCoursesParams } from '@/services/api/courses';

export function useCourses(params: ListCoursesParams = {}) {
  return useQuery({
    queryKey: ['courses', params],
    queryFn: () => coursesApi.listCourses(params),
  });
}

export function useCourse(id: string) {
  return useQuery({
    queryKey: ['course', id],
    queryFn: () => coursesApi.getCourse(id),
    enabled: Boolean(id),
  });
}

export function useCourseSessions(courseId: string) {
  return useQuery({
    queryKey: ['course-sessions', courseId],
    queryFn: () => coursesApi.listCourseSessions(courseId),
    enabled: Boolean(courseId),
  });
}
