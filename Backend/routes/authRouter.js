/**
 * routes/authRouter.js
 * Mounts auth endpoints under /api/auth
 */

const express = require("express");
const rateLimit = require("express-rate-limit");
const { register, login, me, listUsers, updateUserRole } = require("../controllers/authController");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

// Strict rate limit for auth endpoints — 10 attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please wait 15 minutes before trying again." },
});

router.post("/register", authLimiter, register);
router.post("/login",    authLimiter, login);
router.get("/me",        authenticate, me);

// Admin-only: user management
router.get("/users",            authenticate, authorize(["admin"]), listUsers);
router.patch("/users/:id/role", authenticate, authorize(["admin"]), updateUserRole);

module.exports = router;

