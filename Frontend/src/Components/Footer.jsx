// src/components/Footer.jsx
import { Link } from "react-router-dom";

const COL_TITLE = {
  fontSize: "12px",
  fontWeight: 700,
  color: "#C8972A",
  textTransform: "uppercase",
  letterSpacing: "1.4px",
  marginBottom: "16px",
};

const LINK_STYLE = {
  display: "block",
  color: "rgba(255,255,255,0.58)",
  fontSize: "13px",
  marginBottom: "10px",
  textDecoration: "none",
  transition: "color 0.18s, padding-left 0.18s",
};

export default function Footer() {
  return (
    <>
      {/* ── Animated wave / bar section ─────────────────────────── */}
      <div style={{ background: "#001540", overflow: "hidden", height: "60px", position: "relative" }}>
        {/* 5 animated bars of different speeds & heights */}
        {[
          { w: "60%",  h: "3px",  color: "rgba(200,151,42,0.55)",  dur: "8s",   delay: "0s",   top: "18px" },
          { w: "45%",  h: "2px",  color: "rgba(19,136,8,0.4)",     dur: "11s",  delay: "1.5s", top: "28px" },
          { w: "35%",  h: "2px",  color: "rgba(255,107,0,0.35)",   dur: "6.5s", delay: "0.8s", top: "38px" },
          { w: "55%",  h: "1.5px",color: "rgba(200,151,42,0.25)",  dur: "9s",   delay: "2s",   top: "46px" },
          { w: "70%",  h: "1px",  color: "rgba(255,255,255,0.12)", dur: "14s",  delay: "0.3s", top: "12px" },
        ].map((bar, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: bar.top,
              left: "-70%",
              width: bar.w,
              height: bar.h,
              background: bar.color,
              borderRadius: "2px",
              animation: `slideBar ${bar.dur} linear ${bar.delay} infinite`,
            }}
          />
        ))}
      </div>

      <footer style={{ background: "#001f5c", color: "#fff" }}>

        {/* ── Pulsing dots row ──────────────────────────────────── */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "8px",
          paddingTop: "20px",
          paddingBottom: "4px",
        }}>
          {["#FF6B00", "#fff", "#138808"].map((c, i) => (
            <div
              key={i}
              style={{
                width: "8px", height: "8px", borderRadius: "50%",
                background: c,
                opacity: c === "#fff" ? 0.4 : 0.9,
                animation: `dotPulse 2.2s ease-in-out ${i * 0.35}s infinite`,
              }}
            />
          ))}
        </div>

        {/* ── Main footer body ──────────────────────────────────── */}
        <div
          className="footer-main-grid"
          style={{
            maxWidth: "1280px", margin: "0 auto",
            padding: "40px clamp(16px, 4vw, 40px) 40px",
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            gap: "40px",
          }}
        >

          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{
                width: "36px", height: "36px",
                background: "linear-gradient(135deg, #C8972A, #FF6B00)",
                borderRadius: "8px",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "18px",
                animation: "float 4s ease-in-out infinite",
              }}>
                🧪
              </div>
              <div>
                <div style={{ fontFamily: "'EB Garamond', serif", fontSize: "18px", fontWeight: 700 }}>
                  SearchApp
                </div>
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.45)", letterSpacing: "1px", textTransform: "uppercase" }}>
                  Chemical Analysis Portal
                </div>
              </div>
            </div>
            <p style={{ color: "rgba(255,255,255,0.52)", fontSize: "13px", lineHeight: 1.8, maxWidth: "280px", marginBottom: "20px" }}>
              A Government of India initiative for real-time mass-spectrometry data search
              and visualisation, enabling evidence-based environmental research.
            </p>

            {/* Gov badge */}
            <div style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "10px 14px",
              background: "rgba(255,255,255,0.06)",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.1)",
              width: "fit-content",
            }}>
              <svg width="22" height="22" viewBox="0 0 28 28">
                <circle cx="14" cy="14" r="13" fill="#003087" stroke="#C8972A" strokeWidth="1.5"/>
                <circle cx="14" cy="14" r="6" fill="none" stroke="#C8972A" strokeWidth="1.2"/>
                {[...Array(24)].map((_, i) => {
                  const angle = (i * 15 * Math.PI) / 180;
                  return (
                    <line key={i}
                      x1={14 + 6 * Math.cos(angle)} y1={14 + 6 * Math.sin(angle)}
                      x2={14 + 5 * Math.cos(angle)} y2={14 + 5 * Math.sin(angle)}
                      stroke="#C8972A" strokeWidth="1"
                    />
                  );
                })}
                <circle cx="14" cy="14" r="1.5" fill="#C8972A"/>
              </svg>
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>
                Government of India<br />
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px" }}>MoEF &amp; CC</span>
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <div style={COL_TITLE}>Quick Links</div>
            {[
              { label: "Home",         to: "/" },
              { label: "Query Search", to: "/query" },
              { label: "Analytics",    to: "/analytics" },
              { label: "Contact Us",   to: "/contact" },
            ].map(({ label, to }) => (
              <Link
                key={to} to={to}
                style={LINK_STYLE}
                onMouseEnter={e => { e.currentTarget.style.color = "#C8972A"; e.currentTarget.style.paddingLeft = "6px"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.58)"; e.currentTarget.style.paddingLeft = "0"; }}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Features */}
          <div>
            <div style={COL_TITLE}>Features</div>
            {["Compound Search","Category Search","Heatmap Visualisation","Chromatogram","Mass Spectrum"].map(f => (
              <div key={f} style={{ ...LINK_STYLE, cursor: "default" }}>{f}</div>
            ))}
          </div>

          {/* Contact */}
          <div>
            <div style={COL_TITLE}>Contact</div>
            <div style={{ color: "rgba(255,255,255,0.58)", fontSize: "13px", lineHeight: 1.85 }}>
              <div style={{ marginBottom: "12px" }}>
                📍 SLCR lab - IIT (BHU) Varanasi,<br />
                Uttar Pradesh, India - 221005
              </div>
              <div style={{ marginBottom: "12px" }}>📞 +91 8905082820</div>
              <div style={{ marginBottom: "12px" }}>✉️ slcr@iitbhu.ac.in</div>
              <div>🕐 Monday – Friday : 9:00 AM – 5:30 PM IST <br />
              Saturday : 10:00 AM - 2:00 PM</div>
            </div>
          </div>
        </div>

        {/* ── Animated moving-bar data-viz accent ───────────────── */}
        <div style={{
          maxWidth: "1280px", margin: "0 auto",
          padding: "0 clamp(16px, 4vw, 40px) 28px",
        }}>
          <div style={{
            background: "rgba(255,255,255,0.04)",
            borderRadius: "10px",
            padding: "16px 24px",
            border: "1px solid rgba(255,255,255,0.08)",
            overflow: "hidden",
            position: "relative",
          }}>
            <div style={{
              fontSize: "10px", color: "rgba(200,151,42,0.7)",
              letterSpacing: "1.4px", textTransform: "uppercase",
              marginBottom: "10px", fontWeight: 600,
            }}>
              Live Data Activity
            </div>
            {/* Animated equaliser bars */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "32px" }}>
              {Array.from({ length: 32 }, (_, i) => {
                const hues = ["#C8972A", "#003087", "#138808", "#FF6B00", "#C8972A", "#fff"];
                const color = hues[i % hues.length];
                const dur = (0.6 + (i % 7) * 0.18).toFixed(2);
                const delay = ((i * 0.07) % 1.2).toFixed(2);
                return (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      background: color,
                      opacity: 0.35 + (i % 4) * 0.1,
                      borderRadius: "2px 2px 0 0",
                      animation: `barUp ${dur}s ease-in-out ${delay}s infinite alternate`,
                      minHeight: "4px",
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Divider ───────────────────────────────────────────── */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />

        {/* ── Bottom bar ────────────────────────────────────────── */}
        <div
          className="footer-bottom-bar"
          style={{
            maxWidth: "1280px", margin: "0 auto",
            padding: "16px clamp(16px, 4vw, 40px)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>
            © {new Date().getFullYear()} Government of India — Ministry of Environment, Forest and Climate Change. All rights reserved.
          </div>
          <div className="footer-bottom-links" style={{ display: "flex", gap: "20px" }}>
            {["Privacy Policy","Terms of Use","Disclaimer","Sitemap"].map(l => (
              <a key={l} href="#"
                style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", textDecoration: "none", transition: "color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.color = "#C8972A"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.35)"}
              >
                {l}
              </a>
            ))}
          </div>
        </div>

        {/* ── Tricolour moving bottom strip ─────────────────────── */}
        <div style={{ display: "flex", height: "5px", overflow: "hidden" }}>
          <div style={{ flex: 1, background: "#FF6B00", animation: "shimmer 2.5s ease-in-out infinite" }} />
          <div style={{ flex: 1, background: "#fff", opacity: 0.9 }} />
          <div style={{ flex: 1, background: "#138808", animation: "shimmer 2.5s ease-in-out 0.8s infinite" }} />
        </div>
      </footer>

      {/* ── Global keyframes ──────────────────────────────────────── */}
      <style>{`
        @keyframes slideBar {
          0%   { left: -70%; }
          100% { left: 110%; }
        }
        @keyframes barUp {
          0%   { height: 4px;  }
          100% { height: 28px; }
        }
        @keyframes dotPulse {
          0%, 100% { transform: scale(1);   opacity: 0.7; }
          50%       { transform: scale(1.5); opacity: 1;   }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px);  }
          50%       { transform: translateY(-4px); }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 1;   }
          50%       { opacity: 0.6; }
        }
      `}</style>
    </>
  );
}
