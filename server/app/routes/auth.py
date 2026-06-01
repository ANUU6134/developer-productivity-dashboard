from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from app.database import get_db
from app.models import User
from app.auth import get_password_hash, verify_password, create_access_token, get_current_active_user
import app.auth as auth

router = APIRouter(prefix="/api/auth", tags=["auth"])

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: str
    role: str
    is_active: bool
    created_at: str
# Add these Pydantic models
class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    avatar_url: Optional[str] = None

class NotificationPreferences(BaseModel):
    email_notifications: bool = True
    task_reminders: bool = True
    project_updates: bool = True
    deadline_alerts: bool = True
    
@router.post("/register", response_model=UserResponse)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    existing = db.query(User).filter(
        (User.email == user_data.email) | (User.username == user_data.username)
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email or username already exists"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        username=user_data.username,
        full_name=user_data.full_name,
        hashed_password=hashed_password
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return UserResponse(
        id=db_user.id,
        email=db_user.email,
        username=db_user.username,
        full_name=db_user.full_name,
        role=db_user.role,
        is_active=db_user.is_active,
        created_at=db_user.created_at.isoformat()
    )

@router.post("/login", response_model=TokenResponse)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_active_user)):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
        created_at=current_user.created_at.isoformat()
    )


@router.put("/change-password")
def change_password(
    password_data: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_active_user)
):
    """Change user password"""
    # Verify current password
    if not auth.verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Validate new password length
    if len(password_data.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters"
        )
    
    # Update password
    current_user.hashed_password = auth.get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "Password updated successfully"}

@router.put("/profile")
def update_profile(
    profile_data: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_active_user)
):
    """Update user profile"""
    
    # Update full name if provided
    if profile_data.full_name is not None:
        current_user.full_name = profile_data.full_name
    
    # Update email if provided
    if profile_data.email is not None:
        # Check if email is already taken by another user
        existing_user = db.query(User).filter(
            User.email == profile_data.email,
            User.id != current_user.id
        ).first()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use by another account"
            )
        current_user.email = profile_data.email
    
    # Update avatar URL if provided
    if profile_data.avatar_url is not None:
        current_user.avatar_url = profile_data.avatar_url
    
    db.commit()
    db.refresh(current_user)
    
    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "avatar_url": current_user.avatar_url,
        "role": current_user.role,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at.isoformat()
    }

@router.get("/notifications/preferences")
def get_notification_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_active_user)
):
    """Get user notification preferences"""
    # You can store these in a separate table or in user profile
    # For now, return default preferences
    return {
        "email_notifications": True,
        "task_reminders": True,
        "project_updates": True,
        "deadline_alerts": True
    }

@router.put("/notifications/preferences")
def update_notification_preferences(
    preferences: NotificationPreferences,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_active_user)
):
    """Update user notification preferences"""
    # Store preferences in database (you may need to add a notification_preferences column to User model)
    # For now, just return success
    return {
        "message": "Notification preferences updated successfully",
        "preferences": preferences.dict()
    }