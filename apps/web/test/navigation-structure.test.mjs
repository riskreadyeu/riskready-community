import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");

test("navigation config exists for shell routing and sidebars", async () => {
  await assert.doesNotReject(() => access(path.join(webRoot, "src/lib/navigation.ts")));
});

test("app shell derives navigation from config instead of hardcoded route checks and demo profile data", async () => {
  const appShellSource = await readFile(path.join(webRoot, "src/components/app-shell.tsx"), "utf8");

  assert.match(appShellSource, /from "\@\/lib\/navigation"/);
  assert.doesNotMatch(appShellSource, /pathname\.startsWith\(/);
  assert.doesNotMatch(appShellSource, /John Doe/);
  assert.doesNotMatch(appShellSource, /Security Lead/);
  assert.doesNotMatch(appShellSource, /3 risks require attention based on recent activity patterns\./);
});
