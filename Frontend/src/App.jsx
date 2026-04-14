import { BrowserRouter, Routes, Route } from "react-router-dom";
import GovBar from "./Components/GovBar";
import Navbar from "./Components/NavBar";
import Footer from "./Components/Footer";
import Home from "./Pages/Home";
import AboutPage from "./Pages/AboutPage";
import QueryPage from "./Pages/QueryPage";
import AnalyticsPage from "./Pages/AnalyticsPage";
import ContactPage from "./Pages/ContactPage";

function App() {
  return (
    <BrowserRouter>
      <GovBar />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/query" element={<QueryPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
