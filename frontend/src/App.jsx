
import "./App.css";

import AppBar from "./components/AppBar";
import Footer from "./components/Footer";
import About from "./pages/About";
import Contact from "./pages/Contact";

import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <>
      <AppBar />

      <Routes>
        <Route path="/about" element={<About/>} />
        <Route path="/contact" element={<Contact/>} />
      </Routes>

      <Footer />
    </>
  );
}

export default App;