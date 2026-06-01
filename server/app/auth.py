from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
import os
import secrets
import hashlib

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def get_password_hash(password: str) -> str:
    """Hash password using SHA-256 - NO LENGTH LIMITATIONS"""
    # Generate a random salt
    salt = secrets.token_hex(16)
    # Hash password + salt
    password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
    # Store salt with hash
    return f"{salt}:{password_hash}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password - NO LENGTH LIMITATIONS"""
    try:
        salt, stored_hash = hashed_password.split(":")
        # Hash the provided password with the stored salt
        password_hash = hashlib.sha256((plain_password + salt).encode()).hexdigest()
        return password_hash == stored_hash
    except Exception:
        return False

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = int(payload.get("sub"))
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user