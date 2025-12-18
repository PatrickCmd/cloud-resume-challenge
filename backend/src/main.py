"""
FastAPI application entry point for Portfolio API.

This module initializes the FastAPI application with middleware,
routers, and error handlers for deployment on AWS Lambda via Mangum.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

from src.config import settings
from src.utils.errors import register_error_handlers

# Import routers
from src.api import auth

# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    description="Portfolio backend API with authentication and content management",
    version=settings.version,
    docs_url="/docs" if settings.environment == "development" else None,
    redoc_url="/redoc" if settings.environment == "development" else None,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register error handlers
register_error_handlers(app)

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "environment": settings.environment,
        "version": settings.version,
    }

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Portfolio API",
        "version": settings.version,
        "docs": "/docs" if settings.environment == "development" else "disabled",
    }

# Register API routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# TODO: Register remaining routers
# from src.api import blog, projects, certifications, visitors, analytics
# app.include_router(blog.router, prefix="/blog", tags=["Blog"])
# app.include_router(projects.router, prefix="/projects", tags=["Projects"])
# app.include_router(certifications.router, prefix="/certifications", tags=["Certifications"])
# app.include_router(visitors.router, prefix="/visitors", tags=["Visitors"])
# app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])

# Lambda handler
handler = Mangum(app, lifespan="off")
