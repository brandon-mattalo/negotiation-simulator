// Creates a single instructor account so you have somewhere to log in for
// the first time on a fresh deployment. There's no public sign-up page by
// design - after this, further accounts (always anonymous students) are
// created from the Students page once you're logged in.
//
// Usage: npm run create-instructor
// Optionally set INSTRUCTOR_USERNAME / INSTRUCTOR_PASSWORD to choose your
// own; otherwise a username of "instructor" and a random password are used.

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

function generatePassword(length = 12): string {
  const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let password = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

async function main() {
  const username = process.env.INSTRUCTOR_USERNAME || 'instructor';

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    console.log(`An account named "${username}" already exists - nothing to do.`);
    return;
  }

  const password = process.env.INSTRUCTOR_PASSWORD || generatePassword();

  await prisma.user.create({
    data: {
      username,
      passwordHash: await bcrypt.hash(password, SALT_ROUNDS),
      role: 'instructor',
      isAdmin: true,
    },
  });

  console.log('Created instructor account (admin):');
  console.log(`  username: ${username}`);
  console.log(`  password: ${password}`);
  console.log('\nLog in with these at your app\'s /login page. Add student accounts from the Students page, and colleague instructor accounts from the Instructors page, once you\'re in.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
