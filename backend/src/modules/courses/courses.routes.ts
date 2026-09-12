import { Role } from '@prisma/client';
import { Router } from 'express';
import { paramId } from '../../lib/params.js';
import { requireAuth, requireRoles, type AuthedRequest } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  createCourseSchema,
  listCoursesQuerySchema,
  updateCourseSchema,
} from './courses.service.js';
import * as coursesService from './courses.service.js';

export const coursesRouter = Router();

coursesRouter.get('/', validate(listCoursesQuerySchema, 'query'), async (req, res, next) => {
  try {
    const result = await coursesService.listCourses(req.query as never);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

coursesRouter.get('/:id', async (req, res, next) => {
  try {
    const data = await coursesService.getCourseById(paramId(req.params.id));
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

coursesRouter.post(
  '/',
  requireAuth,
  requireRoles(Role.Tutor, Role.Admin, Role.InstituteAdmin),
  validate(createCourseSchema),
  async (req: AuthedRequest, res, next) => {
    try {
      const data = await coursesService.createCourse(req.user!.sub, req.body);
      res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  },
);

coursesRouter.patch(
  '/:id',
  requireAuth,
  requireRoles(Role.Tutor, Role.Admin, Role.InstituteAdmin),
  validate(updateCourseSchema),
  async (req: AuthedRequest, res, next) => {
    try {
      const data = await coursesService.updateCourse(
        paramId(req.params.id),
        req.user!.sub,
        req.user!.role,
        req.body,
      );
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

coursesRouter.post(
  '/:id/publish',
  requireAuth,
  requireRoles(Role.Tutor, Role.Admin, Role.InstituteAdmin),
  async (req: AuthedRequest, res, next) => {
    try {
      const data = await coursesService.publishCourse(
        paramId(req.params.id),
        req.user!.sub,
        req.user!.role,
      );
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);
