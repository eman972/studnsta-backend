const path = require("path");

/** Backend project root (folder that contains package.json, .env, uploads) */
const ROOT = path.resolve(__dirname, "..", "..");
const UPLOADS = path.join(ROOT, "uploads");
const ENV_PATH = path.join(ROOT, ".env");

module.exports = { ROOT, UPLOADS, ENV_PATH };
