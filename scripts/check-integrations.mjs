import { getEditorialPlannerReadiness, getSocialReportingReadiness } from "../src/server/modules/integrationReadiness.mjs";

const [socialReporting, editorialPlanner] = await Promise.all([
  getSocialReportingReadiness(),
  getEditorialPlannerReadiness(),
]);

const results = [socialReporting, editorialPlanner];
let failures = 0;

for (const item of results) {
  const line = `${item.toolName}: ${item.status} - ${item.message}`;
  if (item.status !== "ready") {
    failures += 1;
    process.stderr.write(`${line}\n`);
  } else {
    process.stdout.write(`${line}\n`);
  }
}

if (failures > 0) {
  process.stderr.write(`\n${failures} Integration(en) sind noch nicht bereit.\n`);
  process.exit(1);
}

process.stdout.write("\nAlle externen Tool-Integrationen sind betriebsbereit.\n");
