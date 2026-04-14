import { useState } from "react";
import CompoundSearch from "../Components/CompoundSearch";
import CategorySearch from "../Components/CategorySearch";

export default function QueryPage() {
  const [activeTab, setActiveTab] = useState("compound");

  return (
    <main
      className="page-shell min-h-screen px-4 py-8"
      style={{
        background:
          "linear-gradient(180deg, rgba(243,248,252,0.95), rgba(237,244,249,0.95))",
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
          <div className="chem-orb absolute left-10 top-8 h-12 w-12" />
          <div className="chem-orb orb-2 absolute right-16 top-10 h-5 w-5" />
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0a6a8b]">
            Search Workspace
          </p>
          <h1 className="mt-3 text-5xl font-bold text-slate-800">Query Tool</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
            Choose a mode, set your filters on the left, and review results on the right.
          </p>
        </div>

        <div className="page-animate page-animate-delay-1 mb-6 flex w-fit gap-2 rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-sm backdrop-blur">
          <button
            onClick={() => setActiveTab("compound")}
            className={`rounded-xl px-5 py-2 text-sm font-semibold transition ${
              activeTab === "compound"
                ? "bg-[#10385e] text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Compound Search
          </button>
          <button
            onClick={() => setActiveTab("category")}
            className={`rounded-xl px-5 py-2 text-sm font-semibold transition ${
              activeTab === "category"
                ? "bg-[#0f766e] text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Category Search
          </button>
        </div>

        <div className="page-animate page-animate-delay-2">
          {activeTab === "compound" ? <CompoundSearch /> : <CategorySearch />}
        </div>
      </div>
    </main>
  );
}
