// src/pages/ContactPage.jsx
import { useState } from "react";

const FIELD_STYLE = {
  width: "100%",
  padding: "11px 14px",
  border: "1.5px solid #ddd",
  borderRadius: "8px",
  fontSize: "14px",
  fontFamily: "'DM Sans', sans-serif",
  color: "#222",
  background: "#fff",
  outline: "none",
  transition: "border-color 0.18s",
  boxSizing: "border-box",
};

const LABEL_STYLE = {
  display: "block",
  fontSize: "13px",
  fontWeight: 600,
  color: "#003087",
  marginBottom: "6px",
  letterSpacing: "0.2px",
};

const CONTACT_INFO = [
  { icon: "📍", title: "Address", lines: ["SLCR lab - IIT (BHU) Varanasi,", "Uttar Pradesh, India - 221005"] },
  { icon: "📞", title: "Phone", lines: ["+91 8905082820"] },
  { icon: "✉️", title: "Email", lines: ["slcr@iitbhu.ac.in"] },
  { icon: "🕐", title: "Working Hours", lines: ["Monday – Friday : 9:00 AM – 5:30 PM IST", "Saturday : 10:00 AM - 2:00 PM"] },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <main style={{ background: "#FAF8F3", minHeight: "calc(100vh - 180px)" }}>

      {/* ── Page Hero ── */}
      <section style={{
        background: "linear-gradient(110deg, #003087 60%, #001f5c 100%)",
        padding: "clamp(32px, 5vw, 56px) clamp(16px, 4vw, 40px) clamp(28px, 4vw, 52px)",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: "-60px", right: "-60px",
          width: "300px", height: "300px",
          borderRadius: "50%",
          background: "rgba(200,151,42,0.08)",
          pointerEvents: "none",
        }} />
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{
            display: "inline-block",
            background: "rgba(200,151,42,0.15)",
            border: "1px solid rgba(200,151,42,0.4)",
            borderRadius: "20px",
            padding: "3px 14px",
            fontSize: "11px",
            color: "#C8972A",
            letterSpacing: "1.4px",
            textTransform: "uppercase",
            fontWeight: 600,
            marginBottom: "14px",
          }}>
            Get in touch
          </div>
          <h1 style={{
            fontFamily: "'EB Garamond', Georgia, serif",
            fontSize: "clamp(2rem, 4vw, 3rem)",
            color: "#fff",
            fontWeight: 700,
            marginBottom: "10px",
          }}>
            Contact Us
          </h1>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "15px", maxWidth: "480px", lineHeight: 1.6 }}>
            Have a question, feedback or need technical support? Reach out to our team.
          </p>
        </div>
      </section>

      {/* ── Content ── */}
      <section style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(32px, 5vw, 56px) clamp(16px, 4vw, 40px) clamp(48px, 7vw, 80px)" }}>
        <div
          className="contact-content-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.4fr",
            gap: "48px",
            alignItems: "start",
          }}
        >

          {/* Left — contact info */}
          <div>
            <h2 style={{
              fontFamily: "'EB Garamond', Georgia, serif",
              fontSize: "22px", fontWeight: 700, color: "#003087",
              marginBottom: "24px",
            }}>
              Contact Information
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {CONTACT_INFO.map(({ icon, title, lines }) => (
                <div key={title} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                  <div style={{
                    width: "44px", height: "44px", flexShrink: 0,
                    background: "#EEF2FF",
                    borderRadius: "10px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "20px",
                  }}>
                    {icon}
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#003087", marginBottom: "4px" }}>
                      {title}
                    </div>
                    {lines.map((l, i) => (
                      <div key={i} style={{ fontSize: "13.5px", color: "#555", lineHeight: 1.6 }}>{l}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Map placeholder */}
            <div style={{
              marginTop: "32px",
              borderRadius: "12px",
              overflow: "hidden",
              border: "1px solid #ddd",
              height: "200px",
              background: "linear-gradient(135deg, #e8edf7, #c5d3ee)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#003087",
              fontSize: "14px",
              flexDirection: "column",
              gap: "8px",
            }}>
              <span style={{ fontSize: "32px" }}>🗺️</span>
              <span style={{ fontWeight: 600 }}>Varanasi, India</span>
              <span style={{ fontSize: "12px", color: "#666" }}>25.31° N, 82.97° E</span>
            </div>
          </div>

          {/* Right — form */}
          <div style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "40px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
            border: "1px solid #eee",
          }}>
            {sent ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ fontSize: "56px", marginBottom: "16px" }}>✅</div>
                <h3 style={{ fontFamily: "'EB Garamond', serif", fontSize: "22px", color: "#003087", marginBottom: "10px" }}>
                  Message Sent!
                </h3>
                <p style={{ color: "#666", fontSize: "14px", lineHeight: 1.6 }}>
                  Thank you for reaching out. Our team will get back to you within 2 working days.
                </p>
                <button
                  onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                  style={{
                    marginTop: "24px",
                    background: "#003087",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 24px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Send another message
                </button>
              </div>
            ) : (
              <>
                <h2 style={{
                  fontFamily: "'EB Garamond', Georgia, serif",
                  fontSize: "22px", fontWeight: 700, color: "#003087",
                  marginBottom: "28px",
                }}>
                  Send a Message
                </h2>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div
                    className="contact-name-email-grid"
                    style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}
                  >
                    <div>
                      <label style={LABEL_STYLE}>Full Name *</label>
                      <input
                        required
                        type="text"
                        placeholder="Dr. Rajesh Kumar"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        style={FIELD_STYLE}
                        onFocus={e => e.target.style.borderColor = "#003087"}
                        onBlur={e => e.target.style.borderColor = "#ddd"}
                      />
                    </div>
                    <div>
                      <label style={LABEL_STYLE}>Email Address *</label>
                      <input
                        required
                        type="email"
                        placeholder="raj@institute.gov.in"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        style={FIELD_STYLE}
                        onFocus={e => e.target.style.borderColor = "#003087"}
                        onBlur={e => e.target.style.borderColor = "#ddd"}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={LABEL_STYLE}>Subject *</label>
                    <input
                      required
                      type="text"
                      placeholder="Technical support / Data query / Feedback"
                      value={form.subject}
                      onChange={e => setForm({ ...form, subject: e.target.value })}
                      style={FIELD_STYLE}
                      onFocus={e => e.target.style.borderColor = "#003087"}
                      onBlur={e => e.target.style.borderColor = "#ddd"}
                    />
                  </div>

                  <div>
                    <label style={LABEL_STYLE}>Message *</label>
                    <textarea
                      required
                      rows={6}
                      placeholder="Describe your query or feedback in detail..."
                      value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      style={{ ...FIELD_STYLE, resize: "vertical", lineHeight: 1.6 }}
                      onFocus={e => e.target.style.borderColor = "#003087"}
                      onBlur={e => e.target.style.borderColor = "#ddd"}
                    />
                  </div>

                  <button
                    type="submit"
                    style={{
                      background: "#003087",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "13px",
                      fontSize: "15px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "background 0.18s",
                      letterSpacing: "0.3px",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#001f5c"}
                    onMouseLeave={e => e.currentTarget.style.background = "#003087"}
                  >
                    Send Message →
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}