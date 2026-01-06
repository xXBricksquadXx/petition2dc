# Petition2DC

A minimal petitions site (Petition2Congress-inspired) designed for **simple, local-first operation**.

## What it does

- Create petitions (targets + issue category + manager contact)
- Share petition links and collect signatures
- Signature dedupe via **privacy-safe email hashing** (stores `email_hash`, not the raw email)
- Public status badges for petitions: `RECEIVED → IN_REVIEW → DELIVERED → RESPONDED → CLOSED`
- Delivery rows per target (admin can mark: `QUEUED / SENT / FAILED / ACKNOWLEDGED`)
- Admin panel to update petition + delivery statuses
- Congressional directory stub + Leaflet map UI (import script included)

## What it does NOT do

- Auto-submit to congressional contact forms
- Guarantee identity verification (you can add guardrails like email confirmation / CAPTCHA)

---

## Repo layout

```
petition2dc/
  src/
    data/
    lib/
    public/
    routes/
    views/
    config.js
    db.js
    server.js
  scripts/
  Dockerfile
  docker-compose.yml
  docker-compose.vps.yml
  Caddyfile
  .env.example
```

---

## Quickstart (local)

```bash
cp .env.example .env
npm install
npm run dev
```

Visit: `http://localhost:3000`

### Admin password (local)

Generate salt+hash:

```bash
node scripts/hash-password.mjs "your password"
```

Paste the printed values into `.env`:

- `ADMIN_PASSWORD_SALT_HEX`
- `ADMIN_PASSWORD_HASH_HEX`

Login at: `/admin/login`

---

## Environment variables

See `.env.example` for the full template.

Key variables:

- `PORT` (default 3000)
- `BASE_URL` (e.g. `https://p2dc.duckdns.org`)
- `TRUST_PROXY` (`true` when behind Caddy / reverse proxy)
- `DB_PATH` (SQLite DB path; in Docker/VPS: `/app/data/app.sqlite`)
- `SESSION_SECRET` (long random string)
- `ADMIN_PASSWORD_SALT_HEX` / `ADMIN_PASSWORD_HASH_HEX`

---

## Production (VPS) deploy

This repo supports a simple Docker + Caddy deploy.

### On VPS (first time)

1. Clone and configure:

```bash
cd /opt
git clone https://github.com/xXBricksquadXx/petition2dc.git
cd petition2dc
```

2. Create `.env.prod` (do not commit this file):

```bash
sudo nano .env.prod
```

3. Start:

```bash
docker compose -f docker-compose.vps.yml up -d --build
```

### Update deploy (normal workflow)

**Edit locally in VS Code → commit → push → deploy by pulling on the VPS:**

```bash
cd /opt/petition2dc
git pull --ff-only
docker compose -f docker-compose.vps.yml up -d --build
```

---

## Data persistence

In `docker-compose.vps.yml`, the DB is stored in a named Docker volume mounted at `/app/data`.

- Petitions/signatures: `/app/data/app.sqlite`

Back up that volume regularly if you care about long-term retention.

---

## Anti-abuse notes

Current baseline protections:

- Honeypot field (`last`)
- Email-hash dedupe (prevents the same email from signing the same petition repeatedly)

---

## Import officials data (directory)

This repo ships with a small sample dataset. To build a full directory:

```bash
node scripts/import-officials.mjs
```

It writes: `src/data/officials.json`

Restart the server after importing.
