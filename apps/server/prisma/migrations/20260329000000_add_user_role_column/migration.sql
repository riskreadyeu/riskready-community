-- AlterTable
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'USER';

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- Seed known admin users
UPDATE "User" SET "role" = 'ADMIN' WHERE "email" IN ('admin@riskready.com', 'admin@local.test');
