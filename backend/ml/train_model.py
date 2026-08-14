import pandas as pd
from pathlib import Path
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
import joblib

# Load dataset
BASE_DIR = Path(__file__).resolve().parent.parent
csv_path = BASE_DIR / "datasets" / "MediSync_DDI_cleaned.csv"

print(f"Loading dataset from {csv_path}...")
df = pd.read_csv(csv_path)

# Keep only necessary columns and drop missing values
df = df[["drug_1", "drug_2", "severity"]].dropna()

# Normalize drug names and severities
df["drug_1"] = df["drug_1"].str.strip().str.lower()
df["drug_2"] = df["drug_2"].str.strip().str.lower()
df["severity"] = df["severity"].str.strip().str.title()

# Standardize severity names
df["severity"] = df["severity"].replace({
    "Major": "Major",
    "Moderate": "Moderate",
    "Minor": "Minor",
    "Unknown": "Minor"  # default unknowns to minor for the classifier
})

print(f"Dataset loaded. Total rows: {len(df)}")
print("Severity distribution:")
print(df["severity"].value_counts())

# Fit LabelEncoders on drug names and severities
print("Fitting encoders...")
drug_a_encoder = LabelEncoder()
df["drug_1_encoded"] = drug_a_encoder.fit_transform(df["drug_1"])

drug_b_encoder = LabelEncoder()
df["drug_2_encoded"] = drug_b_encoder.fit_transform(df["drug_2"])

level_encoder = LabelEncoder()
df["severity_encoded"] = level_encoder.fit_transform(df["severity"])

# Features and target
X = df[["drug_1_encoded", "drug_2_encoded"]]
y = df["severity_encoded"]

# Train model on the complete dataset
print("Training Random Forest Classifier on the complete dataset...")
model = RandomForestClassifier(
    n_estimators=150,
    random_state=42,
    n_jobs=-1
)
model.fit(X, y)

# Save model and encoders
models_dir = BASE_DIR / "models"
models_dir.mkdir(exist_ok=True)

print("Saving models and encoders...")
joblib.dump(model, models_dir / "severity_model.pkl")
joblib.dump(drug_a_encoder, models_dir / "drug_a_encoder.pkl")
joblib.dump(drug_b_encoder, models_dir / "drug_b_encoder.pkl")
joblib.dump(level_encoder, models_dir / "level_encoder.pkl")

print("Model and encoders saved successfully.")