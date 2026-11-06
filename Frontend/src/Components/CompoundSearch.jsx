import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  fetchSearchResults,
  clearSearchResults,
  saveCurrentSearch,
  clearSavedSearches,
} from "../../redux/searchSlice";
import CompoundAutocomplete from "./CompoundAutocomplete";

function CompoundSearch() {
  const dispatch = useDispatch();

  const {
    results,
    downloadLink,
    error,
    compound,
    savedSearches,
    loading,
  } = useSelector((state) => state.search);

  const [keyword, setKeyword] = useState("");
  const [topN, setTopN] = useState(null);
  const [showBarGraph, setShowBarGraph] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!keyword) return alert("Enter a search keyword");
    dispatch(clearSearchResults());
    dispatch(fetchSearchResults({ keyword, searchType: "compound" }));
    setTopN(null);
    setShowBarGraph(false);
  };

  // Sort by area descending
  const sortedResults = [...results].sort(
    (a, b) => parseFloat(b.area) - parseFloat(a.area)
  );

  const filteredResults =
    topN && sortedResults.length > topN
      ? sortedResults.slice(0, topN)
      : sortedResults;

  const currentGraphData = sortedResults
    .slice(0, Math.min(10, sortedResults.length))
    .map((result) => ({
      name: result.fileName.split("_ALL")[0],
      area: parseFloat(result.area),
    }));

  const hasResults = results.length > 0 || savedSearches.length > 0;

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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(300px,30%)_minmax(0,70%)] lg:items-start">
      <aside
        className="chem-panel self-start rounded-[28px] border border-slate-200 p-6 shadow-[0_20px_50px_rgba(16,56,94,0.08)] lg:sticky lg:top-[128px]"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(246,250,252,0.92))",
        }}
      >
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0a6a8b]">
            Compound Search
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-800">Input Panel</h2>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            Search by compound name to retrieve matching files and their analytical
            properties.
          </p>
        </div>

        <form onSubmit={handleSearch} className="rounded-2xl bg-white/90 p-5 shadow-lg">
          <div className="relative mb-4">
            <CompoundAutocomplete
              value={keyword}
              onChange={setKeyword}
              onSelect={(val) => {
                setKeyword(val);
                // Optionally auto-submit: 
                // dispatch(fetchSearchResults({ keyword: val, searchType: "compound" }));
              }}
              placeholder="Enter compound name"
              inputStyle={{
                padding: "12px 14px", // slightly larger for this specific form
                borderColor: "#cbd5e1"
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-[#10385e] to-[#0a6a8b] px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_24px_rgba(16,56,94,0.18)] transition hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Searching…" : "Search Compound"}
          </button>
        </form>

        {error && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {typeof error === "string" ? error : error.message}
          </p>
        )}
      </aside>

      <section
        className="chem-panel rounded-[28px] border border-slate-200 p-6 shadow-[0_20px_50px_rgba(16,56,94,0.08)]"
        style={{
          minHeight: "520px",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(246,250,252,0.92))",
        }}
      >
        {!hasResults && !loading && (
          <div className="info-placeholder">
            Search for a compound on the left to view files, properties, and comparison
            charts here.
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
            Searching across all sample files…
          </div>
        )}

        {results.length > 0 && (
          <div className="rounded-[24px] border border-slate-200 bg-white/90 p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">Matching Results</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {results.length} observation{results.length !== 1 ? "s" : ""} found · sorted by area (high → low)
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {sortedResults.length > 10 && (
                  <button
                    className={`rounded-full px-3 py-1 text-sm ${
                      topN === 10
                        ? "bg-[#10385e] text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                    onClick={() => setTopN(10)}
                  >
                    Top 10
                  </button>
                )}
                {sortedResults.length > 20 && (
                  <button
                    className={`rounded-full px-3 py-1 text-sm ${
                      topN === 20
                        ? "bg-[#10385e] text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                    onClick={() => setTopN(20)}
                  >
                    Top 20
                  </button>
                )}
                {sortedResults.length > 30 && (
                  <button
                    className={`rounded-full px-3 py-1 text-sm ${
                      topN === 50
                        ? "bg-[#10385e] text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                    onClick={() => setTopN(50)}
                  >
                    Top 50
                  </button>
                )}
                {topN && (
                  <button
                    className="rounded-full bg-rose-100 px-3 py-1 text-sm text-rose-700"
                    onClick={() => setTopN(null)}
                  >
                    Show All
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[1100px]">
                <div className="grid grid-cols-8 gap-4 rounded-t-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700">
                  <div>File</div>
                  <div>m/z</div>
                  <div>RT (min)</div>
                  <div>Mol. Weight</div>
                  <div>Formula</div>
                  <div>MS2</div>
                  <div>Ref. Ion</div>
                  <div>Area (Max.)</div>
                </div>
                <div className="divide-y divide-slate-100 border-x border-b border-slate-100 rounded-b-2xl">
                  {filteredResults.map((result, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-8 gap-4 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition"
                    >
                      <div className="font-medium truncate" title={result.fileName}>
                        {result.fileName.split("_ALL")[0]}
                      </div>
                      <div>{result.mzValue}</div>
                      <div>{result.retentionTime}</div>
                      <div>{result.molecularWeight}</div>
                      <div>{result.chemicalFormula}</div>
                      <div className="truncate" title={result.ms2Value}>{result.ms2Value}</div>
                      <div>{result.referenceIon}</div>
                      <div className="font-semibold">{result.area}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {compound && downloadLink && (
          <div className="mt-6 space-y-4">
            <div className="flex flex-wrap gap-3">
              <a
                href={downloadLink}
                download
                className="rounded-xl bg-[#c8972a] px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(200,151,42,0.3)] transition hover:-translate-y-0.5"
              >
                Download Filtered Results
              </a>
              <button
                className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                onClick={handleSaveCurrentSearch}
              >
                Save for Comparison
              </button>
              <button
                className="rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-700"
                onClick={() => setShowBarGraph((prev) => !prev)}
              >
                {showBarGraph ? "Hide Bar Graph" : "Show Bar Graph"}
              </button>
            </div>

            {showBarGraph && (
              <div className="rounded-[24px] border border-slate-200 bg-white/90 p-5 shadow-sm">
                <h3 className="mb-4 text-xl font-semibold text-slate-800">
                  Top 10 Areas — <span className="text-[#0a6a8b]">{compound}</span>
                </h3>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={currentGraphData}
                      margin={{ top: 20, right: 30, left: 40, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        interval={0}
                        height={80}
                      />
                      <YAxis
                        width={90}
                        label={{
                          value: "Area",
                          angle: -90,
                          position: "insideLeft",
                          offset: 0,
                          dx: -20,
                          fill: "#666",
                        }}
                      />
                      <Tooltip />
                      <Bar dataKey="area" fill="#0a6a8b" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {savedSearches.length > 0 && (
          <div className="mt-8 rounded-[24px] border border-slate-200 bg-white/90 p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-bold text-slate-800">Saved Searches for Comparison</h2>
              <button
                className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                onClick={handleClearSavedSearches}
              >
                End Comparison
              </button>
            </div>

            {savedSearches.map((savedSearch, index) => (
              <div
                key={index}
                className="mb-6 rounded-2xl border border-slate-200 bg-slate-50/90 p-4 last:mb-0"
              >
                <h3 className="mb-4 text-xl font-semibold text-slate-800">
                  Saved — <span className="text-green-700">{savedSearch.compound}</span>
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={savedSearch.graphData}
                      margin={{ top: 20, right: 30, left: 40, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        label={{ value: "Files", position: "insideBottom", offset: -10 }}
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        interval={0}
                        height={80}
                      />
                      <YAxis
                        width={90}
                        label={{
                          value: "Area",
                          angle: -90,
                          position: "insideLeft",
                          offset: 0,
                          dx: -20,
                          fill: "#666",
                        }}
                      />
                      <Tooltip />
                      <Bar dataKey="area" fill="#4a9f73" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default CompoundSearch;
