const express = require("express");
const xlsx = require("xlsx");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());    

const OUTPUT_DIR = path.join(__dirname, "filtered");

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);


const searchExcelFiles = (keyword, searchType) => {

    let results1 = {};
    let results2 = [];

    if(searchType ==="category"){
        
        let CategorySearchResults = {};
        let CompoundNames=[];
        let CompoundFormulas=[];
        const DATA_DIR = path.join(__dirname, "data");
        const file = fs.readdirSync(DATA_DIR).filter(file => file ==="ExploSpreadsheet.xlsx");
        console.log(file);

        if(file.length === 0) return null;

        const filterCategory = (fileName) => {
            const filePath = path.join(DATA_DIR, fileName);
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const sheet = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

            const filteredData = sheet.filter(row => {
                    return row.Category && row.Category.toLowerCase().includes(keyword.toLowerCase());
            });
            if(filteredData.length === 0) return null; 

            CategorySearchResults = {
                CompoundNames: filteredData.map(row => row["Name"]),
                CompoundFormulas: filteredData.map(row => row["Formula"]),
                Count: filteredData.length
            };

            return CategorySearchResults;
        }

        results1 = filterCategory(file[0]);

        if(results1 && Object.keys(results1).length > 0) {
            return results1;
        }
        return null;
    }

    else if(searchType === "compound"){
        const DATA_DIR = path.join(__dirname, "./data/Sample files");
        const files = fs.readdirSync(DATA_DIR).filter(file => file.endsWith(".xlsx"));
        files.forEach(file => {
            const filePath = path.join(DATA_DIR, file);
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const sheet = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

            const filteredData = sheet.filter(row => {
                return row.Name && row.Name.toLowerCase().includes(keyword.toLowerCase());
            });

            results2 = results2.concat(filteredData);
        });

        if(results2.length > 0){
            const newWorkbook = xlsx.utils.book_new();
            const newSheet = xlsx.utils.json_to_sheet(results2);
            xlsx.utils.book_append_sheet(newWorkbook, newSheet, "Filtered Results");
            const outputFilePath = path.join(OUTPUT_DIR, `results_${Date.now()}.xlsx`);
            xlsx.writeFile(newWorkbook, outputFilePath);
            return outputFilePath;
        }

        return null;
    };
};

const DisplayItems = (keyword,searchType) => {
    if (searchType !=='compound') return null;
    let DisplayItems = {};
    let mzValues = [];
    let sortedFilesNames = [];
    let retentionTimes = [];
    let molecularWeights = [];
    let ChemicalFormulas = [];
    let ms2Values = [];
    let areas = [];
    let ReferenceIons = [];
    
    const DATA_DIR = path.join(__dirname,"./data/Sample files");
    const files = fs.readdirSync(DATA_DIR).filter(file => file.endsWith(".xlsx"));
    files.forEach(file => {
        const filePath = path.join(DATA_DIR, file);
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const filteredData = sheet.filter(row => {
            return row.Name && row.Name.toLowerCase().includes(keyword.toLowerCase()) ? row: null;
        });

        if(filteredData.length > 0) {
            sortedFilesNames=sortedFilesNames.concat(file);
            mzValues = mzValues.concat(filteredData.map(row => row["m/z"]));
            retentionTimes = retentionTimes.concat(filteredData.map(row => row["RT [min]"]));
            molecularWeights = molecularWeights.concat(filteredData.map(row => row["Calc. MW"]));
            ChemicalFormulas = ChemicalFormulas.concat(filteredData.map(row => row["Formula"]));
            ms2Values = ms2Values.concat(filteredData.map(row => row["MS2"]));
            ReferenceIons = ReferenceIons.concat(filteredData.map(row => row["Reference Ion"]));
            areas = areas.concat(filteredData.map(row => row["Area (Max.)"]));
                if(sortedFilesNames.length > 0) {
                DisplayItems["fileNames"] = sortedFilesNames;
                }
                if(mzValues.length > 0) {
                DisplayItems["mzValues"] = mzValues;
                }
                if(retentionTimes.length > 0) {
                DisplayItems["retentionTimes"] = retentionTimes;
                }
                if(molecularWeights.length > 0) {
                DisplayItems["molecularWeights"] = molecularWeights;
                }
                if(ChemicalFormulas.length > 0) {
                DisplayItems["ChemicalFormulas"] = ChemicalFormulas;
                }
                if(ms2Values.length > 0) {
                DisplayItems["ms2Values"] = ms2Values;
                }
                if(ReferenceIons.length > 0) {
                DisplayItems["ReferenceIons"] = ReferenceIons;
                }
                if(areas.length > 0) {
                DisplayItems["areas"] = areas;
                }
        }
    })

    if(Object.keys(DisplayItems).length > 0) return DisplayItems;
    return null;
};

app.post("/search", (req,res) => {
    const { keyword, searchType } = req.body;
    if(!keyword || !searchType){
        return res.status(400).json({error: "Missing search parameters"});
    }

    const searchResult = searchExcelFiles(keyword, searchType);
    const DisplayItemsResult = DisplayItems(keyword, searchType);

    if (!searchResult) return res.json({success: false, message: "No matches found"});

    res.json({
        success: true,
        file: searchType === "compound"
            ? `http://localhost:5000/filtered/${path.basename(searchResult)}`
            : null,
        count: searchType === "category" ? searchResult.Count : undefined,
        compoundNames: searchType === "category" ? searchResult.CompoundNames : undefined,
        compoundFormulas: searchType === "category" ? searchResult.CompoundFormulas : undefined,
        ...DisplayItemsResult
    });
});    

app.use("/filtered", express.static(OUTPUT_DIR));

app.get("/autocomplete", (req,res) => {
    const { query } = req.query;
    if(!query) return res.status(400).json({error: "Missing query parameter"});

    const DATA_DIR = path.join(__dirname, "./data/Sample files");
    const files = fs.readdirSync(DATA_DIR).filter(file => file.endsWith(".xlsx"));

    let suggestions = new Set(); // to avoid duplicates

    files.forEach(file => {
        const filePath = path.join(DATA_DIR, file);
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
        sheet.forEach(row => {
            if(row.Name && row.Name.toLowerCase().includes(query.toLowerCase())){
                suggestions.add(row.Name);
            }
        });
    });
 res.json({ suggestions: Array.from(suggestions).slice(0, 10)}); // return only the first 10 suggestions
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
