// routes/search.js
const { readExcel } = require("../utils/excelFileReader");
const { TextToJSON } = require("../utils/TextToJson");
const { filterByCategory, filterByCompoundName } = require("../utils/searchLogic");
const { CreateExcelFile } = require("../utils/CreateExcelFile");
const fs = require('fs');
const path = require('path');

const searchRequest = (keyword, searchType) => {
  let CompoundSearchResults = [];
  let CategorySearchResults = {};

  if (searchType === "category") {
    const DATA_DIR = path.join(__dirname, "../data");
    const fileName = "ExploSpreadsheet.xlsx";
    const filePath = path.join(DATA_DIR, fileName);

    if (!fs.existsSync(filePath)) return null;

    const data = readExcel(filePath);

    // ── Case-insensitive substring match on the Category field ──────────
    // This covers all spelling variants in the data (e.g. "Metabolite",
    // "Metabolites", "mETABOLITE") as long as the keyword substring matches.
    const keywordLower = keyword.toLowerCase().trim();

    const matchedRows = data.filter(row => {
      const cat = (row["Category"] || "").toLowerCase().trim();
      return cat.includes(keywordLower);
    });

    if (matchedRows.length === 0) return null;

    // Build the same shape filterByCategory returns
    const names = [];
    const formulas = [];
    const seen = new Set();

    matchedRows.forEach(row => {
      const name = (row["Name"] || "").trim();
      const formula = (row["Formula"] || "").trim();
      // Deduplicate by name+formula
      const key = `${name}||${formula}`;
      if (!seen.has(key)) {
        seen.add(key);
        names.push(name);
        formulas.push(formula);
      }
    });

    CategorySearchResults = {
      Count: names.length,
      CompoundNames: names,
      CompoundFormulas: formulas,
    };

    if (CategorySearchResults.Count > 0) {
      return CategorySearchResults;
    }
    return null;
  }

  else if (searchType === "compound") {
    const DATA_DIR = path.join(__dirname, "../data/sample-files");
    const files = fs.readdirSync(DATA_DIR).filter(file => file.endsWith(".txt"));
    files.forEach(file => {
      const filePath = path.join(DATA_DIR, file);
      const data = TextToJSON(filePath);
      const results = filterByCompoundName(data, keyword);
      CompoundSearchResults = CompoundSearchResults.concat(results);
    });
    if (CompoundSearchResults.length > 0) {
      const outputFilePath = CreateExcelFile(CompoundSearchResults);
      return outputFilePath;
    }
    return null;
  }
};

module.exports = { searchRequest };