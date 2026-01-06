# Petition2DC (legacy Petition2Congress-inspired)

A minimal petitions site you can run on your own VPS.

## What it does

- **Create petitions** (targets + issue category + manager)
- **Sign petitions** (privacy-safe **email hashing** + **dedupe** per petition)
- **Public status badges** for petitions (RECEIVED → IN_REVIEW → DELIVERED → RESPONDED → CLOSED)
- **Admin panel** to update petition status + delivery status (QUEUED / SENT / FAILED / ACKNOWLEDGED)
- **Congressional directory** stub + Leaflet map UI (data import script included)

## What it does NOT do

- It does **not** auto-submit to congressional contact forms.
- It does **not** automatically email officials or agencies.
- It is intentionally a **collection + tracking** tool; delivery is a **human workflow**.

---

## Repo structure

```text
src/
  server.js              # Express app
  config.js              # env config
  db.js                  # SQLite schema + prepared statements
  routes/
    pages.js             # public routes + form handlers
    admin.js             # admin auth + admin views
    api.js               # lightweight json endpoints (if present)
  views/                 # EJS templates
  public/                # static assets (css/js/images)
  data/                  # issues + officials data
scripts/
  hash-password.mjs
  import-officials.mjs
```

---

## Data model (SQLite)

- `petitions`
  - petition content + manager info + `status`

- `signatures`
  - `email_hash` (sha256 of normalized email)
  - unique constraint: `UNIQUE(petition_id, email_hash)`

- `deliveries`
  - one row per selected target (senate/house/white_house)
  - admin updates delivery status + note

The DB file is stored at `DB_PATH`.

---

## Environment variables

Copy `.env.example` for local dev:

```bash
cp .env.example .env
```

### Required / recommended

- `PORT=3000`
- `BASE_URL=http://localhost:3000` (or your real https URL in prod)
- `SESSION_SECRET=<long-random>`
- `DB_PATH=./data/app.sqlite` (local) or `/app/data/app.sqlite` (docker volume)
- `TRUST_PROXY=true` (set **true** when behind Caddy/NGINX/reverse proxy)

### Admin login

Generate password hash:

```bash
node scripts/hash-password.mjs "your password"
```

Set:

- `ADMIN_PASSWORD_SALT_HEX=...`
- `ADMIN_PASSWORD_HASH_HEX=...`

Then visit:

- `/admin/login`

---

## Quickstart (local)

```bash
npm install
cp .env.example .env
# edit .env if needed
npm run dev
```

Visit:

- `http://localhost:3000`

---

## Production (VPS) — Docker + Caddy

This repo includes:

- `docker-compose.vps.yml`
- `Caddyfile`

### One-time setup (VPS)

1. Put your production env file on the VPS (do **not** commit secrets):

```bash
sudo nano /opt/petition2dc/petition2dc/.env.prod
```

2. Start / rebuild:

```bash
cd /opt/petition2dc/petition2dc
docker compose -f docker-compose.vps.yml up -d --build
```

3. Health check:

```bash
curl -fsS https://YOUR_DOMAIN/health && echo
```

### Updating (recommended workflow)

- **Source of truth:** your GitHub repo + VS Code.
- Make changes locally → commit/push → on VPS run:

```bash
cd /opt/petition2dc/petition2dc
git pull --ff-only
docker compose -f docker-compose.vps.yml up -d --build
```

---

## Import officials data (directory)

This repo ships with a small sample dataset.

To build a fuller directory:

```bash
node scripts/import-officials.mjs
```

This writes:

- `src/data/officials.json`

Restart the server afterward.

---

## Operational notes

### Admin workflow (how it works in practice)

- The public can create petitions and sign them.
- **You (admin)**:
  - review petitions
  - update petition status and delivery status
  - copy/share the petition link
  - optionally deliver/export/share signatures and petition content to the relevant channel (email, socials, print, offices, etc.)

### Privacy

- Emails are **not stored**.
- Only `email_hash` is stored for dedupe.

### Backups

Your SQLite DB lives in the Docker volume `p2dc_data`.
Back up regularly (copy `/app/data/app.sqlite` out of the volume, or snapshot the VPS).

---

## Security notes (baseline)

- Run behind HTTPS (Caddy).
- Use a strong `SESSION_SECRET`.
- Keep `.env.prod` on the VPS only.
- Enable `TRUST_PROXY=true` when behind Caddy so rate limits / logging see the real client IP.

---
