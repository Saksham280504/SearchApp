/**
 * controllers/analyticsController.js
 *
 * Phase 4 — Time-Series and GIS Map endpoints.
 *
 * All endpoints fall back gracefully to file-scan / seed data
 * when no DATABASE_URL is configured (local dev without Postgres).
 */

const fs = require("fs");
const path = require("path");
const { query, isDatabaseConfigured } = require("../db/pool");
const { stations: seedStations } = require("../seeds/stations");
const { TextToJSON } = require("../utils/TextToJson");
const { filterByCompoundName } = require("../utils/searchLogic");

// ── GET /api/analytics/stations ──────────────────────────────────────
// Returns all stations with lat/lng for the Leaflet map.
const getStations = async (req, res) => {
  const { datasetId } = req.query;

  if (isDatabaseConfigured()) {
    try {
      const params = [];
      let join = "";
      let where = "WHERE s.latitude IS NOT NULL AND s.longitude IS NOT NULL";
      
      if (datasetId) {
        join = "JOIN sample_files sf ON sf.station_id = s.id";
        where += " AND sf.dataset_id = $1";
        params.push(datasetId);
      }

      const { rows } = await query(
        `SELECT DISTINCT s.id, s.code, s.name, s.source, s.sample_file AS "sampleFile",
                s.river, s.district, s.state,
                s.latitude::float8 AS latitude, s.longitude::float8 AS longitude
         FROM stations s
         ${join}
         ${where}
         ORDER BY s.code`,
        params
      );
      return res.json({ stations: rows });
    } catch (err) {
      console.error("getStations DB error:", err.message);
    }
  }

  // Fallback to seed data
  const { stations } = require("../seeds/stations");
  return res.json({ stations });
};

// ── GET /api/analytics/map?compound=<name> ────────────────────────────
// Returns per-station max area for a given compound (for the map overlay).
// Shape: [{ stationCode, stationName, river, lat, lng, area, mz, rt, sampleDate }]
const getCompoundMap = async (req, res) => {
  const { compound, datasetId, exact } = req.query;
  if (!compound) {
    return res.status(400).json({ error: "compound query parameter is required." });
  }

  const isExact = exact === "true" || exact === true;

  if (!isDatabaseConfigured()) {
    try {
      const sampleDir = path.join(__dirname, "../data/sample-files");
      if (!fs.existsSync(sampleDir)) return res.json({ points: [] });

      const files = fs.readdirSync(sampleDir).filter(f => f.endsWith(".txt"));
      const stationMap = new Map();
      seedStations.forEach(s => {
        if (s.sampleFile) stationMap.set(s.sampleFile.toLowerCase(), s);
        if (s.code) stationMap.set(s.code.toLowerCase(), s);
      });

      const points = [];
      files.forEach(file => {
        const base = file.replace(".txt", "");
        const st = stationMap.get(base.toLowerCase());
        if (!st || !st.latitude || !st.longitude) return;

        try {
          const data = TextToJSON(path.join(sampleDir, file));
          if (!Array.isArray(data)) return;

          const qLower = compound.trim().toLowerCase();
          let matches = data.filter(r => r.Name && r.Name.trim().toLowerCase() === qLower);
          if (matches.length === 0 && !isExact && compound.trim().length >= 4) {
            matches = filterByCompoundName(data, compound);
          }
          if (matches.length > 0) {
            let maxArea = 0;
            let bestMz = null;
            let bestRt = null;
            matches.forEach(m => {
              const a = parseFloat(m["Area (Max.)"]) || 0;
              if (a > maxArea) {
                maxArea = a;
                bestMz = m["m/z"];
                bestRt = m["RT [min]"];
              }
            });

            points.push({
              stationCode: st.code,
              stationName: st.name,
              river: st.river,
              source: st.source,
              sampleFile: st.sampleFile,
              lat: st.latitude,
              lng: st.longitude,
              area: maxArea,
              mz: bestMz,
              rt: bestRt
            });
          }
        } catch (e) {
          // ignore single file error
        }
      });

      points.sort((a, b) => b.area - a.area);
      return res.json({ points });
    } catch (err) {
      console.error("file-scan getCompoundMap error:", err.message);
      return res.json({ points: [] });
    }
  }

  try {
    const compVal = isExact ? compound.trim().toLowerCase() : `%${compound.toLowerCase()}%`;
    const nameMatch = isExact ? "LOWER(c.name) = $1" : "c.normalized_name ILIKE $1";
    const params = [compVal];
    let where = `WHERE ${nameMatch} AND st.latitude IS NOT NULL`;
    
    if (datasetId) {
      params.push(datasetId);
      where += " AND sf.dataset_id = $2";
    }

    const { rows } = await query(
      `SELECT
         st.code                   AS "stationCode",
         st.name                   AS "stationName",
         st.source,
         st.sample_file            AS "sampleFile",
         st.river,
         st.latitude::float8       AS lat,
         st.longitude::float8      AS lng,
         MAX(co.area_max)::float8  AS area,
         MAX(co.mz)::float8        AS mz,
         MAX(co.rt_min)::float8    AS rt,
         MAX(sf.sampling_date::text) AS "sampleDate"
       FROM compound_observations co
       JOIN compounds c      ON co.compound_id = c.id
       JOIN sample_files sf  ON co.sample_file_id = sf.id
       JOIN stations st      ON sf.station_id = st.id
       ${where}
       GROUP BY st.code, st.name, st.source, st.sample_file, st.river, st.latitude, st.longitude
       ORDER BY area DESC NULLS LAST`,
      params
    );
    return res.json({ points: rows });
  } catch (err) {
    console.error("getCompoundMap error:", err.message);
    return res.status(500).json({ error: "Failed to fetch map data." });
  }
};

