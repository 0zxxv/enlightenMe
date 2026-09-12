import { BookingStatus, PaymentStatus, Role } from '@prisma/client';
import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { requireAuth, requireRoles, type AuthedRequest } from '../../middleware/auth.js';

export const tutorDashboardRouter = Router();

tutorDashboardRouter.use(requireAuth, requireRoles(Role.Tutor, Role.Admin));

tutorDashboardRouter.get('/upcoming', async (req: AuthedRequest, res, next) => {
  try {
    const tutorId = req.user!.sub;
    const now = new Date();
    const data = await prisma.courseSession.findMany({
      where: {
        startsAt: { gte: now },
        status: 'Scheduled',
        course: { tutorId },
      },
      include: {
        course: { select: { id: true, title: true, courseCode: true } },
        bookings: {
          where: { status: { in: [BookingStatus.Pending, BookingStatus.Confirmed] } },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
      },
      orderBy: { startsAt: 'asc' },
      take: 50,
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

tutorDashboardRouter.get('/earnings', async (req: AuthedRequest, res, next) => {
  try {
    const tutorId = req.user!.sub;
    const paid = await prisma.payment.findMany({
      where: {
        status: PaymentStatus.Paid,
        booking: { course: { tutorId } },
      },
      select: { amount: true, currency: true, paidAt: true },
    });

    const total = paid.reduce((sum, p) => sum + Number(p.amount), 0);
    const pendingPayouts = await prisma.payout.aggregate({
      where: {
        tutor: { userId: tutorId },
        status: { in: ['Pending', 'Processing'] },
      },
      _sum: { amount: true },
    });

    res.json({
      data: {
        currency: 'BHD',
        paidTotal: total,
        paidCount: paid.length,
        pendingPayoutAmount: Number(pendingPayouts._sum.amount ?? 0),
      },
    });
  } catch (err) {
    next(err);
  }
});

tutorDashboardRouter.get('/courses', async (req: AuthedRequest, res, next) => {
  try {
    const data = await prisma.course.findMany({
      where: { tutorId: req.user!.sub },
      include: {
        category: true,
        _count: { select: { bookings: true, sessions: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

tutorDashboardRouter.get('/students', async (req: AuthedRequest, res, next) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        course: { tutorId: req.user!.sub },
        status: { in: [BookingStatus.Confirmed, BookingStatus.Completed, BookingStatus.Pending] },
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
        course: { select: { id: true, title: true } },
        session: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const byStudent = new Map<
      string,
      {
        user: (typeof bookings)[number]['user'];
        bookings: typeof bookings;
      }
    >();
    for (const booking of bookings) {
      const entry = byStudent.get(booking.userId) ?? { user: booking.user, bookings: [] };
      entry.bookings.push(booking);
      byStudent.set(booking.userId, entry);
    }

    res.json({ data: Array.from(byStudent.values()) });
  } catch (err) {
    next(err);
  }
});
