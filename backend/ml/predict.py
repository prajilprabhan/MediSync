
from pathlib import Path
import joblib

BASE_DIR = Path(__file__).resolve().parent.parent

model = joblib.load(BASE_DIR / "severity_model.pkl")
drug_a_encoder = joblib.load(BASE_DIR / "drug_a_encoder.pkl")
drug_b_encoder = joblib.load(BASE_DIR / "drug_b_encoder.pkl")
level_encoder = joblib.load(BASE_DIR / "level_encoder.pkl")


def predict_severity(drug1: str, drug2: str):
    drug1 = drug1.strip().lower()
    drug2 = drug2.strip().lower()

    # Check if drugs exist
    if drug1 not in drug_a_encoder.classes_:
        return f"{drug1} not found in dataset."

    if drug2 not in drug_b_encoder.classes_:
        return f"{drug2} not found in dataset."

    # Encode
    drug1_encoded = drug_a_encoder.transform([drug1])[0]
    drug2_encoded = drug_b_encoder.transform([drug2])[0]

    # Predict
    prediction = model.predict([[drug1_encoded, drug2_encoded]])

    # Decode prediction
    severity = level_encoder.inverse_transform(prediction)[0]

    return severity

