// src/Pages/AdminPage.jsx
// Admin-only panel to view all registered users and change their roles.

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { API_BASE_URL } from "../../redux/config";

const ROLE_COLORS = {
  admin:      { bg: "#dc2626", text: "#fff" },
  researcher: { bg: "#0a6a8b", text: "#fff" },
  viewer:     { bg: "#64748b", text: "#fff" },
};

const ROLE_OPTIONS = ["viewer", "researcher", "admin"];

export default function AdminPage() {
  const { token } = useSelector((s) => s.auth);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(null); // userId being updated

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/api/auth/users`, authHeaders);
      setUsers(res.data.users || []);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    setUpdating(userId);
    try {
      const res = await axios.patch(
        `${API_BASE_URL}/api/auth/users/${userId}/role`,
        { role: newRole },
        authHeaders
      );
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: res.data.user.role } : u))
      );
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update role.");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <main
      style={{
        minHeight: "calc(100vh - 104px)",
        background: "linear-gradient(180deg, #f0f6ff, #e8f2f8)",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#dc2626", marginBottom: 8 }}>
            Administrator Access
          </p>
          <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: 36, color: "#10385e", fontWeight: 700, marginBottom: 8 }}>
            User Management
          </h1>
          <p style={{ color: "#64748b", fontSize: 14 }}>
            Manage roles for registered users. Viewers can only view; Researchers can upload data; Admins have full access.
          </p>
        </div>

        {/* Role Explanation */}
        <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
          {[
            { role: "viewer",     desc: "Can search and view all data. Cannot upload." },
            { role: "researcher", desc: "Can upload new datasets and perform analysis." },
            { role: "admin",      desc: "Full access: manage users, upload, generate reports." },
          ].map(({ role, desc }) => (
            <div
              key={role}
              style={{
                flex: 1, minWidth: 180, padding: "12px 16px", borderRadius: 12,
                border: "1px solid #e2e8f0", background: "#fff",
                boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
              }}
            >
              <span style={{
                display: "inline-block",
                background: ROLE_COLORS[role].bg, color: ROLE_COLORS[role].text,
                fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
                textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6,
              }}>
                {role}
              </span>
              <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: "12px 16px", borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: 14, marginBottom: 20 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Table */}
        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 8px 30px rgba(0,48,135,0.07)", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading users…</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  {["Name", "Email", "Registered", "Current Role", "Change Role"].map((h) => (
                    <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: i < users.length - 1 ? "1px solid #f1f5f9" : "none",
                      background: "#fff",
                    }}
                  >
                    <td style={{ padding: "14px 20px", fontWeight: 600, fontSize: 14, color: "#0f172a" }}>
                      {user.name}
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: 13, color: "#475569", fontFamily: "monospace" }}>
                      {user.email}
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: 12, color: "#94a3b8" }}>
                      {user.created_at ? new Date(user.created_at).toLocaleDateString("en-IN") : "—"}
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{
                        background: ROLE_COLORS[user.role]?.bg || "#64748b",
                        color: "#fff",
                        fontSize: 11, fontWeight: 700,
                        padding: "3px 10px", borderRadius: 8,
                        textTransform: "uppercase", letterSpacing: "0.5px",
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        {ROLE_OPTIONS.filter((r) => r !== user.role).map((role) => (
                          <button
                            key={role}
                            onClick={() => handleRoleChange(user.id, role)}
                            disabled={updating === user.id}
                            style={{
                              padding: "5px 12px", borderRadius: 8, border: "1px solid",
                              borderColor: ROLE_COLORS[role]?.bg || "#64748b",
                              background: "transparent",
                              color: ROLE_COLORS[role]?.bg || "#64748b",
                              fontSize: 11, fontWeight: 700, cursor: updating === user.id ? "not-allowed" : "pointer",
                              opacity: updating === user.id ? 0.5 : 1,
                              textTransform: "uppercase", transition: "all 0.15s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = ROLE_COLORS[role]?.bg || "#64748b";
                              e.currentTarget.style.color = "#fff";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                              e.currentTarget.style.color = ROLE_COLORS[role]?.bg || "#64748b";
                            }}
                          >
                            → {role}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#94a3b8" }}>
          {users.length} registered user{users.length !== 1 ? "s" : ""} total
        </p>
      </div>
    </main>
  );
}
