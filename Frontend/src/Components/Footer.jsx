// src/components/Footer.jsx
import { Link } from "react-router-dom";

const COL_TITLE = {
  fontSize: "13px",
  fontWeight: 700,
  color: "#C8972A",
  textTransform: "uppercase",
  letterSpacing: "1.2px",
  marginBottom: "14px",
};

const LINK_STYLE = {
  display: "block",
  color: "rgba(255,255,255,0.65)",
  fontSize: "13px",
  marginBottom: "9px",
  textDecoration: "none",
  transition: "color 0.15s",
};

export default function Footer() {
  return (
    <footer style={{ background: "#001f5c", color: "#fff" }}>

      {/* Main footer body */}
      <div style={{
        maxWidth: "1280px",
        margin: "0 auto",
        padding: "52px 40px 40px",
        display: "grid",
        gridTemplateColumns: "2fr 1fr 1fr 1fr",
        gap: "40px",
      }}>

        {/* Brand column */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <div style={{
              width: "36px", height: "36px",
              background: "linear-gradient(135deg, #C8972A, #FF6B00)",
              borderRadius: "8px",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "18px",
            }}>
              🧪
            </div>
            <div>
              <div style={{ fontFamily: "'EB Garamond', serif", fontSize: "18px", fontWeight: 700 }}>
                SearchApp
              </div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", letterSpacing: "1px", textTransform: "uppercase" }}>
                Chemical Analysis Portal
              </div>
            </div>
          </div>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", lineHeight: 1.75, maxWidth: "280px", marginBottom: "20px" }}>
            A Government of India initiative for real-time mass-spectrometry data search
            and visualisation, enabling evidence-based environmental research.
          </p>

          {/* Gov logos strip */}
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
              <circle cx="14" cy="14" r="1.5" fill="#C8972A"/>
            </svg>
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>
              Government of India<br />
              <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "10px" }}>MoEF &amp; CC</span>
            </span>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <div style={COL_TITLE}>Quick Links</div>
          {[
            { label: "Home", to: "/" },
            { label: "Query Search", to: "/query" },
            { label: "Analytics", to: "/analytics" },
            { label: "Contact Us", to: "/contact" },
          ].map(({ label, to }) => (
            <Link key={to} to={to} style={LINK_STYLE}
              onMouseEnter={e => e.currentTarget.style.color = "#C8972A"}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.65)"}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Features */}
        <div>
          <div style={COL_TITLE}>Features</div>
          {[
            "Compound Search",
            "Category Search",
            "Heatmap Visualisation",
            "Chromatogram",
            "Mass Spectrum",
          ].map(f => (
            <div key={f} style={{ ...LINK_STYLE, cursor: "default" }}>{f}</div>
          ))}
        </div>

        {/* Contact */}
        <div>
          <div style={COL_TITLE}>Contact</div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", lineHeight: 1.75 }}>
            <div style={{ marginBottom: "10px" }}>
              📍 SLCR lab - IIT (BHU) Varanasi,<br />
              Uttar Pradesh, India - 221005
            </div>
            <div style={{ marginBottom: "10px" }}>
              📞 +91 8905082820
            </div>
            <div style={{ marginBottom: "10px" }}>
              ✉️ slcr@iitbhu.ac.in
            </div>
            <div>
              🕐 Monday – Friday : 9:00 AM – 5:30 PM IST <br />
              Saturday : 10:00 AM - 2:00 PM
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }} />

      {/* Bottom bar */}
      <div style={{
        maxWidth: "1280px",
        margin: "0 auto",
        padding: "18px 40px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "10px",
      }}>
        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
          © {new Date().getFullYear()} Government of India — Ministry of Environment, Forest and Climate Change. All rights reserved.
        </div>
        <div style={{ display: "flex", gap: "20px" }}>
          {["Privacy Policy", "Terms of Use", "Disclaimer", "Sitemap"].map(l => (
            <a key={l} href="#" style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", textDecoration: "none" }}
              onMouseEnter={e => e.currentTarget.style.color = "#C8972A"}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
            >
              {l}
            </a>
          ))}
        </div>
      </div>

      {/* Tricolour bottom strip */}
      <div style={{ display: "flex", height: "4px" }}>
        <div style={{ flex: 1, background: "#FF6B00" }} />
        <div style={{ flex: 1, background: "#fff" }} />
        <div style={{ flex: 1, background: "#138808" }} />
      </div>
    </footer>
  );
}