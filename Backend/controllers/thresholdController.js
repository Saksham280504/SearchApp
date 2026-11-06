/**
 * controllers/thresholdController.js
 * Phase 5 — CRUD for the thresholds table (admin only).
 * Falls back to an empty list when no DB is configured.
 */

const { query, isDatabaseConfigured } = require("../db/pool");

// ── GET /api/thresholds?compoundId=&compound= ─────────────────────────
const getThresholds = async (req, res) => {
  if (!isDatabaseConfigured()) {
    return res.json({ thresholds: [] });
  }

  try {
    const { compoundId, compound } = req.query;
    let sql, params;

    if (compoundId) {
      sql = `SELECT t.*, c.name AS compound_name
             FROM thresholds t JOIN compounds c ON t.compound_id = c.id
             WHERE t.compound_id = $1 ORDER BY t.standard_name`;
      params = [compoundId];
    } else if (compound) {
      sql = `SELECT t.*, c.name AS compound_name
             FROM thresholds t JOIN compounds c ON t.compound_id = c.id
             WHERE c.normalized_name ILIKE $1 ORDER BY t.standard_name`;
      params = [`%${compound.toLowerCase()}%`];
    } else {
      sql = `SELECT t.*, c.name AS compound_name
             FROM thresholds t JOIN compounds c ON t.compound_id = c.id
             ORDER BY c.name, t.standard_name
             LIMIT 200`;
      params = [];
    }

    const { rows } = await query(sql, params);
    return res.json({ thresholds: rows });
  } catch (err) {
    console.error("getThresholds error:", err.message);
    return res.status(500).json({ error: "Failed to fetch thresholds." });
  }
};

// ── POST /api/thresholds — admin only ─────────────────────────────────
const createThreshold = async (req, res) => {
  if (!isDatabaseConfigured()) {
    return res.status(503).json({ error: "Database not configured." });
  }

  const { compoundId, standardName, limitValue, unit, severity } = req.body;
  if (!compoundId || !standardName || limitValue === undefined) {
    return res.status(400).json({ error: "compoundId, standardName, and limitValue are required." });
  }

  try {
    const { rows } = await query(
      `INSERT INTO thresholds (compound_id, standard_name, limit_value, unit, severity)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (compound_id, standard_name)
       DO UPDATE SET limit_value = EXCLUDED.limit_value, unit = EXCLUDED.unit, severity = EXCLUDED.severity
       RETURNING *`,
      [compoundId, standardName, limitValue, unit || "ng/L", severity || "warning"]
    );
    return res.status(201).json({ threshold: rows[0] });
  } catch (err) {
    console.error("createThreshold error:", err.message);
    return res.status(500).json({ error: "Failed to create threshold." });
  }
};

// ── PUT /api/thresholds/:id — admin only ─────────────────────────────
const updateThreshold = async (req, res) => {
  if (!isDatabaseConfigured()) return res.status(503).json({ error: "Database not configured." });

  const { id } = req.params;
  const { limitValue, unit, severity } = req.body;

  try {
    const { rows } = await query(
      `UPDATE thresholds SET limit_value = $1, unit = $2, severity = $3
       WHERE id = $4 RETURNING *`,
      [limitValue, unit, severity, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Threshold not found." });
    return res.json({ threshold: rows[0] });
  } catch (err) {
    console.error("updateThreshold error:", err.message);
    return res.status(500).json({ error: "Failed to update threshold." });
  }
};

// ── DELETE /api/thresholds/:id — admin only ───────────────────────────
const deleteThreshold = async (req, res) => {
  if (!isDatabaseConfigured()) return res.status(503).json({ error: "Database not configured." });

  const { id } = req.params;
  try {
    await query("DELETE FROM thresholds WHERE id = $1", [id]);
    return res.json({ message: "Threshold deleted." });
  } catch (err) {
    console.error("deleteThreshold error:", err.message);
    return res.status(500).json({ error: "Failed to delete threshold." });
  }
};

module.exports = { getThresholds, createThreshold, updateThreshold, deleteThreshold };
