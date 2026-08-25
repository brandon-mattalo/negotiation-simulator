// Creates the reviewer-prof/reviewer-student demo accounts used by the
// optional public one-click "/reviewer" login. Only run this if you want
// that page to work - see DEPLOYMENT.md, Part 7.
//
// Usage: npm run seed:reviewer-accounts
// Afterwards, set REVIEWER_PROF_PASSWORD / REVIEWER_STUDENT_PASSWORD on your
// server to the passwords printed below.

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

function generatePassword(length = 8): string {
  const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let password = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

async function main() {
  const profUsername = process.env.REVIEWER_PROF_USERNAME || 'reviewer-prof';
  const studentUsername = process.env.REVIEWER_STUDENT_USERNAME || 'reviewer-student';

  let reviewerProf = await prisma.user.findUnique({ where: { username: profUsername } });
  if (!reviewerProf) {
    const password = generatePassword();
    reviewerProf = await prisma.user.create({
      data: { username: profUsername, passwordHash: await bcrypt.hash(password, SALT_ROUNDS), role: 'instructor' },
    });
    console.log(`Created ${profUsername} with password: ${password}`);
  } else {
    console.log(`${profUsername} already exists (id: ${reviewerProf.id})`);
  }

  let reviewerStudent = await prisma.user.findUnique({ where: { username: studentUsername } });
  if (!reviewerStudent) {
    const password = generatePassword();
    reviewerStudent = await prisma.user.create({
      data: { username: studentUsername, passwordHash: await bcrypt.hash(password, SALT_ROUNDS), role: 'student' },
    });
    console.log(`Created ${studentUsername} with password: ${password}`);
  } else {
    console.log(`${studentUsername} already exists (id: ${reviewerStudent.id})`);
  }

  const enrollment = await prisma.enrollment.findUnique({ where: { studentId: reviewerStudent.id } });
  if (!enrollment) {
    await prisma.enrollment.create({ data: { instructorId: reviewerProf.id, studentId: reviewerStudent.id } });
  }

  console.log('\nSet REVIEWER_PROF_PASSWORD / REVIEWER_STUDENT_PASSWORD on your server to the passwords printed above.');
  console.log('(Only shown once - if you lose them, delete these two accounts from the database and re-run this script.)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
