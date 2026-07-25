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