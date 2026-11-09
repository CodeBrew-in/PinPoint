# Importing every model here registers all tables on Base.metadata
# (Alembic and the tests rely on this).
from app.models.location import Location, LocationNote, Photo, Report  # noqa: F401
from app.models.map import Map, MapShare  # noqa: F401
from app.models.user import User  # noqa: F401
