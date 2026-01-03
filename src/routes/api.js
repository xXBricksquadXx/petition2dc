import express from "express";
import { loadOfficials } from "../lib/officials.js";
import { STATES } from "../data/states.js";
import { statements } from "../db.js";
import { issueLabel } from "../data/issues.js";

export const apiRouter = express.Router();

apiRouter.get("/api/states", (req, res) => {
  res.json({ states: STATES });
});

apiRouter.get("/api/officials", (req, res) => {
  const officials = loadOfficials();
  const state = String(req.query.state || "").toUpperCase().trim();
  if (!state) {
    res.json({ officials });
    return;
  }
  res.json({ state, officials: officials[state] || [] });
});

apiRouter.get("/api/petitions", (req, res) => {
  const q = String(req.query.q || "").trim();
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
  const offset = Math.max(0, Number(req.query.offset || 0));
  const qLike = `%${q.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
  const qParam = q ? q : null;

  const rows = statements.listPetitions.all({ q: qParam, qLike, limit, offset });
  const petitions = rows.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    issue_code: p.issue_code,
    issue_label: issueLabel(p.issue_code),
    targets: JSON.parse(p.targets_json),
    status: p.status,
    signature_count: p.signature_count,
    created_at: p.created_at,
  }));

  res.json({ petitions });
});
