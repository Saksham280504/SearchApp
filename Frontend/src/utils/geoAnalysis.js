// src/utils/geoAnalysis.js
// Spatial geometry utilities for GIS Analysis Areas:
// - Convex Hull algorithm
// - Padded outer buffer calculation
// - Minimum Spanning Tree (MST) to connect all detecting stations (inner + outer)
// - Curated multi-compound color palette

export const ZONE_PALETTE = [
  { id: "indigo", color: "#4f46e5", name: "Indigo", bg: "rgba(79, 70, 229, 0.18)", border: "#4f46e5" },
  { id: "emerald", color: "#059669", name: "Emerald", bg: "rgba(5, 150, 105, 0.18)", border: "#059669" },
  { id: "amber", color: "#d97706", name: "Amber", bg: "rgba(217, 119, 6, 0.18)", border: "#d97706" },
  { id: "rose", color: "#e11d48", name: "Rose", bg: "rgba(225, 29, 72, 0.18)", border: "#e11d48" },
  { id: "cyan", color: "#0891b2", name: "Cyan", bg: "rgba(8, 145, 178, 0.18)", border: "#0891b2" },
  { id: "purple", color: "#7c3aed", name: "Purple", bg: "rgba(124, 58, 237, 0.18)", border: "#7c3aed" }
];

/**
 * 2D Convex Hull using Monotone Chain algorithm.
 * Input: array of objects with { lat, lng }
 * Output: ordered array of hull vertices
 */
export function getConvexHull(points) {
  if (!points || points.length === 0) return [];
  if (points.length <= 2) return points;

  // Deduplicate points with identical coords
  const unique = [];
  const seen = new Set();
  points.forEach(p => {
    const key = `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(p);
    }
  });

  if (unique.length <= 2) return unique;

  const pts = unique.slice().sort((a, b) => (a.lng === b.lng ? a.lat - b.lat : a.lng - b.lng));

  function cross(o, a, b) {
    return (a.lng - o.lng) * (b.lat - o.lat) - (a.lat - o.lat) * (b.lng - o.lng);
  }

  const lower = [];
  for (let p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

/**
 * Creates an outer buffered polygon enclosing all stations with ~600m padding.
 * Ensures station dots sit comfortably inside the shaded translucent area.
 */
export function computeBufferedPolygon(points, bufferDeg = 0.007) {
  if (!points || points.length === 0) return null;

  // 1 station: circular polygon around point
  if (points.length === 1) {
    const center = points[0];
    const coords = [];
    const steps = 24;
    for (let i = 0; i < steps; i++) {
      const angle = (2 * Math.PI * i) / steps;
      coords.push([
        center.lat + bufferDeg * 1.5 * Math.sin(angle),
        center.lng + bufferDeg * 1.5 * Math.cos(angle)
      ]);
    }
    return coords;
  }

  // 2 stations: capsule polygon connecting both points
  if (points.length === 2) {
    const [p1, p2] = points;
    const dLat = p2.lat - p1.lat;
    const dLng = p2.lng - p1.lng;
    const len = Math.hypot(dLat, dLng) || 1;
    // Perpendicular vector
    const nx = (-dLng / len) * bufferDeg * 1.2;
    const ny = (dLat / len) * bufferDeg * 1.2;

    return [
      [p1.lat + nx - (dLat / len) * bufferDeg, p1.lng + ny - (dLng / len) * bufferDeg],
      [p2.lat + nx + (dLat / len) * bufferDeg, p2.lng + ny + (dLng / len) * bufferDeg],
      [p2.lat - nx + (dLat / len) * bufferDeg, p2.lng - ny + (dLng / len) * bufferDeg],
      [p1.lat - nx - (dLat / len) * bufferDeg, p1.lng - ny - (dLng / len) * bufferDeg]
    ];
  }

  // 3+ stations: expanded convex hull
  const hull = getConvexHull(points);
  if (hull.length < 3) return null;

  const centroid = hull.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat / hull.length, lng: acc.lng + p.lng / hull.length }),
    { lat: 0, lng: 0 }
  );

  return hull.map(p => {
    const dLat = p.lat - centroid.lat;
    const dLng = p.lng - centroid.lng;
    const dist = Math.hypot(dLat, dLng) || 1;
    return [
      p.lat + (dLat / dist) * bufferDeg,
      p.lng + (dLng / dist) * bufferDeg
    ];
  });
}

/**
 * Computes a Minimum Spanning Tree (MST) connecting all detecting stations.
 * This guarantees EVERY station (both inner and outer) is connected with dotted lines!
 * Returns array of line segments: [ [[lat1, lng1], [lat2, lng2]], ... ]
 */
export function computeConnectingNetwork(points) {
  if (!points || points.length <= 1) return [];

  const n = points.length;
  const inTree = new Array(n).fill(false);
  const dist = new Array(n).fill(Infinity);
  const parent = new Array(n).fill(-1);

  dist[0] = 0;
  const edges = [];

  for (let i = 0; i < n; i++) {
    let u = -1;
    for (let j = 0; j < n; j++) {
      if (!inTree[j] && (u === -1 || dist[j] < dist[u])) {
        u = j;
      }
    }
    if (u === -1) break;
    inTree[u] = true;
    if (parent[u] !== -1) {
      edges.push([
        [points[parent[u]].lat, points[parent[u]].lng],
        [points[u].lat, points[u].lng]
      ]);
    }
    for (let v = 0; v < n; v++) {
      if (!inTree[v]) {
        const d = Math.hypot(points[u].lat - points[v].lat, points[u].lng - points[v].lng);
        if (d < dist[v]) {
          dist[v] = d;
          parent[v] = u;
        }
      }
    }
  }

  return edges;
}
