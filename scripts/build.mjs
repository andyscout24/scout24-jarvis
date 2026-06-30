import { spawnSync } from "node:child_process";
import { cp, mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = resolve(rootDir, "dist");
const clientDir = resolve(distDir, "client");
const serverDir = resolve(distDir, "server");
const openAiDir = resolve(distDir, ".openai");
const dataDir = resolve(distDir, "data");
const serverSourceDir = resolve(serverDir, "server");
const sharedSourceDir = resolve(serverDir, "shared");

runChecks();
await prepareDist();
await copyDirectoryContentsIfPresent("public", clientDir);
await copyDirectoryContentsIfPresent("data", dataDir);
await copyDirectoryContentsIfPresent("src/server", serverSourceDir);
await copyDirectoryContentsIfPresent("src/shared", sharedSourceDir);
await copyDirectoryContentsIfPresent(".openai", openAiDir);
await writeServerEntry();

process.stdout.write("Build complete. Sites artifact available in dist/.\n");

function runChecks() {
  const result = spawnSync(process.execPath, [resolve(rootDir, "scripts/check.mjs")], {
    cwd: rootDir,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    process.exit(result.status || 1);
  }

  if (result.stdout) process.stdout.write(result.stdout);
}

async function prepareDist() {
  await rm(distDir, { recursive: true, force: true });
  await mkdir(clientDir, { recursive: true });
  await mkdir(serverDir, { recursive: true });
  await mkdir(dataDir, { recursive: true });
  await mkdir(serverSourceDir, { recursive: true });
  await mkdir(sharedSourceDir, { recursive: true });
  await mkdir(openAiDir, { recursive: true });
}

async function copyDirectoryContentsIfPresent(sourceRelativePath, targetPath) {
  const sourcePath = resolve(rootDir, sourceRelativePath);
  try {
    await stat(sourcePath);
    const entries = await readdir(sourcePath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === ".DS_Store") continue;
      await cp(resolve(sourcePath, entry.name), resolve(targetPath, entry.name), { recursive: true });
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

async function writeServerEntry() {
  const entryPath = resolve(serverDir, "index.js");
  await writeFile(entryPath, "export { default } from \"./server/worker.mjs\";\n", "utf8");
}
