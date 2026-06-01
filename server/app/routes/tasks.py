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

@router.get("/", response_model=List[TaskResponse])
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
        TaskResponse(
            id=t.id,
            title=t.title,
            description=t.description or "",
            status=t.status,
            priority=t.priority,
            labels=t.labels or [],
            due_date=t.due_date.isoformat() if t.due_date else None,
            estimated_hours=t.estimated_hours or 0,
            actual_hours=t.actual_hours or 0,
            created_at=t.created_at.isoformat(),
            updated_at=t.updated_at.isoformat() if t.updated_at else None
        )
        for t in tasks
    ]

@router.post("/", response_model=TaskResponse)
def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_task = Task(
        title=task.title,
        description=task.description,
        status=task.status,
        priority=task.priority,
        labels=task.labels,
        due_date=datetime.fromisoformat(task.due_date) if task.due_date else None,
        estimated_hours=task.estimated_hours,
        assignee_id=current_user.id
    )
    
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    
    return TaskResponse(
        id=db_task.id,
        title=db_task.title,
        description=db_task.description or "",
        status=db_task.status,
        priority=db_task.priority,
        labels=db_task.labels or [],
        due_date=db_task.due_date.isoformat() if db_task.due_date else None,
        estimated_hours=db_task.estimated_hours or 0,
        actual_hours=db_task.actual_hours or 0,
        created_at=db_task.created_at.isoformat(),
        updated_at=db_task.updated_at.isoformat() if db_task.updated_at else None
    )

# Add to the update_task endpoint in tasks.py
@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_task = db.query(Task).filter(Task.id == task_id, Task.assignee_id == current_user.id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Store old status for comparison
    old_status = db_task.status
    old_updated_at = db_task.updated_at
    
    # Update task fields
    db_task.title = task.title
    db_task.description = task.description
    db_task.status = task.status
    db_task.priority = task.priority
    db_task.labels = task.labels
    db_task.due_date = datetime.fromisoformat(task.due_date) if task.due_date else None
    db_task.estimated_hours = task.estimated_hours
    db_task.updated_at = datetime.utcnow()
    
    # If task is being marked as completed, calculate actual hours
    if task.status == "completed" and old_status != "completed":
        # Calculate hours between creation and completion
        if db_task.created_at and db_task.updated_at:
            time_diff = db_task.updated_at - db_task.created_at
            db_task.actual_hours = round(time_diff.total_seconds() / 3600, 1)
        else:
            db_task.actual_hours = task.estimated_hours or 1.0  # Default 1 hour if no time data
        
        # Create activity log for completion
        activity = ActivityLog(
            user_id=current_user.id,
            action="completed",
            entity_type="task",
            entity_id=db_task.id,
            details={
                "title": task.title,
                "status": task.status,
                "actual_hours": db_task.actual_hours
            }
        )
        db.add(activity)
    elif old_status != task.status:
        # Create activity log for status change
        activity = ActivityLog(
            user_id=current_user.id,
            action="updated_status",
            entity_type="task",
            entity_id=db_task.id,
            details={"title": task.title, "old_status": old_status, "new_status": task.status}
        )
        db.add(activity)
    
    db.commit()
    db.refresh(db_task)

    return TaskResponse(
        id=db_task.id,
        title=db_task.title,
        description=db_task.description or "",
        status=db_task.status,
        priority=db_task.priority,
        labels=db_task.labels or [],
        due_date=db_task.due_date.isoformat() if db_task.due_date else None,
        estimated_hours=db_task.estimated_hours or 0,
        actual_hours=db_task.actual_hours or 0,
        created_at=db_task.created_at.isoformat(),
        updated_at=db_task.updated_at.isoformat() if db_task.updated_at else None
    )

@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_task = db.query(Task).filter(Task.id == task_id, Task.assignee_id == current_user.id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(db_task)
    db.commit()
    
    return {"message": "Task deleted successfully"}