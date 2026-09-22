import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import {
  addMedicine,
  getAllMedicines,
  getUserMedicines,
  deleteMedicine,
  subscribeAllMedicines,
  subscribeUserMedicines,
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
  Sparkles,
  ShieldCheck,
  Activity,
  Database,
  Sunrise,
  Sun,
  Moon,
  Check,
  Printer,
  Download,
} from "lucide-react";
import { printPrescriptionReport } from "../services/printService";
import "./AddMedicine.css";

function AddMedicine() {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");
  const [statusMessage, setStatusMessage] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

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

  // Fetch medicines from Firebase Firestore and set up real-time sync
  useEffect(() => {
    let unsubscribe = null;
    const uid = user?.uid || null;

    const loadInitialMedicines = async () => {
      try {
        setFetching(true);
        const data = await getAllMedicines(uid);
        setMedicines(data);
      } catch (err) {
        console.error("Initial fetch error from Firebase:", err);
      } finally {
        setFetching(false);
      }
    };

    loadInitialMedicines();

    try {
      unsubscribe = uid
        ? subscribeUserMedicines(uid, (updatedList) => {
            setMedicines(updatedList);
            setFetching(false);
          })
        : subscribeAllMedicines((updatedList) => {
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
  }, [user]);

  const handleTimingToggle = (timeKey) => {
    setTimings((prev) => ({
      ...prev,
      [timeKey]: !prev[timeKey],
    }));
  };

  const handleManualRefresh = async () => {
    try {
      setFetching(true);
      const data = await getAllMedicines(user?.uid || null);
      setMedicines(data);
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setFetching(false);
    }
  };

  // Quick preset loader to help user quickly fill
  const handleQuickPreset = (presetName, presetDosage, presetCategory, presetInstruction) => {
    setMedicineName(presetName);
    setDosage(presetDosage);
    setCategory(presetCategory);
    setInstructions(presetInstruction);
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
        text: `"${medicineName.trim()}" successfully synchronized to Firebase!`,
      });

      // Reset form
      setMedicineName("");
      setDosage("");
      setCategory("Tablet");
      setInstructions("After Food");
      setTimings({ morning: false, noon: false, night: false, bedtime: false });

      // Immediate refresh as backup
      const refreshed = await getAllMedicines(user?.uid || null);
      setMedicines(refreshed);

      setTimeout(() => {
        setStatusMessage(null);
      }, 5000);
    } catch (err) {
      console.error("Error storing medicine to Firebase:", err);
      const isPermission = err?.code === "permission-denied" || String(err?.message || err).includes("permission");
      setStatusMessage({
        type: "error",
        text: isPermission
          ? "Firebase Permission Denied: Firestore Security Rules are currently blocking writes. Please update the Rules tab in your Firebase Console."
          : `Failed to store medicine to Firebase: ${err.message || "Please check connection"}`,
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

  // Metrics computation for HUD stats bar
  const stats = useMemo(() => {
    const total = medicines.length;
    const tablets = medicines.filter((m) => (m.category || "").toLowerCase() === "tablet").length;
    const scheduled = medicines.filter((m) => {
      const t = m.timings || {};
      return t.morning || t.noon || t.night || t.bedtime;
    }).length;
    return { total, tablets, scheduled };
  }, [medicines]);

  // Filter medicines based on user search and category filter
  const filteredMedicines = medicines.filter((m) => {
    const query = searchFilter.toLowerCase().trim();
    const nameMatch = (m.medicineName || m.name || "").toLowerCase().includes(query);
    const dosageMatch = (m.dosage || "").toLowerCase().includes(query);
    const categoryMatch = (m.category || "").toLowerCase().includes(query);
    const matchesSearch = !query || nameMatch || dosageMatch || categoryMatch;

    if (!matchesSearch) return false;

    if (selectedCategoryFilter === "All") return true;
    return (m.category || "").toLowerCase() === selectedCategoryFilter.toLowerCase();
  });

  const categoriesList = ["All", "Tablet", "Capsule", "Syrup", "Injection", "Other"];

  // =========================================================================
  // SIMPLE REPORT GENERATION HANDLERS
  // =========================================================================
  const handlePrintReport = () => {
    printPrescriptionReport({ user, medicines });
  };

  const handleDownloadTextReport = () => {
    const dateStr = new Date().toLocaleString();
    let content = `====================================================\n`;
    content += `       MEDISYNC - MEDICATION SCHEDULE REPORT        \n`;
    content += `====================================================\n\n`;
    content += `Patient / Account : ${user?.email || "Guest Patient"}\n`;
    content += `Generated On      : ${dateStr}\n`;
    content += `Total Medications : ${medicines.length}\n\n`;
    content += `----------------------------------------------------\n`;
    content += `MEDICATION DOSAGE SCHEDULE\n`;
    content += `----------------------------------------------------\n\n`;

    medicines.forEach((med, idx) => {
      const name = med.medicineName || med.name || "Unnamed Medicine";
      const dose = med.dosage || "Standard Dose";
      const cat = med.category || "Tablet";
      const inst = med.instructions || "As directed";
      const t = med.timings || {};
      const activeTimes = [
        t.morning ? "Morning" : null,
        t.noon ? "Noon" : null,
        t.night ? "Night" : null,
        t.bedtime ? "Bedtime" : null,
      ].filter(Boolean).join(", ") || "No specific schedule";

      content += `${idx + 1}. ${name.toUpperCase()} (${dose})\n`;
      content += `   Type         : ${cat}\n`;
      content += `   Instructions : ${inst}\n`;
      content += `   Daily Dosing : ${activeTimes}\n\n`;
    });

    content += `----------------------------------------------------\n`;
    content += `Notice: Please adhere to guidelines provided by your physician.\n`;
    content += `Generated automatically via MediSync.\n`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `MediSync_Medication_Report_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
            <Pill size={16} className="badge-icon-spin" />
            <span>Firebase Cloud Rx Management</span>
          </div>
          <h1 className="page-title">Medication Formulations & Schedule</h1>
          <p className="page-subtitle">
            Securely register, catalog, and configure dosage schedules synchronized directly to your cloud Firebase database.
          </p>
        </div>

        {/* HUD Analytics Summary Bar */}
        <div className="med-hud-stats-bar">
          <div className="hud-stat-card">
            <div className="hud-stat-icon-wrap blue">
              <Database size={22} />
            </div>
            <div className="hud-stat-info">
              <span className="hud-stat-value">{medicines.length}</span>
              <span className="hud-stat-label">Cloud Stored Drugs</span>
            </div>
          </div>

          <div className="hud-stat-card">
            <div className="hud-stat-icon-wrap emerald">
              <ShieldCheck size={22} />
            </div>
            <div className="hud-stat-info">
              <div className="hud-live-tag">
                <span className="hud-pulse-dot"></span>
                <span>Active</span>
              </div>
              <span className="hud-stat-label">Firestore Real-time Sync</span>
            </div>
          </div>

          <div className="hud-stat-card">
            <div className="hud-stat-icon-wrap cyan">
              <Clock size={22} />
            </div>
            <div className="hud-stat-info">
              <span className="hud-stat-value">{stats.scheduled}</span>
              <span className="hud-stat-label">Timed Regimens</span>
            </div>
          </div>

          <div className="hud-stat-card">
            <div className="hud-stat-icon-wrap violet">
              <Activity size={22} />
            </div>
            <div className="hud-stat-info">
              <span className="hud-stat-value">{stats.tablets}</span>
              <span className="hud-stat-label">Tablet Formulations</span>
            </div>
          </div>
        </div>

        {/* Main 2-Column Grid */}
        <div className="medicine-grid-container">
          {/* LEFT: Add Medicine Form Panel */}
          <div className="glass-panel form-panel">
            <div className="panel-header">
              <div className="panel-header-title-group">
                <div className="panel-icon-badge">
                  <PlusCircle size={20} />
                </div>
                <div>
                  <h2 className="panel-title">Add Medication</h2>
                  <span className="panel-subtext">Store in cloud database</span>
                </div>
              </div>
              <span className="panel-badge-live">
                <span className="live-dot"></span>
                Live Firestore
              </span>
            </div>

            {/* Quick Preset Chips */}
            <div className="quick-presets-section">
              <span className="quick-presets-label">
                <Sparkles size={12} /> Quick Templates:
              </span>
              <div className="quick-presets-chips">
                {[
                  { name: "Paracetamol", dose: "500 mg", cat: "Tablet", ins: "After Food" },
                  { name: "Metformin", dose: "500 mg", cat: "Tablet", ins: "With Food" },
                  { name: "Amoxicillin", dose: "250 mg", cat: "Capsule", ins: "Before Food" },
                  { name: "Cough Syrup", dose: "10 ml", cat: "Syrup", ins: "After Food" },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    className="preset-chip-btn"
                    onClick={() => handleQuickPreset(preset.name, preset.dose, preset.cat, preset.ins)}
                  >
                    + {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {statusMessage && (
              <div className={`status-banner ${statusMessage.type}`}>
                <div className="status-banner-icon">
                  {statusMessage.type === "success" ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <AlertCircle size={18} />
                  )}
                </div>
                <div className="status-banner-text">{statusMessage.text}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="form-stack">
              {/* Medicine Name */}
              <div className="field-group">
                <label className="field-label">
                  Medicine Name <span className="field-required">*</span>
                </label>
                <div className="field-input-box">
                  <Pill size={18} className="field-icon" />
                  <input
                    type="text"
                    placeholder="e.g. Paracetamol, Dolo 650, Atorvastatin"
                    value={medicineName}
                    onChange={(e) => setMedicineName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Dosage Description */}
              <div className="field-group">
                <label className="field-label">
                  Dosage & Strength <span className="field-required">*</span>
                </label>
                <div className="field-input-box">
                  <Tag size={18} className="field-icon" />
                  <input
                    type="text"
                    placeholder="e.g. 500 mg, 1 Tablet, 10 ml, 2 Puffs"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Category & Instructions (2-col grid) */}
              <div className="form-row-2">
                <div className="field-group">
                  <label className="field-label">Category</label>
                  <div className="field-input-box select-wrapper">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="field-select-styled"
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
                  <label className="field-label">Food Timing</label>
                  <div className="field-input-box select-wrapper">
                    <select
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      className="field-select-styled"
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

              {/* Daily Scheduled Timings */}
              <div className="field-group">
                <label className="field-label">
                  Dosing Schedule <span className="field-hint">(Select all that apply)</span>
                </label>
                <div className="timing-chips-grid">
                  {[
                    { key: "morning", label: "Morning", icon: <Sunrise size={15} /> },
                    { key: "noon", label: "Noon", icon: <Sun size={15} /> },
                    { key: "night", label: "Night", icon: <Moon size={15} /> },
                    { key: "bedtime", label: "Bedtime", icon: <Clock size={15} /> },
                  ].map(({ key, label, icon }) => {
                    const isActive = timings[key];
                    return (
                      <button
                        type="button"
                        key={key}
                        onClick={() => handleTimingToggle(key)}
                        className={`timing-chip-card ${isActive ? "active" : ""}`}
                      >
                        <div className="timing-chip-icon">{icon}</div>
                        <span className="timing-chip-label">{label}</span>
                        {isActive && <Check size={14} className="timing-chip-check" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="submit-med-btn"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div className="loading-spinner-circle" />
                    <span>Synchronizing to Firebase...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle size={19} />
                    <span>Save Medicine to Cloud Database</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* RIGHT: Fetched All Medicines Catalog Panel */}
          <div className="glass-panel catalog-panel">
            <div className="panel-header">
              <div className="panel-header-title-group">
                <div className="panel-icon-badge cyan">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="panel-title">Stored Medicines</h2>
                  <span className="panel-subtext">Real-time cloud catalog</span>
                </div>
              </div>

              <div className="panel-actions-group">
                {/* Generate Report Button */}
                <button
                  type="button"
                  onClick={() => setShowReportModal(true)}
                  className="generate-report-btn"
                  title="Generate Medication Schedule Report"
                  disabled={medicines.length === 0}
                >
                  <Printer size={15} />
                  <span>Generate Report</span>
                </button>

                <span className="panel-pill-counter">
                  {medicines.length} in Cloud
                </span>
                <button
                  onClick={handleManualRefresh}
                  title="Force Sync from Firebase"
                  className="refresh-icon-button"
                  disabled={fetching}
                >
                  <RefreshCw size={16} className={fetching ? "spin" : ""} />
                </button>
              </div>
            </div>

            {/* Search filter for loaded list */}
            <div className="list-search-wrapper">
              <Search size={17} className="search-input-icon" />
              <input
                type="text"
                placeholder="Search by drug name, dosage, or category..."
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

            {/* Quick Category Filter Pills */}
            <div className="category-filter-chips-row">
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`cat-filter-chip ${selectedCategoryFilter === cat ? "active" : ""}`}
                  onClick={() => setSelectedCategoryFilter(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* List Body */}
            {fetching && medicines.length === 0 ? (
              <div className="loading-state-box">
                <div className="loading-spinner-circle large" />
                <span className="loading-text">Fetching medications from Firestore...</span>
                <span className="loading-subtext">Securing end-to-end encrypted connection</span>
              </div>
            ) : filteredMedicines.length === 0 ? (
              <div className="empty-state-box">
                <div className="empty-state-visual">
                  <div className="empty-pulse-radar"></div>
                  <Pill size={40} className="empty-pill-icon" />
                </div>
                <h3 className="empty-title">
                  {searchFilter || selectedCategoryFilter !== "All"
                    ? "No Matching Formulations Found"
                    : "No Medications in Cloud Yet"}
                </h3>
                <p className="empty-desc">
                  {searchFilter || selectedCategoryFilter !== "All"
                    ? `No medications match "${searchFilter || selectedCategoryFilter}". Try clearing your filters.`
                    : "Add your first prescription medicine using the form on the left to start real-time tracking!"}
                </p>
                {(searchFilter || selectedCategoryFilter !== "All") && (
                  <button
                    className="empty-reset-filter-btn"
                    onClick={() => {
                      setSearchFilter("");
                      setSelectedCategoryFilter("All");
                    }}
                  >
                    Reset All Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="medicines-scroll-list">
                {filteredMedicines.map((med) => {
                  const displayName = med.medicineName || med.name || "Unnamed Medicine";
                  const medTimings = med.timings || {};
                  const timingKeys = ["morning", "noon", "night", "bedtime"].filter((k) => medTimings[k]);
                  const catClass = (med.category || "tablet").toLowerCase();

                  return (
                    <div key={med.id} className={`med-item-card cat-${catClass}`}>
                      <div className="med-item-main">
                        <div className={`med-avatar cat-avatar-${catClass}`}>
                          <Pill size={22} />
                        </div>
                        <div className="med-details">
                          <div className="med-title-row">
                            <span className="med-name">{displayName}</span>
                            <span className="med-dosage-tag">{med.dosage || "Standard"}</span>
                          </div>

                          <div className="med-meta-row">
                            {med.category && (
                              <span className={`med-category-tag badge-${catClass}`}>
                                {med.category}
                              </span>
                            )}
                            {med.instructions && (
                              <span className="med-instruction-tag">
                                {med.instructions}
                              </span>
                            )}
                          </div>

                          {timingKeys.length > 0 && (
                            <div className="med-timings-row">
                              {timingKeys.map((time) => (
                                <span key={time} className="med-timing-badge">
                                  <span className="timing-dot"></span>
                                  {time}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="med-item-actions">
                        <button
                          onClick={() => handleDelete(med.id, displayName)}
                          className="med-delete-btn"
                          title="Remove from Firebase"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =====================================================================
          REPORT GENERATION MODAL (PRINTABLE & DOWNLOADABLE)
          ===================================================================== */}
      {showReportModal && (
        <div className="report-modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="report-modal-card" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="report-header">
              <div className="report-brand">
                <div className="report-brand-icon">
                  <Pill size={22} />
                </div>
                <div>
                  <h2 className="report-title">MediSync Clinical Prescription Report</h2>
                  <span className="report-subtitle">Personal Patient Medication & Dosing Schedule</span>
                </div>
              </div>
              <button
                className="report-close-x"
                onClick={() => setShowReportModal(false)}
                title="Close report"
              >
                <X size={20} />
              </button>
            </div>

            {/* Patient Meta Box */}
            <div className="report-meta-box">
              <div className="report-meta-item">
                <span className="report-meta-label">Patient Account</span>
                <span className="report-meta-value">{user?.email || "Guest Patient"}</span>
              </div>
              <div className="report-meta-item">
                <span className="report-meta-label">Generated Date</span>
                <span className="report-meta-value">
                  {new Date().toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="report-meta-item">
                <span className="report-meta-label">Total Medications</span>
                <span className="report-meta-value">{medicines.length} Formulations</span>
              </div>
            </div>

            {/* Medication Schedule Table */}
            <div className="report-table-scroll">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Medication</th>
                    <th>Dosage</th>
                    <th>Category</th>
                    <th>Meal Timing</th>
                    <th className="th-center">Morning</th>
                    <th className="th-center">Noon</th>
                    <th className="th-center">Night</th>
                    <th className="th-center">Bedtime</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map((med, idx) => {
                    const t = med.timings || {};
                    return (
                      <tr key={med.id || idx}>
                        <td className="td-idx">{idx + 1}</td>
                        <td className="td-med-name">{med.medicineName || med.name}</td>
                        <td className="td-dosage">{med.dosage || "Standard"}</td>
                        <td>
                          <span className="report-cat-badge">{med.category || "Tablet"}</span>
                        </td>
                        <td>{med.instructions || "As Directed"}</td>
                        <td className="td-center">
                          {t.morning ? <span className="report-check-yes">✓</span> : <span className="report-dash">—</span>}
                        </td>
                        <td className="td-center">
                          {t.noon ? <span className="report-check-yes">✓</span> : <span className="report-dash">—</span>}
                        </td>
                        <td className="td-center">
                          {t.night ? <span className="report-check-yes">✓</span> : <span className="report-dash">—</span>}
                        </td>
                        <td className="td-center">
                          {t.bedtime ? <span className="report-check-yes">✓</span> : <span className="report-dash">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Disclaimer */}
            <div className="report-disclaimer">
              <p>
                <strong>Clinical Notice:</strong> This schedule is generated for personal medication tracking. Always consult your attending physician, pharmacist, or specialist before modifying any prescribed regimen.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="report-modal-actions">
              <button
                type="button"
                className="report-download-btn"
                onClick={handleDownloadTextReport}
              >
                <Download size={16} />
                <span>Download Text Report</span>
              </button>

              <button
                type="button"
                className="report-print-btn"
                onClick={handlePrintReport}
              >
                <Printer size={16} />
                <span>Print / Save PDF</span>
              </button>

              <button
                type="button"
                className="report-close-btn"
                onClick={() => setShowReportModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddMedicine;
