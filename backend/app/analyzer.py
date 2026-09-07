import itertools
import pandas as pd
from pathlib import Path
from .synonyms import get_canonical_name

BASE_DIR = Path(__file__).resolve().parent.parent

ddi_lookup = {}
unique_drugs_ddi = set()

def load_all_interactions():
    unique_drugs = set()
    csv_path = BASE_DIR / "datasets" / "Medicine_Interactions.csv"
    if not csv_path.exists():
        print(f"Error: Interactions dataset not found at {csv_path}")
        return
        
    try:
        print(f"Loading interactions from {csv_path.name}...")
        df = pd.read_csv(csv_path).fillna("")
        
        cols = df.columns.tolist()
        d1_col = "drug_1" if "drug_1" in cols else (cols[1] if len(cols) > 1 else cols[0])
        d2_col = "drug_2" if "drug_2" in cols else (cols[2] if len(cols) > 2 else cols[0])
        sev_col = "severity" if "severity" in cols else (cols[3] if len(cols) > 3 else cols[0])
        desc_col = "interaction_description" if "interaction_description" in cols else ("Simple_Interaction_Description" if "Simple_Interaction_Description" in cols else cols[0])
        
        sev_exp_col = "Severity_Explanation" if "Severity_Explanation" in cols else None
        patient_note_col = "What_This_Means_For_Patients" if "What_This_Means_For_Patients" in cols else ("Simple_Interaction_Description" if "Simple_Interaction_Description" in cols else None)
        safety_col = "Safety_Note" if "Safety_Note" in cols else None
        
        # Convert series to lists for fast zipped access
        d1_list = df[d1_col].astype(str).str.strip().str.lower().tolist()
        d2_list = df[d2_col].astype(str).str.strip().str.lower().tolist()
        sev_list = df[sev_col].astype(str).str.strip().str.title().tolist()
        desc_list = df[desc_col].astype(str).str.strip().tolist()
        
        sev_exp_list = df[sev_exp_col].astype(str).str.strip().tolist() if sev_exp_col else [""] * len(df)
        patient_note_list = df[patient_note_col].astype(str).str.strip().tolist() if patient_note_col else [""] * len(df)
        safety_list = df[safety_col].astype(str).str.strip().tolist() if safety_col else [""] * len(df)
        
        for d1, d2, sev, desc, sev_exp, patient_note, safety_note in zip(
            d1_list, d2_list, sev_list, desc_list, sev_exp_list, patient_note_list, safety_list
        ):
            if d1 and d2:
                unique_drugs.add(d1)
                unique_drugs.add(d2)
                pair = tuple(sorted([d1, d2]))
                
                if pair not in ddi_lookup or (ddi_lookup[pair]["description"] == "" and desc != ""):
                    ddi_lookup[pair] = {
                        "severity": sev,
                        "description": desc,
                        "severity_explanation": sev_exp,
                        "patient_note": patient_note,
                        "safety_note": safety_note
                    }
    except Exception as e:
        print(f"Error loading {csv_path.name}: {e}")
            
    global unique_drugs_ddi
    unique_drugs_ddi.clear()
    unique_drugs_ddi.update(unique_drugs)
    print(f"Successfully merged {len(ddi_lookup)} total interaction pairs.")

def analyze_interactions_logic(drugs: list) -> list:
    results = []
    # Check all pairwise combinations
    for d1_orig, d2_orig in itertools.combinations(drugs, 2):
        d1_canon = get_canonical_name(d1_orig)
        d2_canon = get_canonical_name(d2_orig)
        
        # Duplicate ingredient check
        if d1_canon == d2_canon:
            results.append({
                "drug_1": d1_orig.title(),
                "drug_2": d2_orig.title(),
                "severity": "Major",
                "description": f"Both {d1_orig.title()} and {d2_orig.title()} contain the same active ingredient ({d1_canon.title()}). Combining them carries a high risk of accidental overdose and severe toxicity.",
                "severity_explanation": "",
                "patient_note": "Do not take two medicines containing the same active ingredient together.",
                "safety_note": "Accidental overdose risk.",
                "source": "Duplicate Ingredient Check"
            })
            continue
            
        pair = tuple(sorted([d1_canon, d2_canon]))
        if pair in ddi_lookup:
            match = ddi_lookup[pair]
            desc = match["description"]
            
            # Format description by replacing canonical names with display names
            drug_a, drug_b = pair[0], pair[1]
            disp_a = d1_orig if d1_canon == drug_a else d2_orig
            disp_b = d2_orig if d1_canon == drug_a else d1_orig
            
            desc_friendly = desc.replace(drug_a, disp_a.title()).replace(drug_b, disp_b.title())
            desc_friendly = desc_friendly.replace(drug_a.title(), disp_a.title()).replace(drug_b.title(), disp_b.title())
            
            results.append({
                "drug_1": disp_a.title(),
                "drug_2": disp_b.title(),
                "severity": match["severity"],
                "description": desc_friendly,
                "severity_explanation": match.get("severity_explanation", ""),
                "patient_note": match.get("patient_note", ""),
                "safety_note": match.get("safety_note", ""),
                "source": "Database Lookup"
            })
            
    return results
