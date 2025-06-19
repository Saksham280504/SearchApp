const fs = require("fs");

const TextToJSON = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, "utf8"); // Read as string
    const parsed = JSON.parse(data); // Attempt to parse JSON
    if (!Array.isArray(parsed)) {
      throw new Error("Parsed data is not an array.");
    }
    return parsed;
  } catch (error) {
    console.error(`Error parsing JSON from file: ${filePath}`);
    console.error(error.message);
    return []; // return empty array to avoid breaking the loop
  }
};

module.exports = { TextToJSON };
