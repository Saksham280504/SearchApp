const xlsx = require('xlsx');
const path = require('path');

// Generic function to read Excel from given relative path
const readExcel = (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  return jsonData;
};

module.exports = { readExcel };
