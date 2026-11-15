import secrets

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import current_user
from app.core.events import log_event, mask_email
from app.core.ratelimit import client_ip, hit
from app.core.roles import is_moderator
from app.core.security import create_access_token, hash_password, verify_password
from app.db.database import get_db
from app.models.location import Location, Photo
from app.models.map import Map, MapShare
from app.models.user import User
from app.schemas.user import AccountDelete, Token, UserCreate, UserLogin, UserRead, UserUpdate, user_read
from app.services.removal import audit, delete_files, remove_location, remove_map

router = APIRouter(prefix="/auth", tags=["auth"])

# Checked when the email is unknown, so a wrong email takes as long as a wrong password
# and the response time does not reveal which emails have accounts.
_DUMMY_HASH = hash_password(secrets.token_urlsafe(16))


def _username_taken(db: Session, username: str) -> bool:
    return db.query(User).filter(func.lower(User.username) == username.lower()).first() is not None


def _pick_username(db: Session, requested: str | None) -> str:
    """The username asked for, or a random one. It is never made from the email, which would show part of it publicly."""
    if requested:
        if _username_taken(db, requested):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken")
        return requested

    while True:
        candidate = f"explorer-{secrets.randbelow(10**6):06d}"
        if not _username_taken(db, candidate):
            return candidate


@router.post("/signup", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def signup(user: UserCreate, request: Request, db: Session = Depends(get_db)):
    hit(f"signup:ip:{client_ip(request)}", limit=10, window_seconds=3600)

    existing_user = db.query(User).filter(func.lower(User.email) == user.email).first()

    # An address listed in MODERATOR_EMAILS must already have an account before it is listed. E-mails are not
    # verified, so otherwise the first person to sign up with that address would become a moderator.
    if existing_user or is_moderator(user.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    username = _pick_username(db, user.username)

    new_user = User(
        email=user.email,
        password_hash=hash_password(user.password),
        username=username,
        name=username,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    log_event("signup", user_id=new_user.id, email=mask_email(new_user.email), ip=client_ip(request))

    return user_read(new_user)


@router.post("/login", response_model=Token)
def login(user: UserLogin, request: Request, db: Session = Depends(get_db)):
    ip = client_ip(request)
    # Per address (slows guessing one account's password) and per IP (slows trying many accounts)
    hit(f"login:email:{user.email}", limit=10, window_seconds=900)
    hit(f"login:ip:{ip}", limit=30, window_seconds=900)

    existing_user = db.query(User).filter(func.lower(User.email) == user.email).first()

    password_ok = verify_password(user.password, existing_user.password_hash if existing_user else _DUMMY_HASH)
    if not existing_user or not password_ok:
        log_event("login_failed", email=mask_email(user.email), ip=ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(
        data={"sub": str(existing_user.id)}
    )
    log_event("login", user_id=existing_user.id, ip=ip)

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


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_me(
    body: AccountDelete,
    request: Request,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    """Delete the account and everything it owns: its maps (with all places on them), its places,
    the photos it uploaded, its notes and reports, and the shares made to its address."""
    hit(f"delete:user:{user.id}", limit=5, window_seconds=900)
    if not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Wrong password")

    files: list[str] = []
    for map_ in db.query(Map).filter(Map.owner_id == user.id).all():
        files += remove_map(db, map_, user)
    db.flush()
    for location in db.query(Location).filter(Location.owner_id == user.id).all():
        files += remove_location(db, location, user)
    for photo in db.query(Photo).filter(Photo.uploaded_by_id == user.id).all():
        if photo.filename:
            files.append(photo.filename)
        db.delete(photo)
    db.query(MapShare).filter(MapShare.email == user.email.strip().lower()).delete(synchronize_session=False)

    audit(db, None, "account_deleted", "user", user.id, f"ip {client_ip(request)}")
    db.delete(user)  # notes and reports go with it (ON DELETE CASCADE)
    db.commit()
    delete_files(files)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
