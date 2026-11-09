from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.roles import is_moderator
from app.core.security import verify_access_token
from app.db.database import get_db
from app.models.user import User

# auto_error=False so we can decide ourselves: required routes answer 401, optional routes carry on as a guest.
bearer = HTTPBearer(auto_error=False)


def _user_from_credentials(
    credentials: Optional[HTTPAuthorizationCredentials], db: Session
) -> Optional[User]:
    if credentials is None:
        return None
    payload = verify_access_token(credentials.credentials)
    if not payload:
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    try:
        return db.query(User).filter(User.id == int(user_id)).first()
    except (TypeError, ValueError):
        return None


def optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """The signed-in user, or None for a guest (a missing or invalid token counts as a guest)."""
    return _user_from_credentials(credentials, db)


def current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    user = _user_from_credentials(credentials, db)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    return user


def moderator_user(user: User = Depends(current_user)) -> User:
    if not is_moderator(user.email):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Moderators only")
    return user
