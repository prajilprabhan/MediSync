import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Star,
  CheckCircle2,
  AlertTriangle,
  Send,
  Trash2,
  Calendar,
  Activity,
  MessageSquare,
  History,
  Pill,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getUserAnalysisHistory,
  submitFeedback,
  submitSessionFeedback,
  deleteFeedback,
  subscribeUserFeedback,
} from "../services/firestore";
import "./Feedback.css";

const CATEGORIES = [
  "Drug Interaction Accuracy",
  "AI Clinical Report",
  "Medicine Database & Search",
  "Observed Side Effect",
  "User Interface & Experience",
  "Feature Request / Suggestion",
  "General Feedback",
];

const STAR_LABELS = {
  1: "Poor / Inaccurate",
  2: "Fair",
  3: "Good / Satisfactory",
  4: "Very Helpful",
  5: "Excellent & Accurate",
};

function Feedback() {
  const { user } = useAuth();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState("form"); // "form" | "history"
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(
    location.state?.sessionId || ""
  );

  // Form fields
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState("Drug Interaction Accuracy");
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Past feedbacks
  const [feedbacks, setFeedbacks] = useState([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  // Fetch recent analysis sessions for optional linking
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const uid = user?.uid || "guest";
        const data = await getUserAnalysisHistory(uid);
        setSessions(data || []);
      } catch (err) {
        console.warn("Could not load sessions:", err);
      }
    };
    fetchSessions();
  }, [user]);

  // Subscribe to user feedbacks
  useEffect(() => {
    const uid = user?.uid || "guest";
    setLoadingFeedbacks(true);

    const unsubscribe = subscribeUserFeedback(uid, (data) => {
      setFeedbacks(data || []);
      setLoadingFeedbacks(false);
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [user]);

  // Auto-select session if navigated from History
  useEffect(() => {
    if (location.state?.sessionId) {
      setSelectedSessionId(location.state.sessionId);
      setActiveTab("form");
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      setErrorMsg("Please choose a rating.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    const linkedSession = sessions.find((s) => s.id === selectedSessionId) || null;

    const payload = {
      userId: user?.uid || "guest",
      userEmail: user?.email || "anonymous",
      rating,
      category,
      helpful: rating >= 3,
      comments: comments.trim(),
      sessionId: linkedSession ? linkedSession.id : null,
      sessionDrugs: linkedSession ? linkedSession.drugs || [] : [],
      sessionSeverity: linkedSession ? linkedSession.maxSeverity || "Safe" : null,
    };

    try {
      if (linkedSession) {
        await submitSessionFeedback(linkedSession.id, payload, user?.uid || "guest");
      } else {
        await submitFeedback(payload);
      }

      setSuccessMsg(true);
      setComments("");
      setSelectedSessionId("");

      setTimeout(() => {
        setSuccessMsg(false);
      }, 4000);
    } catch (err) {
      console.error("Submit error:", err);
      setErrorMsg("Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, sessionId) => {
    if (!window.confirm("Remove this feedback?")) return;
    setDeletingId(id);
    try {
      await deleteFeedback(id, sessionId);
      setFeedbacks((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      console.error("Failed to delete feedback:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const activeStar = hoverRating || rating;

  const formatTimestamp = (createdAt) => {
    if (!createdAt) return "Recent";
    try {
      let date;
      if (createdAt?.toDate && typeof createdAt.toDate === "function") {
        date = createdAt.toDate();
      } else if (createdAt?.seconds) {
        date = new Date(createdAt.seconds * 1000);
      } else {
        date = new Date(createdAt);
      }
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Recent";
    }
  };

  return (
    <main className="feedback-page-simple">
      <div className="feedback-container">
        {/* Header */}
        <div className="feedback-header">
          <h1>Feedback & Review</h1>
          <p>
            Share your experience, suggest improvements, or rate drug interaction analysis accuracy.
          </p>

          {/* Simple Tab Switcher */}
          <div className="feedback-tabs">
            <button
              className={`feedback-tab ${activeTab === "form" ? "active" : ""}`}
              onClick={() => setActiveTab("form")}
            >
              <MessageSquare size={16} />
              <span>Give Feedback</span>
            </button>
            <button
              className={`feedback-tab ${activeTab === "history" ? "active" : ""}`}
              onClick={() => setActiveTab("history")}
            >
              <History size={16} />
              <span>My Past Feedback ({feedbacks.length})</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Form */}
        {activeTab === "form" && (
          <div className="feedback-card">
            {successMsg && (
              <div className="feedback-alert success">
                <CheckCircle2 size={20} color="#34d399" />
                <span>Thank you! Your feedback has been recorded.</span>
              </div>
            )}

            {errorMsg && (
              <div className="feedback-alert error">
                <AlertTriangle size={20} color="#f87171" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="feedback-form">
              {/* Rating */}
              <div className="form-group">
                <label className="form-label">Overall Rating</label>
                <div className="stars-picker">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="star-btn"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      aria-label={`Rate ${star} star`}
                    >
                      <Star
                        size={32}
                        className={star <= activeStar ? "star-fill" : "star-empty"}
                      />
                    </button>
                  ))}
                  <span className="star-hint">
                    {STAR_LABELS[activeStar] || "Good"}
                  </span>
                </div>
              </div>

              {/* Topic / Category */}
              <div className="form-group">
                <label htmlFor="feedback-cat" className="form-label">
                  Topic
                </label>
                <select
                  id="feedback-cat"
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Optional Session Link */}
              {sessions.length > 0 && (
                <div className="form-group">
                  <label htmlFor="session-select" className="form-label">
                    Link to Recent Analysis (Optional)
                  </label>
                  <select
                    id="session-select"
                    className="form-select"
                    value={selectedSessionId}
                    onChange={(e) => setSelectedSessionId(e.target.value)}
                  >
                    <option value="">General / None</option>
                    {sessions.slice(0, 10).map((sess) => (
                      <option key={sess.id} value={sess.id}>
                        {sess.drugs?.join(" + ")} ({sess.maxSeverity || "Safe"} • {formatTimestamp(sess.createdAt)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Comments */}
              <div className="form-group">
                <label htmlFor="comments" className="form-label">
                  Your Feedback
                </label>
                <textarea
                  id="comments"
                  rows={4}
                  placeholder="Tell us what you liked, what can be improved, or report observed drug side effects..."
                  className="form-textarea"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  required
                />
              </div>

              {/* Submit */}
              <div className="form-actions">
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Activity size={16} className="spinner" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Submit Feedback</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Past Feedback History */}
        {activeTab === "history" && (
          <div className="feedback-card">
            {loadingFeedbacks ? (
              <div className="history-empty">
                <Activity size={24} className="spinner" />
                <p>Loading feedback history...</p>
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="history-empty">
                <MessageSquare size={36} color="#64748b" />
                <h3>No feedback submitted yet</h3>
                <p>Your submitted reviews will appear here.</p>
                <button
                  type="button"
                  className="primary-small-btn"
                  onClick={() => setActiveTab("form")}
                >
                  Give Feedback
                </button>
              </div>
            ) : (
              <div className="past-feedback-list">
                {feedbacks.map((item) => (
                  <div key={item.id} className="past-feedback-item">
                    <div className="item-header">
                      <div className="item-stars">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={15}
                            className={
                              s <= (item.rating || 5)
                                ? "star-fill"
                                : "star-empty"
                            }
                          />
                        ))}
                        <span className="item-rating-num">
                          {item.rating || 5}.0
                        </span>
                        <span className="item-badge">{item.category}</span>
                      </div>

                      <div className="item-actions">
                        <span className="item-date">
                          <Calendar size={13} />
                          {formatTimestamp(item.createdAt)}
                        </span>
                        <button
                          type="button"
                          className="item-delete-btn"
                          onClick={() => handleDelete(item.id, item.sessionId)}
                          disabled={deletingId === item.id}
                          title="Delete feedback"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Linked drugs if any */}
                    {item.sessionDrugs && item.sessionDrugs.length > 0 && (
                      <div className="item-drugs">
                        <Pill size={13} />
                        <span>{item.sessionDrugs.join(" + ")}</span>
                      </div>
                    )}

                    {item.comments && (
                      <p className="item-comment">"{item.comments}"</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default Feedback;
