import { readFile, writeFile } from "node:fs/promises";

export function createJsonStore(path) {
  return {
    async read() {
      const raw = await readFile(path, "utf-8");
      return JSON.parse(raw);
    },
    async write(db) {
      await writeFile(path, `${JSON.stringify(db, null, 2)}\n`, "utf-8");
    },
  };
}
