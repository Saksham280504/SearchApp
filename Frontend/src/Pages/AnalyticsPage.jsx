// src/pages/AnalyticsPage.jsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSampleFiles,
  fetchAnalyticsData,
  setSelectedFiles,
  clearAnalyticsData,
} from "../../redux/analyticsSlice";
import Heatmap from "../Components/Analytics/Heatmap";
import Chromatogram from "../Components/analytics/Chromatogram";
import MassSpectrum from "../Components/analytics/MassSpectrum";

const TABS = [
  { id: "heatmap",      label: "Heatmap",       subtitle: "Samples (X) × Compound Formulas (Y), colored by Area" },
  { id: "chromatogram", label: "Chromatogram",  subtitle: "Area vs Retention Time — one line per sample file" },
  { id: "massspectrum", label: "Mass Spectrum",  subtitle: "Area vs m/z — one scatter plot per sample file" },
];

function AnalyticsPage() {
  const dispatch = useDispatch();
  const { availableFiles, selectedFiles, data, loading, error } = useSelector(
    (state) => state.analytics
  );

  const [activeTab, setActiveTab] = useState("heatmap");
  const hasData = Object.keys(data).length > 0;

  useEffect(() => {
    dispatch(fetchSampleFiles());
  }, [dispatch]);

  const toggleFile = (fileName) => {
    const updated = selectedFiles.includes(fileName)
      ? selectedFiles.filter((f) => f !== fileName)
      : [...selectedFiles, fileName];
    dispatch(setSelectedFiles(updated));
  };

  const selectAll = () => dispatch(setSelectedFiles([...availableFiles]));
  const clearAll  = () => {
    dispatch(setSelectedFiles([]));
    dispatch(clearAnalyticsData());
  };

  const handleGenerate = () => {
    if (selectedFiles.length === 0) return alert("Select at least one sample file.");
    dispatch(fetchAnalyticsData(selectedFiles));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold text-gray-800 mt-4 mb-1">Analytics</h1>
      <p className="text-gray-500 text-sm mb-6">
        Select sample files below, then generate visualizations.
      </p>

      {/* File Selector */}
      <div className="bg-white rounded-xl shadow border border-gray-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">
            Sample Files
            <span className="ml-2 text-xs text-gray-400">
              ({selectedFiles.length} / {availableFiles.length} selected)
            </span>
          </h2>
          <div className="flex gap-2">
            <button onClick={selectAll} className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
              Select All
            </button>
            <button onClick={clearAll} className="text-xs px-3 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200">
              Clear
            </button>
          </div>
        </div>

        {availableFiles.length === 0 ? (
          <p className="text-xs text-gray-400">Loading available files…</p>
        ) : (
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
            {availableFiles.map((fn) => {
              const active = selectedFiles.includes(fn);
              return (
                <button
                  key={fn}
                  onClick={() => toggleFile(fn)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                    active
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                  }`}
                >
                  {fn}
                </button>
              );
            })}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading || selectedFiles.length === 0}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-2 rounded-lg transition-all text-sm"
        >
          {loading ? "Loading data…" : "Generate Visualizations"}
        </button>

        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      </div>

      {/* Visualization Panel */}
      {hasData && (
        <div>
          <div className="flex bg-white rounded-xl shadow border border-gray-200 p-1 mb-3 gap-1 w-fit flex-wrap">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mb-4">
            {TABS.find((t) => t.id === activeTab)?.subtitle}
          </p>

          {activeTab === "heatmap"      && <Heatmap      data={data} />}
          {activeTab === "chromatogram" && <Chromatogram data={data} />}
          {activeTab === "massspectrum" && <MassSpectrum data={data} />}
        </div>
      )}

      {!hasData && !loading && (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-16 text-center text-gray-400 text-sm">
          Select files above and click <strong>Generate Visualizations</strong> to begin.
        </div>
      )}
    </div>
  );
}

export default AnalyticsPage;