// src/components/GovBar.jsx

const GOV_BAR_STYLE = {
  background: "#f5f5f5",
  borderBottom: "1px solid #d0d0d0",
  padding: "5px 24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  fontSize: "12px",
  color: "#333",
  fontFamily: "'DM Sans', sans-serif",
  minHeight: "40px",
};

const LEFT_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
};

const EMBLEM_STYLE = {
  width: "28px",
  height: "28px",
  objectFit: "contain",
};

const DIVIDER = {
  width: "1px",
  height: "20px",
  background: "#bbb",
  margin: "0 4px",
};

const LINKS_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
  fontSize: "11px",
  color: "#003087",
};

export default function GovBar() {
  return (
    <div style={GOV_BAR_STYLE}>
      <div style={LEFT_STYLE}>
        {/* India Emblem SVG placeholder (Ashoka Chakra colours) */}
        <svg width="28" height="28" viewBox="0 0 28 28" style={EMBLEM_STYLE}>
          <circle cx="14" cy="14" r="13" fill="#003087" stroke="#C8972A" strokeWidth="1.5"/>
          <circle cx="14" cy="14" r="6" fill="none" stroke="#C8972A" strokeWidth="1.2"/>
          {[...Array(24)].map((_, i) => {
            const angle = (i * 15 * Math.PI) / 180;
            return (
              <line
                key={i}
                x1={14 + 6 * Math.cos(angle)}
                y1={14 + 6 * Math.sin(angle)}
                x2={14 + 5 * Math.cos(angle)}
                y2={14 + 5 * Math.sin(angle)}
                stroke="#C8972A"
                strokeWidth="1"
              />
            );
          })}
          <circle cx="14" cy="14" r="1.5" fill="#C8972A"/>
        </svg>

        <div>
          <div style={{ fontWeight: 700, fontSize: "12px", color: "#003087", letterSpacing: "0.3px" }}>
            Government of India
          </div>
          <div style={{ fontSize: "10px", color: "#555", letterSpacing: "0.2px" }}>
            Ministry of Environment, Forest and Climate Change
          </div>
        </div>

        <div style={DIVIDER} />

        {/* Tricolour accent strip */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <div style={{ width: "32px", height: "3px", background: "#FF6B00", borderRadius: "1px" }} />
          <div style={{ width: "32px", height: "3px", background: "#fff", border: "0.5px solid #ccc", borderRadius: "1px" }} />
          <div style={{ width: "32px", height: "3px", background: "#138808", borderRadius: "1px" }} />
        </div>
      </div>

      <div style={LINKS_STYLE}>
        <a href="#" style={{ color: "#003087" }}>Skip to main content</a>
        <span style={DIVIDER} />
        <a href="#" style={{ color: "#003087" }}>Screen Reader Access</a>
        <span style={DIVIDER} />
        <span style={{ color: "#555" }}>A  A+  A-</span>
        <span style={DIVIDER} />
        <span style={{ display: "flex", gap: "6px" }}>
          <span style={{ padding: "1px 6px", border: "1px solid #003087", color: "#003087", borderRadius: "3px", cursor: "pointer" }}>EN</span>
          <span style={{ padding: "1px 6px", border: "1px solid #bbb", color: "#555", borderRadius: "3px", cursor: "pointer" }}>हि</span>
        </span>
      </div>
    </div>
  );
}