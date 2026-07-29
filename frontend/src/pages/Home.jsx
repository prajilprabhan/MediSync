import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Pill,
  Activity,
  HeartPulse,
  ArrowRight,
  Search,
  BrainCircuit,
  Stethoscope,
  Sparkles,
} from "lucide-react";

import "./Home.css";

function Home() {
  return (
    <main className="home-page">

      {/* ================= HERO SECTION ================= */}
      <section className="hero-section">

        {/* Animated Background */}
        <div className="hero-bg-animation">
          <div className="blur-circle circle-one"></div>
          <div className="blur-circle circle-two"></div>
          <div className="blur-circle circle-three"></div>
        </div>

        {/* Floating Medical Icons */}
        <div className="floating-medical-icon float-pill">
          <Pill size={26} />
        </div>

        <div className="floating-medical-icon float-heart">
          <HeartPulse size={26} />
        </div>

        <div className="floating-medical-icon float-activity">
          <Activity size={26} />
        </div>

        <div className="hero-container">

          {/* LEFT SIDE */}
          <div className="hero-content">

            <div className="welcome-badge">
              <Sparkles size={17} />
              <span>Welcome to MediSync</span>
            </div>

            <h1>
              Understand Your Medicines.
              <span> Protect Your Health.</span>
            </h1>

            <p className="hero-description">
              MediSync is an intelligent drug-to-drug interaction analyzer
              designed to help users understand potential interactions
              between medications in a simple and accessible way.
            </p>

            <div className="hero-buttons">

              <Link to="/analyzer" className="primary-btn">
                <Search size={19} />
                Check Drug Interaction
                <ArrowRight size={18} />
              </Link>

              <Link to="/about" className="secondary-btn">
                Learn About MediSync
              </Link>

            </div>

            {/* TRUST POINTS */}
            <div className="hero-trust">

              <div className="trust-item">
                <ShieldCheck size={20} />
                <span>Safety Focused</span>
              </div>

              <div className="trust-item">
                <BrainCircuit size={20} />
                <span>AI Assisted</span>
              </div>

              <div className="trust-item">
                <Activity size={20} />
                <span>Easy to Understand</span>
              </div>

            </div>

          </div>


          {/* RIGHT SIDE ANIMATED VISUAL */}
          <div className="hero-visual">

            <div className="visual-orbit orbit-one"></div>
            <div className="visual-orbit orbit-two"></div>

            <div className="main-health-card">

              <div className="health-card-header">
                <div className="health-icon">
                  <ShieldCheck size={35} />
                </div>

                <div>
                  <span>MEDISYNC AI</span>
                  <h3>Drug Interaction Check</h3>
                </div>
              </div>

              <div className="medicine-row">
                <div className="medicine-box">
                  <Pill size={22} />
                  <div>
                    <small>Medicine A</small>
                    <strong>Drug One</strong>
                  </div>
                </div>

                <div className="interaction-animation">
                  <span></span>
                  <Activity size={24} />
                  <span></span>
                </div>

                <div className="medicine-box">
                  <Pill size={22} />
                  <div>
                    <small>Medicine B</small>
                    <strong>Drug Two</strong>
                  </div>
                </div>
              </div>

              <div className="analysis-box">
                <div className="analysis-icon">
                  <BrainCircuit size={25} />
                </div>

                <div>
                  <span>AI Analysis</span>
                  <p>
                    Checking potential interaction and safety information...
                  </p>
                </div>
              </div>

              <div className="scanning-line"></div>

            </div>

            {/* FLOATING CARDS */}

            <div className="mini-card mini-card-one">
              <HeartPulse size={23} />
              <div>
                <span>Health First</span>
                <small>Medication awareness</small>
              </div>
            </div>

            <div className="mini-card mini-card-two">
              <ShieldCheck size={23} />
              <div>
                <span>Safety Check</span>
                <small>Interaction analysis</small>
              </div>
            </div>

          </div>

        </div>

        <div className="scroll-indicator">
          <span>Explore MediSync</span>
          <div className="scroll-line"></div>
        </div>

      </section>


      {/* ================= INTRODUCTION ================= */}
      <section className="intro-section">

        <div className="section-tag">
          <Activity size={17} />
          ABOUT THE PROJECT
        </div>

        <h2>
          What is a <span>Drug–Drug Interaction?</span>
        </h2>

        <p className="intro-description">
          A drug–drug interaction can occur when one medication affects how
          another medication works. Some interactions may change the
          effectiveness of a medicine or increase the possibility of unwanted
          effects.
        </p>

        <div className="interaction-flow">

          <div className="flow-card">
            <div className="flow-icon">
              <Pill />
            </div>

            <h3>Medicine A</h3>
            <p>The first medication selected for interaction analysis.</p>
          </div>

          <div className="flow-connection">
            <div className="flow-line"></div>

            <div className="flow-center-icon">
              <Activity />
            </div>

            <div className="flow-line"></div>
          </div>

          <div className="flow-card">
            <div className="flow-icon">
              <Pill />
            </div>

            <h3>Medicine B</h3>
            <p>The second medication compared with the first medicine.</p>
          </div>

        </div>

      </section>


   

    </main>
  );
}

export default Home;