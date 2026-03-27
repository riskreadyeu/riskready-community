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

test("main wraps App with AuthProvider", async () => {
  const mainSource = await source("src/main.tsx");

  assert.match(mainSource, /AuthProvider/);
  assert.match(mainSource, /<AuthProvider>\s*<App \/>\s*<\/AuthProvider>/s);
});

test("App consumes auth context instead of owning login state directly", async () => {
  const appSource = await source("src/App.tsx");

  assert.match(appSource, /useAuth/);
  assert.doesNotMatch(appSource, /from "\@\/lib\/api"/);
  assert.doesNotMatch(appSource, /const \[user, setUser\]/);
  assert.doesNotMatch(appSource, /const \[loading, setLoading\]/);
});

test("useCurrentUser delegates to AuthContext", async () => {
  const hookSource = await source("src/hooks/useCurrentUser.ts");

  assert.match(hookSource, /useAuth/);
  assert.doesNotMatch(hookSource, /getMe\(/);
});
