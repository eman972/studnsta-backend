const mongoose = require("mongoose");

/** Strict ObjectId check (avoids mongoose accepting arbitrary 12-char strings) */
function isValidObjectId(id) {
  if (id == null) return false;
  const s = String(id);
  if (!/^[a-fA-F0-9]{24}$/.test(s)) return false;
  return mongoose.Types.ObjectId.isValid(s);
}

function requireObjectId(id, label = "id") {
  if (!isValidObjectId(id)) {
    const err = new Error(`Invalid ${label}. Use a valid user/resource ID, not a name.`);
    err.status = 400;
    err.code = "INVALID_OBJECT_ID";
    throw err;
  }
  return id;
}

module.exports = { isValidObjectId, requireObjectId };
