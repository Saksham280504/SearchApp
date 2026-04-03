// src/components/Navbar.jsx
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

const NAV_LINKS = [
  { to: "/",          label: "Home" },
  { to: "/query",     label: "Query" },
  { to: "/analytics", label: "Analytics" },
  { to: "/contact",   label: "Contact Us" },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav style={{
      position: "sticky",
      top: 0,
      zIndex: 100,
      background: "#003087",
      boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
    }}>
      <div style={{
        maxWidth: "1280px",
        margin: "0 auto",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "64px",
      }}>
        {/* Logo / Brand */}
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
          <div style={{
            width: "38px", height: "38px",
            background: "linear-gradient(135deg, #C8972A, #FF6B00)",
            borderRadius: "8px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "20px",
            boxShadow: "0 2px 8px rgba(200,151,42,0.4)",
          }}>
            🧪
          </div>
          <div>
            <div style={{ color: "#fff", fontFamily: "'EB Garamond', Georgia, serif", fontSize: "18px", fontWeight: 700, lineHeight: 1.1 }}>
              SearchApp
            </div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "10px", letterSpacing: "1.5px", textTransform: "uppercase" }}>
              Chemical Analysis Portal
            </div>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }} className="nav-desktop">
          {NAV_LINKS.map(({ to, label }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                style={{
                  padding: "8px 18px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: active ? 600 : 400,
                  color: active ? "#fff" : "rgba(255,255,255,0.78)",
                  background: active ? "rgba(255,255,255,0.15)" : "transparent",
                  borderBottom: active ? "2px solid #C8972A" : "2px solid transparent",
                  transition: "all 0.18s",
                  letterSpacing: "0.2px",
                  textDecoration: "none",
                }}
                onMouseEnter={e => {
                  if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                }}
                onMouseLeave={e => {
                  if (!active) e.currentTarget.style.background = "transparent";
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: "none",
            background: "transparent",
            border: "none",
            color: "#fff",
            fontSize: "24px",
            cursor: "pointer",
          }}
          className="nav-hamburger"
        >
          ☰
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ background: "#001f5c", padding: "12px 24px 16px" }}>
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              style={{
                display: "block",
                padding: "10px 0",
                color: pathname === to ? "#C8972A" : "rgba(255,255,255,0.85)",
                fontWeight: pathname === to ? 600 : 400,
                borderBottom: "1px solid rgba(255,255,255,0.1)",
                fontSize: "15px",
                textDecoration: "none",
              }}
            >
              {label}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-hamburger { display: block !important; }
        }
      `}</style>
    </nav>
  );
}