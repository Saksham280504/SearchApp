import React, { useState, useEffect } from "react";
import { useDispatch ,useSelector } from "react-redux";
import { fetchSearchResults, fetchAutocompleteResults } from "../../../redux/searchSlice";

function ResultComponent() {
    const dispatch = useDispatch();
    const { fileNames, downloadLink, error, suggestions, mzValues, retentionTimes, molecularWeights, ChemicalFormulas, ms2Values, ReferenceIons, areas, count, compoundNames, compoundFormulas} = useSelector((state) => state.search);
    const [keyword, setKeyword] = useState("");
    const [searchType, setSearchType] = useState("compound");
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        if (keyword.length > 2) {  // Fetch suggestions only if input length > 2
            dispatch(fetchAutocompleteResults(keyword));
        }
    }, [keyword, dispatch]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (!keyword) return alert("Enter a search keyword");
        setShowSuggestions(false);  // Hide suggestions after search
        dispatch(fetchSearchResults({ keyword, searchType }));
    };
    
    console.log(mzValues);

    return (
                            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Compound & Category Search</h1>

            <form onSubmit={handleSearch} className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Enter search keyword"
                        value={keyword}
                        onChange={(e) => {
                            setKeyword(e.target.value);
                            if(e.target.value.length > 2) setShowSuggestions(true);
                            else setShowSuggestions(false); // Hide suggestions if input is cleared
                        }}
                        required
                        autoComplete="off"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                    />

                    {/* Suggestions Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-md max-h-40 overflow-y-auto">
                            {suggestions.map((suggestion, index) => (
                                <li
                                    key={index}
                                    className="p-2 hover:bg-gray-200 cursor-pointer"
                                    onClick={() => {
                                        setKeyword(suggestion);
                                        setShowSuggestions(false);
                                    }}
                                >
                                    {suggestion}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="flex items-center space-x-4 mb-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="radio"
                            id="compound"
                            name="searchType"
                            value="compound"
                            checked={searchType === "compound"}
                            onChange={(e) => setSearchType(e.target.value)}
                            className="w-4 h-4"
                        />
                        <span className="text-gray-700">Compound Search</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="radio"
                            id="category"
                            name="searchType"
                            value="category"
                            checked={searchType === "category"}
                            onChange={(e) => setSearchType(e.target.value)}
                            className="w-4 h-4"
                        />
                        <span className="text-gray-700">Category Search</span>
                    </label>
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-all"
                >
                    Search
                </button>
            </form>
            {error && <p className="text-red-500 mt-4">{error}</p>}

            {fileNames.length > 0 && (
                <div className="overflow-x-auto mt-6 w-full max-w-6xl bg-white p-4 rounded-lg shadow-md">
  <h3 className="text-lg font-bold text-gray-800 mb-4">Matching Files and their properties:</h3>
  <div className="grid grid-cols-8 gap-4 text-sm text-gray-800">
    <div className="font-bold">File Names</div>
    <div className="font-bold">m/z Values</div>
    <div className="font-bold">Retention Times</div>
    <div className="font-bold">Molecular Weights</div>
    <div className="font-bold">Chemical Formulas</div>
    <div className="font-bold">MS2 Values</div>
    <div className="font-bold">Reference Ions</div>
    <div className="font-bold">Areas</div>

    {fileNames.map((_, index) => (
      <React.Fragment key={index}>
        <div>{fileNames[index].split('_ALL')[0]}</div>
        <div>{mzValues[index]}</div>
        <div>{retentionTimes[index]}</div>
        <div>{molecularWeights[index]}</div>
        <div>{ChemicalFormulas[index]}</div>
        <div>{ms2Values[index]}</div>
        <div>{ReferenceIons[index]}</div>
        <div>{areas[index]}</div>
      </React.Fragment>
    ))}
  </div>
</div>
    )}
    {count > 0 && (
        <> 
                <div className="font-bold">Total Matches Found: {count}</div>
                <div className="grid grid-cols-8 gap-4 text-sm text-gray-800">
                    <div className="font-bold">Compound Names</div>
                    <div className="font-bold">Compound Formulas</div>
                    {compoundNames.map((_, index) => (
                        <React.Fragment key={index}> 
                            <div>{compoundNames[index]}</div>
                            <div>{compoundFormulas[index]}</div>
                        </React.Fragment>
                    ))}
                </div>
                </>
                )}
            {downloadLink && (
                <a
                    href={downloadLink}
                    className="mt-6 p-4 bg-green-500 text-white rounded-lg shadow-md w-full max-w-md text-center hover:bg-green-600 transition-all"
                >
                    Download Results
                </a>
            )}
                    </div>
                    
)}

export default ResultComponent;

