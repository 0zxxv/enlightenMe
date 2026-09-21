import type { Role } from '@/types/models';

export type DevUser = {
  email: string;
  password: string;
  name: string;
  role: Role;
};

/** Seeded demo accounts — shared password from backend seed. */
export const DEV_USERS: DevUser[] = [
  {
    email: 'student@dars.app',
    password: 'Password123!',
    name: 'Demo Student',
    role: 'Student',
  },
  {
    email: 'sara.almansoori@dars.app',
    password: 'Password123!',
    name: 'Sara AlMansoori',
    role: 'Tutor',
  },
  {
    email: 'zahra.ali@dars.app',
    password: 'Password123!',
    name: 'Zahra Ali',
    role: 'Tutor',
  },
  {
    email: 'admin@dars.app',
    password: 'Password123!',
    name: 'System Admin',
    role: 'Admin',
  },
];
