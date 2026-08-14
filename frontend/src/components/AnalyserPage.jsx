import { useState } from "react";
import {
  Search,
  Plus,
  X,
  ShieldCheck,
  Pill,
  Activity,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

import "./AnalyzerPage.css";

function AnalyzerPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [analyzed, setAnalyzed] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      
      // Standardize search comparison by filtering out drugs already selected
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
    if (!medicine.strip) {
      // Basic strip replacement
      medicine = medicine.trim();
    }
    if (!medicine) return;

    // Standardize naming to Title Case for visual consistency and duplicate prevention
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
      setAnalyzed(true);
    } catch (err) {
      setError(err.message || "An error occurred during analysis.");
      console.error("Analysis error:", err);
    } finally {
      setLoading(false);
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
          Drug Interaction Analyzer
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
                      <div className="result-meta">
                        <small>Source: Medisync</small>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
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

export default AnalyzerPage;