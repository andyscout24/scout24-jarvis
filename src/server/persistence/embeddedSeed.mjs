import seedData from "./embeddedSeedData.mjs";

export function getEmbeddedSeedData() {
  return clone(seedData);
}

function clone(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}
