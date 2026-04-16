import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSampleFiles,
  fetchAnalyticsData,
  setSelectedFiles,
  clearAnalyticsData,
} from "../../redux/analyticsSlice";
import Heatmap from "../Components/Analytics/Heatmap";
import Chromatogram from "../Components/Analytics/Chromatogram";
import MassSpectrum from "../Components/Analytics/MassSpectrum";

const TABS = [
  { id: "heatmap", label: "Heatmap", subtitle: "Sample-to-compound intensity view" },
  { id: "chromatogram", label: "Chromatogram", subtitle: "Retention profile across sample files" },
  { id: "massSpectrum", label: "Mass Spectrum", subtitle: "m/z distribution across selected files" },
];

export default function AnalyticsPage() {
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

  const clearAll = () => {
    dispatch(setSelectedFiles([]));
    dispatch(clearAnalyticsData());
  };

  const handleGenerate = () => {
    if (selectedFiles.length === 0) {
      alert("Select at least one sample file.");
      return;
    }
    dispatch(fetchAnalyticsData(selectedFiles));
  };

  return (
    <main
      className="page-shell min-h-screen px-4 py-8"
      style={{
        background:
          "linear-gradient(180deg, rgba(243,248,252,0.95), rgba(236,244,249,0.95))",
      }}
    >
      <div className="page-content mx-auto max-w-[1400px]">
        <div
          className="page-animate chem-panel mb-6 rounded-[30px] border border-slate-200 px-8 py-8 shadow-[0_20px_50px_rgba(16,56,94,0.08)]"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.92), rgba(247,251,253,0.92))",
          }}
        >
          <div className="chem-orb absolute right-12 top-10 h-12 w-12" />
          <div className="chem-orb orb-2 absolute left-14 top-8 h-5 w-5" />
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0a6a8b]">
            Visualization Workspace
          </p>
          <h1 className="mt-3 font-bold text-slate-800" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>Analytics Tool</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
            Configure inputs on the left and inspect visual outputs on the right.
          </p>
        </div>

        <div className="page-animate page-animate-delay-1 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(320px,30%)_minmax(0,70%)] lg:items-start">
          <aside
            className="chem-panel h-fit self-start rounded-[28px] border border-slate-200 p-6 shadow-[0_20px_50px_rgba(16,56,94,0.08)] lg:sticky lg:top-[128px]"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(246,250,252,0.92))",
            }}
          >
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0a6a8b]">
                Analytics Input
              </p>
              <h2 className="mt-2 text-3xl font-bold text-slate-800">Input Panel</h2>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                Select sample files and generate visual analytics.
              </p>
            </div>

            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-700">
                Sample Files ({selectedFiles.length}/{availableFiles.length})
              </span>
              <div className="flex gap-2">
                <button onClick={selectAll} className="rounded-lg bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                  Select All
                </button>
                <button onClick={clearAll} className="rounded-lg bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                  Clear
                </button>
              </div>
            </div>

            <div className="max-h-[340px] overflow-y-auto rounded-2xl border border-slate-200 bg-white/85 p-3">
              {availableFiles.length === 0 ? (
                <p className="text-sm text-slate-400">Loading sample files...</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableFiles.map((fn) => {
                    const active = selectedFiles.includes(fn);
                    return (
                      <button
                        key={fn}
                        onClick={() => toggleFile(fn)}
                        className={`rounded-full border px-3 py-1.5 text-xs transition ${
                          active
                            ? "border-[#10385e] bg-[#10385e] text-white"
                            : "border-slate-300 bg-white text-slate-600 hover:border-sky-500"
                        }`}
                      >
                        {fn}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || selectedFiles.length === 0}
              className="mt-5 w-full rounded-xl bg-[#10385e] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0c2f4f] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {loading ? "Generating..." : "Generate Visualizations"}
            </button>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          </aside>

          <section
            className="chem-panel rounded-[28px] border border-slate-200 p-6 shadow-[0_20px_50px_rgba(16,56,94,0.08)]"
            style={{
              minHeight: "620px",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(246,250,252,0.92))",
            }}
          >
            {hasData ? (
              <>
                <div className="mb-4 flex flex-wrap gap-2">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                        activeTab === tab.id
                          ? "bg-[#10385e] text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <p className="mb-5 text-sm text-slate-500">
                  {TABS.find((t) => t.id === activeTab)?.subtitle}
                </p>

                {activeTab === "heatmap" && <Heatmap data={data} />}
                {activeTab === "chromatogram" && <Chromatogram data={data} />}
                {activeTab === "massSpectrum" && <MassSpectrum data={data} />}
              </>
            ) : (
              <div className="info-placeholder">
                Select files on the left and click Generate Visualizations.
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
