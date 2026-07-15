import "./App.css";

import AppBar from "./components/AppBar";
import Footer from "./components/Footer";
import About from "./pages/About";

import { Routes, Route } from "react-router-dom";
import Contact from "./pages/Contact";

function App() {
  return (
    <>
      <AppBar />

      <Routes>
        <Route path="/about" element={<About/>} />
      </Routes>

      <Footer />
    </>
  );
}

export default App;