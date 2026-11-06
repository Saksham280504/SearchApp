// src/Components/Analytics/TimeSeriesTab.jsx
// Phase 4 — Time-Series chart for compound concentration over time.
// Works with real DB data; shows a helpful message when DB is unavailable.

import { useState, useRef } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { API_BASE_URL } from "../../../redux/config";
import CompoundAutocomplete from "../CompoundAutocomplete";

// Station colour palette (cycles for multi-station overlay)
const COLOURS = [
  "#2563eb", "#dc2626", "#16a34a", "#d97706",
  "#7c3aed", "#0891b2", "#be185d", "#65a30d",
];

const TREND_BADGE = {
  increasing: { bg: "rgba(220,38,38,0.1)", color: "#b91c1c", icon: "↑", label: "Increasing" },
  decreasing: { bg: "rgba(22,163,74,0.1)",  color: "#15803d", icon: "↓", label: "Decreasing" },
  stable:     { bg: "rgba(37,99,235,0.1)",  color: "#1d4ed8", icon: "→", label: "Stable" },
};

export default function TimeSeriesTab() {
  const [compound, setCompound] = useState("");
  const [series, setSeries]     = useState([]);    // raw rows from API
  const [trend, setTrend]       = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [noDb, setNoDb]         = useState(false);
  const debounceRef             = useRef(null);

  // ── Fetch time-series data ──────────────────────────────────────────
  const fetchSeries = async (q) => {
    if (!q.trim()) { setSeries([]); setTrend(null); setError(""); return; }
    setLoading(true);
    setError("");
    setNoDb(false);
    try {
      const [serRes, trendRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/analytics/timeseries`, { params: { compound: q } }),
        axios.get(`${API_BASE_URL}/api/analytics/trends`,     { params: { compound: q } }),
      ]);

      if (serRes.data.message) { setNoDb(true); setSeries([]); return; }

      setSeries(serRes.data.series || []);
      setTrend(trendRes.data.trend || null);

      if ((serRes.data.series || []).length === 0) {
        setError(`No time-series data found for "${q}". Sampling dates may not be recorded.`);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load time-series data.");
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (val) => {
    setCompound(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSeries(val), 700);
  };

  // ── Transform flat rows → Recharts-friendly structure ───────────────
  // Result: [{ date, "SBW1": area, "SD3": area, … }, …]
  const stations = [...new Set(series.map((r) => r.stationCode).filter(Boolean))];

  const chartData = Object.values(
    series.reduce((acc, row) => {
      const date = row.date || "Unknown";
      if (!acc[date]) acc[date] = { date };
      if (row.stationCode) acc[date][row.stationCode] = parseFloat(row.area) || 0;
      return acc;
    }, {})
  ).sort((a, b) => (a.date > b.date ? 1 : -1));

  const badge = trend ? TREND_BADGE[trend.direction] : null;

  return (
    <div style={{ width: "100%" }}>
      {/* Search row */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <CompoundAutocomplete
            value={compound}
            onChange={handleInput}
            onSelect={handleInput}
            placeholder="Enter compound name (e.g. caffeine, atrazine)…"
            inputStyle={{
              padding: "10px 14px",
              borderColor: "#cbd5e1"
            }}
          />
          {loading && (
            <div style={{
              position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
              width: 16, height: 16, border: "2px solid rgba(16,56,94,0.2)",
              borderTopColor: "#10385e", borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
            }} />
          )}
        </div>

        {/* Trend badge */}
        {badge && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 14px", borderRadius: 8,
            background: badge.bg, color: badge.color,
            fontSize: 13, fontWeight: 700, whiteSpace: "nowrap",
          }}>
            <span style={{ fontSize: 16 }}>{badge.icon}</span>
            {badge.label}
          </div>
        )}
      </div>

      {/* Error / no-DB notices */}
      {noDb && (
        <div style={{
          padding: "20px", textAlign: "center", borderRadius: 14,
          background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.25)",
          color: "#854d0e", fontSize: 14,
        }}>
          ⚠️ Time-series analysis requires a connected PostgreSQL database with sampling dates.<br />
          <span style={{ fontSize: 12, color: "#92400e", marginTop: 4, display: "block" }}>
            Deploy to Render and run <code>npm run db:setup</code> to enable this feature.
          </span>
        </div>
      )}

      {error && !noDb && (
        <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(239,68,68,0.06)", color: "#b91c1c", fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Stats strip */}
      {trend && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px,1fr))", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Observations", value: trend.observations },
            { label: "Mean Area",    value: Number(trend.mean).toLocaleString() },
            { label: "Min Area",     value: Number(trend.min).toLocaleString() },
            { label: "Max Area",     value: Number(trend.max).toLocaleString() },
            { label: "Δ (2nd/1st)", value: `${trend.pctChange > 0 ? "+" : ""}${trend.pctChange}%` },
          ].map((s) => (
            <div key={s.label} style={{
              background: "rgba(16,56,94,0.04)", borderRadius: 12,
              padding: "14px 12px", textAlign: "center",
            }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#10385e" }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,56,94,0.08)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v > 1e6 ? `${(v / 1e6).toFixed(1)}M` : v > 1e3 ? `${(v / 1e3).toFixed(0)}K` : v}
              width={60}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 10, border: "1px solid rgba(16,56,94,0.12)",
                fontSize: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              }}
              formatter={(value, name) => [Number(value).toLocaleString(), name]}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
            />
            {stations.map((code, i) => (
              <Line
                key={code}
                type="monotone"
                dataKey={code}
                stroke={COLOURS[i % COLOURS.length]}
                strokeWidth={2.5}
                dot={{ r: 4, strokeWidth: 1.5 }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* Empty state */}
      {!loading && !noDb && !error && series.length === 0 && (
        <div style={{
          textAlign: "center", padding: "60px 20px",
          color: "#94a3b8",
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📈</div>
          <p style={{ fontWeight: 600, color: "#475569" }}>Search a compound to see its concentration trend over time</p>
          <p style={{ fontSize: 13, marginTop: 6 }}>Data points are grouped by sampling date and coloured by station</p>
        </div>
      )}
    </div>
  );
}
