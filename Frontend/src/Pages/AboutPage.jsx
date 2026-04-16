const capabilityCards = [
  {
    title: "Compound Search",
    text:
      "Search directly by compound name and review matching files, spectral properties, reference ions, and quantitative signals in one workspace.",
  },
  {
    title: "Category Search",
    text:
      "Explore broader chemical classes, filter records quickly, and move from category-level browsing to compound-level inspection without losing context.",
  },
  {
    title: "Analytics",
    text:
      "Generate heatmaps, chromatograms, and mass-spectrum views for selected sample files to support cross-sample interpretation and environmental evidence building.",
  },
];

const slcrPoints = [
  "Joint India-Denmark initiative focused on sustainable river rejuvenation and practical restoration models.",
  "Living Lab approach that tests solutions in real conditions before scale-up.",
  "Platform for government, research institutions, communities, and technology partners to collaborate on cleaner rivers.",
  "Supports knowledge sharing, innovation, and reusable clean-river learnings for tributaries and small rivers.",
];

export default function AboutPage() {
  return (
    <main className="page-shell" style={{ minHeight: "100vh", background: "#f3f8fb" }}>
      <div className="page-content" style={{ padding: "40px 20px 60px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <section
            className="page-animate chem-panel"
            style={{
              padding: "36px",
              borderRadius: "34px",
              border: "1px solid rgba(184,202,216,0.75)",
              boxShadow: "0 22px 60px rgba(16,56,94,0.08)",
              marginBottom: "28px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1.2fr) minmax(280px, 0.8fr)",
                gap: "28px",
                alignItems: "center",
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    color: "#0a6a8b",
                    fontSize: "13px",
                    fontWeight: 700,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                  }}
                >
                  About SearchApp
                </p>
                <h1
                  style={{
                    margin: "12px 0 16px",
                    color: "#10385e",
                    fontSize: "clamp(2.6rem, 5vw, 4.6rem)",
                    lineHeight: 0.95,
                  }}
                >
                  Clean river intelligence
                  <br />
                  built for scientific clarity.
                </h1>
                <p
                  style={{
                    margin: 0,
                    color: "#4e6375",
                    fontSize: "16px",
                    lineHeight: 1.85,
                    maxWidth: "720px",
                  }}
                >
                  SearchApp is a research-facing web platform designed to help teams
                  explore, search, compare, and analyze mass-spectrometry and chemical
                  datasets linked to river monitoring and environmental assessment. It
                  brings compound discovery, category exploration, and analytics into a
                  single interface so scientific work feels faster, clearer, and more
                  actionable.
                </p>
              </div>

              <div
                className="page-animate page-animate-delay-1"
                style={{
                  position: "relative",
                  minHeight: "320px",
                  borderRadius: "30px",
                  background:
                    "radial-gradient(circle at 30% 30%, rgba(10,106,139,0.24), transparent 28%), linear-gradient(145deg, #10385e, #0a6a8b 52%, #74b8ca)",
                  overflow: "hidden",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
                }}
              >
                <span
                  className="chem-orb"
                  style={{ width: "72px", height: "72px", top: "24px", left: "24px" }}
                />
                <span
                  className="chem-orb orb-2"
                  style={{ width: "22px", height: "22px", top: "94px", left: "118px" }}
                />
                <span
                  className="chem-orb orb-3"
                  style={{ width: "64px", height: "64px", right: "34px", top: "68px" }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: "22px",
                    border: "1px solid rgba(255,255,255,0.24)",
                    borderRadius: "24px",
                  }}
                />
                <svg
                  viewBox="0 0 320 320"
                  style={{
                    position: "absolute",
                    inset: "18px",
                    width: "calc(100% - 36px)",
                    height: "calc(100% - 36px)",
                    opacity: 0.72,
                  }}
                >
                  <defs>
                    <linearGradient id="aboutLine" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#b9e6f2" stopOpacity="0.55" />
                    </linearGradient>
                  </defs>
                  <circle cx="64" cy="82" r="16" fill="rgba(255,255,255,0.85)" />
                  <circle cx="156" cy="64" r="12" fill="rgba(255,255,255,0.78)" />
                  <circle cx="236" cy="118" r="18" fill="rgba(255,255,255,0.9)" />
                  <circle cx="102" cy="192" r="22" fill="rgba(255,255,255,0.8)" />
                  <circle cx="214" cy="222" r="14" fill="rgba(255,255,255,0.72)" />
                  <circle cx="272" cy="250" r="11" fill="rgba(255,255,255,0.7)" />
                  <line x1="64" y1="82" x2="156" y2="64" stroke="url(#aboutLine)" strokeWidth="3" />
                  <line x1="156" y1="64" x2="236" y2="118" stroke="url(#aboutLine)" strokeWidth="3" />
                  <line x1="64" y1="82" x2="102" y2="192" stroke="url(#aboutLine)" strokeWidth="3" />
                  <line x1="102" y1="192" x2="214" y2="222" stroke="url(#aboutLine)" strokeWidth="3" />
                  <line x1="214" y1="222" x2="272" y2="250" stroke="url(#aboutLine)" strokeWidth="3" />
                  <line x1="236" y1="118" x2="214" y2="222" stroke="url(#aboutLine)" strokeWidth="3" />
                </svg>
                <div
                  style={{
                    position: "absolute",
                    left: "24px",
                    right: "24px",
                    bottom: "22px",
                    padding: "14px 16px",
                    borderRadius: "18px",
                    background: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "#eef8fb",
                    fontSize: "14px",
                    lineHeight: 1.6,
                    backdropFilter: "blur(8px)",
                  }}
                >
                  Designed with a more immersive, layered visual treatment inspired by the
                  atmospheric section styling on the SLCR Vision & Mission experience.
                </div>
              </div>
            </div>
          </section>

          <section
            className="page-animate page-animate-delay-1"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "18px",
              marginBottom: "28px",
            }}
          >
            {capabilityCards.map((card, index) => (
              <article
                key={card.title}
                className={`chem-panel page-animate page-animate-delay-${Math.min(index + 2, 4)}`}
                style={{
                  padding: "24px",
                  borderRadius: "24px",
                  border: "1px solid rgba(184,202,216,0.75)",
                  boxShadow: "0 18px 40px rgba(16,56,94,0.06)",
                }}
              >
                <p
                  style={{
                    margin: "0 0 10px",
                    color: "#0a6a8b",
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                  }}
                >
                  Functionality
                </p>
                <h2
                  style={{
                    margin: "0 0 12px",
                    color: "#10385e",
                    fontSize: "28px",
                  }}
                >
                  {card.title}
                </h2>
                <p style={{ margin: 0, color: "#55697a", fontSize: "15px", lineHeight: 1.8 }}>
                  {card.text}
                </p>
              </article>
            ))}
          </section>

          <section
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
              gap: "24px",
              marginBottom: "28px",
            }}
          >
            <article
              className="page-animate page-animate-delay-2 chem-panel"
              style={{
                padding: "30px",
                borderRadius: "28px",
                border: "1px solid rgba(184,202,216,0.75)",
                boxShadow: "0 18px 40px rgba(16,56,94,0.06)",
              }}
            >
              <p style={eyebrowStyle}>Vision</p>
              <h2 style={headingStyle}>A dependable scientific layer for cleaner rivers</h2>
              <p style={bodyStyle}>
                SearchApp aims to transform dense environmental and analytical data into a
                dependable digital layer for river research. The long-term vision is to help
                institutions move from isolated datasets to connected, evidence-led insight that
                supports better environmental decisions and stronger restoration strategies.
              </p>
            </article>

            <article
              className="page-animate page-animate-delay-3 chem-panel"
              style={{
                padding: "30px",
                borderRadius: "28px",
                border: "1px solid rgba(184,202,216,0.75)",
                boxShadow: "0 18px 40px rgba(16,56,94,0.06)",
              }}
            >
              <p style={eyebrowStyle}>Mission</p>
              <h2 style={headingStyle}>Transform searching, comparison, and analysis into a seamless, powerful, and truly user-centric experience.
