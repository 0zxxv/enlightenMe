import {
  CourseFormat,
  CourseStatus,
  Prisma,
  ProviderType,
  Role,
  ServiceType,
  SessionStatus,
} from '@prisma/client';
import { z } from 'zod';
import {
  isProviderAllowedForService,
  normalizeServiceType,
  type ServiceTypeId,
} from '../../domain/marketplace.js';
import { AppError } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';

const serviceTypeInput = z
  .string()
  .transform((v, ctx) => {
    const normalized = normalizeServiceType(v);
    if (!normalized) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid serviceType' });
      return z.NEVER;
    }
    return normalized as ServiceType;
  });

export const listCoursesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  q: z.string().optional(),
  category: z.string().optional(),
  /** @deprecated use serviceType — kept for older clients */
  type: serviceTypeInput.optional(),
  serviceType: serviceTypeInput.optional(),
  providerType: z.nativeEnum(ProviderType).optional(),
  format: z.nativeEnum(CourseFormat).optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  universityId: z.string().uuid().optional(),
  collegeId: z.string().uuid().optional(),
  grade: z.string().optional(),
  stage: z.string().optional(),
  level: z.string().optional(),
  courseCode: z.string().optional(),
  /** Owner-only; public list always forces Published. */
  status: z.nativeEnum(CourseStatus).optional(),
  tutorId: z.string().uuid().optional(),
  mine: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform((v) => v === true || v === 'true'),
});

