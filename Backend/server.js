// const express = require("express");
// const xlsx = require("xlsx");
// const cors = require("cors");
// const fs = require("fs");
// const path = require("path");

// /*
// express: Web framework to create a server.
// xlsx: Library to read and write Excel files.
// cors: Allows frontend to communicate with the backend.
// fs: Helps manage files and directories.
// path: Handles file and directory paths.
// */
// const app = express();
// const PORT = 5000;

// app.use(cors());
// app.use(express.json());

// /*
// Creates the Express server (app).
// Sets the port to 5000.
// Allows JSON requests (important for handling search queries).
// Enables CORS (so frontend apps can call this API).
// */

// // Directory where Excel files are stored
// const DATA_DIR = path.join(__dirname, "data");
// const OUTPUT_DIR = path.join(__dirname, "filtered");

// // Ensure the output directory exists
// if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

// /*
// DATA_DIR: Path where all the Excel files are stored.
// OUTPUT_DIR: Path where filtered results will be saved.
// fs.existsSync(OUTPUT_DIR): Checks if filtered/ directory exists. If not, it creates one.
// */

// // Function to search in multiple Excel files
// const searchExcelFiles = (keyword, searchType) => {
//     let results = [];

//     // Read all Excel files in data directory
//     const files = fs.readdirSync(DATA_DIR).filter(file => file.endsWith(".xlsx"));
//     /*
//     Reads all the Excel files inside data/.
// Filters out only .xlsx files.
//     */

//     files.forEach(file => {
//         const filePath = path.join(DATA_DIR, file);
//         const workbook = xlsx.readFile(filePath);
//         const sheetName = workbook.SheetNames[0];
//         const sheet = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

//         /*
//         Opens each Excel file.
// Extracts the first sheet.
// Converts sheet data into JSON format (an array of objects).
//         */

//         // Filter based on Compound or Category
//         const filteredData = sheet.filter(row => {
//             if (searchType === "compound") {
//                 return row.Name && row.Name.toLowerCase().includes(keyword.toLowerCase());
//             } else if (searchType === "category") {
//                 return row.Category && row.Category.toLowerCase().includes(keyword.toLowerCase());
//             }
//             return false;
//         });

//         /*
//         If "Compound Search", it checks if row.Compound contains the keyword.
//         If "Category Search", it checks row.Category.
//         */

//         results = results.concat(filteredData);
//     });

//     /*
//     Appends matching rows to the results list.
//     */
    
//     // Create an output file if results exist
//     if (results.length > 0) {
//         const newWorkbook = xlsx.utils.book_new();
//         const newSheet = xlsx.utils.json_to_sheet(results);
//         xlsx.utils.book_append_sheet(newWorkbook, newSheet, "Filtered Results");

//         const outputFilePath = path.join(OUTPUT_DIR, `results_${Date.now()}.xlsx`);

//         xlsx.writeFile(newWorkbook, outputFilePath);
//         return outputFilePath;
//     }
    
//     return null;

//     /*
//     If there are matching results:
// Creates a new Excel file.
// Saves it in filtered/ directory.
// Returns the file path.
// If no results, returns null.
//     */
// };

// // API endpoint to perform the search
// app.post("/search", (req, res) => {
//     const { keyword, searchType } = req.body;
//     if (!keyword || !searchType) return res.status(400).json({ error: "Missing search parameters" });

//     /*
//     Extracts keyword and searchType from the request body.
// If any parameter is missing, it returns an error.
//     */

//     const filteredFilePath = searchExcelFiles(keyword, searchType);

//     /*
//     Calls the search function and gets the filtered file path.
//     */

//     if (!filteredFilePath) return res.json({ success: false, message: "No matches found" });

//     res.json({ success: true, file: `http://localhost:5000/filtered/${path.basename(filteredFilePath)}` });

//     /*
//     If no results, it sends { success: false, message: "No matches found" }.
// Otherwise, sends { success: true, file: "http://localhost:5000/filtered/results_timestamp.xlsx" }.
//     */
// });

// // Serve filtered files
// app.use("/filtered", express.static(OUTPUT_DIR));

//     /*
//     Makes filtered/ directory accessible via http://localhost:5000/filtered/.
//     */

// // Start server
// app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

//     /*
//     Starts the backend on port 5000.
//     */

