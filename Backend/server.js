const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

const ALLOWED_ORIGINS = [  // ← prospective Render URL
  process.env.FRONTEND_URL,                      // Allows setting via Render dashboard
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
app.options("*", cors());

app.use(express.json());  

// Utilities & Routes
const { TextToJSON } = require("./utils/TextToJson");
const OUTPUT_DIR = path.join(__dirname, "filtered");
const { searchRequest } = require("./routes/search");
const { CompoundResultsDisplay } = require("./routes/display");
const { getSampleFileList, getAnalyticsData } = require("./routes/analytics");

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

// ── Health check (Render pings this to keep the instance warm) ─────
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "SearchApp Backend is running" });
});

// Search EndPoint
app.post("/search", (req,res) => {
  const {keyword, searchType } = req.body;
  if(!keyword || !searchType) {
    return res.status(400).json({error: "Missing search parameters"});
  }  

  const searchResult = searchRequest(keyword, searchType);
  const DisplayItemsResult = CompoundResultsDisplay(keyword, searchType);

  if (searchType === "category" && !searchResult) {
  return res.status(500).json({
    success: false,
    message: "No matching category found"
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
    Count: searchType === "category" ? searchResult.Count : undefined,
    CompoundNames: searchType === "category" ? searchResult.CompoundNames : undefined,
    CompoundFormulas: searchType === "category" ? searchResult.CompoundFormulas : undefined,
    ...DisplayItemsResult
  });
  });

app.use("/filtered", express.static(OUTPUT_DIR));

app.get("/autocomplete", (req,res) => {
  const { query } = req.query;
  if(!query ) return res.status(400).json({error: "Missing query parameter"});
  
  const DATA_DIR = path.join(__dirname, "./data/sample-files");
  // const files = fs.readdirSync(DATA_DIR).filter(file => file.endsWith(".xlsx"));
  const files = fs.readdirSync(DATA_DIR).filter(file => file.endsWith(".txt"));
  let suggestions = new Set(); // to avoid duplicates

  files.forEach(file => {
    const filePath = path.join(DATA_DIR, file);
    console.log("Reading:", filePath); // Debug log
    const data = TextToJSON(filePath); // This won't crash now
    data.forEach(row => {
      if (row.Name && row.Name.toLowerCase().includes(query.toLowerCase())) {
           suggestions.add(row.Name);
            }
              });
               });

   res.json({ suggestions: Array.from(suggestions).slice(0, 10)}); // return only the first 10 suggestions
   });

   // Returns the list of available sample file names
app.get("/analytics/files", (req, res) => {
  try {
    const files = getSampleFileList();
    res.json({ files });
  } catch (err) {
    res.status(500).json({ error: "Failed to list sample files" });
  }
});

// Accepts a JSON body: { files: ["SBW1_ALL_COMP...", "SD1_ALL_Compou..."] }
// Returns all compound data for those files, keyed by file name
app.post("/analytics/data", (req, res) => {
  const { files } = req.body;
  if (!files || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: "Provide an array of file names in 'files'" });
  }
  try {
    const data = getAnalyticsData(files);
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: "Failed to load analytics data" });
  }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})