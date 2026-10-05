import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Search,
  Plus,
  X,
  ShieldCheck,
  Pill,
  History,
  CheckCircle,
  ArrowRight,
  Printer,
  MessageSquare,
  AlertTriangle,
  ShieldAlert,
  Info,
  Compass,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { saveAnalysisHistory, updateAnalysisHistory } from "../services/firestore";
import { printInteractionReport } from "../services/printService";
import SessionFeedbackCard from "../components/SessionFeedbackCard";
import "./Dashboard.css";

const SEVERITY_CONFIG = {
  Major: {
    label: "Major Severity",
    badgeClass: "major",
    color: "#ef4444",
    tag: "High Clinical Risk — Immediate Medical Review",
    direction: "Avoid Combination: High risk of severe adverse drug interactions or toxicity. Do not take these medications simultaneously without explicit physician consultation. Contact your doctor or pharmacist to discuss safer alternative treatments.",
    actionItems: [
      "Avoid combining without explicit doctor authorization",
      "Consult prescribing physician or pharmacist for alternative drugs",
      "Monitor closely for severe side effects or adverse reactions"
    ]
  },
  Moderate: {
    label: "Moderate Severity",
    badgeClass: "moderate",
    color: "#f59e0b",
    tag: "Moderate Clinical Risk — Caution & Monitoring Required",
    direction: "Use with Caution: Potential interaction that may alter drug efficacy or increase side effects. Separate administration times (space doses 2 to 4 hours apart) or adjust dosages under healthcare provider supervision.",
    actionItems: [
      "Separate administration times (take 2–4 hours apart)",
      "Discuss potential dosage adjustments with your doctor or pharmacist",
      "Observe for increased dizziness, gastrointestinal discomfort, or altered drug effects"
    ]
  },
  Minor: {
    label: "Minor Severity",
    badgeClass: "minor",
    color: "#10b981",
    tag: "Low Clinical Risk — Minimal Clinical Significance",
    direction: "Proceed with Routine Monitoring: Minor interaction with limited clinical impact. Safe for most patients under standard prescribed dosages. Maintain routine observation for mild symptoms.",
    actionItems: [
      "Take as routinely prescribed by your physician",
      "No major dosage adjustments typically required",
      "Stay hydrated and report any unexpected symptoms"
    ]
  },
  "No Interaction": {
    label: "No Interaction",
    badgeClass: "safe",
    color: "#38bdf8",
    tag: "Clinically Compatible — No Interaction Found",
    direction: "Safe to Take Together as Prescribed: No documented adverse interactions were found in the clinical pharmacovigilance database. Continue your regular medication schedule according to doctor instructions.",
    actionItems: [
      "Adhere to your doctor's prescribed dosage and schedule",
      "Safe to take concurrently based on clinical database review",
      "Inform healthcare providers if introducing new OTC medications or supplements"
    ]
  }
};

function getSeverityConfig(severity) {
  const s = String(severity || "").toLowerCase();
  if (s.includes("major")) return SEVERITY_CONFIG.Major;
  if (s.includes("moderate")) return SEVERITY_CONFIG.Moderate;
  if (s.includes("minor")) return SEVERITY_CONFIG.Minor;
  return SEVERITY_CONFIG["No Interaction"];
}


function Dashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [analyzed, setAnalyzed] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [medicationDetails, setMedicationDetails] = useState([]);
  const [deepAnalysis, setDeepAnalysis] = useState("");
  const [deepLoading, setDeepLoading] = useState(false);
  const [currentHistoryId, setCurrentHistoryId] = useState(null);
  const [currentSeverity, setCurrentSeverity] = useState("Safe");
  const [savedToHistory, setSavedToHistory] = useState(false);
  const [savingHistory, setSavingHistory] = useState(false);

  // Pre-load medicines if navigated from History page
  useEffect(() => {
    if (location.state?.medicines && Array.isArray(location.state.medicines) && location.state.medicines.length > 0) {
      setSelectedMedicines(location.state.medicines);
      setAnalyzed(false);
      setResults([]);
      setMedicationDetails([]);
      setDeepAnalysis("");
      setSavedToHistory(false);
      setCurrentHistoryId(null);
    }
  }, [location.state]);

  const searchMedicine = async (value) => {
    setSearchTerm(value);

    if (value.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/search?q=${encodeURIComponent(value)}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch suggestions");
      }
      const data = await response.json();
      setSuggestions(
        data.filter(
          (drug) => !selectedMedicines.includes(drug)
        )
      );
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  const addMedicine = (medicine) => {
    medicine = medicine.trim();
    if (!medicine) return;

    const formatted = medicine
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

    if (!selectedMedicines.includes(formatted)) {
      setSelectedMedicines([
        ...selectedMedicines,
        formatted
      ]);
      setSearchTerm("");
      setSuggestions([]);
      setAnalyzed(false);
      setResults([]);
      setMedicationDetails([]);
      setDeepAnalysis("");
      setSavedToHistory(false);
      setCurrentHistoryId(null);
    }
  };

  const removeMedicine = (medicine) => {
    setSelectedMedicines(
      selectedMedicines.filter(
        (item) => item !== medicine
      )
    );
    setAnalyzed(false);
    setResults([]);
    setMedicationDetails([]);
    setDeepAnalysis("");
    setSavedToHistory(false);
    setCurrentHistoryId(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && searchTerm.trim().length >= 2) {
      e.preventDefault();
      addMedicine(searchTerm);
    }
  };

  const handleAnalyze = async () => {
    if (selectedMedicines.length < 2) return;
    
    setLoading(true);
    setError("");
    setResults([]);
    setMedicationDetails([]);
    setDeepAnalysis("");
    setSavedToHistory(false);
    setCurrentHistoryId(null);
    
    try {
      const response = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ drugs: selectedMedicines }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to analyze drug interactions. Please make sure the backend is running.");
      }
      
      const data = await response.json();
      setResults(data);
      
      // Fetch only name and description for each selected medicine
      const detailsPromises = selectedMedicines.map(async (med) => {
        try {
          const res = await fetch(`http://localhost:8000/medicine/${encodeURIComponent(med)}`);
          if (res.ok) {
            return await res.json();
          }
        } catch (err) {
          console.error(`Failed to fetch details for ${med}:`, err);
        }
        return {
          name: med,
          description: "No description available in standard clinical reference."
        };
      });
      
      const details = await Promise.all(detailsPromises);
      setMedicationDetails(details);
      setAnalyzed(true);

      // Compute highest severity
      let maxSeverity = "No Interaction";
      if (data && data.length > 0) {
        const hasMajor = data.some(
          (r) => String(r.severity || "").toLowerCase() === "major"
        );
        const hasModerate = data.some(
          (r) => String(r.severity || "").toLowerCase() === "moderate"
        );
        const hasMinor = data.some(
          (r) => String(r.severity || "").toLowerCase() === "minor"
        );
        if (hasMajor) maxSeverity = "Major";
        else if (hasModerate) maxSeverity = "Moderate";
        else if (hasMinor) maxSeverity = "Minor";
      }
      setCurrentSeverity(maxSeverity);

      // Save analysis session to Firebase Firestore
      const targetUserId = user?.uid || "guest";
      try {
        setSavingHistory(true);
        const saveResult = await saveAnalysisHistory({
          userId: targetUserId,
          userEmail: user?.email || "anonymous",
          drugs: selectedMedicines,
          results: data,
          medicationDetails: details,
          maxSeverity,
          interactionCount: data.length,
          deepAnalysis: "",
        });
        setCurrentHistoryId(saveResult.id);
        setSavedToHistory(true);
      } catch (saveErr) {
        console.error("Could not save analysis history to Firebase Firestore:", saveErr);
      } finally {
        setSavingHistory(false);
      }
    } catch (err) {
      setError(err.message || "An error occurred during analysis.");
      console.error("Analysis error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeepAnalyze = async () => {
    if (selectedMedicines.length < 2) return;
    
    setDeepLoading(true);
    setError("");
    setDeepAnalysis("");
    
    try {
      const response = await fetch("http://localhost:8000/deep-analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ drugs: selectedMedicines }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate Deep AI clinical report.");
      }
      
      const data = await response.json();
      setDeepAnalysis(data.analysis);

      // Update Firestore history record with deep analysis report
      if (currentHistoryId) {
        try {
          await updateAnalysisHistory(currentHistoryId, {
            deepAnalysis: data.analysis,
          }, user?.uid);
        } catch (updErr) {
          console.warn("Could not update analysis history with deep report:", updErr);
        }
      }
    } catch (err) {
      setError(err.message || "An error occurred during Deep AI analysis.");
      console.error("Deep AI analysis error:", err);
    } finally {
      setDeepLoading(false);
    }
  };

  const handlePrintReport = () => {
    if (!analyzed) return;
    printInteractionReport({
      user,
      selectedMedicines,
      results,
      medicationDetails,
      deepAnalysis,
    });
  };

  return (
    <div className="analyzer-page">
      {/* Animated Background */}
      <div className="background">
        <span className="bubble bubble1"></span>
        <span className="bubble bubble2"></span>
        <span className="bubble bubble3"></span>
        <span className="bubble bubble4"></span>
        <span className="grid"></span>
      </div>

      <div className="content">
        <h1 className="page-title">
          Drug Interaction Dashboard
        </h1>

        <div style={{ display: "flex", justifyContent: "center", marginTop: "-15px", marginBottom: "32px" }}>
          <Link
            to="/history"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(56, 189, 248, 0.08)",
              border: "1px solid rgba(56, 189, 248, 0.25)",
              color: "#38bdf8",
              padding: "7px 18px",
              borderRadius: "100px",
              fontSize: "0.85rem",
              fontWeight: "500",
              textDecoration: "none",
              backdropFilter: "blur(8px)",
              transition: "all 0.2s ease"
            }}
          >
            <History size={16} />
            <span>View Analysis History</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="analyzer-grid">
          {/* Search Container */}
          <div className="card">
            <h2>Search Medicine</h2>

            <div className="search-wrapper">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Type drug name (e.g. Dolo, Turmeric)..."
                value={searchTerm}
                onChange={(e) => searchMedicine(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              {searchTerm.trim().length >= 2 && (
                <button
                  className="add-custom-btn"
                  onClick={() => addMedicine(searchTerm)}
                  title="Add custom medicine"
                >
                  <Plus size={18} />
                </button>
              )}
            </div>

            {suggestions.length > 0 && (
              <div className="suggestion-box">
                {suggestions.map((medicine) => (
                  <button
                    key={medicine}
                    className="suggestion-item"
                    onClick={() => addMedicine(medicine)}
                  >
                    <Pill size={16} />
                    {medicine}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Medicines */}
          <div className="card">
            <h2>Selected Medicines</h2>

            {selectedMedicines.length === 0 ? (
              <p>No medicines selected.</p>
            ) : (
              selectedMedicines.map((medicine) => (
                <div className="medicine-card" key={medicine}>
                  <span>{medicine}</span>
                  <button onClick={() => removeMedicine(medicine)}>
                    <X size={18} />
                  </button>
                </div>
              ))
            )}

            <button
              className="analyze-button"
              disabled={selectedMedicines.length < 2 || loading}
              onClick={handleAnalyze}
            >
              {loading ? "Analyzing..." : "Analyze"}
            </button>
          </div>

          {/* Result */}
          <div className="card results-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", flexWrap: "wrap", gap: "10px" }}>
              <h2 style={{ margin: 0 }}>Interaction Results</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                {savingHistory && (
                  <span style={{ fontSize: "0.8rem", color: "#38bdf8" }}>
                    Saving to Firebase Firestore...
                  </span>
                )}
                {savedToHistory && !savingHistory && (
                  <Link
                    to="/history"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "rgba(16, 185, 129, 0.15)",
                      border: "1px solid rgba(16, 185, 129, 0.4)",
                      color: "#34d399",
                      padding: "4px 12px",
                      borderRadius: "20px",
                      fontSize: "0.78rem",
                      fontWeight: "500",
                      textDecoration: "none",
                    }}
                    title="Click to view all saved analyses in your Firebase History"
                  >
                    <CheckCircle size={14} />
                    <span>Saved to Firebase History</span>
                    <ArrowRight size={13} />
                  </Link>
                )}
                {analyzed && !loading && (
                  <button
                    type="button"
                    onClick={handlePrintReport}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "rgba(56, 189, 248, 0.12)",
                      border: "1px solid rgba(56, 189, 248, 0.35)",
                      color: "#38bdf8",
                      padding: "5px 12px",
                      borderRadius: "8px",
                      fontSize: "0.82rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    title="Print or Save PDF report of this interaction analysis"
                  >
                    <Printer size={14} />
                    <span>Print / Save PDF</span>
                  </button>
                )}
              </div>
            </div>

            {loading && <p className="status-text">Analyzing interactions...</p>}
            {error && <p className="error-text">{error}</p>}

            {!loading && !error && !analyzed && (
              <p>Select at least two medicines and click "Analyze" to inspect interactions.</p>
            )}

            {/* Direct Severity Indicator on Analysis */}
            {!loading && !error && analyzed && (
              <div className={`direct-severity-indicator severity-indicator-${currentSeverity.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className="direct-indicator-header">
                  <div className="direct-indicator-badge">
                    {currentSeverity === "Major" && <ShieldAlert size={20} />}
                    {currentSeverity === "Moderate" && <AlertTriangle size={20} />}
                    {currentSeverity === "Minor" && <Info size={20} />}
                    {(currentSeverity === "No Interaction" || currentSeverity === "Safe") && <ShieldCheck size={20} />}
                    <span>Direct Severity Indicator: <strong>{currentSeverity}</strong></span>
                  </div>
                  <span className="direct-indicator-status-tag">
                    {currentSeverity === "Major" && "🔴 Severe Clinical Risk"}
                    {currentSeverity === "Moderate" && "🟡 Moderate Caution Required"}
                    {currentSeverity === "Minor" && "🟢 Low / Routine Monitoring"}
                    {(currentSeverity === "No Interaction" || currentSeverity === "Safe") && "🛡️ Clinically Safe"}
                  </span>
                </div>

                {/* Direct 4-Level Severity Meter */}
                <div className="severity-meter">
                  <div className={`meter-step ${(currentSeverity === "No Interaction" || currentSeverity === "Safe") ? "active safe-active" : ""}`}>
                    <span className="dot"></span>
                    <span className="label">No Interaction</span>
                  </div>
                  <div className={`meter-step ${currentSeverity === "Minor" ? "active minor-active" : ""}`}>
                    <span className="dot"></span>
                    <span className="label">Minor</span>
                  </div>
                  <div className={`meter-step ${currentSeverity === "Moderate" ? "active moderate-active" : ""}`}>
                    <span className="dot"></span>
                    <span className="label">Moderate</span>
                  </div>
                  <div className={`meter-step ${currentSeverity === "Major" ? "active major-active" : ""}`}>
                    <span className="dot"></span>
                    <span className="label">Major</span>
                  </div>
                </div>

                {/* Direct Action Direction */}
                <div className="direct-indicator-direction">
                  <strong>🧭 Direct Direction:</strong>
                  <p>{getSeverityConfig(currentSeverity).direction}</p>
                </div>
              </div>
            )}

            {!loading && !error && analyzed && results.length === 0 && (
              <div className="no-interaction-card">
                <div className="no-interaction-badge">
                  <ShieldCheck size={26} />
                  <span>No Negative Interactions Detected</span>
                </div>
                <p className="no-interaction-sub">
                  No documented clinical interactions were found between <strong>{selectedMedicines.join(" + ")}</strong>.
                </p>

                <div className="direction-box direction-safe">
                  <div className="direction-header">
                    <Compass size={15} />
                    <strong>Clinical Direction & Administration Protocol:</strong>
                  </div>
                  <p className="direction-text">
                    {SEVERITY_CONFIG["No Interaction"].direction}
                  </p>
                  <ul className="direction-checklist">
                    {SEVERITY_CONFIG["No Interaction"].actionItems.map((act, idx) => (
                      <li key={idx}>
                        <CheckCircle size={13} />
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {!loading && !error && analyzed && results.length > 0 && (
              <div className="results-list">
                {results.map((res, index) => {
                  const config = getSeverityConfig(res.severity);
                  const SevIcon = config.badgeClass === "major" ? ShieldAlert : config.badgeClass === "moderate" ? AlertTriangle : Info;
                  const sevLow = String(res.severity || "").toLowerCase();
                  const sevClass =
                    sevLow === "major"
                      ? "major"
                      : sevLow === "moderate"
                      ? "moderate"
                      : "minor";

                  return (
                    <div key={index} className={`result-item result-item-${sevClass}`}>
                      <div className="result-header">
                        <strong className="result-pair-title">
                          <Pill size={15} />
                          {res.drug_1} + {res.drug_2}
                        </strong>
                        <span className={`severity ${sevClass}`}>
                          <SevIcon size={12} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                          {res.severity}
                        </span>
                      </div>

                      <p className="result-description">{res.description}</p>
                      
                      {/* Clinical Direction Callout */}
                      <div className={`direction-box direction-${sevClass}`}>
                        <div className="direction-header">
                          <Compass size={15} />
                          <strong>Clinical Direction & Action Guidance:</strong>
                        </div>
                        <p className="direction-text">{config.direction}</p>
                        <ul className="direction-checklist">
                          {config.actionItems.map((act, aIdx) => (
                            <li key={aIdx}>
                              <CheckCircle size={13} />
                              <span>{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {res.severity_explanation && (
                        <div className="result-detail" style={{ margin: "8px 0 4px 0", fontSize: "0.85rem", color: "#cbd5e1" }}>
                          <strong>Severity Mechanism:</strong> {res.severity_explanation}
                        </div>
                      )}
                      {res.patient_note && (
                        <div className="result-detail" style={{ margin: "4px 0 4px 0", fontSize: "0.85rem", color: "#38bdf8" }}>
                          <strong>Patient Advisory:</strong> {res.patient_note}
                        </div>
                      )}
                      {res.safety_note && (
                        <div className="result-detail" style={{ margin: "4px 0 4px 0", fontSize: "0.85rem", color: "#f87171" }}>
                          <strong>Safety Warning:</strong> {res.safety_note}
                        </div>
                      )}

                      <div className="result-meta" style={{ marginTop: "10px" }}>
                        <small>Source: {res.source || "MediSync Clinical Database"}</small>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Selected Medicine Descriptions Card */}
        {analyzed && medicationDetails.length > 0 && (
          <div className="card" style={{ marginTop: "30px", width: "100%", textAlign: "left" }}>
            <h2 style={{ color: "#7dd3fc", display: "flex", alignItems: "center", gap: "10px", fontSize: "1.3rem", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "15px", marginBottom: "20px" }}>
              💊 Selected Medicine Descriptions
            </h2>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
              {medicationDetails.map((details, idx) => (
                <div 
                  key={idx} 
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    borderRadius: "14px",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px"
                  }}
                >
                  <h3 style={{ color: "#38bdf8", textTransform: "capitalize", fontSize: "1.1rem", fontWeight: "600", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>💊</span> {details.name}
                  </h3>

                  {details.conditions && details.conditions.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {details.conditions.map((cond, cIdx) => (
                        <span 
                          key={cIdx} 
                          style={{ 
                            background: "rgba(56, 189, 248, 0.08)", 
                            color: "#38bdf8", 
                            padding: "3px 8px", 
                            borderRadius: "6px", 
                            fontSize: "0.72rem", 
                            fontWeight: "500",
                            border: "1px solid rgba(56, 189, 248, 0.15)"
                          }}
                        >
                          {cond}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <p style={{ color: "#cbd5e1", fontSize: "0.85rem", lineHeight: "1.6", margin: 0 }}>
                    {details.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deep AI Report Trigger Button - below the three boxes */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: "40px" }}>
          <button
            className="analyze-button"
            style={{
              background: analyzed 
                ? "linear-gradient(90deg, #8b5cf6, #ec4899)" 
                : "rgba(255, 255, 255, 0.05)",
              color: analyzed ? "#fff" : "rgba(255, 255, 255, 0.2)",
              border: analyzed ? "none" : "1px solid rgba(255, 255, 255, 0.08)",
              boxShadow: analyzed ? "0 0 20px rgba(139, 92, 246, 0.3)" : "none",
              cursor: analyzed ? "pointer" : "not-allowed",
              maxWidth: "400px",
              padding: "16px 32px",
              fontSize: "1rem",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              transition: "all 0.3s ease",
              opacity: analyzed ? 1 : 0.6
            }}
            disabled={!analyzed || deepLoading}
            onClick={handleDeepAnalyze}
          >
            {deepLoading ? (
              <span>Generating Deep AI Report...</span>
            ) : (
              <span>✨ Get Deep AI Clinical Report</span>
            )}
          </button>
        </div>

        {/* Deep AI Report Card - below that */}
        {(deepLoading || deepAnalysis) && (
          <div className="card" style={{ marginTop: "30px", width: "100%", textAlign: "left" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "15px", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
              <h2 style={{ color: "#c084fc", display: "flex", alignItems: "center", gap: "10px", fontSize: "1.3rem", margin: 0 }}>
                ✨ Deep AI Clinical Report
              </h2>
              {deepAnalysis && !deepLoading && (
                <button
                  type="button"
                  onClick={handlePrintReport}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "rgba(192, 132, 252, 0.15)",
                    border: "1px solid rgba(192, 132, 252, 0.4)",
                    color: "#d8b4fe",
                    padding: "6px 14px",
                    borderRadius: "8px",
                    fontSize: "0.82rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  title="Print or Save complete Deep AI & Interaction PDF Report"
                >
                  <Printer size={14} />
                  <span>Print / Save PDF</span>
                </button>
              )}
            </div>
            
            {deepLoading ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px" }}>
                <span style={{ fontSize: "2rem" }}>⚡</span>
                <span style={{ marginTop: "15px", color: "#c084fc", fontWeight: 500, fontSize: "0.95rem" }}>
                  Consulting MediSync Clinical AI Engine...
                </span>
              </div>
            ) : (
              <div
                className="markdown-body"
                style={{
                  background: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "14px",
                  padding: "25px",
                  fontSize: "0.92rem",
                  lineHeight: "1.7",
                  color: "#e2e8f0",
                  whiteSpace: "pre-wrap",
                  fontFamily: "inherit"
                }}
              >
                {deepAnalysis}
              </div>
            )}
          </div>
        )}

        {/* In-Session Feedback Evaluation Card */}
        {analyzed && !loading && (
          <SessionFeedbackCard
            sessionId={currentHistoryId}
            selectedMedicines={selectedMedicines}
            maxSeverity={currentSeverity}
            results={results}
            deepAnalysis={deepAnalysis}
          />
        )}
      </div>

      <div className="checking-container">
        <div className="pill left-pill">
          <Pill size={34} />
        </div>

        <div className="scanner">
          <div className="scan-ring"></div>
          <div className="scan-ring delay"></div>

          <div className="shield">
            <ShieldCheck size={42} />
          </div>
        </div>

        <div className="pill right-pill">
          <Pill size={34} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
