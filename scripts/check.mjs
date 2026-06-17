import { spawnSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";

const rootFiles = ["server.mjs"];
const sourceRoots = ["src", "public/src"];
const checkedExtensions = new Set([".js", ".mjs"]);
const files = [...rootFiles];

for (const root of sourceRoots) {
  files.push(...await listSourceFiles(root));
}

let failures = 0;
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], {
    encoding: "utf8",
  });

  if (result.status !== 0) {
    failures += 1;
    process.stderr.write(`Syntax check failed: ${file}\n`);
    if (result.stderr) process.stderr.write(result.stderr);
    if (result.stdout) process.stderr.write(result.stdout);
  }
}

try {
  JSON.parse(await readFile("data/db.json", "utf8"));
} catch (error) {
  failures += 1;
  process.stderr.write(`JSON check failed: data/db.json\n${error.message}\n`);
}

if (failures > 0) {
  process.stderr.write(`${failures} check(s) failed.\n`);
  process.exit(1);
}

process.stdout.write(`All checks passed (${files.length} source files, data/db.json).\n`);

async function listSourceFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const result = [];

  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...await listSourceFiles(path));
      continue;
    }
    if (entry.isFile() && checkedExtensions.has(extname(entry.name))) {
      result.push(path);
    }
  }

  return result;
}
