/**
 * MediSync Clinical Printing & PDF Generation Service
 *
 * Provides standalone, clinical-grade printable document generation for:
 * 1. Patient Medication Dosage & Adherence Schedule (AddMedicine.jsx)
 * 2. Drug-to-Drug Interaction & Deep AI Clinical Risk Report (Dashboard.jsx / History.jsx)
 *
 * Uses an isolated, offscreen iframe to ensure 100% reliable print previews
 * without style bleeding, clipping, or single-page cutoff bugs in Chrome, Edge, and Firefox.
 */

function triggerIframePrint(htmlContent, documentTitle = "MediSync-Clinical-Report") {
  return new Promise((resolve) => {
    // Remove any previously hanging print iframes
    const existing = document.getElementById("medisync-print-frame");
    if (existing) {
      existing.remove();
    }

    const iframe = document.createElement("iframe");
    iframe.id = "medisync-print-frame";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.zIndex = "-9999";
    iframe.style.visibility = "hidden";

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Set title so saved PDF default filename is clean
    if (iframe.contentWindow) {
      iframe.contentWindow.document.title = documentTitle;
    }

    const handlePrint = () => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        resolve(true);
      } catch (err) {
        console.error("Iframe print error, falling back to window.print():", err);
        window.print();
        resolve(false);
      } finally {
        // Cleanup after dialog has opened
        setTimeout(() => {
          if (iframe && iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 3000);
      }
    };

    // Allow browser to render layout and images before invoking print dialog
    setTimeout(handlePrint, 350);
  });
}

/**
 * Common Print Stylesheet shared by all clinical reports
 */
