/**
 * controllers/datasetController.js
 * Phase 4/5 Refinement — Manage datasets (batches of uploaded files)
 */

const { query, isDatabaseConfigured } = require("../db/pool");
const fs = require("fs");
const path = require("path");

// Hardcoded default dataset for file-scan fallback
const SEED_DATASET = {
  id: 1,
  name: "Varanasi HRMS",
  location: "Varanasi, India",
  river: "Ganga",
  fileCount: 40,
  created_at: new Date().toISOString(),
};

// ── GET /api/datasets ─────────────────────────────────────────────────
const getDatasets = async (req, res) => {
  if (!isDatabaseConfigured()) {
    return res.json({ datasets: [SEED_DATASET] });
  }

  try {
    const { rows } = await query(`
      SELECT d.*, 
             (SELECT COUNT(*) FROM sample_files sf WHERE sf.dataset_id = d.id) as file_count
      FROM datasets d
      ORDER BY d.created_at DESC
    `);
    
    // If empty DB, return seed
    if (rows.length === 0) {
      return res.json({ datasets: [SEED_DATASET] });
    }
    
    return res.json({ datasets: rows });
  } catch (err) {
    console.error("getDatasets error:", err.message);
    return res.status(500).json({ error: "Failed to fetch datasets." });
  }
};

// ── GET /api/datasets/:id/stations ────────────────────────────────────
const getDatasetStations = async (req, res) => {
  const { id } = req.params;

  if (!isDatabaseConfigured() || String(id) === "1") {
    // Fallback: return seed stations
    const { stations } = require("../seeds/stations");
    return res.json({ stations });
  }

  try {
    // Fetch unique stations linked to files in this dataset
    const { rows } = await query(`
      SELECT DISTINCT s.id, s.code, s.name, s.source, s.sample_file AS "sampleFile",
             s.river, s.district, s.state,
             s.latitude::float8 AS latitude, s.longitude::float8 AS longitude
      FROM sample_files sf
      JOIN stations s ON sf.station_id = s.id
      WHERE sf.dataset_id = $1
      ORDER BY s.code
    `, [id]);
    
    return res.json({ stations: rows });
  } catch (err) {
    console.error("getDatasetStations error:", err.message);
    return res.status(500).json({ error: "Failed to fetch dataset stations." });
  }
};

module.exports = { getDatasets, getDatasetStations };