export const createCourseSchema = z.object({
  title: z.string().min(1),
  titleAr: z.string().optional(),
  description: z.string().min(1),
  descriptionAr: z.string().optional(),
  categoryId: z.string().uuid(),
  subjectId: z.string().uuid().optional(),
  serviceType: serviceTypeInput,
  /** @deprecated use serviceType */
  type: serviceTypeInput.optional(),
  level: z.string().optional(),
  grade: z.string().optional(),
  stage: z.string().optional(),
  curriculumName: z.string().optional(),
  universityId: z.string().uuid().optional(),
  collegeId: z.string().uuid().optional(),
  courseCode: z.string().optional(),
  major: z.string().optional(),
  skillCategory: z.string().optional(),
  priceDecimal: z.coerce.number().nonnegative(),
  currency: z.string().default('BHD'),
  durationMinutes: z.number().int().positive().optional(),
  sessionCount: z.number().int().positive().default(1),
  capacity: z.number().int().positive().default(1),
  format: z.nativeEnum(CourseFormat).default(CourseFormat.Online),
  location: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')).transform((v) => v || undefined),
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

export const createSessionSchema = z.object({
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  seatsTotal: z.number().int().positive().optional(),
});

export const updateSessionSchema = z.object({
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  seatsTotal: z.number().int().positive().optional(),
  status: z.nativeEnum(SessionStatus).optional(),
});

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
  _count: { select: { bookings: true } },
} satisfies Prisma.CourseInclude;

function assertOwner(course: { tutorId: string | null }, userId: string, role: Role) {
  if (role !== Role.Admin && course.tutorId !== userId) {
    throw new AppError('FORBIDDEN', 'You can only manage your own courses', 403);
  }
}

export async function listCourses(
  query: z.infer<typeof listCoursesQuerySchema>,
  viewer?: { sub: string; role: Role },
) {
  const where: Prisma.CourseWhereInput = {};

  const viewingOwn =
    Boolean(query.mine && viewer) ||
    (Boolean(query.tutorId) && viewer && query.tutorId === viewer.sub) ||
    (query.status &&
      query.status !== CourseStatus.Published &&
      viewer &&
      (viewer.role === Role.Admin || viewer.role === Role.Tutor));

  if (query.mine && viewer) {
    where.tutorId = viewer.sub;
    if (query.status) where.status = query.status;
  } else if (viewingOwn && viewer?.role === Role.Admin && query.tutorId) {
    where.tutorId = query.tutorId;
    if (query.status) where.status = query.status;
  } else if (viewingOwn && viewer && query.status && query.status !== CourseStatus.Published) {
    // Tutor requesting non-published: only their own
    where.tutorId = viewer.sub;
    where.status = query.status;
  } else {
    // Public marketplace: Published only — ignore client status overrides
    where.status = CourseStatus.Published;
    if (query.tutorId) where.tutorId = query.tutorId;
  }

  if (query.q) {
    where.OR = [
      { title: { contains: query.q, mode: 'insensitive' } },
      { titleAr: { contains: query.q, mode: 'insensitive' } },
      { description: { contains: query.q, mode: 'insensitive' } },
      { courseCode: { contains: query.q, mode: 'insensitive' } },
      {
        tutor: {
          OR: [
            { firstName: { contains: query.q, mode: 'insensitive' } },
            { lastName: { contains: query.q, mode: 'insensitive' } },
          ],
        },
      },
      { subject: { nameEn: { contains: query.q, mode: 'insensitive' } } },
      { subject: { nameAr: { contains: query.q, mode: 'insensitive' } } },
    ];
  }
  if (query.category) {
    where.category = {
      OR: [{ slug: query.category }, { id: query.category }],
    };
  }
  const serviceType = query.serviceType ?? query.type;
  if (serviceType) where.serviceType = serviceType;
  if (query.format) where.format = query.format;
  if (query.universityId) where.universityId = query.universityId;
  if (query.collegeId) where.collegeId = query.collegeId;
  if (query.grade) where.grade = { equals: query.grade, mode: 'insensitive' };
  if (query.stage) where.stage = { equals: query.stage, mode: 'insensitive' };
  if (query.level) where.level = { equals: query.level, mode: 'insensitive' };
  if (query.courseCode) {
    where.courseCode = { equals: query.courseCode, mode: 'insensitive' };
  }
  if (query.providerType === ProviderType.Institute) {
    where.instituteId = { not: null };
  } else if (query.providerType === ProviderType.Teacher || query.providerType === ProviderType.Trainer) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      { tutorId: { not: null } },
      {
        tutor: {
          tutorProfile: { providerType: query.providerType },
        },
      },
    ];
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

export async function getCourseById(
  id: string,
  viewer?: { sub: string; role: Role },
) {
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

  const isOwner =
    viewer &&
    (viewer.role === Role.Admin || course.tutorId === viewer.sub);

  if (course.status !== CourseStatus.Published && !isOwner) {
    throw new AppError('NOT_FOUND', 'Course not found', 404);
  }

  // Public viewers only see bookable future scheduled sessions with seats
  if (!isOwner) {
    const now = new Date();
    return {
      ...course,
      sessions: course.sessions.filter(
        (s) =>
          s.status === SessionStatus.Scheduled &&
          s.startsAt > now &&
          s.seatsAvailable > 0,
      ),
    };
  }

  return course;
}

export async function createCourse(tutorId: string, input: z.infer<typeof createCourseSchema>) {
  const { curriculum, type: legacyType, serviceType: explicitType, ...rest } = input;
  const serviceType = (explicitType ?? legacyType) as ServiceType | undefined;
  if (!serviceType) {
    throw new AppError('VALIDATION', 'serviceType is required', 400);
  }

  const profile = await prisma.tutorProfile.findUnique({ where: { userId: tutorId } });
  if (!profile) {
    throw new AppError('FORBIDDEN', 'Tutor profile required to create a course', 403);
  }
  if (
    !isProviderAllowedForService(
      serviceType as ServiceTypeId,
      profile.providerType as 'Teacher' | 'Institute' | 'Trainer',
    )
  ) {
    throw new AppError(
      'FORBIDDEN',
      `Provider type ${profile.providerType} cannot offer ${serviceType} services`,
      403,
    );
  }

  const course = await prisma.course.create({
    data: {
      ...rest,
      serviceType,
      priceDecimal: rest.priceDecimal,
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
  assertOwner(course, userId, role);

  const { curriculum, type: legacyType, serviceType: explicitType, ...data } = input;
  const serviceType = explicitType ?? legacyType;

  return prisma.$transaction(async (tx) => {
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

    if (serviceType) {
      const profile = await tx.tutorProfile.findUnique({ where: { userId } });
      if (
        profile &&
        !isProviderAllowedForService(
          serviceType as ServiceTypeId,
          profile.providerType as 'Teacher' | 'Institute' | 'Trainer',
        )
      ) {
        throw new AppError(
          'FORBIDDEN',
          `Provider type ${profile.providerType} cannot offer ${serviceType} services`,
          403,
        );
      }
    }

    return tx.course.update({
      where: { id: courseId },
      data: {
        ...data,
        ...(serviceType ? { serviceType } : {}),
      },
      include: courseInclude,
    });
  });
}

export async function publishCourse(courseId: string, userId: string, role: Role) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { sessions: true },
  });
  if (!course) {
    throw new AppError('NOT_FOUND', 'Course not found', 404);
  }
  assertOwner(course, userId, role);

  if (!course.title?.trim() || !course.description?.trim()) {
    throw new AppError('VALIDATION', 'Title and description are required to publish', 400);
  }
  if (Number(course.priceDecimal) <= 0) {
    throw new AppError('VALIDATION', 'Price must be greater than zero to publish', 400);
  }

  const now = new Date();
  const futureSessions = course.sessions.filter(
    (s) => s.status === SessionStatus.Scheduled && s.startsAt > now,
  );
  if (futureSessions.length === 0) {
    throw new AppError(
      'VALIDATION',
      'Add at least one upcoming session before publishing',
      400,
    );
  }

  return prisma.course.update({
    where: { id: courseId },
    data: { status: CourseStatus.Published },
    include: courseInclude,
  });
}

export async function setCourseStatus(
  courseId: string,
  userId: string,
  role: Role,
  status: CourseStatus,
) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    throw new AppError('NOT_FOUND', 'Course not found', 404);
  }
  assertOwner(course, userId, role);

  if (status === CourseStatus.Published) {
    return publishCourse(courseId, userId, role);
  }

  return prisma.course.update({
    where: { id: courseId },
    data: { status },
    include: courseInclude,
  });
}

