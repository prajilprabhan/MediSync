import { useState } from "react";
import { Search, X, Pill, Info, HelpCircle } from "lucide-react";
import "./MedicinesPage.css";

const API_URL = "http://localhost:8000";

function MedicinePage() {
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [activeMedicine, setActiveMedicine] = useState(null);
  const [activeDetails, setActiveDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [descriptionLoading, setDescriptionLoading] = useState(false);

  // ==========================================
  // SEARCH MEDICINES FROM BACKEND
  // ==========================================
  const searchMedicines = async (value) => {
    setSearch(value);

    if (value.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/search?q=${encodeURIComponent(value)}`
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Medicine search error:", error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // GET MEDICINE DESCRIPTION FROM BACKEND
  // ==========================================
  const getMedicineDetails = async (medicineName) => {
    try {
      setDescriptionLoading(true);
      setActiveDetails(null);

      const response = await fetch(
        `${API_URL}/medicine/${encodeURIComponent(medicineName)}`
      );

      if (!response.ok) {
        throw new Error("Description not found");
      }

      const data = await response.json();
      setActiveDetails(data);
    } catch (error) {
      console.error("Medicine details fetch error:", error);
      setActiveDetails({
        name: medicineName,
        conditions: ["Unknown"],
        description: "Detailed information could not be retrieved for this medicine.",
        relevance: "No local relevance details available.",
        source_note: "System Fallback"
      });
    } finally {
      setDescriptionLoading(false);
    }
  };

  // ==========================================
  // ADD MEDICINE TO LIST
  // ==========================================
  const addMedicine = async (medicine) => {
    const medicineName =
      typeof medicine === "string" ? medicine : medicine.name;

    const alreadyAdded = selectedMedicines.includes(medicineName);

    if (alreadyAdded) {
      setSearch("");
      setSearchResults([]);
      return;
    }

    setSelectedMedicines([...selectedMedicines, medicineName]);
    setActiveMedicine(medicineName);
    setSearch("");
    setSearchResults([]);

    await getMedicineDetails(medicineName);
  };

  // ==========================================
  // SELECT MEDICINE TO VIEW
  // ==========================================
  const selectMedicine = async (medicineName) => {
    setActiveMedicine(medicineName);
    await getMedicineDetails(medicineName);
  };

  // ==========================================
  // REMOVE MEDICINE
  // ==========================================
  const removeMedicine = (medicineName) => {
    const updatedMedicines = selectedMedicines.filter(
      (medicine) => medicine !== medicineName
    );

    setSelectedMedicines(updatedMedicines);

    if (activeMedicine === medicineName) {
      setActiveMedicine(null);
      setActiveDetails(null);
    }
  };

  return (
    <div className="medicines-page">
      {/* Background bubbles matching AnalyzerPage */}
      <div className="background">
        <div className="grid"></div>
        <div className="bubble bubble1"></div>
        <div className="bubble bubble2"></div>
        <div className="bubble bubble3"></div>
      </div>

      <div className="medicines-content">
        {/* ======================================
            HEADER
        ====================================== */}
        <div className="medicines-header">
          <h1>Medicine Database</h1>
          <p>Search standard branded formulation details and generic chemical context</p>
        </div>

        {/* ======================================
            LAYOUT GRID
        ====================================== */}
        <div className="medicines-layout">
          {/* LEFT SIDE: SEARCH & SELECTION */}
          <div className="medicines-card">
            <h2>
              <Search size={20} className="search-icon" /> Medicine Lookup
            </h2>

            {/* SEARCH INPUT */}
            <div className="med-search-wrapper">
              <Search size={18} style={{ color: "#64748b" }} />
              <input
                type="text"
                value={search}
                onChange={(e) => searchMedicines(e.target.value)}
                placeholder="Search medicine brand or generic..."
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch("");
                    setSearchResults([]);
                  }}
                  className="search-clear-btn"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* SEARCH RESULTS DROPDOWN */}
            {search.length >= 2 && (
              <div className="med-suggestion-box">
                {loading ? (
                  <div className="loading-box">
                    <div className="spinner"></div>
                    <span>Searching database...</span>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="loading-box" style={{ color: "#94a3b8" }}>
                    <span>No medicines found</span>
                  </div>
                ) : (
                  searchResults.map((medicine, index) => {
                    const medicineName =
                      typeof medicine === "string" ? medicine : medicine.name;
                    const alreadyAdded = selectedMedicines.includes(medicineName);

                    return (
                      <div key={index} className="med-suggestion-item">
                        <div
                          className="suggestion-info"
                          onClick={() => selectMedicine(medicineName)}
                          style={{ flex: 1 }}
                        >
                          <div className="pill-icon">💊</div>
                          <span className="suggestion-name">{medicineName}</span>
                        </div>
                        <button
                          disabled={alreadyAdded}
                          onClick={() => addMedicine(medicineName)}
                          className={`add-btn ${alreadyAdded ? "added" : ""}`}
                        >
                          {alreadyAdded ? "Added ✓" : "+ Add"}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* SELECTED MEDICINES LIST */}
            <div style={{ marginTop: "30px" }}>
              <span className="section-title">
                Selected ({selectedMedicines.length})
              </span>
              {selectedMedicines.length === 0 ? (
                <div
                  className="no-selection"
                  style={{ padding: "40px 20px", marginTop: "15px" }}
                >
                  <Pill className="no-selection-icon" size={32} />
                  <h3>No selections</h3>
                  <p>Search and select medicines to inspect details.</p>
                </div>
              ) : (
                <div className="selected-list">
                  {selectedMedicines.map((medicine) => (
                    <div
                      key={medicine}
                      onClick={() => selectMedicine(medicine)}
                      className={`selected-item ${
                        activeMedicine === medicine ? "active" : ""
                      }`}
                    >
                      <div className="selected-med-info">
                        <div className="pill-icon">💊</div>
                        <span style={{ fontWeight: 500, textTransform: "capitalize" }}>
                          {medicine}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeMedicine(medicine);
                        }}
                        className="remove-btn"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDE: RICH DETAILS */}
          <div className="medicines-card" style={{ minHeight: "350px" }}>
            {descriptionLoading ? (
              <div
                className="loading-box"
                style={{ height: "300px", flexDirection: "column" }}
              >
                <div className="spinner" style={{ width: "35px", height: "35px", borderWidth: "4px" }}></div>
                <span style={{ marginTop: "15px" }}>Loading clinical data...</span>
              </div>
            ) : !activeMedicine || !activeDetails ? (
              <div className="no-selection">
                <div className="no-selection-icon">🔬</div>
                <h3>No Medicine Selected</h3>
                <p>Click on any selected medicine or search and click a recommendation to view comprehensive clinical indications and regional safety relevance.</p>
              </div>
            ) : (
              <div className="details-body">
                {/* HEADER */}
                <div className="details-header">
                  <div className="details-header-icon">💊</div>
                  <div className="details-title">
                    <h2>{activeDetails.name}</h2>
                    <p>Clinical Formulation Reference</p>
                  </div>
                </div>

                {/* CONDITIONS */}
                {activeDetails.conditions && activeDetails.conditions.length > 0 && (
                  <div>
                    <div className="section-title">Indicated For</div>
                    <div className="conditions-list">
                      {activeDetails.conditions.map((condition, idx) => (
                        <span key={idx} className="condition-badge">
                          {condition}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* DESCRIPTION */}
                <div>
                  <div className="section-title">Summary & Usage</div>
                  <p className="description-text">{activeDetails.description}</p>
                </div>

                {/* REGIONAL RELEVANCE */}
                {activeDetails.relevance && (
                  <div className="relevance-card">
                    <div className="relevance-icon">🇮🇳</div>
                    <div className="relevance-content">
                      <h4>India & Kerala Clinical Context</h4>
                      <p>{activeDetails.relevance}</p>
                    </div>
                  </div>
                )}

                {/* FOOTER */}
                <div className="details-footer">
                  <div className="source-badge">
                    <Info size={12} />
                    <span>
                      Data Source: <strong>{activeDetails.source_note || "MediSync Database"}</strong>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MedicinePage;