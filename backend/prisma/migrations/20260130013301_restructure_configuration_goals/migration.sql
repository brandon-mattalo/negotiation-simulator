/*
  Warnings:

  - You are about to drop the column `context` on the `configurations` table. All the data in the column will be lost.
  - You are about to drop the column `success_criteria` on the `configurations` table. All the data in the column will be lost.
  - Added the required column `bot_constraints` to the `configurations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bot_goals` to the `configurations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `student_constraints` to the `configurations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `student_goals` to the `configurations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "configurations" DROP COLUMN "context",
DROP COLUMN "success_criteria",
ADD COLUMN     "bot_constraints" JSONB NOT NULL,
ADD COLUMN     "bot_goals" JSONB NOT NULL,
ADD COLUMN     "student_constraints" JSONB NOT NULL,
ADD COLUMN     "student_goals" JSONB NOT NULL;
