import "./About.css";
import {
  FaShieldAlt,
  FaBrain,
  FaSearch,
  FaLock,
  FaHeartbeat,
} from "react-icons/fa";

function About() {
  return (
    <main className="about-page">

      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-badge">
          <FaShieldAlt />
          <span>Smarter Medication Safety</span>
        </div>

        <h1>
          About <span>MediSync</span>
        </h1>

        <p>
          MediSync is an AI-powered Drug-to-Drug Interaction Analyzer
          designed to help identify potential interactions between
          medications quickly and clearly.
        </p>
      </section>

      {/* About Content */}
      <section className="about-content">

        <div className="about-text">
          <p className="section-label">WHO WE ARE</p>

          <h2>Making Drug Interaction Analysis Simpler</h2>

          <p>
            Taking multiple medications can sometimes lead to unexpected
            drug interactions. MediSync provides an intelligent platform
            where users can enter medications and analyze potential
            interactions between them.
          </p>

          <p>
            Our goal is to combine reliable drug information with modern
            AI technology to present interaction results in a simple,
            understandable, and accessible way.
          </p>

          <div className="safety-note">
            <FaHeartbeat />
            <p>
              MediSync is an informational support tool and does not replace
              professional medical advice, diagnosis, or treatment.
            </p>
          </div>
        </div>

        <div className="about-visual">
          <div className="visual-glow"></div>

          <div className="main-shield">
            <FaShieldAlt />
          </div>

          <div className="floating-card card-one">
            <FaBrain />
            <span>AI Analysis</span>
          </div>

          <div className="floating-card card-two">
            <FaLock />
            <span>Secure</span>
          </div>
        </div>

      </section>

      {/* Features */}
      <section className="about-features">

        <div className="section-heading">
          <p>WHY MEDISYNC?</p>
          <h2>Built for Safer Medication Awareness</h2>
        </div>

        <div className="feature-grid">

          <div className="feature-card">
            <div className="feature-icon">
              <FaSearch />
            </div>
            <h3>Interaction Detection</h3>
            <p>
              Analyze selected medicines to identify potential
              drug-to-drug interactions.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <FaBrain />
            </div>
            <h3>AI-Powered Insights</h3>
            <p>
              Complex interaction information is presented in a clearer
              and easier-to-understand format.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <FaShieldAlt />
            </div>
            <h3>Safety Focused</h3>
            <p>
              Designed with medication safety and responsible information
              delivery as core priorities.
            </p>
          </div>

        </div>
      </section>

      {/* Mission */}
      <section className="mission-section">
        <div className="mission-icon">
          <FaHeartbeat />
        </div>

        <div>
          <p className="section-label">OUR MISSION</p>
          <h2>Technology Supporting Safer Healthcare</h2>
          <p>
            Our mission is to make drug interaction information more
            accessible through intelligent technology while encouraging
            users to consult qualified healthcare professionals for
            medical decisions.
          </p>
        </div>
      </section>

    </main>
  );
}

export default About;