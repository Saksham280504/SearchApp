// src/pages/Home.jsx
import { useNavigate } from "react-router-dom";

/* ── Feature cards matching the reference screenshot layout ── */
const FEATURES = [
  {
    icon: "🔬",
    label: "Compound Search",
    desc: "Search by compound name across all sample files. View matched files with full spectral properties and area bar graphs.",
    to: "/query",
    tab: "compound",
    /* Unsplash free-to-use science/chemistry image */
    img: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600&q=80",
    accent: "#003087",
  },
  {
    icon: "🗂️",
    label: "Category Search",
    desc: "Browse all compounds within a chemical category and drill into individual compound results.",
    to: "/query",
    tab: "category",
    img: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=600&q=80",
    accent: "#138808",
  },
  {
    icon: "📊",
    label: "Analytics",
    desc: "Interactive heatmaps, chromatograms and mass spectra across selected sample files for comparative analysis.",
    to: "/analytics",
    tab: null,
    img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80",
    accent: "#C8972A",
  },
];

const STATS = [
  { value: "30+", label: "Sample Files" },
  { value: "3",   label: "Visualisation Types" },
  { value: "∞",   label: "Compounds Indexed" },
  { value: "100%", label: "Real-time Analysis" },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <main style={{ background: "#FAF8F3", minHeight: "calc(100vh - 104px)" }}>

      {/* ═══════════ HERO ═══════════ */}
      <section style={{
        position: "relative",
        minHeight: "520px",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
      }}>
        {/* Background image */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "url('https://images.unsplash.com/photo-1576086213369-97a306d36557?w=1600&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center 40%",
          filter: "brightness(0.35)",
        }} />

        {/* Gradient overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(110deg, rgba(0,48,135,0.82) 0%, rgba(0,31,92,0.55) 50%, transparent 100%)",
        }} />

        {/* Content */}
        <div style={{
          position: "relative",
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "80px 40px",
          width: "100%",
        }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "rgba(200,151,42,0.18)",
            border: "1px solid rgba(200,151,42,0.5)",
            borderRadius: "20px",
            padding: "4px 14px",
            marginBottom: "20px",
          }}>
            <span style={{ color: "#C8972A", fontSize: "11px", letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: 600 }}>
              Ministry of Environment, Forest &amp; Climate Change
            </span>
          </div>

          <h1 style={{
            fontFamily: "'EB Garamond', Georgia, serif",
            fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
            fontWeight: 700,
            color: "#fff",
            lineHeight: 1.15,
            maxWidth: "700px",
            marginBottom: "18px",
          }}>
            Chemical Compound<br />
            <span style={{ color: "#C8972A" }}>Analysis Portal</span>
          </h1>

          <p style={{
            color: "rgba(255,255,255,0.78)",
            fontSize: "16px",
            maxWidth: "540px",
            lineHeight: 1.7,
            marginBottom: "32px",
          }}>
            Real-time search, sorting and visualisation of mass-spectrometry data
            across environmental sample files. Powered by compound and category-based
            indexing with interactive analytics.
          </p>

          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/query")}
              style={{
                background: "#C8972A",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "13px 28px",
                fontSize: "15px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(200,151,42,0.4)",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(200,151,42,0.5)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 16px rgba(200,151,42,0.4)"; }}
            >
              Start Searching →
            </button>
            <button
              onClick={() => navigate("/analytics")}
              style={{
                background: "transparent",
                color: "#fff",
                border: "1.5px solid rgba(255,255,255,0.5)",
                borderRadius: "8px",
                padding: "13px 28px",
                fontSize: "15px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "border-color 0.15s, background 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#C8972A"; e.currentTarget.style.background = "rgba(200,151,42,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)"; e.currentTarget.style.background = "transparent"; }}
            >
              View Analytics
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════ STATS STRIP ═══════════ */}
      <section style={{
        background: "#003087",
        padding: "20px 40px",
      }}>
        <div style={{
          maxWidth: "1280px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-around",
          flexWrap: "wrap",
          gap: "16px",
        }}>
          {STATS.map(({ value, label }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#C8972A", fontFamily: "'EB Garamond', serif" }}>
                {value}
              </div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "1px" }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ FEATURE CARDS (reference screenshot style) ═══════════ */}
      <section style={{ padding: "64px 40px 80px", maxWidth: "1280px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div style={{
            display: "inline-block",
            width: "48px", height: "3px",
            background: "#C8972A",
            borderRadius: "2px",
            marginBottom: "16px",
          }} />
          <h2 style={{
            fontFamily: "'EB Garamond', Georgia, serif",
            fontSize: "clamp(1.8rem, 3vw, 2.6rem)",
            color: "#003087",
            fontWeight: 700,
            marginBottom: "10px",
          }}>
            Explore the Portal
          </h2>
          <p style={{ color: "#666", fontSize: "15px", maxWidth: "500px", margin: "0 auto", lineHeight: 1.6 }}>
            Choose a module below to begin your analysis
          </p>
        </div>

        <div style={{
          display: "flex",
          gap: "24px",
          justifyContent: "center",
          flexWrap: "wrap",
        }}>
          {FEATURES.map(({ icon, label, desc, to, img, accent }) => (
            <div
              key={label}
              onClick={() => navigate(to)}
              style={{
                width: "340px",
                borderRadius: "16px",
                overflow: "hidden",
                background: "#fff",
                boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                cursor: "pointer",
                transition: "transform 0.22s, box-shadow 0.22s",
                border: "1px solid #eee",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.boxShadow = "0 12px 36px rgba(0,0,0,0.14)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.08)";
              }}
            >
              {/* Card image */}
              <div style={{ position: "relative", height: "200px", overflow: "hidden" }}>
                <img
                  src={img}
                  alt={label}
                  style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s" }}
                  onMouseEnter={e => e.currentTarget.style.transform = "scale(1.06)"}
                  onMouseLeave={e => e.currentTarget.style.transform = ""}
                />
                {/* Icon badge */}
                <div style={{
                  position: "absolute",
                  bottom: "14px",
                  left: "14px",
                  background: accent,
                  width: "42px", height: "42px",
                  borderRadius: "10px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "22px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                }}>
                  {icon}
                </div>
              </div>

              {/* Card body */}
              <div style={{ padding: "20px 22px 24px" }}>
                <h3 style={{
                  fontFamily: "'EB Garamond', Georgia, serif",
                  fontSize: "20px",
                  fontWeight: 700,
                  color: accent,
                  marginBottom: "8px",
                }}>
                  {label}
                </h3>
                <p style={{ color: "#555", fontSize: "13.5px", lineHeight: 1.65 }}>
                  {desc}
                </p>
                <div style={{
                  marginTop: "16px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: accent,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}>
                  Open module <span style={{ fontSize: "16px" }}>→</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ ABOUT STRIP ═══════════ */}
      <section style={{
        background: "#003087",
        padding: "56px 40px",
      }}>
        <div style={{
          maxWidth: "900px",
          margin: "0 auto",
          textAlign: "center",
        }}>
          <h2 style={{
            fontFamily: "'EB Garamond', Georgia, serif",
            fontSize: "clamp(1.5rem, 2.5vw, 2.2rem)",
            color: "#fff",
            marginBottom: "16px",
            fontWeight: 600,
          }}>
            About the Portal
          </h2>
          <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "15px", lineHeight: 1.8, marginBottom: "28px" }}>
            This portal enables researchers and environmental scientists to search, sort, and
            visualise mass-spectrometry compound data across multiple sample files in real time.
            Built under the Ministry of Environment, Forest and Climate Change, it supports
            evidence-based environmental decision making.
          </p>
          <button
            onClick={() => navigate("/contact")}
            style={{
              background: "transparent",
              border: "1.5px solid #C8972A",
              color: "#C8972A",
              padding: "11px 26px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(200,151,42,0.12)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            Get in Touch
          </button>
        </div>
      </section>

    </main>
  );
}