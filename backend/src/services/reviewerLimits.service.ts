import { PrismaClient } from '@prisma/client';
import { Message } from '../types/negotiation';
import { sessionService } from './session.service';

const prisma = new PrismaClient();

// The public "/reviewer" login shares reviewer-student across every visitor.
// These checks bound its worst-case Anthropic/ElevenLabs cost and keep an
// abandoned session from blocking the next visitor - scoped ONLY to this one
// account by username, so real students are never affected.

export function isReviewerStudentUsername(username: string): boolean {
  return username === (process.env.REVIEWER_STUDENT_USERNAME || 'reviewer-student');
}

interface LimitResult {
  allowed: boolean;
  reason?: string;
}

export const reviewerLimitsService = {
  // Frees up this visitor's own "one active session" slot if their session
  // has had no activity for a while - i.e. they closed the tab without
  // ending it. Scoped to ipScope so it never touches a DIFFERENT visitor's
  // still-active session, now that reviewer-student supports concurrent
  // sessions across different IPs.
  async reapIdleSessionIfAny(studentId: string, ipScope?: string): Promise<void> {
    try {
      const active = await prisma.session.findFirst({
        where: { studentId, isActive: true, ...(ipScope ? { ipAddress: ipScope } : {}) },
      });
      if (!active) return;

      const idleMinutes = Number(process.env.REVIEWER_SESSION_IDLE_TIMEOUT_MINUTES) || 15;
      const idleMs = Date.now() - active.updatedAt.getTime();
      if (idleMs > idleMinutes * 60 * 1000) {
        await sessionService.cancelSession(active.id, studentId);
      }
    } catch (err) {
      console.error('reviewerLimitsService.reapIdleSessionIfAny failed:', err);
    }
  },

  async checkSessionStartLimit(studentId: string): Promise<LimitResult> {
    const max = Number(process.env.REVIEWER_STUDENT_MAX_SESSIONS_PER_HOUR) || 10;
    const cutoff = new Date(Date.now() - 60 * 60 * 1000);
    const count = await prisma.session.count({
      where: { studentId, createdAt: { gte: cutoff } },
    });

    if (count >= max) {
      return {
        allowed: false,
        reason: 'This public demo account has reached its usage limit for now. Please try again in a little while.',
      };
    }
    return { allowed: true };
  },

  checkMessageLimit(messages: Message[]): LimitResult {
    const max = Number(process.env.REVIEWER_STUDENT_MAX_MESSAGES_PER_SESSION) || 20;
    const studentTurns = messages.filter(m => m.role === 'student').length;

    if (studentTurns >= max) {
      return {
        allowed: false,
        reason: 'This demo negotiation has reached its message limit. Please end the session or start a new one.',
      };
    }
    return { allowed: true };
  },
};
