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

      // Write the marker first: a near-simultaneous second request then sees
      // the cooldown as already reset and skips, narrowing the race window.
      await prisma.reviewerResetState.update({
        where: { id: STATE_ID },
        data: { lastResetAt: new Date() },
      });

      const { professor, student } = reviewerUsernames();
      const [prof, stud] = await Promise.all([
        prisma.user.findUnique({ where: { username: professor } }),
        prisma.user.findUnique({ where: { username: student } }),
      ]);
      if (!prof) return;

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
