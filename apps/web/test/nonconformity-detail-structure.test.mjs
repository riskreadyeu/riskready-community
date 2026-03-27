import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");

async function source(relativePath) {
  return readFile(path.join(webRoot, relativePath), "utf8");
}

async function exists(relativePath) {
  await access(path.join(webRoot, relativePath));
}

test("nonconformity detail components exist", async () => {
  await exists("src/components/audits/nonconformity-detail/NonconformityDetailHeader.tsx");
  await exists("src/components/audits/nonconformity-detail/NonconformityCapStatusBanners.tsx");
  await exists("src/components/audits/nonconformity-detail/NonconformityCapPlanCard.tsx");
});

test("nonconformity detail hook owns orchestration and action handlers", async () => {
  const hookSource = await source("src/hooks/audits/useNonconformityDetail.ts");

  assert.match(hookSource, /closeNonconformity/);
  assert.match(hookSource, /saveCapDraft/);
  assert.match(hookSource, /submitCapForApproval/);
  assert.match(hookSource, /approveCap/);
  assert.match(hookSource, /rejectCap/);
  assert.match(hookSource, /markCapNotRequired/);
  assert.match(hookSource, /handleClose/);
  assert.match(hookSource, /handleSaveCapDraft/);
  assert.match(hookSource, /handleSubmitForApproval/);
  assert.match(hookSource, /handleApproveCap/);
  assert.match(hookSource, /handleRejectCap/);
  assert.match(hookSource, /handleSkipCap/);
});

test("NonconformityDetailPage is reduced to a coordinator over extracted modules", async () => {
  const pageSource = await source("src/pages/audits/NonconformityDetailPage.tsx");

  assert.match(pageSource, /useNonconformityDetail/);
  assert.match(pageSource, /NonconformityDetailHeader/);
  assert.match(pageSource, /NonconformityCapStatusBanners/);
  assert.match(pageSource, /NonconformityCapPlanCard/);

  assert.doesNotMatch(pageSource, /const handleClose = async/);
  assert.doesNotMatch(pageSource, /const handleSaveCapDraft = async/);
  assert.doesNotMatch(pageSource, /const handleSubmitForApproval = async/);
  assert.doesNotMatch(pageSource, /const handleApproveCap = async/);
  assert.doesNotMatch(pageSource, /const handleRejectCap = async/);
  assert.doesNotMatch(pageSource, /const handleSkipCap = async/);
  assert.doesNotMatch(pageSource, /closeNonconformity\(/);
  assert.doesNotMatch(pageSource, /saveCapDraft\(/);
  assert.doesNotMatch(pageSource, /submitCapForApproval\(/);
  assert.doesNotMatch(pageSource, /approveCap\(/);
  assert.doesNotMatch(pageSource, /rejectCap\(/);
  assert.doesNotMatch(pageSource, /markCapNotRequired\(/);
});