const BASE_PRINT_CSS = `
  @page {
    size: A4 portrait;
    margin: 14mm 12mm 14mm 12mm;
  }
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #0f172a;
    background: #ffffff;
    margin: 0;
    padding: 0;
    font-size: 12px;
    line-height: 1.5;
  }
  .report-container {
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
  }
  
  /* Header & Branding */
  .header-table {
    width: 100%;
    border-bottom: 2px solid #0284c7;
    padding-bottom: 12px;
    margin-bottom: 16px;
  }
  .brand-title {
    font-size: 22px;
    font-weight: 800;
    color: #0369a1;
    letter-spacing: -0.5px;
    margin: 0;
  }
  .brand-subtitle {
    font-size: 11px;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
    margin-top: 3px;
  }
  .rx-badge {
    text-align: right;
    font-size: 28px;
    font-weight: 900;
    color: #0284c7;
    font-style: italic;
    font-family: Georgia, serif;
  }
  .report-id {
    font-size: 10px;
    color: #64748b;
    text-align: right;
    margin-top: 2px;
  }

  /* Patient & Report Metadata Grid */
  .meta-grid {
    width: 100%;
    border-collapse: collapse;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    margin-bottom: 18px;
  }
  .meta-grid td {
    padding: 8px 12px;
    vertical-align: top;
    border-right: 1px solid #e2e8f0;
    width: 33.33%;
  }
  .meta-grid td:last-child {
    border-right: none;
  }
  .meta-label {
    font-size: 9.5px;
    text-transform: uppercase;
    font-weight: 700;
    letter-spacing: 0.5px;
    color: #0369a1;
    margin-bottom: 3px;
  }
  .meta-val {
    font-size: 12px;
    font-weight: 600;
    color: #0f172a;
  }

  /* Section Titles */
  .section-title {
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    color: #0f172a;
    border-bottom: 1.5px solid #e2e8f0;
    padding-bottom: 5px;
    margin: 18px 0 10px 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  /* Schedule Table */
  table.schedule-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 18px;
    page-break-inside: auto;
  }
  table.schedule-table thead {
    display: table-header-group;
  }
  table.schedule-table tr {
    page-break-inside: avoid;
    page-break-after: auto;
  }
  table.schedule-table th {
    background: #0369a1;
    color: #ffffff;
    font-size: 10.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    padding: 7px 8px;
    border: 1px solid #0284c7;
    text-align: left;
  }
  table.schedule-table th.center,
  table.schedule-table td.center {
    text-align: center;
  }
  table.schedule-table td {
    padding: 7px 8px;
    border: 1px solid #cbd5e1;
    font-size: 11px;
    color: #1e293b;
  }
  table.schedule-table tbody tr:nth-child(even) {
    background: #f8fafc;
  }
  .med-name {
    font-weight: 700;
    color: #0f172a;
    font-size: 12px;
  }
  .med-dose {
    color: #0369a1;
    font-weight: 600;
  }
  .check-mark {
    color: #059669;
    font-weight: 900;
    font-size: 14px;
  }
  .dash-mark {
    color: #94a3b8;
    font-weight: 400;
  }

  /* Badges */
  .badge {
    display: inline-block;
    padding: 2px 7px;
    border-radius: 4px;
    font-size: 9.5px;
    font-weight: 700;
    text-transform: uppercase;
  }
  .badge-major {
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #f87171;
  }
  .badge-moderate {
    background: #fef3c7;
    color: #92400e;
    border: 1px solid #fcd34d;
  }
  .badge-minor {
    background: #e0f2fe;
    color: #075985;
    border: 1px solid #7dd3fc;
  }
  .badge-safe {
    background: #dcfce7;
    color: #166534;
    border: 1px solid #86efac;
  }

  /* Interaction Cards */
  .interaction-card {
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 10px 14px;
    margin-bottom: 12px;
    background: #ffffff;
    page-break-inside: avoid;
  }
  .interaction-card.major {
    border-left: 4px solid #dc2626;
    background: #fff5f5;
  }
  .interaction-card.moderate {
    border-left: 4px solid #d97706;
    background: #fffbeb;
  }
  .interaction-card.minor {
    border-left: 4px solid #0284c7;
    background: #f0f9ff;
  }
  .interaction-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }
  .interaction-pair {
    font-size: 13px;
    font-weight: 800;
    color: #0f172a;
  }
  .interaction-desc {
    font-size: 11px;
    color: #334155;
    margin: 4px 0 8px 0;
    line-height: 1.45;
  }
  .detail-row {
    font-size: 10.5px;
    margin-bottom: 4px;
    line-height: 1.4;
  }
  .detail-label {
    font-weight: 700;
  }
  .advisory {
    color: #0369a1;
  }
  .warning {
    color: #b91c1c;
  }

  /* Deep AI Clinical Box */
  .deep-ai-box {
    background: #faf5ff;
    border: 1.5px solid #d8b4fe;
    border-radius: 6px;
    padding: 12px 14px;
    margin: 16px 0;
    page-break-inside: avoid;
  }
  .deep-ai-title {
    font-size: 13px;
    font-weight: 800;
    color: #7e22ce;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .deep-ai-content {
    font-size: 11px;
    color: #3b0764;
    line-height: 1.5;
    white-space: pre-wrap;
  }

  /* Clinical Advisory / Disclaimer */
  .notice-box {
    background: #f8fafc;
    border-left: 4px solid #0284c7;
    padding: 10px 14px;
    margin-top: 18px;
    margin-bottom: 22px;
    font-size: 10.5px;
    color: #334155;
    line-height: 1.45;
    page-break-inside: avoid;
  }
  .notice-box strong {
    color: #0f172a;
  }

  /* Doctor Signature Section */
  .signature-table {
    width: 100%;
    margin-top: 24px;
    page-break-inside: avoid;
  }
  .signature-table td {
    vertical-align: bottom;
    padding: 0 10px;
    font-size: 10.5px;
  }
  .sig-line {
    border-bottom: 1px solid #475569;
    height: 32px;
    margin-bottom: 5px;
  }
  .sig-sub {
    font-size: 9.5px;
    color: #64748b;
    text-transform: uppercase;
    font-weight: 600;
  }

  /* Footer */
  .report-footer {
    border-top: 1px solid #e2e8f0;
    padding-top: 8px;
    margin-top: 20px;
    font-size: 9px;
    color: #94a3b8;
    display: flex;
    justify-content: space-between;
  }
`;

/**
 * Generate and print patient prescription schedule
 */
