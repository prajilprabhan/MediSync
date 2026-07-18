from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
import pandas as pd
from .database import get_db
from .schemas import UserCreate
from .crud import create_user, get_user_by_email
from ml.predict import predict_severity
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/users")
def register(user: UserCreate, db: Session = Depends(get_db)):

    existing_user = get_user_by_email(db, user.email)

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="User already registered"
        )

    return create_user(db, user)

@app.get("/predict")
def predict(drug1: str, drug2: str):
    severity = predict_severity(drug1, drug2)

    return {
        "drug1": drug1,
        "drug2": drug2,
        "severity": severity
    }



@app.post("/interaction")
def check(drug1 : str,drug2 :str):
    return check_interaction(drug1,drug2)

# Load CSV
df = pd.read_csv("datasets/DDI_lower.csv")

# Create unique drug list
drug_list = sorted(
    set(df["Drug_A"].dropna().astype(str))
    | set(df["Drug_B"].dropna().astype(str))
)

@app.get("/search")
def search(q: str):

    q = q.lower()

    result = [
        drug
        for drug in drug_list
        if drug.lower().startswith(q)
    ]

    return result[:10]