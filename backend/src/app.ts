import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler } from './lib/errors.js';
import { adminRouter } from './modules/admin/admin.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { bookingsRouter } from './modules/bookings/bookings.routes.js';
import { coursesRouter } from './modules/courses/courses.routes.js';
import { favoritesRouter } from './modules/favorites/favorites.routes.js';
import { healthRouter } from './modules/health/health.routes.js';
import { institutesRouter } from './modules/institutes/institutes.routes.js';
import { messagesRouter } from './modules/messages/messages.routes.js';
import { paymentsRouter } from './modules/payments/payments.routes.js';
import { reviewsRouter } from './modules/reviews/reviews.routes.js';
import { tutorDashboardRouter } from './modules/tutor-dashboard/dashboard.routes.js';
import { tutorsRouter } from './modules/tutors/tutors.routes.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',').map((s) => s.trim()),
      credentials: true,
    }),
  );
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  const api = express.Router();
  api.use('/health', healthRouter);
  api.use('/auth', authRouter);
  api.use('/courses', coursesRouter);
  api.use('/tutors', tutorsRouter);
  api.use('/institutes', institutesRouter);
  api.use('/bookings', bookingsRouter);
  api.use('/payments', paymentsRouter);
  api.use('/reviews', reviewsRouter);
  api.use('/favorites', favoritesRouter);
  api.use('/messages', messagesRouter);
  api.use('/admin', adminRouter);
  api.use('/tutor/dashboard', tutorDashboardRouter);

  app.use('/api/v1', api);

  app.use(errorHandler);

  return app;
}
