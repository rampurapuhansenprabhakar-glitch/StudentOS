from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import engine, Base
from app.core.logging import logger
from app.ml.artifact_loader import model_loader

# Import all API routes
from app.api.routes import (
    auth,
    profile,
    academic,
    attendance,
    assignments,
    study,
    skills,
    coding,
    digital_twin,
    predictions,
    simulations,
    recommendations,
    study_plans,
    analytics,
    assistant
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing StudentOS database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database initialized successfully.")
    
    # Verify and load ML artifacts
    model_loader.load_artifacts()
    meta = model_loader.get_metadata()
    logger.info(f"ML Models Status: {meta['models_loaded']}")
    yield
    logger.info("Shutting down StudentOS backend.")

app = FastAPI(
    title="StudentOS API",
    description="Backend API for AI-Powered Digital Twin for Personalized Student Success",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please try again."}
    )

# Health Check Endpoints
@app.get("/health", tags=["Health"])
@app.get(f"{settings.API_V1_STR}/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "database": "connected",
        "ml_engine": "ready",
        "version": "1.0.0"
    }

# Register all Routers under API_V1_STR
api_v1 = settings.API_V1_STR
app.include_router(auth.router, prefix=api_v1)
app.include_router(profile.router, prefix=api_v1)
app.include_router(academic.router, prefix=api_v1)
app.include_router(attendance.router, prefix=api_v1)
app.include_router(assignments.router, prefix=api_v1)
app.include_router(study.router, prefix=api_v1)
app.include_router(skills.router, prefix=api_v1)
app.include_router(coding.router, prefix=api_v1)
app.include_router(digital_twin.router, prefix=api_v1)
app.include_router(predictions.router, prefix=api_v1)
app.include_router(simulations.router, prefix=api_v1)
app.include_router(recommendations.router, prefix=api_v1)
app.include_router(study_plans.router, prefix=api_v1)
app.include_router(analytics.router, prefix=api_v1)
app.include_router(assistant.router, prefix=api_v1)
