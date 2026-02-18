from datetime import datetime, timedelta
from typing import Optional
import warnings

# Suppress passlib's bcrypt version warning (bcrypt 4.x removed __about__)
warnings.filterwarnings("ignore", ".*error reading bcrypt version.*")

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

_BCRYPT_MAX_BYTES = 72


def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Truncate to 72 bytes to match hashing behaviour
    truncated = plain_password.encode("utf-8")[:_BCRYPT_MAX_BYTES].decode("utf-8", errors="ignore")
    return pwd_context.verify(truncated, hashed_password)


def get_password_hash(password: str) -> str:
    # bcrypt silently truncates at 72 bytes; do it explicitly to avoid errors
    truncated = password.encode("utf-8")[:_BCRYPT_MAX_BYTES].decode("utf-8", errors="ignore")
    return pwd_context.hash(truncated)


# JWT Token functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    # JWT spec requires "sub" to be a string. Encoding numeric IDs causes
    # decode failures ("Subject must be a string") and downstream 401s.
    if "sub" in to_encode and to_encode["sub"] is not None:
        to_encode["sub"] = str(to_encode["sub"])

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None


# Supabase client (optional — only used if keys are configured)
def get_supabase_client():
    """Return Supabase client only when credentials are configured."""
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        return None
    try:
        from supabase import create_client, Client
        supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        return supabase
    except Exception:
        return None


# Auth helpers
async def verify_supabase_token(token: str) -> Optional[dict]:
    """Verify Supabase JWT token and return user info"""
    try:
        supabase = get_supabase_client()
        if supabase is None:
            return None
        user = supabase.auth.get_user(token)
        return user
    except Exception:
        return None


def extract_user_from_token(token: str) -> Optional[dict]:
    """Extract user ID from our own JWT token"""
    payload = decode_token(token)
    if payload:
        return {"id": payload.get("sub"), "email": payload.get("email")}
    return None
