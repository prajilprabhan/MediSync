import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaShieldAlt, FaEnvelope, FaLock } from "react-icons/fa";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase"; // Update the path if needed
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      console.log("Logged in:", userCredential.user);
      alert("Login Successful!");

      // Navigate to dashboard/home
      navigate("/");
    } catch (error) {
      console.error(error);

      switch (error.code) {
        case "auth/invalid-credential":
          alert("Invalid email or password.");
          break;
        case "auth/user-not-found":
          alert("User not found.");
          break;
        case "auth/wrong-password":
          alert("Incorrect password.");
          break;
        default:
          alert(error.message);
      }
    }
  };

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

        <form onSubmit={handleLogin}>
          <div className="auth-input-box">
            <FaEnvelope className="auth-input-icon" />
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth-input-box">
            <FaLock className="auth-input-icon" />
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="auth-options">
            <label>
              <input type="checkbox" />
              Remember Me
            </label>

            <Link to="/forgot-password">Forgot Password?</Link>
          </div>

          <button type="submit" className="auth-login-btn">
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