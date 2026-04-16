const LINKS = [
  {
    labelHi: "भारत सरकार",
    labelEn: "Government of India",
    href: "https://www.india.gov.in/",
  },
  {
    labelHi: "जल शक्ति मंत्रालय",
    labelEn: "Ministry of Jal Shakti",
    href: "https://www.jalshakti-dowr.gov.in/",
  },
  {
    labelHi: "राष्ट्रीय स्वच्छ गंगा मिशन",
    labelEn: "National Mission for Clean Ganga",
    href: "https://nmcg.nic.in/",
  },
  {
    labelHi: "",
    labelEn: "Smart Laboratory on Clean Rivers",
    href: "https://www.slcrvaranasi.com/",
  },
];

export default function GovBar() {
  return (
    <div className="gov-bar-wrapper">
      <div
        style={{
          background: "#10385e",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          padding: "0 18px",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            minHeight: "48px",
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "14px",
            color: "#fff",
          }}
        >
          {LINKS.map((item, index) => (
            <div
              key={item.labelEn}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                flexWrap: "wrap",
              }}
            >
              <a
                href={item.href}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: "#fff",
                  textDecoration: "none",
                  display: "flex",
                  flexDirection: "column",
                  lineHeight: 1.05,
                }}
              >
                {item.labelHi ? (
                  <span style={{ fontSize: "15px", fontWeight: 500 }}>
                    {item.labelHi}
                  </span>
                ) : null}
                <span
                  style={{
                    fontSize: item.labelHi ? "11px" : "15px",
                    fontWeight: item.labelHi ? 400 : 500,
                    opacity: 0.96,
                  }}
                >
                  {item.labelEn}
                </span>
              </a>

              {index !== LINKS.length - 1 && (
                <span
                  style={{
                    width: "1px",
                    height: "22px",
                    background: "rgba(255,255,255,0.35)",
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .gov-bar-wrapper { display: none; }
        }
      `}</style>
    </div>
  );
}
