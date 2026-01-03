import express from "express";
import { config } from "../config.js";
import { statements } from "../db.js";
import { issueLabel } from "../data/issues.js";
import { verifyPassword } from "../lib/password.js";
import { setFlash } from "../lib/flash.js";

export const adminRouter = express.Router();

function requireAdmin(req, res, next) {
  if (req.session?.isAdmin) return next();
  res.redirect("/admin/login");
}

adminRouter.get("/admin/login", (req, res) => {
  const isConfigured = Boolean(config.adminPasswordSaltHex && config.adminPasswordHashHex);
  res.render("pages/admin-login", { isConfigured });
});

adminRouter.post("/admin/login", (req, res) => {
  const password = String(req.body.password || "");

  if (!config.adminPasswordSaltHex || !config.adminPasswordHashHex) {
    setFlash(req, "Admin password is not configured. Set env vars first.", "danger");
    res.redirect("/admin/login");
    return;
  }

  const ok = verifyPassword(password, config.adminPasswordSaltHex, config.adminPasswordHashHex);
  if (!ok) {
    setFlash(req, "Invalid password.", "danger");
    res.redirect("/admin/login");
    return;
  }

  req.session.isAdmin = true;
  setFlash(req, "Logged in.", "success");
  res.redirect("/admin");
});

adminRouter.post("/admin/logout", (req, res) => {
  req.session.isAdmin = false;
  setFlash(req, "Logged out.", "info");
  res.redirect("/");
});

adminRouter.get("/admin", requireAdmin, (req, res) => {
  const rows = statements.listPetitionsForAdmin.all();
  const petitions = rows.map((p) => ({
    ...p,
    targets: JSON.parse(p.targets_json),
    issue_label: issueLabel(p.issue_code),
  }));

  res.render("pages/admin-index", { petitions });
});

adminRouter.get("/admin/p/:id", requireAdmin, (req, res) => {
  const id = String(req.params.id);
  const petition = statements.getPetitionById.get(id);
  if (!petition) {
    res.status(404).render("pages/not-found", { message: "Petition not found." });
    return;
  }

  const deliveries = statements.listDeliveriesByPetitionId.all(petition.id);

  res.render("pages/admin-petition", {
    petition: {
      ...petition,
      targets: JSON.parse(petition.targets_json),
      issue_label: issueLabel(petition.issue_code),
    },
    deliveries,
  });
});

adminRouter.post("/admin/p/:id/status", requireAdmin, (req, res) => {
  const id = String(req.params.id);
  const status = String(req.body.status || "").toUpperCase();
  const allowed = new Set(["RECEIVED", "IN_REVIEW", "DELIVERED", "RESPONDED", "CLOSED"]);

  if (!allowed.has(status)) {
    setFlash(req, "Invalid status.", "danger");
    res.redirect(`/admin/p/${id}`);
    return;
  }

  statements.updatePetitionStatus.run({ id, status });
  setFlash(req, "Petition status updated.", "success");
  res.redirect(`/admin/p/${id}`);
});

adminRouter.post("/admin/delivery/:id", requireAdmin, (req, res) => {
  const id = String(req.params.id);
  const status = String(req.body.status || "").toUpperCase();
  const note = String(req.body.note || "").trim() || null;

  const allowed = new Set(["QUEUED", "SENT", "FAILED", "ACKNOWLEDGED"]);
  if (!allowed.has(status)) {
    setFlash(req, "Invalid delivery status.", "danger");
    res.redirect("/admin");
    return;
  }

  const now = Date.now();
  statements.updateDelivery.run({ id, status, note, updated_at: now });

  setFlash(req, "Delivery updated.", "success");
  // best-effort redirect back
  res.redirect(req.get("Referer") || "/admin");
});