</h2>
              <p style={bodyStyle}>
                The mission is to support researchers, institutions, and decision-makers with an
                interface that makes compound search, category discovery, and analytics easier to
                use every day. The focus is not only accuracy, but also clarity, speed, and
                confidence while working with complex environmental data.
              </p>
            </article>
          </section>

          <section
            className="page-animate page-animate-delay-4 chem-panel"
            style={{
              padding: "32px",
              borderRadius: "30px",
              border: "1px solid rgba(184,202,216,0.75)",
              boxShadow: "0 20px 46px rgba(16,56,94,0.07)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) minmax(320px, 0.85fr)",
                gap: "24px",
                alignItems: "start",
              }}
            >
              <div>
                <p style={eyebrowStyle}>SLCR Information</p>
                <h2 style={headingStyle}>Smart Laboratory on Clean Rivers</h2>
                <p style={bodyStyle}>
                  Smart Laboratory on Clean Rivers is a collaborative India-Denmark initiative
                  centered on sustainable rejuvenation of small rivers and tributaries. It brings
                  together public institutions, researchers, communities, and solution providers
                  so river restoration can be informed by both knowledge exchange and on-ground
                  testing.
                </p>
                <p style={{ ...bodyStyle, marginTop: "14px" }}>
                  Its living-lab approach and solution-oriented focus make it a strong contextual
                  foundation for SearchApp, which supports discovery and interpretation of
                  environmental chemical data in a more practical and accessible way.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: "12px",
                }}
              >
                {slcrPoints.map((point) => (
                  <div
                    key={point}
                    style={{
                      padding: "18px 18px 18px 48px",
                      borderRadius: "18px",
                      background: "rgba(255,255,255,0.78)",
                      border: "1px solid rgba(194,208,220,0.9)",
                      color: "#506577",
                      lineHeight: 1.7,
                      position: "relative",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: "20px",
                        left: "18px",
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #10385e, #0a6a8b)",
                        boxShadow: "0 0 0 6px rgba(10,106,139,0.12)",
                      }}
                    />
                    {point}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

const eyebrowStyle = {
  margin: 0,
  color: "#0a6a8b",
  fontSize: "13px",
  fontWeight: 700,
  letterSpacing: "0.15em",
  textTransform: "uppercase",
};

const headingStyle = {
  margin: "10px 0 14px",
  color: "#10385e",
  fontSize: "clamp(1.9rem, 2.8vw, 2.7rem)",
  lineHeight: 1.1,
};

const bodyStyle = {
  margin: 0,
  color: "#516779",
  fontSize: "15px",
  lineHeight: 1.85,
};
