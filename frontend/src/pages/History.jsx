import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import {
  Calendar,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Trash2,
  Sparkles,
  Pill,
  RefreshCw,
  History as HistoryIcon,
  Layers,
  ArrowRight,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

import {
  getUserAnalysisHistory,
  deleteAnalysisHistory,
} from "../firebase";

import "./History.css";

function History() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [expandedSessions, setExpandedSessions] = useState({});

  const [modalState, setModalState] = useState({
    isOpen: false,
    targetId: null,
  });

  const [isDeleting, setIsDeleting] = useState(false);

  // ============================================================
  // LOAD HISTORY
  // ============================================================

  const loadHistory = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

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

  // ============================================================
  // FORMAT TIMESTAMP
  // ============================================================

  const formatTimestamp = (createdAt) => {
    if (!createdAt) {
      return "Recent Session";
    }

    try {
      let date;

      if (
        createdAt?.toDate &&
        typeof createdAt.toDate === "function"
      ) {
        date = createdAt.toDate();
      } else if (createdAt?.seconds) {
        date = new Date(createdAt.seconds * 1000);
      } else {
        date = new Date(createdAt);
      }

      if (isNaN(date.getTime())) {
        return "Recent Session";
      }

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

  // ============================================================
  // SEVERITY
  // ============================================================

  const getSeverityMeta = (maxSeverity) => {
    const severity = String(
      maxSeverity || ""
    ).toLowerCase();

    if (severity === "major") {
      return {
        borderClass: "card-border-major",
        badgeClass: "badge-major",
        icon: <ShieldAlert size={14} />,
        label: "Major Interaction",
      };
    }

    if (severity === "moderate") {
      return {
        borderClass: "card-border-moderate",
        badgeClass: "badge-moderate",
        icon: <AlertTriangle size={14} />,
        label: "Moderate Interaction",
      };
    }

    if (severity === "minor") {
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

  // ============================================================
  // EXPAND / COLLAPSE
  // ============================================================

  const toggleSession = (id) => {
    setExpandedSessions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // ============================================================
  // RE-ANALYZE
  // ============================================================

  const handleRerun = (drugs) => {
    if (!drugs || drugs.length === 0) {
      return;
    }

    navigate("/dashboard", {
      state: {
        medicines: drugs,
      },
    });
  };

  // ============================================================
  // DELETE
  // ============================================================

  const promptDeleteSingle = (id) => {
    setModalState({
      isOpen: true,
      targetId: id,
    });
  };

  const closeModal = () => {
    if (isDeleting) {
      return;
    }

    setModalState({
      isOpen: false,
      targetId: null,
    });
  };

  const confirmDelete = async () => {
    if (!modalState.targetId) {
      return;
    }

    setIsDeleting(true);

    const uid = user?.uid || "guest";

    try {
      await deleteAnalysisHistory(
        modalState.targetId,
        uid
      );

      setHistory((prev) =>
        prev.filter(
          (item) => item.id !== modalState.targetId
        )
      );

      setExpandedSessions((prev) => {
        const updated = { ...prev };
        delete updated[modalState.targetId];
        return updated;
      });
    } catch (error) {
      console.error(
        "Failed to delete history:",
        error
      );
    } finally {
      setIsDeleting(false);

      setModalState({
        isOpen: false,
        targetId: null,
      });
    }
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="history-page">

      {/* Background */}
      <div className="background">
        <div className="grid"></div>

        <div className="bubble bubble1"></div>
        <div className="bubble bubble2"></div>
        <div className="bubble bubble3"></div>
        <div className="bubble bubble4"></div>
      </div>

      <div className="content">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <header className="history-header">

          <div className="history-title-area">

            <div className="history-icon-badge">
              <HistoryIcon size={28} />
            </div>

            <div>
              <h1 className="history-title">
                Analysis History
              </h1>

              <p className="history-subtitle">
                View your previous drug interaction analysis sessions stored securely on Firebase Firestore
              </p>
            </div>

          </div>

          <div className="history-header-actions">

            <button
              className="refresh-btn"
              onClick={() => loadHistory(true)}
              disabled={refreshing || loading}
              title="Refresh history"
            >
              <RefreshCw
                size={16}
                className={
                  refreshing ? "spin" : ""
                }
              />

              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>

            <Link
              to="/dashboard"
              className="start-analysis-btn"
            >
              <Layers size={16} />
              New Analysis
            </Link>

          </div>

        </header>

        {/* ====================================================
            LOADING
        ==================================================== */}

        {loading ? (

          <div className="history-loading-container">

            <RefreshCw
              size={36}
              className="loading-icon spin"
            />

            <p>
              Loading your analysis history...
            </p>

          </div>

        ) : history.length === 0 ? (

          /* ==================================================
             EMPTY HISTORY
          ================================================== */

          <div className="history-empty-state">

            <div className="empty-icon-wrap">
              <Pill size={36} />
            </div>

            <h2>
              No Analysis History Yet
            </h2>

            <p>
              Run a drug-to-drug interaction analysis
              to see your history here.
            </p>

            <Link
              to="/dashboard"
              className="empty-action-btn"
            >
              Analyze Medications Now
              <ArrowRight size={16} />
            </Link>

          </div>

        ) : (

          /* ==================================================
             HISTORY LIST
          ================================================== */

          <div className="history-list">

            {history.map((item) => {

              const meta =
                getSeverityMeta(
                  item.maxSeverity
                );

              const isExpanded =
                !!expandedSessions[item.id];

              const interactionCount =
                item.results?.length || 0;

              const hasDeepAi =
                !!item.deepAnalysis;

              return (

                <article
                  key={item.id}
                  className={`history-card ${meta.borderClass}`}
                >

                  {/* ========================================
                      HEADER
                  ======================================== */}

                  <div className="history-card-header">

                    <div className="header-left">

                      {/* Date */}
                      <span className="timestamp-badge">

                        <Calendar size={13} />

                        {formatTimestamp(
                          item.createdAt
                        )}

                      </span>

                      {/* Severity */}
                      <span
                        className={`history-badge ${meta.badgeClass}`}
                      >

                        {meta.icon}

                        {meta.label}

                      </span>

                      {/* AI Report */}
                      {hasDeepAi && (
                        <span className="deep-ai-badge">

                          <Sparkles size={12} />

                          AI Report

                        </span>
                      )}

                    </div>

                    {/* Actions */}
                    <div className="header-right">

                      <button
                        className="rerun-btn"
                        onClick={() =>
                          handleRerun(
                            item.drugs
                          )
                        }
                        title="Re-analyze this combination"
                      >

                        <RotateCcw size={13} />

                        Re-analyze

                      </button>

                      <button
                        className="delete-item-btn"
                        onClick={() =>
                          promptDeleteSingle(
                            item.id
                          )
                        }
                        title="Delete this history"
                      >

                        <Trash2 size={15} />

                      </button>

                    </div>

                  </div>

                  {/* ========================================
                      MEDICINES
                  ======================================== */}

                  <div className="history-medicines-section">

                    <span className="medicines-label">
                      Medicines Analyzed:
                    </span>

                    <div className="drug-chips-wrap">

                      {item.drugs?.map(
                        (drug, index) => (

                          <span
                            key={index}
                            className="history-drug-chip"
                          >

                            <Pill size={12} />

                            {drug}

                          </span>

                        )
                      )}

                    </div>

                  </div>

                  {/* ========================================
                      SUMMARY
                  ======================================== */}

                  <div className="history-summary-snippet">

                    <span className="summary-count">

                      {interactionCount > 0 ? (

                        <>
                          <strong>
                            {interactionCount}
                          </strong>{" "}

                          interaction
                          {interactionCount !== 1
                            ? "s"
                            : ""}{" "}
                          detected

                          <span
                            style={{
                              color: "#94a3b8",
                              marginLeft: "6px",
                            }}
                          >
                            (Highest Severity:{" "}
                            {item.maxSeverity ||
                              "Moderate"}
                            )
                          </span>
                        </>

                      ) : (

                        <span
                          style={{
                            color: "#34d399",
                            display:
                              "inline-flex",
                            alignItems:
                              "center",
                            gap: "6px",
                          }}
                        >

                          <CheckCircle2
                            size={14}
                          />

                          Safe combination •
                          No adverse
                          interactions detected

                        </span>

                      )}

                    </span>

                    {/* Details */}
                    <button
                      className="expand-toggle-btn"
                      onClick={() =>
                        toggleSession(
                          item.id
                        )
                      }
                      aria-expanded={
                        isExpanded
                      }
                    >

                      {isExpanded ? (

                        <>
                          Hide Details
                          <ChevronUp
                            size={15}
                          />
                        </>

                      ) : (

                        <>
                          View Details
                          <ChevronDown
                            size={15}
                          />
                        </>

                      )}

                    </button>

                  </div>

                  {/* ========================================
                      DETAILS
                  ======================================== */}

                  {isExpanded && (

                    <div className="history-expanded-content">

                      {interactionCount > 0 ? (

                        <div className="interactions-grid">

                          {item.results.map(
                            (result, index) => {

                              const resSeverity =
                                String(
                                  result.severity ||
                                  ""
                                ).toLowerCase();

                              return (

                                <div
                                  key={index}
                                  className="interaction-detail-item"
                                >

                                  <div className="detail-item-header">

                                    <span className="interaction-pair">

                                      {result.drug_1}
                                      {" + "}
                                      {result.drug_2}

                                    </span>

                                    <span
                                      className={`severity ${resSeverity}`}
                                    >
                                      {
                                        result.severity
                                      }
                                    </span>

                                  </div>

                                  <p className="interaction-desc">

                                    {
                                      result.description
                                    }

                                  </p>

                                </div>

                              );
                            }
                          )}

                        </div>

                      ) : (

                        <div className="no-interaction-box">

                          <CheckCircle2
                            size={26}
                            className="safe-check-icon"
                          />

                          <div>

                            <strong>
                              No Known
                              Interactions
                            </strong>

                            <p>
                              No known adverse
                              drug-drug
                              interactions were
                              identified for this
                              combination.
                            </p>

                          </div>

                        </div>

                      )}

                      {/* ====================================
                          AI REPORT
                      ==================================== */}

                      {hasDeepAi && (

                        <div className="history-deep-ai-box">

                          <div className="deep-ai-header">

                            <Sparkles size={18} />

                            <h3>
                              Gemini Clinical
                              Evaluation
                            </h3>

                          </div>

                          <div className="deep-ai-text">
                            {item.deepAnalysis}
                          </div>

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

      {/* ======================================================
          DELETE CONFIRMATION MODAL
      ====================================================== */}

      {modalState.isOpen && (

        <div
          className="modal-backdrop"
          onClick={closeModal}
        >

          <div
            className="confirm-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-icon danger">
              <Trash2 size={26} />
            </div>

            <h3>
              Delete Analysis Session?
            </h3>

            <p>
              Are you sure you want to remove
              this analysis session from your
              history?
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
                {isDeleting
                  ? "Deleting..."
                  : "Delete"}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default History;