import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { addMedication, getUserMedications, deleteMedication } from "../services/firestore";
import { Pill, Trash2, Calendar, Clock } from "lucide-react";
import "./Dashboard.css";

function AddApplication() {
  const { user } = useAuth();
  const [medications, setMedications] = useState([]);
  const [medicineName, setMedicineName] = useState("");
  const [dosage, setDosage] = useState("");
  const [timings, setTimings] = useState({
    morning: false,
    noon: false,
    night: false,
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchMedications = async () => {
    if (!user) return;
    try {
      const list = await getUserMedications(user.uid);
      setMedications(list);
    } catch (error) {
      console.error("Error fetching medications:", error);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchMedications();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!medicineName.trim() || !dosage.trim()) {
      alert("Please fill in all fields.");
      return;
    }
    if (!timings.morning && !timings.noon && !timings.night) {
      alert("Please select at least one schedule timing.");
      return;
    }

    setLoading(true);
    try {
      await addMedication(user.uid, medicineName.trim(), dosage.trim(), timings);
      alert("Medication logged successfully!");
      setMedicineName("");
      setDosage("");
      setTimings({ morning: false, noon: false, night: false });
      await fetchMedications();
    } catch (error) {
      console.error("Error logging medication:", error);
      alert("Failed to log medication.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this medication?")) return;
    try {
      await deleteMedication(id);
      await fetchMedications();
    } catch (error) {
      console.error("Error deleting medication:", error);
      alert("Failed to delete medication.");
    }
  };

  const handleTimingChange = (key) => {
    setTimings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
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
          Medication Tracker & Logger
        </h1>

        <div className="analyzer-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          {/* Add Medication Form */}
          <div className="card">
            <h2>Log New Medication</h2>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="search-wrapper" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "5px", background: "#0f172a" }}>
                <label style={{ fontSize: "0.85rem", color: "#7dd3fc" }}>Medicine Name</label>
                <input
                  type="text"
                  placeholder="e.g. Paracetamol, Dolo 650"
                  value={medicineName}
                  onChange={(e) => setMedicineName(e.target.value)}
                  style={{ width: "100%", margin: 0, padding: "5px 0" }}
                  required
                />
              </div>

              <div className="search-wrapper" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "5px", background: "#0f172a" }}>
                <label style={{ fontSize: "0.85rem", color: "#7dd3fc" }}>Dosage Description</label>
                <input
                  type="text"
                  placeholder="e.g. 500mg, 1 Tablet"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  style={{ width: "100%", margin: 0, padding: "5px 0" }}
                  required
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <span style={{ fontSize: "0.9rem", color: "#7dd3fc", fontWeight: "600" }}>Daily Timings</span>
                <div style={{ display: "flex", gap: "15px" }}>
                  {["morning", "noon", "night"].map((time) => (
                    <label
                      key={time}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        background: timings[time] ? "rgba(56, 189, 248, 0.15)" : "rgba(255, 255, 255, 0.05)",
                        border: timings[time] ? "1px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.08)",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        textTransform: "capitalize",
                        fontSize: "0.85rem",
                        transition: "all 0.2s"
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={timings[time]}
                        onChange={() => handleTimingChange(time)}
                        style={{ display: "none" }}
                      />
                      <Clock size={14} color={timings[time] ? "#38bdf8" : "#94a3b8"} />
                      {time}
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="analyze-button"
                style={{ width: "100%", marginTop: "10px" }}
                disabled={loading}
              >
                {loading ? "Adding..." : "Log Medication"}
              </button>
            </form>
          </div>

          {/* Logged Medication List */}
          <div className="card">
            <h2>Logged Medications</h2>

            {fetching ? (
              <p className="status-text">Fetching your medications...</p>
            ) : medications.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", padding: "40px 0" }}>
                <Calendar size={48} color="#64748b" />
                <p style={{ color: "#64748b" }}>No medications logged yet.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "15px", maxHeight: "350px", overflowY: "auto", paddingRight: "5px" }}>
                {medications.map((med) => (
                  <div
                    key={med.id}
                    style={{
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "12px",
                      padding: "15px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ background: "rgba(56, 189, 248, 0.1)", padding: "10px", borderRadius: "10px", color: "#38bdf8" }}>
                        <Pill size={24} />
                      </div>
                      <div>
                        <strong style={{ display: "block", color: "#f1f5f9", fontSize: "1rem" }}>
                          {med.medicineName}
                        </strong>
                        <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                          Dosage: {med.dosage}
                        </span>
                        <div style={{ display: "flex", gap: "5px", marginTop: "6px" }}>
                          {Object.keys(med.timings).map((time) => med.timings[time] && (
                            <span
                              key={time}
                              style={{
                                fontSize: "0.7rem",
                                background: "rgba(56, 189, 248, 0.15)",
                                color: "#38bdf8",
                                padding: "2px 8px",
                                borderRadius: "4px",
                                textTransform: "capitalize"
                              }}
                            >
                              {time}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(med.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                        padding: "8px",
                        borderRadius: "50%",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddApplication;