export function printPrescriptionReport({ user, medicines }) {
  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const reportId = `RX-MS-${Date.now().toString(36).toUpperCase()}`;
  const patientEmail = user?.email || "Registered Patient / Account Holder";
  const medCount = medicines?.length || 0;

  const rowsHtml = (medicines || []).map((med, idx) => {
    const name = med.medicineName || med.name || "Unnamed Medicine";
    const dose = med.dosage || "As directed";
    const cat = med.category || "Tablet";
    const t = med.timings || med.timing || {};
    const inst = med.instructions || med.instruction || "As directed";
    const morning = !!t.morning;
    const noon = !!(t.noon || t.afternoon);
    const night = !!(t.night || t.evening);
    const bedtime = !!t.bedtime;

    return `
      <tr>
        <td class="center" style="font-weight: 700; color: #64748b;">${idx + 1}</td>
        <td>
          <div class="med-name">${escapeHtml(name)}</div>
          <div style="font-size: 9.5px; color: #64748b;">${escapeHtml(cat)}</div>
        </td>
        <td><span class="med-dose">${escapeHtml(dose)}</span></td>
        <td class="center">${morning ? '<span class="check-mark">✓</span>' : '<span class="dash-mark">—</span>'}</td>
        <td class="center">${noon ? '<span class="check-mark">✓</span>' : '<span class="dash-mark">—</span>'}</td>
        <td class="center">${night ? '<span class="check-mark">✓</span>' : '<span class="dash-mark">—</span>'}</td>
        <td class="center">${bedtime ? '<span class="check-mark">✓</span>' : '<span class="dash-mark">—</span>'}</td>
        <td style="font-size: 10.5px;">${escapeHtml(inst)}</td>
      </tr>
    `;
  }).join("");

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>MediSync-Medication-Schedule-${reportId}</title>
      <style>${BASE_PRINT_CSS}</style>
    </head>
    <body>
      <div class="report-container">
        <!-- Header -->
        <table class="header-table">
          <tr>
            <td style="vertical-align: middle;">
              <h1 class="brand-title">MEDISYNC CLINICAL NETWORK</h1>
              <div class="brand-subtitle">Official Patient Medication Schedule & Dosage Adherence Plan</div>
            </td>
            <td style="vertical-align: middle; text-align: right;">
              <div class="rx-badge">℞</div>
              <div class="report-id">Document Ref: <strong>${reportId}</strong></div>
            </td>
          </tr>
        </table>

        <!-- Metadata Grid -->
        <table class="meta-grid">
          <tr>
            <td>
              <div class="meta-label">Patient / Account</div>
              <div class="meta-val">${escapeHtml(patientEmail)}</div>
            </td>
            <td>
              <div class="meta-label">Schedule Generated</div>
              <div class="meta-val">${dateStr}</div>
            </td>
            <td>
              <div class="meta-label">Prescriptions Active</div>
              <div class="meta-val">${medCount} Medications</div>
            </td>
          </tr>
        </table>

        <!-- Schedule Table -->
        <div class="section-title">Daily Administration Schedule</div>
        <table class="schedule-table">
          <thead>
            <tr>
              <th style="width: 4%;" class="center">#</th>
              <th style="width: 25%;">Medication & Type</th>
              <th style="width: 15%;">Dosage</th>
              <th style="width: 9%;" class="center">Morning</th>
              <th style="width: 9%;" class="center">Noon</th>
              <th style="width: 9%;" class="center">Evening</th>
              <th style="width: 9%;" class="center">Bedtime</th>
              <th style="width: 20%;">Clinical Instructions</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="8" class="center" style="padding: 20px;">No active medications found in schedule.</td></tr>'}
          </tbody>
        </table>

        <!-- Precaution Notice -->
        <div class="notice-box">
          <strong>Clinical Pharmacist Advisory:</strong>
          This schedule is generated from your active MediSync regimen. Take each medication at approximately the same time each day. Do not discontinue or adjust dosages of prescription medications without direct consultation with your attending physician or licensed pharmacist. Store all medications safely away from excess heat, moisture, and children.
        </div>

        <!-- Verification / Signature Block -->
        <table class="signature-table">
          <tr>
            <td style="width: 50%;">
              <div class="sig-line"></div>
              <div class="sig-sub">Attending Physician / Pharmacist Signature</div>
            </td>
            <td style="width: 25%;">
              <div class="sig-line"></div>
              <div class="sig-sub">License / NPI Number</div>
            </td>
            <td style="width: 25%;">
              <div class="sig-line"></div>
              <div class="sig-sub">Date Verified</div>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <div class="report-footer">
          <span>MediSync Clinical Intelligence Platform &copy; ${new Date().getFullYear()}</span>
          <span>Confidential Medical Information &bull; Ref: ${reportId}</span>
          <span>Page 1 of 1</span>
        </div>
      </div>
    </body>
    </html>
  `;

  return triggerIframePrint(fullHtml, `MediSync-Schedule-${reportId}`);
}

/**
 * Generate and print Drug-to-Drug Interaction & Deep AI Report
 */
export function printInteractionReport({
  user,
  selectedMedicines = [],
  results = [],
  medicationDetails = [],
  deepAnalysis = null,
}) {
  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const reportId = `DDI-MS-${Date.now().toString(36).toUpperCase()}`;
  const patientEmail = user?.email || "Registered Patient / Account Holder";

  // Calculate highest severity
  let maxSeverity = "No Interaction";
  let maxSeverityBadgeClass = "badge-safe";
  const hasMajor = results.some((r) => (r.severity || "").toLowerCase() === "major");
  const hasModerate = results.some((r) => (r.severity || "").toLowerCase() === "moderate");
  const hasMinor = results.some((r) => (r.severity || "").toLowerCase() === "minor");

  if (hasMajor) {
    maxSeverity = "Major Risk Detected";
    maxSeverityBadgeClass = "badge-major";
  } else if (hasModerate) {
    maxSeverity = "Moderate Risk Detected";
    maxSeverityBadgeClass = "badge-moderate";
  } else if (hasMinor) {
    maxSeverity = "Minor Interaction Detected";
    maxSeverityBadgeClass = "badge-minor";
  }

  // Interacting Pairs HTML
  let interactionsHtml = "";
  if (results.length === 0) {
    interactionsHtml = `
      <div class="interaction-card" style="border-left: 4px solid #10b981; background: #f0fdf4;">
        <strong style="color: #166534; font-size: 13px;">✓ No Known Negative Drug-to-Drug Interactions Detected</strong>
        <p style="color: #166534; margin: 4px 0 0 0; font-size: 11px;">
          Based on the analyzed pharmacovigilance database, no adverse interactions were identified between ${selectedMedicines.map(escapeHtml).join(", ")}. Always adhere to individual prescribing instructions.
        </p>
      </div>
    `;
  } else {
    interactionsHtml = results.map((res) => {
      const sev = (res.severity || "Minor").toUpperCase();
      const sevClass =
        sev === "MAJOR" ? "major" : sev === "MODERATE" ? "moderate" : "minor";
      const badgeClass =
        sev === "MAJOR" ? "badge-major" : sev === "MODERATE" ? "badge-moderate" : "badge-minor";

      return `
        <div class="interaction-card ${sevClass}">
          <div class="interaction-header">
            <span class="interaction-pair">${escapeHtml(res.drug_1)} + ${escapeHtml(res.drug_2)}</span>
            <span class="badge ${badgeClass}">${escapeHtml(sev)}</span>
          </div>
          <div class="interaction-desc">${escapeHtml(res.description || "Potential interaction identified.")}</div>
          ${res.severity_explanation ? `
            <div class="detail-row">
              <span class="detail-label">Mechanism / Clinical Detail:</span> ${escapeHtml(res.severity_explanation)}
            </div>` : ""}
          ${res.patient_note ? `
            <div class="detail-row advisory">
              <span class="detail-label">Patient Advisory:</span> ${escapeHtml(res.patient_note)}
            </div>` : ""}
          ${res.safety_note ? `
            <div class="detail-row warning">
              <span class="detail-label">Safety Precaution:</span> ${escapeHtml(res.safety_note)}
            </div>` : ""}
          <div style="font-size: 9.5px; color: #64748b; margin-top: 6px;">
            Evidence Source: ${escapeHtml(res.source || "MediSync Pharmacovigilance Database")}
          </div>
        </div>
      `;
    }).join("");
  }

  // Medication Profiles HTML
  let medDetailsHtml = "";
  if (medicationDetails && medicationDetails.length > 0) {
    medDetailsHtml = `
      <div class="section-title">Evaluated Drug Profiles & Indications</div>
      <table class="schedule-table">
        <thead>
          <tr>
            <th style="width: 25%;">Drug Name</th>
            <th style="width: 30%;">Indicated Clinical Conditions</th>
            <th style="width: 45%;">Pharmacological Description</th>
          </tr>
        </thead>
        <tbody>
          ${medicationDetails.map((item) => `
            <tr>
              <td style="font-weight: 700; text-transform: capitalize; color: #0369a1;">${escapeHtml(item.name)}</td>
              <td style="font-size: 10.5px;">${escapeHtml((item.conditions || []).join(", ") || "General Prescription")}</td>
              <td style="font-size: 10.5px; color: #334155;">${escapeHtml(item.description || "Active pharmaceutical ingredient.")}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }

  // Deep AI Synthesis HTML
  let deepAiHtml = "";
  if (deepAnalysis) {
    deepAiHtml = `
      <div class="deep-ai-box">
        <div class="deep-ai-title">✨ Deep AI Clinical Synthesis (Gemini Multi-Drug Intelligence)</div>
        <div class="deep-ai-content">${escapeHtml(deepAnalysis)}</div>
      </div>
    `;
  }

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>MediSync-Interaction-Report-${reportId}</title>
      <style>${BASE_PRINT_CSS}</style>
    </head>
    <body>
      <div class="report-container">
        <!-- Header -->
        <table class="header-table">
          <tr>
            <td style="vertical-align: middle;">
              <h1 class="brand-title">MEDISYNC PHARMACOVIGILANCE</h1>
              <div class="brand-subtitle">Clinical Drug-to-Drug Interaction & Risk Assessment Report</div>
            </td>
            <td style="vertical-align: middle; text-align: right;">
              <div class="rx-badge">Rx-Safety</div>
              <div class="report-id">Document Ref: <strong>${reportId}</strong></div>
            </td>
          </tr>
        </table>

        <!-- Metadata Grid -->
        <table class="meta-grid">
          <tr>
            <td>
              <div class="meta-label">Patient / Account</div>
              <div class="meta-val">${escapeHtml(patientEmail)}</div>
            </td>
            <td>
              <div class="meta-label">Evaluation Date</div>
              <div class="meta-val">${dateStr}</div>
            </td>
            <td>
              <div class="meta-label">Overall Risk Level</div>
              <div class="meta-val">
                <span class="badge ${maxSeverityBadgeClass}">${escapeHtml(maxSeverity)}</span>
              </div>
            </td>
          </tr>
        </table>

        <!-- Drugs Tested Banner -->
        <div style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; margin-bottom: 16px; font-size: 11px;">
          <strong style="color: #0369a1;">Analyzed Combination:</strong>
          <span style="font-weight: 600; color: #0f172a; margin-left: 6px;">
            ${selectedMedicines.map((m) => `<span style="display: inline-block; background: #e0f2fe; color: #0369a1; padding: 1px 8px; border-radius: 4px; margin: 2px 4px 2px 0; font-weight: 700;">💊 ${escapeHtml(m)}</span>`).join(" ")}
          </span>
        </div>

        <!-- Pairwise Results -->
        <div class="section-title">Specific Interaction Findings (${results.length})</div>
        ${interactionsHtml}

        <!-- Deep AI Analysis Section (if present) -->
        ${deepAiHtml}

        <!-- Medication Details Table -->
        ${medDetailsHtml}

        <!-- Precaution Notice -->
        <div class="notice-box">
          <strong>Clinical Advisory & Precautionary Guidance:</strong>
          This report compiles data from peer-reviewed pharmacovigilance databases and deep clinical synthesis models. It is designed to assist healthcare professionals and patients in identifying contraindications and metabolic competition. Never stop taking any prescribed medication or alter dosing schedules without explicit instructions from your physician or certified healthcare provider.
        </div>

        <!-- Verification / Signature Block -->
        <table class="signature-table">
          <tr>
            <td style="width: 50%;">
              <div class="sig-line"></div>
              <div class="sig-sub">Attending Physician / Clinical Reviewer Signature</div>
            </td>
            <td style="width: 25%;">
              <div class="sig-line"></div>
              <div class="sig-sub">License / Clinical ID</div>
            </td>
            <td style="width: 25%;">
              <div class="sig-line"></div>
              <div class="sig-sub">Date Reviewed</div>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <div class="report-footer">
          <span>MediSync Clinical Intelligence Platform &copy; ${new Date().getFullYear()}</span>
          <span>Confidential Clinical Risk Assessment &bull; Ref: ${reportId}</span>
          <span>Page 1 of 1</span>
        </div>
      </div>
    </body>
    </html>
  `;

  return triggerIframePrint(fullHtml, `MediSync-Interaction-${reportId}`);
}

function escapeHtml(text) {
  if (text === null || text === undefined) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
