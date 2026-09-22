import { z } from 'zod';
import { Language, LearnerType, ProviderType, Role } from '@prisma/client';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  role: z.enum([Role.Student, Role.Parent, Role.Tutor, Role.InstituteAdmin]),
  language: z.enum([Language.en, Language.ar]).optional(),
  /** Profile preference for learners — does not restrict marketplace browsing. */
  learnerType: z.nativeEnum(LearnerType).optional(),
  /** For Tutor accounts: Teacher vs Trainer. Institutes use Role.InstituteAdmin. */
  providerType: z.enum([ProviderType.Teacher, ProviderType.Trainer]).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
