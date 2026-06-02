from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.database import get_db
from app.models import User, Task, ActivityLog
from app.auth import get_current_active_user

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    status: Optional[str] = "todo"
    priority: Optional[str] = "medium"
    labels: Optional[List[str]] = []
    due_date: Optional[str] = None
    estimated_hours: Optional[float] = 0

class TaskResponse(BaseModel):
    id: int
    title: str
    description: str
    status: str
    priority: str
    labels: List[str]
    due_date: Optional[str]
    estimated_hours: float
    actual_hours: float
    created_at: str
    updated_at: Optional[str]

@router.get("/")
def get_tasks(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Task).filter(Task.assignee_id == current_user.id)
    
    if status and status != "all":
        query = query.filter(Task.status == status)
    
    tasks = query.order_by(Task.created_at.desc()).all()
    
    return [
        {
            "id": t.id,
            "title": t.title,
            "description": t.description or "",
            "status": t.status,
            "priority": t.priority,
            "labels": t.labels or [],
            "due_date": t.due_date.isoformat() if t.due_date else None,
            "estimated_hours": t.estimated_hours or 0,
            "actual_hours": t.actual_hours or 0,
            "created_at": t.created_at.isoformat(),
            "updated_at": t.updated_at.isoformat() if t.updated_at else None
        }
        for t in tasks
    ]

@router.post("/")
def create_task(task_data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_task = Task(
        title=task_data.get("title"),
        description=task_data.get("description", ""),
        status=task_data.get("status", "todo"),
        priority=task_data.get("priority", "medium"),
        labels=task_data.get("labels", []),
        due_date=datetime.fromisoformat(task_data["due_date"]) if task_data.get("due_date") else None,
        estimated_hours=task_data.get("estimated_hours", 0),
        actual_hours=0,
        assignee_id=current_user.id
    )
    
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    
    # Create activity log
    activity = ActivityLog(
        user_id=current_user.id,
        action="created",
        entity_type="task",
        entity_id=db_task.id,
        details={"title": task_data.get("title")}
    )
    db.add(activity)
    db.commit()
    
    return {
        "id": db_task.id,
        "title": db_task.title,
        "description": db_task.description or "",
        "status": db_task.status,
        "priority": db_task.priority,
        "labels": db_task.labels or [],
        "due_date": db_task.due_date.isoformat() if db_task.due_date else None,
        "estimated_hours": db_task.estimated_hours or 0,
        "actual_hours": db_task.actual_hours or 0,
        "created_at": db_task.created_at.isoformat(),
        "updated_at": db_task.updated_at.isoformat() if db_task.updated_at else None
    }

@router.put("/{task_id}")
def update_task(task_id: int, task_data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_task = db.query(Task).filter(Task.id == task_id, Task.assignee_id == current_user.id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    old_status = db_task.status
    
    # Update fields
    db_task.title = task_data.get("title", db_task.title)
    db_task.description = task_data.get("description", db_task.description)
    db_task.status = task_data.get("status", db_task.status)
    db_task.priority = task_data.get("priority", db_task.priority)
    db_task.labels = task_data.get("labels", db_task.labels)
    db_task.due_date = datetime.fromisoformat(task_data["due_date"]) if task_data.get("due_date") else None
    db_task.estimated_hours = task_data.get("estimated_hours", db_task.estimated_hours)
    db_task.updated_at = datetime.utcnow()
    
    # If task is being marked as completed
    if db_task.status == "completed" and old_status != "completed":
        db_task.actual_hours = db_task.estimated_hours or 0
        activity = ActivityLog(
            user_id=current_user.id,
            action="completed",
            entity_type="task",
            entity_id=db_task.id,
            details={"title": db_task.title}
        )
        db.add(activity)
    
    db.commit()
    db.refresh(db_task)
    
    return {
        "id": db_task.id,
        "title": db_task.title,
        "description": db_task.description or "",
        "status": db_task.status,
        "priority": db_task.priority,
        "labels": db_task.labels or [],
        "due_date": db_task.due_date.isoformat() if db_task.due_date else None,
        "estimated_hours": db_task.estimated_hours or 0,
        "actual_hours": db_task.actual_hours or 0,
        "created_at": db_task.created_at.isoformat(),
        "updated_at": db_task.updated_at.isoformat() if db_task.updated_at else None
    }

@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_task = db.query(Task).filter(Task.id == task_id, Task.assignee_id == current_user.id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(db_task)
    db.commit()
    
    return {"message": "Task deleted successfully"}