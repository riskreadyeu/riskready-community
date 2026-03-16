import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");

test("assistant route module, page, and api client exist", async () => {
  await Promise.all([
    access(path.join(webRoot, "src/routes/assistant-routes.tsx")),
    access(path.join(webRoot, "src/pages/AssistantPage.tsx")),
    access(path.join(webRoot, "src/lib/chat-api.ts")),
  ]);
});

test("assistant routes are registered in the authenticated app routes", async () => {
  const routesSource = await readFile(path.join(webRoot, "src/routes/index.tsx"), "utf8");

  assert.match(routesSource, /assistantRoutes/);
  assert.match(routesSource, /\.\.\.assistantRoutes/);
});

test("navigation exposes the assistant page to all users", async () => {
  const navigationSource = await readFile(path.join(webRoot, "src/lib/navigation.ts"), "utf8");

  assert.match(navigationSource, /title:\s*"Assistant"/);
  assert.match(navigationSource, /to:\s*"\/assistant"/);
});

test("assistant page uses chat api and live stream primitives", async () => {
  const pageSource = await readFile(path.join(webRoot, "src/pages/AssistantPage.tsx"), "utf8");

  assert.match(pageSource, /from "@\/lib\/chat-api"/);
  assert.match(pageSource, /EventSource/);
  assert.match(pageSource, /createConversation|sendMessage|listConversations/);
});

test("web entry does not depend on blocked external Google Fonts", async () => {
  const htmlSource = await readFile(path.join(webRoot, "index.html"), "utf8");

  assert.doesNotMatch(htmlSource, /fonts\.googleapis\.com/);
  assert.doesNotMatch(htmlSource, /fonts\.gstatic\.com/);
});
