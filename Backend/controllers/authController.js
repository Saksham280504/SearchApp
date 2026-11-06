/**
 * controllers/authController.js
 * Register, login, and profile endpoints.
 *
 * When DATABASE_URL is not configured (local dev), uses an in-memory
 * user store so the full auth flow works without PostgreSQL.
 */

const bcrypt = require("bcrypt");
const { query, isDatabaseConfigured } = require("../db/pool");
const { generateToken } = require("../middleware/auth");

const SALT_ROUNDS = 12;

// ── In-memory user store (dev fallback when no DATABASE_URL) ──────────
const memoryUsers = [];

// Seed default admin user immediately (sync for memory, async for DB)
const seedAdmin = async () => {
  const adminEmail = "admin@searchapp.com";
  const adminPass = "Admin@123";
  const hashedPass = await bcrypt.hash(adminPass, 10);
  
  if (isDatabaseConfigured()) {
    try {
      const { rows } = await query("SELECT id FROM users WHERE email = $1", [adminEmail]);
      if (rows.length === 0) {
        await query(
          "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)",
          ["System Admin", adminEmail, hashedPass, "admin"]
        );
        console.log("🌱 Seeded default admin in database");
      }
    } catch (e) {
      console.error("Failed to seed admin to DB:", e.message);
    }
  } else {
    memoryUsers.push({
      id: 1,
      name: "System Admin",
      email: adminEmail,
      password_hash: hashedPass,
      role: "admin",
      created_at: new Date().toISOString()
    });
    console.log("🌱 Seeded default admin in memory (admin@searchapp.com / Admin@123)");
  }
};
seedAdmin();
let memoryIdSeq = 2;

// ── POST /api/auth/register ────────────────────────────────────────────
const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email, and password are required." });
  }

  // Self-registration ALWAYS gets viewer role.
  // Only an admin can elevate users via PATCH /api/auth/users/:id/role
  const assignedRole = "viewer";
  const normalizedEmail = email.toLowerCase().trim();

  if (isDatabaseConfigured()) {
    try {
      const existing = await query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: "An account with that email already exists." });
      }

      const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
      const result = await query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, role, created_at`,
        [name, normalizedEmail, password_hash, assignedRole]
      );

      const user = result.rows[0];
      const token = generateToken(user);
      return res.status(201).json({
        message: "Account created successfully.",
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      });
    } catch (err) {
      console.error("Register error:", err.message);
      return res.status(500).json({ error: "Registration failed. Please try again." });
    }
  }

  // ── In-memory fallback ─────────────────────────────────────────────
  console.log("⚠️  Using in-memory user store (no DATABASE_URL set)");
  if (memoryUsers.find((u) => u.email === normalizedEmail)) {
    return res.status(409).json({ error: "An account with that email already exists." });
  }
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = { id: memoryIdSeq++, name, email: normalizedEmail, password_hash, role: assignedRole, created_at: new Date().toISOString() };
  memoryUsers.push(user);
  const token = generateToken(user);
  return res.status(201).json({
    message: "Account created successfully.",
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
};

// ── POST /api/auth/login ───────────────────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required." });
  }
  const normalizedEmail = email.toLowerCase().trim();

  if (isDatabaseConfigured()) {
    try {
      const result = await query(
        "SELECT id, name, email, password_hash, role FROM users WHERE email = $1",
        [normalizedEmail]
      );
      if (result.rows.length === 0) {
        return res.status(401).json({ error: "Invalid email or password." });
      }
      const user = result.rows[0];
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) return res.status(401).json({ error: "Invalid email or password." });
      const token = generateToken(user);
      return res.json({
        message: "Login successful.",
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      });
    } catch (err) {
      console.error("Login error:", err.message);
      return res.status(500).json({ error: "Login failed. Please try again." });
    }
  }

  const user = memoryUsers.find((u) => u.email === normalizedEmail);
  if (!user) return res.status(401).json({ error: "Invalid email or password." });
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return res.status(401).json({ error: "Invalid email or password." });
  const token = generateToken(user);
  return res.json({
    message: "Login successful.",
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
};

// ── GET /api/auth/me ───────────────────────────────────────────────────
const me = async (req, res) => {
  if (isDatabaseConfigured()) {
    try {
      const result = await query(
        "SELECT id, name, email, role, created_at FROM users WHERE id = $1",
        [req.user.id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: "User not found." });
      return res.json({ user: result.rows[0] });
    } catch (err) {
      console.error("Me error:", err.message);
      return res.status(500).json({ error: "Could not fetch profile." });
    }
  }
  const user = memoryUsers.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "User not found." });
  return res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, created_at: user.created_at },
  });
};

// ── GET /api/auth/users (admin only) ──────────────────────────────────
const listUsers = async (req, res) => {
  if (isDatabaseConfigured()) {
    try {
      const { rows } = await query(
        "SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC"
      );
      return res.json({ users: rows });
    } catch (err) {
      console.error("listUsers error:", err.message);
      return res.status(500).json({ error: "Could not fetch users." });
    }
  }
  return res.json({
    users: memoryUsers.map(({ id, name, email, role, created_at }) => ({ id, name, email, role, created_at })),
  });
};

// ── PATCH /api/auth/users/:id/role (admin only) ────────────────────────
const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const allowedRoles = ["viewer", "researcher", "admin"];
  if (!role || !allowedRoles.includes(role)) {
    return res.status(400).json({ error: `Role must be one of: ${allowedRoles.join(", ")}` });
  }
  if (isDatabaseConfigured()) {
    try {
      const { rows } = await query(
        "UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role",
        [role, id]
      );
      if (rows.length === 0) return res.status(404).json({ error: "User not found." });
      return res.json({ message: "Role updated.", user: rows[0] });
    } catch (err) {
      console.error("updateUserRole error:", err.message);
      return res.status(500).json({ error: "Could not update role." });
    }
  }
  const user = memoryUsers.find((u) => u.id === parseInt(id));
  if (!user) return res.status(404).json({ error: "User not found." });
  user.role = role;
  return res.json({ message: "Role updated.", user: { id: user.id, name: user.name, email: user.email, role: user.role } });
};

module.exports = { register, login, me, listUsers, updateUserRole };
