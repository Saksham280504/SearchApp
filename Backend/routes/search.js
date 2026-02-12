// const  { readExcel } = require("../utils/excelFileReader");
const { TextToJSON } = require("../utils/TextToJson");
const { filterByCategory, filterByCompoundName } = require("../utils/searchLogic");
const { CreateExcelFile } = require("../utils/CreateExcelFile");
const fs = require('fs');
const path =require('path');

const searchRequest = (keyword, searchType) => {
  let CompoundSearchResults = [];
  let CategorySearchResults = {};
if (searchType === "category") {
  const DATA_DIR = path.join(__dirname, "../data");
  const fileName = "ExploSpreadsheet.txt";
  const filePath = path.join(DATA_DIR, fileName);

  if (!fs.existsSync(filePath)) return null;

  const data = TextToJSON(filePath);
  CategorySearchResults = filterByCategory(data, keyword);

  if (CategorySearchResults && Object.keys(CategorySearchResults).length > 0) {
    return CategorySearchResults;
  }
  return null;
}


    else if(searchType === "compound"){
      const DATA_DIR = path.join(__dirname, "../data/Sample files");
      const files = fs.readdirSync(DATA_DIR).filter(file => file.endsWith(".txt"));
      files.forEach(file => {
        const filePath = path.join(DATA_DIR, file);
        // const data = readExcel(filePath);
        const data = TextToJSON(filePath);
        const results = filterByCompoundName(data, keyword);
        CompoundSearchResults = CompoundSearchResults.concat(results);
      });
      if(CompoundSearchResults.length > 0 ) {
        const outputFilePath = CreateExcelFile(CompoundSearchResults);
        return outputFilePath;
      }
      return null;
    }
}

module.exports = { searchRequest };