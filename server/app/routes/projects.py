from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.database import get_db
from app.models import User, Project, ActivityLog
from app.auth import get_current_active_user

router = APIRouter(prefix="/api/projects", tags=["projects"])

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    status: Optional[str] = "planning"
    deadline: Optional[str] = None
    tech_stack: Optional[List[str]] = []

class ProjectResponse(BaseModel):
    id: int
    name: str
    description: str
    status: str
    progress: float
    deadline: Optional[str]
    tech_stack: List[str]
    created_at: str

@router.get("/", response_model=List[ProjectResponse])
def get_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    projects = db.query(Project).filter(Project.created_by == current_user.id).all()
    
    return [
        ProjectResponse(
            id=p.id,
            name=p.name,
            description=p.description or "",
            status=p.status,
            progress=p.progress or 0,
            deadline=p.deadline.isoformat() if p.deadline else None,
            tech_stack=p.tech_stack or [],
            created_at=p.created_at.isoformat()
        )
        for p in projects
    ]

@router.post("/", response_model=ProjectResponse)
def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Debug logging
    print(f"Creating project with status: {project.status}")
    
    db_project = Project(
        name=project.name,
        description=project.description,
        status=project.status,  # Use the status from the request
        deadline=datetime.fromisoformat(project.deadline) if project.deadline else None,
        tech_stack=project.tech_stack,
        created_by=current_user.id,
        progress=0  # Initialize progress to 0
    )
    
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    
    # Create activity log
    activity = ActivityLog(
        user_id=current_user.id,
        action="created",
        entity_type="project",
        entity_id=db_project.id,
        details={"title": project.name, "status": project.status}
    )
    db.add(activity)
    db.commit()
    
    print(f"Project created with status: {db_project.status}")
    
    return ProjectResponse(
        id=db_project.id,
        name=db_project.name,
        description=db_project.description or "",
        status=db_project.status,
        progress=db_project.progress or 0,
        deadline=db_project.deadline.isoformat() if db_project.deadline else None,
        tech_stack=db_project.tech_stack or [],
        created_at=db_project.created_at.isoformat()
    )

@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update an existing project"""
    db_project = db.query(Project).filter(
        Project.id == project_id, 
        Project.created_by == current_user.id
    ).first()
    
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Store old status for activity log
    old_status = db_project.status
    
    # Update all fields
    db_project.name = project.name
    db_project.description = project.description
    db_project.status = project.status  # IMPORTANT: Update the status
    db_project.deadline = datetime.fromisoformat(project.deadline) if project.deadline else None
    db_project.tech_stack = project.tech_stack
    
    db.commit()
    db.refresh(db_project)
    
    # Create activity log for status change
    if old_status != project.status:
        activity = ActivityLog(
            user_id=current_user.id,
            action="updated",
            entity_type="project",
            entity_id=db_project.id,
            details={
                "title": project.name, 
                "old_status": old_status,
                "new_status": project.status
            }
        )
        db.add(activity)
        db.commit()
    
    print(f"Project updated - ID: {project_id}, New Status: {db_project.status}")
    
    return ProjectResponse(
        id=db_project.id,
        name=db_project.name,
        description=db_project.description or "",
        status=db_project.status,
        progress=db_project.progress or 0,
        deadline=db_project.deadline.isoformat() if db_project.deadline else None,
        tech_stack=db_project.tech_stack or [],
        created_at=db_project.created_at.isoformat()
    )

@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a project"""
    db_project = db.query(Project).filter(
        Project.id == project_id, 
        Project.created_by == current_user.id
    ).first()
    
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Create activity log before deletion
    activity = ActivityLog(
        user_id=current_user.id,
        action="deleted",
        entity_type="project",
        entity_id=db_project.id,
        details={"title": db_project.name}
    )
    db.add(activity)
    
    db.delete(db_project)
    db.commit()
    
    return {"message": "Project deleted successfully"}