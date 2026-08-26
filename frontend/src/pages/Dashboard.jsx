import { useState } from "react";
import {
  Search,
  Plus,
  X,
  ShieldCheck,
  Pill,
} from "lucide-react";
import "./Dashboard.css";

function Dashboard() {
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
    } catch (err) {
      setError(err.message || "An error occurred during Deep AI analysis.");
      console.error("Deep AI analysis error:", err);
    } finally {
      setDeepLoading(false);
    }
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
            <h2>Interaction Results</h2>

            {loading && <p className="status-text">Analyzing interactions...</p>}
            {error && <p className="error-text">{error}</p>}

            {!loading && !error && !analyzed && (
              <p>Select at least two medicines and click "Analyze" to inspect interactions.</p>
            )}

            {!loading && !error && analyzed && results.length === 0 && (
              <div className="no-interaction">
                <div className="severity minor">No Interaction</div>
                <p>No interactions were found between the selected medicines. However, always consult with your physician before combining medications.</p>
              </div>
            )}

            {!loading && !error && analyzed && results.length > 0 && (
              <div className="results-list">
                {results.map((res, index) => {
                  const sevLow = res.severity.toLowerCase();
                  const sevClass =
                    sevLow === "major"
                      ? "major"
                      : sevLow === "moderate"
                      ? "moderate"
                      : "minor";
                  return (
                    <div key={index} className="result-item">
                      <div className="result-header">
                        <strong>{res.drug_1} + {res.drug_2}</strong>
                        <span className={`severity ${sevClass}`}>{res.severity}</span>
                      </div>
                      <p className="result-description">{res.description}</p>
                      
                      {res.severity_explanation && (
                        <div className="result-detail" style={{ margin: "8px 0 4px 0", fontSize: "0.85rem", color: "#cbd5e1" }}>
                          <strong>Severity Details:</strong> {res.severity_explanation}
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
                        <small>Source: {res.source}</small>
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
            <h2 style={{ color: "#c084fc", display: "flex", alignItems: "center", gap: "10px", fontSize: "1.3rem", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "15px", marginBottom: "20px" }}>
              ✨ Deep AI Clinical Report
            </h2>
            
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
