import seedData from "../../../data/db.json" with { type: "json" };

export function getEmbeddedSeedData() {
  return clone(seedData);
}

function clone(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}
