import "./Footer.css";
import {
  FaShieldAlt,
  FaHeartbeat,
  FaGithub,
  FaLinkedin,
  FaEnvelope,
} from "react-icons/fa";

function Footer() {
  return (
    <footer className="footer">

      <div className="footer-top">

        <div className="footer-about">

          <div className="footer-logo">

            <div className="footer-icon">
              <FaShieldAlt />
            </div>

            <div>
              <h2>MediSync</h2>
              <p>AI Drug Interaction Analyzer</p>
            </div>

          </div>

          <p className="about-text">
            MediSync helps healthcare professionals and patients identify
            potential drug-drug interactions using AI-powered analysis,
            improving medication safety and clinical decision making.
          </p>

        </div>

        <div className="footer-links">

          <h3>Quick Links</h3>

          <a href="/">Home</a>
          <a href="/about">About</a>
          <a href="/analyzer">Analyzer</a>
          <a href="/contact">Contact</a>

        </div>

        <div className="footer-services">

          <h3>Features</h3>

          <p><FaHeartbeat /> Drug Interaction Analysis</p>
          <p><FaHeartbeat /> AI Risk Assessment</p>
          <p><FaHeartbeat /> Safe Medication Check</p>
          <p><FaHeartbeat /> Clinical Support</p>

        </div>

        <div className="footer-contact">

          <h3>Contact</h3>

          <p><FaEnvelope /> prajilprabhan26@gmail.com</p>

          <div className="social-icons">

            <a href="https://github.com/prajilprabhan/MediSync.git"><FaGithub /></a>

            <a href="#"><FaLinkedin /></a>

          </div>

        </div>

      </div>

      <hr />

      <div className="footer-bottom">

        <p>
          © 2026 MediSync. All Rights Reserved.
        </p>

        <p>
          Built with ❤️ for Safe Healthcare
        </p>

      </div>

    </footer>
  );
}

export default Footer;