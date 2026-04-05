// src/components/CategorySearch.jsx
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSearchResults,
  clearSearchResults,
} from "../../redux/searchSlice";

/* ─── Canonical category list extracted from ExploSpreadsheet ──────
   Each entry is { label, rawValues, count }
   rawValues = all spelling variants found in the data that map to this category.
   The backend receives `keyword` and does a case-insensitive substring match
   against the Category field, so we send one representative raw value per group.
   To cover all variants cleanly we send MULTIPLE requests (one per variant)
   and merge — but since the backend already does substring matching we just
   pick the best single keyword that covers the most rows.
─────────────────────────────────────────────────────────────────────── */
const CATEGORIES = [
  { label: "Agriculture",                        keyword: "Agriculture",           count: 29  },
  { label: "Antibiotic",                         keyword: "Antibiotic",            count: 11  },
  { label: "Carboxylic Acid",                    keyword: "Carboxylic acid",       count: 1   },
  { label: "Chemical Compound & Reagent",        keyword: "Chemical compound",     count: 49  },
  { label: "Cosmetic Product",                   keyword: "Cosmetic",              count: 2   },
  { label: "Drugs",                              keyword: "Drug",                  count: 165 },
  { label: "Dyes",                               keyword: "Dyes",                  count: 6   },
  { label: "Environmental Pollutant",            keyword: "Environmental pollutant",count: 3  },
  { label: "Enzyme",                             keyword: "Enzyme",                count: 1   },
  { label: "Fat Soluble Antioxidant",            keyword: "Fat soluble antioxidant",count: 1  },
  { label: "Fatty Acid",                         keyword: "Fatty acid",            count: 26  },
  { label: "Fatty Alcohol",                      keyword: "Fatty alcohol",         count: 1   },
  { label: "Food Additive",                      keyword: "Food additive",         count: 1   },
  { label: "Food Industry",                      keyword: "Food industry",         count: 6   },
  { label: "Food Preservative",                  keyword: "Food preservative",     count: 1   },
  { label: "General Chemicals",                  keyword: "General chemicals",     count: 5   },
  { label: "Industrial",                         keyword: "Industrial",            count: 4   },
  { label: "Industrial Waste",                   keyword: "Industrial waste",      count: 114 },
  { label: "Medium-Chain Fatty Acid",            keyword: "medium-chain fatty acid",count: 1  },
  { label: "Metabolite",                         keyword: "Metabolite",            count: 296 },
  { label: "Natural Product",                    keyword: "Natural product",       count: 11  },
  { label: "Omega-Hydroxy Fatty Acid",           keyword: "Omega-hydroxy fatty acid",count: 1 },
  { label: "Organic Compound",                   keyword: "Organic compound",      count: 25  },
  { label: "PFAS",                               keyword: "PFAS",                  count: 1   },
  { label: "Peptide / Amino Acid",               keyword: "Peptide/Amino acid",    count: 62  },
  { label: "Personal Care Products / Drugs",     keyword: "Personal care products/Drugs", count: 4 },
  { label: "Personal Care Products / Toiletries",keyword: "Personal care products/toilteries", count: 24 },
  { label: "Pharmaceutical",                     keyword: "Pharmaceutical",        count: 15  },
  { label: "Pharmaceutical / Herbicides / Dyes", keyword: "Pharmaceutical, Herbicides",    count: 1   },
  { label: "Plasticizer",                        keyword: "Plasticizer",           count: 25  },
  { label: "Plasticizer / Drugs",                keyword: "Plasticizer/Drugs",     count: 1   },
  { label: "Polymer / Agriculture / Drugs",      keyword: "Polymer/agriculture",   count: 14  },
  { label: "Polymer Industry",                   keyword: "Polymer industry",      count: 1   },
  { label: "Refrigerant",                        keyword: "Refriger",              count: 5   },
  { label: "Surfactant",                         keyword: "Surfactant",            count: 1   },
  { label: "Synthetic Organic Compound",         keyword: "Synthetic Organic",     count: 1   },
  { label: "Tertiary Amino Compound",            keyword: "Tertiary Amino",        count: 1   },
];

