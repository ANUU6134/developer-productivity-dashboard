from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta
from app.database import get_db
from app.models import User, Task, Project, ActivityLog
from app.auth import get_current_active_user

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/dashboard")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get real dashboard statistics from database"""
    
    # Get task statistics - REAL DATA
    total_tasks = db.query(Task).filter(Task.assignee_id == current_user.id).count()
    completed_tasks = db.query(Task).filter(
        Task.assignee_id == current_user.id,
        Task.status == "completed"
    ).count()
    
    # Calculate completion rate
    completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
    
    # Get coding hours from actual completed tasks
    total_coding_hours = db.query(func.sum(Task.actual_hours)).filter(
        Task.assignee_id == current_user.id,
        Task.status == "completed"
    ).scalar() or 0
    
    # Get active projects - REAL DATA
    active_projects = db.query(Project).filter(
        Project.created_by == current_user.id,
        Project.status == "active"
    ).count()
    
    # Get completed projects - REAL DATA
    completed_projects = db.query(Project).filter(
        Project.created_by == current_user.id,
        Project.status == "completed"
    ).count()
    
    # Calculate productivity score based on real data
    if total_tasks > 0:
        productivity_score = min(round((completion_rate * 0.6) + (min(total_coding_hours / 40, 1) * 40)), 100)
    else:
        productivity_score = 0
    
    # Calculate weekly streak based on actual activity
    weekly_streak = 0
    current_date = datetime.utcnow().date()
    
    for i in range(8):  # Check last 8 weeks
        week_start = current_date - timedelta(weeks=i)
        week_end = week_start + timedelta(days=7)
        
        start_datetime = datetime.combine(week_start, datetime.min.time())
        end_datetime = datetime.combine(week_end, datetime.max.time())
        
        # Check if user had any activity this week
        activity_count = db.query(ActivityLog).filter(
            ActivityLog.user_id == current_user.id,
            ActivityLog.created_at >= start_datetime,
            ActivityLog.created_at <= end_datetime
        ).count()
        
        task_activity = db.query(Task).filter(
            Task.assignee_id == current_user.id,
            Task.created_at >= start_datetime,
            Task.created_at <= end_datetime
        ).count()
        
        if activity_count > 0 or task_activity > 0:
            weekly_streak += 1
        else:
            break
    
    return {
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "completion_rate": round(completion_rate, 1),
        "total_coding_hours": round(total_coding_hours, 1),
        "active_projects": active_projects,
        "completed_projects": completed_projects,
        "productivity_score": productivity_score,
        "weekly_streak": weekly_streak
    }

@router.get("/tasks-completion")
def get_tasks_completion(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    days: int = 7
):
    """Get real tasks created and completed by day"""
    
    labels = []
    completed_data = []
    created_data = []
    
    for i in range(days - 1, -1, -1):
        date = datetime.utcnow().date() - timedelta(days=i)
        start_date = datetime.combine(date, datetime.min.time())
        end_date = datetime.combine(date, datetime.max.time())
        labels.append(date.strftime("%a"))
        
        # Count tasks created on this day - REAL DATA
        created = db.query(Task).filter(
            Task.assignee_id == current_user.id,
            Task.created_at >= start_date,
            Task.created_at <= end_date
        ).count()
        created_data.append(created)
        
        # Count tasks completed on this day - REAL DATA
        completed = db.query(Task).filter(
            Task.assignee_id == current_user.id,
            Task.status == "completed",
            Task.updated_at >= start_date,
            Task.updated_at <= end_date
        ).count()
        completed_data.append(completed)
    
    return {
        "labels": labels,
        "datasets": [
            {"label": "Completed", "data": completed_data},
            {"label": "Created", "data": created_data}
        ]
    }

@router.get("/coding-activity")
def get_coding_activity(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    days: int = 7
):
    """Get real coding hours by day"""
    
    labels = []
    hours_data = []
    
    for i in range(days - 1, -1, -1):
        date = datetime.utcnow().date() - timedelta(days=i)
        start_date = datetime.combine(date, datetime.min.time())
        end_date = datetime.combine(date, datetime.max.time())
        labels.append(date.strftime("%a"))
        
        # Sum actual hours from tasks completed on this day - REAL DATA
        hours = db.query(func.sum(Task.actual_hours)).filter(
            Task.assignee_id == current_user.id,
            Task.status == "completed",
            Task.updated_at >= start_date,
            Task.updated_at <= end_date
        ).scalar() or 0
        
        hours_data.append(round(hours, 1))
    
    return {
        "labels": labels,
        "datasets": [
            {"label": "Coding Hours", "data": hours_data}
        ]
    }

