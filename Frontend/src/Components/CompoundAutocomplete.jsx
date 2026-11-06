// src/Components/CompoundAutocomplete.jsx
// Reusable compound name search input with live autocomplete dropdown.
// Calls GET /autocomplete?query=... after 3+ characters (debounced 350ms).
//
// Props:
//   value         {string}   — controlled input value
//   onChange      {fn}       — called with raw text as user types
//   onSelect      {fn}       — called with the chosen compound name string
//   placeholder   {string}   — input placeholder text
//   inputStyle    {object}   — optional extra inline styles for the <input>
//   disabled      {boolean}  — disable the input

import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../redux/config";

export default function CompoundAutocomplete({
  value = "",
  onChange,
  onSelect,
  placeholder = "Search compound name…",
  inputStyle = {},
  disabled = false,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen]               = useState(false);
  const [loading, setLoading]         = useState(false);
  const [activeIdx, setActiveIdx]     = useState(-1);
  const debounceRef                   = useRef(null);
  const containerRef                  = useRef(null);

  // ── Fetch suggestions ──────────────────────────────────────────────
  const fetchSuggestions = useCallback(async (q) => {
    if (q.length < 3) { setSuggestions([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/autocomplete`, { params: { query: q } });
      const list = res.data.suggestions || [];
      setSuggestions(list);
      setOpen(list.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Debounce typing ────────────────────────────────────────────────
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!value || value.length < 3) { setSuggestions([]); setOpen(false); return; }
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 350);
    return () => clearTimeout(debounceRef.current);
  }, [value, fetchSuggestions]);

  // ── Close on outside click ─────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setActiveIdx(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Keyboard navigation ────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIdx(-1);
    }
  };

  const handleSelect = (name) => {
    setOpen(false);
    setActiveIdx(-1);
    setSuggestions([]);
    if (onChange) onChange(name);
    if (onSelect) onSelect(name);
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      {/* Input */}
      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            if (onChange) onChange(e.target.value);
            setActiveIdx(-1);
          }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          spellCheck={false}
          style={{
            width: "100%",
            padding: "10px 36px 10px 14px",
            borderRadius: 10,
            border: "1px solid #cbd5e1",
            fontSize: 14,
            color: "#111827",
            background: disabled ? "#f8fafc" : "#fff",
            outline: "none",
            boxSizing: "border-box",
            transition: "border-color 0.15s",
            ...inputStyle,
          }}
          onFocusCapture={(e) => { e.target.style.borderColor = "#10385e"; }}
          onBlurCapture={(e) => { e.target.style.borderColor = "#cbd5e1"; }}
        />
        {/* Spinner / search icon */}
        <div style={{
          position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
          display: "flex", alignItems: "center", pointerEvents: "none",
        }}>
          {loading ? (
            <div style={{
              width: 14, height: 14,
              border: "2px solid rgba(16,56,94,0.2)",
              borderTopColor: "#10385e",
              borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
            }} />
          ) : (
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="6" stroke="#94a3b8" strokeWidth="2" />
              <path d="M14 14l3 3" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {open && suggestions.length > 0 && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 4px)",
          left: 0,
          right: 0,
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 10,
          boxShadow: "0 8px 24px rgba(16,56,94,0.12)",
          zIndex: 9999,
          maxHeight: 220,
          overflowY: "auto",
        }}>
          {suggestions.map((s, i) => (
            <div
              key={s}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(s); }}
              onMouseEnter={() => setActiveIdx(i)}
              style={{
                padding: "9px 14px",
                fontSize: 13,
                color: activeIdx === i ? "#10385e" : "#374151",
                background: activeIdx === i ? "rgba(16,56,94,0.06)" : "transparent",
                cursor: "pointer",
                borderBottom: i < suggestions.length - 1 ? "1px solid #f1f5f9" : "none",
                fontWeight: activeIdx === i ? 600 : 400,
                transition: "background 0.1s",
              }}
            >
              {/* Highlight matching portion */}
              {highlightMatch(s, value)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Bold the part of the suggestion that matches the query
function highlightMatch(text, query) {
  if (!query || query.length < 3) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <strong style={{ color: "#10385e" }}>{text.slice(idx, idx + query.length)}</strong>
      {text.slice(idx + query.length)}
    </>
  );
}
