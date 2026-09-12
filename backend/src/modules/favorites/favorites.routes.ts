import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../../lib/errors.js';
import { paramId } from '../../lib/params.js';
import { prisma } from '../../lib/prisma.js';
import { requireAuth, type AuthedRequest } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';

const createFavoriteSchema = z
  .object({
    courseId: z.string().uuid().optional(),
    tutorId: z.string().uuid().optional(),
    instituteId: z.string().uuid().optional(),
  })
  .refine((v) => Boolean(v.courseId || v.tutorId || v.instituteId), {
    message: 'At least one of courseId, tutorId, or instituteId is required',
  });

export const favoritesRouter = Router();

favoritesRouter.use(requireAuth);

favoritesRouter.get('/', async (req: AuthedRequest, res, next) => {
  try {
    const data = await prisma.favorite.findMany({
      where: { userId: req.user!.sub },
      include: {
        course: true,
        institute: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

favoritesRouter.post('/', validate(createFavoriteSchema), async (req: AuthedRequest, res, next) => {
  try {
    const body = req.body as z.infer<typeof createFavoriteSchema>;
    const data = await prisma.favorite.create({
      data: {
        userId: req.user!.sub,
        courseId: body.courseId,
        tutorId: body.tutorId,
        instituteId: body.instituteId,
      },
      include: { course: true, institute: true },
    });
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

favoritesRouter.delete('/:id', async (req: AuthedRequest, res, next) => {
  try {
    const favorite = await prisma.favorite.findUnique({ where: { id: paramId(req.params.id) } });
    if (!favorite) {
      throw new AppError('NOT_FOUND', 'Favorite not found', 404);
    }
    if (favorite.userId !== req.user!.sub) {
      throw new AppError('FORBIDDEN', 'Not your favorite', 403);
    }
    await prisma.favorite.delete({ where: { id: favorite.id } });
    res.json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
});