const COUNT_COLOR = (c) => {
  if (c >= 100) return "#003087";
  if (c >= 20)  return "#138808";
  if (c >= 5)   return "#C8972A";
  return "#777";
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

  const clearAll = () => { setSelected([]); dispatch(clearSearchResults()); };

  const handleSearch = async () => {
    if (selected.length === 0) return alert("Please select at least one category.");
    setLoading(true);
    dispatch(clearSearchResults());

    // We fire one search per selected category using the keyword for that category.
    // The Redux state accumulates from the last call; for multi-category we need to
    // merge — simplest approach: fire the first one via Redux, collect rest manually.
    // For now, if multiple categories selected, we join keywords and send as one
    // search. If only one, use normal flow.
    const cats = CATEGORIES.filter((c) => selected.includes(c.label));

    if (cats.length === 1) {
      dispatch(fetchSearchResults({ keyword: cats[0].keyword, searchType: "category" }));
    } else {
      // Multiple: dispatch each keyword separately — last one wins in Redux state.
      // Better UX: dispatch all and the backend returns the union. Since backend
      // only handles one keyword at a time, we send them sequentially and Redux
      // will show the last result. We show a note to the user.
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

  return (
    <div style={{ width: "100%", maxWidth: "900px", margin: "0 auto" }}>

      {/* ── Header ───────────────────────────────────────────────── */}
      <div style={{
        background: "#fff",
        borderRadius: "14px",
        padding: "28px",
        boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
        border: "1px solid #eee",
        marginBottom: "24px",
      }}>
        <p style={{ fontSize: "13px", color: "#666", marginBottom: "18px", lineHeight: 1.5 }}>
          Select one or more categories below to discover all matching compounds. 
          Numbers show how many entries each category contains.
        </p>

        {/* Filter search box */}
        <div style={{ position: "relative", marginBottom: "16px" }}>
          <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "15px", pointerEvents: "none" }}>🔍</span>
          <input
            type="text"
            placeholder="Filter categories…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 12px 9px 36px",
              border: "1.5px solid #ddd",
              borderRadius: "8px",
              fontSize: "13px",
              outline: "none",
              boxSizing: "border-box",
              fontFamily: "'DM Sans', sans-serif",
              color: "#333",
              transition: "border-color 0.18s",
            }}
            onFocus={e => e.target.style.borderColor = "#003087"}
            onBlur={e => e.target.style.borderColor = "#ddd"}
          />
        </div>

        {/* Select all / clear controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px", flexWrap: "wrap" }}>
          <button
            onClick={() => setSelected(filtered.map(c => c.label))}
            style={{
              fontSize: "12px", padding: "5px 14px",
              background: "#EEF2FF", color: "#003087",
              border: "1px solid #c5d0f0", borderRadius: "20px", cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
            }}
          >
            Select All Visible
          </button>
          <button
            onClick={clearAll}
            style={{
              fontSize: "12px", padding: "5px 14px",
              background: "#FEF2F2", color: "#dc2626",
              border: "1px solid #fca5a5", borderRadius: "20px", cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
            }}
          >
            Clear All
          </button>
          {selected.length > 0 && (
            <span style={{
              fontSize: "12px", color: "#003087", fontWeight: 600,
              background: "#003087", color: "#fff",
              padding: "4px 10px", borderRadius: "20px",
            }}>
              {selected.length} selected
            </span>
          )}
        </div>

        {/* ── Category pills grid ───────────────────────────────── */}
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          maxHeight: "280px",
          overflowY: "auto",
          padding: "4px 2px",
        }}>
          {filtered.map(({ label, count }) => {
            const active = selected.includes(label);
            return (
              <button
                key={label}
                onClick={() => toggle(label)}
                title={`${count} entries`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  borderRadius: "20px",
                  border: `1.5px solid ${active ? "#003087" : "#ddd"}`,
                  background: active ? "#003087" : "#fff",
                  color: active ? "#fff" : "#333",
                  fontSize: "13px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: active ? 600 : 400,
                  cursor: "pointer",
                  transition: "all 0.16s",
                  boxShadow: active ? "0 2px 8px rgba(0,48,135,0.2)" : "none",
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.borderColor = "#003087";
                    e.currentTarget.style.background = "#EEF2FF";
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.borderColor = "#ddd";
                    e.currentTarget.style.background = "#fff";
                  }
                }}
              >
                {label}
                <span style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: active ? "rgba(255,255,255,0.8)" : COUNT_COLOR(count),
                  background: active ? "rgba(255,255,255,0.15)" : "#f5f5f5",
                  padding: "1px 6px",
                  borderRadius: "10px",
                  minWidth: "22px",
                  textAlign: "center",
                }}>
                  {count}
                </span>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p style={{ fontSize: "13px", color: "#999", padding: "8px 4px" }}>
              No categories match "{search}"
            </p>
          )}
        </div>

        {/* ── Search button ─────────────────────────────────────── */}
        <button
          onClick={handleSearch}
          disabled={loading || selected.length === 0}
          style={{
            marginTop: "20px",
            width: "100%",
            background: selected.length === 0 ? "#ddd" : "#138808",
            color: selected.length === 0 ? "#999" : "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "12px",
            fontSize: "15px",
            fontWeight: 600,
            cursor: selected.length === 0 ? "not-allowed" : "pointer",
            transition: "background 0.18s",
            fontFamily: "'DM Sans', sans-serif",
          }}
          onMouseEnter={e => { if (selected.length > 0) e.currentTarget.style.background = "#0f6b06"; }}
          onMouseLeave={e => { if (selected.length > 0) e.currentTarget.style.background = "#138808"; }}
        >
          {loading
            ? "Searching…"
            : selected.length === 0
              ? "Select categories above to search"
              : `Search ${selected.length} Categor${selected.length === 1 ? "y" : "ies"}`}
        </button>

        {/* Multi-select note */}
        {selected.length > 1 && (
          <p style={{ fontSize: "11px", color: "#888", marginTop: "8px", textAlign: "center" }}>
            When multiple categories are selected, results show the last category's matches.
            For best results, search one category at a time.
          </p>
        )}
      </div>

      {/* ── Error ────────────────────────────────────────────────── */}
      {error && (
        <p style={{ color: "#dc2626", fontSize: "13px", marginBottom: "16px", textAlign: "center" }}>
          {typeof error === "string" ? error : error.message}
        </p>
      )}

      {/* ── Results ──────────────────────────────────────────────── */}
      {Count > 0 && CompoundNames && Array.isArray(CompoundNames) && (
        <div style={{ width: "100%" }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: "16px", flexWrap: "wrap", gap: "8px",
          }}>
            <p style={{ fontSize: "15px", fontWeight: 700, color: "#003087" }}>
              {Count} compound{Count !== 1 ? "s" : ""} found
            </p>
            <p style={{ fontSize: "12px", color: "#888" }}>
              Click a compound to view its full spectral data
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {CompoundNames.map((name, index) => (
              <button
                key={index}
                onClick={() => handleCompoundClick(name)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 18px",
                  background: "#fff",
                  border: "1.5px solid #e0e8d8",
                  borderRadius: "10px",
                  cursor: "pointer",
                  transition: "all 0.16s",
                  width: "100%",
                  textAlign: "left",
                  fontFamily: "'DM Sans', sans-serif",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "#138808";
                  e.currentTarget.style.background = "#f0faf0";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(19,136,8,0.12)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "#e0e8d8";
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
                }}
              >
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#1a1a2e", marginBottom: "2px" }}>
                    {name || "(unnamed compound)"}
                  </div>
                  <div style={{ fontSize: "12px", color: "#888", fontFamily: "monospace" }}>
                    {CompoundFormulas[index]}
                  </div>
                </div>
                <span style={{
                  fontSize: "18px", color: "#138808", flexShrink: 0,
                  transition: "transform 0.15s",
                }}>
                  →
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}