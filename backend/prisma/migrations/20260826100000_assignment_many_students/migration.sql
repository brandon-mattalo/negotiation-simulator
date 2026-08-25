-- CreateTable
CREATE TABLE "assignment_students" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assignment_students_pkey" PRIMARY KEY ("id")
);

-- Backfill: one membership row per existing assignment's current student.
-- Reusing the assignment's own id as the membership row's id is safe here
-- (each assignment currently has exactly one student, so it's trivially
-- unique) and avoids depending on any UUID-generation extension.
INSERT INTO "assignment_students" ("id", "assignment_id", "student_id", "created_at")
SELECT "id", "id", "student_id", "created_at" FROM "assignments";

-- CreateIndex
CREATE UNIQUE INDEX "assignment_students_assignment_id_student_id_key" ON "assignment_students"("assignment_id", "student_id");

-- AddForeignKey
ALTER TABLE "assignment_students" ADD CONSTRAINT "assignment_students_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_students" ADD CONSTRAINT "assignment_students_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropForeignKey
ALTER TABLE "assignments" DROP CONSTRAINT "assignments_student_id_fkey";

-- AlterTable
ALTER TABLE "assignments" DROP COLUMN "student_id";
