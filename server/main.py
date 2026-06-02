from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routes import auth_router, tasks_router, projects_router, analytics_router, notes_router, activities_router
import os
from dotenv import load_dotenv

load_dotenv()


app = FastAPI(
    title="Developer Dashboard API", 
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

# Get allowed origins from environment variable
ALLOWED_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

# CORS configuration for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Include routers
app.include_router(auth_router)
app.include_router(tasks_router)
app.include_router(projects_router)
app.include_router(analytics_router)
app.include_router(notes_router)
app.include_router(activities_router)

@app.get("/")
def root():
    return {
        "message": "Developer Dashboard API is running", 
        "status": "healthy",
        "environment": os.getenv("ENVIRONMENT", "development")
    }

@app.get("/health")
def health():
    return {"status": "ok", "database": "connected"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=port, 
        reload=os.getenv("ENVIRONMENT") == "development"
    )