# IMPORTANT: This is the endpoint your dashboard is looking for
@router.get("/tasks-by-day")
def get_tasks_by_day(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    days: int = 7
):
    """Get tasks created and completed by day (for dashboard)"""
    
    labels = []
    completed_data = []
    created_data = []
    
    for i in range(days - 1, -1, -1):
        date = datetime.utcnow().date() - timedelta(days=i)
        start_date = datetime.combine(date, datetime.min.time())
        end_date = datetime.combine(date, datetime.max.time())
        labels.append(date.strftime("%a"))
        
        # Count tasks created on this day
        created = db.query(Task).filter(
            Task.assignee_id == current_user.id,
            Task.created_at >= start_date,
            Task.created_at <= end_date
        ).count()
        created_data.append(created)
        
        # Count tasks completed on this day
        completed = db.query(Task).filter(
            Task.assignee_id == current_user.id,
            Task.status == "completed",
            Task.updated_at >= start_date,
            Task.updated_at <= end_date
        ).count()
        completed_data.append(completed)
    
    return {
        "labels": labels,
        "completed": completed_data,
        "created": created_data
    }

# IMPORTANT: This is the endpoint your dashboard is looking for
@router.get("/coding-hours")
def get_coding_hours(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    days: int = 7
):
    """Get coding hours by day (for dashboard)"""
    
    labels = []
    hours_data = []
    
    for i in range(days - 1, -1, -1):
        date = datetime.utcnow().date() - timedelta(days=i)
        start_date = datetime.combine(date, datetime.min.time())
        end_date = datetime.combine(date, datetime.max.time())
        labels.append(date.strftime("%a"))
        
        # Calculate coding hours based on actual_hours from tasks completed on this day
        hours = db.query(func.sum(Task.actual_hours)).filter(
            Task.assignee_id == current_user.id,
            Task.status == "completed",
            Task.updated_at >= start_date,
            Task.updated_at <= end_date
        ).scalar() or 0
        
        # If no actual_hours, calculate based on time difference between creation and completion
        if hours == 0:
            # Get completed tasks on this day without actual_hours
            tasks = db.query(Task).filter(
                Task.assignee_id == current_user.id,
                Task.status == "completed",
                Task.updated_at >= start_date,
                Task.updated_at <= end_date
            ).all()
            
            for task in tasks:
                if task.created_at and task.updated_at:
                    # Calculate hours between creation and completion
                    time_diff = task.updated_at - task.created_at
                    hours += time_diff.total_seconds() / 3600  # Convert to hours
            
            hours = round(hours, 1)
        
        hours_data.append(hours)
    
    return {
        "labels": labels,
        "hours": hours_data
    }

@router.get("/recent-activities")
def get_recent_activities(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    limit: int = 10
):
    """Get real recent user activities"""
    
    # Get recent activities from database
    activities = db.query(ActivityLog).filter(
        ActivityLog.user_id == current_user.id
    ).order_by(ActivityLog.created_at.desc()).limit(limit).all()
    
    result = []
    
    # Add activity logs
    for activity in activities:
        # Determine icon and color based on action type
        if activity.entity_type == "task":
            if activity.action == "created":
                bgColor = "bg-blue-100 dark:bg-blue-900/20"
                color = "text-blue-600"
            elif activity.action == "completed":
                bgColor = "bg-green-100 dark:bg-green-900/20"
                color = "text-green-600"
            else:
                bgColor = "bg-purple-100 dark:bg-purple-900/20"
                color = "text-purple-600"
        elif activity.entity_type == "project":
            bgColor = "bg-orange-100 dark:bg-orange-900/20"
            color = "text-orange-600"
        else:
            bgColor = "bg-gray-100 dark:bg-gray-700"
            color = "text-gray-600"
        
        result.append({
            "id": activity.id,
            "description": f"{activity.action} {activity.entity_type}: {activity.details.get('title', 'Untitled')}",
            "created_at": activity.created_at.isoformat(),
            "bgColor": bgColor,
            "color": color
        })
    
    # If no activities, return empty array
    return result

