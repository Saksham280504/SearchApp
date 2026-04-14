import { Link, useLocation } from "react-router-dom";
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

const logoStyle = {
  height: "50px",
  width: "auto",
  objectFit: "contain",
  filter: "drop-shadow(0 6px 14px rgba(16,56,94,0.12))",
};

export default function Navbar() {
  const { pathname } = useLocation();

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
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            gap: "18px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              justifyContent: "flex-start",
            }}
          >
            <div
              className="chem-panel"
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
              <img src={jalShaktiLogo} alt="Ministry of Jal Shakti" style={logoStyle} />
              <img
                src={denmarkLogo}
                alt="Ministry of Foreign Affairs of Denmark"
                style={logoStyle}
              />
            </div>
          </div>

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
            <span
              className="chem-orb"
              style={{ width: "16px", height: "16px", top: "8px", left: "18px" }}
            />
            <span
              className="chem-orb orb-2"
              style={{ width: "9px", height: "9px", top: "16px", right: "24px" }}
            />
            <div
              style={{
                fontSize: "clamp(2rem, 2.8vw, 3rem)",
                fontWeight: 800,
                letterSpacing: "0.04em",
                lineHeight: 1,
                textShadow: "0 8px 20px rgba(16,56,94,0.12)",
              }}
            >
              SearchApp
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#607893",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                marginTop: "8px",
              }}
            >
              Clean River Intelligence Portal
            </div>
          </Link>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              justifyContent: "flex-end",
            }}
          >
            <div
              className="chem-panel"
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
              <img src={slcrLogo} alt="SLCR" style={logoStyle} />
              <img src={namamiGangeLogo} alt="Namami Gange" style={logoStyle} />
            </div>
          </div>
        </div>

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
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
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
      `}</style>
    </nav>
  );
}
