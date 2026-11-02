import re

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.db.database import get_db
from app.models.user import User
from app.schemas.user import Token, UserCreate, UserLogin, UserRead, UserUpdate, user_read

router = APIRouter(prefix="/auth", tags=["auth"])


def _username_taken(db: Session, username: str) -> bool:
    return db.query(User).filter(func.lower(User.username) == username.lower()).first() is not None


def _pick_username(db: Session, email: str, requested: str | None) -> str:
    """The username asked for, or one made from the email name (made unique with a number)."""
    if requested:
        if _username_taken(db, requested):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken")
        return requested

    base = re.sub(r"[^A-Za-z0-9_-]", "", email.split("@")[0])[:26] or "user"
    if len(base) < 3:
        base = (base + "user")[:26]
    candidate, number = base, 1
    while _username_taken(db, candidate):
        number += 1
        candidate = f"{base}{number}"
    return candidate


@router.post("/signup", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    username = _pick_username(db, user.email, user.username)

    new_user = User(
        email=user.email,
        password_hash=hash_password(user.password),
        username=username,
        name=username,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return user_read(new_user)


@router.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()

    if not existing_user or not verify_password(
        user.password,
        existing_user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(
        data={"sub": str(existing_user.id)}
    )

    return Token(access_token=access_token)


@router.get("/me", response_model=UserRead)
def get_current_user(user: User = Depends(current_user)):
    return user_read(user)


@router.patch("/me", response_model=UserRead)
def update_me(
    changes: UserUpdate,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    if changes.name is not None:
        user.name = changes.name
    if changes.bio is not None:
        user.bio = changes.bio.strip()
    db.commit()
    db.refresh(user)
    return user_read(user)
