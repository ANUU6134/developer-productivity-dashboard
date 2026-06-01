from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.auth import get_current_active_user

router = APIRouter(prefix="/api/activities", tags=["activities"])

@router.get("/recent")
def get_recent_activities(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Sample activities
    activities = [
        {
            "id": 1,
            "description": "Completed task 'Fix login bug'",
            "created_at": "2024-01-15T10:30:00",
            "bgColor": "bg-green-100 dark:bg-green-900/20",
            "color": "text-green-600"
        },
        {
            "id": 2,
            "description": "Created new project 'Dashboard Redesign'",
            "created_at": "2024-01-14T15:45:00",
            "bgColor": "bg-blue-100 dark:bg-blue-900/20",
            "color": "text-blue-600"
        },
        {
            "id": 3,
            "description": "Updated task 'Write documentation'",
            "created_at": "2024-01-14T09:20:00",
            "bgColor": "bg-purple-100 dark:bg-purple-900/20",
            "color": "text-purple-600"
        }
    ]
    
    return activities