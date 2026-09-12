import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../../lib/errors.js';
import { paramId } from '../../lib/params.js';
import { prisma } from '../../lib/prisma.js';
import { requireAuth, type AuthedRequest } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';

const sendMessageSchema = z.object({
  recipientId: z.string().uuid(),
  body: z.string().min(1).max(5000),
});

async function assertBookingRelationship(userA: string, userB: string) {
  const related = await prisma.booking.findFirst({
    where: {
      OR: [
        {
          userId: userA,
          course: { tutorId: userB },
        },
        {
          userId: userB,
          course: { tutorId: userA },
        },
      ],
    },
  });
  if (!related) {
    throw new AppError(
      'FORBIDDEN',
      'Messaging is only allowed between users with a booking relationship',
      403,
    );
  }
}

export const messagesRouter = Router();

messagesRouter.use(requireAuth);

messagesRouter.get('/conversations', async (req: AuthedRequest, res, next) => {
  try {
    const userId = req.user!.sub;
    const participations = await prisma.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: {
                  select: { id: true, firstName: true, lastName: true, role: true },
                },
              },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { conversation: { updatedAt: 'desc' } },
    });
    res.json({
      data: participations.map((p) => p.conversation),
    });
  } catch (err) {
    next(err);
  }
});

messagesRouter.get('/conversations/:id', async (req: AuthedRequest, res, next) => {
  try {
    const conversationId = paramId(req.params.id);
    const membership = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: req.user!.sub,
        },
      },
    });
    if (!membership) {
      throw new AppError('FORBIDDEN', 'Not a participant of this conversation', 403);
    }
    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ data: messages });
  } catch (err) {
    next(err);
  }
});

messagesRouter.post('/send', validate(sendMessageSchema), async (req: AuthedRequest, res, next) => {
  try {
    const senderId = req.user!.sub;
    const { recipientId, body } = req.body as z.infer<typeof sendMessageSchema>;
    if (senderId === recipientId) {
      throw new AppError('INVALID_REQUEST', 'Cannot message yourself', 400);
    }

    await assertBookingRelationship(senderId, recipientId);

    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: senderId } } },
          { participants: { some: { userId: recipientId } } },
        ],
      },
    });

    const conversation =
      existing ??
      (await prisma.conversation.create({
        data: {
          participants: {
            create: [{ userId: senderId }, { userId: recipientId }],
          },
        },
      }));

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId,
        body,
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    res.status(201).json({ data: { conversationId: conversation.id, message } });
  } catch (err) {
    next(err);
  }
});
