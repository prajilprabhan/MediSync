# Brand names and common generic synonyms mapping
DRUG_SYNONYMS = {
    # Generics and common variations
    "paracetamol": "acetaminophen",
    "acetaminofene": "acetaminophen",
    "aspirin": "acetylsalicylic acid",
    "acetylsalicylicacid": "acetylsalicylic acid",
    "asa": "acetylsalicylic acid",
    
    # Brand Names containing Acetaminophen (Paracetamol)
    "dolo": "acetaminophen",
    "dolo 650": "acetaminophen",
    "dolo650": "acetaminophen",
    "crocin": "acetaminophen",
    "calpol": "acetaminophen",
    "saridon": "acetaminophen",
    "panadol": "acetaminophen",
    "tylenol": "acetaminophen",
    "febrex": "acetaminophen",
    "pacimol": "acetaminophen",
    "pyragesic": "acetaminophen",
    
    # Brand Names containing Acetylsalicylic Acid (Aspirin)
    "disprin": "acetylsalicylic acid",
    "ecosprin": "acetylsalicylic acid",
    "loprin": "acetylsalicylic acid",
    "colaspur": "acetylsalicylic acid",
    "anacin": "acetylsalicylic acid",
    
    # Brand Names containing Ibuprofen
    "combiflam": "ibuprofen",
    "brufen": "ibuprofen",
    "advil": "ibuprofen",
    "motrin": "ibuprofen",
    "flexon": "ibuprofen",
    
    # Common Antacids/Acid Reducers
    "pantocid": "pantoprazole",
    "pan": "pantoprazole",
    "pantosec": "pantoprazole",
    "pan-d": "pantoprazole",
    "omez": "omeprazole",
    "ocid": "omeprazole",
    "aciloc": "ranitidine",
    "zantac": "ranitidine",
    
    # Common Antibiotics
    "augmentin": "amoxicillin",
    "novamox": "amoxicillin",
    "mox": "amoxicillin",
    "azithral": "azithromycin",
    "zithromac": "azithromycin",
    "althrocin": "erythromycin",
    "ciplox": "ciprofloxacin",
}

def get_canonical_name(name: str) -> str:
    name_low = name.strip().lower()
    return DRUG_SYNONYMS.get(name_low, name_low)
