// src/Components/ProtectedRoute.jsx
// Wraps any route that requires authentication.
// If not logged in, redirects to /login.
// Shows a loading spinner while the auth state is being initialized.

import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, roles }) {
  const { user, token, initialized } = useSelector((state) => state.auth);

  // Still resolving persisted token — show nothing to avoid flash
  if (!initialized && token) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: "calc(100vh - 104px)",
        background: "#FAF8F3",
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          border: "3px solid #003087",
          borderTopColor: "#C8972A",
          animation: "spin 0.7s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role-gated route
  if (roles && !roles.includes(user.role)) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", minHeight: "calc(100vh - 104px)",
        background: "#FAF8F3", gap: 12,
      }}>
        <span style={{ fontSize: 48 }}>🔒</span>
        <h2 style={{ fontFamily: "'EB Garamond', serif", color: "#003087", fontSize: 28 }}>
          Access Denied
        </h2>
        <p style={{ color: "#666", fontSize: 15 }}>
          This page requires the <strong>{roles.join(" or ")}</strong> role.
          Your current role is <strong>{user.role}</strong>.
        </p>
      </div>
    );
  }

  return children;
}
