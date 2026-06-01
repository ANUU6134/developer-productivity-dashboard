from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.database import get_db
from app.models import User, Note
from app.auth import get_current_active_user

router = APIRouter(prefix="/api/notes", tags=["notes"])

class NoteCreate(BaseModel):
    title: str
    content: Optional[str] = ""
    category: Optional[str] = "general"
    is_favorite: Optional[bool] = False

class NoteResponse(BaseModel):
    id: int
    title: str
    content: str
    category: str
    is_favorite: bool
    created_at: str
    updated_at: Optional[str]

@router.get("/", response_model=List[NoteResponse])
def get_notes(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Note).filter(Note.user_id == current_user.id)
    
    if category and category != "all":
        query = query.filter(Note.category == category)
    
    notes = query.order_by(Note.updated_at.desc()).all()
    
    return [
        NoteResponse(
            id=n.id,
            title=n.title,
            content=n.content or "",
            category=n.category,
            is_favorite=n.is_favorite,
            created_at=n.created_at.isoformat(),
            updated_at=n.updated_at.isoformat() if n.updated_at else None
        )
        for n in notes
    ]

@router.post("/", response_model=NoteResponse)
def create_note(
    note: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_note = Note(
        title=note.title,
        content=note.content,
        category=note.category,
        is_favorite=note.is_favorite,
        user_id=current_user.id
    )
    
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    
    return NoteResponse(
        id=db_note.id,
        title=db_note.title,
        content=db_note.content or "",
        category=db_note.category,
        is_favorite=db_note.is_favorite,
        created_at=db_note.created_at.isoformat(),
        updated_at=db_note.updated_at.isoformat() if db_note.updated_at else None
    )

@router.delete("/{note_id}")
def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    db.delete(note)
    db.commit()
    
    return {"message": "Note deleted successfully"}



    # Add this to notes.py after the create_note endpoint

@router.put("/{note_id}", response_model=NoteResponse)
def update_note(
    note_id: int,
    note: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update an existing note"""
    db_note = db.query(Note).filter(
        Note.id == note_id, 
        Note.user_id == current_user.id
    ).first()
    
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Update fields
    db_note.title = note.title
    db_note.content = note.content
    db_note.category = note.category
    db_note.is_favorite = note.is_favorite
    db_note.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_note)
    
    return NoteResponse(
        id=db_note.id,
        title=db_note.title,
        content=db_note.content or "",
        category=db_note.category,
        is_favorite=db_note.is_favorite,
        created_at=db_note.created_at.isoformat(),
        updated_at=db_note.updated_at.isoformat() if db_note.updated_at else None
    )