// src/Pages/ReportsPage.jsx
// Phase 5 — Academic-Grade Civil Geoinformatics PDF Report Generator
// Built for: Smart Laboratory on Clean Rivers (SLCR) — India-Denmark Initiative
// Department of Civil Engineering, Indian Institute of Technology (BHU), Varanasi

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { API_BASE_URL } from "../../redux/config";
import CompoundAutocomplete from "../Components/CompoundAutocomplete";
import {
  generateBarChartImage,
  generateGISMapImage
} from "../utils/reportGraphics";

export default function ReportsPage() {
  const { user } = useSelector((s) => s.auth);

  // Form State
  const [datasets, setDatasets]                     = useState([]);
  const [selectedDataset, setSelectedDataset]       = useState("");
  const [compound, setCompound]                     = useState("");

  // Status & Progress State
  const [generating, setGenerating]                 = useState(false);
  const [progressStep, setProgressStep]             = useState("");
  const [error, setError]                           = useState("");
  const [pastReports, setPastReports]               = useState([]);
  const [loadingHistory, setLoadingHistory]         = useState(true);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  const isViewer = (user?.role || "viewer").toLowerCase() === "viewer";

  // 1. Fetch available datasets based on role
  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/datasets`, getAuthHeaders())
      .then((r) => {
        const dset = r.data.datasets || [];
        setDatasets(dset);
        if (dset.length > 0) {
          // If viewer, force first/baseline dataset
          setSelectedDataset(dset[0].id);
        }
      })
      .catch((err) => console.warn("Datasets load failed:", err.message));
  }, []);

  // 2. Load past reports
  const fetchPastReports = () => {
    axios
      .get(`${API_BASE_URL}/api/reports`, getAuthHeaders())
      .then((r) => setPastReports(r.data.reports || []))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  };

  useEffect(() => {
    fetchPastReports();
  }, []);

  // 3. Generate & Download PDF Report
  const handleGenerate = async () => {
    const targetCompound = compound.trim();
    if (!targetCompound) {
      setError("Please select or enter a chemical compound name.");
      return;
    }

    setError("");
    setGenerating(true);
    setProgressStep("Fetching multi-station analytical observations...");

    try {
      // Step A: Fetch detection points & all station coordinates
      const [mapRes, stationsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/analytics/map`, {
          ...getAuthHeaders(),
          params: { compound: targetCompound, datasetId: selectedDataset, exact: "true" }
        }),
        axios.get(`${API_BASE_URL}/api/analytics/stations`, {
          ...getAuthHeaders(),
          params: { datasetId: selectedDataset }
        }).catch(() => ({ data: { stations: [] } }))
      ]);

      const detectingPoints = mapRes.data.points || [];
      const allStations = stationsRes.data.stations || [];

      if (detectingPoints.length === 0) {
        setError(`No analytical records found for "${targetCompound}" across the monitoring stations in this dataset.`);
        setGenerating(false);
        setProgressStep("");
        return;
      }

      // Step B: Generate high-resolution visual graphics for the report
      setProgressStep("Rendering high-resolution abundance bar chart & GIS maps...");

      const graphData = detectingPoints
        .slice()
        .sort((a, b) => (parseFloat(b.area) || 0) - (parseFloat(a.area) || 0))
        .slice(0, 10)
        .map((p) => ({
          name: p.stationCode || (p.sampleFile ? p.sampleFile.split("_ALL")[0] : "Station"),
          area: parseFloat(p.area) || 0
        }));

      const [barChartImage, mapConcentrationImage, mapZoneImage] = await Promise.all([
        generateBarChartImage(graphData, targetCompound),
        generateGISMapImage(allStations, detectingPoints, "concentration", targetCompound),
        generateGISMapImage(allStations, detectingPoints, "zone", targetCompound)
      ]);

      // Step C: Send payload to backend PDFKit compiler
      setProgressStep("Compiling technical PDF report with academic formatting...");

      const response = await axios.post(
        `${API_BASE_URL}/api/reports/generate`,
        {
          compound: targetCompound,
          datasetId: selectedDataset,
          barChartImage,
          mapConcentrationImage,
          mapZoneImage
        },
        {
          ...getAuthHeaders(),
          responseType: "blob"
        }
      );

      // Trigger browser PDF download
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SearchApp_Report_${targetCompound.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Refresh history
      fetchPastReports();
    } catch (err) {
      console.error("Report generation error:", err);
      setError(err.response?.data?.error || "Failed to generate technical PDF report.");
    } finally {
      setGenerating(false);
      setProgressStep("");
    }
  };

  const handleDownload = async (id, compName) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/reports/${id}/download`, {
        ...getAuthHeaders(),
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `SearchApp_Report_${compName || id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Could not download archived report.");
    }
  };

  const activeDatasetObj = datasets.find((d) => String(d.id) === String(selectedDataset));

  return (
    <main style={{
      minHeight: "calc(100vh - 104px)",
      background: "linear-gradient(160deg, #f8fafc 0%, #eef4f8 100%)",
      padding: "44px 20px 60px",
    }}>
      {/* Header Banner */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", color: "#C8972A", marginBottom: 6 }}>
          Phase 5 — Environmental Reporting
        </p>
        <h1 style={{ fontFamily: "'EB Garamond',serif", fontSize: "clamp(2rem,4vw,2.7rem)", color: "#003087", fontWeight: 700, marginBottom: 8 }}>
          HRMS Technical & Compliance Report Generator
        </h1>
        <p style={{ color: "#475569", maxWidth: 640, margin: "0 auto", fontSize: 14, lineHeight: 1.6 }}>
          Compile standardized academic and regulatory reports for chemical contaminants across all river monitoring stations — integrating high-resolution spectral tables, abundance bar charts, and GIS spatial contamination envelopes.
        </p>
      </div>

      <div style={{ maxWidth: 1140, margin: "0 auto", display: "grid", gridTemplateColumns: "minmax(0,1.2fr) minmax(0,0.9fr)", gap: 28, alignItems: "start" }}>

        {/* ── Left Card: Generator Parameters ── */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, borderBottom: "1px solid #e2e8f0", paddingBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#003087", margin: 0 }}>Report Parameters</h2>
              <p style={{ fontSize: 12, color: "#64748b", margin: "3px 0 0" }}>Universal Catchment Analysis across all 40 monitoring stations</p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(0,48,135,0.08)", color: "#003087", padding: "4px 10px", borderRadius: 20 }}>
              SLCR Standard
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            
            {/* 1. Dataset Selection (Role Restricted) */}
            <div style={labelStyle}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={labelText}>Target Dataset <span style={{ color: "#dc2626" }}>*</span></span>
                {isViewer ? (
                  <span style={{ fontSize: 11, color: "#d97706", fontWeight: 600 }}>🔒 Baseline Dataset (Viewer Access)</span>
                ) : (
                  <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 600 }}>✓ Unrestricted Access ({user?.role})</span>
                )}
              </div>

              <select
                value={selectedDataset}
                onChange={(e) => setSelectedDataset(e.target.value)}
                disabled={isViewer}
                style={{
                  ...inputStyle,
                  background: isViewer ? "#f1f5f9" : "#fff",
                  cursor: isViewer ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  borderColor: isViewer ? "#cbd5e1" : "#003087",
                }}
              >
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.file_count || d.fileCount || 40} samples) — {d.river || "Ganga"} Basin
                  </option>
                ))}
              </select>
              {isViewer && (
                <span style={{ fontSize: 11, color: "#64748b" }}>
                  Viewer accounts can generate reports for the baseline 40-sample dataset. Admin/Researcher accounts can analyze custom uploaded datasets.
                </span>
              )}
            </div>

            {/* 2. Compound Selection (Autocomplete) */}
            <div style={labelStyle}>
              <span style={labelText}>Target Chemical Compound <span style={{ color: "#dc2626" }}>*</span></span>
              <CompoundAutocomplete
                value={compound}
                onChange={setCompound}
                onSelect={setCompound}
                placeholder="Type or select compound name (e.g. 2-Hydroxy..., caffeine, atrazine)…"
                inputStyle={inputStyle}
              />
              <span style={{ fontSize: 11, color: "#64748b" }}>
                Analyzes occurrences, precursor m/z, retention times, and relative abundance across all stations.
              </span>
            </div>

            {/* Included Plugins Preview Badges */}
            <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#003087", textTransform: "uppercase", letterSpacing: 0.6, display: "block", marginBottom: 8 }}>
                Automated Report Inclusions
              </span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12, color: "#334155" }}>
                <div>✓ Multi-Station Table (Top 10)</div>
                <div>✓ Abundance Bar Chart (Top 10)</div>
                <div>✓ GIS Concentration Map</div>
                <div>✓ GIS Analysis Zone & MST</div>
              </div>
            </div>

            {error && (
              <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "12px 16px", color: "#b91c1c", fontSize: 12 }}>
                ⚠️ {error}
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={handleGenerate}
              disabled={generating || !compound.trim()}
              style={{
                ...btnPrimary,
                opacity: (generating || !compound.trim()) ? 0.6 : 1,
                cursor: (generating || !compound.trim()) ? "not-allowed" : "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                padding: "14px 20px"
              }}
            >
              {generating ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                    <span style={{ fontSize: 14 }}>Generating Publication-Ready PDF…</span>
                  </div>
                  {progressStep && (
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", fontStyle: "italic", marginTop: 2 }}>
                      {progressStep}
                    </span>
                  )}
                </>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15 }}>
                  <span>📑</span>
                  <span>Generate & Download Technical Report</span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* ── Right Card: Past Reports History ── */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, borderBottom: "1px solid #e2e8f0", paddingBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#003087", margin: 0 }}>Archived Reports</h2>
              <p style={{ fontSize: 12, color: "#64748b", margin: "3px 0 0" }}>Recently generated compliance documents</p>
            </div>
            <span style={{ fontSize: 12, color: "#64748b" }}>{pastReports.length} records</span>
          </div>

          {loadingHistory ? (
            <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "30px 0" }}>Loading archived reports…</p>
          ) : pastReports.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📂</div>
              <p style={{ fontSize: 13, margin: 0 }}>No technical reports generated yet.</p>
              <p style={{ fontSize: 11, color: "#cbd5e1", marginTop: 4 }}>Select a compound on the left to create your first report.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 460, overflowY: "auto", paddingRight: 4 }}>
              {pastReports.map((r) => {
                const compName = r.query_json?.compound || r.file_name?.replace("SearchApp_Report_", "").replace(/\.pdf$/, "") || "Compound";
                const genDate = r.created_at ? new Date(r.created_at).toLocaleDateString("en-IN") : "Recent";

                return (
                  <div key={r.id || r.file_name} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "12px 14px", borderRadius: 10,
                    background: "#fff", border: "1px solid #e2e8f0",
                    transition: "all 0.15s",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
                  }}>
                    <div style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
                      <p style={{ fontWeight: 700, color: "#003087", fontSize: 13, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {compName}
                      </p>
                      <p style={{ color: "#64748b", fontSize: 11, margin: "3px 0 0" }}>
                        40 Stations · Generated on {genDate}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDownload(r.id, compName)}
                      style={{
                        padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700,
                        background: "#003087", color: "#fff", border: "none", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 4, flexShrink: 0
                      }}
                    >
                      <span>↓</span> PDF
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

const cardStyle = {
  background: "#ffffff",
  borderRadius: 16,
  border: "1px solid #e2e8f0",
  boxShadow: "0 8px 30px rgba(0,48,135,0.05)",
  padding: "26px",
};

const btnPrimary = {
  background: "linear-gradient(135deg, #003087, #0a6a8b)",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 700,
  boxShadow: "0 4px 14px rgba(0,48,135,0.25)",
  transition: "all 0.15s",
};

const labelStyle = { display: "flex", flexDirection: "column", gap: 6 };
const labelText = { fontSize: 12, fontWeight: 700, color: "#003087", textTransform: "uppercase", letterSpacing: 0.7 };
const inputStyle = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  fontSize: 13,
  color: "#0f172a",
  outline: "none",
  background: "#fff",
  width: "100%",
  boxSizing: "border-box",
};
