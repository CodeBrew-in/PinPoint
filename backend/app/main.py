import logging
import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.health import router as health_router
from app.api.auth import router as auth_router
from app.api.locations import router as locations_router
from app.api.maps import router as maps_router
from app.api.reports import router as reports_router
from app.services.media import MAX_REQUEST_BYTES, media_root, photos_dir

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"), format="%(asctime)s %(levelname)s %(name)s %(message)s")

# "production" turns off the interactive API docs; anything else is development
APP_ENV = os.getenv("APP_ENV", "development").strip().lower()
IS_PRODUCTION = APP_ENV == "production"

app = FastAPI(
    title="PinPoint API",
    docs_url=None if IS_PRODUCTION else "/docs",
    redoc_url=None if IS_PRODUCTION else "/redoc",
    openapi_url=None if IS_PRODUCTION else "/openapi.json",
)

# Comma-separated list of frontend URLs allowed to call the API
FRONTEND_ORIGINS = [o.strip() for o in os.getenv("FRONTEND_ORIGINS", "http://localhost:5173").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
}


@app.middleware("http")
async def limit_body_and_add_headers(request: Request, call_next):
    # Refuse an oversized body from its declared length, before any of it is read
    length = request.headers.get("content-length")
    if length is not None:
        try:
            too_big = int(length) > MAX_REQUEST_BYTES
        except ValueError:
            return JSONResponse({"detail": "Invalid Content-Length"}, status_code=400)
        if too_big:
            return JSONResponse({"detail": "Request body is too large"}, status_code=413)

    response = await call_next(request)
    for name, value in SECURITY_HEADERS.items():
        response.headers.setdefault(name, value)
    if request.url.path.startswith("/api/"):
        response.headers.setdefault("Cache-Control", "no-store")
    return response


API_PREFIX = "/api/v1"

app.include_router(health_router, prefix=API_PREFIX)
app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(maps_router, prefix=API_PREFIX)
app.include_router(locations_router, prefix=API_PREFIX)
app.include_router(reports_router, prefix=API_PREFIX)

# Uploaded photos are served from /media/photos/<random name>.<ext> (the Photo url in docs/api-contract.md)
photos_dir()  # makes sure the folder exists
app.mount("/media", StaticFiles(directory=media_root()), name="media")
