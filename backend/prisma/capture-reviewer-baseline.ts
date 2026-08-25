// Snapshots reviewer-prof's CURRENT configuration(s) and assignment(s) as the
// permanent target the hourly reviewer-account reset restores to. Run this
// once after setting up the demo exactly how you want it, and again any time
// you update reviewer-prof's configuration and want that to become the new
// baseline.
//
// Usage: npm run reviewer:capture-baseline (mirrors seed:accounts)

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const profUsername = process.env.REVIEWER_PROF_USERNAME || 'reviewer-prof';
  const studentUsername = process.env.REVIEWER_STUDENT_USERNAME || 'reviewer-student';

  const [prof, student] = await Promise.all([
    prisma.user.findUnique({ where: { username: profUsername } }),
    prisma.user.findUnique({ where: { username: studentUsername } }),
  ]);

  if (!prof) {
    throw new Error(`No user found with username "${profUsername}". Run seed:accounts first.`);
  }

  const configs = await prisma.configuration.findMany({
    where: { instructorId: prof.id },
    include: {
      assignments: student ? { where: { students: { some: { studentId: student.id } } } } : false,
    },
  });

  const baselineConfigs = configs.map(config => ({
    name: config.name,
    scenario: config.scenario,
    studentGoals: JSON.parse(config.studentGoals as string),
    botGoals: JSON.parse(config.botGoals as string),
    studentConstraints: JSON.parse(config.studentConstraints as string),
    botConstraints: JSON.parse(config.botConstraints as string),
    botOpeningOffer: typeof config.botOpeningOffer === 'string' ? JSON.parse(config.botOpeningOffer) : (config.botOpeningOffer || []),
    rubric: typeof config.rubric === 'string' ? JSON.parse(config.rubric) : (config.rubric || []),
    botStrategy: config.botStrategy,
    temperament: config.temperament,
    difficulty: config.difficulty,
    timeLimit: config.timeLimit,
    personality: JSON.parse(config.personality as string),
    isActive: config.isActive,
    assignments: ((config as any).assignments || []).map((a: any) => ({
      name: a.name,
      description: a.description,
      assignmentType: a.assignmentType,
      theme: a.theme,
      availableFrom: a.availableFrom,
      availableUntil: a.availableUntil,
      deadline: a.deadline,
      isActive: a.isActive,
    })),
  }));

  await prisma.reviewerResetState.upsert({
    where: { id: 'singleton' },
    update: { baselineConfigs, lastResetAt: new Date() },
    create: { id: 'singleton', baselineConfigs, lastResetAt: new Date() },
  });

  console.log(`Captured ${baselineConfigs.length} configuration(s) as the reviewer baseline.`);
  baselineConfigs.forEach(c => console.log(`  - "${c.name}" (${c.assignments.length} assignment(s))`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
