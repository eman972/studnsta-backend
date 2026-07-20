/**
 * Storage abstraction (local now, S3-compatible later)
 */
const path = require("path");
const fs = require("fs");
const { UPLOADS } = require("../config/paths");

const DRIVER = process.env.STORAGE_DRIVER || "local";

function localUrl(filename, folder = "") {
  return `/uploads/${folder ? folder + "/" : ""}${filename}`;
}

async function saveLocal(file, folder = "") {
  const dir = path.join(UPLOADS, folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return localUrl(file.filename, folder);
}

async function saveUpload(file, folder = "") {
  if (DRIVER === "s3") {
    console.warn("S3 driver selected but not configured; falling back to local");
  }
  return saveLocal(file, folder);
}

module.exports = { saveUpload, DRIVER, localUrl, UPLOADS };
