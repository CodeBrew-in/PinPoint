import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.health import router as health_router
from app.api.auth import router as auth_router
from app.api.locations import router as locations_router
from app.api.maps import router as maps_router
from app.api.reports import router as reports_router
from app.services.media import media_root, photos_dir

app = FastAPI(title="PinPoint API")

# Comma-separated list of frontend URLs allowed to call the API
FRONTEND_ORIGINS = os.getenv("FRONTEND_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api/v1"

app.include_router(health_router, prefix=API_PREFIX)
app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(maps_router, prefix=API_PREFIX)
app.include_router(locations_router, prefix=API_PREFIX)
app.include_router(reports_router, prefix=API_PREFIX)

# Uploaded photos are served from /media/photos/<id>.<ext> (the Photo url in docs/api-contract.md)
photos_dir()  # makes sure the folder exists
app.mount("/media", StaticFiles(directory=media_root()), name="media")
