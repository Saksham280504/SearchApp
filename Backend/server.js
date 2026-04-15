// Backend/server.js
const express = require('express');
const fs      = require('fs');
const path    = require('path');
const cors    = require('cors');

const app  = express();
// ── Use Render's injected PORT, fall back to 5000 locally ──────────
const PORT = process.env.PORT || 5000;

// ── CORS: allow your Vercel frontend (and localhost for dev) ────────
const ALLOWED_ORIGINS = [
  "https://search-app-eight-blush.vercel.app",  // ← your Vercel URL
  "http://localhost:5173",                        // Vite dev server
  "http://localhost:4173",                        // Vite preview
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, Render health checks)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// Handle preflight for all routes
app.options("*", cors());

app.use(express.json());

// ── Utilities & routes ─────────────────────────────────────────────
const { TextToJSON }            = require("./utils/TextToJson");
const OUTPUT_DIR                = path.join(__dirname, "filtered");
const { searchRequest }         = require("./routes/search");
const { CompoundResultsDisplay } = require("./routes/display");
const { listSampleFiles, getAnalyticsData } = require("./routes/analytics");

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

// ── Health check (Render pings this to keep the instance warm) ─────
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "SearchApp Backend is running" });
});

// ── Search endpoint ────────────────────────────────────────────────
app.post("/search", (req, res) => {
  const { keyword, searchType } = req.body;
  if (!keyword || !searchType) {
    return res.status(400).json({ error: "Missing search parameters" });
  }

  const searchResult       = searchRequest(keyword, searchType);
  const DisplayItemsResult = CompoundResultsDisplay(keyword, searchType);

  if (searchType === "category" && !searchResult) {
    return res.status(500).json({
      success: false,
      message: "No matching category found",
    });
  }

  // ── Build the file download URL using the actual host, not localhost
  let fileUrl = null;
  if (searchType === "compound" && searchResult) {
    const HOST = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
    fileUrl = `${HOST}/filtered/${path.basename(searchResult)}`;
  }

  res.json({
    success: true,
    file: fileUrl,
    Compound: searchType === "compound" ? keyword : null,
    Count:          searchType === "category" ? searchResult.Count          : undefined,
    CompoundNames:  searchType === "category" ? searchResult.CompoundNames  : undefined,
    CompoundFormulas: searchType === "category" ? searchResult.CompoundFormulas : undefined,
    ...DisplayItemsResult,
  });
});

// Serve generated Excel files
app.use("/filtered", express.static(OUTPUT_DIR));

// ── Autocomplete endpoint ──────────────────────────────────────────
app.get("/autocomplete", (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: "Missing query parameter" });

  const DATA_DIR = path.join(__dirname, "./data/Sample files");
  const files    = fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".txt"));
  const suggestions = new Set();

  files.forEach(file => {
    const data = TextToJSON(path.join(DATA_DIR, file));
    data.forEach(row => {
      if (row.Name && row.Name.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(row.Name);
      }
    });
  });

  res.json({ suggestions: Array.from(suggestions).slice(0, 10) });
});

// ── Analytics endpoints ────────────────────────────────────────────
app.get("/analytics/files", (req, res) => {
  try {
    res.json({ success: true, files: listSampleFiles() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to list sample files" });
  }
});

app.post("/analytics/data", (req, res) => {
  const { selectedFiles } = req.body;
  if (!selectedFiles || !Array.isArray(selectedFiles) || selectedFiles.length === 0) {
    return res.status(400).json({ success: false, error: "No files selected" });
  }
  try {
    res.json({ success: true, data: getAnalyticsData(selectedFiles) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to fetch analytics data" });
  }
});

app.listen(PORT, () => {
  console.log(`SearchApp backend running on port ${PORT}`);
});