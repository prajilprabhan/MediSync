import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  addMedicine,
  getAllMedicines,
  deleteMedicine,
  subscribeAllMedicines,
} from "../services/firestore";
import {
  Pill,
  Trash2,
  Calendar,
  Clock,
  PlusCircle,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Tag,
  FileText,
} from "lucide-react";
import "./AddMedicine.css";

function AddMedicine() {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [statusMessage, setStatusMessage] = useState(null);

  // Form State
  const [medicineName, setMedicineName] = useState("");
  const [dosage, setDosage] = useState("");
  const [category, setCategory] = useState("Tablet");
  const [instructions, setInstructions] = useState("After Food");
  const [timings, setTimings] = useState({
    morning: false,
    noon: false,
    night: false,
    bedtime: false,
  });

  // Fetch all medicines on initial load and set up real-time sync
  useEffect(() => {
    let unsubscribe = null;

    const loadInitialMedicines = async () => {
      try {
        setFetching(true);
        const data = await getAllMedicines();
        setMedicines(data);
      } catch (err) {
        console.error("Initial fetch error:", err);
      } finally {
        setFetching(false);
      }
    };

    loadInitialMedicines();

    try {
      unsubscribe = subscribeAllMedicines((updatedList) => {
        setMedicines(updatedList);
        setFetching(false);
      });
    } catch (err) {
      console.warn("Real-time subscription fallback to static fetch:", err);
    }

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  const handleTimingToggle = (timeKey) => {
    setTimings((prev) => ({
      ...prev,
      [timeKey]: !prev[timeKey],
    }));
  };

  const handleManualRefresh = async () => {
    try {
      setFetching(true);
      const data = await getAllMedicines();
      setMedicines(data);
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!medicineName.trim()) {
      setStatusMessage({ type: "error", text: "Please provide a medicine name." });
      return;
    }

    if (!dosage.trim()) {
      setStatusMessage({ type: "error", text: "Please enter the dosage amount (e.g. 500mg or 1 Tablet)." });
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);

    const payload = {
      medicineName: medicineName.trim(),
      dosage: dosage.trim(),
      category,
      instructions,
      timings,
      userId: user?.uid || "guest",
      userEmail: user?.email || "anonymous",
    };

    try {
      await addMedicine(payload);

      setStatusMessage({
        type: "success",
        text: `"${medicineName.trim()}" successfully saved to Firebase!`,
      });

      // Reset form
      setMedicineName("");
      setDosage("");
      setCategory("Tablet");
      setInstructions("After Food");
      setTimings({ morning: false, noon: false, night: false, bedtime: false });

      // Immediate refresh as backup
      const refreshed = await getAllMedicines();
      setMedicines(refreshed);

      setTimeout(() => {
        setStatusMessage(null);
      }, 5000);
    } catch (err) {
      console.error("Error storing medicine to Firebase:", err);
      setStatusMessage({
        type: "error",
        text: "Failed to store medicine to Firebase. Please check your connection.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove "${name || "this medicine"}" from Firebase?`)) {
      return;
    }

    try {
      await deleteMedicine(id);
      setMedicines((prev) => prev.filter((m) => m.id !== id));
      setStatusMessage({
        type: "success",
        text: `Medicine removed from Firebase.`,
      });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error("Error deleting medicine from Firebase:", err);
      setStatusMessage({
        type: "error",
        text: "Failed to delete medicine. Please try again.",
      });
    }
  };

  // Filter medicines based on user search
  const filteredMedicines = medicines.filter((m) => {
    const query = searchFilter.toLowerCase().trim();
    if (!query) return true;
    const nameMatch = m.medicineName?.toLowerCase().includes(query) || m.name?.toLowerCase().includes(query);
    const dosageMatch = m.dosage?.toLowerCase().includes(query);
    const categoryMatch = m.category?.toLowerCase().includes(query);
    return nameMatch || dosageMatch || categoryMatch;
  });

  return (
    <div className="add-medicine-page">
      {/* Background Ambience */}
      <div className="bg-layer">
        <div className="grid-pattern"></div>
        <div className="glow-orb orb-1"></div>
        <div className="glow-orb orb-2"></div>
        <div className="glow-orb orb-3"></div>
      </div>

      <div className="add-medicine-content">
        {/* Page Header */}
        <div className="page-header">
          <div className="header-badge">
            <Pill size={16} />
            <span>Firebase Medicine Management</span>
          </div>
          <h1 className="page-title">Add & Track Medicines</h1>
          <p className="page-subtitle">
            Store newly added medicines into Firebase and access all synchronized pharmaceutical formulations.
          </p>
        </div>

        {/* Main 2-Column Grid */}
        <div className="medicine-grid-container">
          {/* LEFT: Add Medicine Form */}
          <div className="glass-panel">
            <div className="panel-header">
              <h2 className="panel-title">
                <PlusCircle size={22} color="#38bdf8" /> Add New Medicine
              </h2>
              <span className="panel-badge">Firestore Sync</span>
            </div>

            {statusMessage && (
              <div className={`status-banner ${statusMessage.type}`} style={{ marginBottom: "18px" }}>
                {statusMessage.type === "success" ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <AlertCircle size={18} />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="form-stack">
              {/* Medicine Name */}
              <div className="field-group">
                <label className="field-label">Medicine Name *</label>
                <div className="field-input-box">
                  <Pill size={18} color="#38bdf8" />
                  <input
                    type="text"
                    placeholder="e.g. Paracetamol, Dolo 650, Metformin"
                    value={medicineName}
                    onChange={(e) => setMedicineName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Dosage Description */}
              <div className="field-group">
                <label className="field-label">Dosage & Strength *</label>
                <div className="field-input-box">
                  <Tag size={18} color="#38bdf8" />
                  <input
                    type="text"
                    placeholder="e.g. 500 mg, 1 Tablet, 10 ml"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Category & Formulation */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div className="field-group">
                  <label className="field-label">Category</label>
                  <div className="field-input-box">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="Tablet">Tablet</option>
                      <option value="Capsule">Capsule</option>
                      <option value="Syrup">Syrup</option>
                      <option value="Injection">Injection</option>
                      <option value="Inhaler">Inhaler</option>
                      <option value="Drops">Drops</option>
                      <option value="Ointment">Ointment</option>
                    </select>
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label">Instructions</label>
                  <div className="field-input-box">
                    <select
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                    >
                      <option value="After Food">After Food</option>
                      <option value="Before Food">Before Food</option>
                      <option value="With Food">With Food</option>
                      <option value="Empty Stomach">Empty Stomach</option>
                      <option value="As Directed">As Directed</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Daily Timings */}
              <div className="field-group">
                <label className="field-label">Scheduled Timings</label>
                <div className="timing-chips-row">
                  {[
                    { key: "morning", label: "Morning" },
                    { key: "noon", label: "Noon" },
                    { key: "night", label: "Night" },
                    { key: "bedtime", label: "Bedtime" },
                  ].map(({ key, label }) => {
                    const isActive = timings[key];
                    return (
                      <div
                        key={key}
                        onClick={() => handleTimingToggle(key)}
                        className={`timing-chip ${isActive ? "active" : "inactive"}`}
                      >
                        <Clock size={14} />
                        <span>{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="submit-btn"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                    <span>Saving to Firebase...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle size={18} />
                    <span>Save Medicine to Firebase</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* RIGHT: Fetched All Medicines List */}
          <div className="glass-panel">
            <div className="panel-header">
              <h2 className="panel-title">
                <FileText size={22} color="#38bdf8" /> Stored Medicines
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="panel-badge">
                  {medicines.length} in Firebase
                </span>
                <button
                  onClick={handleManualRefresh}
                  title="Refresh from Firebase"
                  style={{
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#38bdf8")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
                >
                  <RefreshCw size={16} className={fetching ? "loading-spinner" : ""} />
                </button>
              </div>
            </div>

            {/* Search filter for loaded list */}
            <div className="list-search-wrapper">
              <Search size={16} color="#64748b" />
              <input
                type="text"
                placeholder="Filter medicines by name, dosage or category..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
              {searchFilter && (
                <button
                  className="clear-search-btn"
                  onClick={() => setSearchFilter("")}
                  title="Clear filter"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* List Body */}
            {fetching && medicines.length === 0 ? (
              <div className="loading-state-box">
                <div className="loading-spinner" />
                <span>Fetching all medicines from Firebase...</span>
              </div>
            ) : filteredMedicines.length === 0 ? (
              <div className="empty-state-box">
                <Calendar size={44} color="#475569" />
                <p>
                  {searchFilter
                    ? `No medicines match "${searchFilter}"`
                    : "No medicines found in Firebase. Add your first medicine using the form!"}
                </p>
              </div>
            ) : (
              <div className="medicines-scroll-list">
                {filteredMedicines.map((med) => {
                  const displayName = med.medicineName || med.name || "Unnamed Medicine";
                  const medTimings = med.timings || {};
                  const timingKeys = Object.keys(medTimings).filter((k) => medTimings[k]);

                  return (
                    <div key={med.id} className="med-item-card">
                      <div className="med-item-main">
                        <div className="med-avatar">
                          <Pill size={22} />
                        </div>
                        <div className="med-details">
                          <span className="med-name">{displayName}</span>
                          <div className="med-meta-row">
                            <span className="med-dosage-tag">{med.dosage || "Standard Dose"}</span>
                            {med.category && (
                              <span className="med-category-tag">{med.category}</span>
                            )}
                            {med.instructions && (
                              <span className="med-instruction-tag">{med.instructions}</span>
                            )}
                          </div>

                          {timingKeys.length > 0 && (
                            <div className="med-timings-row">
                              {timingKeys.map((time) => (
                                <span key={time} className="med-timing-badge">
                                  {time}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete(med.id, displayName)}
                        className="med-delete-btn"
                        title="Remove from Firebase"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddMedicine;
