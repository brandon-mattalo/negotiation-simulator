-- CreateTable
CREATE TABLE "classes" (
    "id" TEXT NOT NULL,
    "instructor_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "classes_instructor_id_idx" ON "classes"("instructor_id");

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: add class_id (nullable = Unassigned, every existing row lands here)
ALTER TABLE "enrollments" ADD COLUMN "class_id" TEXT;

-- CreateIndex
CREATE INDEX "enrollments_class_id_idx" ON "enrollments"("class_id");

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: add updated_at as nullable, backfill from created_at, then enforce NOT NULL
ALTER TABLE "enrollments" ADD COLUMN "updated_at" TIMESTAMP(3);
UPDATE "enrollments" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;
ALTER TABLE "enrollments" ALTER COLUMN "updated_at" SET NOT NULL;
