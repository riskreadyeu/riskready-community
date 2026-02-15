-- CreateTable
CREATE TABLE "AppetiteMultiplier" (
    "id" TEXT NOT NULL,
    "appetiteLevel" TEXT NOT NULL,
    "multiplier" DECIMAL(3,2) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppetiteMultiplier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppetiteMultiplier_appetiteLevel_key" ON "AppetiteMultiplier"("appetiteLevel");
