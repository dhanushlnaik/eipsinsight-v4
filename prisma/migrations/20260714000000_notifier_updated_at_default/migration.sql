-- The scheduler writes notification_outbox / notifier_checkpoint with the raw `pg` driver,
-- not Prisma. Prisma's @updatedAt is a client-side feature and emits no database default,
-- so those raw INSERTs supplied no updated_at and tripped the NOT NULL constraint:
--   "null value in column \"updated_at\" of relation \"notification_outbox\"
--    violates not-null constraint"  (Proposal Status Notifier, 2026-07-14)
-- Giving the columns a DB-level default makes them safe for any writer, Prisma or raw SQL.

-- AlterTable
ALTER TABLE "notification_outbox" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "notifier_checkpoint" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
