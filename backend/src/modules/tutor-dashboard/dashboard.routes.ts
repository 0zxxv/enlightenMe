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
        course: {
          select: {
            id: true,
            title: true,
            titleAr: true,
            courseCode: true,
            format: true,
            imageUrl: true,
          },
        },
        bookings: {
          where: {
            status: {
              in: [BookingStatus.Pending, BookingStatus.Confirmed, BookingStatus.Completed],
            },
          },
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
            payment: { select: { status: true } },
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
      select: {
        amount: true,
        currency: true,
        paidAt: true,
        booking: {
          select: {
            id: true,
            course: { select: { id: true, title: true } },
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { paidAt: 'desc' },
      take: 50,
    });

    const pendingPayments = await prisma.payment.findMany({
      where: {
        status: { in: [PaymentStatus.Pending, PaymentStatus.Processing] },
        booking: {
          course: { tutorId },
          status: { in: [BookingStatus.Pending, BookingStatus.Confirmed] },
        },
      },
      select: { amount: true },
    });

    const pendingUnpaidBookings = await prisma.booking.findMany({
      where: {
        course: { tutorId },
        status: BookingStatus.Pending,
        payment: null,
      },
      select: { priceSnapshot: true },
    });

    const paidTotal = paid.reduce((sum, p) => sum + Number(p.amount), 0);
    const pendingPaymentAmount =
      pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0) +
      pendingUnpaidBookings.reduce((sum, b) => sum + Number(b.priceSnapshot), 0);

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
        paidTotal,
        paidCount: paid.length,
        /** Bookings awaiting payment completion (honest stub state). */
        pendingPaymentAmount,
        /** Tutor payouts not yet disbursed. */
        pendingPayoutAmount: Number(pendingPayouts._sum.amount ?? 0),
        recent: paid.map((p) => ({
          amount: Number(p.amount),
          currency: p.currency,
          paidAt: p.paidAt,
          bookingId: p.booking.id,
          courseTitle: p.booking.course.title,
          studentName: `${p.booking.user.firstName} ${p.booking.user.lastName}`.trim(),
          status: 'Paid',
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});

tutorDashboardRouter.get('/courses', async (req: AuthedRequest, res, next) => {
  try {
    const now = new Date();
    const data = await prisma.course.findMany({
      where: { tutorId: req.user!.sub },
      include: {
        category: true,
        sessions: {
          where: { status: 'Scheduled', startsAt: { gte: now } },
          orderBy: { startsAt: 'asc' },
          take: 1,
        },
        _count: {
          select: {
            bookings: {
              where: {
                status: {
                  in: [BookingStatus.Pending, BookingStatus.Confirmed, BookingStatus.Completed],
                },
              },
            },
            sessions: true,
          },
        },
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
        status: {
          in: [BookingStatus.Confirmed, BookingStatus.Completed, BookingStatus.Pending],
        },
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        course: { select: { id: true, title: true, format: true } },
        session: true,
        payment: { select: { status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const byStudent = new Map<
      string,
      {
        user: (typeof bookings)[number]['user'];
        bookings: typeof bookings;
        bookingCount: number;
        upcomingSession: (typeof bookings)[number]['session'] | null;
      }
    >();

    const now = new Date();
    for (const booking of bookings) {
      const entry = byStudent.get(booking.userId) ?? {
        user: booking.user,
        bookings: [],
        bookingCount: 0,
        upcomingSession: null,
      };
      entry.bookings.push(booking);
      entry.bookingCount += 1;
      if (
        booking.session.startsAt >= now &&
        (!entry.upcomingSession || booking.session.startsAt < entry.upcomingSession.startsAt)
      ) {
        entry.upcomingSession = booking.session;
      }
      byStudent.set(booking.userId, entry);
    }

    res.json({ data: Array.from(byStudent.values()) });
  } catch (err) {
    next(err);
  }
});

tutorDashboardRouter.get('/verification', async (req: AuthedRequest, res, next) => {
  try {
    const profile = await prisma.tutorProfile.findUnique({
      where: { userId: req.user!.sub },
    });
    res.json({
      data: {
        verificationStatus: profile?.verificationStatus ?? 'Unverified',
        bio: profile?.bio ?? null,
        expertise: profile?.expertise ?? [],
        ratingAvg: profile?.ratingAvg ?? 0,
        ratingCount: profile?.ratingCount ?? 0,
        studentCount: profile?.studentCount ?? 0,
        courseCount: profile?.courseCount ?? 0,
      },
    });
  } catch (err) {
    next(err);
  }
});
