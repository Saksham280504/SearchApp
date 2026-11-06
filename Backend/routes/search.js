// routes/search.js
// File-scan fallback for when DATABASE_URL is not configured.
// Returns a unified object so server.js doesn't need a second scan pass.

const { TextToJSON, clearCache } = require("../utils/TextToJson");
const { filterByCategory, filterByCompoundName } = require("../utils/searchLogic");
const { CreateExcelFile } = require("../utils/CreateExcelFile");
const fs = require("fs");
const path = require("path");

/**
 * searchRequest(keyword, searchType)
 *
 * For "category": returns { Count, CompoundNames, CompoundFormulas } or null.
 *
 * For "compound": returns {
 *   filePath: string | null,        -- absolute path to the generated Excel file
 *   displayData: {                  -- ready to spread into the HTTP response
 *     fileNames, mzValues, retentionTimes, molecularWeights,
 *     ChemicalFormulas, ms2Values, ReferenceIons, areas
 *   }
 * } or null if nothing found.
 */
const searchRequest = (keyword, searchType) => {
  // Clear cache at the beginning of each search to prevent Heap OOM
  clearCache();

  // ── Category search ───────────────────────────────────────────────
  if (searchType === "category") {
    const DATA_DIR = path.join(__dirname, "../data");
    const optimizedPath = path.join(DATA_DIR, "OptimizedCategoryData.json");

    if (!fs.existsSync(optimizedPath)) {
      const { readExcel } = require("../utils/excelFileReader");
      const xlsxPath = path.join(DATA_DIR, "ExploSpreadsheet.xlsx");
      if (!fs.existsSync(xlsxPath)) return null;

      const excelData = readExcel(xlsxPath);
      const optimized = excelData.map((row) => ({
        Category: row["Category"] || "",
        Name: row["Name"] || "",
        Formula: row["Formula"] || "",
      }));
      fs.writeFileSync(optimizedPath, JSON.stringify(optimized));
    }

    const data = TextToJSON(optimizedPath);
    const { getVariations } = require("../utils/categoryMapper");
    const variations = getVariations(keyword).map(v => v.toLowerCase());

    const matchedRows = data.filter((row) => {
      const cat = (row["Category"] || "").toLowerCase().trim();
      return variations.includes(cat);
    });

    if (matchedRows.length === 0) return null;

    const names = [];
    const formulas = [];
    const seen = new Set();

    matchedRows.forEach((row) => {
      const name = (row["Name"] || "").trim();
      const formula = (row["Formula"] || "").trim();
      const key = `${name}||${formula}`;
      if (!seen.has(key)) {
        seen.add(key);
        names.push(name);
        formulas.push(formula);
      }
    });

    if (names.length === 0) return null;
    return { Count: names.length, CompoundNames: names, CompoundFormulas: formulas };
  }

  // ── Compound search — single pass builds BOTH the Excel export AND display data ──
  if (searchType === "compound") {
    const DATA_DIR = path.join(__dirname, "../data/sample-files");
    const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".txt"));

    // Accumulate export rows (for Excel) and display rows (for HTTP response)
    const exportRows = [];
    const fileNames = [];
    const mzValues = [];
    const retentionTimes = [];
    const molecularWeights = [];
    const ChemicalFormulas = [];
    const ms2Values = [];
    const ReferenceIons = [];
    const areas = [];

    files.forEach((file) => {
      const filePath = path.join(DATA_DIR, file);
      const data = TextToJSON(filePath);
      const results = filterByCompoundName(data, keyword);

      results.forEach((row) => {
        // For Excel export
        exportRows.push({
          File: file,
          Name: row["Name"] || "",
          Formula: row["Formula"] || "",
          "m/z": row["m/z"],
          "RT [min]": row["RT [min]"],
          "Calc. MW": row["Calc. MW"],
          MS2: row["MS2"] || "",
          "Reference Ion": row["Reference Ion"] || "",
          "Area (Max.)": row["Area (Max.)"],
        });

        // For display data
        fileNames.push(file);
        mzValues.push(row["m/z"]);
        retentionTimes.push(row["RT [min]"]);
        molecularWeights.push(row["Calc. MW"]);
        ChemicalFormulas.push(row["Formula"] || "");
        ms2Values.push(row["MS2"] || "");
        ReferenceIons.push(row["Reference Ion"] || "");
        areas.push(row["Area (Max.)"]);
      });
    });

    if (exportRows.length === 0) return null;

    const outputFilePath = CreateExcelFile(exportRows);

    return {
      filePath: outputFilePath,
      displayData: {
        fileNames,
        mzValues,
        retentionTimes,
        molecularWeights,
        ChemicalFormulas,
        ms2Values,
        ReferenceIons,
        areas,
      },
    };
  }

  return null;
};

module.exports = { searchRequest };