// src/components/analytics/Heatmap.jsx
import React, { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";

/**
 * Heatmap: Samples (X-axis) vs Compound Formulas (Y-axis)
 * Color intensity = Area (Max.)
 * Hover tooltip shows: name, formula, m/z, RT, area
 */
function Heatmap({ data }) {
  const [tooltip, setTooltip] = useState(null);

  // Build sorted list of file names (X) and unique formulas (Y)
  const fileNames = useMemo(() => Object.keys(data), [data]);

  // Collect all unique formulas across all files, sorted alphabetically
  const formulas = useMemo(() => {
    const set = new Set();
    fileNames.forEach(fn => data[fn].forEach(row => {
      if (row.formula) set.add(row.formula);
    }));
    return Array.from(set).sort();
  }, [data, fileNames]);

  // Build a lookup: { formula: { fileName: row } }
  const lookup = useMemo(() => {
    const map = {};
    fileNames.forEach(fn => {
      data[fn].forEach(row => {
        if (!row.formula) return;
        if (!map[row.formula]) map[row.formula] = {};
        // If multiple rows share the same formula in one file, keep the max area
        if (!map[row.formula][fn] || row.area > map[row.formula][fn].area) {
          map[row.formula][fn] = row;
        }
      });
    });
    return map;
  }, [data, fileNames]);

  // Find global max area for color normalization
  const maxArea = useMemo(() => {
    let max = 0;
    fileNames.forEach(fn =>
      data[fn].forEach(row => { if (row.area > max) max = row.area; })
    );
    return max || 1;
  }, [data, fileNames]);

  const areaToColor = (area) => {
    if (!area) return "rgb(240,240,240)";
    const intensity = Math.pow(area / maxArea, 0.4); // power scale for better contrast
    const r = Math.round(255 - intensity * 200);
    const g = Math.round(255 - intensity * 220);
    const b = Math.round(255);
    return `rgb(${r},${g},${b})`;
  };

  const CELL_W = 48;
  const CELL_H = 20;
  const LABEL_W = 200;

  // Calculate HEADER_H dynamically based on the longest file name
  // Each char ≈ 5.5px at font-size 10, rotated 45° → projected vertical height ≈ charCount * 5.5 * sin(45°) ≈ charCount * 3.9
  const maxLabelLen = useMemo(
    () => fileNames.reduce((m, fn) => Math.max(m, fn.length), 0),
    [fileNames]
  );
  const HEADER_H = Math.max(90, Math.ceil(maxLabelLen * 3.9) + 20);

  if (fileNames.length === 0 || formulas.length === 0) {
    return <p className="text-gray-500 text-sm mt-4">No data to display.</p>;
  }

  // Tooltip via portal — renders at document root so it's never clipped by
  // overflow:auto containers and always uses real viewport coordinates (fixed).
  const TooltipPortal = tooltip
    ? createPortal(
        <div
          style={{
            position: "fixed",
            left: tooltip.x + 16,
            top: tooltip.y - 10,
            zIndex: 9999,
            pointerEvents: "none",
            // Smart flip: if too close to right edge, show on left
            ...(typeof window !== "undefined" && tooltip.x > window.innerWidth - 220
              ? { left: "auto", right: window.innerWidth - tooltip.x + 10 }
              : {}),
            // Smart flip: if too close to bottom, show above
            ...(typeof window !== "undefined" && tooltip.y > window.innerHeight - 160
              ? { top: "auto", bottom: window.innerHeight - tooltip.y + 10 }
              : {}),
          }}
          className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl max-w-xs"
        >
          <div className="font-bold mb-1">{tooltip.name || "(no name)"}</div>
          <div><span className="text-gray-300">Formula:</span> {tooltip.formula}</div>
          <div><span className="text-gray-300">m/z:</span> {tooltip.mz}</div>
          <div><span className="text-gray-300">RT:</span> {tooltip.rt} min</div>
          <div><span className="text-gray-300">Area:</span> {tooltip.area?.toLocaleString()}</div>
          <div><span className="text-gray-300">Sample:</span> {tooltip.file}</div>
        </div>,
        document.body
      )
    : null;

  return (
    <div className="relative overflow-auto border border-gray-200 rounded-lg bg-white shadow">
      {TooltipPortal}
      <div style={{ position: "relative" }}>
        <svg
          width={LABEL_W + fileNames.length * CELL_W}
          height={HEADER_H + formulas.length * CELL_H}
          // Allow header text to overflow upward without clipping
          style={{ overflow: "visible" }}
        >
          {/* Clip path for the data area only — prevents cells from bleeding into labels */}
          <defs>
            <clipPath id="heatmap-cells">
              <rect x={LABEL_W} y={HEADER_H} width={fileNames.length * CELL_W} height={formulas.length * CELL_H} />
            </clipPath>
          </defs>

          {/* Column headers (file names) — rotated -45°, full names shown */}
          {fileNames.map((fn, ci) => {
            const cx = LABEL_W + ci * CELL_W + CELL_W / 2;
            const cy = HEADER_H - 8;
            return (
              <g key={fn} transform={`translate(${cx}, ${cy}) rotate(-45)`}>
                <text
                  x={0}
                  y={0}
                  textAnchor="start"
                  dominantBaseline="middle"
                  fontSize={10}
                  fill="#374151"
                  fontFamily="system-ui, sans-serif"
                >
                  {fn}
                </text>
              </g>
            );
          })}

          {/* Row labels (formulas) + cells */}
          {formulas.map((formula, ri) => (
            <g key={formula}>
              {/* Row label */}
              <text
                x={LABEL_W - 6}
                y={HEADER_H + ri * CELL_H + CELL_H / 2 + 4}
                textAnchor="end"
                fontSize={9}
                fill="#374151"
                fontFamily="system-ui, sans-serif"
              >
                {formula.length > 22 ? formula.slice(0, 20) + "…" : formula}
              </text>

              {/* Cells */}
              {fileNames.map((fn, ci) => {
                const row = lookup[formula]?.[fn];
                const area = row?.area || 0;
                const color = areaToColor(area);
                return (
                  <rect
                    key={fn}
                    x={LABEL_W + ci * CELL_W}
                    y={HEADER_H + ri * CELL_H}
                    width={CELL_W - 1}
                    height={CELL_H - 1}
                    fill={color}
                    rx={1}
                    style={{ cursor: area ? "crosshair" : "default" }}
                    onMouseEnter={(e) => {
                      if (!row) return;
                      setTooltip({
                        x: e.clientX,
                        y: e.clientY,
                        name: row.name,
                        formula: row.formula,
                        mz: row.mz,
                        rt: row.rt,
                        area: row.area,
                        file: fn,
                      });
                    }}
                    onMouseMove={(e) => {
                      if (!row) return;
                      setTooltip(prev =>
                        prev ? { ...prev, x: e.clientX, y: e.clientY } : prev
                      );
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })}
            </g>
          ))}
        </svg>

        {/* Color scale legend */}
        <div className="flex items-center gap-2 p-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">Low area</span>
          <div
            style={{
              width: 120,
              height: 12,
              background: "linear-gradient(to right, rgb(240,240,240), rgb(55,35,255))",
              borderRadius: 4,
            }}
          />
          <span className="text-xs text-gray-500">High area</span>
          <span className="text-xs text-gray-400 ml-2">(max: {maxArea.toLocaleString()})</span>
        </div>
      </div>
    </div>
  );
}

export default Heatmap;