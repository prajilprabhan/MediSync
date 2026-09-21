import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment configuration from backend root directory
BASE_DIR = Path(__file__).resolve().parent.parent
env_file = BASE_DIR / ".env"
if env_file.exists():
    load_dotenv(dotenv_path=env_file)
else:
    load_dotenv()

# Initialize Gemini Client lazily or dynamically
_client = None

def get_gemini_client():
    global _client
    if _client is not None:
        return _client
        
    api_key = (
        os.getenv("GEMINI_API_KEY")
        or os.getenv("GOOGLE_API_KEY")
        or os.getenv("API_KEY")
        or ""
    ).strip()
    
    if not api_key:
        return None
        
    try:
        from google import genai
        _client = genai.Client(api_key=api_key)
        print("Gemini client successfully initialized.")
        return _client
    except Exception as e:
        print(f"Warning: Failed to initialize Gemini client: {e}")
        return None

def generate_local_clinical_report(analysis: dict) -> str:
    """
    Deterministic clinical report engine.
    Produces a comprehensive 7-section clinical analysis from the curated
    database records when the cloud AI API is unavailable, rate-limited, or unconfigured.
    """
    medicines = analysis.get("medicines", [])
    results = analysis.get("results", [])
    med_details = analysis.get("medicine_details", [])
    
    # Analyze severities
    severities = [str(r.get("severity", "")).lower() for r in results]
    duplicate_results = [r for r in results if r.get("source") == "Duplicate Ingredient Check"]
    
    if "major" in severities or duplicate_results:
        overall_severity = "Major"
        severity_reason = "At least one potentially serious interaction or duplicate active ingredient was identified in the combination."
    elif "moderate" in severities:
        overall_severity = "Moderate"
        severity_reason = "Known moderate interactions require cautious monitoring, clinical oversight, or potential timing adjustments."
    elif "minor" in severities:
        overall_severity = "Minor"
        severity_reason = "Only minor or low-significance interactions were identified that generally do not require stopping therapy."
    else:
        overall_severity = "No known major interaction"
        severity_reason = "No documented adverse interactions were found in the clinical reference database for this specific combination."

    # Section 1: Overall Summary
    meds_formatted = ", ".join([m.title() for m in medicines])
    lines = [
        "## 1. OVERALL SUMMARY",
        f"This report reviews the combination of **{meds_formatted}** ({len(medicines)} medicines).",
    ]
    
    if duplicate_results:
        dup_text = "; ".join([f"{r['drug_1']} and {r['drug_2']}" for r in duplicate_results])
        lines.append(f"\n> ⚠️ **CRITICAL WARNING:** Duplicate active ingredient detected between {dup_text}. Combining products with identical active agents poses a severe risk of accidental overdose.")
    elif results:
        lines.append(f"\nBased on clinical reference records, **{len(results)} documented interaction(s)** exist between these medications. Overall risk level is rated as **{overall_severity}**.")
    else:
        lines.append(f"\nNo direct interaction warnings were flagged in the reference database for this combination. However, combined therapy should always be monitored for additive individual side effects.")

    # Section 2: Medicine Information
    lines.append("\n## 2. MEDICINE INFORMATION")
    for med in med_details:
        name = med.get("name", "Unknown Medicine")
        desc = med.get("description", "No description available in standard clinical reference.")
        diseases = med.get("diseases", "")
        relevance = med.get("relevance", "")
        
        lines.append(f"\n### {name}")
        lines.append(f"- **Overview:** {desc}")
        if diseases:
            lines.append(f"- **Common Indications:** {diseases}")
        if relevance:
            lines.append(f"- **Regional Clinical Context:** {relevance}")
        lines.append("- **General Precautions:** Take strictly as prescribed. Do not self-escalate doses or combine with unverified over-the-counter drugs.")

    # Section 3: Complete Medicine Combination Analysis
    lines.append("\n## 3. COMPLETE MEDICINE COMBINATION ANALYSIS")
    if duplicate_results:
        lines.append("### Cumulative Toxicity & Overdose Risk")
        lines.append("Taking multiple formulations with the same active compound overwhelms metabolic clearance pathways (such as hepatic glucuronidation or renal excretion), significantly elevating systemic toxicity.")
    
    if results:
        lines.append("### Synergistic and Metabolic Effects")
        for res in results:
            lines.append(f"- **{res.get('drug_1')} + {res.get('drug_2')} ({res.get('severity')} Severity):** {res.get('description', '')}")
            if res.get("patient_note"):
                lines.append(f"  *Clinical Note:* {res.get('patient_note')}")
            if res.get("safety_note"):
                lines.append(f"  *Safety Note:* {res.get('safety_note')}")
    else:
        lines.append("### Combination Dynamics")
        lines.append("No adverse pharmacokinetic or pharmacodynamic antagonism has been documented between these specific medications in the current dataset. However, simultaneous administration may still cause additive gastrointestinal discomfort, mild lethargy, or altered absorption rates.")

    # Section 4: Overall Severity
    lines.append(f"\n## 4. OVERALL SEVERITY: {overall_severity.upper()}")
    lines.append(f"- **Assessment:** {severity_reason}")
    lines.append("- **Clinical Evaluation:** This rating reflects the cumulative risk of the complete regimen, prioritizing patient safety and organ protection.")

    # Section 5: Possible Warning Symptoms
    lines.append("\n## 5. POSSIBLE WARNING SYMPTOMS")
    lines.append("If taking this regimen, watch for the following symptoms that may indicate an adverse reaction or drug interaction:")
    if overall_severity in ["Major", "Moderate"]:
        lines.append("- Unexpected bruising, prolonged bleeding, or blood in stool/urine")
        lines.append("- Severe stomach pain, persistent nausea, or heartburn")
        lines.append("- Excessive dizziness, confusion, extreme drowsiness, or unsteadiness")
        lines.append("- Irregular heartbeat, palpitations, or shortness of breath")
        lines.append("- Yellowing of eyes or skin, dark urine (hepatic distress signs)")
    else:
        lines.append("- Mild nausea, upset stomach, or indigestion")
        lines.append("- Transient headache or mild dizziness upon standing")
        lines.append("- Allergic signs such as unexplained skin rash, itching, or hives")

    # Section 6: What The User Should Do
    lines.append("\n## 6. WHAT THE USER SHOULD DO")
    lines.append("1. **Consult Your Healthcare Provider:** Discuss this exact medicine combination with your treating physician or pharmacist.")
    lines.append("2. **Do Not Alter Regimens Independently:** Never stop, pause, or change dosages of prescribed medication without explicit medical guidance.")
    lines.append("3. **Stagger Intake If Advised:** Check with your pharmacist whether spacing doses by 2 or more hours reduces interaction risks.")
    lines.append("4. **Seek Urgent Care:** In case of sudden chest pain, breathing difficulty, severe allergic reaction, or collapse, seek emergency medical care immediately.")

    # Section 7: Important Disclaimer
    lines.append("\n## 7. IMPORTANT DISCLAIMER")
    lines.append("> *MediSync provides educational medicine information and automated drug-interaction screening. It is not a substitute for clinical judgment, medical diagnosis, or personalized patient treatment plans.*")

    return "\n".join(lines)


