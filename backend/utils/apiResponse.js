// ─── Consistent success response ─────────────────────────────────────────────
// Use this everywhere instead of writing res.json({ ... }) manually
// Keeps all API responses in the same shape so the frontend can rely on it

export const sendSuccess = (res, statusCode = 200, message = "Success", data = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

// ─── Consistent error response ────────────────────────────────────────────────
// For manually thrown errors where you want to control the message
export const sendError = (res, statusCode = 500, message = "Something went wrong") => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};
