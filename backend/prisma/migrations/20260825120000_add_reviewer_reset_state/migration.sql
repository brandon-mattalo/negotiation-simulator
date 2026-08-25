-- CreateTable
CREATE TABLE "reviewer_reset_state" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "last_reset_at" TIMESTAMP(3),
    "baseline_configs" JSONB,

    CONSTRAINT "reviewer_reset_state_pkey" PRIMARY KEY ("id")
);
