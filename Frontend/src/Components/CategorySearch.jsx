import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSearchResults, clearSearchResults } from "../../redux/searchSlice";
import axios from "axios";
import { API_BASE_URL } from "../../redux/config";

// Static list of recognized categories (matching the backend's clean names).
// Counts are now fetched dynamically from the backend and are exactly grouped.
const CATEGORIES_LIST = [
  "Agriculture",
  "Antibiotic",
  "Carboxylic Acid",
  "Chemicals & Reagents",
  "Cosmetics",
  "Drugs",
  "Dyes",
  "Environmental Pollutant",
  "Enzyme",
  "Fat Soluble Antioxidant",
  "Fatty Acids & Alcohols",
  "Food Industry",
  "Industrial / Waste",
  "Metabolite",
  "Natural Product",
  "Organic Compounds",
  "Peptide / Amino Acid",
  "Personal Care & Toiletries",
  "PFAS",
  "Pharmaceuticals",
  "Plasticizer",
  "Polymer Industry",
  "Refrigerant",
  "Surfactant",
];

const countColor = (count) => {
  if (count >= 100) return "#10385e";
  if (count >= 20)  return "#138808";
  if (count >= 5)   return "#c8972a";
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
  const [liveCounts, setLiveCounts] = useState({}); // { clean_category -> count }

  // Fetch live category counts from backend on mount
  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/analytics/category-counts`)
      .then((res) => {
        const cats = res.data.categories || [];
        const map = {};
        cats.forEach(({ category, count }) => {
          map[category] = parseInt(count, 10);
        });
        setLiveCounts(map);
      })
      .catch(() => {});
  }, []);

  // Build display list with live counts merged in
  const CATEGORIES = CATEGORIES_LIST.map((catName) => {
    return {
      label: catName,
      keyword: catName,
      count: liveCounts[catName] || 0
    };
  });


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
                    title={`${count} compounds`}
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
                      {count > 0 ? count : "—"}
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
