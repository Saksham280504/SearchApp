const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.port || 5000;

app.use(cors());
app.use(express.json());  

// const { readExcel } = require("./utils/excelFileReader");
const { TextToJSON } = require("./utils/TextToJson");

const { getSampleFileList, getAnalyticsData } = require("./routes/analytics");

const OUTPUT_DIR = path.join(__dirname, "filtered");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

const { searchRequest } = require("./routes/search");
const { CompoundResultsDisplay } = require("./routes/display");

app.post("/search", (req, res) => {
  try {
    const { keyword, searchType } = req.body;

    if (!keyword || !searchType) {
      return res.status(400).json({ error: "Missing search parameters" });
    }

    const searchResult = searchRequest(keyword, searchType);
    const displayItemsResult = CompoundResultsDisplay(keyword, searchType);

    if (searchType === "category" && !searchResult) {
      return res.status(404).json({
        success: false,
        message: "No matching category found",
      });
    }

    if (searchType === "compound" && !searchResult) {
      return res.status(404).json({
        success: false,
        message: "No matching compound found",
      });
    }

    return res.json({
      success: true,
      file:
        searchType === "compound"
          ? `${req.protocol}://${req.get("host")}/filtered/${path.basename(searchResult)}`
          : null,
      Compound: searchType === "compound" ? keyword : null,
      Count: searchType === "category" ? searchResult.Count : undefined,
      CompoundNames: searchType === "category" ? searchResult.CompoundNames : undefined,
      CompoundFormulas:
        searchType === "category" ? searchResult.CompoundFormulas : undefined,
      ...(displayItemsResult || {}),
    });
  } catch (error) {
    console.error("Error in /search:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error in /search",
      details: error.message,
    });
  }
});

app.use("/filtered", express.static(OUTPUT_DIR));

app.get("/autocomplete", (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: "Missing query parameter" });
    }

    const DATA_DIR = path.join(__dirname, "./data/Sample files");
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

    return res.json({ suggestions: Array.from(suggestions).slice(0, 10) });
  } catch (error) {
    console.error("Error in /autocomplete:", error);
    return res.status(500).json({
      error: "Internal server error in /autocomplete",
      details: error.message,
    });
  }
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
});