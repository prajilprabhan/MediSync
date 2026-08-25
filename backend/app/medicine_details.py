import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# In-memory database of medicine descriptions/conditions
medicine_descriptions = {}

def remove_boilerplate(desc: str) -> str:
    bp1 = "The exact reason for using this medicine depends on the active ingredient, strength, formulation, patient's age, other medicines, and health condition."
    bp2 = "It should only be used as directed by a doctor, pharmacist, or the medicine label."
    bp3 = "Educational medicine information only. This dataset does not provide a personal prescription, diagnosis, or dose."
    
    desc = desc.replace(bp1, "").replace(bp2, "").replace(bp3, "")
    # Cleanup duplicate spaces and double dots
    desc = desc.replace("  ", " ").replace("..", ".").strip()
    return desc

def load_all_medicine_details():
    med_csv_path = BASE_DIR / "datasets" / "Medicine_Details.csv"
    if not med_csv_path.exists():
        print(f"Error: Details dataset not found at {med_csv_path}")
        return
        
    try:
        print(f"Loading medicine details from {med_csv_path.name}...")
        cols = pd.read_csv(med_csv_path, nrows=0).columns.tolist()
        name_col = "Medicine_Name"
        desc_col = next((c for c in ["Simple_Description", "Medicine_Description", "Simple_Use_Explanation", "Simple_Uses"] if c in cols), "Simple_Description")
        disease_col = next((c for c in ["Disease_or_Condition", "Diseases_or_Conditions"] if c in cols), None)
        relevance_col = "India_Kerala_Relevance" if "India_Kerala_Relevance" in cols else None
        source_col = "Source_Note" if "Source_Note" in cols else None
        
        load_cols = [name_col, desc_col]
        for col in [disease_col, relevance_col, source_col]:
            if col:
                load_cols.append(col)
                
        df = pd.read_csv(med_csv_path, usecols=load_cols).fillna("")
        
        # Optimize iteration by using zipped lists
        names = df[name_col].astype(str).str.strip().str.lower().tolist()
        descs = df[desc_col].astype(str).str.strip().tolist()
        diseases = df[disease_col].astype(str).str.strip().tolist() if disease_col else [""] * len(df)
        relevance = df[relevance_col].astype(str).str.strip().tolist() if relevance_col else [""] * len(df)
        sources = df[source_col].astype(str).str.strip().tolist() if source_col else [""] * len(df)
        
        for name_str, desc_str, disease_str, rel, src in zip(names, descs, diseases, relevance, sources):
            # Only insert if there's a valid name and description
            if name_str and desc_str:
                medicine_descriptions[name_str] = {
                    "description": remove_boilerplate(desc_str),
                    "diseases": disease_str,
                    "relevance": rel,
                    "source_note": src
                }
    except Exception as e:
        print(f"Error loading {med_csv_path.name}: {e}")
        
    print(f"Successfully loaded {len(medicine_descriptions)} medicine descriptions.")

def load_medicine_details_from_interactions():
    p = BASE_DIR / "datasets" / "Medicine_Interactions.csv"
    if not p.exists():
        print(f"Error: Interactions dataset fallback not found at {p}")
        return
        
    loaded_fallback_count = 0
    try:
        df = pd.read_csv(p).fillna("")
        cols = df.columns
        
        # Map columns
        d1_desc = next((c for c in ["drug_1_description", "drug_1_simple_uses"] if c in cols), "")
        d2_desc = next((c for c in ["drug_2_description", "drug_2_simple_uses"] if c in cols), "")
        
        d1_cond = next((c for c in ["drug_1_conditions", "drug_1_simple_uses", "drug_1_health_concern", "health_concerns"] if c in cols), "")
        d2_cond = next((c for c in ["drug_2_conditions", "drug_2_simple_uses", "drug_2_health_concern", "health_concerns"] if c in cols), "")
        
        rel_col = next((c for c in ["drug_1_india_kerala_relevance", "india_kerala_health_context"] if c in cols), "")
        d2_rel_col = "drug_2_india_kerala_relevance" if "drug_2_india_kerala_relevance" in cols else rel_col
        
        src_col = next((c for c in ["context_source", "data_source"] if c in cols), "")
        
        # Read lists from dataframe columns
        d1_list = df["drug_1"].astype(str).str.strip().str.lower().tolist() if "drug_1" in cols else []
        d2_list = df["drug_2"].astype(str).str.strip().str.lower().tolist() if "drug_2" in cols else []
        
        d1_desc_list = df[d1_desc].astype(str).str.strip().tolist() if d1_desc else [""] * len(df)
        d2_desc_list = df[d2_desc].astype(str).str.strip().tolist() if d2_desc else [""] * len(df)
        
        d1_cond_list = df[d1_cond].astype(str).str.strip().tolist() if d1_cond else [""] * len(df)
        d2_cond_list = df[d2_cond].astype(str).str.strip().tolist() if d2_cond else [""] * len(df)
        
        d1_rel_list = df[rel_col].astype(str).str.strip().tolist() if rel_col else [""] * len(df)
        d2_rel_list = df[d2_rel_col].astype(str).str.strip().tolist() if d2_rel_col else [""] * len(df)
        
        src_list = df[src_col].astype(str).str.strip().tolist() if src_col else [""] * len(df)
        
        src_default_detailed = "drug_1_description" in cols or "drug_1_simple_uses" in cols
        
        for idx in range(len(df)):
            # Process drug_1 fallback details
            if d1_list:
                drug = d1_list[idx]
                if drug and drug not in medicine_descriptions:
                    desc = d1_desc_list[idx]
                    cond = d1_cond_list[idx]
                    rel = d1_rel_list[idx]
                    src = src_list[idx] if src_list[idx] else ("MediSync Interactions Reference" if src_default_detailed else "MediSync Essential Context Reference")
                    
                    final_desc = desc or (f"Used to treat or manage: {cond}." if cond else "")
                    if final_desc:
                        medicine_descriptions[drug] = {
                            "description": remove_boilerplate(final_desc),
                            "diseases": cond,
                            "relevance": rel,
                            "source_note": src
                        }
                        loaded_fallback_count += 1
            
            # Process drug_2 fallback details
            if d2_list:
                drug = d2_list[idx]
                if drug and drug not in medicine_descriptions:
                    desc = d2_desc_list[idx]
                    cond = d2_cond_list[idx]
                    rel = d2_rel_list[idx]
                    src = src_list[idx] if src_list[idx] else ("MediSync Interactions Reference" if src_default_detailed else "MediSync Essential Context Reference")
                    
                    final_desc = desc or (f"Used to treat or manage: {cond}." if cond else "")
                    if final_desc:
                        medicine_descriptions[drug] = {
                            "description": remove_boilerplate(final_desc),
                            "diseases": cond,
                            "relevance": rel,
                            "source_note": src
                        }
                        loaded_fallback_count += 1
    except Exception as e:
        print(f"Error extracting fallback details from {p.name}: {e}")
        
    print(f"Loaded {loaded_fallback_count} additional medicine descriptions from interactions dataset.")