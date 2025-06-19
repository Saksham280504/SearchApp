// routes/display.js
const { DisplayItems } = require("../utils/DisplayItems");
// const { readExcel } = require("../utils/excelFileReader");
const { TextToJSON } = require("../utils/TextToJson");
const fs = require('fs');
const path = require('path');

const CompoundResultsDisplay = (keyword, searchType) => {
    if (searchType !== "compound") return null;

    const DATA_DIR = path.join(__dirname, "../data/Sample files");
    const files = fs.readdirSync(DATA_DIR).filter(file => file.endsWith(".txt"));

    // Initialize all results as empty arrays for aggregation
    let allFileNames = [];
    let allMzValues = [];
    let allRetentionTimes = [];
    let allMolecularWeights = [];
    let allChemicalFormulas = [];
    let allMs2Values = [];
    let allReferenceIons = [];
    let allAreas = [];

    files.forEach(file => {
        const filePath = path.join(DATA_DIR, file);
        // const data = readExcel(filePath);
        const data = TextToJSON(filePath);
        // DisplayItems now returns an array of objects for the current file
        const fileSpecificResults = DisplayItems(data, keyword, file);

        if (fileSpecificResults.length > 0) {
            // Append the results from the current file to the aggregated arrays
            fileSpecificResults.forEach(item => {
                allFileNames.push(item.fileName);
                allMzValues.push(item.mzValue);
                allRetentionTimes.push(item.retentionTime);
                allMolecularWeights.push(item.molecularWeight);
                allChemicalFormulas.push(item.chemicalFormula);
                allMs2Values.push(item.ms2Value);
                allReferenceIons.push(item.referenceIon);
                allAreas.push(item.area);
            });
        }
    });

    if (allFileNames.length > 0) {
        return {
            fileNames: allFileNames,
            mzValues: allMzValues,
            retentionTimes: allRetentionTimes,
            molecularWeights: allMolecularWeights,
            ChemicalFormulas: allChemicalFormulas,
            ms2Values: allMs2Values,
            ReferenceIons: allReferenceIons,
            areas: allAreas,
        };
    }
    return { // Always return an object with empty arrays if no results, to match frontend state structure
        fileNames: [],
        mzValues: [],
        retentionTimes: [],
        molecularWeights: [],
        ChemicalFormulas: [],
        ms2Values: [],
        ReferenceIons: [],
        areas: [],
    };
}

module.exports = { CompoundResultsDisplay };