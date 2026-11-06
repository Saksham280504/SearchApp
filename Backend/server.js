require("dotenv").config();

const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { authenticate } = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 5000;

const ALLOWED_ORIGINS = [
  "https://search-app-frontend-iigq.onrender.com",
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:4173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.options("*", cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ── Rate limiting for search (prevent abuse) ───────────────────────────
const searchLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 60,               // 60 searches per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
});

// ── Static file serving ──────────────────────────────────────────────
const OUTPUT_DIR = path.join(__dirname, "filtered");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);
app.use("/filtered", express.static(OUTPUT_DIR));

// ── Utilities & Route handlers ───────────────────────────────────────
const { TextToJSON } = require("./utils/TextToJson");
const { searchRequest } = require("./routes/search");
const { getSampleFileList, getAnalyticsData } = require("./routes/analytics");
const { CreateExcelFile } = require("./utils/CreateExcelFile");
const {
  isDatabaseConfigured,
  searchCompound,
  searchCategory,
  autocompleteCompounds,
} = require("./repositories/searchRepository");

// ── API Routers ──────────────────────────────────────────────────────
// Phase 2: Auth router (public — no authenticate wrapper)
app.use("/api/auth", require("./routes/authRouter"));

// Phase 3: Upload router (researcher + admin only)
app.use("/api/upload", require("./routes/uploadRouter"));

// Phase 4: Analytics (time-series + GIS map)
app.use("/api/analytics", require("./routes/analyticsRouter"));

// Phase 5: Reports + Thresholds
app.use("/api/reports", require("./routes/reportsRouter"));

// Phase 4/5 Refinement: Datasets
app.use("/api/datasets", require("./routes/datasetRouter"));

// Phase 4/5 Refinement: RAG Chat
app.use("/api/chat", require("./routes/chatRouter"));

// ── Health check ─────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "SearchApp Backend is running",
    searchBackend: isDatabaseConfigured() ? "postgres-indexed" : "file-scan",
  });
});

// ── Helper: build a unified result shape from DB rows ─────────────────
const buildLegacyResponseFromDB = (dbResult, keyword, PORT) => {
  const HOST =
    process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  const filePath =
    dbResult.exportRows.length > 0
      ? CreateExcelFile(dbResult.exportRows)
      : null;

  return {
    ...dbResult.legacy,
    file: filePath ? `${HOST}/filtered/${path.basename(filePath)}` : null,
  };
};

// ── Search endpoint (requires auth) ─────────────────────────────────
app.post("/search", authenticate, searchLimiter, async (req, res) => {
  const { keyword, searchType } = req.body;

  if (!keyword || !searchType) {
    return res.status(400).json({ error: "Missing search parameters" });
  }

  // ── Indexed DB path ───────────────────────────────────────────────
  if (isDatabaseConfigured()) {
    try {
      if (searchType === "compound") {
        const dbResult = await searchCompound(keyword);
        return res.json(buildLegacyResponseFromDB(dbResult, keyword, PORT));
      }

      if (searchType === "category") {
        const categoryResult = await searchCategory(keyword);
        if (!categoryResult) {
          return res
            .status(404)
            .json({ success: false, message: "No matching category found" });
        }
        return res.json({ success: true, file: null, Compound: null, ...categoryResult });
      }
    } catch (error) {
      console.error(
        "Indexed search failed, falling back to file scan:",
        error.message
      );
    }
  }

  // ── File-scan fallback ─────────────────────────────────────────────
  const searchResult = searchRequest(keyword, searchType);

  if (searchType === "category") {
    if (!searchResult) {
      return res
        .status(404)
        .json({ success: false, message: "No matching category found" });
    }
    return res.json({ success: true, file: null, Compound: null, ...searchResult });
  }

  // compound path — searchResult.filePath + searchResult.displayData (unified shape)
  if (searchType === "compound") {
    if (!searchResult) {
      return res.json({ success: false, file: null, Compound: keyword, fileNames: [], mzValues: [], retentionTimes: [], molecularWeights: [], ChemicalFormulas: [], ms2Values: [], ReferenceIons: [], areas: [] });
    }
    const HOST = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
    const fileUrl = searchResult.filePath
      ? `${HOST}/filtered/${path.basename(searchResult.filePath)}`
      : null;
    return res.json({
      success: true,
      file: fileUrl,
      Compound: keyword,
      ...searchResult.displayData,
    });
  }
});

// ── Autocomplete endpoint (requires auth) ────────────────────────────
app.get("/autocomplete", authenticate, async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: "Missing query parameter" });

  if (isDatabaseConfigured()) {
    try {
      const suggestions = await autocompleteCompounds(query);
      return res.json({ suggestions });
    } catch (error) {
      console.error(
        "Indexed autocomplete failed, falling back to file scan:",
        error.message
      );
    }
  }

  const DATA_DIR = path.join(__dirname, "./data/sample-files");
  const files = fs.readdirSync(DATA_DIR).filter((file) => file.endsWith(".txt"));
  const suggestions = new Set();

  files.forEach((file) => {
    const filePath = path.join(DATA_DIR, file);
    const data = TextToJSON(filePath);
    data.forEach((row) => {
      if (row.Name && row.Name.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(row.Name);
      }
    });
  });

  res.json({ suggestions: Array.from(suggestions).slice(0, 10) });
});

// ── Analytics endpoints (requires auth) ─────────────────────────────
app.get("/analytics/files", authenticate, (req, res) => {
  try {
    const files = getSampleFileList();
    res.json({ files });
  } catch (err) {
    res.status(500).json({ error: "Failed to list sample files" });
  }
});

app.post("/analytics/data", authenticate, (req, res) => {
  const { files } = req.body;
  if (!files || !Array.isArray(files) || files.length === 0) {
    return res
      .status(400)
      .json({ error: "Provide an array of file names in 'files'" });
  }
  try {
    const data = getAnalyticsData(files);
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: "Failed to load analytics data" });
  }
});

// ── Stations endpoint (requires auth) ───────────────────────────────
app.get("/api/stations", authenticate, async (req, res) => {
  if (isDatabaseConfigured()) {
    try {
      const { query } = require("./db/pool");
      const { rows } = await query(
        "SELECT id, code, name, river, district, state, latitude, longitude FROM stations ORDER BY code"
      );
      return res.json({ stations: rows });
    } catch (err) {
      console.error("Failed to fetch stations from DB:", err.message);
    }
  }
  // Fallback to seed data
  const { stations } = require("./seeds/stations");
  res.json({ stations });
});

// ── Start server ──────────────────────────────────────────────────────

const { initVectorStore } = require("./services/ragService");

app.listen(PORT, async () => {
  console.log(`\n======================================`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`======================================\n`);
  
  // Background init of RAG vector store
  setTimeout(() => initVectorStore().catch(console.error), 2000);
});
