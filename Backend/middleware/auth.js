/**
 * middleware/auth.js
 * JWT authentication + role-based authorization middleware.
 */

require("dotenv").config();
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "changeme-in-production";

/**
 * authenticate
 * Reads the JWT from the Authorization header (Bearer <token>) or an
 * http-only cookie named "token".  Attaches the decoded payload to req.user.
 */
const authenticate = (req, res, next) => {
  let token = null;

  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ error: "Authentication required. Please log in." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, role, name }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token. Please log in again." });
  }
};

/**
 * authorize(roles)
 * Usage: router.post("/upload", authenticate, authorize(["researcher","admin"]), handler)
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required." });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role(s): ${roles.join(", ")}`,
      });
    }
    next();
  };
};

/**
 * generateToken(user)
 * Creates a signed JWT valid for 7 days.
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
};

module.exports = { authenticate, authorize, generateToken };
