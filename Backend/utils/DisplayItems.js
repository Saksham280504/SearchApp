const DisplayItems = (data, keyword,file) => {
    const filteredData = data.filter(row => {
        return row.Name && row.Name.toLowerCase().includes(keyword.toLowerCase()) ? row: null;
    });

    if(filteredData.length > 0) {
        return filteredData.map(row => ({
            fileName: file, // Include the file name for this specific result
            mzValue: row["m/z"],
            retentionTime: row["RT [min]"],
            molecularWeight: row["Calc. MW"],
            chemicalFormula: row["Formula"],
            ms2Value: row["MS2"],
            referenceIon: row["Reference Ion"],
            area: row["Area (Max.)"],
        }));
    }
    return [];
}

module.exports = { DisplayItems };