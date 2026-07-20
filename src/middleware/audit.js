const AuditLog = require("../models/AuditLog");

/** Feature 11: Audit trail for role-sensitive actions */
const audit = (action) => async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode < 400 && req.user) {
      AuditLog.create({
        action,
        actor: req.user._id,
        targetType: req.params.id ? "resource" : "self",
        targetId: req.params.id || req.params.userId || null,
        meta: {
          method: req.method,
          path: req.originalUrl,
          requestId: req.requestId,
        },
      }).catch(() => {});
    }
    return originalJson(body);
  };
  next();
};

module.exports = audit;
