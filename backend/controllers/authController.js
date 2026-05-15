import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import { sendSuccess } from "../utils/apiResponse.js";

// ─── @route   POST /api/auth/register ────────────────────────────────────────
// ─── @access  Public
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please provide name, email, and password");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(409);
    throw new Error("Email already registered");
  }

  // Password is hashed inside User model's pre-save hook
  const user = await User.create({ name, email, password });

  sendSuccess(res, 201, "Account created successfully", {
    _id:   user._id,
    name:  user.name,
    email: user.email,
    token: generateToken(user._id),
  });
});

// ─── @route   POST /api/auth/login ───────────────────────────────────────────
// ─── @access  Public
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide email and password");
  }

  // Must use .select("+password") because password has select:false in schema
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  sendSuccess(res, 200, "Login successful", {
    _id:             user._id,
    name:            user.name,
    email:           user.email,
    totalInterviews: user.totalInterviews,
    averageScore:    user.averageScore,
    token:           generateToken(user._id),
  });
});

// ─── @route   GET /api/auth/me ────────────────────────────────────────────────
// ─── @access  Private (requires token)
export const getMe = asyncHandler(async (req, res) => {
  // req.user is set by authMiddleware
  const user = await User.findById(req.user._id);
  sendSuccess(res, 200, "User fetched", user);
});
