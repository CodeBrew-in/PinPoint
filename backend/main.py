from sqlalchemy.orm import Session
from fastapi import Depends
from app.db.database import get_db
from app.models.user import User
from app.core.security import hash_password
from app.schemas.user import UserCreate
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="PinPoint API")

# Add the CORS middleware to allow React to talk to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)



# Mock signup endpoint
@app.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    new_user = User(
        email=user.email,
        password_hash=hash_password(user.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "email": new_user.email,
        "id": new_user.id,
        "message": "User created successfully"
    }
# Mock login endpoint
@app.post("/login", status_code=status.HTTP_200_OK)
def login(user: UserCreate):
    # Just to test errors, let's pretend this email has the wrong password
    if user.email == "wrong@pinpoint.com":
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Otherwise, return a fake success token
    return {
        "message": "Login successful", 
        "access_token": "fake-super-secret-jwt-token", 
        "token_type": "bearer"
    }

@app.get("/")
def read_root():
    return {"message": "Welcome to PinPoint API"}