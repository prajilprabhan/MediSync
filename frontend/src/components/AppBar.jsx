import "./AppBar.css";
import { FaShieldAlt } from "react-icons/fa";
import { NavLink } from "react-router-dom";

function AppBar() {
  return (
    <header className="navbar">
      <div className="logo">
        <div className="logo-icon">
          <FaShieldAlt />
        </div>

        <div className="logo-text">
          <h2>MediSync</h2>
          <p>AI Drug Interaction Analyzer</p>
        </div>
      </div>

       <nav className="nav-menu">
        <a href="/">Home</a>
        <a href="/about">About</a>
        <a href="/analyzer">Analyzer</a>
        <a href="/contact">Contact</a>
      </nav>
      
      <button className="login-btn">Login</button>
    </header>
  );
}

export default AppBar;