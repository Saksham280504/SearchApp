// src/pages/Home.jsx
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

/* ─── Scroll-reveal hook ─────────────────────────────────────────── */
function useInView(threshold = 0.18) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ─── Counting number hook ───────────────────────────────────────── */
function useCounter(target, duration = 700, started = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started) return;
    let startTime = null;
    const isFloat = target % 1 !== 0;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(isFloat ? parseFloat((eased * target).toFixed(1)) : Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
      else setCount(target);
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);
  return count;
}

/* ─── Animated stat ──────────────────────────────────────────────── */
function AnimatedStat({ value, label, suffix = "", started }) {
  // parse numeric from value string like "30+", "100%", "∞"
  const isSpecial = value === "∞";
  const numeric = isSpecial ? 0 : parseFloat(String(value).replace(/[^0-9.]/g, ""));
  const trailChar = isSpecial ? "" : String(value).replace(/[0-9.]/g, "");
  const count = useCounter(numeric, 700, started && !isSpecial);
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        fontSize: "clamp(28px, 4vw, 40px)",
        fontWeight: 700,
        color: "#C8972A",
        fontFamily: "'EB Garamond', serif",
        lineHeight: 1,
        marginBottom: "6px",
      }}>
        {isSpecial ? "∞" : `${count}${trailChar}`}
      </div>
      <div style={{
        fontSize: "11px",
        color: "rgba(255,255,255,0.6)",
        textTransform: "uppercase",
        letterSpacing: "1.6px",
        fontWeight: 500,
      }}>
        {label}
      </div>
    </div>
  );
}

/* ─── Reveal wrapper ─────────────────────────────────────────────── */
function Reveal({ children, delay = 0, direction = "up", threshold = 0.15 }) {
  const [ref, visible] = useInView(threshold);
  const transforms = {
    up:    "translateY(40px)",
    down:  "translateY(-30px)",
    left:  "translateX(-40px)",
    right: "translateX(40px)",
  };
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : transforms[direction] || transforms.up,
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Feature cards ──────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: "🔬",
    label: "Compound Search",
    desc: "Search by compound name across all sample files. View matched files with full spectral properties and area bar graphs.",
    to: "/query",
    img: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600&q=80",
    accent: "#003087",
  },
  {
    icon: "🗂️",
    label: "Category Search",
    desc: "Browse all compounds within a chemical category and drill into individual compound results with one click.",
    to: "/query",
    img: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=600&q=80",
    accent: "#138808",
  },
  {
    icon: "📊",
    label: "Analytics",
    desc: "Interactive heatmaps, chromatograms and mass spectra across selected sample files for comparative analysis.",
    to: "/analytics",
    img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80",
    accent: "#C8972A",
  },
];

const STATS = [
  { value: "30+",  label: "Sample Files" },
  { value: "3",    label: "Visualisation Types" },
  { value: "∞",    label: "Compounds Indexed" },
  { value: "100%", label: "Real-time Analysis" },
];

