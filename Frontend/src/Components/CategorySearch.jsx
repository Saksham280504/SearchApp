import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSearchResults,
  fetchAutocompleteResults,
  clearSearchResults,
} from "../../redux/searchSlice";

function CategorySearch() {
  const dispatch = useDispatch();

  const {
    error, suggestions,
    Count, CompoundNames, CompoundFormulas,
  } = useSelector((state) => state.search);

  const [keyword, setKeyword] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

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
    dispatch(fetchSearchResults({ keyword, searchType: "category" }));
  };

  // When a compound result is clicked, trigger a compound search for it
  const handleCompoundClick = (compoundName) => {
    dispatch(clearSearchResults());
    dispatch(fetchSearchResults({ keyword: compoundName, searchType: "compound" }));
  };

  return (
    <div className="flex flex-col items-center w-full">

      {/* Search Form */}
      <form
        onSubmit={handleSearch}
        className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md"
      >
        <p className="text-sm text-gray-500 mb-3">
          Search by category to discover all matching compounds within it.
        </p>
        <div className="relative">
          <input
            type="text"
            placeholder="Enter category name"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setShowSuggestions(e.target.value.length > 2);
            }}
            required
            autoComplete="off"
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 mb-4"
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
          className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-all"
        >
          Search
        </button>
      </form>

      {error && (
        <p className="text-red-500 mt-4">
          {typeof error === "string" ? error : error.message}
        </p>
      )}

      {/* Category Results — list of compounds */}
      {Count > 0 && CompoundNames && Array.isArray(CompoundNames) && (
        <div className="mt-6 w-full max-w-md">
          <p className="font-bold text-gray-700 mb-4 text-center">
            Total Matches Found: {Count}
          </p>
          <p className="text-sm text-gray-500 mb-4 text-center">
            Click a compound below to view its detailed results.
          </p>
          <div className="flex flex-col gap-3">
            {CompoundNames.map((name, index) => (
              <button
                key={index}
                className="p-4 bg-green-500 text-white rounded-lg shadow-md w-full text-center hover:bg-green-600 transition-all"
                onClick={() => handleCompoundClick(name)}
              >
                <span className="font-semibold block">{name}</span>
                <span className="text-sm opacity-90">{CompoundFormulas[index]}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CategorySearch;