def deep_analyze_with_gemini(analysis: dict) -> str:
    """
    Generates a deep AI clinical report.
    Uses Gemini API (gemini-2.0-flash with fallback to gemini-1.5-flash).
    If the API client is not configured or encounters an error, seamlessly
    falls back to the deterministic local clinical synthesis engine.
    """
    client = get_gemini_client()
    
    # If client is not available, provide the synthesized clinical report directly
    if not client:
        print("Gemini client not available. Utilizing MediSync deterministic clinical engine.")
        return generate_local_clinical_report(analysis)
        
    # Format the input data cleanly for the model
    input_str = f"Selected Medicines: {', '.join(analysis['medicines'])}\n"
    input_str += f"Number of Medicines: {analysis['medicine_count']}\n\n"
    
    input_str += "MEDICINE DETAILS FROM DATABASE:\n"
    for med in analysis.get("medicine_details", []):
        input_str += f"- Medicine: {med['name']}\n"
        input_str += f"  Description: {med['description']}\n"
        input_str += f"  Commonly Used For: {med.get('diseases', 'Not specified')}\n"
        input_str += f"  Regional Context: {med.get('relevance', 'Standard')}\n"
        input_str += f"  Source: {med.get('source_note', 'Clinical Reference')}\n\n"
        
    input_str += "KNOWN PAIRWISE INTERACTION RESULTS:\n"
    if analysis.get("results"):
        for result in analysis["results"]:
            input_str += f"- Pair: {result['drug_1']} + {result['drug_2']}\n"
            input_str += f"  Severity: {result['severity']}\n"
            input_str += f"  Interaction Description: {result['description']}\n"
            input_str += f"  Health Concern: {result.get('health_concern', 'None specified')}\n"
            input_str += f"  Source: {result['source']}\n\n"
    else:
        input_str += "No documented adverse pairwise interactions were found in the reference database for these medicines.\n\n"
        
    prompt = f"""You are MediSync, an advanced medicine safety and clinical interaction education engine.

Analyze the following group of medicines selected by a user.

CLINICAL GUIDELINES:
- Analyze the COMPLETE combination of medicines together.
- Do NOT simply repeat pair-by-pair explanations; provide a holistic analysis of taking ALL listed medicines in the same period.
- If duplicate active ingredients exist (e.g. two brand names sharing the same generic ingredient), highlight the severe overdose risk immediately.
- If no known interactions are found in the database, explicitly state that, while providing practical pharmacodynamic advice on combined intake.
- Do not invent non-existent medical facts.
- Use clear, accessible English with markdown formatting (headers, bullet points).
- Do not diagnose or recommend stopping/starting prescriptions.

INPUT DATA:
{input_str}

GENERATE THE REPORT STRICTLY USING THIS STRUCTURE WITH CLEAR MARKDOWN HEADINGS:

## 1. OVERALL SUMMARY
Short overview of the selected medicines and whether taking them together presents any important interaction or duplication concerns.

## 2. MEDICINE INFORMATION
Detail each medicine separately:
- **Name**
- **What it is & common uses**
- **How it works (simple terms)**
- **Common side effects & key precautions**

## 3. COMPLETE MEDICINE COMBINATION ANALYSIS
Explain what happens when ALL of these medicines are taken together:
- Synergistic, additive, or counteracting effects
- Organ impact (liver, kidney, gastrointestinal, central nervous system, heart)
- What specific interaction mechanism is at play

## 4. OVERALL SEVERITY
State one overall severity for the complete combination:
- No known major interaction
- Minor
- Moderate
- Major
Explain in 1-2 clear sentences why this severity level was assigned.

## 5. POSSIBLE WARNING SYMPTOMS
Bullet list of medically relevant warning signs indicating a potential adverse reaction or interaction.

## 6. WHAT THE USER SHOULD DO
Practical, safe steps for the patient (adhere to instructions, do not double-dose, consult pharmacist/doctor, when to seek urgent medical attention).

## 7. IMPORTANT DISCLAIMER
A standard MediSync educational disclaimer that this is for educational purposes and does not replace a doctor or pharmacist.
"""

    models_to_try = [
        os.getenv("GEMINI_MODEL", "gemini-2.0-flash"),
        "gemini-1.5-flash",
        "gemini-1.5-pro"
    ]
    
    # Deduplicate while preserving order
    seen_models = set()
    candidate_models = []
    for m in models_to_try:
        if m and m not in seen_models:
            seen_models.add(m)
            candidate_models.append(m)

    last_error = None
    for model_name in candidate_models:
        try:
            print(f"Requesting Gemini analysis using model: {model_name}...")
            response = client.models.generate_content(
                model=model_name,
                contents=prompt
            )
            if response and response.text:
                return response.text
        except Exception as e:
            last_error = e
            print(f"Error calling Gemini API with model {model_name}: {e}")
            continue

    print(f"All Gemini models failed (last error: {last_error}). Falling back to local clinical synthesis.")
    return generate_local_clinical_report(analysis)
