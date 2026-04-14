import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSearchResults, clearSearchResults } from "../../redux/searchSlice";

const CATEGORIES = [
  { label: "Agriculture", keyword: "Agriculture", count: 29 },
  { label: "Antibiotic", keyword: "Antibiotic", count: 11 },
  { label: "Carboxylic Acid", keyword: "Carboxylic acid", count: 1 },
  { label: "Chemical Compound & Reagent", keyword: "Chemical compound", count: 49 },
  { label: "Cosmetic Product", keyword: "Cosmetic", count: 2 },
  { label: "Drugs", keyword: "Drug", count: 165 },
  { label: "Dyes", keyword: "Dyes", count: 6 },
  { label: "Environmental Pollutant", keyword: "Environmental pollutant", count: 3 },
  { label: "Enzyme", keyword: "Enzyme", count: 1 },
  { label: "Fat Soluble Antioxidant", keyword: "Fat soluble antioxidant", count: 1 },
  { label: "Fatty Acid", keyword: "Fatty acid", count: 26 },
  { label: "Fatty Alcohol", keyword: "Fatty alcohol", count: 1 },
  { label: "Food Additive", keyword: "Food additive", count: 1 },
  { label: "Food Industry", keyword: "Food industry", count: 6 },
  { label: "Food Preservative", keyword: "Food preservative", count: 1 },
  { label: "General Chemicals", keyword: "General chemicals", count: 5 },
  { label: "Industrial", keyword: "Industrial", count: 4 },
  { label: "Industrial Waste", keyword: "Industrial waste", count: 114 },
  { label: "Medium-Chain Fatty Acid", keyword: "medium-chain fatty acid", count: 1 },
  { label: "Metabolite", keyword: "Metabolite", count: 296 },
  { label: "Natural Product", keyword: "Natural product", count: 11 },
  { label: "Omega-Hydroxy Fatty Acid", keyword: "Omega-hydroxy fatty acid", count: 1 },
  { label: "Organic Compound", keyword: "Organic compound", count: 25 },
  { label: "PFAS", keyword: "PFAS", count: 1 },
  { label: "Peptide / Amino Acid", keyword: "Peptide/Amino acid", count: 62 },
  { label: "Personal Care Products / Drugs", keyword: "Personal care products/Drugs", count: 4 },
  { label: "Personal Care Products / Toiletries", keyword: "Personal care products/toilteries", count: 24 },
  { label: "Pharmaceutical", keyword: "Pharmaceutical", count: 15 },
  { label: "Pharmaceutical / Herbicides / Dyes", keyword: "Pharmaceutical, Herbicides", count: 1 },
  { label: "Plasticizer", keyword: "Plasticizer", count: 25 },
  { label: "Plasticizer / Drugs", keyword: "Plasticizer/Drugs", count: 1 },
  { label: "Polymer / Agriculture / Drugs", keyword: "Polymer/agriculture", count: 14 },
  { label: "Polymer Industry", keyword: "Polymer industry", count: 1 },
  { label: "Refrigerant", keyword: "Refriger", count: 5 },
  { label: "Surfactant", keyword: "Surfactant", count: 1 },
  { label: "Synthetic Organic Compound", keyword: "Synthetic Organic", count: 1 },
  { label: "Tertiary Amino Compound", keyword: "Tertiary Amino", count: 1 },
];

const countColor = (count) => {
  if (count >= 100) return "#10385e";
  if (count >= 20) return "#138808";
  if (count >= 5) return "#c8972a";
  return "#718096";
};

