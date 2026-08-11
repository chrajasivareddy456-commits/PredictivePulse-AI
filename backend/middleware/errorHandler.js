// Central error handler: logs full technical details server-side, but only
// ever sends a clean, understandable message to the client (never a raw
// stack trace).
function errorHandler(err, req, res, next) {
  console.error(`[error] ${req.method} ${req.originalUrl}:`, err);

  if (err.isAxiosError) {
    // Errors from calling the FastAPI ML service
    if (err.code === "ECONNREFUSED" || err.code === "ETIMEDOUT") {
      return res.status(503).json({
        error: "The ML service is currently unavailable. Please ensure it is running and try again.",
      });
    }
    const status = err.response?.status || 502;
    const detail = err.response?.data?.detail || "The ML service returned an error.";
    return res.status(status).json({ error: detail });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  }

  if (err.name === "MongoServerError" && err.code === 11000) {
    return res.status(409).json({ error: "A record with this value already exists." });
  }

  const status = err.statusCode || 500;
  return res.status(status).json({ error: err.publicMessage || "An unexpected server error occurred." });
}

module.exports = { errorHandler };
