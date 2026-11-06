// src/Pages/MapPage.jsx
// Interactive GIS map — Phase 4
// Features:
// 1. Explicit search with 'Visualize on Map' button (no false positives from partial inputs).
// 2. Dual Modes: 'Station Readings (Peak Area %)' vs 'Multi-Compound Analysis Areas'.
// 3. Analysis Area Mode: outer buffered translucent polygon + connecting dotted lines between ALL stations (inner + outer).
// 4. Multi-compound comparative overlay (up to 6 compounds) with curated palette, bottom-right index, and rich hover card.
// 5. Persistent comparison zones per registered user (localStorage).
// 6. Seamless mode switching with compound selector dropdown in Station Readings view.

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Circle,
  Polygon,
  Polyline,
  Popup,
  Tooltip,
  useMap
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from "recharts";
import { API_BASE_URL } from "../../redux/config";
import CompoundAutocomplete from "../Components/CompoundAutocomplete";
import Heatmap from "../Components/Analytics/Heatmap";
import Chromatogram from "../Components/Analytics/Chromatogram";
import MassSpectrum from "../Components/Analytics/MassSpectrum";
import {
  ZONE_PALETTE,
  computeBufferedPolygon,
  computeConnectingNetwork
} from "../utils/geoAnalysis";

// Fix Leaflet's broken default icon path in bundlers
import L from "leaflet";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Map default center — Varanasi study area
const MAP_CENTER = [25.40, 82.75];
const MAP_ZOOM = 10;

// ── Color by sample source type ──────────────────────────────────────
const sourceToColour = (source) => {
  switch ((source || "").toUpperCase()) {
    case "GW":  return "#6366f1"; // purple — groundwater
    case "SW":  return "#0a6a8b"; // blue — surface water
    case "WW":  return "#f59e0b"; // amber — wastewater
    case "STP": return "#dc2626"; // red — STP effluent
    default:    return "#64748b"; // grey
  }
};

const sourceToLabel = (source) => {
  switch ((source || "").toUpperCase()) {
    case "GW":  return "Groundwater (GW)";
    case "SW":  return "Surface Water (SW)";
    case "WW":  return "Wastewater (WW)";
    case "STP": return "Sewage Treatment (STP)";
    default:    return source || "Other";
  }
};

// ── Colour scale for area values ──────────────────────────────────────
const areaToColour = (area, maxArea) => {
  if (!area || !maxArea) return "#64748b";
  const ratio = area / maxArea;
  if (ratio >= 0.75) return "#dc2626";   // high  — red
  if (ratio >= 0.4)  return "#f59e0b";   // mid   — amber
  return "#16a34a";                       // low   — green
};

const areaToRadius = (area, maxArea) => {
  if (!area || !maxArea) return 8;
  const ratio = area / maxArea;
  return 8 + Math.round(ratio * 18); // 8–26 px
};

// ── Auto-fit bounds updater ──────────────────────────────────────────
function BoundsUpdater({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points || points.length === 0) return;
    const lats = points.map((p) => parseFloat(p.displayLat || p.lat || p.latitude)).filter(Boolean);
    const lngs = points.map((p) => parseFloat(p.displayLng || p.lng || p.longitude)).filter(Boolean);
    if (lats.length > 0 && lngs.length > 0) {
      const bounds = [
        [Math.min(...lats) - 0.05, Math.min(...lngs) - 0.05],
        [Math.max(...lats) + 0.05, Math.max(...lngs) + 0.05],
      ];
      map.fitBounds(bounds, { padding: [35, 35] });
    }
  }, [points, map]);
  return null;
}

// ── Programmatic fly-to handler ───────────────────────────────────────
function FlyToHandler({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target && target.lat && target.lng) {
      map.flyTo([target.lat, target.lng], 13, { duration: 1.2 });
    }
  }, [target, map]);
  return null;
}

// ── Disperse overlapping co-located stations ──────────────────────────
function computeDispersedPoints(points, enabled = true) {
  const valid = points.filter(p => {
    const lat = parseFloat(p.lat || p.latitude);
    const lng = parseFloat(p.lng || p.longitude);
    return lat && lng && !isNaN(lat) && !isNaN(lng);
  });

  if (!enabled) {
    return valid.map(p => ({
      ...p,
      displayLat: parseFloat(p.lat || p.latitude),
      displayLng: parseFloat(p.lng || p.longitude),
      actualLat: parseFloat(p.lat || p.latitude),
      actualLng: parseFloat(p.lng || p.longitude),
      sharedCount: 1,
      sharedWith: []
    }));
  }

  const coordGroups = new Map();
  valid.forEach(p => {
    const lat = parseFloat(p.lat || p.latitude);
    const lng = parseFloat(p.lng || p.longitude);
    const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
    if (!coordGroups.has(key)) coordGroups.set(key, []);
    coordGroups.get(key).push(p);
  });

  const dispersed = [];
  coordGroups.forEach((items) => {
    const baseLat = parseFloat(items[0].lat || items[0].latitude);
    const baseLng = parseFloat(items[0].lng || items[0].longitude);

    if (items.length === 1) {
      const p = items[0];
      dispersed.push({
        ...p,
        displayLat: baseLat,
        displayLng: baseLng,
        actualLat: baseLat,
        actualLng: baseLng,
        sharedCount: 1,
        sharedWith: []
      });
    } else {
      const radius = 0.0038; // ~380m radius for visual dispersion
      const total = items.length;
      const sharedCodes = items.map(it => it.code || it.stationCode);

      items.forEach((item, index) => {
        const angle = (2 * Math.PI * index) / total - Math.PI / 2;
        const offsetLat = baseLat + radius * Math.sin(angle);
        const offsetLng = baseLng + (radius / Math.cos(baseLat * Math.PI / 180)) * Math.cos(angle);
        dispersed.push({
          ...item,
          displayLat: offsetLat,
          displayLng: offsetLng,
          actualLat: baseLat,
          actualLng: baseLng,
          sharedCenterLat: baseLat,
          sharedCenterLng: baseLng,
          sharedCount: total,
          sharedWith: sharedCodes.filter(c => c !== (item.code || item.stationCode))
        });
      });
    }
  });

  return dispersed;
}

