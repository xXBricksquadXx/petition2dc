# Petition2DC (legacy Petition2Congress-inspired)

A minimal petitions site with:
- Create petitions (targets + issue category + manager)
- Sign petitions (privacy-safe email hashing + dedupe)
- Public status badges (RECEIVED → IN_REVIEW → DELIVERED → RESPONDED → CLOSED)
- Admin panel to update petition + delivery statuses
- Congressional directory stub + Leaflet map UI (data import script included)

## Quickstart (local)

```bash
mkdir petition2dc && cd petition2dc
git init
# copy these files in
cp .env.example .env
npm install
npm run dev
```

Visit: http://localhost:3000

## Admin

1. Generate a password hash:

```bash
node scripts/hash-password.mjs "your password"
```

2. Put the printed values into `.env`:
- `ADMIN_PASSWORD_SALT_HEX`
- `ADMIN_PASSWORD_HASH_HEX`

3. Go to `/admin/login`.

## Docker / Dockploy

```bash
cp .env.example .env
# fill env vars
docker compose up --build
```

Your SQLite DB persists in `./data/app.sqlite`.

## Import officials data (directory)

This repo ships with a small sample dataset. To build a full directory:
- run `scripts/import-officials.mjs` (requires internet on your machine)
- it will write `src/data/officials.json`

```bash
node scripts/import-officials.mjs
```

Then restart the server.

## Notes

This project intentionally does **not** attempt to auto-submit to congressional contact forms.
It tracks a delivery workflow with statuses (queued/sent/acknowledged) that an admin can manage.
