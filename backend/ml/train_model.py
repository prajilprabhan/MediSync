import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib

# Load dataset
BASE_DIR = Path(__file__).resolve().parent.parent

csv = BASE_DIR / "datasets" / "DDI_lower.csv"

df = pd.read_csv(csv)

# Remove missing values
df = df.dropna()

# Encode Drug_A
drug_a_encoder = LabelEncoder()
df["Drug_A"] = drug_a_encoder.fit_transform(df["Drug_A"])

# Encode Drug_B
drug_b_encoder = LabelEncoder()
df["Drug_B"] = drug_b_encoder.fit_transform(df["Drug_B"])

# Encode Level
level_encoder = LabelEncoder()
df["Level"] = level_encoder.fit_transform(df["Level"])

# Features and target
X = df[["Drug_A", "Drug_B"]]
y = df["Level"]

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

# Train model
model = RandomForestClassifier(
    n_estimators=200,
    random_state=42
)

model.fit(X_train, y_train)

# Test
pred = model.predict(X_test)

print("Accuracy:", accuracy_score(y_test, pred))
print(classification_report(y_test, pred))

# Save model and encoders
joblib.dump(model, "models/severity_model.pkl")
joblib.dump(drug_a_encoder, "models/drug_a_encoder.pkl")
joblib.dump(drug_b_encoder, "models/drug_b_encoder.pkl")
joblib.dump(level_encoder, "models/level_encoder.pkl")

print("Model saved successfully.")