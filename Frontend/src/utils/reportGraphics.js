// src/utils/reportGraphics.js
// Client-side high-resolution (300 DPI equivalent) canvas graphics engine
// Designed to match official Civil Geoinformatics Cartographic Standards (SLCR / IIT BHU)
// Generates:
// 1. Publication-grade Peak Area Abundance Bar Chart (Top 10 stations)
// 2. GIS Spatial Map: Peak Area % Concentration View (Pillars + Basin Land Cover + Top-Right Legend)
// 3. GIS Spatial Map: Spatial Analysis Zone (Buffered Polygon + MST Network + Catchment Basin)

import { computeBufferedPolygon, computeConnectingNetwork } from "./geoAnalysis";

/**
 * Format numerical peak areas into scientific notation (e.g. 2.8 × 10⁵, 1.4 × 10⁶, 3.1 × 10⁷)
 * matching academic cartographic references.
 */
export function formatScientificArea(val) {
  const num = parseFloat(val) || 0;
  if (num === 0) return "0";
  const exp = Math.floor(Math.log10(num));
  const base = (num / Math.pow(10, exp)).toFixed(1);
  return `${base} × 10${toSuperscript(exp)}`;
}

function toSuperscript(n) {
  const map = {
    "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
    "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻"
  };
  return String(n).split("").map((c) => map[c] || c).join("");
}

/**
 * Format numerical peak areas into compact labels (e.g., 30.6M, 420k).
 */
