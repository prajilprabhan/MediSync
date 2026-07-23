# MediSync – AI Drug-to-Drug Interaction Analyzer

## Overview

MediSync is an AI-powered web application that detects and analyzes potential **Drug-to-Drug Interactions (DDIs)**. It allows users to search for medicines, analyze interaction severity, and view interaction descriptions using machine learning and publicly available drug interaction datasets.

> **Disclaimer:** This project is developed for educational and research purposes only. It does not provide medical advice or drug recommendations.

---

## Features

- User authentication (Register/Login)
- Search medicines with autocomplete
- Analyze interactions between two drugs
- Predict interaction severity using Machine Learning
- Display interaction descriptions
- Responsive user interface
- RESTful API with FastAPI

---

## Tech Stack

### Frontend
- React.js
- Bootstrap
- React Router
- Axios

### Backend
- FastAPI
- Python
- SQLAlchemy
- JWT Authentication
- Uvicorn

### Database
- PostgreSQL

### Machine Learning
- Scikit-learn
- Joblib

### Dataset
- DDInter Dataset
- TWOSIDES Dataset
- DrugBank

---

## Project Structure

```
MediSync
│
├── frontend
│   ├── public
│   ├── src
│   └── package.json
│
├── backend
│   ├── app
│   ├── datasets
│   ├── ml
│   └── requirements.txt
│
├── README.md
└── .gitignore
```

---

## Installation

### Clone Repository

```bash
git https://github.com/prajilprabhan/MediSync.git
cd medisync
```

### Backend

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

# Linux/macOS
source venv/bin/activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

Backend URL

```
http://localhost:8000
```

---

### Frontend

```bash
cd frontend

npm install

npm run dev
```

Frontend URL

```
http://localhost:5173
```

---

## API Endpoints

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | /register | Register a new user |
| POST | /login | Login user |
| GET | /search | Search medicines |
| POST | /predict | Predict drug interaction severity |

---

## Machine Learning Workflow

1. Load datasets.
2. Clean and preprocess data.
3. Encode medicine names.
4. Train the classification model.
5. Save the trained model using Joblib.
6. Predict interaction severity.
7. Return severity and interaction description.

---

## Severity Levels

| Level | Meaning |
|-------|---------|
| Minor | Low clinical significance |
| Moderate | Requires monitoring |
| Major | Serious interaction requiring medical attention |

---

## Future Improvements

- Multi-drug interaction analysis
- Drug dosage validation
- PDF report generation
- Docker deployment
- Cloud hosting
- Admin dashboard

---

## License

This project is licensed under the MIT License.

---

## Author

**Prajil P**

MCA Student  
Rajiv Gandhi Institute of Technology, Kottayam