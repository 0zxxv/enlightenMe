import { CourseStatus, Role } from '@prisma/client';
import { Router } from 'express';
import { paramId } from '../../lib/params.js';
import {
  optionalAuth,
  requireAuth,
  requireRoles,
  type AuthedRequest,
} from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  createCourseSchema,
  createSessionSchema,
  listCoursesQuerySchema,
  updateCourseSchema,
  updateSessionSchema,
} from './courses.service.js';
import * as coursesService from './courses.service.js';

export const coursesRouter = Router();

coursesRouter.get(
  '/',
  optionalAuth,
  validate(listCoursesQuerySchema, 'query'),
  async (req: AuthedRequest, res, next) => {
    try {
      const result = await coursesService.listCourses(
        req.query as never,
        req.user ? { sub: req.user.sub, role: req.user.role } : undefined,
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

coursesRouter.get('/:id', optionalAuth, async (req: AuthedRequest, res, next) => {
  try {
    const data = await coursesService.getCourseById(
      paramId(req.params.id),
      req.user ? { sub: req.user.sub, role: req.user.role } : undefined,
    );
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

coursesRouter.post(
  '/:id/pause',
  requireAuth,
  requireRoles(Role.Tutor, Role.Admin, Role.InstituteAdmin),
  async (req: AuthedRequest, res, next) => {
    try {
      const data = await coursesService.setCourseStatus(
        paramId(req.params.id),
        req.user!.sub,
        req.user!.role,
        CourseStatus.Paused,
      );
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

coursesRouter.post(
  '/:id/archive',
  requireAuth,
  requireRoles(Role.Tutor, Role.Admin, Role.InstituteAdmin),
  async (req: AuthedRequest, res, next) => {
    try {
      const data = await coursesService.setCourseStatus(
        paramId(req.params.id),
        req.user!.sub,
        req.user!.role,
        CourseStatus.Archived,
      );
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

coursesRouter.get('/:id/sessions', optionalAuth, async (req: AuthedRequest, res, next) => {
  try {
    const data = await coursesService.listSessions(
      paramId(req.params.id),
      req.user ? { sub: req.user.sub, role: req.user.role } : undefined,
    );
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

coursesRouter.post(
  '/:id/sessions',
  requireAuth,
  requireRoles(Role.Tutor, Role.Admin, Role.InstituteAdmin),
  validate(createSessionSchema),
  async (req: AuthedRequest, res, next) => {
    try {
      const data = await coursesService.createSession(
        paramId(req.params.id),
        req.user!.sub,
        req.user!.role,
        req.body,
      );
      res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  },
);

coursesRouter.patch(
  '/:id/sessions/:sessionId',
  requireAuth,
  requireRoles(Role.Tutor, Role.Admin, Role.InstituteAdmin),
  validate(updateSessionSchema),
  async (req: AuthedRequest, res, next) => {
    try {
      const data = await coursesService.updateSession(
        paramId(req.params.id),
        paramId(req.params.sessionId),
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

coursesRouter.delete(
  '/:id/sessions/:sessionId',
  requireAuth,
  requireRoles(Role.Tutor, Role.Admin, Role.InstituteAdmin),
  async (req: AuthedRequest, res, next) => {
    try {
      const data = await coursesService.deleteSession(
        paramId(req.params.id),
        paramId(req.params.sessionId),
        req.user!.sub,
        req.user!.role,
      );
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);
