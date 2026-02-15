-- CreateTable
CREATE TABLE "GatewayConfig" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "anthropicApiKey" TEXT,
    "agentModel" TEXT NOT NULL DEFAULT 'claude-haiku-4-5-20251001',
    "gatewayUrl" TEXT NOT NULL DEFAULT 'http://localhost:3100',
    "maxAgentTurns" INTEGER NOT NULL DEFAULT 25,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GatewayConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GatewayConfig_organisationId_key" ON "GatewayConfig"("organisationId");

-- CreateIndex
CREATE INDEX "GatewayConfig_organisationId_idx" ON "GatewayConfig"("organisationId");
