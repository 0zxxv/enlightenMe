import { CourseStatus, Role, VerificationStatus } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';
import { requireAuth, requireRoles, type AuthedRequest } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';

const verifyTutorSchema = z.object({
  tutorProfileId: z.string().uuid(),
  status: z.enum([
    VerificationStatus.Verified,
    VerificationStatus.Rejected,
    VerificationStatus.Pending,
    VerificationStatus.Suspended,
  ]),
});

const approveCourseSchema = z.object({
  courseId: z.string().uuid(),
});

const suspendUserSchema = z.object({
  userId: z.string().uuid(),
});

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRoles(Role.Admin));

adminRouter.post(
  '/tutors/verify',
  validate(verifyTutorSchema),
  async (req: AuthedRequest, res, next) => {
    try {
      const { tutorProfileId, status } = req.body as z.infer<typeof verifyTutorSchema>;
      const tutor = await prisma.tutorProfile.findUnique({ where: { id: tutorProfileId } });
      if (!tutor) {
        throw new AppError('NOT_FOUND', 'Tutor profile not found', 404);
      }
      const data = await prisma.tutorProfile.update({
        where: { id: tutorProfileId },
        data: { verificationStatus: status },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

adminRouter.post(
  '/courses/approve',
  validate(approveCourseSchema),
  async (req: AuthedRequest, res, next) => {
    try {
      const { courseId } = req.body as z.infer<typeof approveCourseSchema>;
      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) {
        throw new AppError('NOT_FOUND', 'Course not found', 404);
      }
      const data = await prisma.course.update({
        where: { id: courseId },
        data: { status: CourseStatus.Published },
      });
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

adminRouter.post(
  '/users/suspend',
  validate(suspendUserSchema),
  async (req: AuthedRequest, res, next) => {
    try {
      const { userId } = req.body as z.infer<typeof suspendUserSchema>;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { tutorProfile: true },
      });
      if (!user) {
        throw new AppError('NOT_FOUND', 'User not found', 404);
      }
      if (user.role === Role.Admin) {
        throw new AppError('FORBIDDEN', 'Cannot suspend an admin user', 403);
      }

      const data = await prisma.$transaction(async (tx) => {
        if (user.tutorProfile) {
          await tx.tutorProfile.update({
            where: { id: user.tutorProfile.id },
            data: { verificationStatus: VerificationStatus.Suspended },
          });
        }
        await tx.refreshToken.updateMany({
          where: { userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        return tx.user.findUnique({
          where: { id: userId },
          include: { tutorProfile: true },
        });
      });

      res.json({ data: { user: data, suspended: true } });
    } catch (err) {
      next(err);
    }
  },
);
