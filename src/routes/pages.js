import express from "express";
import { nanoid } from "nanoid";
import { statements } from "../db.js";
import { ISSUE_CATEGORIES, issueLabel } from "../data/issues.js";
import { slugify } from "../lib/slug.js";
import { sha256Hex } from "../lib/crypto.js";
import { setFlash } from "../lib/flash.js";
import { STATES } from "../data/states.js";
import { loadOfficials } from "../lib/officials.js";

export const pagesRouter = express.Router();

function normalizeTargets(body) {
  const raw = body.targets;
  const arr = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const allowed = new Set(["senate", "house", "white_house"]);
  return arr.filter((t) => allowed.has(t));
}

function validateCreatePetition(body) {
  const errors = {};
  const title = String(body.title || "").trim();
  const petitionBody = String(body.body || "").trim();
  const issueCode = Number(body.issue_code || 0);
  const managerFirst = String(body.manager_first || "").trim();
  const managerLast = String(body.manager_last || "").trim();
  const managerEmail = String(body.manager_email || "").trim();
  const honeypot = String(body.last || "").trim();
  const targets = normalizeTargets(body);

  if (honeypot) {
    errors.last = "Bot check failed.";
  }
  if (targets.length === 0) {
    errors.targets = "Select at least one target.";
  }
  if (title.length < 10 || title.length > 140) {
    errors.title = "Title must be 10–140 characters.";
  }
  if (petitionBody.length < 40 || petitionBody.length > 10000) {
    errors.body = "Petition text must be 40–10,000 characters.";
  }
  if (!Number.isInteger(issueCode) || issueCode < 1 || issueCode > 32) {
    errors.issue_code = "Select an issue category.";
  }
  if (managerFirst.length < 1 || managerFirst.length > 80) {
    errors.manager_first = "First name is required.";
  }
  if (managerLast.length < 1 || managerLast.length > 80) {
    errors.manager_last = "Last name is required.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(managerEmail)) {
    errors.manager_email = "Enter a valid email address.";
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    values: {
      targets,
      title,
      body: petitionBody,
      issue_code: issueCode,
      manager_first: managerFirst,
      manager_last: managerLast,
      manager_email: managerEmail,
    },
  };
}

function validateSignature(body) {
  const errors = {};
  const firstName = String(body.first_name || "").trim();
  const lastName = String(body.last_name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const zipcode = String(body.zipcode || "").trim();
  const honeypot = String(body.last || "").trim();

  if (honeypot) {
    errors.last = "Bot check failed.";
  }
  if (firstName.length < 1 || firstName.length > 80) {
    errors.first_name = "First name is required.";
  }
  if (lastName.length < 1 || lastName.length > 80) {
    errors.last_name = "Last name is required.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address.";
  }
  if (zipcode && !/^\d{5}(-\d{4})?$/.test(zipcode)) {
    errors.zipcode = "Zipcode must be 5 digits (optional -####).";
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    values: { first_name: firstName, last_name: lastName, email, zipcode },
  };
}

pagesRouter.get("/", (req, res) => {
  const q = String(req.query.q || "").trim();
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = 20;
  const offset = (page - 1) * limit;

  const qLike = `%${q.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
  const qParam = q ? q : null;

  const rows = statements.listPetitions.all({
    q: qParam,
    qLike,
    limit,
    offset,
  });

  const total = statements.countPetitions.get({ q: qParam, qLike })?.n || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const petitions = rows.map((p) => ({
    ...p,
    targets: JSON.parse(p.targets_json),
    issue_label: issueLabel(p.issue_code),
  }));

  res.render("pages/index", {
    q,
    petitions,
    page,
    totalPages,
  });
});

pagesRouter.get("/petitions/new", (req, res) => {
  res.render("pages/petition-new", {
    issues: ISSUE_CATEGORIES,
    values: {
      targets: ["senate", "house"],
      title: "",
      body: "",
      issue_code: 32,
      manager_first: "",
      manager_last: "",
      manager_email: "",
    },
    errors: {},
  });
});

pagesRouter.post("/petitions", (req, res) => {
  const result = validateCreatePetition(req.body);

  if (!result.ok) {
    res.status(400).render("pages/petition-new", {
      issues: ISSUE_CATEGORIES,
      values: { ...result.values, issue_code: result.values.issue_code || 32 },
      errors: result.errors,
    });
    return;
  }

  const id = nanoid();
  const slugBase = slugify(result.values.title);
  const slug = `${slugBase || "petition"}-${id.slice(0, 8)}`;
  const now = Date.now();

  statements.insertPetition.run({
    id,
    slug,
    title: result.values.title,
    body: result.values.body,
    issue_code: result.values.issue_code,
    targets_json: JSON.stringify(result.values.targets),
    status: "RECEIVED",
    manager_first: result.values.manager_first,
    manager_last: result.values.manager_last,
    manager_email: result.values.manager_email,
    created_at: now,
  });

  // Create delivery rows for selected targets (admin can mark SENT / ACKNOWLEDGED later).
  const targets = result.values.targets;
  targets.forEach((target) => {
    statements.insertDelivery.run({
      id: nanoid(),
      petition_id: id,
      target,
      status: "QUEUED",
      note: null,
      updated_at: now,
    });
  });

  setFlash(req, "Petition created. Share the link and collect signatures.", "success");
  res.redirect(`/p/${slug}`);
});

pagesRouter.get("/p/:slug", (req, res) => {
  const slug = String(req.params.slug);
  const petition = statements.getPetitionBySlug.get(slug);

  if (!petition) {
    res.status(404).render("pages/not-found", { message: "Petition not found." });
    return;
  }

  const deliveries = statements.listDeliveriesByPetitionId.all(petition.id);
  const targets = JSON.parse(petition.targets_json);

  res.render("pages/petition-view", {
    petition: {
      ...petition,
      targets,
      issue_label: issueLabel(petition.issue_code),
    },
    deliveries,
    errors: {},
    values: { first_name: "", last_name: "", email: "", zipcode: "" },
  });
});

pagesRouter.post("/p/:slug/sign", (req, res) => {
  const slug = String(req.params.slug);
  const petition = statements.getPetitionBySlug.get(slug);

  if (!petition) {
    res.status(404).render("pages/not-found", { message: "Petition not found." });
    return;
  }

  const result = validateSignature(req.body);
  const deliveries = statements.listDeliveriesByPetitionId.all(petition.id);
  const targets = JSON.parse(petition.targets_json);

  if (!result.ok) {
    res.status(400).render("pages/petition-view", {
      petition: { ...petition, targets, issue_label: issueLabel(petition.issue_code) },
      deliveries,
      errors: result.errors,
      values: result.values,
    });
    return;
  }

  const emailHash = sha256Hex(result.values.email);
  const now = Date.now();

  try {
    statements.insertSignature.run({
      id: nanoid(),
      petition_id: petition.id,
      first_name: result.values.first_name,
      last_name: result.values.last_name,
      email_hash: emailHash,
      zipcode: result.values.zipcode || null,
      created_at: now,
    });
  } catch (e) {
    // Likely UNIQUE constraint violation: already signed.
    setFlash(req, "You have already signed this petition.", "warning");
    res.redirect(`/p/${slug}#sign`);
    return;
  }

  setFlash(req, "Signature recorded.", "success");
  res.redirect(`/p/${slug}#sign`);
});

pagesRouter.get("/congress", (req, res) => {
  const officials = loadOfficials();
  res.render("pages/congress", {
    states: STATES,
    officialsCount: Object.keys(officials).length,
  });
});

pagesRouter.get("/health", (req, res) => {
  res.json({ ok: true });
});
