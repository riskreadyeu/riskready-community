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

test("incident detail hook and extracted detail components exist", async () => {
  await exists("src/hooks/incidents/useIncidentDetail.ts");
  await exists("src/components/incidents/detail/IncidentDetailHeader.tsx");
  await exists("src/components/incidents/detail/IncidentRegulatoryAlerts.tsx");
  await exists("src/components/incidents/detail/IncidentSidebarPanels.tsx");
});

test("IncidentDetailPage is reduced to a coordinator over extracted incident detail modules", async () => {
  const detailPage = await source("src/pages/incidents/IncidentDetailPage.tsx");

  assert.match(detailPage, /useIncidentDetail/);
  assert.match(detailPage, /IncidentDetailHeader/);
  assert.match(detailPage, /IncidentRegulatoryAlerts/);
  assert.match(detailPage, /IncidentSidebarPanels/);

  assert.doesNotMatch(detailPage, /const loadData = async/);
  assert.doesNotMatch(detailPage, /function SeverityBadge/);
  assert.doesNotMatch(detailPage, /function StatusBadge/);
  assert.doesNotMatch(detailPage, /function InfoRow/);
  assert.doesNotMatch(detailPage, /getIncident\(/);
  assert.doesNotMatch(detailPage, /getIncidentTimeline\(/);
  assert.doesNotMatch(detailPage, /getIncidentEvidence\(/);
  assert.doesNotMatch(detailPage, /getIncidentCommunications\(/);
  assert.doesNotMatch(detailPage, /getIncidentLessonsLearned\(/);
  assert.doesNotMatch(detailPage, /getIncidentNotifications\(/);
});
