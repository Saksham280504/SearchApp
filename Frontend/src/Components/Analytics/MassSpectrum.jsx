// src/components/analytics/MassSpectrum.jsx
import React, { useMemo } from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";

const COLORS = [
  "#2563eb","#dc2626","#16a34a","#d97706","#7c3aed",
  "#0891b2","#db2777","#65a30d","#ea580c","#0d9488",
  "#9333ea","#ca8a04","#1d4ed8","#b91c1c","#15803d",
  "#a16207","#6d28d9","#0e7490","#be185d","#4d7c0f",
];

/**
 * Custom tooltip for the mass spectrum scatter plot.
 * Recharts passes the full data object as `payload[0].payload`
 */
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl max-w-xs">
      <p className="font-bold mb-1">{d.name || "(no name)"}</p>
      <p><span className="text-gray-300">Formula:</span> {d.formula}</p>
      <p><span className="text-gray-300">m/z:</span> {d.mz}</p>
      <p><span className="text-gray-300">RT:</span> {d.rt} min</p>
      <p><span className="text-gray-300">Area:</span> {d.area?.toLocaleString()}</p>
      <p><span className="text-gray-300">Ref Ion:</span> {d.referenceIon}</p>
    </div>
  );
};

function MassSpectrum({ data }) {
  const fileNames = useMemo(() => Object.keys(data), [data]);

  // Per-file scatter data: array of { mz, area, name, formula, rt, referenceIon }
  const perFileData = useMemo(() => {
    return fileNames.map(fn => ({
      fileName: fn,
      points: data[fn]
        .filter(row => row.mz > 0 && row.area > 0)
        .map(row => ({
          mz:           row.mz,
          area:         row.area,
          name:         row.name,
          formula:      row.formula,
          rt:           row.rt,
          referenceIon: row.referenceIon,
        })),
    }));
  }, [data, fileNames]);

  if (fileNames.length === 0) {
    return <p className="text-gray-500 text-sm mt-4">No data to display.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {perFileData.map(({ fileName, points }, i) => (
        <div key={fileName} className="w-full bg-white rounded-lg shadow border border-gray-200 p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            <span style={{ color: COLORS[i % COLORS.length] }}>●</span>{" "}
            {fileName}
            <span className="text-xs text-gray-400 ml-2">({points.length} peaks)</span>
          </h4>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="mz"
                type="number"
                name="m/z"
                label={{ value: "m/z", position: "insideBottom", offset: -10 }}
                tick={{ fontSize: 10 }}
                domain={["auto", "auto"]}
              />
              <YAxis
                dataKey="area"
                type="number"
                name="Area"
                tickFormatter={v =>
                  v >= 1e8 ? `${(v / 1e8).toFixed(1)}×10⁸` :
                  v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` :
                  v >= 1e3 ? `${(v / 1e3).toFixed(0)}k` : v
                }
                label={{ value: "Area", angle: -90, position: "insideLeft", offset: 10 }}
                tick={{ fontSize: 10 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3" }} />
              <Scatter
                data={points}
                fill={COLORS[i % COLORS.length]}
                opacity={0.7}
                line={false}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
}

export default MassSpectrum;