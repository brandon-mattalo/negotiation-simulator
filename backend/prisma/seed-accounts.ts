import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

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
  const csvRows: string[] = ['username,password,role,professor'];

  // --- Find or create the main instructor account ---
  let instructor = await prisma.user.findUnique({
    where: { username: 'instructor' },
  });

  if (!instructor) {
    const instructorPassword = generatePassword();
    instructor = await prisma.user.create({
      data: {
        username: 'instructor',
        passwordHash: await bcrypt.hash(instructorPassword, SALT_ROUNDS),
        role: 'instructor',
      },
    });
    csvRows.push(`instructor,${instructorPassword},instructor,`);
    console.log(`Created instructor account with password: ${instructorPassword}`);
  } else {
    console.log(`Instructor account already exists (id: ${instructor.id})`);
  }

  // --- Create 81 student accounts enrolled under the instructor ---
  for (let i = 1; i <= 81; i++) {
    const username = `student${i}`;
    const existing = await prisma.user.findUnique({ where: { username } });

    if (existing) {
      // Ensure enrollment exists
      const enrollment = await prisma.enrollment.findUnique({
        where: { studentId: existing.id },
      });
      if (!enrollment) {
        await prisma.enrollment.create({
          data: { instructorId: instructor.id, studentId: existing.id },
        });
      }
      console.log(`Student ${username} already exists, skipping`);
      continue;
    }

    const password = generatePassword();
    const student = await prisma.user.create({
      data: {
        username,
        passwordHash: await bcrypt.hash(password, SALT_ROUNDS),
        role: 'student',
      },
    });

    await prisma.enrollment.create({
      data: { instructorId: instructor.id, studentId: student.id },
    });

    csvRows.push(`${username},${password},student,instructor`);
    console.log(`Created ${username}`);
  }

  // --- Create reviewer professor + student pair ---
  let reviewerProf = await prisma.user.findUnique({
    where: { username: 'reviewer-prof' },
  });

  if (!reviewerProf) {
    const reviewerProfPassword = generatePassword();
    reviewerProf = await prisma.user.create({
      data: {
        username: 'reviewer-prof',
        passwordHash: await bcrypt.hash(reviewerProfPassword, SALT_ROUNDS),
        role: 'instructor',
      },
    });
    csvRows.push(`reviewer-prof,${reviewerProfPassword},instructor,`);
    console.log(`Created reviewer-prof with password: ${reviewerProfPassword}`);
  } else {
    console.log(`reviewer-prof already exists (id: ${reviewerProf.id})`);
  }

  let reviewerStudent = await prisma.user.findUnique({
    where: { username: 'reviewer-student' },
  });

  if (!reviewerStudent) {
    const reviewerStudentPassword = generatePassword();
    reviewerStudent = await prisma.user.create({
      data: {
        username: 'reviewer-student',
        passwordHash: await bcrypt.hash(reviewerStudentPassword, SALT_ROUNDS),
        role: 'student',
      },
    });
    csvRows.push(`reviewer-student,${reviewerStudentPassword},student,reviewer-prof`);
    console.log(`Created reviewer-student with password: ${reviewerStudentPassword}`);
  } else {
    console.log(`reviewer-student already exists (id: ${reviewerStudent.id})`);
  }

  // Ensure reviewer enrollment
  const reviewerEnrollment = await prisma.enrollment.findUnique({
    where: { studentId: reviewerStudent.id },
  });
  if (!reviewerEnrollment) {
    await prisma.enrollment.create({
      data: { instructorId: reviewerProf.id, studentId: reviewerStudent.id },
    });
  }

  // --- Write CSV ---
  const csvPath = path.join(__dirname, 'accounts.csv');
  fs.writeFileSync(csvPath, csvRows.join('\n') + '\n');
  console.log(`\nAccount credentials written to: ${csvPath}`);
  console.log(`Total new accounts in CSV: ${csvRows.length - 1}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
