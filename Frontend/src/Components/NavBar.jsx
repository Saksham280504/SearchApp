import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import jalShaktiLogo from "../assets/logos/jal-shakti.svg";
import denmarkLogo from "../assets/logos/denmark.png";
import slcrLogo from "../assets/logos/slcr.webp";
import namamiGangeLogo from "../assets/logos/namami-gange.gif";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/query", label: "Query" },
  { to: "/analytics", label: "Analytics" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <nav
      className="nav-hover-shell"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(244,248,251,0.96))",
        borderBottom: "1px solid rgba(176,196,214,0.6)",
        boxShadow: "0 10px 28px rgba(16,56,94,0.08)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div className="navbar-aura" />
      <div className="navbar-chem-line" />

      <div
        style={{
          maxWidth: "1420px",
          margin: "0 auto",
          padding: "12px 24px 8px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* ── Top row: 3-column layout (logos | title | logos) with hamburger on mobile ── */}
        <div className="navbar-top-row">
          {/* Left logos */}
          <div className="navbar-left-logos">
            <div
              className="chem-panel navbar-logo-panel"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "8px 12px",
                borderRadius: "20px",
                border: "1px solid rgba(193,208,220,0.9)",
                boxShadow: "0 10px 24px rgba(16,56,94,0.08)",
              }}
            >
              <img src={jalShaktiLogo} alt="Ministry of Jal Shakti" className="navbar-logo-img" />
              <img src={denmarkLogo} alt="Ministry of Foreign Affairs of Denmark" className="navbar-logo-img" />
            </div>
          </div>

          {/* Center title */}
          <Link
            to="/"
            style={{
              textDecoration: "none",
              textAlign: "center",
              color: "#10385e",
              position: "relative",
              padding: "6px 18px",
            }}
          >
            <span className="chem-orb" style={{ width: "16px", height: "16px", top: "8px", left: "18px" }} />
            <span className="chem-orb orb-2" style={{ width: "9px", height: "9px", top: "16px", right: "24px" }} />
            <div className="navbar-title">
              SearchApp
            </div>
            <div className="navbar-subtitle">
              Clean River Intelligence Portal
            </div>
          </Link>

          {/* Right: logos on desktop, hamburger on mobile */}
          <div className="navbar-right-slot">
            {/* Right logos — shown on desktop */}
            <div
              className="chem-panel navbar-logo-panel navbar-right-logos"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "8px 12px",
                borderRadius: "20px",
                border: "1px solid rgba(193,208,220,0.9)",
                boxShadow: "0 10px 24px rgba(16,56,94,0.08)",
              }}
            >
              <img src={slcrLogo} alt="SLCR" className="navbar-logo-img" />
              <img src={namamiGangeLogo} alt="Namami Gange" className="navbar-logo-img" />
            </div>

            {/* Hamburger — shown only on mobile */}
            <button
              className="navbar-hamburger"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle navigation menu"
            >
              {menuOpen ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <line x1="4" y1="4" x2="16" y2="16" stroke="#10385e" strokeWidth="2" strokeLinecap="round" />
                  <line x1="16" y1="4" x2="4" y2="16" stroke="#10385e" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <line x1="3" y1="5" x2="17" y2="5" stroke="#10385e" strokeWidth="2" strokeLinecap="round" />
                  <line x1="3" y1="10" x2="17" y2="10" stroke="#10385e" strokeWidth="2" strokeLinecap="round" />
                  <line x1="3" y1="15" x2="17" y2="15" stroke="#10385e" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* ── Desktop: hover-reveal nav pills ── */}
        <div className="nav-hover-menu">
          <div
            className="chem-panel"
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "10px",
              flexWrap: "wrap",
              padding: "10px",
              borderRadius: "999px",
              border: "1px solid rgba(194,208,220,0.9)",
              boxShadow: "0 14px 30px rgba(16,56,94,0.08)",
              background: "rgba(255,255,255,0.92)",
              width: "fit-content",
              margin: "10px auto 0",
            }}
          >
            {NAV_LINKS.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  style={{
                    textDecoration: "none",
                    padding: "11px 20px",
                    borderRadius: "999px",
                    fontSize: "15px",
                    fontWeight: 700,
                    color: active ? "#fff" : "#173f67",
                    background: active
                      ? "linear-gradient(135deg, #10385e, #0a6a8b)"
                      : "linear-gradient(180deg, #f6fbff, #e9f2f8)",
                    border: active
                      ? "1px solid rgba(16,56,94,0.95)"
                      : "1px solid rgba(189,207,222,0.95)",
                    boxShadow: active
                      ? "0 14px 24px rgba(16,56,94,0.2)"
                      : "0 6px 16px rgba(16,56,94,0.06)",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Mobile: slide-down drawer nav ── */}
        <div
          className="navbar-mobile-drawer"
          style={{
            maxHeight: menuOpen ? "400px" : "0",
            overflow: "hidden",
            transition: "max-height 0.32s ease",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "12px 0 4px" }}>
            {NAV_LINKS.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  style={{
                    textDecoration: "none",
                    padding: "12px 18px",
                    borderRadius: "14px",
                    fontSize: "15px",
                    fontWeight: 700,
                    color: active ? "#fff" : "#173f67",
                    background: active
                      ? "linear-gradient(135deg, #10385e, #0a6a8b)"
                      : "linear-gradient(180deg, #f6fbff, #e9f2f8)",
                    border: active
                      ? "1px solid rgba(16,56,94,0.95)"
                      : "1px solid rgba(189,207,222,0.95)",
                    boxShadow: active
                      ? "0 8px 18px rgba(16,56,94,0.18)"
                      : "0 4px 10px rgba(16,56,94,0.04)",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        /* ── Navbar top row ── */
        .navbar-top-row {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 18px;
        }
        .navbar-left-logos {
          display: flex;
          align-items: center;
          justify-content: flex-start;
        }
        .navbar-right-slot {
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }
        .navbar-logo-img {
          height: 50px;
          width: auto;
          object-fit: contain;
          filter: drop-shadow(0 6px 14px rgba(16,56,94,0.12));
        }
        .navbar-title {
          font-size: clamp(2rem, 2.8vw, 3rem);
          font-weight: 800;
          letter-spacing: 0.04em;
          line-height: 1;
          text-shadow: 0 8px 20px rgba(16,56,94,0.12);
        }
        .navbar-subtitle {
          font-size: 12px;
          color: #607893;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          margin-top: 8px;
        }

        /* ── Desktop: hover-reveal nav ── */
        .nav-hover-shell .nav-hover-menu {
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          transform: translateY(-8px);
          transition: max-height 0.3s ease, opacity 0.25s ease, transform 0.25s ease;
          pointer-events: none;
        }
        .nav-hover-shell:hover .nav-hover-menu,
        .nav-hover-shell:focus-within .nav-hover-menu {
          max-height: 140px;
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }

        /* ── Mobile: hide desktop-only elements, show mobile ones ── */
        .navbar-hamburger {
          display: none;
          background: none;
          border: 1.5px solid rgba(16,56,94,0.25);
          border-radius: 10px;
          padding: 7px 9px;
          cursor: pointer;
          align-items: center;
          justify-content: center;
        }
        .navbar-mobile-drawer {
          display: none;
        }

        @media (max-width: 768px) {
          .navbar-top-row {
            grid-template-columns: auto 1fr auto;
            gap: 10px;
          }
          .navbar-logo-img {
            height: 34px;
          }
          .navbar-logo-panel {
            gap: 8px;
            padding: 6px 8px;
          }
          .navbar-subtitle {
            display: none;
          }
          .navbar-title {
            font-size: clamp(1.4rem, 5vw, 2rem);
          }
          /* Hide desktop hover menu */
          .nav-hover-shell .nav-hover-menu {
            display: none !important;
          }
          /* Show hamburger */
          .navbar-hamburger {
            display: flex;
          }
          /* Hide right logos, show hamburger instead */
          .navbar-right-logos {
            display: none !important;
          }
          /* Show mobile drawer */
          .navbar-mobile-drawer {
            display: block;
          }
        }
      `}</style>
    </nav>
  );
}
