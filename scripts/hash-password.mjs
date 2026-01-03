import { hashPassword } from "../src/lib/password.js";

const password = process.argv.slice(2).join(" ").trim();

if (!password) {
  // eslint-disable-next-line no-console
  console.log('Usage: node scripts/hash-password.mjs "your password"');
  process.exit(1);
}

const { saltHex, hashHex } = hashPassword(password);

// eslint-disable-next-line no-console
console.log("ADMIN_PASSWORD_SALT_HEX=" + saltHex);
// eslint-disable-next-line no-console
console.log("ADMIN_PASSWORD_HASH_HEX=" + hashHex);
