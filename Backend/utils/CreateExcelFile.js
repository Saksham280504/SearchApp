const xlsx = require('xlsx');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, "../filtered");

const CreateExcelFile = (CompoundSearchResults) => {
    const newWorkbook = xlsx.utils.book_new();
    const newSheet = xlsx.utils.json_to_sheet(CompoundSearchResults);
    xlsx.utils.book_append_sheet(newWorkbook, newSheet, "Filtered Results");
    const outputFilePath = path.join(OUTPUT_DIR, `results_${Date.now()}.xlsx`);
    xlsx.writeFile(newWorkbook, outputFilePath);
    return outputFilePath;
}

module.exports = { CreateExcelFile };