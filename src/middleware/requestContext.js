const { v4: uuidv4 } = require("uuid");

/** Feature 12: request IDs + structured logging */
const requestContext = (req, res, next) => {
  const requestId = req.headers["x-request-id"] || uuidv4();
  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  const start = Date.now();
  res.on("finish", () => {
    const entry = {
      level: res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info",
      requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Date.now() - start,
      userId: req.user?._id?.toString() || null,
    };
    console.log(JSON.stringify(entry));
  });

  next();
};

module.exports = requestContext;
