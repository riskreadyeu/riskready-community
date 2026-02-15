-- CreateIndex
CREATE INDEX "AuditEvent_entityType_entityId_idx" ON "AuditEvent"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "BCMProgram_policyDocumentId_idx" ON "BCMProgram"("policyDocumentId");

-- CreateIndex
CREATE INDEX "BCMTestExercise_facilitatorId_idx" ON "BCMTestExercise"("facilitatorId");

-- CreateIndex
CREATE INDEX "BCMTestFinding_nonconformityId_idx" ON "BCMTestFinding"("nonconformityId");

-- CreateIndex
CREATE INDEX "ContinuityPlan_policyDocumentId_idx" ON "ContinuityPlan"("policyDocumentId");

-- CreateIndex
CREATE INDEX "ContinuityPlan_approvedById_idx" ON "ContinuityPlan"("approvedById");

-- CreateIndex
CREATE INDEX "ControlLayer_alternateOwnerId_idx" ON "ControlLayer"("alternateOwnerId");

-- CreateIndex
CREATE INDEX "Nonconformity_sourceReferenceId_idx" ON "Nonconformity"("sourceReferenceId");

-- CreateIndex
CREATE INDEX "Nonconformity_verifiedById_idx" ON "Nonconformity"("verifiedById");

-- CreateIndex
CREATE INDEX "Nonconformity_closedById_idx" ON "Nonconformity"("closedById");

-- CreateIndex
CREATE INDEX "Nonconformity_raisedById_idx" ON "Nonconformity"("raisedById");
