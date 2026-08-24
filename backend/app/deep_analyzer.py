import os
from google import genai
from dotenv import load_dotenv

# Load environment configuration
load_dotenv()

# Initialize Gemini Client
client = None
try:
    api_key = os.getenv("API_KEY") or os.getenv("GEMINI_API_KEY")
    if api_key:
        client = genai.Client(api_key=api_key.strip())
        print("Gemini client successfully initialized.")
    else:
        print("Warning: API_KEY not found in environment. Deep AI analysis will be disabled.")
except Exception as e:
    print(f"Warning: Failed to initialize Gemini client: {e}")

def deep_analyze_with_gemini(analysis: dict) -> str:
    if not client:
        return "Error: Gemini client is not initialized. Please verify that the API_KEY env variable is configured correctly."
        
    # Format the input data cleanly for the model
    input_str = f"Selected Medicines: {', '.join(analysis['medicines'])}\n"
    input_str += f"Number of Medicines: {analysis['medicine_count']}\n\n"
    
    input_str += "MEDICINE DETAILS FROM DATABASE:\n"
    for med in analysis.get("medicine_details", []):
        input_str += f"- Medicine: {med['name']}\n"
        input_str += f"  Description: {med['description']}\n"
        input_str += f"  Commonly Used For: {med['diseases']}\n"
        input_str += f"  Regional Context: {med['relevance']}\n"
        input_str += f"  Source: {med['source_note']}\n\n"
        
    input_str += "KNOWN PAIRWISE INTERACTION RESULTS:\n"
    for result in analysis["results"]:
        input_str += f"- Pair: {result['drug_1']} + {result['drug_2']}\n"
        input_str += f"  Severity: {result['severity']}\n"
        input_str += f"  Interaction Description: {result['description']}\n"
        input_str += f"  Source: {result['source']}\n\n"
        
    prompt = f"""
You are MediSync, a medicine information and drug-interaction education assistant.

Your task is to analyze a group of medicines selected by a user.

IMPORTANT:
- Analyze the COMPLETE combination of medicines together.
- Do NOT give separate pair-by-pair interaction explanations.
- Do NOT treat the medicines as isolated pairs.
- Explain how taking ALL of the listed medicines together during the same medication period or intake could affect the person.
- Do not invent medical facts.
- If reliable interaction information is unavailable, clearly say that it is unavailable.
- Do not diagnose the user.
- Do not recommend changing, stopping, or starting a medicine.
- Use simple English that an ordinary person can understand.
- Clearly distinguish known interaction information from general medicine information.

INPUT:
{input_str}

GENERATE THE REPORT USING THE FOLLOWING STRUCTURE:

1. OVERALL SUMMARY

Give a short explanation of what the selected medicines are being considered for and whether taking them together presents any important interaction concerns.

2. MEDICINE INFORMATION

Explain each medicine separately, one at a time.

For every medicine include:

- Medicine name
- What it is
- What it is commonly used for
- How it generally works in simple terms
- Common side effects
- Important precautions

Do not discuss interactions in this section.

3. COMPLETE MEDICINE COMBINATION ANALYSIS

Analyze ALL selected medicines together as one combination.

Explain:

- What could happen when all of these medicines are taken together
- Whether one medicine can increase, decrease, or otherwise change the effect of another medicine
- Whether the combination can increase side effects
- Whether the combination can affect important body functions such as blood pressure, blood sugar, heart rhythm, bleeding, liver function, kidney function, or the central nervous system, when relevant
- What symptoms a person might notice if the combination causes a problem
- Whether the overall combination appears to have no major known interaction, a minor concern, or a potentially serious concern

IMPORTANT:
Do not create sections such as:
"Medicine A + Medicine B"
"Medicine A + Medicine C"
"Medicine B + Medicine C"

Instead, provide ONE integrated explanation of the entire combination.

4. OVERALL SEVERITY

Give one overall severity level for the complete combination:

- No known major interaction
- Minor
- Moderate
- Major

Then explain why this severity was selected in simple language.

Do not assign severity merely because one individual medicine has common side effects. Severity must relate to the COMPLETE combination.

5. POSSIBLE WARNING SYMPTOMS

List important symptoms that could indicate a problem with the complete combination.

Only include symptoms that are medically relevant to the medicines provided.

6. WHAT THE USER SHOULD DO

Give general safety guidance.

For example:
- Follow the prescription instructions.
- Do not change the dose without consulting a qualified healthcare professional.
- If concerning symptoms occur, seek medical advice.
- If severe or emergency symptoms occur, seek urgent medical attention.

Do not provide a personalized diagnosis or treatment plan.

7. IMPORTANT DISCLAIMER

End with a short disclaimer stating that MediSync provides educational information and does not replace advice from a doctor or pharmacist.

STYLE REQUIREMENTS:

- Use simple, understandable English.
- Avoid unnecessary medical jargon.
- If medical terminology is necessary, explain it briefly.
- Be concise but informative.
- Use headings and bullet points.
- Do not repeat the same information.
- Do not make unsupported claims.
- Do not assume the user's age, medical history, dosage, pregnancy status, or other conditions unless explicitly provided.

The final response should be written for a normal person rather than a medical professional.
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        return response.text
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return f"Error generating Deep AI clinical report: {e}"
