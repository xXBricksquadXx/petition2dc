import crypto from "node:crypto";

/**
 * Hash format:
 * - salt: random bytes (hex)
 * - hash: scrypt(password, salt, 32) (hex)
 */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 32);
  return {
    saltHex: salt.toString("hex"),
    hashHex: hash.toString("hex"),
  };
}

export function verifyPassword(password, saltHex, hashHex) {
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = crypto.scryptSync(password, salt, expected.length);
  // constant-time compare
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}
