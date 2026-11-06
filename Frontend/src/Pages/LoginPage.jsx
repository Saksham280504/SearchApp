// src/Pages/LoginPage.jsx
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser, clearAuthError } from "../../redux/authSlice";

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, user } = useSelector((state) => state.auth);

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", role: "visitor" });
  const [localError, setLocalError] = useState("");

  // If already logged in, redirect
  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    dispatch(clearAuthError());
  }, [mode, dispatch]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setLocalError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (mode === "register") {
      if (!form.name.trim()) return setLocalError("Name is required.");
      if (form.password !== form.confirm) return setLocalError("Passwords do not match.");
      if (form.password.length < 8) return setLocalError("Password must be at least 8 characters.");
      const result = await dispatch(registerUser({ name: form.name, email: form.email, password: form.password, role: form.role }));
      if (registerUser.fulfilled.match(result)) navigate("/", { replace: true });
    } else {
      const result = await dispatch(loginUser({ email: form.email, password: form.password }));
      if (loginUser.fulfilled.match(result)) navigate("/", { replace: true });
    }
  };

  const displayError = localError || error;

  return (
    <main
      style={{
        minHeight: "calc(100vh - 104px)",
        background: "linear-gradient(135deg, #003087 0%, #001f5c 50%, #0a1428 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative rings */}
      <div style={{
        position: "absolute", top: "15%", right: "10%",
        width: 320, height: 320, borderRadius: "50%",
        border: "1.5px solid rgba(200,151,42,0.18)",
        animation: "pulse-ring 3s ease-in-out infinite",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "10%", left: "8%",
        width: 200, height: 200, borderRadius: "50%",
        border: "1px solid rgba(200,151,42,0.10)",
        animation: "pulse-ring 3.5s ease-in-out infinite 1s",
        pointerEvents: "none",
      }} />

      <div style={{
        width: "100%", maxWidth: 440,
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(200,151,42,0.2)",
        borderRadius: 24,
        padding: "40px 36px",
        boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
        animation: "fadeSlideUp 0.6s ease forwards",
      }}>
        {/* Logo / Title */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(200,151,42,0.15)",
            border: "1px solid rgba(200,151,42,0.4)",
            borderRadius: 20, padding: "4px 14px", marginBottom: 20,
          }}>
            <span style={{ color: "#C8972A", fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: 600 }}>
              Smart Laboratory on Clean Rivers
            </span>
          </div>
          <h1 style={{
            fontFamily: "'EB Garamond', Georgia, serif",
            fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
            fontWeight: 700, color: "#fff", marginBottom: 8,
          }}>
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14 }}>
            {mode === "login"
              ? "Sign in to access the Chemical Analysis Portal"
              : "Register to join the research team"}
          </p>
        </div>

        {/* Mode toggle */}
        <div style={{
          display: "flex", background: "rgba(255,255,255,0.06)",
          borderRadius: 12, padding: 4, marginBottom: 28,
        }}>
          {["login", "register"].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setForm({ name: "", email: "", password: "", confirm: "" }); }}
              style={{
                flex: 1, padding: "9px 0", borderRadius: 9, border: "none",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                transition: "all 0.2s",
                background: mode === m ? "#C8972A" : "transparent",
                color: mode === m ? "#fff" : "rgba(255,255,255,0.55)",
                boxShadow: mode === m ? "0 4px 14px rgba(200,151,42,0.35)" : "none",
              }}
            >
              {m === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {mode === "register" && (
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.65)", letterSpacing: "0.5px" }}>Full Name</span>
              <input
                name="name"
                type="text"
                placeholder="Dr. Anjali Singh"
                value={form.name}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </label>
          )}

          {mode === "register" && (
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.65)", letterSpacing: "0.5px" }}>Requested Role</span>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                style={{ ...inputStyle, cursor: "pointer", color: "#333", backgroundColor: "rgba(255, 255, 255, 0.9)" }}
              >
                <option value="visitor">Visitor (Data Exploration Only)</option>
                <option value="researcher">Researcher (Data Upload Access)</option>
              </select>
            </label>
          )}

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.65)", letterSpacing: "0.5px" }}>Email Address</span>
            <input
              name="email"
              type="email"
              placeholder="researcher@example.com"
              value={form.email}
              onChange={handleChange}
              required
              style={inputStyle}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.65)", letterSpacing: "0.5px" }}>Password</span>
            <input
              name="password"
              type="password"
              placeholder={mode === "register" ? "Min. 8 characters" : "Enter password"}
              value={form.password}
              onChange={handleChange}
              required
              style={inputStyle}
            />
          </label>

          {mode === "register" && (
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.65)", letterSpacing: "0.5px" }}>Confirm Password</span>
              <input
                name="confirm"
                type="password"
                placeholder="Repeat password"
                value={form.confirm}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </label>
          )}

          {displayError && (
            <div style={{
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 10, padding: "10px 14px",
              color: "#fca5a5", fontSize: 13,
            }}>
              {displayError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4,
              background: loading ? "rgba(200,151,42,0.5)" : "#C8972A",
              color: "#fff", border: "none", borderRadius: 12,
              padding: "13px 0", fontSize: 15, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 4px 18px rgba(200,151,42,0.4)",
              transition: "all 0.2s",
              letterSpacing: "0.3px",
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
          >
            {loading
              ? (mode === "login" ? "Signing in…" : "Creating account…")
              : (mode === "login" ? "Sign In →" : "Create Account →")}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
          Secure access for SLCR researchers and administrators
        </p>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-ring {
          0%   { opacity: 0.4; transform: scale(1); }
          50%  { opacity: 0.8; transform: scale(1.05); }
          100% { opacity: 0.4; transform: scale(1); }
        }
      `}</style>
    </main>
  );
}

const inputStyle = {
  padding: "11px 14px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.07)",
  color: "#fff",
  fontSize: 14,
  outline: "none",
  transition: "border-color 0.2s, background 0.2s",
};
