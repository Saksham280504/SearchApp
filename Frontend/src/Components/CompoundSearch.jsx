import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  fetchSearchResults,
  fetchAutocompleteResults,
  clearSearchResults,
  saveCurrentSearch,
  clearSavedSearches,
} from "../../redux/searchSlice";

function CompoundSearch() {
  const dispatch = useDispatch();

  const {
    fileNames, downloadLink, error, suggestions,
    mzValues, retentionTimes, molecularWeights, ChemicalFormulas,
    ms2Values, ReferenceIons, areas, compound, savedSearches,
  } = useSelector((state) => state.search);

  const [keyword, setKeyword] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [topN, setTopN] = useState(null);
  const [showBarGraph, setShowBarGraph] = useState(false);

  useEffect(() => {
    if (keyword.length > 2) {
      dispatch(fetchAutocompleteResults(keyword));
    }
  }, [keyword, dispatch]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!keyword) return alert("Enter a search keyword");
    setShowSuggestions(false);
    dispatch(clearSearchResults());
    dispatch(fetchSearchResults({ keyword, searchType: "compound" }));
    setTopN(null);
    setShowBarGraph(false);
  };

  const combinedResults = fileNames.map((file, index) => ({
    fileName: file,
    mzValue: mzValues[index],
    retentionTime: retentionTimes[index],
    molecularWeight: molecularWeights[index],
    chemicalFormula: ChemicalFormulas[index],
    ms2Value: ms2Values[index],
    referenceIon: ReferenceIons[index],
    area: areas[index],
  }));

  combinedResults.sort((a, b) => parseFloat(b.area) - parseFloat(a.area));

  const filteredResults =
    topN && combinedResults.length > topN
      ? combinedResults.slice(0, topN)
      : combinedResults;

  const currentGraphData = combinedResults
    .slice(0, Math.min(10, combinedResults.length))
    .map((result) => ({
      name: result.fileName.split("_ALL")[0],
      area: parseFloat(result.area),
    }));

  const handleSaveCurrentSearch = () => {
    if (compound && currentGraphData.length > 0) {
      dispatch(saveCurrentSearch({ compound, graphData: currentGraphData }));
      alert(`Data for "${compound}" saved for comparison!`);
      setShowBarGraph(false);
    } else {
      alert("No current search results to save for comparison.");
    }
  };

  const handleClearSavedSearches = () => {
    if (window.confirm("Are you sure you want to clear all saved comparison data?")) {
      dispatch(clearSavedSearches());
      alert("All saved comparison data cleared!");
    }
  };

  return (
    <div className="flex flex-col items-center w-full">

      {/* Search Form */}
      <form
        onSubmit={handleSearch}
        className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md"
      >
        <p className="text-sm text-gray-500 mb-3">
          Search by compound name to find matching files and their properties.
        </p>
        <div className="relative">
          <input
            type="text"
            placeholder="Enter compound name"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setShowSuggestions(e.target.value.length > 2);
            }}
            required
            autoComplete="off"
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          />
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
        <button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-all"
        >
          Search
        </button>
      </form>

      {error && (
        <p className="text-red-500 mt-4">
          {typeof error === "string" ? error : error.message}
        </p>
      )}

      {/* Results Table */}
      {fileNames.length > 0 && (
        <div className="overflow-x-auto mt-6 w-full max-w-6xl bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Matching Files and their properties:
          </h3>

          <div className="flex flex-wrap gap-4 mb-4">
            {combinedResults.length > 10 && (
              <button
                className={`px-3 py-1 rounded-lg ${topN === 10 ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-blue-100"}`}
                onClick={() => setTopN(10)}
              >
                Show Top 10
              </button>
            )}
            {combinedResults.length > 20 && (
              <button
                className={`px-3 py-1 rounded-lg ${topN === 20 ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-blue-100"}`}
                onClick={() => setTopN(20)}
              >
                Show Top 20
              </button>
            )}
            {combinedResults.length > 30 && (
              <button
                className={`px-3 py-1 rounded-lg ${topN === 50 ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-blue-100"}`}
                onClick={() => setTopN(50)}
              >
                Show Top 50
              </button>
            )}
            {topN && (
              <button
                className="px-3 py-1 bg-red-400 text-white rounded-lg"
                onClick={() => setTopN(null)}
              >
                Show All
              </button>
            )}
          </div>

          <div className="grid grid-cols-8 gap-4 text-sm text-gray-800 font-bold mb-2">
            <div>File Names</div>
            <div>m/z Values</div>
            <div>Retention Times</div>
            <div>Molecular Weights</div>
            <div>Chemical Formulas</div>
            <div>MS2 Values</div>
            <div>Reference Ions</div>
            <div>Areas</div>
          </div>
          <div className="grid grid-cols-8 gap-4 text-sm text-gray-800">
            {filteredResults.map((result, index) => (
              <React.Fragment key={index}>
                <div>{result.fileName.split("_ALL")[0]}</div>
                <div>{result.mzValue}</div>
                <div>{result.retentionTime}</div>
                <div>{result.molecularWeight}</div>
                <div>{result.chemicalFormula}</div>
                <div>{result.ms2Value}</div>
                <div>{result.referenceIon}</div>
                <div>{result.area}</div>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Bar Graph + Save Controls */}
      {compound && downloadLink && (
        <div className="mt-4 flex flex-col items-center space-y-4 w-full max-w-3xl">
          <button
            className="p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
            onClick={handleSaveCurrentSearch}
          >
            Save Current Search Data for Comparison
          </button>
          <button
            className="p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
            onClick={() => setShowBarGraph((prev) => !prev)}
          >
            {showBarGraph ? "Hide Current Bar-graph" : "Show Current Bar-graph"}
          </button>
          {showBarGraph && (
            <div className="w-full h-96 bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">
                Current Search Bar-Graph for:{" "}
                <span className="text-blue-600">{compound}</span>
              </h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={currentGraphData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="area" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Saved Comparisons */}
      {savedSearches.length > 0 && (
        <div className="mt-8 w-full max-w-6xl bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Saved Searches for Comparison</h2>
          <button
            className="p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all mb-4"
            onClick={handleClearSavedSearches}
          >
            End Comparison (Clear All Saved Data)
          </button>
          {savedSearches.map((savedSearch, index) => (
            <div key={index} className="mb-8 p-4 border border-gray-200 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">
                Saved Bar-Graph for:{" "}
                <span className="text-green-600">{savedSearch.compound}</span>
              </h3>
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={savedSearch.graphData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis label={{ value: "Files ", position: "insideBottom", offset: -10 }} dataKey="name" angle={-45} textAnchor="end" interval={0} height={80} />
                    <YAxis label={{ value: "Area", angle: -90, position: "insideLeft", offset: 10 }} />
                    <Tooltip />
                    <Bar dataKey="area" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CompoundSearch;