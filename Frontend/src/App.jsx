import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./Components/NavBar";
import Home from "./Pages/Home";
import QueryPage from "./Pages/QueryPage";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/query" element={<QueryPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;