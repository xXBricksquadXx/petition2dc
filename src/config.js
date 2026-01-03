import dotenv from "dotenv";

dotenv.config();

export const config = Object.freeze({
  port: Number(process.env.PORT || 3000),
  baseUrl: process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`,
  sessionSecret: process.env.SESSION_SECRET || "dev-only-change-me",
  dbPath: process.env.DB_PATH || "./data/app.sqlite",
  trustProxy: String(process.env.TRUST_PROXY || "false").toLowerCase() === "true",
  adminPasswordSaltHex: process.env.ADMIN_PASSWORD_SALT_HEX || "",
  adminPasswordHashHex: process.env.ADMIN_PASSWORD_HASH_HEX || "",
});
