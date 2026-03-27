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

test("policy detail hook and extracted detail components exist", async () => {
  await exists("src/hooks/policies/usePolicyDocumentDetail.ts");
  await exists("src/components/policies/detail/PolicyDetailHeader.tsx");
  await exists("src/components/policies/detail/PolicyDetailActions.tsx");
  await exists("src/components/policies/detail/PolicyReviewDialog.tsx");
  await exists("src/components/policies/detail/PolicyApprovalDialog.tsx");
});

test("PolicyDocumentDetailPage is a coordinator over extracted detail modules", async () => {
  const detailPage = await source("src/pages/policies/PolicyDocumentDetailPage.tsx");

  assert.match(detailPage, /usePolicyDocumentDetail/);
  assert.match(detailPage, /PolicyDetailHeader/);
  assert.match(detailPage, /PolicyDetailActions/);
  assert.match(detailPage, /PolicyReviewDialog/);
  assert.match(detailPage, /PolicyApprovalDialog/);

  assert.doesNotMatch(detailPage, /const loadDocument = async/);
  assert.doesNotMatch(detailPage, /const handleSubmitReview = async/);
  assert.doesNotMatch(detailPage, /const handleSubmitForApproval = async/);
  assert.doesNotMatch(detailPage, /const openApprovalDialog = async/);
  assert.doesNotMatch(detailPage, /const addWorkflowStep = \(\) =>/);
  assert.doesNotMatch(detailPage, /const removeWorkflowStep = \(index: number\) =>/);
  assert.doesNotMatch(detailPage, /const updateWorkflowStep = \(index: number, field: string, value: string\) =>/);
  assert.doesNotMatch(detailPage, /createReview\(/);
  assert.doesNotMatch(detailPage, /createWorkflow\(/);
  assert.doesNotMatch(detailPage, /getDefaultWorkflowByDocumentType\(/);
});
