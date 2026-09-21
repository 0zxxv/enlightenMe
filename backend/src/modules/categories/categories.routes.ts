import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';

export const categoriesRouter = Router();

categoriesRouter.get('/', async (_req, res, next) => {
  try {
    const categories = await prisma.courseCategory.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: {
            subjects: { select: { id: true, nameEn: true, nameAr: true } },
          },
          orderBy: { nameEn: 'asc' },
        },
        subjects: { select: { id: true, nameEn: true, nameAr: true } },
      },
      orderBy: { nameEn: 'asc' },
    });
    res.json({ data: categories });
  } catch (err) {
    next(err);
  }
});
