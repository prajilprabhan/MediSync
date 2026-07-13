from fastapi import FastAPI

app = FastAPI(title="MediSync API")

@app.post("/")
def home(name : str):
    return {"message":"Welcome to MediSync"+name}