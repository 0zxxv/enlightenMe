import { CourseFormat, CourseStatus, CourseType, Prisma, Role } from '@prisma/client';
import { z } from 'zod';
import { AppError } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';

export const listCoursesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  q: z.string().optional(),
  category: z.string().optional(),
  type: z.nativeEnum(CourseType).optional(),
  format: z.nativeEnum(CourseFormat).optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  universityId: z.string().uuid().optional(),
  courseCode: z.string().optional(),
  status: z.nativeEnum(CourseStatus).optional(),
});

export const createCourseSchema = z.object({
  title: z.string().min(1),
  titleAr: z.string().optional(),
  description: z.string().min(1),
  descriptionAr: z.string().optional(),
  categoryId: z.string().uuid(),
  subjectId: z.string().uuid().optional(),
  type: z.nativeEnum(CourseType),
  level: z.string().optional(),
  grade: z.string().optional(),
  universityId: z.string().uuid().optional(),
  collegeId: z.string().uuid().optional(),
  courseCode: z.string().optional(),
  major: z.string().optional(),
  priceDecimal: z.coerce.number().nonnegative(),
  currency: z.string().default('BHD'),
  durationMinutes: z.number().int().positive().optional(),
  sessionCount: z.number().int().positive().default(1),
  capacity: z.number().int().positive().default(1),
  format: z.nativeEnum(CourseFormat).default(CourseFormat.Online),
  location: z.string().optional(),
  imageUrl: z.string().url().optional(),
  curriculum: z
    .array(
      z.object({
        order: z.number().int().positive(),
        title: z.string().min(1),
        titleAr: z.string().optional(),
        description: z.string().optional(),
      }),
    )
    .optional(),
});

export const updateCourseSchema = createCourseSchema.partial();

const courseInclude = {
  category: true,
  subject: true,
  university: true,
  college: true,
  tutor: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      tutorProfile: true,
    },
  },
  institute: true,
  curriculum: { orderBy: { order: 'asc' as const } },
  sessions: { orderBy: { startsAt: 'asc' as const } },
} satisfies Prisma.CourseInclude;

export async function listCourses(query: z.infer<typeof listCoursesQuerySchema>) {
  const where: Prisma.CourseWhereInput = {
    status: query.status ?? CourseStatus.Published,
  };

  if (query.q) {
    where.OR = [
      { title: { contains: query.q, mode: 'insensitive' } },
      { titleAr: { contains: query.q, mode: 'insensitive' } },
      { description: { contains: query.q, mode: 'insensitive' } },
      { courseCode: { contains: query.q, mode: 'insensitive' } },
    ];
  }
  if (query.category) {
    where.category = {
      OR: [{ slug: query.category }, { id: query.category }],
    };
  }
  if (query.type) where.type = query.type;
  if (query.format) where.format = query.format;
  if (query.universityId) where.universityId = query.universityId;
  if (query.courseCode) {
    where.courseCode = { equals: query.courseCode, mode: 'insensitive' };
  }
  if (query.minRating !== undefined) where.ratingAvg = { gte: query.minRating };
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.priceDecimal = {};
    if (query.minPrice !== undefined) where.priceDecimal.gte = query.minPrice;
    if (query.maxPrice !== undefined) where.priceDecimal.lte = query.maxPrice;
  }

  const [total, items] = await Promise.all([
    prisma.course.count({ where }),
    prisma.course.findMany({
      where,
      include: courseInclude,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return {
    data: items,
    meta: { page: query.page, pageSize: query.pageSize, total },
  };
}

export async function getCourseById(id: string) {
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      ...courseInclude,
      reviews: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });
  if (!course) {
    throw new AppError('NOT_FOUND', 'Course not found', 404);
  }
  return course;
}

export async function createCourse(tutorId: string, input: z.infer<typeof createCourseSchema>) {
  const { curriculum, ...data } = input;
  const course = await prisma.course.create({
    data: {
      ...data,
      priceDecimal: data.priceDecimal,
      tutorId,
      status: CourseStatus.Draft,
      curriculum: curriculum
        ? {
            create: curriculum.map((item) => ({
              order: item.order,
              title: item.title,
              titleAr: item.titleAr,
              description: item.description,
            })),
          }
        : undefined,
    },
    include: courseInclude,
  });

  await prisma.tutorProfile.updateMany({
    where: { userId: tutorId },
    data: { courseCount: { increment: 1 } },
  });

  return course;
}

export async function updateCourse(
  courseId: string,
  userId: string,
  role: Role,
  input: z.infer<typeof updateCourseSchema>,
) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    throw new AppError('NOT_FOUND', 'Course not found', 404);
  }
  if (role !== Role.Admin && course.tutorId !== userId) {
    throw new AppError('FORBIDDEN', 'You can only update your own courses', 403);
  }

  const { curriculum, ...data } = input;
  const updated = await prisma.$transaction(async (tx) => {
    if (curriculum) {
      await tx.courseCurriculumItem.deleteMany({ where: { courseId } });
      await tx.courseCurriculumItem.createMany({
        data: curriculum.map((item) => ({
          courseId,
          order: item.order,
          title: item.title,
          titleAr: item.titleAr,
          description: item.description,
        })),
      });
    }
    return tx.course.update({
      where: { id: courseId },
      data,
      include: courseInclude,
    });
  });

  return updated;
}

export async function publishCourse(courseId: string, userId: string, role: Role) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    throw new AppError('NOT_FOUND', 'Course not found', 404);
  }
  if (role !== Role.Admin && course.tutorId !== userId) {
    throw new AppError('FORBIDDEN', 'You can only publish your own courses', 403);
  }
  return prisma.course.update({
    where: { id: courseId },
    data: { status: CourseStatus.Published },
    include: courseInclude,
  });
}
