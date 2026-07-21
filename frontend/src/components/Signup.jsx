import React from "react";
import { Link } from "react-router-dom";
import {
  FaShieldAlt,
  FaUser,
  FaEnvelope,
  FaLock
} from "react-icons/fa";

import "./Signup.css";

function Signup() {
  return (
    <div className="signup-page">

      <div className="signup-bg signup-bg1"></div>
      <div className="signup-bg signup-bg2"></div>

      <div className="signup-card">

        <div className="signup-logo">

          <div className="signup-logo-icon">
            <FaShieldAlt />
          </div>

          <h2>MediSync</h2>

          <p>Create your account</p>

        </div>

        <form>

          <div className="signup-input">
            <FaUser />
            <input
              type="text"
              placeholder="Full Name"
            />
          </div>

          <div className="signup-input">
            <FaEnvelope />
            <input
              type="email"
              placeholder="Email Address"
            />
          </div>

          <div className="signup-input">
            <FaLock />
            <input
              type="password"
              placeholder="Password"
            />
          </div>

          <div className="signup-input">
            <FaLock />
            <input
              type="password"
              placeholder="Confirm Password"
            />
          </div>

          <button className="signup-btn">
            Create Account
          </button>

        </form>

        <div className="signup-login">

          Already have an account?

          <Link to="/login">
            Login
          </Link>

        </div>

      </div>

    </div>
  );
}

export default Signup;