from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String)
    hashed_password = Column(String, nullable=False)
    avatar_url = Column(String, nullable=True)
    role = Column(String, default="developer")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, default="")
    status = Column(String, default="todo")
    priority = Column(String, default="medium")
    labels = Column(JSON, default=list)
    due_date = Column(DateTime(timezone=True), nullable=True)
    estimated_hours = Column(Float, default=0)
    actual_hours = Column(Float, default=0)
    assignee_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    assignee = relationship("User")

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, default="")
    status = Column(String, default="planning")
    progress = Column(Float, default=0)
    deadline = Column(DateTime(timezone=True), nullable=True)
    tech_stack = Column(JSON, default=list)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    creator = relationship("User")

class Note(Base):
    __tablename__ = "notes"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, default="")
    category = Column(String, default="general")
    is_favorite = Column(Boolean, default=False)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    user = relationship("User")

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String)
    entity_type = Column(String)
    entity_id = Column(Integer)
    details = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User")