export function formatCompactArea(val) {
  const num = parseFloat(val) || 0;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(0)}k`;
  return num.toLocaleString();
}

/**
 * Generates a high-DPI bar chart PNG for Top 10 detecting stations.
 */
export async function generateBarChartImage(graphData = [], compoundName = "") {
  return new Promise((resolve) => {
    const width = 1200;
    const height = 560;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    // Clean white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Outer subtle card border
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(8, 8, width - 16, height - 16);

    // Title banner
    ctx.fillStyle = "#10385e";
    ctx.font = "bold 24px 'Helvetica Neue', Arial, sans-serif";
    ctx.fillText("Top 10 Relative Peak Area Abundance by Monitoring Station", 40, 48);

    ctx.fillStyle = "#64748b";
    ctx.font = "15px 'Helvetica Neue', Arial, sans-serif";
    const subText = compoundName
      ? `Compound: ${compoundName} | High-Resolution Mass Spectrometry (HRMS)`
      : "HRMS Non-Target Screening Observations";
    ctx.fillText(subText, 40, 74);

    if (!graphData || graphData.length === 0) {
      ctx.fillStyle = "#94a3b8";
      ctx.font = "italic 18px Arial";
      ctx.fillText("No station observation data available for abundance charting.", 40, 240);
      resolve(canvas.toDataURL("image/png"));
      return;
    }

    // Top 10 stations only
    const n = Math.min(graphData.length, 10);
    const subset = graphData.slice(0, n);

    // Chart plotting geometry
    const padding = { top: 110, right: 60, bottom: 105, left: 110 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxVal = Math.max(...subset.map((d) => parseFloat(d.area) || 0), 1);

    // Horizontal grid lines & Y-axis labels
    const gridSteps = 5;
    ctx.strokeStyle = "#f1f5f9";
    ctx.lineWidth = 1.5;
    ctx.font = "13px 'Helvetica Neue', Arial, sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.textAlign = "right";

    for (let i = 0; i <= gridSteps; i++) {
      const yVal = (maxVal / gridSteps) * i;
      const yPos = padding.top + chartH - (chartH / gridSteps) * i;

      ctx.beginPath();
      ctx.moveTo(padding.left, yPos);
      ctx.lineTo(padding.left + chartW, yPos);
      ctx.stroke();

      ctx.fillText(formatCompactArea(yVal), padding.left - 14, yPos + 4);
    }

    // Y-Axis title
    ctx.save();
    ctx.translate(32, padding.top + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.font = "bold 15px 'Helvetica Neue', Arial, sans-serif";
    ctx.fillStyle = "#10385e";
    ctx.fillText("Peak Area (Max.)", 0, 0);
    ctx.restore();

    // Bars
    const barGap = chartW / n;
    const barWidth = Math.min(barGap * 0.62, 70);

    ctx.textAlign = "center";

    subset.forEach((d, i) => {
      const area = parseFloat(d.area) || 0;
      const h = (area / maxVal) * chartH;
      const x = padding.left + i * barGap + (barGap - barWidth) / 2;
      const y = padding.top + chartH - h;

      // Gradient on bar
      const grad = ctx.createLinearGradient(0, y, 0, y + h);
      grad.addColorStop(0, "#0a6a8b");
      grad.addColorStop(1, "#10385e");

      ctx.fillStyle = grad;
      const r = Math.min(6, barWidth / 2);
      ctx.beginPath();
      ctx.moveTo(x, y + h);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.lineTo(x + barWidth - r, y);
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + r);
      ctx.lineTo(x + barWidth, y + h);
      ctx.closePath();
      ctx.fill();

      // Top value label
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 13px 'Helvetica Neue', Arial, sans-serif";
      ctx.fillText(formatCompactArea(area), x + barWidth / 2, Math.max(y - 8, padding.top - 8));

      // Bottom station code label
      ctx.save();
      ctx.translate(x + barWidth / 2, padding.top + chartH + 16);
      ctx.rotate(-Math.PI / 5);
      ctx.textAlign = "right";
      ctx.fillStyle = "#1e293b";
      ctx.font = "bold 13px 'Helvetica Neue', Arial, sans-serif";
      ctx.fillText(d.name || d.stationCode || "Station", 0, 0);
      ctx.restore();
    });

    // X-Axis baseline
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + chartH);
    ctx.lineTo(padding.left + chartW, padding.top + chartH);
    ctx.stroke();

    // X-Axis title
    ctx.textAlign = "center";
    ctx.font = "bold 14px 'Helvetica Neue', Arial, sans-serif";
    ctx.fillStyle = "#10385e";
    ctx.fillText("Top 10 Detecting Monitoring Stations (Ranked by Abundance)", padding.left + chartW / 2, height - 20);

    resolve(canvas.toDataURL("image/png"));
  });
}

/**
 * Generates academic-grade GIS Maps inspired by the official SLCR / IIT BHU cartography:
 * - Natural catchment basin boundary with land-use shading (Agricultural, Riparian/Vegetation, Urban built-up core)
 * - Stylized River Ganga corridor with Varuna & Assi tributaries
 * - Top-Left high-contrast institutional title banner
 * - Top-Right Legend Box (completely clear of stations)
 * - Bottom-Right Detected Sites & Abundances Table
 * - Bottom-Left Scale Bar & North Arrow
 * - Cartographic Double Neatline border with coordinate tick labels
 */
export async function generateGISMapImage(
  allStations = [],
  detectingPoints = [],
  mode = "concentration",
  compoundName = ""
) {
  return new Promise((resolve) => {
    const width = 1200;
    const height = 760;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    // Overall canvas background
    ctx.fillStyle = "#eef2f6";
    ctx.fillRect(0, 0, width, height);

    // Map drawing envelope
    const padding = { top: 65, right: 40, bottom: 50, left: 65 };
    const mapW = width - padding.left - padding.right;
    const mapH = height - padding.top - padding.bottom;

    // ── GEOGRAPHIC BOUNDING BOX ───────────────────────────────────────────
    const validStations = allStations.filter((s) => s.latitude && s.longitude);
    const lats = validStations.map((s) => parseFloat(s.latitude));
    const lngs = validStations.map((s) => parseFloat(s.longitude));

    const minLat = Math.min(...lats, 25.24) - 0.035;
    const maxLat = Math.max(...lats, 25.68) + 0.035;
    const minLng = Math.min(...lngs, 82.30) - 0.045;
    const maxLng = Math.max(...lngs, 83.16) + 0.045;

    function toX(lng) {
      return padding.left + ((lng - minLng) / (maxLng - minLng)) * mapW;
    }
    function toY(lat) {
      return padding.top + mapH - ((lat - minLat) / (maxLat - minLat)) * mapH;
    }

    // ── BASE MAP: NATURAL CATCHMENT BASIN & LAND USE ───────────────────────
    ctx.save();
    // 1. Outside terrain background (pale neutral)
    ctx.fillStyle = "#edf2f7";
    ctx.fillRect(padding.left, padding.top, mapW, mapH);

    // 2. Catchment Watershed Boundary Polygon
    const catchmentLngLats = [
      [25.25, 82.40], [25.32, 82.32], [25.42, 82.30], [25.55, 82.35],
      [25.66, 82.48], [25.72, 82.68], [25.74, 82.88], [25.71, 83.05],
      [25.64, 83.18], [25.52, 83.20], [25.38, 83.18], [25.26, 83.08],
      [25.22, 82.90], [25.20, 82.70], [25.22, 82.52]
    ];

    ctx.beginPath();
    catchmentLngLats.forEach(([lat, lng], idx) => {
      const x = toX(lng);
      const y = toY(lat);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();

    // Catchment interior: Agricultural warm base tone
    ctx.fillStyle = "#fbf7eb";
    ctx.fill();

    // Soft Riparian / Vegetation Patches inside catchment
    ctx.save();
    ctx.clip(); // Clip strictly within catchment boundary

    // Vegetation patch 1 (Northwest / Gomati-Varuna interfluvial zone)
    ctx.fillStyle = "#d8ecd0";
    ctx.beginPath();
    ctx.ellipse(toX(82.60), toY(25.55), 180, 110, Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();

    // Vegetation patch 2 (East river corridor / forest buffer)
    ctx.fillStyle = "#d2e8c8";
    ctx.beginPath();
    ctx.ellipse(toX(83.08), toY(25.60), 140, 90, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // Vegetation patch 3 (South catchment riparian green)
    ctx.fillStyle = "#deeed5";
    ctx.beginPath();
    ctx.ellipse(toX(82.72), toY(25.28), 160, 80, 0, 0, Math.PI * 2);
    ctx.fill();

    // Urban / Built-up Area: Varanasi civil settlement core (soft terracotta/pink)
    ctx.fillStyle = "#f3dcdc";
    ctx.beginPath();
    ctx.ellipse(toX(82.99), toY(25.32), 85, 75, -Math.PI / 10, 0, Math.PI * 2);
    ctx.fill();

    // Secondary urban satellite patch
    ctx.fillStyle = "#f5e4e4";
    ctx.beginPath();
    ctx.ellipse(toX(82.85), toY(25.40), 55, 45, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── HYDROLOGICAL DRAINAGE SYSTEM ───────────────────────────────────
    // 1. Tributary: Varuna River (NW to Ganga)
    ctx.strokeStyle = "#6eb8e5";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(toX(82.65), toY(25.50));
    ctx.bezierCurveTo(toX(82.78), toY(25.46), toX(82.92), toY(25.40), toX(83.04), toY(25.34));
    ctx.stroke();

    // Varuna label
    ctx.fillStyle = "#1e6091";
    ctx.font = "italic bold 11px Arial";
    ctx.fillText("Varuna River", toX(82.78), toY(25.48));

    // 2. Tributary: Assi Stream (SW to Ganga)
    ctx.strokeStyle = "#7ec4eb";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(toX(82.92), toY(25.25));
    ctx.bezierCurveTo(toX(82.95), toY(25.27), toX(82.98), toY(25.28), toX(83.00), toY(25.29));
    ctx.stroke();

    // 3. Main River Ganga Corridor (S-curve crescent through Varanasi)
    // Riverbanks (casing)
    ctx.strokeStyle = "#3b8cb8";
    ctx.lineWidth = 26;
    ctx.beginPath();
    ctx.moveTo(toX(82.55), toY(25.26));
    ctx.bezierCurveTo(toX(82.75), toY(25.24), toX(82.92), toY(25.27), toX(83.01), toY(25.30));
    ctx.bezierCurveTo(toX(83.05), toY(25.33), toX(83.04), toY(25.40), toX(83.07), toY(25.48));
    ctx.bezierCurveTo(toX(83.10), toY(25.55), toX(83.14), toY(25.62), toX(83.18), toY(25.68));
    ctx.stroke();

    // River water core
    ctx.strokeStyle = "#5caadd";
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.moveTo(toX(82.55), toY(25.26));
    ctx.bezierCurveTo(toX(82.75), toY(25.24), toX(82.92), toY(25.27), toX(83.01), toY(25.30));
    ctx.bezierCurveTo(toX(83.05), toY(25.33), toX(83.04), toY(25.40), toX(83.07), toY(25.48));
    ctx.bezierCurveTo(toX(83.10), toY(25.55), toX(83.14), toY(25.62), toX(83.18), toY(25.68));
    ctx.stroke();

    // River label
    ctx.fillStyle = "#0c4a6e";
    ctx.font = "italic bold 14px 'Helvetica Neue', Arial, sans-serif";
    ctx.fillText("~ River Ganga Corridor ~", toX(82.88), toY(25.23));

    ctx.restore(); // End clip

    // Catchment Boundary Dashed Stroke
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 2.2;
    ctx.setLineDash([8, 5]);
    ctx.beginPath();
    catchmentLngLats.forEach(([lat, lng], idx) => {
      const x = toX(lng);
      const y = toY(lat);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // ── GRATICULES (LATITUDE / LONGITUDE TICKS) ───────────────────────────
    ctx.save();
    ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
    ctx.lineWidth = 0.8;
    ctx.setLineDash([3, 3]);
    ctx.fillStyle = "#475569";
    ctx.font = "bold 11px Arial";

    // Latitudes (25.25°N to 25.65°N)
    for (let lat = 25.25; lat <= 25.68; lat += 0.08) {
      const y = toY(lat);
      if (y >= padding.top + 10 && y <= padding.top + mapH - 10) {
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + mapW, y);
        ctx.stroke();
        ctx.textAlign = "right";
        ctx.fillText(`${lat.toFixed(2)}°N`, padding.left - 6, y + 4);
      }
    }

    // Longitudes (82.35°E to 83.15°E)
    for (let lng = 82.40; lng <= 83.15; lng += 0.15) {
      const x = toX(lng);
      if (x >= padding.left + 10 && x <= padding.left + mapW - 10) {
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, padding.top + mapH);
        ctx.stroke();
        ctx.textAlign = "center";
        ctx.fillText(`${lng.toFixed(2)}°E`, x, padding.top + mapH + 18);
      }
    }
    ctx.restore();

    // ── DATA PREPARATION ──────────────────────────────────────────────────
    const detectMap = new Map();
    let maxArea = 1;
    let minDetectedArea = Infinity;
    detectingPoints.forEach((p) => {
      const code = (p.stationCode || p.code || "").toUpperCase();
      const area = parseFloat(p.area) || 0;
      if (area > maxArea) maxArea = area;
      if (area > 0 && area < minDetectedArea) minDetectedArea = area;
      detectMap.set(code, { ...p, area });
    });
    if (minDetectedArea === Infinity) minDetectedArea = 0;

    const validDetectPoints = detectingPoints
      .filter((p) => p.lat && p.lng)
      .map((p) => ({ lat: parseFloat(p.lat), lng: parseFloat(p.lng) }));

    // ── MODE B: SPATIAL ANALYSIS ZONE & MST NETWORK ────────────────────────
    if (mode === "zone" && validDetectPoints.length > 0) {
      // 1. Buffered Convex Hull Polygon
      const bufferedPoly = computeBufferedPolygon(validDetectPoints, 0.007);
      if (bufferedPoly && bufferedPoly.length >= 3) {
        ctx.save();
        ctx.beginPath();
        bufferedPoly.forEach(([lat, lng], idx) => {
          const x = toX(lng);
          const y = toY(lat);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fillStyle = "rgba(79, 70, 229, 0.20)";
        ctx.fill();
        ctx.strokeStyle = "#4338ca";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([8, 5]);
        ctx.stroke();
        ctx.restore();
      }

      // 2. Minimum Spanning Tree (MST) Connecting All Stations
      const connectingLines = computeConnectingNetwork(validDetectPoints);
      ctx.save();
      ctx.strokeStyle = "#4338ca";
      ctx.lineWidth = 2.2;
      ctx.setLineDash([5, 4]);
      connectingLines.forEach(([p1, p2]) => {
        ctx.beginPath();
        ctx.moveTo(toX(p1[1]), toY(p1[0]));
        ctx.lineTo(toX(p2[1]), toY(p2[0]));
        ctx.stroke();
      });
      ctx.restore();
    }

    // ── DRAW STATIONS & CONCENTRATION PILLARS ──────────────────────────────
    // Helper to draw station symbol based on type
    function drawStationSymbol(ctx, x, y, type, isDetected) {
      const r = isDetected ? 6.5 : 4.5;
      const t = (type || "").toUpperCase();

      if (t === "SW" || t.includes("RIVER")) {
        // Royal Blue Triangle
        ctx.fillStyle = "#0284c7";
        ctx.beginPath();
        ctx.moveTo(x, y - r - 2);
        ctx.lineTo(x + r + 2, y + r);
        ctx.lineTo(x - r - 2, y + r);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (t === "WW" || t.includes("DRAIN")) {
        // Amber Square
        ctx.fillStyle = "#f59e0b";
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x - r, y - r, r * 2, r * 2);
      } else if (t === "STP") {
        // Purple Diamond
        ctx.fillStyle = "#7c3aed";
        ctx.beginPath();
        ctx.moveTo(x, y - r - 2);
        ctx.lineTo(x + r + 2, y);
        ctx.lineTo(x, y + r + 2);
        ctx.lineTo(x - r - 2, y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else {
        // Red Circle (GW / Well)
        ctx.fillStyle = "#dc2626";
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    validStations.forEach((s) => {
      const code = (s.code || "").toUpperCase();
      const detected = detectMap.get(code);
      const x = toX(parseFloat(s.longitude));
      const y = toY(parseFloat(s.latitude));
      const srcType = s.source || (code.startsWith("SW") ? "SW" : code.startsWith("SD") ? "WW" : code.startsWith("SP") ? "STP" : "GW");

      if (mode === "concentration") {
        if (detected) {
          const area = detected.area;
          const ratio = Math.max(area / maxArea, 0.12);

          // 1. Graduated concentration halo ring
          const haloR = 10 + ratio * 14;
          ctx.beginPath();
          ctx.arc(x, y, haloR, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(10, 106, 139, 0.22)";
          ctx.fill();

          // 2. Base station symbol
          drawStationSymbol(ctx, x, y, srcType, true);

          // 3. Standing 3D Vertical Pillar / Bar Graph (Inspired by 5th reference image!)
          const barH = 18 + ratio * 52; // 18px to 70px height
          const barW = 12;
          const barX = x - barW / 2;
          const barY = y - barH - 8;

          // Black base-line under pillar
          ctx.strokeStyle = "#0f172a";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(x - 10, y - 6);
          ctx.lineTo(x + 10, y - 6);
          ctx.stroke();

          // Pillar Gradient Fill (Deep navy to cyan blue)
          const barGrad = ctx.createLinearGradient(0, barY, 0, barY + barH);
          barGrad.addColorStop(0, "#083358");
          barGrad.addColorStop(1, "#0a6a8b");

          ctx.fillStyle = barGrad;
          ctx.fillRect(barX, barY, barW, barH);
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1;
          ctx.strokeRect(barX, barY, barW, barH);

          // 4. Numerical peak area label above pillar (Scientific notation)
          const labelVal = formatScientificArea(area);
          ctx.fillStyle = "#092540";
          ctx.font = "bold 11px Arial";
          ctx.textAlign = "center";
          ctx.fillText(labelVal, x, barY - 4);

          // 5. Station code label below station
          ctx.fillStyle = "#0f172a";
          ctx.font = "bold 11px 'Helvetica Neue', Arial, sans-serif";
          ctx.fillText(code, x, y + 15);
        } else {
          // Baseline non-detecting station
          drawStationSymbol(ctx, x, y, srcType, false);
        }
      } else {
        // Zone Mode
        drawStationSymbol(ctx, x, y, srcType, Boolean(detected));
        if (detected) {
          ctx.fillStyle = "#1e1b4b";
          ctx.font = "bold 11px Arial";
          ctx.textAlign = "center";
          ctx.fillText(code, x, y - 10);
        }
      }
    });

    // ── TOP-LEFT INSTITUTIONAL TITLE BANNER ─────────────────────────────────
    ctx.save();
    const tbX = padding.left + 14;
    const tbY = padding.top + 14;
    const tbW = 440;
    const tbH = 54;

    ctx.fillStyle = "#0b2545";
    ctx.fillRect(tbX, tbY, tbW, tbH);
    ctx.strokeStyle = "#C8972A";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(tbX, tbY, tbW, tbH);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px 'Helvetica Neue', Arial, sans-serif";
    ctx.textAlign = "left";
    const headerTitle = `Spatial Distribution of ${compoundName || "Target Compound"}`;
    ctx.fillText(headerTitle, tbX + 16, tbY + 24);

    ctx.fillStyle = "#93c5fd";
    ctx.font = "12px Arial";
    ctx.fillText("Varanasi Catchment Area — River Ganga Basin", tbX + 16, tbY + 44);
    ctx.restore();

    // ── TOP-RIGHT LEGEND / INDEX (Completely clear of map content!) ─────────
    ctx.save();
    const legW = 230;
    const legH = mode === "concentration" ? 220 : 205;
    const legX = padding.left + mapW - legW - 14;
    const legY = padding.top + 14;

    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.fillRect(legX, legY, legW, legH);
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(legX, legY, legW, legH);

    // Legend Header
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 13px 'Helvetica Neue', Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Legend", legX + 14, legY + 20);

    // Section 1: Sampling Sites
    ctx.font = "bold 11px Arial";
    ctx.fillStyle = "#1e293b";
    ctx.fillText("Sampling Sites", legX + 14, legY + 38);

    const siteItems = [
      { label: "Well (Groundwater)", type: "GW" },
      { label: "River (Surface Water)", type: "SW" },
      { label: "Drain (Wastewater)", type: "WW" },
      { label: "STP Outfall", type: "STP" },
    ];

    siteItems.forEach((si, idx) => {
      const iy = legY + 54 + idx * 18;
      drawStationSymbol(ctx, legX + 22, iy - 4, si.type, true);
      ctx.fillStyle = "#334155";
      ctx.font = "11px Arial";
      ctx.fillText(si.label, legX + 36, iy);
    });

    // Section 2: Mode Specific Visual Elements
    let nextY = legY + 130;
    if (mode === "concentration") {
      // Bar graph indicator
      ctx.fillStyle = "#0a6a8b";
      ctx.fillRect(legX + 17, nextY - 11, 10, 14);
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1;
      ctx.strokeRect(legX + 17, nextY - 11, 10, 14);

      ctx.fillStyle = "#1e293b";
      ctx.font = "11px Arial";
      ctx.fillText("Bar graph: Peak area (Areamax)", legX + 36, nextY);
      nextY += 20;
    } else {
      // Spatial Zone & MST indicators
      ctx.fillStyle = "rgba(79, 70, 229, 0.4)";
      ctx.fillRect(legX + 16, nextY - 9, 12, 12);
      ctx.strokeStyle = "#4338ca";
      ctx.strokeRect(legX + 16, nextY - 9, 12, 12);
      ctx.fillStyle = "#1e293b";
      ctx.font = "11px Arial";
      ctx.fillText("Delineated Spatial Zone (~700m)", legX + 36, nextY);
      nextY += 18;

      ctx.strokeStyle = "#4338ca";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(legX + 16, nextY - 4);
      ctx.lineTo(legX + 30, nextY - 4);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#1e293b";
      ctx.font = "11px Arial";
      ctx.fillText("MST Inter-Station Network", legX + 36, nextY);
      nextY += 20;
    }

    // Hydrology & Boundaries
    ctx.strokeStyle = "#5caadd";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(legX + 16, nextY - 4);
    ctx.lineTo(legX + 30, nextY - 4);
    ctx.stroke();

    ctx.fillStyle = "#334155";
    ctx.font = "11px Arial";
    ctx.fillText("River / Stream", legX + 36, nextY);
    nextY += 18;

    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(legX + 16, nextY - 4);
    ctx.lineTo(legX + 30, nextY - 4);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#334155";
    ctx.font = "11px Arial";
    ctx.fillText("Catchment boundary", legX + 36, nextY);
    ctx.restore();

    // ── BOTTOM-RIGHT DETECTED SITES & VALUES TABLE (From reference image!) ──
    if (detectingPoints.length > 0) {
      ctx.save();
      const topDetections = detectingPoints
        .slice()
        .sort((a, b) => (parseFloat(b.area) || 0) - (parseFloat(a.area) || 0))
        .slice(0, 4);

      const tblW = 250;
      const tblH = 150;
      const tblX = padding.left + mapW - tblW - 14;
      const tblY = padding.top + mapH - tblH - 12;

      // Card Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(tblX, tblY, tblW, tblH);
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(tblX, tblY, tblW, tblH);

      // Header Banner
      ctx.fillStyle = "#dbeafe";
      ctx.fillRect(tblX, tblY, tblW, 22);
      ctx.strokeStyle = "#94a3b8";
      ctx.strokeRect(tblX, tblY, tblW, 22);

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 11px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Detected Sites and Peak Area Values", tblX + tblW / 2, tblY + 15);

      // Table Columns: ID | Sample Type | Peak Area (Areamax)
      const col1 = tblX + 6;
      const col2 = tblX + 58;
      const col3 = tblX + 148;
      const rowY0 = tblY + 36;

      ctx.font = "bold 10px Arial";
      ctx.fillStyle = "#334155";
      ctx.textAlign = "left";
      ctx.fillText("ID", col1, rowY0);
      ctx.fillText("Type", col2, rowY0);
      ctx.fillText("Area (Areamax)", col3, rowY0);

      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tblX, rowY0 + 4);
      ctx.lineTo(tblX + tblW, rowY0 + 4);
      ctx.stroke();

      topDetections.forEach((d, i) => {
        const ry = rowY0 + 18 + i * 16;
        ctx.font = "bold 10px Arial";
        ctx.fillStyle = "#0f172a";
        const code = d.stationCode || (d.sampleFile ? d.sampleFile.split("_")[0] : `Site ${i + 1}`);
        ctx.fillText(code, col1, ry);

        ctx.font = "10px Arial";
        ctx.fillStyle = "#475569";
        const t = code.startsWith("SW") ? "River" : code.startsWith("SD") ? "Drain" : code.startsWith("SP") ? "STP" : "Well";
        ctx.fillText(t, col2, ry);

        ctx.font = "bold 10px Arial";
        ctx.fillStyle = "#0a6a8b";
        ctx.fillText(formatScientificArea(d.area), col3, ry);
      });

      // Range Box at table bottom
      const rBoxY = tblY + tblH - 36;
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(tblX, rBoxY, tblW, 36);
      ctx.strokeStyle = "#cbd5e1";
      ctx.strokeRect(tblX, rBoxY, tblW, 36);

      ctx.font = "bold 9.5px Arial";
      ctx.fillStyle = "#1e293b";
      ctx.textAlign = "left";
      ctx.fillText("Peak Area Range (Detected Sites)", tblX + 8, rBoxY + 13);

      ctx.font = "9px Arial";
      ctx.fillStyle = "#475569";
      ctx.fillText(`Minimum: ${formatScientificArea(minDetectedArea)}`, tblX + 8, rBoxY + 28);
      ctx.fillText(`Maximum: ${formatScientificArea(maxArea)}`, tblX + 130, rBoxY + 28);
      ctx.restore();
    }

    // ── BOTTOM-LEFT SCALE BAR ─────────────────────────────────────────────
    ctx.save();
    const sbX = padding.left + 16;
    const sbY = padding.top + mapH - 22;
    const segW = 35; // 35px = 2.5km

    // Scale Bar background card
    ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
    ctx.fillRect(sbX - 6, sbY - 18, 160, 32);
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 1;
    ctx.strokeRect(sbX - 6, sbY - 18, 160, 32);

    // Segmented alternating bar
    // 0 to 2.5 (black)
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(sbX, sbY - 4, segW, 6);
    // 2.5 to 5 (white)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(sbX + segW, sbY - 4, segW, 6);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 1;
    ctx.strokeRect(sbX + segW, sbY - 4, segW, 6);
    // 5 to 10 (black)
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(sbX + segW * 2, sbY - 4, segW * 2, 6);

    // Scale numbers
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 9px Arial";
    ctx.textAlign = "center";
    ctx.fillText("0", sbX, sbY - 7);
    ctx.fillText("2.5", sbX + segW, sbY - 7);
    ctx.fillText("5", sbX + segW * 2, sbY - 7);
    ctx.fillText("10 km", sbX + segW * 4, sbY - 7);
    ctx.restore();

    // ── NORTH ARROW (Compass Rose) ─────────────────────────────────────────
    ctx.save();
    const naX = padding.left + mapW - 280;
    const naY = padding.top + 34;

    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.moveTo(naX, naY - 20);
    ctx.lineTo(naX + 6, naY + 6);
    ctx.lineTo(naX, naY + 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#94a3b8";
    ctx.beginPath();
    ctx.moveTo(naX, naY - 20);
    ctx.lineTo(naX - 6, naY + 6);
    ctx.lineTo(naX, naY + 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("N", naX, naY - 23);
    ctx.restore();

    // ── DOUBLE NEATLINE CARTOGRAPHIC BORDER ────────────────────────────────
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.strokeRect(padding.left, padding.top, mapW, mapH);

    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 0.8;
    ctx.strokeRect(padding.left - 4, padding.top - 4, mapW + 8, mapH + 8);

    resolve(canvas.toDataURL("image/png"));
  });
}
