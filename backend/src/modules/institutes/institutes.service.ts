import { VerificationStatus, type Prisma } from '@prisma/client';
import { z } from 'zod';
import { AppError } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';

export const listInstitutesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  q: z.string().optional(),
  verifiedOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
});

export async function listInstitutes(query: z.infer<typeof listInstitutesQuerySchema>) {
  const where: Prisma.InstituteWhereInput = {};
  if (query.verifiedOnly) {
    where.verificationStatus = VerificationStatus.Verified;
  }
  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: 'insensitive' } },
      { nameAr: { contains: query.q, mode: 'insensitive' } },
      { description: { contains: query.q, mode: 'insensitive' } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.institute.count({ where }),
    prisma.institute.findMany({
      where,
      include: {
        _count: { select: { courses: true, members: true } },
      },
      orderBy: { ratingAvg: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return {
    data: items,
    meta: { page: query.page, pageSize: query.pageSize, total },
  };
}

export async function getInstituteById(id: string) {
  const institute = await prisma.institute.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true, role: true },
          },
        },
      },
      courses: {
        where: { status: 'Published' },
        include: { category: true, subject: true },
      },
    },
  });
  if (!institute) {
    throw new AppError('NOT_FOUND', 'Institute not found', 404);
  }
  return institute;
}
