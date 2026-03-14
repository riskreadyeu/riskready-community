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

test("api exposes shared server error parsing", async () => {
  const apiSource = await source("src/lib/api.ts");

  assert.match(apiSource, /export function getApiErrorMessage/);
  assert.match(apiSource, /getApiErrorMessage\(text,\s*`Request failed/);
});

test("app error helpers centralize logging and user notification", async () => {
  const appErrorsSource = await source("src/lib/app-errors.ts");

  assert.match(appErrorsSource, /toast\.error/);
  assert.match(appErrorsSource, /export function notifyError/);
  assert.match(appErrorsSource, /getApiErrorMessage/);
});

test("representative data hooks use the shared notifier for load failures", async () => {
  const controlsHook = await source("src/hooks/controls/useControlsLibrary.ts");
  const nonconformityHook = await source("src/hooks/audits/useNonconformityDetail.ts");

  assert.match(controlsHook, /notifyError/);
  assert.doesNotMatch(controlsHook, /logAppError/);

  assert.match(nonconformityHook, /notifyError/);
  assert.doesNotMatch(nonconformityHook, /logAppError/);
});

test("NonconformityDetailPage uses shared notifications instead of alert dialogs for failures", async () => {
  const nonconformityDetail = await source("src/pages/audits/NonconformityDetailPage.tsx");

  assert.match(nonconformityDetail, /notifyError/);
  assert.doesNotMatch(nonconformityDetail, /alert\(/);
});
