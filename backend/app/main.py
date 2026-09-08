from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Import refactored modules
from .synonyms import get_canonical_name, DRUG_SYNONYMS
from .analyzer import load_all_interactions, unique_drugs_ddi, analyze_interactions_logic
from .medicine_details import load_all_medicine_details, load_medicine_details_from_interactions, medicine_descriptions
from .deep_analyzer import deep_analyze_with_gemini

app = FastAPI(title="MediSync API")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

search_list = []

def build_search_list():
    global search_list
    all_names = unique_drugs_ddi.copy()
    for brand in DRUG_SYNONYMS.keys():
        all_names.add(brand)
    for name in medicine_descriptions.keys():
        all_names.add(name)
        
    search_list = sorted([name.title() for name in all_names])
    print(f"Search list populated with {len(search_list)} total medicines.")

# Load datasets and compile search list on startup
load_all_interactions()
load_all_medicine_details()
load_medicine_details_from_interactions()
build_search_list()

class AnalyzeRequest(BaseModel):
    drugs: List[str]

@app.get("/search")
def search_drugs(q: str = ""):
    if not q.strip():
        return []
    
    q_low = q.strip().lower()
    prefix_matches = []
    substring_matches = []
    
    for drug in search_list:
        drug_low = drug.lower()
        if drug_low.startswith(q_low):
            prefix_matches.append(drug)
            if len(prefix_matches) >= 15:
                break
        elif q_low in drug_low:
            substring_matches.append(drug)
            
    results = prefix_matches + substring_matches
    return results[:15]

@app.get("/medicine/{medicine_name:path}")
def get_medicine_details(medicine_name: str):
    name_low = medicine_name.strip().lower()
    
    # 1. Exact match check
    med_info = medicine_descriptions.get(name_low)
    matched_name = medicine_name
    
    # 2. Canonical mapping check
    if not med_info:
        canon = get_canonical_name(name_low)
        med_info = medicine_descriptions.get(canon)
        matched_name = canon.title()
        
    # 3. Substring check
    if not med_info:
        for med_name, info in medicine_descriptions.items():
            if name_low in med_name:
                med_info = info
                matched_name = med_name.title()
                break
                
    if med_info:
        desc = med_info.get("description", "")
        diseases = med_info.get("diseases", "")
        # Split diseases/conditions by semicolon and filter empty ones
        conditions = [c.strip() for c in diseases.split(";") if c.strip()] if diseases else []
        
        desc = desc.strip() or "No description available in standard clinical reference."
        return {
            "name": matched_name,
            "description": desc,
            "conditions": conditions,
            "relevance": med_info.get("relevance", ""),
            "source_note": med_info.get("source_note", "")
        }
            
    raise HTTPException(
        status_code=404,
        detail="Medicine details not found."
    )

@app.post("/analyze")
def analyze_interactions(payload: AnalyzeRequest):
    drugs = [d.strip() for d in payload.drugs if d.strip()]
    if len(drugs) < 2:
        raise HTTPException(
            status_code=400,
            detail="Select at least two medicines."
        )
    return analyze_interactions_logic(drugs)

@app.post("/deep-analyze")
def deep_analyze_interactions(payload: AnalyzeRequest):
    drugs = [d.strip() for d in payload.drugs if d.strip()]
    if len(drugs) < 2:
        raise HTTPException(
            status_code=400,
            detail="Select at least two medicines."
        )
    
    # Run pairwise analysis first
    results = analyze_interactions_logic(drugs)
    
    # Extract details for each drug in the request
    med_details_list = []
    for drug in drugs:
        name_low = drug.strip().lower()
        info = medicine_descriptions.get(name_low)
        if not info:
            canon = get_canonical_name(name_low)
            info = medicine_descriptions.get(canon)
        if not info:
            for med_name, med_info in medicine_descriptions.items():
                if name_low in med_name:
                    info = med_info
                    break
        if info:
            med_details_list.append({
                "name": drug.title(),
                "description": info.get("description", ""),
                "diseases": info.get("diseases", ""),
                "relevance": info.get("relevance", ""),
                "source_note": info.get("source_note", "")
            })
        else:
            med_details_list.append({
                "name": drug.title(),
                "description": "No description available in standard clinical reference.",
                "diseases": "",
                "relevance": "",
                "source_note": ""
            })
            
    analysis_dict = {
        "medicines": drugs,
        "medicine_count": len(drugs),
        "results": results,
        "medicine_details": med_details_list
    }
    
    report = deep_analyze_with_gemini(analysis_dict)
    return {"analysis": report}