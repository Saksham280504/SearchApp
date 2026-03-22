// src/components/analytics/Chromatogram.jsx
import React, { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#2563eb","#dc2626","#16a34a","#d97706","#7c3aed",
  "#0891b2","#db2777","#65a30d","#ea580c","#0d9488",
  "#9333ea","#ca8a04","#1d4ed8","#b91c1c","#15803d",
  "#a16207","#6d28d9","#0e7490","#be185d","#4d7c0f",
];

/**
 * Custom tooltip — shows compound details for the hovered point.
 * Each data point carries a `_row` field with the full compound object.
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload?._row;
  return (
    <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl max-w-xs">
      <p className="font-bold mb-1">RT: {label} min</p>
      <p>Area: {payload[0]?.value?.toLocaleString()}</p>
      {row && (
        <>
          <p className="mt-1">Name: {row.name || "(no name)"}</p>
          <p>Formula: {row.formula}</p>
          <p>m/z: {row.mz}</p>
          <p>Ref Ion: {row.referenceIon}</p>
        </>
      )}
    </div>
  );
};

function Chromatogram({ data }) {
  const fileNames = useMemo(() => Object.keys(data), [data]);

  /**
   * For each file, build a sorted array of { rt, area, _row }
   * where _row stores the full compound object for the tooltip.
   * If multiple compounds share the same RT in one file, keep the highest area.
   */
  const perFileChartData = useMemo(() => {
    return fileNames.map((fn, i) => {
      const rtMap = {};
      data[fn].forEach(row => {
        const key = row.rt.toFixed(3);
        if (!rtMap[key] || row.area > rtMap[key].area) {
          rtMap[key] = { rt: row.rt, area: row.area, _row: row };
        }
      });
      const points = Object.values(rtMap).sort((a, b) => a.rt - b.rt);
      return { fileName: fn, points, color: COLORS[i % COLORS.length] };
    });
  }, [data, fileNames]);

  if (fileNames.length === 0) {
    return <p className="text-gray-500 text-sm mt-4">No data to display.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {perFileChartData.map(({ fileName, points, color }) => (
        <div key={fileName} className="w-full bg-white rounded-lg shadow border border-gray-200 p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            <span style={{ color }}>●</span>{" "}
            {fileName}
            <span className="text-xs text-gray-400 ml-2">({points.length} peaks)</span>
          </h4>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={points} margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="rt"
                label={{ value: "Retention Time (min)", position: "insideBottom", offset: -10 }}
                tick={{ fontSize: 10 }}
                domain={["auto", "auto"]}
              />
              <YAxis
                dataKey="area"
                tickFormatter={v =>
                  v >= 1e8 ? `${(v / 1e8).toFixed(1)}×10⁸` :
                  v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` :
                  v >= 1e3 ? `${(v / 1e3).toFixed(0)}k` : v
                }
                label={{ value: "Area", angle: -90, position: "insideLeft", offset: 10 }}
                tick={{ fontSize: 10 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="area"
                stroke={color}
                dot={false}
                activeDot={{ r: 5 }}
                strokeWidth={1.5}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
}

export default Chromatogram;