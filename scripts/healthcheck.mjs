const port = process.env.PORT || 4173;
const url = process.env.DASHBOARD_HEALTHCHECK_URL || `http://localhost:${port}/api/health`;

try {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });
  const payload = await response.json();

  if (!response.ok || payload?.success !== true || payload?.data?.status !== "ok") {
    process.stderr.write(`Health check failed: ${response.status} ${JSON.stringify(payload)}\n`);
    process.exit(1);
  }

  process.stdout.write(`Health check ok: ${url}\n`);
} catch (error) {
  process.stderr.write(`Health check failed: ${error.message}\n`);
  process.exit(1);
}
