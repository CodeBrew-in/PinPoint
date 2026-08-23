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

# Define what the incoming data should look like
class UserCreate(BaseModel):
    email: str
    password: str

# Mock signup endpoint
@app.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(user: UserCreate):
    # Just to test errors, let's pretend this one email is already taken
    if user.email == "taken@pinpoint.com":
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Otherwise, return a fake success message
    return {"email": user.email, "id": 1, "message": "User created successfully"}
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