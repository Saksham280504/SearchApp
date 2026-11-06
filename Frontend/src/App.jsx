import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import GovBar from "./Components/GovBar";
import Navbar from "./Components/NavBar";
import Footer from "./Components/Footer";
import ProtectedRoute from "./Components/ProtectedRoute";
import Home from "./Pages/Home";
import AboutPage from "./Pages/AboutPage";
import QueryPage from "./Pages/QueryPage";
import AnalyticsPage from "./Pages/AnalyticsPage";
import ContactPage from "./Pages/ContactPage";
import LoginPage from "./Pages/LoginPage";
import UploadPage from "./Pages/UploadPage";
import MapPage from "./Pages/MapPage";
import ReportsPage from "./Pages/ReportsPage";
import AdminPage from "./Pages/AdminPage";
import ChatWidget from "./Components/ChatWidget";
import { fetchCurrentUser } from "../redux/authSlice";

function AppRoutes() {
  const dispatch = useDispatch();

  // On mount: try to restore session from persisted token
  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  return (
    <>
      <GovBar />
      <Navbar />
      <Routes>
        {/* Public route — login page */}
        <Route path="/login" element={<LoginPage />} />

        {/* All other routes require authentication */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/about"
          element={
            <ProtectedRoute>
              <AboutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/query"
          element={
            <ProtectedRoute>
              <QueryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contact"
          element={
            <ProtectedRoute>
              <ContactPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute roles={["researcher", "admin"]}>
              <UploadPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/map"
          element={
            <ProtectedRoute>
              <MapPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
      <Footer />
      <ChatWidget />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
