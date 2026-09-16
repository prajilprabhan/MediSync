import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Trash2,
  Search,
  Sparkles,
  Pill,
  RefreshCw,
  X,
  History as HistoryIcon,
  Layers,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getUserAnalysisHistory,
  deleteAnalysisHistory,
  clearUserAnalysisHistory,
} from "../services/firestore";
import "./History.css";

function History() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [expandedSessions, setExpandedSessions] = useState({});
  const [modalState, setModalState] = useState({ isOpen: false, type: null, targetId: null });
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch history records from Firestore and localStorage fallback
  const loadHistory = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const uid = user?.uid || "guest";
      const data = await getUserAnalysisHistory(uid);
      setHistory(data || []);
    } catch (error) {
      console.error("Error loading analysis history:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [user]);

  // Format date helper for Firestore Timestamps and ISO strings
  const formatTimestamp = (createdAt) => {
    if (!createdAt) return "Recent Session";
    try {
      let date;
      if (createdAt?.toDate && typeof createdAt.toDate === "function") {
        date = createdAt.toDate();
      } else if (createdAt?.seconds) {
        date = new Date(createdAt.seconds * 1000);
      } else {
        date = new Date(createdAt);
      }

      if (isNaN(date.getTime())) return "Recent Session";

      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Recent Session";
    }
  };

  // Compute overall stats
  const stats = useMemo(() => {
    const total = history.length;
    let major = 0;
    let moderate = 0;
    let safe = 0;

    history.forEach((item) => {
      const sev = String(item.maxSeverity || "").toLowerCase();
      if (sev === "major") major++;
      else if (sev === "moderate") moderate++;
      else safe++;
    });

    return { total, major, moderate, safe };
  }, [history]);

  // Filter history based on search term and selected severity filter
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      // 1. Severity filter check
      const sev = String(item.maxSeverity || "").toLowerCase();
      if (severityFilter === "major" && sev !== "major") return false;
      if (severityFilter === "moderate" && sev !== "moderate") return false;
      if (severityFilter === "minor" && sev !== "minor") return false;
      if (
        severityFilter === "safe" &&
        sev !== "no interaction" &&
        sev !== "safe" &&
        sev !== ""
      ) {
        return false;
      }

      // 2. Search query check
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const drugMatch = item.drugs?.some((d) => d.toLowerCase().includes(query));
        const resultMatch = item.results?.some(
          (r) =>
            r.drug_1?.toLowerCase().includes(query) ||
            r.drug_2?.toLowerCase().includes(query) ||
            r.description?.toLowerCase().includes(query)
        );
        if (!drugMatch && !resultMatch) return false;
      }

      return true;
    });
  }, [history, severityFilter, searchTerm]);

  // Expand / collapse helpers
  const toggleSession = (id) => {
    setExpandedSessions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleAll = () => {
    const allExpanded = filteredHistory.every((item) => expandedSessions[item.id]);
    const newState = {};
    filteredHistory.forEach((item) => {
      newState[item.id] = !allExpanded;
    });
    setExpandedSessions(newState);
  };

  // Re-run session: redirect to Dashboard with medicines pre-loaded
  const handleRerun = (drugs) => {
    if (!drugs || drugs.length === 0) return;
    navigate("/dashboard", { state: { medicines: drugs } });
  };

  // Confirmation modal triggers
  const promptDeleteSingle = (id) => {
    setModalState({ isOpen: true, type: "single", targetId: id });
  };

  const promptClearAll = () => {
    setModalState({ isOpen: true, type: "all", targetId: null });
  };

  const closeModal = () => {
    if (isDeleting) return;
    setModalState({ isOpen: false, type: null, targetId: null });
  };

  // Perform deletion
  const confirmDelete = async () => {
    setIsDeleting(true);
    const uid = user?.uid || "guest";

    try {
      if (modalState.type === "single" && modalState.targetId) {
        await deleteAnalysisHistory(modalState.targetId, uid);
        setHistory((prev) => prev.filter((item) => item.id !== modalState.targetId));
      } else if (modalState.type === "all") {
        await clearUserAnalysisHistory(uid);
        setHistory([]);
      }
    } catch (err) {
      console.error("Failed to delete history:", err);
    } finally {
      setIsDeleting(false);
      closeModal();
    }
  };

  // Helper to map severity string to CSS modifier
  const getSeverityMeta = (maxSeverity) => {
    const s = String(maxSeverity || "").toLowerCase();
    if (s === "major") {
      return {
        borderClass: "card-border-major",
        badgeClass: "badge-major",
        icon: <ShieldAlert size={14} />,
        label: "Major Interaction",
      };
    }
    if (s === "moderate") {
      return {
        borderClass: "card-border-moderate",
        badgeClass: "badge-moderate",
        icon: <AlertTriangle size={14} />,
        label: "Moderate Interaction",
      };
    }
    if (s === "minor") {
      return {
        borderClass: "card-border-minor",
        badgeClass: "badge-minor",
        icon: <AlertTriangle size={14} />,
        label: "Minor Interaction",
      };
    }
    return {
      borderClass: "card-border-safe",
      badgeClass: "badge-safe",
      icon: <CheckCircle2 size={14} />,
      label: "Safe / No Interactions",
    };
  };

  return (
    <div className="history-page">
      {/* Background Ambience */}
      <div className="background">
        <div className="grid"></div>
        <div className="bubble bubble1"></div>
        <div className="bubble bubble2"></div>
        <div className="bubble bubble3"></div>
        <div className="bubble bubble4"></div>
      </div>

      <div className="content">
        {/* Header Area */}
        <header className="history-header">
          <div className="history-title-area">
            <div className="history-icon-badge">
              <HistoryIcon size={28} />
            </div>
            <div>
              <h1 className="history-title">Analysis History</h1>
              <p className="history-subtitle">
                Review, re-run, and manage your past drug interaction sessions with simplified summaries
              </p>
            </div>
          </div>

          <div className="history-header-actions">
            <button
              className="refresh-btn"
              onClick={() => loadHistory(true)}
              disabled={refreshing || loading}
              title="Refresh history sessions"
            >
              <RefreshCw size={16} className={refreshing ? "spin" : ""} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
            <Link to="/dashboard" className="start-analysis-btn">
              <Layers size={16} />
              New Analysis
            </Link>
          </div>
        </header>

        {/* Analytics Stats Overview */}
        <section className="history-stats-grid">
          <div className="stat-card">
            <div className="stat-icon total-icon">
              <HistoryIcon size={22} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Sessions</span>
              <span className="stat-value">{stats.total}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon major-icon">
              <ShieldAlert size={22} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Major Risks</span>
              <span className="stat-value">{stats.major}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon moderate-icon">
              <AlertTriangle size={22} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Moderate Risks</span>
              <span className="stat-value">{stats.moderate}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon safe-icon">
              <ShieldCheck size={22} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Safe Combinations</span>
              <span className="stat-value">{stats.safe}</span>
            </div>
          </div>
        </section>

        {/* Toolbar: Search, Filters, Bulk Actions */}
        <div className="history-toolbar">
          <div className="search-bar">
            <Search size={17} className="search-icon" />
            <input
              type="text"
              placeholder="Search by medication name or interaction..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="clear-search-btn"
                onClick={() => setSearchTerm("")}
                title="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="filter-chips">
            <button
              className={`filter-chip ${severityFilter === "all" ? "active" : ""}`}
              onClick={() => setSeverityFilter("all")}
            >
              All ({history.length})
            </button>
            <button
              className={`filter-chip major-chip ${severityFilter === "major" ? "active" : ""}`}
              onClick={() => setSeverityFilter("major")}
            >
              Major ({stats.major})
            </button>
            <button
              className={`filter-chip moderate-chip ${severityFilter === "moderate" ? "active" : ""}`}
              onClick={() => setSeverityFilter("moderate")}
            >
              Moderate ({stats.moderate})
            </button>
            <button
              className={`filter-chip safe-chip ${severityFilter === "safe" ? "active" : ""}`}
              onClick={() => setSeverityFilter("safe")}
            >
              Safe ({stats.safe})
            </button>
          </div>

          {filteredHistory.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                className="filter-chip"
                onClick={toggleAll}
                title="Toggle all session details"
                style={{ padding: "8px 12px" }}
              >
                {filteredHistory.every((item) => expandedSessions[item.id])
                  ? "Collapse All"
                  : "Expand All"}
              </button>
              <button
                className="clear-all-btn"
                onClick={promptClearAll}
                title="Clear all analysis history"
              >
                <Trash2 size={14} />
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Loading Indicator */}
        {loading ? (
          <div className="history-loading-container">
            <RefreshCw size={36} className="loading-icon spin" />
            <p>Loading your analysis sessions...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          /* Empty States */
          <div className="history-empty-state">
            <div className={`empty-icon-wrap ${history.length > 0 ? "filter-empty" : ""}`}>
              {history.length > 0 ? <Search size={36} /> : <Pill size={36} />}
            </div>
            <h2>
              {history.length > 0
                ? "No matching analysis sessions"
                : "No Analysis History Yet"}
            </h2>
            <p>
              {history.length > 0
                ? "Try adjusting your medication search term or resetting the severity filter."
                : "Run your first drug-to-drug interaction analysis to monitor potential adverse effects and save sessions here."}
            </p>
            {history.length > 0 ? (
              <button
                className="empty-action-btn secondary"
                onClick={() => {
                  setSearchTerm("");
                  setSeverityFilter("all");
                }}
              >
                Reset Filters
              </button>
            ) : (
              <Link to="/dashboard" className="empty-action-btn">
                Analyze Medications Now <ArrowRight size={16} />
              </Link>
            )}
          </div>
        ) : (
          /* Simplified History Sessions List */
          <div className="history-list">
            {filteredHistory.map((item) => {
              const meta = getSeverityMeta(item.maxSeverity);
              const isExpanded = !!expandedSessions[item.id];
              const interactionCount = item.results?.length || 0;
              const hasDeepAi = !!item.deepAnalysis;

              return (
                <article
                  key={item.id}
                  className={`history-card ${meta.borderClass}`}
                >
                  {/* Card Header: Timestamp, Severity Badge, AI tag, Actions */}
                  <div className="history-card-header">
                    <div className="header-left">
                      <span className="timestamp-badge">
                        <Calendar size={13} />
                        {formatTimestamp(item.createdAt)}
                      </span>

                      <span className={`history-badge ${meta.badgeClass}`}>
                        {meta.icon}
                        {meta.label}
                      </span>

                      {hasDeepAi && (
                        <span className="deep-ai-badge">
                          <Sparkles size={12} />
                          AI Report
                        </span>
                      )}
                    </div>

                    <div className="header-right">
                      <button
                        className="rerun-btn"
                        onClick={() => handleRerun(item.drugs)}
                        title="Re-run this combination in the Analyzer"
                      >
                        <RotateCcw size={13} />
                        Re-analyze
                      </button>

                      <button
                        className="delete-item-btn"
                        onClick={() => promptDeleteSingle(item.id)}
                        title="Delete this session from history"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Medicines Analyzed Section (Chips) */}
                  <div className="history-medicines-section">
                    <span className="medicines-label">Medicines Analyzed:</span>
                    <div className="drug-chips-wrap">
                      {item.drugs?.map((drug, idx) => (
                        <span key={idx} className="history-drug-chip">
                          <Pill size={12} />
                          {drug}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Simplified Summary Snippet & Details Toggle */}
                  <div className="history-summary-snippet">
                    <span className="summary-count">
                      {interactionCount > 0 ? (
                        <>
                          <strong>{interactionCount}</strong> interaction
                          {interactionCount !== 1 ? "s" : ""} detected{" "}
                          <span style={{ color: "#94a3b8" }}>
                            (Highest Severity: {item.maxSeverity || "Moderate"})
                          </span>
                        </>
                      ) : (
                        <span style={{ color: "#34d399", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <CheckCircle2 size={14} /> Safe combination • No adverse interactions detected
                        </span>
                      )}
                    </span>

                    <button
                      className="expand-toggle-btn"
                      onClick={() => toggleSession(item.id)}
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? (
                        <>
                          Hide Details <ChevronUp size={15} />
                        </>
                      ) : (
                        <>
                          View Details <ChevronDown size={15} />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Expanded Content (Shown on Demand) */}
                  {isExpanded && (
                    <div className="history-expanded-content">
                      {interactionCount > 0 ? (
                        <div className="interactions-grid">
                          {item.results.map((result, idx) => {
                            const resSev = String(result.severity || "").toLowerCase();
                            return (
                              <div key={idx} className="interaction-detail-item">
                                <div className="detail-item-header">
                                  <span className="interaction-pair">
                                    {result.drug_1} + {result.drug_2}
                                  </span>
                                  <span className={`severity ${resSev}`}>
                                    {result.severity}
                                  </span>
                                </div>
                                <p className="interaction-desc">
                                  {result.description}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="no-interaction-box">
                          <CheckCircle2 size={26} className="safe-check-icon" />
                          <div>
                            <strong>Clinically Safe Combination</strong>
                            <p>
                              No known adverse drug-drug interactions were identified for this combination in the clinical database.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Deep AI Clinical Insight Report (if saved in session) */}
                      {hasDeepAi && (
                        <div className="history-deep-ai-box">
                          <div className="deep-ai-header">
                            <Sparkles size={18} />
                            <h3>Gemini Clinical Evaluation</h3>
                          </div>
                          <div className="deep-ai-text">{item.deepAnalysis}</div>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal for Delete and Clear */}
      {modalState.isOpen && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon danger">
              <Trash2 size={26} />
            </div>
            <h3>
              {modalState.type === "all"
                ? "Clear All History?"
                : "Delete Analysis Session?"}
            </h3>
            <p>
              {modalState.type === "all"
                ? "This will permanently remove all drug analysis sessions from your history. This action cannot be undone."
                : "Are you sure you want to remove this analysis session from your history?"}
            </p>
            <div className="modal-actions">
              <button
                className="modal-cancel-btn"
                onClick={closeModal}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="modal-confirm-btn danger"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default History;