// ── GET /api/analytics/timeseries?compound=<name>&station=<code> ─────
// Returns compound area measurements over time for charting.
// Shape: [{ date, stationCode, stationName, area, mz, rt }]
const getTimeSeries = async (req, res) => {
  const { compound, station } = req.query;
  if (!compound) {
    return res.status(400).json({ error: "compound query parameter is required." });
  }

  if (!isDatabaseConfigured()) {
    return res.json({ series: [], message: "Time series requires database connection." });
  }

  try {
    const params = [`%${compound.toLowerCase()}%`];
    let stationFilter = "";
    if (station) {
      params.push(station.toUpperCase());
      stationFilter = `AND st.code = $${params.length}`;
    }

    const { rows } = await query(
      `SELECT
         sf.sampling_date::text AS date,
         st.code                AS "stationCode",
         st.name                AS "stationName",
         st.river,
         co.area_max            AS area,
         co.mz,
         co.rt_min              AS rt
       FROM compound_observations co
       JOIN compounds c      ON co.compound_id = c.id
       JOIN sample_files sf  ON co.sample_file_id = sf.id
       LEFT JOIN stations st ON sf.station_id = st.id
       WHERE c.normalized_name ILIKE $1
         AND sf.sampling_date IS NOT NULL
         ${stationFilter}
       ORDER BY sf.sampling_date ASC, st.code ASC`,
      params
    );
    return res.json({ series: rows });
  } catch (err) {
    console.error("getTimeSeries error:", err.message);
    return res.status(500).json({ error: "Failed to fetch time series data." });
  }
};

