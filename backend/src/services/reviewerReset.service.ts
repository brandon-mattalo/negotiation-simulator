import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const STATE_ID = 'singleton';

function reviewerUsernames() {
  return {
    professor: process.env.REVIEWER_PROF_USERNAME || 'reviewer-prof',
    student: process.env.REVIEWER_STUDENT_USERNAME || 'reviewer-student',
  };
}

export const reviewerResetService = {
  // Called from authenticateToken on every authenticated request from
  // reviewer-prof or reviewer-student (browsing, reviewing a transcript,
  // editing a config - not just sending negotiation messages), so maybeReset
  // can tell "someone's around" apart from "nobody's touched this in a
  // while," not just "is a negotiation currently in progress."
  async touchActivity(username: string): Promise<void> {
    const { professor, student } = reviewerUsernames();
    if (username !== professor && username !== student) return;
    try {
      await prisma.reviewerResetState.upsert({
        where: { id: STATE_ID },
        update: { lastActivityAt: new Date() },
        create: { id: STATE_ID, lastActivityAt: new Date() },
      });
    } catch (err) {
      console.error('reviewerResetService.touchActivity failed:', err);
    }
  },

  // Called on every reviewerLogin (either role). No-ops unless a baseline has
  // been captured (via prisma/capture-reviewer-baseline.ts) and the cooldown
  // has elapsed - so a visitor's own edit-then-try flow in one sitting is
  // never wiped out mid-visit.
  async maybeReset(): Promise<void> {
    try {
      const state = await prisma.reviewerResetState.findUnique({ where: { id: STATE_ID } });
      if (!state || !state.baselineConfigs) return; // nothing captured yet

      const cooldownMs = (Number(process.env.REVIEWER_RESET_COOLDOWN_HOURS) || 1) * 60 * 60 * 1000;
      const dueForReset = !state.lastResetAt || Date.now() - state.lastResetAt.getTime() > cooldownMs;
      if (!dueForReset) return;

      // Defer if either account has done ANYTHING - not just sent a
      // negotiation message - in the last few minutes (e.g. the professor
      // hopping back in to read a transcript after the student session
      // already ended, which the active-session check below can't see).
      const quietMinutes = Number(process.env.REVIEWER_ACTIVITY_QUIET_MINUTES) || 5;
      if (state.lastActivityAt && Date.now() - state.lastActivityAt.getTime() < quietMinutes * 60 * 1000) {
        return; // recently active - defer the reset, don't touch lastResetAt
      }

      const { professor, student } = reviewerUsernames();
      const [prof, stud] = await Promise.all([
        prisma.user.findUnique({ where: { username: professor } }),
        prisma.user.findUnique({ where: { username: student } }),
      ]);
      if (!prof) return;

      // Being "due" only means the cooldown has elapsed - it doesn't mean
      // it's safe to wipe. reviewer-student can now hold multiple concurrent
      // active sessions (one per distinct visitor IP), so this checks ALL of
      // them, not just one - a reset must be safe for every visitor
      // currently negotiating, not merely whichever session happened to be
      // checked. Deliberately not IP-scoped, unlike the checks elsewhere: a
      // reset either proceeds (wiping everyone) or doesn't, there's no
      // per-visitor version of "safe to wipe." An abandoned-but-still-
      // "active" session doesn't need special handling - it gets cascaded
      // away along with everything else once the wipe below proceeds.
      if (stud) {
        const activeSessions = await prisma.session.findMany({
          where: { studentId: stud.id, isActive: true },
        });
        const idleMinutes = Number(process.env.REVIEWER_SESSION_IDLE_TIMEOUT_MINUTES) || 15;
        const idleMs = idleMinutes * 60 * 1000;
        const anyStillActive = activeSessions.some(s => Date.now() - s.updatedAt.getTime() <= idleMs);
        if (anyStillActive) {
          return; // at least one visitor's session is still in active use - defer
        }
      }

      // Write the marker now that we're actually proceeding: a near-
      // simultaneous second request then sees the cooldown as already reset
      // and skips, narrowing the race window.
      await prisma.reviewerResetState.update({
        where: { id: STATE_ID },
        data: { lastResetAt: new Date() },
      });

      // Cascades away every Session + Assignment created under reviewer-prof
      // (Configuration -> Session/Assignment are onDelete: Cascade).
      await prisma.configuration.deleteMany({ where: { instructorId: prof.id } });

      const baselineConfigs = state.baselineConfigs as any[];
      for (const snapshot of baselineConfigs) {
        const { assignments, ...configFields } = snapshot;
        const newConfig = await prisma.configuration.create({
          data: {
            instructorId: prof.id,
            name: configFields.name,
            scenario: configFields.scenario,
            studentGoals: JSON.stringify(configFields.studentGoals),
            botGoals: JSON.stringify(configFields.botGoals),
            studentConstraints: JSON.stringify(configFields.studentConstraints),
            botConstraints: JSON.stringify(configFields.botConstraints),
            botOpeningOffer: JSON.stringify(configFields.botOpeningOffer || []),
            rubric: JSON.stringify(configFields.rubric || []),
            botStrategy: configFields.botStrategy,
            temperament: configFields.temperament,
            difficulty: configFields.difficulty,
            timeLimit: configFields.timeLimit,
            personality: JSON.stringify(configFields.personality),
            isActive: configFields.isActive,
          },
        });

        if (stud && Array.isArray(assignments)) {
          for (const a of assignments) {
            await prisma.assignment.create({
              data: {
                instructorId: prof.id,
                configurationId: newConfig.id,
                name: a.name,
                description: a.description,
                assignmentType: a.assignmentType,
                theme: a.theme ?? undefined,
                availableFrom: new Date(a.availableFrom),
                availableUntil: new Date(a.availableUntil),
                deadline: new Date(a.deadline),
                isActive: a.isActive,
                students: {
                  create: [{ studentId: stud.id }],
                },
              },
            });
          }
        }
      }
    } catch (err) {
      // Never let a reset failure block an actual login.
      console.error('reviewerResetService.maybeReset failed:', err);
    }
  },
};
