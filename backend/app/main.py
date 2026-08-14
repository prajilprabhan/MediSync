from fastapi import FastAPI, HTTPException
import pandas as pd
import joblib
import itertools
from pathlib import Path
from pydantic import BaseModel
from typing import List
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup Initialization
BASE_DIR = Path(__file__).resolve().parent.parent
csv_path = BASE_DIR / "datasets" / "MediSync_DDI_cleaned.csv"
models_dir = BASE_DIR / "models"

print(f"Loading cleaned dataset for search/lookup from {csv_path}...")
try:
    df_cleaned = pd.read_csv(csv_path)
    df_cleaned = df_cleaned[["drug_1", "drug_2", "severity", "interaction_description"]].dropna()
    df_cleaned["drug_1"] = df_cleaned["drug_1"].str.strip().str.lower()
    df_cleaned["drug_2"] = df_cleaned["drug_2"].str.strip().str.lower()
    df_cleaned["severity"] = df_cleaned["severity"].str.strip().str.title()
    
    # Pre-compute list of unique drugs for auto-complete search
    unique_drugs = sorted(list(set(df_cleaned["drug_1"].unique()) | set(df_cleaned["drug_2"].unique())))
    print(f"Loaded {len(df_cleaned)} interaction records and {len(unique_drugs)} unique drugs.")
except Exception as e:
    print(f"Warning: Failed to load dataset: {e}")
    df_cleaned = pd.DataFrame()
    unique_drugs = []

# Load ML components
model = None
drug_a_encoder = None
drug_b_encoder = None
level_encoder = None

def load_ml_components():
    global model, drug_a_encoder, drug_b_encoder, level_encoder
    if model is None:
        try:
            if (models_dir / "severity_model.pkl").exists():
                print("Loading severity prediction ML model and encoders (on-demand)...")
                model = joblib.load(models_dir / "severity_model.pkl")
                drug_a_encoder = joblib.load(models_dir / "drug_a_encoder.pkl")
                drug_b_encoder = joblib.load(models_dir / "drug_b_encoder.pkl")
                level_encoder = joblib.load(models_dir / "level_encoder.pkl")
                print("ML components loaded successfully.")
            else:
                print("Warning: ML model not found. Run train_model.py first.")
        except Exception as e:
            print(f"Warning: Failed to load ML model: {e}")

# Helper for description generation
def generate_friendly_desc(a_disp: str, b_disp: str, severity: str) -> str:
    l_low = severity.lower() if severity else "minor"
    if "major" in l_low:
        return f"Combining {a_disp} and {b_disp} is considered a Major interaction. This combination carries a significant risk of severe side effects, clinical toxicity, or decreased therapeutic effectiveness. Patients should avoid co-administration unless specifically directed and closely monitored by their physician."
    elif "moderate" in l_low:
        return f"Combining {a_disp} and {b_disp} is considered a Moderate interaction. Concurrent use of these medications may increase the risk of side effects, decrease the effectiveness of one or both drugs, or require clinical monitoring and potential dosage adjustments."
    else:
        return f"Combining {a_disp} and {b_disp} is considered a Minor interaction. While these drugs can interact, the severity is generally low and typically does not require a change in therapy. However, patients should monitor for any unusual symptoms or mild side effects."

# Request Schemas
class AnalyzeRequest(BaseModel):
    drugs: List[str]

# API Endpoints
@app.get("/search")
def search_drugs(q: str = ""):
    if not q:
        return []
    q_low = q.strip().lower()
    matches = [d.title() for d in unique_drugs if q_low in d]
    return matches[:15]  # limit to top 15 results

@app.post("/analyze")
def analyze_interactions(payload: AnalyzeRequest):
    load_ml_components()
    drugs = [d.strip().lower() for d in payload.drugs if d.strip()]
    if len(drugs) < 2:
        raise HTTPException(status_code=400, detail="Select at least two drugs.")
        
    results = []
    
    # Check all combinations of drug pairs
    for d1, d2 in itertools.combinations(drugs, 2):
        sorted_pair = sorted([d1, d2])
        drug_a, drug_b = sorted_pair[0], sorted_pair[1]
        
        # 1. Search database via Pandas lookup
        match = df_cleaned[
            (df_cleaned["drug_1"] == drug_a) & 
            (df_cleaned["drug_2"] == drug_b)
        ]
        
        if not match.empty:
            row = match.iloc[0]
            results.append({
                "drug_1": drug_a.title(),
                "drug_2": drug_b.title(),
                "severity": row["severity"],
                "description": row["interaction_description"],
                "source": "Database Lookup"
            })
        else:
            # 2. Predict using Machine Learning Classifier
            if model and drug_a_encoder and drug_b_encoder and level_encoder:
                if drug_a in drug_a_encoder.classes_ and drug_b in drug_b_encoder.classes_:
                    try:
                        d1_enc = drug_a_encoder.transform([drug_a])[0]
                        d2_enc = drug_b_encoder.transform([drug_b])[0]
                        
                        pred_encoded = model.predict([[d1_enc, d2_enc]])[0]
                        severity = level_encoder.inverse_transform([pred_encoded])[0]
                        description = generate_friendly_desc(drug_a.title(), drug_b.title(), severity)
                        
                        results.append({
                            "drug_1": drug_a.title(),
                            "drug_2": drug_b.title(),
                            "severity": severity,
                            "description": description,
                            "source": "AI Prediction"
                        })
                    except Exception as e:
                        results.append({
                            "drug_1": drug_a.title(),
                            "drug_2": drug_b.title(),
                            "severity": "Major",
                            "description": f"Interaction details between {drug_a.title()} and {drug_b.title()} are not available in the dataset. For patient safety, untested combinations default to a Major warning. Please consult a physician or pharmacist before combining these medications.",
                            "source": "Safety Default"
                        })
                else:
                    results.append({
                        "drug_1": drug_a.title(),
                        "drug_2": drug_b.title(),
                        "severity": "Major",
                        "description": f"Interaction details between {drug_a.title()} and {drug_b.title()} are not available in the dataset. For patient safety, untested combinations default to a Major warning. Please consult a physician or pharmacist before combining these medications.",
                        "source": "Safety Default"
                    })
            else:
                results.append({
                    "drug_1": drug_a.title(),
                    "drug_2": drug_b.title(),
                    "severity": "Major",
                    "description": f"Interaction details between {drug_a.title()} and {drug_b.title()} are not available in the dataset. For patient safety, untested combinations default to a Major warning. Please consult a physician or pharmacist before combining these medications.",
                    "source": "Safety Default"
                })
                
    return results
