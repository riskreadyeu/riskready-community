import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");

const routeFiles = [
  "src/routes/index.tsx",
  "src/routes/dashboard-routes.tsx",
  "src/routes/settings-routes.tsx",
  "src/routes/risks-routes.tsx",
  "src/routes/controls-routes.tsx",
  "src/routes/policies-routes.tsx",
  "src/routes/audits-routes.tsx",
  "src/routes/incidents-routes.tsx",
  "src/routes/evidence-routes.tsx",
  "src/routes/itsm-routes.tsx",
  "src/routes/organisation-routes.tsx",
];

test("route modules exist for each app domain", async () => {
  await Promise.all(
    routeFiles.map(async (relativeFile) => {
      await assert.doesNotReject(() => access(path.join(webRoot, relativeFile)));
    }),
  );
});

test("App delegates authenticated routes to route modules and wraps them in Suspense", async () => {
  const appSource = await readFile(path.join(webRoot, "src/App.tsx"), "utf8");

  assert.match(appSource, /Suspense/);
  assert.match(appSource, /from "\.\/routes"|from "@\/routes"/);
  assert.doesNotMatch(appSource, /Route path="\/risks"/);
  assert.doesNotMatch(appSource, /Route path="\/controls"/);
  assert.doesNotMatch(appSource, /Route path="\/policies"/);
  assert.doesNotMatch(appSource, /Route path="\/organisation"/);
});
