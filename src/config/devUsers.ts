import type { Href } from 'expo-router';
import type { Role } from '@/types/models';

export const DEV_PASSWORD = 'Password123!';

export type DevExperience = {
  id: string;
  email: string;
  password: string;
  label: string;
  role: Role;
  /** Where to land after signing in as this seeded user. */
  href: Href;
};

/** Role experiences backed by Prisma seed accounts. */
export const DEV_EXPERIENCES: DevExperience[] = [
  {
    id: 'student',
    email: 'student@dars.app',
    password: DEV_PASSWORD,
    label: 'Student Experience',
    role: 'Student',
    href: '/(tabs)',
  },
  {
    id: 'tutor-sara',
    email: 'sara.almansoori@dars.app',
    password: DEV_PASSWORD,
    label: 'Tutor Experience — Sara',
    role: 'Tutor',
    href: '/tutor-dashboard',
  },
  {
    id: 'tutor-zahra',
    email: 'zahra.ali@dars.app',
    password: DEV_PASSWORD,
    label: 'Tutor Experience — Zahra',
    role: 'Tutor',
    href: '/tutor-dashboard',
  },
  {
    id: 'admin',
    email: 'admin@dars.app',
    password: DEV_PASSWORD,
    label: 'Admin Experience',
    role: 'Admin',
    href: '/(tabs)',
  },
];

export type QuickTestId = 'marketplace' | 'booking' | 'messaging' | 'profile' | 'settings';

export type DevQuickTest = {
  id: QuickTestId;
  label: string;
  /** Student is used for all quick tests so seeded bookings/favorites apply. */
  href?: Href;
  /** When true, open the first published course’s booking flow. */
  openFirstCourseBooking?: boolean;
};

export const DEV_QUICK_TESTS: DevQuickTest[] = [
  { id: 'marketplace', label: 'Marketplace', href: '/(tabs)/explore' },
  { id: 'booking', label: 'Booking', openFirstCourseBooking: true },
  { id: 'messaging', label: 'Messaging', href: '/(tabs)/messages' },
  { id: 'profile', label: 'Profile', href: '/(tabs)/profile' },
  { id: 'settings', label: 'Settings', href: '/settings' },
];

/** @deprecated Prefer DEV_EXPERIENCES */
export const DEV_USERS = DEV_EXPERIENCES.map((e) => ({
  email: e.email,
  password: e.password,
  name: e.label,
  role: e.role,
}));