export async function listSessions(courseId: string, viewer?: { sub: string; role: Role }) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    throw new AppError('NOT_FOUND', 'Course not found', 404);
  }

  const isOwner =
    viewer && (viewer.role === Role.Admin || course.tutorId === viewer.sub);

  if (course.status !== CourseStatus.Published && !isOwner) {
    throw new AppError('NOT_FOUND', 'Course not found', 404);
  }

  const now = new Date();
  const sessions = await prisma.courseSession.findMany({
    where: {
      courseId,
      ...(isOwner
        ? {}
        : {
            status: SessionStatus.Scheduled,
            startsAt: { gt: now },
            seatsAvailable: { gt: 0 },
          }),
    },
    orderBy: { startsAt: 'asc' },
    include: isOwner
      ? {
          bookings: {
            where: {
              status: { in: ['Pending', 'Confirmed', 'Completed'] },
            },
            select: { id: true, userId: true, status: true },
          },
        }
      : undefined,
  });

  return sessions;
}

export async function createSession(
  courseId: string,
  userId: string,
  role: Role,
  input: z.infer<typeof createSessionSchema>,
) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    throw new AppError('NOT_FOUND', 'Course not found', 404);
  }
  assertOwner(course, userId, role);

  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(input.endsAt);
  if (!(endsAt > startsAt)) {
    throw new AppError('VALIDATION', 'endsAt must be after startsAt', 400);
  }
  if (startsAt <= new Date()) {
    throw new AppError('VALIDATION', 'Session must start in the future', 400);
  }

  const seatsTotal = input.seatsTotal ?? course.capacity;

  return prisma.courseSession.create({
    data: {
      courseId,
      startsAt,
      endsAt,
      seatsTotal,
      seatsAvailable: seatsTotal,
      status: SessionStatus.Scheduled,
    },
  });
}

export async function updateSession(
  courseId: string,
  sessionId: string,
  userId: string,
  role: Role,
  input: z.infer<typeof updateSessionSchema>,
) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    throw new AppError('NOT_FOUND', 'Course not found', 404);
  }
  assertOwner(course, userId, role);

  const session = await prisma.courseSession.findFirst({
    where: { id: sessionId, courseId },
  });
  if (!session) {
    throw new AppError('NOT_FOUND', 'Session not found', 404);
  }

  const startsAt = input.startsAt ? new Date(input.startsAt) : session.startsAt;
  const endsAt = input.endsAt ? new Date(input.endsAt) : session.endsAt;
  if (!(endsAt > startsAt)) {
    throw new AppError('VALIDATION', 'endsAt must be after startsAt', 400);
  }

  let seatsAvailable = session.seatsAvailable;
  if (input.seatsTotal !== undefined) {
    const taken = session.seatsTotal - session.seatsAvailable;
    if (input.seatsTotal < taken) {
      throw new AppError(
        'VALIDATION',
        'seatsTotal cannot be less than already booked seats',
        400,
      );
    }
    seatsAvailable = input.seatsTotal - taken;
  }

  return prisma.courseSession.update({
    where: { id: sessionId },
    data: {
      startsAt,
      endsAt,
      seatsTotal: input.seatsTotal,
      seatsAvailable,
      status: input.status,
    },
  });
}

export async function deleteSession(
  courseId: string,
  sessionId: string,
  userId: string,
  role: Role,
) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    throw new AppError('NOT_FOUND', 'Course not found', 404);
  }
  assertOwner(course, userId, role);

  const session = await prisma.courseSession.findFirst({
    where: { id: sessionId, courseId },
    include: {
      bookings: {
        where: { status: { in: ['Pending', 'Confirmed'] } },
      },
    },
  });
  if (!session) {
    throw new AppError('NOT_FOUND', 'Session not found', 404);
  }
  if (session.bookings.length > 0) {
    throw new AppError(
      'INVALID_STATUS',
      'Cannot delete a session with active bookings; cancel it instead',
      400,
    );
  }

  return prisma.courseSession.update({
    where: { id: sessionId },
    data: { status: SessionStatus.Cancelled },
  });
}
