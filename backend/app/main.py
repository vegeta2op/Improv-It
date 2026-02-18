from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
from datetime import datetime

from app.config import settings
from app.database import init_db
from app.services.cache import close_redis

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Improv-It API...")
    try:
        await init_db()
        logger.info("Database initialized")
    except Exception as e:
        logger.warning(f"Database initialization skipped: {e}")

    yield

    # Shutdown
    logger.info("Shutting down...")
    await close_redis()


app = FastAPI(
    title=settings.APP_NAME,
    description="Student Performance Prediction System API",
    version="0.0.1",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:80",
        "http://localhost",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    # Must explicitly list headers when allow_credentials=True;
    # wildcard "*" is ignored by browsers in credentialed requests.
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
)


# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )


# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "0.0.1",
    }


# API Routes
from app.routers import auth, students, predictions, analytics, dashboard

app.include_router(
    auth.router, prefix=f"{settings.API_V1_PREFIX}/auth", tags=["Authentication"]
)
app.include_router(
    students.router, prefix=f"{settings.API_V1_PREFIX}/students", tags=["Students"]
)
app.include_router(
    predictions.router,
    prefix=f"{settings.API_V1_PREFIX}/predictions",
    tags=["Predictions"],
)
app.include_router(
    analytics.router, prefix=f"{settings.API_V1_PREFIX}/analytics", tags=["Analytics"]
)
app.include_router(
    dashboard.router, prefix=f"{settings.API_V1_PREFIX}/dashboard", tags=["Dashboard"]
)


@app.get("/")
async def root():
    return {"message": "Welcome to Improv-It API", "docs": "/docs", "version": "0.0.1"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8081, reload=True)