// ── GET /api/analytics/trends?compound=<name>&station=<code> ─────────
// Returns summary statistics + trend direction (increasing/stable/decreasing).
const getTrends = async (req, res) => {
  const { compound, station } = req.query;
  if (!compound) {
    return res.status(400).json({ error: "compound query parameter is required." });
  }

  if (!isDatabaseConfigured()) {
    return res.json({ trend: null, message: "Trend analysis requires database connection." });
  }

  try {
    const params = [`%${compound.toLowerCase()}%`];
    let stationFilter = "";
    if (station) {
      params.push(station.toUpperCase());
      stationFilter = `AND st.code = $${params.length}`;
    }

    const { rows } = await query(
      `SELECT
         COUNT(*)::int       AS observations,
         ROUND(AVG(co.area_max)::numeric, 2)  AS mean,
         ROUND(MIN(co.area_max)::numeric, 2)  AS min,
         ROUND(MAX(co.area_max)::numeric, 2)  AS max,
         -- Trend: compare first-half average vs second-half average
         ROUND(AVG(CASE WHEN row_num <= total/2 THEN co.area_max END)::numeric, 2) AS first_half_avg,
         ROUND(AVG(CASE WHEN row_num  > total/2 THEN co.area_max END)::numeric, 2) AS second_half_avg
       FROM (
         SELECT
           co.area_max,
           ROW_NUMBER() OVER (ORDER BY sf.sampling_date) AS row_num,
           COUNT(*) OVER ()                              AS total
         FROM compound_observations co
         JOIN compounds c      ON co.compound_id = c.id
         JOIN sample_files sf  ON co.sample_file_id = sf.id
         LEFT JOIN stations st ON sf.station_id = st.id
         WHERE c.normalized_name ILIKE $1
           AND sf.sampling_date IS NOT NULL
           ${stationFilter}
       ) sub JOIN compound_observations co ON true
       LIMIT 1`,
      params
    );

    if (rows.length === 0 || rows[0].observations === 0) {
      return res.json({ trend: null, message: "No data found." });
    }

    const r = rows[0];
    const firstHalf = parseFloat(r.first_half_avg) || 0;
    const secondHalf = parseFloat(r.second_half_avg) || 0;
    const pctChange = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;

    let direction = "stable";
    if (pctChange > 10) direction = "increasing";
    else if (pctChange < -10) direction = "decreasing";

    return res.json({
      trend: {
        observations: r.observations,
        mean: r.mean,
        min: r.min,
        max: r.max,
        pctChange: Math.round(pctChange * 10) / 10,
        direction,
      },
    });
  } catch (err) {
    console.error("getTrends error:", err.message);
    return res.status(500).json({ error: "Failed to fetch trend data." });
  }
};

// ── GET /api/analytics/category-counts ────────────────────────────────
// Returns live compound counts per category from the DB.
// Falls back to scanning OptimizedCategoryData.json in local dev.
const { getCleanCategory } = require("../utils/categoryMapper");

const getCategoryCounts = async (req, res) => {
  const cleanSets = {};

  if (isDatabaseConfigured()) {
    try {
      const { rows } = await query(`
        SELECT
          category,
          normalized_name,
          COALESCE(formula, '') AS formula
        FROM compounds
        WHERE category IS NOT NULL AND category != ''
      `);
      rows.forEach((r) => {
        const cleanCat = getCleanCategory(r.category);
        if (!cleanCat) return;
        if (!cleanSets[cleanCat]) cleanSets[cleanCat] = new Set();
        cleanSets[cleanCat].add(`${r.normalized_name}||${r.formula}`);
      });
    } catch (err) {
      console.error("getCategoryCounts DB error:", err.message);
    }
  }

  // File-scan fallback if DB is not configured or returned no categories
  if (Object.keys(cleanSets).length === 0) {
    try {
      const filePath = path.join(__dirname, "../data/OptimizedCategoryData.json");
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
        data.forEach((row) => {
          const cleanCat = getCleanCategory(row.Category);
          if (!cleanCat) return;
          const key = `${(row.Name || "").trim().toLowerCase()}||${(row.Formula || "").trim()}`;
          if (!cleanSets[cleanCat]) cleanSets[cleanCat] = new Set();
          cleanSets[cleanCat].add(key);
        });
      }
    } catch (err) {
      console.error("getCategoryCounts file error:", err.message);
    }
  }

  const finalCategories = Object.entries(cleanSets)
    .map(([category, set]) => ({ category, count: set.size }))
    .sort((a, b) => a.category.localeCompare(b.category));

  return res.json({ categories: finalCategories });
};

module.exports = { getStations, getCompoundMap, getCategoryCounts };
