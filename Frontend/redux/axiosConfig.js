// redux/axiosConfig.js
// Sets up a global axios interceptor that attaches the JWT token to every request.
// Import this once in main.jsx before anything else.

import axios from "axios";

axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// On 401 responses, clear the token (session expired / invalid)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only clear if it was NOT a login attempt (avoid clearing on bad login creds)
      const url = error.config?.url || "";
      if (!url.includes("/api/auth/login") && !url.includes("/api/auth/register")) {
        localStorage.removeItem("token");
        // Redirect to login if not already there
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);
