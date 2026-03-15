import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");

async function source(relativePath) {
  return readFile(path.join(webRoot, relativePath), "utf8");
}

test("common exports mark overlapping page composition helpers as legacy", async () => {
  const commonIndex = await source("src/components/common/index.ts");

  assert.match(commonIndex, /Legacy page composition helpers/);
  assert.match(commonIndex, /DetailPageLayout/);
});

test("representative list pages use archer ListPageLayout instead of PageHeader wrappers", async () => {
  const controlsLibrary = await source("src/pages/controls/controls-library/ControlsLibraryPage.tsx");
  const policyDocumentList = await source("src/pages/policies/PolicyDocumentListPage.tsx");

  assert.match(controlsLibrary, /ListPageLayout/);
  assert.doesNotMatch(controlsLibrary, /<PageHeader/);

  assert.match(policyDocumentList, /ListPageLayout/);
  assert.doesNotMatch(policyDocumentList, /<PageHeader/);
});
