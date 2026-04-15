// routes/analytics.js
const { TextToJSON } = require("../utils/TextToJson");
const fs = require('fs');
const path = require('path');

const SAMPLE_DIR = path.join(__dirname, "../data/sample-files");

/**
 * Returns list of all sample .txt file names (without extension)
 */
const getSampleFileList = () => {
  const files = fs.readdirSync(SAMPLE_DIR).filter(f => f.endsWith(".txt"));
  return files.map(f => f.replace(".txt", ""));
};

/**
 * Returns all compound rows for the selected files.
 * Each row is normalized and injected with the fileName.
 */
const getAnalyticsData = (selectedFiles) => {
  const result = {};

  selectedFiles.forEach(fileName => {
    const filePath = path.join(SAMPLE_DIR, `${fileName}.txt`);
    if (!fs.existsSync(filePath)) {
      console.error("File not found:", filePath);
      return;
    }
    const rows = TextToJSON(filePath);
    result[fileName] = rows.map(row => ({
      name: row["Name"] || "",
      formula: row["Formula"] || "",
      mz: parseFloat(row["m/z"]) || 0,
      rt: parseFloat(row["RT [min]"]) || 0,
      area: parseFloat(row["Area (Max.)"]) || 0,
      ms2: row["MS2"] || "",
      referenceIon: row["Reference Ion"] || "",
      calcMW: parseFloat(row["Calc. MW"]) || 0,
    }));
  });

  return result;
};

module.exports = { getSampleFileList, getAnalyticsData };