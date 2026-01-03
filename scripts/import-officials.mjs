/**
 * Builds src/data/officials.json from the unitedstates/congress-legislators dataset.
 *
 * Source:
 * - legislators-current.yaml includes contact forms, phones, DC office addresses, etc.
 * - https://github.com/unitedstates/congress-legislators
 */
import fs from "node:fs";
import YAML from "yaml";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const URL =
  "https://raw.githubusercontent.com/unitedstates/congress-legislators/main/legislators-current.yaml";

function pickName(p) {
  const name = p.name || {};
  const parts = [name.first, name.middle, name.last].filter(Boolean);
  const suffix = name.suffix ? ` ${name.suffix}` : "";
  return `${parts.join(" ")}${suffix}`.trim();
}

function latestTerm(p) {
  const terms = Array.isArray(p.terms) ? p.terms : [];
  if (terms.length === 0) return null;
  return terms[terms.length - 1];
}

function chamberFromType(termType) {
  if (termType === "sen") return "Senate";
  if (termType === "rep") return "House";
  return "Other";
}

function formatRepName(name, term) {
  if (term.type !== "rep") return name;
  const district = term.district ? `-${term.district}` : "";
  return `${name} (${term.state}${district})`;
}

async function main() {
  // eslint-disable-next-line no-console
  console.log("Downloading:", URL);
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
  const yamlText = await res.text();
  const data = YAML.parse(yamlText);

  const byState = {};

  data.forEach((p) => {
    const term = latestTerm(p);
    if (!term) return;
    const state = String(term.state || "").toUpperCase();
    if (!state) return;

    const name = pickName(p);
    const out = {
      name: formatRepName(name, term),
      chamber: chamberFromType(term.type),
      party: term.party || "",
      website: term.url || "",
      contact: term.contact_form || "",
      phone: term.phone || "",
      dc_office: term.office || "",
    };

    if (!byState[state]) byState[state] = [];
    byState[state].push(out);
  });

  // sort: senators first, then reps by district-ish
  Object.keys(byState).forEach((st) => {
    byState[st].sort((a, b) => {
      if (a.chamber !== b.chamber) return a.chamber === "Senate" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  });

  const outPath = path.join(__dirname, "..", "src", "data", "officials.json");
  fs.writeFileSync(outPath, JSON.stringify(byState, null, 2) + "\n", "utf-8");

  // eslint-disable-next-line no-console
  console.log("Wrote:", outPath);
  // eslint-disable-next-line no-console
  console.log("States:", Object.keys(byState).length);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
