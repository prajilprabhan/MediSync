import React from "react";
import { Link } from "react-router-dom";
import { FaShieldAlt, FaEnvelope, FaLock } from "react-icons/fa";
import "./Login.css";

function Login() {
  return (
    <div className="auth-container">
      <div className="floating-circle circle1"></div>
      <div className="floating-circle circle2"></div>
      <div className="floating-circle circle3"></div>

      <div className="auth-card">

        <div className="auth-header">
          <div className="auth-logo">
            <FaShieldAlt />
          </div>

          <h2>MediSync</h2>
          <p>AI Drug-to-Drug Interaction Analyzer</p>
        </div>

        <form>

          <div className="auth-input-box">
            <FaEnvelope className="auth-input-icon" />
            <input
              type="email"
              placeholder="Enter your email"
            />
          </div>

          <div className="auth-input-box">
            <FaLock className="auth-input-icon" />
            <input
              type="password"
              placeholder="Enter your password"
            />
          </div>

          <div className="auth-options">
            <label>
              <input type="checkbox" />
              Remember Me
            </label>

            <Link to="#">Forgot Password?</Link>
          </div>

          <button className="auth-login-btn">
            Login
          </button>

        </form>

        <p className="auth-signup-text">
          Don't have an account?
          <Link to="/signup"> Sign Up</Link>
        </p>

      </div>
    </div>
  );
}

export default Login;