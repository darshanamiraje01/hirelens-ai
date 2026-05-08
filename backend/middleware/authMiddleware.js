import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";

export const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Token must be sent as: Authorization: Bearer <token>
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401);
    throw new Error("Not authorized — no token provided");
  }

  const token = authHeader.split(" ")[1];

  // Verify token — throws JsonWebTokenError or TokenExpiredError on failure
  // Both are caught automatically by errorMiddleware
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Attach user to request (exclude password from being available anywhere)
  req.user = await User.findById(decoded.id).select("-password");

  if (!req.user) {
    res.status(401);
    throw new Error("Not authorized — user no longer exists");
  }

  next();
});
