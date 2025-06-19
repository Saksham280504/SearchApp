const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());  

// const { readExcel } = require("./utils/excelFileReader");
const { TextToJSON } = require("./utils/TextToJson");

const OUTPUT_DIR = path.join(__dirname, "filtered");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

const { searchRequest } = require("./routes/search");
const { CompoundResultsDisplay } = require("./routes/display");

app.post("/search", (req,res) => {
  const {keyword, searchType } = req.body;
  if(!keyword || !searchType) {
    return res.status(400).json({error: "Missing search parameters"});
  }  

  const searchResult = searchRequest(keyword, searchType);
  const DisplayItemsResult = CompoundResultsDisplay(keyword, searchType);

  res.json({
    success: true,
    file: searchType === "compound" ? `http://localhost:5000/filtered/${path.basename(searchResult)}` : null,
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
  
  const DATA_DIR = path.join(__dirname, "./data/Sample files");
  // const files = fs.readdirSync(DATA_DIR).filter(file => file.endsWith(".xlsx"));
  const files = fs.readdirSync(DATA_DIR).filter(file => file.endsWith(".txt"));
  let suggestions = new Set(); // to avoid duplicates

  files.forEach(file => {
    const filePath = path.join(DATA_DIR, file);
    console.log("Reading:", filePath); // Debug log
    // const data = ReadExcel(filePath); // No Need of this noww!!
    const data = TextToJSON(filePath); // This won't crash now
    data.forEach(row => {
        if (row.Name && row.Name.toLowerCase().includes(query.toLowerCase())) {
            suggestions.add(row.Name);
        }
    });
  });

   res.json({ suggestions: Array.from(suggestions).slice(0, 10)}); // return only the first 10 suggestions
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
