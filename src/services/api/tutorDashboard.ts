import type { ApiSuccess } from '@/types/api';
import type { Booking, Course, CourseSession, PaymentStatus, VerificationStatus } from '@/types/models';
import { apiRequest } from './client';

export type TutorEarnings = {
  currency: string;
  paidTotal: number;
  paidCount: number;
  pendingPaymentAmount: number;
  pendingPayoutAmount: number;
  recent: Array<{
    amount: number;
    currency: string;
    paidAt: string | null;
    bookingId: string;
    courseTitle: string;
    studentName: string;
    status: string;
  }>;
};

export type TutorUpcomingSession = CourseSession & {
  course: Pick<Course, 'id' | 'title' | 'titleAr' | 'courseCode' | 'format' | 'imageUrl'>;
  bookings: Array<{
    id: string;
    status: string;
    user: { id: string; firstName: string; lastName: string; email: string };
    payment?: { status: PaymentStatus } | null;
  }>;
};

export type TutorCourseRow = Course & {
  _count?: { bookings: number; sessions: number };
  sessions?: CourseSession[];
};

export type TutorStudentGroup = {
  user: { id: string; firstName: string; lastName: string; email: string };
  bookings: Booking[];
  bookingCount: number;
  upcomingSession: CourseSession | null;
};

export type TutorVerification = {
  verificationStatus: VerificationStatus;
  bio: string | null;
  expertise: string[];
  ratingAvg: number;
  ratingCount: number;
  studentCount: number;
  courseCount: number;
};

export async function getTutorUpcoming() {
  const result = await apiRequest<ApiSuccess<TutorUpcomingSession[]>>('/tutor/dashboard/upcoming', {
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
  const result = await apiRequest<ApiSuccess<TutorCourseRow[]>>('/tutor/dashboard/courses', {
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

export async function getTutorVerification() {
  const result = await apiRequest<ApiSuccess<TutorVerification>>('/tutor/dashboard/verification', {
    auth: true,
  });
  return result.data;
}