@router.get("/user-stats")
def get_user_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get comprehensive real user statistics"""

    # -------------------------
    # TASK COUNTS (FAST QUERIES)
    # -------------------------
    total_tasks = db.query(Task).filter(
        Task.assignee_id == current_user.id
    ).count()

    completed_tasks_count = db.query(Task).filter(
        Task.assignee_id == current_user.id,
        Task.status == "completed"
    ).count()

    todo_tasks = db.query(Task).filter(
        Task.assignee_id == current_user.id,
        Task.status == "todo"
    ).count()

    in_progress_tasks = db.query(Task).filter(
        Task.assignee_id == current_user.id,
        Task.status == "in_progress"
    ).count()

    review_tasks = db.query(Task).filter(
        Task.assignee_id == current_user.id,
        Task.status == "review"
    ).count()

    # -------------------------
    # PRIORITY COUNTS
    # -------------------------
    low_priority = db.query(Task).filter(
        Task.assignee_id == current_user.id,
        Task.priority == "low"
    ).count()

    medium_priority = db.query(Task).filter(
        Task.assignee_id == current_user.id,
        Task.priority == "medium"
    ).count()

    high_priority = db.query(Task).filter(
        Task.assignee_id == current_user.id,
        Task.priority == "high"
    ).count()

    urgent_priority = db.query(Task).filter(
        Task.assignee_id == current_user.id,
        Task.priority == "urgent"
    ).count()

    # -------------------------
    # PROJECTS
    # -------------------------
    total_projects = db.query(Project).filter(
        Project.created_by == current_user.id
    ).count()

    active_projects = db.query(Project).filter(
        Project.created_by == current_user.id,
        Project.status == "active"
    ).count()

    completed_projects = db.query(Project).filter(
        Project.created_by == current_user.id,
        Project.status == "completed"
    ).count()

    planning_projects = db.query(Project).filter(
        Project.created_by == current_user.id,
        Project.status == "planning"
    ).count()

    avg_progress = db.query(func.avg(Project.progress)).filter(
        Project.created_by == current_user.id
    ).scalar() or 0

    # -------------------------
    # RECENT ACTIVITY (FAST)
    # -------------------------
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)

    recent_activity = db.query(ActivityLog).filter(
        ActivityLog.user_id == current_user.id,
        ActivityLog.created_at >= thirty_days_ago
    ).count()

    # -------------------------
    # PRODUCTIVITY SCORE
    # -------------------------
    completion_rate = (
        (completed_tasks_count / total_tasks * 100)
        if total_tasks > 0 else 0
    )

    productivity_score = min(
        round(completion_rate * 0.6 + (recent_activity / 30 * 40)),
        100
    )

    # -------------------------
    # CODING HOURS (ONE QUERY LIST)
    # -------------------------
    completed_task_list = db.query(Task).filter(
        Task.assignee_id == current_user.id,
        Task.status == "completed"
    ).all()

    total_coding_hours = 0

    for task in completed_task_list:
        if task.actual_hours and task.actual_hours > 0:
            total_coding_hours += task.actual_hours
        elif task.created_at and task.updated_at:
            diff = task.updated_at - task.created_at
            total_coding_hours += diff.total_seconds() / 3600

    # -------------------------
    # RESPONSE
    # -------------------------
    return {
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks_count,
        "todo_tasks": todo_tasks,
        "in_progress_tasks": in_progress_tasks,
        "review_tasks": review_tasks,

        "low_priority": low_priority,
        "medium_priority": medium_priority,
        "high_priority": high_priority,
        "urgent_priority": urgent_priority,

        "total_projects": total_projects,
        "active_projects": active_projects,
        "completed_projects": completed_projects,
        "planning_projects": planning_projects,

        "avg_project_progress": round(avg_progress, 1),

        "recent_activity": recent_activity,
        "completion_rate": round(completion_rate, 1),
        "productivity_score": productivity_score,

        "total_coding_hours": round(total_coding_hours, 1)
    }