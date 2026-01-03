import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { config } from "./config.js";

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

ensureDir(config.dbPath);

export const db = new Database(config.dbPath);
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS petitions (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  issue_code INTEGER NOT NULL,
  targets_json TEXT NOT NULL,
  status TEXT NOT NULL,
  manager_first TEXT NOT NULL,
  manager_last TEXT NOT NULL,
  manager_email TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS signatures (
  id TEXT PRIMARY KEY,
  petition_id TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email_hash TEXT NOT NULL,
  zipcode TEXT,
  created_at INTEGER NOT NULL,
  UNIQUE(petition_id, email_hash),
  FOREIGN KEY (petition_id) REFERENCES petitions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS deliveries (
  id TEXT PRIMARY KEY,
  petition_id TEXT NOT NULL,
  target TEXT NOT NULL,
  status TEXT NOT NULL,
  note TEXT,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (petition_id) REFERENCES petitions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_petitions_created_at ON petitions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signatures_petition ON signatures(petition_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_petition ON deliveries(petition_id);
`);

export const statements = Object.freeze({
  insertPetition: db.prepare(`
    INSERT INTO petitions (
      id, slug, title, body, issue_code, targets_json, status,
      manager_first, manager_last, manager_email, created_at
    ) VALUES (
      @id, @slug, @title, @body, @issue_code, @targets_json, @status,
      @manager_first, @manager_last, @manager_email, @created_at
    )
  `),
  listPetitions: db.prepare(`
    SELECT
      p.*,
      (SELECT COUNT(*) FROM signatures s WHERE s.petition_id = p.id) AS signature_count
    FROM petitions p
    WHERE (@q IS NULL OR p.title LIKE @qLike OR p.body LIKE @qLike)
    ORDER BY p.created_at DESC
    LIMIT @limit OFFSET @offset
  `),
  countPetitions: db.prepare(`
    SELECT COUNT(*) AS n
    FROM petitions p
    WHERE (@q IS NULL OR p.title LIKE @qLike OR p.body LIKE @qLike)
  `),
  getPetitionBySlug: db.prepare(`
    SELECT
      p.*,
      (SELECT COUNT(*) FROM signatures s WHERE s.petition_id = p.id) AS signature_count
    FROM petitions p
    WHERE p.slug = ?
  `),
  getPetitionById: db.prepare(`
    SELECT
      p.*,
      (SELECT COUNT(*) FROM signatures s WHERE s.petition_id = p.id) AS signature_count
    FROM petitions p
    WHERE p.id = ?
  `),
  insertSignature: db.prepare(`
    INSERT INTO signatures (
      id, petition_id, first_name, last_name, email_hash, zipcode, created_at
    ) VALUES (
      @id, @petition_id, @first_name, @last_name, @email_hash, @zipcode, @created_at
    )
  `),
  listDeliveriesByPetitionId: db.prepare(`
    SELECT * FROM deliveries WHERE petition_id = ? ORDER BY target ASC
  `),
  insertDelivery: db.prepare(`
    INSERT INTO deliveries (id, petition_id, target, status, note, updated_at)
    VALUES (@id, @petition_id, @target, @status, @note, @updated_at)
  `),
  updatePetitionStatus: db.prepare(`
    UPDATE petitions SET status = @status WHERE id = @id
  `),
  updateDelivery: db.prepare(`
    UPDATE deliveries SET status = @status, note = @note, updated_at = @updated_at WHERE id = @id
  `),
  listPetitionsForAdmin: db.prepare(`
    SELECT
      p.*,
      (SELECT COUNT(*) FROM signatures s WHERE s.petition_id = p.id) AS signature_count
    FROM petitions p
    ORDER BY p.created_at DESC
    LIMIT 200
  `),
});
