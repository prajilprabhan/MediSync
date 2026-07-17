from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

from .database import get_db, engine
from .models import Base
from .schemas import UserCreate, UserResponse
from .crud import create_user

app = FastAPI()

Base.metadata.create_all(bind=engine)

@app.post("/users", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    return create_user(db, user)

