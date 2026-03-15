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

test("representative list and detail data hooks exist", async () => {
  await exists("src/hooks/controls/useControlsLibrary.ts");
  await exists("src/hooks/audits/useNonconformityDetail.ts");
  await exists("src/lib/app-errors.ts");
});

test("ControlsLibraryPage consumes a dedicated orchestration hook", async () => {
  const controlsLibrary = await source("src/pages/controls/controls-library/ControlsLibraryPage.tsx");

  assert.match(controlsLibrary, /useControlsLibrary/);
  assert.doesNotMatch(controlsLibrary, /const loadData = async/);
  assert.doesNotMatch(controlsLibrary, /getControls\(/);
  assert.doesNotMatch(controlsLibrary, /getControlStats\(/);
  assert.doesNotMatch(controlsLibrary, /console\.error/);
});

test("NonconformityDetailPage consumes a dedicated orchestration hook", async () => {
  const nonconformityDetail = await source("src/pages/audits/NonconformityDetailPage.tsx");

  assert.match(nonconformityDetail, /useNonconformityDetail/);
  assert.doesNotMatch(nonconformityDetail, /const loadData = async/);
  assert.doesNotMatch(nonconformityDetail, /getNonconformity\(/);
  assert.doesNotMatch(nonconformityDetail, /getUsers\(/);
  assert.doesNotMatch(nonconformityDetail, /console\.error/);
});
