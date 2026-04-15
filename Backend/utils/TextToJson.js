const fs = require("fs");

// Cache large parsed JSON objects in memory to prevent V8 from hitting 
// the 512MB heap limit by loading the same 120MB+ files back-to-back.
const fileCache = new Map();

const TextToJSON = (filePath) => {
  if (fileCache.has(filePath)) {
    return fileCache.get(filePath);
  }

  try {
    const data = fs.readFileSync(filePath, "utf8"); // Read as string
    const parsed = JSON.parse(data); // Attempt to parse JSON
    if (!Array.isArray(parsed)) {
      throw new Error("Parsed data is not an array.");
    }
    
    fileCache.set(filePath, parsed);
    return parsed;
  } catch (error) {
    console.error(`Error parsing JSON from file: ${filePath}`);
    console.error(error.message);
    return []; // return empty array to avoid breaking the loop
  }
};

module.exports = { TextToJSON };
