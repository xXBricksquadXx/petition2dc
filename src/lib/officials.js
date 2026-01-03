import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function tryLoadJson(p) {
  try {
    const raw = fs.readFileSync(p, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function loadOfficials() {
  // Prefer generated full dataset, fallback to sample.
  const generated = path.join(__dirname, "..", "data", "officials.json");
  const sample = path.join(__dirname, "..", "data", "officials.sample.json");
  return tryLoadJson(generated) || tryLoadJson(sample) || {};
}
