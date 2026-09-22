import { ProviderType, VerificationStatus, type Prisma } from '@prisma/client';
import { z } from 'zod';
import { AppError } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';

export const listTutorsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  q: z.string().optional(),
  providerType: z.nativeEnum(ProviderType).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  verifiedOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
});

export async function listTutors(query: z.infer<typeof listTutorsQuerySchema>) {
  const where: Prisma.TutorProfileWhereInput = {};
  if (query.verifiedOnly) {
    where.verificationStatus = VerificationStatus.Verified;
  }
  if (query.providerType) {
    where.providerType = query.providerType;
  }
  if (query.minRating !== undefined) {
    where.ratingAvg = { gte: query.minRating };
  }
  if (query.q) {
    where.OR = [
      { bio: { contains: query.q, mode: 'insensitive' } },
      { user: { firstName: { contains: query.q, mode: 'insensitive' } } },
      { user: { lastName: { contains: query.q, mode: 'insensitive' } } },
      { expertise: { has: query.q } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.tutorProfile.count({ where }),
    prisma.tutorProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            language: true,
          },
        },
      },
      orderBy: [{ ratingAvg: 'desc' }, { studentCount: 'desc' }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return {
    data: items.map((profile) => ({
      id: profile.user.id,
      firstName: profile.user.firstName,
      lastName: profile.user.lastName,
      email: profile.user.email,
      tutorProfile: {
        id: profile.id,
        userId: profile.userId,
        bio: profile.bio ?? '',
        expertise: profile.expertise,
        providerType: profile.providerType,
        verificationStatus: profile.verificationStatus,
        ratingAvg: profile.ratingAvg,
        ratingCount: profile.ratingCount,
        studentCount: profile.studentCount,
        courseCount: profile.courseCount,
      },
    })),
    meta: { page: query.page, pageSize: query.pageSize, total },
  };
}

export async function getTutorById(id: string) {
  const tutor =
    (await prisma.tutorProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            language: true,
            coursesAsTutor: {
              where: { status: 'Published' },
              include: { category: true, subject: true },
            },
          },
        },
        reviews: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
            course: { select: { id: true, title: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    })) ??
    (await prisma.tutorProfile.findUnique({
      where: { userId: id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            language: true,
            coursesAsTutor: {
              where: { status: 'Published' },
              include: { category: true, subject: true },
            },
          },
        },
        reviews: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
            course: { select: { id: true, title: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    }));

  if (!tutor) {
    throw new AppError('NOT_FOUND', 'Tutor not found', 404);
  }
  return tutor;
}