export default function MapPage() {
  const { user } = useSelector((s) => s.auth);
  const storageKey = `gis_analysis_areas_${user?.id || user?.email || "guest"}`;

  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState("");
  const [stations, setStations] = useState([]);

  // Visualization mode: "readings" (Station Peak Area %) vs "areas" (Create Analysis Area)
  const [viewMode, setViewMode] = useState("areas"); // default to multi-compound analysis area

  // Explicit compound query input state
  const [inputQuery, setInputQuery] = useState("");
  const [selectedCompound, setSelectedCompound] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Mode A: Station Readings state (points for circle scaling)
  const [readingPoints, setReadingPoints] = useState([]);
  const [activeReadingCompound, setActiveReadingCompound] = useState("");

  // Mode B: Multi-Compound Analysis Areas state
  const [analysisAreas, setAnalysisAreas] = useState([]);
  const [hoveredZone, setHoveredZone] = useState(null);
  const hoverTimeoutRef = useRef(null);

  const handleZoneHover = useCallback((zone) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredZone(zone);
  }, []);

  const handleZoneLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredZone(null);
    }, 280);
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  // Compute graph data for the hovered compound zone (matching Compound Search bar chart)
  const hoverGraphData = useMemo(() => {
    if (!hoveredZone || !Array.isArray(hoveredZone.points) || hoveredZone.points.length === 0) {
      return [];
    }
    return hoveredZone.points
      .slice()
      .sort((a, b) => (parseFloat(b.area) || 0) - (parseFloat(a.area) || 0))
      .slice(0, 10)
      .map((p) => {
        const stationLabel = p.stationCode || (p.sampleFile ? p.sampleFile.split("_ALL")[0] : "Station");
        return {
          name: stationLabel,
          area: parseFloat(p.area) || 0,
          stationName: p.stationName || stationLabel,
          sampleFile: p.sampleFile || ""
        };
      });
  }, [hoveredZone]);

  // Station focus and navigation
  const [selectedStation, setSelectedStation] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);
  const [disperseOverlaps, setDisperseOverlaps] = useState(true);
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [searchFilter, setSearchFilter] = useState("");

  // Analytics overlays
  const [heatMapData, setHeatMapData] = useState(null);
  const [compoundData, setCompoundData] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  // 1. Load user's saved analysis areas from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAnalysisAreas(parsed);
          setActiveReadingCompound(parsed[0].name);
        }
      }
    } catch (e) {
      console.warn("Failed to load saved GIS analysis areas:", e.message);
    }
  }, [storageKey]);

  // Save analysis areas to localStorage whenever updated
  const updateAnalysisAreas = (newAreas) => {
    setAnalysisAreas(newAreas);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newAreas));
    } catch (e) {
      console.warn("Failed to persist GIS analysis areas:", e.message);
    }
  };

  // 2. Load datasets on mount
  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/datasets`, getAuthHeaders())
      .then((r) => {
        const dset = r.data.datasets || [];
        setDatasets(dset);
        if (dset.length > 0) {
          setSelectedDataset(dset[0].id);
        }
      })
      .catch((err) => console.warn("Datasets load failed:", err.message));
  }, []);

  // 3. Load stations when dataset changes
  useEffect(() => {
    if (!selectedDataset) return;
    axios.get(`${API_BASE_URL}/api/datasets/${selectedDataset}/stations`, getAuthHeaders())
      .then((r) => setStations(r.data.stations || []))
      .catch((err) => {
        console.warn("Stations load failed:", err.message);
        axios.get(`${API_BASE_URL}/api/analytics/stations`, { ...getAuthHeaders(), params: { datasetId: selectedDataset } })
          .then((r2) => setStations(r2.data.stations || []))
          .catch(() => setStations([]));
      });
  }, [selectedDataset]);

  // ── Execute Compound Search (Triggered ONLY via button click) ────────
  const executeVisualize = async (compoundToSearch) => {
    const target = (compoundToSearch || selectedCompound || inputQuery).trim();
    if (!target) {
      setSearchError("Please select or enter a chemical compound name first.");
      return;
    }

    setSearching(true);
    setSearchError("");

    try {
      const [mapRes, searchRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/analytics/map`, {
          ...getAuthHeaders(),
          params: { compound: target, datasetId: selectedDataset, exact: "true" },
        }),
        axios.get(`${API_BASE_URL}/api/search`, {
          ...getAuthHeaders(),
          params: { keyword: target, type: "compound" },
        }).catch(() => ({ data: {} }))
      ]);

      const pts = mapRes.data.points || [];

      if (pts.length === 0) {
        setSearchError(`No observation records found for "${target}" across the mapped stations.`);
        setSearching(false);
        return;
      }

      // Check if updating Mode A (Station Readings)
      if (viewMode === "readings") {
        setReadingPoints(pts);
        setActiveReadingCompound(target);
        if (searchRes.data.success) {
          setHeatMapData(searchRes.data.heatMapData);
          setCompoundData(searchRes.data.compoundData);
        }
      }

      // In Mode B (Create Analysis Area): add to multi-compound comparison
      const existingIdx = analysisAreas.findIndex(a => a.name.toLowerCase() === target.toLowerCase());
      const paletteColor = existingIdx >= 0
        ? analysisAreas[existingIdx].color
        : ZONE_PALETTE[analysisAreas.length % ZONE_PALETTE.length].color;

      // Extract valid coordinate points for this compound
      const validPoints = pts.filter(p => p.lat && p.lng);
      const bufferedPolygon = computeBufferedPolygon(validPoints, 0.007); // ~700m outer buffer
      const connectingLines = computeConnectingNetwork(validPoints);      // connects ALL stations (inner + outer)

      const maxPeakArea = Math.max(...pts.map(p => parseFloat(p.area) || 0), 0);
      const topPt = pts.slice().sort((a, b) => (parseFloat(b.area) || 0) - (parseFloat(a.area) || 0))[0];

      const newZone = {
        id: target.toLowerCase(),
        name: target,
        color: paletteColor,
        points: pts,
        validPoints,
        bufferedPolygon,
        connectingLines,
        maxArea: maxPeakArea,
        topStation: topPt,
        visible: true,
        totalStations: pts.length
      };

      let updated;
      if (existingIdx >= 0) {
        updated = [...analysisAreas];
        updated[existingIdx] = newZone;
      } else {
        if (analysisAreas.length >= 6) {
          setSearchError("Maximum comparison limit (6 compounds) reached. Remove one to add another.");
          setSearching(false);
          return;
        }
        updated = [...analysisAreas, newZone];
      }

      updateAnalysisAreas(updated);
      setActiveReadingCompound(target);

      if (searchRes.data.success) {
        setHeatMapData(searchRes.data.heatMapData);
        setCompoundData(searchRes.data.compoundData);
      }

    } catch (err) {
      console.error("Map query error:", err);
      setSearchError("Failed to fetch map data. Please check backend connection.");
    } finally {
      setSearching(false);
    }
  };

  // Toggle visibility of a saved compound area
  const toggleZoneVisibility = (id) => {
    const updated = analysisAreas.map(a => a.id === id ? { ...a, visible: !a.visible } : a);
    updateAnalysisAreas(updated);
  };

  // Remove a compound area from comparison
  const removeZone = (id) => {
    const updated = analysisAreas.filter(a => a.id !== id);
    updateAnalysisAreas(updated);
    if (activeReadingCompound.toLowerCase() === id && updated.length > 0) {
      setActiveReadingCompound(updated[0].name);
      setReadingPoints(updated[0].points);
    } else if (updated.length === 0) {
      setActiveReadingCompound("");
      setReadingPoints([]);
    }
  };

  // Clear all saved comparison areas
  const clearAllZones = () => {
    updateAnalysisAreas([]);
    setActiveReadingCompound("");
    setReadingPoints([]);
    setSelectedCompound("");
    setInputQuery("");
    setSearchError("");
  };

  // When switching compound in Station Readings mode dropdown
  const handleSelectReadingCompound = (compoundName) => {
    setActiveReadingCompound(compoundName);
    const zone = analysisAreas.find(a => a.name === compoundName);
    if (zone) {
      setReadingPoints(zone.points);
    } else {
      executeVisualize(compoundName);
    }
  };

  // Compute dispersed points for Leaflet display
  const rawPoints = viewMode === "readings" && readingPoints.length > 0
    ? readingPoints
    : stations;

  const displayPoints = useMemo(() => {
    return computeDispersedPoints(rawPoints, disperseOverlaps);
  }, [rawPoints, disperseOverlaps]);

  const maxReadingArea = viewMode === "readings"
    ? Math.max(...readingPoints.map((p) => parseFloat(p.area) || 0), 1)
    : 0;

  // Collect distinct shared sites for visual grouping rings
  const sharedSites = useMemo(() => {
    if (!disperseOverlaps) return [];
    const siteMap = new Map();
    displayPoints.forEach(p => {
      if (p.sharedCount > 1 && p.sharedCenterLat && p.sharedCenterLng) {
        const key = `${p.sharedCenterLat.toFixed(5)},${p.sharedCenterLng.toFixed(5)}`;
        if (!siteMap.has(key)) {
          siteMap.set(key, {
            lat: p.sharedCenterLat,
            lng: p.sharedCenterLng,
            count: p.sharedCount,
            stations: [p.code || p.stationCode]
          });
        } else {
          const entry = siteMap.get(key);
          const code = p.code || p.stationCode;
          if (!entry.stations.includes(code)) entry.stations.push(code);
        }
      }
    });
    return Array.from(siteMap.values());
  }, [displayPoints, disperseOverlaps]);

  // Filtered station list for left sidebar
  const mappedStations = useMemo(() => {
    return stations.filter(s => s.latitude && s.longitude);
  }, [stations]);

  const unmappedStations = useMemo(() => {
    return stations.filter(s => !s.latitude || !s.longitude);
  }, [stations]);

  const filteredMappedStations = useMemo(() => {
    return mappedStations.filter(s => {
      const matchesSource = sourceFilter === "ALL" || (s.source || "").toUpperCase() === sourceFilter;
      const term = searchFilter.toLowerCase().trim();
      const matchesSearch = !term ||
        (s.code && s.code.toLowerCase().includes(term)) ||
        (s.sampleFile && s.sampleFile.toLowerCase().includes(term)) ||
        (s.name && s.name.toLowerCase().includes(term));
      return matchesSource && matchesSearch;
    });
  }, [mappedStations, sourceFilter, searchFilter]);

  const handleStationClick = (s) => {
    const disp = displayPoints.find(p => (p.code || p.stationCode) === s.code);
    if (disp) {
      setFlyTarget({ lat: disp.displayLat, lng: disp.displayLng });
      setSelectedStation(s.code);
    }
  };

  const dsInfo = datasets.find(d => String(d.id) === String(selectedDataset));

  return (
    <main style={{ height: "calc(100vh - 104px)", overflow: "hidden", display: "flex", flexDirection: "column", background: "#FAF8F3" }}>
      
      {/* Top Bar with Mode Switcher & Stats */}
      <div style={{
        background: "#003087", padding: "10px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14,
        zIndex: 1000, position: "relative", boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#C8972A", margin: 0 }}>
              Phase 4 — GIS Spatial Intelligence
            </p>
            <h1 style={{ fontFamily: "'EB Garamond',serif", fontSize: 20, color: "#fff", margin: 0, fontWeight: 700 }}>
              HRMS Station & Spatial Analysis
            </h1>
          </div>

          {/* Mode Switcher Tabs */}
          <div style={{
            display: "flex", background: "rgba(0,0,0,0.25)", padding: 3, borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.15)", marginLeft: 8
          }}>
            <button
              onClick={() => setViewMode("areas")}
              style={{
                border: "none", cursor: "pointer", padding: "6px 14px", borderRadius: 6,
                background: viewMode === "areas" ? "#C8972A" : "transparent",
                color: viewMode === "areas" ? "#003087" : "#fff",
                fontWeight: 700, fontSize: 12, transition: "all 0.15s",
                display: "flex", alignItems: "center", gap: 6
              }}
            >
              <span>🌐</span> Multi-Compound Analysis Areas
            </button>
            <button
              onClick={() => setViewMode("readings")}
              style={{
                border: "none", cursor: "pointer", padding: "6px 14px", borderRadius: 6,
                background: viewMode === "readings" ? "#C8972A" : "transparent",
                color: viewMode === "readings" ? "#003087" : "#fff",
                fontWeight: 700, fontSize: 12, transition: "all 0.15s",
                display: "flex", alignItems: "center", gap: 6
              }}
            >
              <span>📍</span> Station Readings (Peak Area %)
            </button>
          </div>
        </div>

        {/* Top Right Controls & Co-location Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Quick Badges */}
          <span style={{
            background: "rgba(255,255,255,0.12)", color: "#fff", fontSize: 12, fontWeight: 600,
            padding: "4px 10px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.2)"
          }}>
            🗺️ <strong>{mappedStations.length}</strong> Mapped Stations
          </span>

          <label style={{
            display: "flex", alignItems: "center", gap: 8, color: "#fff", fontSize: 12,
            cursor: "pointer", userSelect: "none", background: "rgba(255,255,255,0.1)",
            padding: "5px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)"
          }}>
            <input
              type="checkbox"
              checked={disperseOverlaps}
              onChange={(e) => setDisperseOverlaps(e.target.checked)}
              style={{ cursor: "pointer", accentColor: "#C8972A" }}
            />
            <span>Disperse Shared Sites ({mappedStations.length} Visible)</span>
          </label>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        
        {/* Left Sidebar */}
        <div style={{
          width: 390, background: "#fff", borderRight: "1px solid #e2e8f0",
          display: "flex", flexDirection: "column", zIndex: 500,
          boxShadow: "4px 0 24px rgba(0,0,0,0.03)"
        }}>
          
          {/* Dataset Selector */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", background: "#fafafa" }}>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>
              Active Dataset
            </label>
            <select
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value)}
              style={{
                width: "100%", padding: "7px 10px", borderRadius: 6,
                border: "1px solid #cbd5e1", background: "#fff", fontSize: 12,
                color: "#0f172a", outline: "none", cursor: "pointer", fontWeight: 600
              }}
            >
              {datasets.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.file_count || d.fileCount || 40} samples)</option>
              ))}
            </select>
          </div>

          {/* Compound Selection & VISUALIZE Trigger */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", background: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#003087", textTransform: "uppercase", letterSpacing: 0.8 }}>
                Compound Overlay Query
              </label>
              {analysisAreas.length > 0 && (
                <span style={{ fontSize: 10, color: "#C8972A", fontWeight: 700 }}>
                  {analysisAreas.length}/6 Active Zones
                </span>
              )}
            </div>

            <CompoundAutocomplete
              value={inputQuery}
              onChange={(val) => {
                setInputQuery(val);
                setSelectedCompound(val);
                if (searchError) setSearchError("");
              }}
              onSelect={(name) => {
                setInputQuery(name);
                setSelectedCompound(name);
                if (searchError) setSearchError("");
              }}
              placeholder="Type or select compound name…"
              inputStyle={{
                padding: "8px 12px",
                borderColor: selectedCompound ? "#003087" : "#cbd5e1",
                fontSize: 12,
                background: "#f8fafc"
              }}
            />

            {/* DEDICATED VISUALIZE BUTTON */}
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button
                onClick={() => executeVisualize()}
                disabled={!selectedCompound.trim() || searching}
                style={{
                  flex: 1, padding: "9px 14px", borderRadius: 6, border: "none",
                  background: !selectedCompound.trim() ? "#cbd5e1" : "linear-gradient(135deg, #003087, #0a6a8b)",
                  color: "#fff", fontWeight: 700, fontSize: 12, cursor: !selectedCompound.trim() ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  boxShadow: selectedCompound.trim() ? "0 2px 8px rgba(0,48,135,0.25)" : "none",
                  transition: "all 0.15s"
                }}
              >
                {searching ? (
                  <span>⏳ Scanning 40 Sample Files…</span>
                ) : (
                  <>
                    <span>🗺️</span>
                    <span>{viewMode === "areas" ? "+ Add Analysis Area" : "Visualize on Map"}</span>
                  </>
                )}
              </button>

              {(selectedCompound || inputQuery) && (
                <button
                  onClick={() => {
                    setInputQuery("");
                    setSelectedCompound("");
                    setSearchError("");
                  }}
                  title="Clear search input"
                  style={{
                    padding: "0 10px", borderRadius: 6, border: "1px solid #cbd5e1",
                    background: "#f1f5f9", color: "#64748b", cursor: "pointer", fontSize: 12, fontWeight: 600
                  }}
                >
                  Clear
                </button>
              )}
            </div>

            {searchError && (
              <div style={{ marginTop: 8, padding: "6px 10px", background: "#fef2f2", color: "#b91c1c", borderRadius: 6, fontSize: 11, border: "1px solid #fecaca" }}>
                ⚠️ {searchError}
              </div>
            )}
          </div>

          {/* MODE SPECIFIC CONTROLS */}
          {/* Mode A: Station Readings Compound Selector Dropdown */}
          {viewMode === "readings" && (
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#003087", marginBottom: 6 }}>
                Active Compound for Station Readings:
              </label>

              {analysisAreas.length > 0 ? (
                <select
                  value={activeReadingCompound}
                  onChange={(e) => handleSelectReadingCompound(e.target.value)}
                  style={{
                    width: "100%", padding: "7px 10px", borderRadius: 6,
                    border: "1px solid #cbd5e1", background: "#fff", fontSize: 12,
                    color: "#0f172a", fontWeight: 600, outline: "none", cursor: "pointer"
                  }}
                >
                  {analysisAreas.map(a => (
                    <option key={a.id} value={a.name}>
                      {a.name} ({a.points.length} stations detected)
                    </option>
                  ))}
                </select>
              ) : activeReadingCompound ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", padding: "6px 10px", borderRadius: 6, border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{activeReadingCompound}</span>
                  <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 600 }}>{readingPoints.length} stations</span>
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>
                  Search and click <em>Visualize on Map</em> to color stations by concentration.
                </p>
              )}
            </div>
          )}

          {/* Mode B: Saved Analysis Areas Manager List */}
          {viewMode === "areas" && analysisAreas.length > 0 && (
            <div style={{ padding: "10px 16px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#003087", textTransform: "uppercase", letterSpacing: 0.6 }}>
                  Active Analysis Zones ({analysisAreas.length}/6)
                </span>
                <button
                  onClick={clearAllZones}
                  style={{ border: "none", background: "none", color: "#dc2626", fontSize: 11, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                >
                  Clear All
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 150, overflowY: "auto" }}>
                {analysisAreas.map(zone => (
                  <div
                    key={zone.id}
                    onMouseEnter={() => handleZoneHover(zone)}
                    onMouseLeave={handleZoneLeave}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "6px 8px",
                      background: hoveredZone?.id === zone.id ? "rgba(255,255,255,0.9)" : "#fff",
                      border: `1px solid ${zone.color}44`, borderLeft: `4px solid ${zone.color}`,
                      borderRadius: 6, transition: "all 0.15s"
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {zone.name}
                      </div>
                      <div style={{ fontSize: 10, color: "#64748b", marginTop: 1 }}>
                        📍 {zone.points.length} stations | Top: {zone.topStation?.stationCode || "—"} ({Math.round(zone.maxArea).toLocaleString()})
                      </div>
                    </div>

                    {/* Visibility Toggle */}
                    <button
                      onClick={() => toggleZoneVisibility(zone.id)}
                      title={zone.visible ? "Hide this zone" : "Show this zone"}
                      style={{ border: "none", background: "none", cursor: "pointer", fontSize: 13, opacity: zone.visible ? 1 : 0.4 }}
                    >
                      {zone.visible ? "👁️" : "🙈"}
                    </button>

                    {/* Delete Zone */}
                    <button
                      onClick={() => removeZone(zone.id)}
                      title="Remove from comparison"
                      style={{ border: "none", background: "none", color: "#dc2626", cursor: "pointer", fontSize: 13 }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filter Bar for Stations */}
          <div style={{ padding: "10px 16px 6px", borderBottom: "1px solid #f1f5f9" }}>
            <input
              type="text"
              placeholder="Filter stations or file names…"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{
                width: "100%", padding: "6px 8px", borderRadius: 6,
                border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 11,
                outline: "none", marginBottom: 6
              }}
            />

            {/* Filter Pills */}
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {[
                { id: "ALL", label: `All (${mappedStations.length})` },
                { id: "GW", label: "GW (14)" },
                { id: "SW", label: "SW (14)" },
                { id: "WW", label: "WW (4)" },
                { id: "STP", label: "STP (4)" },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setSourceFilter(f.id)}
                  style={{
                    border: "none",
                    background: sourceFilter === f.id ? "#003087" : "#f1f5f9",
                    color: sourceFilter === f.id ? "#fff" : "#475569",
                    fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 10,
                    cursor: "pointer", transition: "all 0.15s"
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stations List */}
          <div style={{ flex: 1, overflowY: "auto", padding: "10px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.8 }}>
                Mapped Stations ({filteredMappedStations.length})
              </span>
              <span style={{ fontSize: 10, color: "#94a3b8" }}>Click to fly</span>
            </div>

            {filteredMappedStations.map(s => {
              const isSelected = selectedStation === s.code;
              const disp = displayPoints.find(p => (p.code || p.stationCode) === s.code);
              const isShared = disp && disp.sharedCount > 1;

              return (
                <div
                  key={s.code}
                  onClick={() => handleStationClick(s)}
                  style={{
                    padding: "8px 10px", borderRadius: 6, marginBottom: 5,
                    border: isSelected ? "2px solid #003087" : "1px solid #e2e8f0",
                    background: isSelected ? "#eff6ff" : "#fff",
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                    transition: "all 0.15s"
                  }}
                >
                  <div style={{
                    width: 9, height: 9, borderRadius: "50%",
                    background: sourceToColour(s.source), flexShrink: 0
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{s.code}</span>
                      <span style={{
                        fontSize: 9, fontWeight: 600, padding: "1px 5px", borderRadius: 4,
                        background: sourceToColour(s.source) + "22",
                        color: sourceToColour(s.source)
                      }}>
                        {s.source}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: "#64748b", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      📄 {s.sampleFile || "No sample file"}
                    </div>
                    {isShared && (
                      <div style={{ fontSize: 9, color: "#6366f1", marginTop: 1, fontWeight: 500 }}>
                        👥 Shared GPS Site ({disp.sharedCount} samples)
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Unmapped Samples Section */}
            {unmappedStations.length > 0 && (
              <div style={{ marginTop: 16, paddingTop: 10, borderTop: "1px dashed #cbd5e1" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>
                  Lab & Control Samples ({unmappedStations.length} unmapped)
                </div>
                {unmappedStations.map(s => (
                  <div key={s.code} style={{
                    padding: "6px 8px", borderRadius: 5, marginBottom: 4,
                    border: "1px solid #f1f5f9", background: "#f8fafc", opacity: 0.8
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#475569" }}>{s.code}</span>
                      <span style={{ fontSize: 9, color: "#94a3b8" }}>No Coordinates</span>
                    </div>
                    <div style={{ fontSize: 10, color: "#64748b", marginTop: 1 }}>
                      📄 {s.sampleFile || "No file"} ({s.source})
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Map Container */}
        <div style={{ flex: 1, position: "relative" }}>
          
          {/* FLOATING HOVER CARD & HOVER GRAPH FOR ANALYSIS AREAS */}
          {hoveredZone && (
            <div
              onMouseEnter={() => {
                if (hoverTimeoutRef.current) {
                  clearTimeout(hoverTimeoutRef.current);
                  hoverTimeoutRef.current = null;
                }
              }}
              onMouseLeave={handleZoneLeave}
              style={{
                position: "absolute",
                top: 20,
                right: 20,
                zIndex: 2000,
                background: "rgba(255, 255, 255, 0.98)",
                backdropFilter: "blur(10px)",
                border: `2px solid ${hoveredZone.color}`,
                borderRadius: 12,
                padding: "14px 16px",
                width: 360,
                boxShadow: "0 10px 32px rgba(0,0,0,0.2)",
                animation: "fadeIn 0.15s ease-out",
                pointerEvents: "auto",
              }}
            >
              {/* Header: Swatch + Compound Name */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                  borderBottom: "1px solid #e2e8f0",
                  paddingBottom: 6,
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: hoveredZone.color,
                    flexShrink: 0,
                    boxShadow: `0 0 8px ${hoveredZone.color}88`,
                  }}
                />
                <h4
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: "#003087",
                    fontWeight: 700,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={hoveredZone.name}
                >
                  {hoveredZone.name}
                </h4>
              </div>

              {/* Station Detection Metrics */}
              <div
                style={{
                  fontSize: 11,
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                  color: "#334155",
                }}
              >
                <div>
                  <strong>Detecting Stations:</strong> {hoveredZone.points.length} stations
                </div>
                <div>
                  <strong>Max Peak Area:</strong>{" "}
                  <span style={{ color: "#dc2626", fontWeight: 700 }}>
                    {Math.round(hoveredZone.maxArea).toLocaleString()}
                  </span>
                </div>
                {hoveredZone.topStation && (
                  <>
                    <div>
                      <strong>Highest Detection Station:</strong>{" "}
                      {hoveredZone.topStation.stationCode}{" "}
                      {hoveredZone.topStation.stationName
                        ? `(${hoveredZone.topStation.stationName})`
                        : ""}
                    </div>
                    <div>
                      <strong>Station Coordinates:</strong>{" "}
                      {hoveredZone.topStation.lat?.toFixed(5)}° N,{" "}
                      {hoveredZone.topStation.lng?.toFixed(5)}° E
                    </div>
                    {hoveredZone.topStation.sampleFile && (
                      <div
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <strong>Sample File:</strong>{" "}
                        <code>{hoveredZone.topStation.sampleFile}</code>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* DEDICATED HOVER GRAPH (Exactly matching Compound Search) */}
              {hoverGraphData.length > 0 && (
                <div style={{ marginTop: 12, borderTop: "1px solid #e2e8f0", paddingTop: 8 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#003087",
                        textTransform: "uppercase",
                        letterSpacing: 0.7,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <span>📊</span> Top {hoverGraphData.length} Station Areas
                    </span>
                    <span style={{ fontSize: 9, color: "#64748b", fontStyle: "italic" }}>
                      Peak Area (Max.)
                    </span>
                  </div>

                  <div style={{ height: 165, width: "100%" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={hoverGraphData}
                        margin={{ top: 8, right: 10, left: -14, bottom: 26 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                          dataKey="name"
                          angle={-35}
                          textAnchor="end"
                          interval={0}
                          tick={{ fontSize: 9, fill: "#475569", fontWeight: 600 }}
                          height={28}
                        />
                        <YAxis
                          tick={{ fontSize: 9, fill: "#64748b" }}
                          width={42}
                          tickFormatter={(val) => {
                            if (val >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
                            if (val >= 1e3) return `${(val / 1e3).toFixed(0)}k`;
                            return val;
                          }}
                        />
                        <RechartsTooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const item = payload[0].payload;
                              return (
                                <div
                                  style={{
                                    background: "rgba(15, 23, 42, 0.96)",
                                    color: "#fff",
                                    padding: "6px 10px",
                                    borderRadius: 6,
                                    fontSize: 11,
                                    boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
                                    pointerEvents: "none",
                                  }}
                                >
                                  <div style={{ fontWeight: 700, color: "#f8fafc" }}>{label}</div>
                                  {item.stationName && item.stationName !== label && (
                                    <div style={{ fontSize: 10, color: "#94a3b8" }}>
                                      {item.stationName}
                                    </div>
                                  )}
                                  <div style={{ color: "#38bdf8", marginTop: 2, fontWeight: 700 }}>
                                    Area: {Number(payload[0].value).toLocaleString()}
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar
                          dataKey="area"
                          fill={hoveredZone.color || "#0a6a8b"}
                          radius={[3, 3, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BOTTOM-RIGHT CORNER INDEX / LEGEND */}
          {/* Mode A Legend: Peak Area Scale */}
          {viewMode === "readings" && readingPoints.length > 0 && (
            <div style={{
              position: "absolute", bottom: 25, right: 25, zIndex: 1000,
              background: "rgba(255,255,255,0.96)", border: "1px solid #cbd5e1",
              borderRadius: 10, padding: "12px 16px", color: "#333",
              boxShadow: "0 6px 20px rgba(0,0,0,0.12)"
            }}>
              <p style={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, color: "#003087", margin: "0 0 8px" }}>
                {activeReadingCompound ? `${activeReadingCompound} — Concentration` : "Peak Area Scale"}
              </p>
              {[
                { colour: "#dc2626", label: "High (≥75% max)" },
                { colour: "#f59e0b", label: "Medium (40–75%)" },
                { colour: "#16a34a", label: "Low (<40%)" },
              ].map(({ colour, label }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: colour }} />
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{label}</span>
                </div>
              ))}
              <p style={{ fontSize: 10, color: "#64748b", margin: "8px 0 0", fontStyle: "italic" }}>
                Marker radius scaled by max peak area
              </p>
            </div>
          )}

          {/* Mode B Legend: Multi-Compound Analysis Areas Index */}
          {viewMode === "areas" && analysisAreas.length > 0 && (
            <div style={{
              position: "absolute", bottom: 25, right: 25, zIndex: 1000,
              background: "rgba(255,255,255,0.96)", border: "1px solid #cbd5e1",
              borderRadius: 10, padding: "12px 16px", color: "#333", minWidth: 240, maxWidth: 300,
              boxShadow: "0 6px 20px rgba(0,0,0,0.14)"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0 0 8px" }}>
                <p style={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, color: "#003087", margin: 0 }}>
                  Analysis Areas Index
                </p>
                <span style={{ fontSize: 10, color: "#64748b" }}>{analysisAreas.length}/6</span>
              </div>

              {analysisAreas.map(zone => (
                <div
                  key={zone.id}
                  onMouseEnter={() => handleZoneHover(zone)}
                  onMouseLeave={handleZoneLeave}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "4px 6px",
                    borderRadius: 4, cursor: "pointer",
                    background: hoveredZone?.id === zone.id ? "rgba(0,48,135,0.06)" : "transparent",
                    transition: "all 0.15s", marginBottom: 4
                  }}
                >
                  <div style={{
                    width: 14, height: 14, borderRadius: 3,
                    background: zone.color, flexShrink: 0
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {zone.name}
                    </div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>
                      {zone.points.length} stations | Max: {Math.round(zone.maxArea).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}

              <p style={{ fontSize: 10, color: "#64748b", margin: "8px 0 0", fontStyle: "italic", borderTop: "1px solid #f1f5f9", paddingTop: 4 }}>
                Hover zone or swatch to inspect details
              </p>
            </div>
          )}

          <MapContainer center={MAP_CENTER} zoom={MAP_ZOOM} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <BoundsUpdater points={displayPoints} />
            <FlyToHandler target={flyTarget} />

            {/* Subtle Site Centroid Rings for Co-located Sampling Sites */}
            {sharedSites.map((site, i) => (
              <Circle
                key={`shared-site-${i}`}
                center={[site.lat, site.lng]}
                radius={420} // ~420 meters
                pathOptions={{
                  color: "#6366f1",
                  fillColor: "#6366f1",
                  fillOpacity: 0.05,
                  dashArray: "4 6",
                  weight: 1.5
                }}
              />
            ))}

            {/* MODE B: MULTI-COMPOUND ANALYSIS AREAS */}
            {viewMode === "areas" && analysisAreas.map((zone) => {
              if (!zone.visible) return null;
              const isHovered = hoveredZone?.id === zone.id;

              return (
                <span key={zone.id}>
                  {/* 1. Outer Padded Polygon enclosing all stations */}
                  {zone.bufferedPolygon && (
                    <Polygon
                      positions={zone.bufferedPolygon}
                      eventHandlers={{
                        mouseover: () => handleZoneHover(zone),
                        mouseout: handleZoneLeave
                      }}
                      pathOptions={{
                        color: zone.color,
                        weight: isHovered ? 3.5 : 2,
                        dashArray: "6 6",
                        fillColor: zone.color,
                        fillOpacity: isHovered ? 0.35 : 0.20,
                      }}
                    />
                  )}

                  {/* 2. Dotted Connecting Lines connecting ALL detecting stations (inner + outer) */}
                  {zone.connectingLines && zone.connectingLines.map((edge, edgeIdx) => (
                    <Polyline
                      key={`${zone.id}-edge-${edgeIdx}`}
                      positions={edge}
                      eventHandlers={{
                        mouseover: () => handleZoneHover(zone),
                        mouseout: handleZoneLeave
                      }}
                      pathOptions={{
                        color: zone.color,
                        weight: isHovered ? 3 : 2,
                        dashArray: "4 5",
                        opacity: isHovered ? 0.95 : 0.75
                      }}
                    />
                  ))}
                </span>
              );
            })}

            {/* STATION CIRCLE MARKERS — ALL 36 DISTINCTLY VISIBLE */}
            {displayPoints.map((point, i) => {
              const code = point.stationCode || point.code;
              const name = point.stationName || point.name || point.district || "Unknown";
              const pArea = parseFloat(point.area) || 0;
              const isSelected = selectedStation === code;

              // Color and radius depending on Mode
              let radius = 8;
              let colour = sourceToColour(point.source);

              if (viewMode === "readings" && readingPoints.length > 0) {
                radius = areaToRadius(pArea, maxReadingArea);
                colour = areaToColour(pArea, maxReadingArea);
              } else if (viewMode === "areas") {
                // If a zone is hovered, highlight detecting stations for that compound!
                if (hoveredZone) {
                  const detectedInHovered = hoveredZone.points.some(
                    p => (p.stationCode || p.code) === code
                  );
                  if (detectedInHovered) {
                    radius = 11;
                    colour = hoveredZone.color;
                  }
                }
              }

              if (isSelected) {
                radius = Math.max(radius, 11);
              }

              return (
                <CircleMarker
                  key={`${code}-${i}`}
                  center={[point.displayLat, point.displayLng]}
                  radius={radius}
                  eventHandlers={{
                    click: () => setSelectedStation(code)
                  }}
                  pathOptions={{
                    fillColor: colour,
                    fillOpacity: isSelected ? 0.95 : 0.85,
                    color: isSelected ? "#003087" : "#fff",
                    weight: isSelected ? 3 : 2,
                  }}
                >
                  <Tooltip direction="top" offset={[0, -8]} opacity={0.92}>
                    <div style={{ fontWeight: 700, fontSize: 12 }}>{code}</div>
                    <div style={{ fontSize: 11, color: "#475569" }}>{point.sampleFile}</div>
                    {pArea > 0 && <div style={{ fontSize: 10, color: "#003087", fontWeight: 600 }}>Area: {Math.round(pArea).toLocaleString()}</div>}
                  </Tooltip>

                  <Popup className="custom-popup">
                    <div style={{ padding: 4, minWidth: 220 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", paddingBottom: 6 }}>
                        <h3 style={{ margin: 0, fontSize: 15, color: "#003087", fontWeight: 700 }}>
                          {code}
                        </h3>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                          background: sourceToColour(point.source) + "22",
                          color: sourceToColour(point.source)
                        }}>
                          {sourceToLabel(point.source)}
                        </span>
                      </div>

                      <div style={{ marginTop: 8, fontSize: 12, display: "flex", flexDirection: "column", gap: 3 }}>
                        <div><strong>Sample File:</strong> <code>{point.sampleFile || `${code}_ALL_COMPOUNDS`}</code></div>
                        <div><strong>Location:</strong> {point.district || "Varanasi"}, {point.state || "Uttar Pradesh"}</div>
                        {point.river && <div><strong>River:</strong> {point.river}</div>}
                        <div><strong>GPS Coordinates:</strong> {point.actualLat?.toFixed(6)}° N, {point.actualLng?.toFixed(6)}° E</div>
                      </div>

                      {point.sharedCount > 1 && (
                        <div style={{ marginTop: 8, padding: 6, background: "#f8fafc", borderRadius: 6, border: "1px dashed #cbd5e1", fontSize: 11 }}>
                          <span style={{ fontWeight: 600, color: "#6366f1" }}>👥 Co-located Sampling Site:</span>
                          <div style={{ marginTop: 2, color: "#475569" }}>
                            Sampled together with: <strong>{point.sharedWith.join(", ")}</strong>
                          </div>
                        </div>
                      )}

                      {/* Compound Observation Details */}
                      {pArea > 0 && (
                        <div style={{ marginTop: 10, background: "#f8fafc", padding: 8, borderRadius: 6, border: "1px solid #e2e8f0" }}>
                          <p style={{ margin: "0 0 4px", fontSize: 11, color: "#003087", fontWeight: 700, textTransform: "uppercase" }}>
                            {activeReadingCompound || "Compound Observation"}
                          </p>
                          <p style={{ margin: "2px 0", fontSize: 12 }}><strong>Peak Area:</strong> {Math.round(pArea).toLocaleString()}</p>
                          <p style={{ margin: "2px 0", fontSize: 12 }}><strong>m/z:</strong> {point.mz || "—"}</p>
                          <p style={{ margin: "2px 0", fontSize: 12 }}><strong>RT:</strong> {point.rt ? `${point.rt} min` : "—"}</p>
                        </div>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>

          {/* Heatmap Overlay (Bottom) */}
          {heatMapData && (
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 900,
              background: "#fff", borderTop: "1px solid #e2e8f0", padding: "10px 20px",
              boxShadow: "0 -4px 12px rgba(0,0,0,0.05)", maxHeight: "30vh", overflowY: "auto"
            }}>
              <h4 style={{ margin: "0 0 10px", fontSize: 14, color: "#10385e", fontWeight: 700 }}>
                {activeReadingCompound || selectedCompound} — Area Distribution
              </h4>
              <Heatmap data={heatMapData} />
            </div>
          )}

          {/* Station Analysis Side Panel (Right) */}
          {selectedStation && compoundData && (
            <div style={{
              position: "absolute", top: 0, right: 0, bottom: 0, width: 450, zIndex: 1100,
              background: "#fff", borderLeft: "1px solid #e2e8f0", padding: 20,
              boxShadow: "-4px 0 24px rgba(0,0,0,0.1)", overflowY: "auto"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 18, color: "#10385e", fontWeight: 700 }}>
                  Station: {selectedStation}
                </h3>
                <button onClick={() => setSelectedStation(null)} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#64748b" }}>×</button>
              </div>
              
              {(() => {
                const stationData = Object.fromEntries(
                  Object.entries(compoundData).filter(([file]) => file.startsWith(selectedStation))
                );
                
                if (Object.keys(stationData).length === 0) {
                  return <p style={{ color: "#64748b" }}>No compound data available for this station.</p>;
                }
                
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    <div>
                      <h4 style={{ margin: "0 0 10px", fontSize: 14, color: "#475569", fontWeight: 600, textTransform: "uppercase" }}>Chromatogram</h4>
                      <Chromatogram data={stationData} />
                    </div>
                    <div>
                      <h4 style={{ margin: "0 0 10px", fontSize: 14, color: "#475569", fontWeight: 600, textTransform: "uppercase" }}>Mass Spectrum</h4>
                      <MassSpectrum data={stationData} />
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
