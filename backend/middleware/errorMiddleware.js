// ─── 404 Handler ─────────────────────────────────────────────────────────────
// Triggered when no route matches the incoming request
export const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404);
  next(error); // Pass to errorHandler below
};

// ─── Global Error Handler ─────────────────────────────────────────────────────
// Express identifies this as error middleware because it has 4 parameters (err, req, res, next)
export const errorHandler = (err, req, res, next) => {
  // Sometimes Express sets status 200 even on errors — fix that
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || "Internal Server Error";

  // ── Mongoose: Bad ObjectId (e.g. /api/user/invalid-id) ──────────────────────
  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 404;
    message = "Resource not found (invalid ID format)";
  }

  // ── Mongoose: Duplicate key (e.g. email already registered) ─────────────────
  if (err.code === 11000) {
    statusCode = 409; // 409 Conflict
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  }

  // ── Mongoose: Validation error (e.g. required field missing) ────────────────
  if (err.name === "ValidationError") {
    statusCode = 422;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  // ── JWT: Token malformed or expired ─────────────────────────────────────────
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token. Please log in again.";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired. Please log in again.";
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Show stack trace only in development — never expose in production
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