export default function CategorySearch() {
  const dispatch = useDispatch();
  const { error, Count, CompoundNames, CompoundFormulas } = useSelector(
    (state) => state.search
  );

  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const filtered = CATEGORIES.filter((c) =>
    c.label.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (label) => {
    setSelected((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]
    );
  };

  const clearAll = () => {
    setSelected([]);
    dispatch(clearSearchResults());
  };

  const handleSearch = async () => {
    if (selected.length === 0) return alert("Please select at least one category.");
    setLoading(true);
    dispatch(clearSearchResults());

    const cats = CATEGORIES.filter((c) => selected.includes(c.label));

    if (cats.length === 1) {
      dispatch(fetchSearchResults({ keyword: cats[0].keyword, searchType: "category" }));
    } else {
      for (const cat of cats) {
        await dispatch(fetchSearchResults({ keyword: cat.keyword, searchType: "category" }));
      }
    }

    setLoading(false);
  };

  const handleCompoundClick = (compoundName) => {
    dispatch(clearSearchResults());
    dispatch(fetchSearchResults({ keyword: compoundName, searchType: "compound" }));
  };

  const hasResults = Count > 0 && CompoundNames && Array.isArray(CompoundNames);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(300px,30%)_minmax(0,70%)] lg:items-start">
      <aside
        className="chem-panel self-start rounded-[28px] border border-slate-200 p-6 shadow-[0_20px_50px_rgba(16,56,94,0.08)] lg:sticky lg:top-[128px]"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(246,250,252,0.92))",
        }}
      >
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0a6a8b]">
          Category Search
        </p>
        <h2 className="mt-2 text-3xl font-bold text-slate-800">Input Panel</h2>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          Select one or more categories to discover matching compounds from the data.
        </p>

        <div className="mt-5 rounded-2xl bg-white/90 p-5 shadow-lg">
          <div className="relative mb-4">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm">
              Search
            </span>
            <input
              type="text"
              placeholder="Filter categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-16 pr-4 text-sm text-slate-700 outline-none transition focus:border-[#0a6a8b] focus:ring-2 focus:ring-[#0a6a8b]/20"
            />
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelected(filtered.map((c) => c.label))}
              className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-800"
            >
              Select All Visible
            </button>
            <button
              onClick={clearAll}
              className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700"
            >
              Clear All
            </button>
            {selected.length > 0 && (
              <span className="rounded-full bg-[#10385e] px-3 py-1.5 text-xs font-semibold text-white">
                {selected.length} selected
              </span>
            )}
          </div>

          <div className="max-h-[320px] overflow-y-auto rounded-2xl border border-slate-200 p-3">
            <div className="flex flex-wrap gap-2">
              {filtered.map(({ label, count }) => {
                const active = selected.includes(label);
                return (
                  <button
                    key={label}
                    onClick={() => toggle(label)}
                    title={`${count} entries`}
                    className="rounded-full border px-3 py-2 text-sm transition"
                    style={{
                      borderColor: active ? "#10385e" : "#d6dfe7",
                      background: active ? "#10385e" : "#ffffff",
                      color: active ? "#ffffff" : "#36485a",
                      boxShadow: active ? "0 10px 20px rgba(16,56,94,0.18)" : "none",
                    }}
                  >
                    {label}
                    <span
                      style={{
                        marginLeft: "8px",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: active ? "rgba(255,255,255,0.85)" : countColor(count),
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}

              {filtered.length === 0 && (
                <p className="px-1 py-2 text-sm text-slate-400">
                  No categories match "{search}"
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={loading || selected.length === 0}
            className="mt-5 w-full rounded-xl bg-gradient-to-r from-[#138808] to-[#0a6a8b] px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_24px_rgba(19,136,8,0.15)] transition disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300"
          >
            {loading
              ? "Searching..."
              : selected.length === 0
              ? "Select categories above to search"
              : `Search ${selected.length} Categor${selected.length === 1 ? "y" : "ies"}`}
          </button>

          {selected.length > 1 && (
            <p className="mt-3 text-center text-xs leading-6 text-slate-400">
              With multiple categories selected, the current backend returns the last loaded
              category's results most reliably.
            </p>
          )}
        </div>
      </aside>

      <section
        className="chem-panel rounded-[28px] border border-slate-200 p-6 shadow-[0_20px_50px_rgba(16,56,94,0.08)]"
        style={{
          minHeight: "520px",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(246,250,252,0.92))",
        }}
      >
        {error && (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {typeof error === "string" ? error : error.message}
          </p>
        )}

        {!hasResults && (
          <div className="info-placeholder">
            Select categories on the left and run a search to view matching compounds here.
          </div>
        )}

        {hasResults && (
          <div className="rounded-[24px] border border-slate-200 bg-white/90 p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0a6a8b]">
                  Result Window
                </p>
                <h3 className="mt-2 text-2xl font-bold text-slate-800">
                  {Count} compound{Count !== 1 ? "s" : ""} found
                </h3>
              </div>
              <p className="text-sm text-slate-500">
                Click a compound to open its detailed spectral data.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {CompoundNames.map((name, index) => (
                <button
                  key={index}
                  onClick={() => handleCompoundClick(name)}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#138808] hover:bg-[#f3fbf4]"
                >
                  <div>
                    <div className="text-base font-semibold text-slate-800">
                      {name || "(unnamed compound)"}
                    </div>
                    <div className="mt-1 font-mono text-xs text-slate-500">
                      {CompoundFormulas[index]}
                    </div>
                  </div>
                  <span className="text-xl font-semibold text-[#138808]">+</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
