/**
 * controllers/uploadController.js
 * Phase 4/5 Refinement — Multi-file dataset upload
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const XLSX = require("xlsx");
const { query, isDatabaseConfigured } = require("../db/pool");

const REQUIRED_COLUMNS = [
  "Name", "Formula", "m/z", "RT [min]", "Area (Max.)", "Calc. MW",
];

const UPLOAD_DIR = path.join(__dirname, "../uploads/temp");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ORIGINALS_DIR = path.join(__dirname, "../uploads/originals");
if (!fs.existsSync(ORIGINALS_DIR)) fs.mkdirSync(ORIGINALS_DIR, { recursive: true });

// ── Multer config ─────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if ([".xlsx", ".txt"].includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only .xlsx and .txt files are allowed."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB per file
});

// ── Helper: parse file into rows ──────────────────────────────────────
const parseFile = (filePath, originalName) => {
  const ext = path.extname(originalName).toLowerCase();
  if (ext === ".xlsx") {
    const wb = XLSX.readFile(filePath, { cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json(ws, { defval: "" });
  }
  if (ext === ".txt") {
    const { TextToJSON } = require("../utils/TextToJson");
    return TextToJSON(filePath);
  }
  throw new Error("Unsupported file format.");
};

// ── Helper: compute SHA-256 checksum ─────────────────────────────────
const computeChecksum = (filePath) => {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buf).digest("hex");
};

// ── Helper: extract station code ──────────────────────────────────────
const extractStationCode = (filename) => {
  const base = path.basename(filename, path.extname(filename));
  const match = base.match(/^([A-Za-z]+[0-9]+(?:_[12])?)/i);
  return match ? match[1].toUpperCase() : null;
};

// ── POST /api/upload/preview ──────────────────────────────────────────
const previewUpload = [
  upload.array("files", 100), // accept up to 100 files
  async (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded." });
    }

    try {
      const results = [];
      
      for (const file of req.files) {
        const rows = parseFile(file.path, file.originalname);
        const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
        const missingColumns = REQUIRED_COLUMNS.filter((col) => !headers.includes(col));
        
        const detectedStation = extractStationCode(file.originalname);
        const checksum = computeChecksum(file.path);

        let isDuplicate = false;
        if (isDatabaseConfigured()) {
          const dup = await query("SELECT id FROM sample_files WHERE checksum = $1", [checksum]);
          if (dup.rows.length > 0) isDuplicate = true;
        }

        results.push({
          tempPath: file.path,
          tempFilename: file.filename,
          originalName: file.originalname,
          totalRows: rows.length,
          missingColumns,
          detectedStation,
          checksum,
          isDuplicate,
          isValid: missingColumns.length === 0 && rows.length > 0
        });
      }

      return res.json({ files: results });
    } catch (err) {
      // cleanup on error
      if (req.files) req.files.forEach(f => fs.existsSync(f.path) && fs.unlinkSync(f.path));
      return res.status(500).json({ error: err.message });
    }
  },
];

// ── POST /api/upload/confirm ──────────────────────────────────────────
const confirmUpload = async (req, res) => {
  // files = array of { tempFilename, originalName, stationCode }
  const { datasetName, description, location, river, samplingDate, files } = req.body;

  if (!datasetName || !files || files.length === 0) {
    return res.status(400).json({ error: "datasetName and files array are required." });
  }

  const userId = req.user?.id || null;
  let datasetId = null;

  try {
    // 1. Create dataset record (if DB enabled)
    if (isDatabaseConfigured()) {
      const dResult = await query(
        `INSERT INTO datasets (name, description, location, river, uploaded_by)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [datasetName, description || null, location || null, river || null, userId]
      );
      datasetId = dResult.rows[0].id;
    } else {
      // Local fallback: create dataset folder in data/sample-files
      const datasetFolder = path.join(__dirname, "../data/sample-files", datasetName.replace(/[^a-z0-9_-]/gi, '_'));
      if (!fs.existsSync(datasetFolder)) fs.mkdirSync(datasetFolder, { recursive: true });
    }

    let totalInserted = 0;
    const processedFiles = [];
    const errors = [];

    // 2. Process each file
    for (const f of files) {
      const tempPath = path.join(UPLOAD_DIR, f.tempFilename);
      if (!fs.existsSync(tempPath)) {
        errors.push(`${f.originalName}: temp file lost`);
        continue;
      }

      try {
        const rows = parseFile(tempPath, f.originalName);
        const checksum = computeChecksum(tempPath);
        
        // Copy to originals
        const originalsPath = path.join(ORIGINALS_DIR, f.tempFilename + "-" + f.originalName);
        fs.copyFileSync(tempPath, originalsPath);

        if (isDatabaseConfigured()) {
          // Resolve station_id
          let stationId = null;
          if (f.stationCode) {
            const stRes = await query("SELECT id FROM stations WHERE code = $1", [f.stationCode.toUpperCase()]);
            if (stRes.rows.length > 0) stationId = stRes.rows[0].id;
          }

          // Insert sample_file
          const sfResult = await query(
            `INSERT INTO sample_files (dataset_id, file_name, station_id, station_code, sampling_date, uploaded_by, checksum, source_type)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'upload')
             RETURNING id`,
            [datasetId, f.originalName, stationId, f.stationCode?.toUpperCase() || null, samplingDate || null, userId, checksum]
          );
          const sampleFileId = sfResult.rows[0].id;

          let fileInserted = 0;
          for (const row of rows) {
            const name = (row["Name"] || "").trim();
            if (!name) continue;

            const normalizedName = name.toLowerCase().replace(/\s+/g, " ").trim();
            const formula = (row["Formula"] || "").trim();
            const category = (row["Category"] || "").trim() || null;

            const cResult = await query(
              `INSERT INTO compounds (name, normalized_name, formula, category)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (normalized_name, COALESCE(formula, ''), COALESCE(category, ''))
               DO UPDATE SET name = EXCLUDED.name RETURNING id`,
              [name, normalizedName, formula || null, category]
            );
            const compoundId = cResult.rows[0].id;

            const mz = parseFloat(row["m/z"]) || null;
            const rt = parseFloat(row["RT [min]"]) || null;
            const area = parseFloat(row["Area (Max.)"]) || null;
            const calcMw = parseFloat(row["Calc. MW"]) || null;

            try {
              await query(
                `INSERT INTO compound_observations
                   (sample_file_id, compound_id, mz, rt_min, area_max, calc_mw, raw_record)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 ON CONFLICT DO NOTHING`,
                [sampleFileId, compoundId, mz, rt, area, calcMw, JSON.stringify(row)]
              );
              fileInserted++;
              totalInserted++;
            } catch (e) {}
          }
          processedFiles.push({ file: f.originalName, inserted: fileInserted });

        } else {
          // Local fallback: save in dataset folder
          const datasetFolder = path.join(__dirname, "../data/sample-files", datasetName.replace(/[^a-z0-9_-]/gi, '_'));
          const destPath = path.join(datasetFolder, f.originalName);
          fs.copyFileSync(tempPath, destPath);
          totalInserted += rows.length;
          processedFiles.push({ file: f.originalName, inserted: rows.length });
        }

        // Clean temp
        fs.unlinkSync(tempPath);
      } catch (err) {
        errors.push(`${f.originalName}: ${err.message}`);
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      }
    }

    if (isDatabaseConfigured()) {
      query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata) VALUES ($1, 'upload_dataset', 'dataset', $2, $3)`,
        [userId, datasetId, JSON.stringify({ datasetName, filesCount: files.length, totalInserted, errors })]
      ).catch(() => {});
    }

    return res.json({
      message: "Dataset imported successfully.",
      datasetId,
      totalInserted,
      processedCount: processedFiles.length,
      errors
    });

  } catch (err) {
    console.error("Confirm dataset upload error:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// ── DELETE /api/upload/cancel ─────────────────────────────────────────
const cancelUpload = (req, res) => {
  const { files } = req.body; // array of tempFilenames
  if (Array.isArray(files)) {
    files.forEach(f => {
      const tempPath = path.join(UPLOAD_DIR, f);
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    });
  }
  res.json({ message: "Upload cancelled." });
};

module.exports = { previewUpload, confirmUpload, cancelUpload };
