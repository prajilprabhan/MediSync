import { useState } from "react";
import {
  Brain,
  Loader2,
  AlertTriangle,
  ShieldAlert,
  CheckCircle,
  Pill,
} from "lucide-react";
import "./DeepAnalyze.css";

function DeepAnalyze({ medicines }) {
  const [deepResult, setDeepResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const combinationCount =
    medicines.length >= 2
      ? (medicines.length * (medicines.length - 1)) / 2
      : 0;

  const handleDeepAnalyze = async () => {
    if (medicines.length < 2) {
      setError("Please select at least two medicines.");
      return;
    }

    setLoading(true);
    setError("");
    setDeepResult(null);

    try {
      const response = await fetch(
        "http://localhost:8000/deep-analyze",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            drugs: medicines,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        throw new Error(
          errorData.detail ||
            "Failed to perform deep analysis."
        );
      }

      const data = await response.json();

      setDeepResult(data);
    } catch (err) {
      console.error("Deep analysis error:", err);
      setError(
        err.message ||
          "Unable to perform deep analysis."
      );
    } finally {
      setLoading(false);
    }
  };

  const getSeverityClass = (severity) => {
    const value = String(severity).toLowerCase();

    if (value === "major") return "deep-major";
    if (value === "moderate") return "deep-moderate";
    if (value === "minor") return "deep-minor";

    return "deep-none";
  };

  if (medicines.length < 2) {
    return (
      <section className="deep-section">
        <div className="deep-empty">
          <Brain size={36} />

          <h2>Deep Medicine Analysis</h2>

          <p>
            Select at least two medicines above to
            perform a deeper analysis.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="deep-section">

      {/* HEADER */}

      <div className="deep-header">

        <div className="deep-title-area">

          <div className="deep-icon">
            <Brain size={28} />
          </div>

          <div>
            <h2>Deep Medicine Analysis</h2>

            <p>
              Analyze all possible medicine combinations
              and generate a detailed explanation.
            </p>
          </div>

        </div>

        <button
          className="deep-analyze-button"
          onClick={handleDeepAnalyze}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2
                size={19}
                className="spin"
              />

              Analyzing...
            </>
          ) : (
            <>
              <Brain size={19} />

              Deep Analyze
            </>
          )}
        </button>

      </div>

      {/* SELECTED MEDICINES */}

      <div className="deep-selected-box">

        <div className="deep-selected-header">

          <h3>Medicines Being Analyzed</h3>

          <span>
            {medicines.length} medicines
          </span>

        </div>

        <div className="deep-medicine-list">

          {medicines.map((medicine) => (

            <div
              className="deep-medicine-chip"
              key={medicine}
            >
              <Pill size={16} />

              {medicine}

            </div>

          ))}

        </div>

        <div className="combination-info">

          <strong>
            {combinationCount}
          </strong>

          <span>
            medicine-to-medicine combinations
            will be analyzed
          </span>

        </div>

      </div>

      {/* ERROR */}

      {error && (
        <div className="deep-error">
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* LOADING */}

      {loading && (
        <div className="deep-loading">

          <Loader2
            size={35}
            className="spin"
          />

          <h3>
            Performing deep analysis...
          </h3>

          <p>
            MediSync is analyzing the selected
            medicine combinations.
          </p>

        </div>
      )}

      {/* RESULTS */}

      {!loading && deepResult && (

        <div className="deep-results">

          {/* SUMMARY */}

          <div className="deep-result-title">

            <div>
              <h2>Deep Analysis Result</h2>

              <p>
                {deepResult.medicine_count ||
                  medicines.length}{" "}
                medicines analyzed across{" "}
                {deepResult.combinations_checked ||
                  combinationCount}{" "}
                combinations.
              </p>
            </div>

          </div>

          {/* STATISTICS */}

          {deepResult.summary && (

            <div className="deep-stat-grid">

              <div className="deep-stat major-stat">
                <ShieldAlert size={22} />

                <div>
                  <span>Major</span>
                  <strong>
                    {deepResult.summary.major || 0}
                  </strong>
                </div>
              </div>

              <div className="deep-stat moderate-stat">
                <AlertTriangle size={22} />

                <div>
                  <span>Moderate</span>
                  <strong>
                    {deepResult.summary.moderate || 0}
                  </strong>
                </div>
              </div>

              <div className="deep-stat minor-stat">
                <AlertTriangle size={22} />

                <div>
                  <span>Minor</span>
                  <strong>
                    {deepResult.summary.minor || 0}
                  </strong>
                </div>
              </div>

              <div className="deep-stat none-stat">
                <CheckCircle size={22} />

                <div>
                  <span>No Record</span>
                  <strong>
                    {deepResult.summary.no_record ||
                      0}
                  </strong>
                </div>
              </div>

            </div>
          )}

          {/* PAIR RESULTS */}

          {deepResult.results &&
            deepResult.results.length > 0 && (

              <div className="pair-results">

                <h3>
                  Medicine Combination Results
                </h3>

                {deepResult.results.map(
                  (result, index) => {

                    const severity =
                      String(
                        result.severity || ""
                      ).toLowerCase();

                    return (
                      <div
                        className={`pair-result ${getSeverityClass(
                          result.severity
                        )}`}
                        key={index}
                      >

                        <div className="pair-header">

                          <div className="pair-medicines">

                            <Pill size={18} />

                            <strong>
                              {result.drug_1}
                            </strong>

                            <span>+</span>

                            <strong>
                              {result.drug_2}
                            </strong>

                          </div>

                          <span className="pair-severity">
                            {result.severity}
                          </span>

                        </div>

                        <div className="pair-description">

                          <h4>
                            Interaction
                          </h4>

                          <p>
                            {result.description ||
                              result.Detailed_Simple_Explanation ||
                              "No detailed description available."}
                          </p>

                        </div>

                        {result.health_concern && (

                          <div className="health-concern">

                            <strong>
                              Health Concern:
                            </strong>

                            <span>
                              {result.health_concern}
                            </span>

                          </div>

                        )}

                      </div>
                    );
                  }
                )}

              </div>
            )}

          {/* GEMINI RESULT */}

          {deepResult.deep_analysis && (

            <div className="gemini-result">

              <div className="gemini-result-header">

                <Brain size={23} />

                <div>
                  <h3>
                    AI Deep Explanation
                  </h3>

                  <p>
                    Detailed explanation generated
                    from the MediSync interaction data.
                  </p>
                </div>

              </div>

              <div className="gemini-text">
                {deepResult.deep_analysis}
              </div>

            </div>
          )}

        </div>
      )}

      {/* SAFETY */}

      <div className="deep-safety">

        <strong>Important:</strong>

        <span>
          This analysis is for medication safety
          awareness and education. Do not start,
          stop, or change prescribed medicines
          based only on this result. Consult a
          doctor or pharmacist for treatment
          decisions.
        </span>

      </div>

    </section>
  );
}

export default DeepAnalyze;