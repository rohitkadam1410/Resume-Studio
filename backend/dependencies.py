from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
import os
from typing import Optional
from sqlmodel import Session, select
from database import get_session
from models import User
import re
import bcrypt
from dotenv import load_dotenv

load_dotenv()

# Authentication configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hash using direct bcrypt."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"), 
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """Hash a password using direct bcrypt."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password: str) -> str:
    """
    Validate password strength.
    Returns None if valid, otherwise returns an error message.
    """
    if len(password) < 8:
        return "Password must be at least 8 characters long."
    
    if len(password.encode("utf-8")) > 72:
        return "Password is too long (must be under 72 bytes)."
        
    if not any(char.isupper() for char in password):
        return "Password must contain at least one uppercase letter."
        
    if not any(char.islower() for char in password):
        return "Password must contain at least one lowercase letter."
        
    if not any(char.isdigit() for char in password):
        return "Password must contain at least one digit."
        
    if not any(char in "!@#$%^&*()_+-=[]{}|;:,.<>?" for char in password):
        return "Password must contain at least one special character (!@#$%^&* etc.)."
        
    return None


async def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    result = await session.exec(select(User).where(User.email == email))
    user = result.first()
    if user is None:
        raise credentials_exception
    return user

async def get_optional_user(
    request: Request,
    session: Session = Depends(get_session)
) -> Optional[User]:
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split(' ')[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        result = await session.exec(select(User).where(User.email == email))
        return result.first()
    except Exception:
        return None
