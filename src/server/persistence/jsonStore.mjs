import { readFile, writeFile } from "node:fs/promises";
import { getEmbeddedSeedData } from "./embeddedSeed.mjs";

export function createJsonStore(path) {
  let inMemoryDb = null;

  return {
    async read() {
      if (inMemoryDb) return clone(inMemoryDb);

      try {
        const raw = await readFile(path, "utf-8");
        return JSON.parse(raw);
      } catch (error) {
        if (!isRecoverableReadError(error)) throw error;
        inMemoryDb = getEmbeddedSeedData();
        return clone(inMemoryDb);
      }
    },
    async write(db) {
      inMemoryDb = clone(db);
      try {
        await writeFile(path, `${JSON.stringify(db, null, 2)}\n`, "utf-8");
      } catch (error) {
        if (!isRecoverableWriteError(error)) throw error;
      }
    },
  };
}

function isRecoverableReadError(error) {
  return [
    "ENOENT",
    "ERR_ACCESS_DENIED",
    "ERR_INVALID_ARG_VALUE",
    "ERR_OPERATION_FAILED",
  ].includes(error?.code) || /not implemented|unsupported|read-only/i.test(error?.message || "");
}

function isRecoverableWriteError(error) {
  return [
    "EROFS",
    "ENOENT",
    "ERR_ACCESS_DENIED",
    "ERR_INVALID_ARG_VALUE",
    "ERR_OPERATION_FAILED",
  ].includes(error?.code) || /not implemented|unsupported|read-only/i.test(error?.message || "");
}

function clone(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}