/* ─── Main component ─────────────────────────────────────────────── */
export default function Home() {
  const navigate = useNavigate();
  const [statsRef, statsVisible] = useInView(0.3);

  return (
    <main style={{ background: "#FAF8F3", minHeight: "calc(100vh - 104px)", overflow: "hidden" }}>

      {/* ══ HERO ══════════════════════════════════════════════════════ */}
      <section style={{
        position: "relative",
        minHeight: "520px",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "url('https://images.unsplash.com/photo-1576086213369-97a306d36557?w=1600&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center 40%",
          filter: "brightness(0.32)",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(110deg, rgba(0,48,135,0.88) 0%, rgba(0,31,92,0.60) 55%, transparent 100%)",
        }} />
        {/* Decorative animated ring */}
        <div style={{
          position: "absolute", right: "8%", top: "50%", transform: "translateY(-50%)",
          width: "340px", height: "340px", borderRadius: "50%",
          border: "1.5px solid rgba(200,151,42,0.25)",
          animation: "pulse-ring 3s ease-in-out infinite",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", right: "calc(8% + 40px)", top: "50%", transform: "translateY(-50%)",
          width: "260px", height: "260px", borderRadius: "50%",
          border: "1px solid rgba(200,151,42,0.15)",
          animation: "pulse-ring 3s ease-in-out infinite 0.8s",
          pointerEvents: "none",
        }} />

        <div style={{
          position: "relative",
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "90px 40px",
          width: "100%",
        }}>
          {/* Badge */}
          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "rgba(200,151,42,0.18)",
              border: "1px solid rgba(200,151,42,0.5)",
              borderRadius: "20px",
              padding: "4px 14px",
              marginBottom: "22px",
              opacity: 0,
              animation: "fadeSlideUp 0.7s ease 0.1s forwards",
            }}
          >
            <span style={{ color: "#C8972A", fontSize: "11px", letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: 600 }}>
              Smart Laboratory On Clean Rivers
            </span>
          </div>

          <h1
            style={{
              fontFamily: "'EB Garamond', Georgia, serif",
              fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1.15,
              maxWidth: "700px",
              marginBottom: "18px",
              opacity: 0,
              animation: "fadeSlideUp 0.7s ease 0.25s forwards",
            }}
          >
            Chemical Compound<br />
            <span style={{ color: "#C8972A" }}>Analysis Portal</span>
          </h1>

          <p
            style={{
              color: "rgba(255,255,255,0.78)",
              fontSize: "16px",
              maxWidth: "540px",
              lineHeight: 1.75,
              marginBottom: "36px",
              opacity: 0,
              animation: "fadeSlideUp 0.7s ease 0.4s forwards",
            }}
          >
            Real-time search, sorting and visualisation of mass-spectrometry data
            across sample files — powered by compound and category-based
            indexing with interactive analytics.
          </p>

          <div
            style={{
              display: "flex", gap: "14px", flexWrap: "wrap",
              opacity: 0,
              animation: "fadeSlideUp 0.7s ease 0.55s forwards",
            }}
          >
            <button
              onClick={() => navigate("/query")}
              style={{
                background: "#C8972A", color: "#fff", border: "none",
                borderRadius: "8px", padding: "13px 28px", fontSize: "15px",
                fontWeight: 600, cursor: "pointer",
                boxShadow: "0 4px 16px rgba(200,151,42,0.4)",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(200,151,42,0.5)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 16px rgba(200,151,42,0.4)"; }}
            >
              Start Searching →
            </button>
            <button
              onClick={() => navigate("/analytics")}
              style={{
                background: "transparent", color: "#fff",
                border: "1.5px solid rgba(255,255,255,0.5)",
                borderRadius: "8px", padding: "13px 28px", fontSize: "15px",
                fontWeight: 500, cursor: "pointer",
                transition: "border-color 0.15s, background 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#C8972A"; e.currentTarget.style.background = "rgba(200,151,42,0.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)"; e.currentTarget.style.background = "transparent"; }}
            >
              View Analytics
            </button>
          </div>
        </div>
      </section>

      {/* ══ STATS STRIP (counting animation) ═════════════════════════ */}
      <section
        ref={statsRef}
        style={{ background: "#003087", padding: "28px 40px" }}
      >
        <div style={{
          maxWidth: "1280px", margin: "0 auto",
          display: "flex", justifyContent: "space-around",
          flexWrap: "wrap", gap: "20px",
        }}>
          {STATS.map(({ value, label }) => (
            <AnimatedStat key={label} value={value} label={label} started={statsVisible} />
          ))}
        </div>
      </section>

      {/* ══ FEATURE CARDS ════════════════════════════════════════════ */}
      <section style={{ padding: "72px 40px 88px", maxWidth: "1280px", margin: "0 auto" }}>
        <Reveal direction="up" delay={0}>
          <div style={{ textAlign: "center", marginBottom: "52px" }}>
            <div style={{
              display: "inline-block", width: "48px", height: "3px",
              background: "#C8972A", borderRadius: "2px", marginBottom: "16px",
            }} />
            <h2 style={{
              fontFamily: "'EB Garamond', Georgia, serif",
              fontSize: "clamp(1.8rem, 3vw, 2.6rem)",
              color: "#003087", fontWeight: 700, marginBottom: "10px",
            }}>
              Explore the Portal
            </h2>
            <p style={{ color: "#666", fontSize: "15px", maxWidth: "480px", margin: "0 auto", lineHeight: 1.65 }}>
              Choose a module below to begin your analysis
            </p>
          </div>
        </Reveal>

        <div style={{ display: "flex", gap: "26px", justifyContent: "center", flexWrap: "wrap" }}>
          {FEATURES.map(({ icon, label, desc, to, img, accent }, i) => (
            <Reveal key={label} direction="up" delay={i * 120} threshold={0.1}>
              <div
                onClick={() => navigate(to)}
                style={{
                  width: "340px", borderRadius: "16px", overflow: "hidden",
                  background: "#fff",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                  cursor: "pointer",
                  transition: "transform 0.22s, box-shadow 0.22s",
                  border: "1px solid #eee",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-7px)";
                  e.currentTarget.style.boxShadow = "0 14px 40px rgba(0,0,0,0.14)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "";
                  e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.08)";
                }}
              >
                <div style={{ position: "relative", height: "200px", overflow: "hidden" }}>
                  <img
                    src={img} alt={label}
                    style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s" }}
                    onMouseEnter={e => e.currentTarget.style.transform = "scale(1.07)"}
                    onMouseLeave={e => e.currentTarget.style.transform = ""}
                  />
                  <div style={{
                    position: "absolute", bottom: "14px", left: "14px",
                    background: accent, width: "44px", height: "44px",
                    borderRadius: "10px", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: "22px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                  }}>
                    {icon}
                  </div>
                </div>
                <div style={{ padding: "20px 22px 24px" }}>
                  <h3 style={{
                    fontFamily: "'EB Garamond', Georgia, serif",
                    fontSize: "20px", fontWeight: 700, color: accent, marginBottom: "8px",
                  }}>
                    {label}
                  </h3>
                  <p style={{ color: "#555", fontSize: "13.5px", lineHeight: 1.65 }}>{desc}</p>
                  <div style={{
                    marginTop: "16px", fontSize: "13px", fontWeight: 600,
                    color: accent, display: "flex", alignItems: "center", gap: "4px",
                  }}>
                    Open module <span style={{ fontSize: "16px" }}>→</span>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══ ABOUT STRIP ══════════════════════════════════════════════ */}
      <section style={{ background: "#003087", padding: "60px 40px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <Reveal direction="up" delay={0}>
            <h2 style={{
              fontFamily: "'EB Garamond', Georgia, serif",
              fontSize: "clamp(1.5rem, 2.5vw, 2.2rem)",
              color: "#fff", marginBottom: "16px", fontWeight: 600,
            }}>
              About the Portal
            </h2>
            <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "15px", lineHeight: 1.85, marginBottom: "28px" }}>
              This portal enables researchers and environmental scientists to search, sort, and
              visualise mass-spectrometry compound data across multiple sample files in real time.
              Built under the Smart Laboratory on Clean Rivers, it supports
              evidence-based environmental decision making.
            </p>
            <button
              onClick={() => navigate("/contact")}
              style={{
                background: "transparent", border: "1.5px solid #C8972A",
                color: "#C8972A", padding: "11px 28px", borderRadius: "8px",
                fontSize: "14px", fontWeight: 600, cursor: "pointer",
                transition: "background 0.18s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(200,151,42,0.14)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            >
              Get in Touch
            </button>
          </Reveal>
        </div>
      </section>

      {/* ══ KEYFRAMES ════════════════════════════════════════════════ */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-ring {
          0%   { opacity: 0.4; transform: translateY(-50%) scale(1); }
          50%  { opacity: 0.8; transform: translateY(-50%) scale(1.06); }
          100% { opacity: 0.4; transform: translateY(-50%) scale(1); }
        }
      `}</style>
    </main>
  );
}