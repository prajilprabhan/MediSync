import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaShieldAlt,
  FaUser,
  FaEnvelope,
  FaLock,
} from "react-icons/fa";

import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

import  {auth}  from "../firebase";
import "./Signup.css";

function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      // Save the user's display name
      await updateProfile(userCredential.user, {
        displayName: name,
      });

      alert("Account created successfully!");

      navigate("/login");
    } catch (error) {
      console.log(error);

      switch (error.code) {
        case "auth/email-already-in-use":
          alert("Email already exists.");
          break;

        case "auth/weak-password":
          alert("Password should be at least 6 characters.");
          break;

        case "auth/invalid-email":
          alert("Invalid email address.");
          break;

        default:
          alert(error.message);
      }
    }
  };

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

        <form onSubmit={handleSignup}>
          <div className="signup-input">
            <FaUser />
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="signup-input">
            <FaEnvelope />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="signup-input">
            <FaLock />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="signup-input">
            <FaLock />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="signup-btn">
            Create Account
          </button>
        </form>

        <div className="signup-login">
          Already have an account?
          <Link to="/login"> Login</Link>
        </div>
      </div>
    </div>
  );
}

export default Signup;