/** Central API error handler — keeps nodemon from dying on CastError/ValidationError */
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  let status = err.status || err.statusCode || 500;
  let message = err.message || "Server error";

  if (err.name === "CastError" || err.kind === "ObjectId") {
    status = 400;
    message = `Invalid ${err.path || "id"}`;
  } else if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors || {})
      .map((e) => e.message)
      .join(", ") || message;
  } else if (err.code === 11000) {
    status = 400;
    message = "Duplicate value";
  }

  if (status >= 500) {
    console.error(
      JSON.stringify({
        level: "error",
        requestId: req.requestId,
        message: err.message,
        stack: err.stack,
      })
    );
  }

  res.status(status).json({
    message,
    code: err.code || err.name,
    requestId: req.requestId,
  });
}

module.exports = errorHandler;
