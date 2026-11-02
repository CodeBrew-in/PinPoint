"""Optional demo data: two accounts and a few Patiala maps, so a fresh install is not empty.

    docker compose exec backend python -m app.seed

Safe to run twice: it does nothing if the demo accounts already exist.
Place names and coordinates are real Patiala locations from OpenStreetMap; the descriptions are plain on purpose.
Both accounts use the password below. marcus@example.com is a moderator when MODERATOR_EMAILS lists him
(docker-compose.yml does by default).
"""
from datetime import datetime

from app.core.security import hash_password
from app.db.database import SessionLocal
from app.models.location import Location
from app.models.map import Map, MapShare
from app.models.user import User

DEMO_PASSWORD = "demo-password-1"

# (title, description, category, visibility, owner, shared_with, places)
# place = (name, lat, lng, tags, added_by, description, verified)
MAPS = [
    (
        "Patiala heritage", "Forts and palaces in and around Patiala.", "Heritage", "public", "marcus", [],
        [
            ("Qila Mubarak", 30.3241, 76.4031, ["heritage"], "marcus", "Fort in the old city.", True),
            ("Moti Bagh Palace", 30.3055, 76.3941, ["heritage"], "ananya", "Palace in the Moti Bagh area.", True),
            ("Bahadurgarh Fort", 30.3642, 76.4712, ["heritage"], "ananya", "Fort on the Patiala road, east of the city.", False),
        ],
    ),
    (
        "Temples and gurdwaras of Patiala", "Places of worship around the city.", "Faith", "public", "ananya", [],
        [
            ("Shri Kali Devi Mandir", 30.3367, 76.3942, ["place of worship"], "ananya", "Temple on Mall Road.", True),
            ("Gurudwara Dukh Niwarn Sahib", 30.3473, 76.3964, ["place of worship"], "marcus", "Gurdwara in the north of the city.", False),
            ("Gurudwara Shri Moti Bagh Sahib", 30.3108, 76.3894, ["place of worship"], "ananya", "Gurdwara in the Moti Bagh area.", False),
        ],
    ),
    (
        "Campuses of Patiala", "Universities and institutes.", "Campus", "public", "marcus", [],
        [
            ("Thapar Institute of Engineering and Technology", 30.3545, 76.3658, ["campus"], "marcus", "Engineering university campus.", True),
            ("Punjabi University", 30.3582, 76.4542, ["campus"], "ananya", "University campus on Rajpura Road.", False),
        ],
    ),
    (
        "Weekend spots", "My own list. Not for sharing widely.", "Nature", "private", "marcus", ["ananya@example.com"],
        [
            ("Bir Motibagh Wildlife Sanctuary", 30.2912, 76.3996, ["nature", "quiet"], "marcus", "Wildlife sanctuary south of the city.", False),
            ("Moti Bagh Palace", 30.3055, 76.3941, ["heritage"], "marcus", "Walk around it in the evening.", False),
        ],
    ),
    (
        "Getting around", "Stops I use between campus and the station.", "Other", "private", "ananya", ["marcus@example.com"],
        [
            ("Thapar Institute main area", 30.3545, 76.3658, ["campus"], "ananya", "Where I start from.", False),
            ("Patiala railway station", 30.3422, 76.4023, ["transit"], "ananya", "Where I end up.", False),
        ],
    ),
]


def seed() -> str:
    db = SessionLocal()
    try:
        if db.query(User).filter(User.email == "marcus@example.com").first():
            return "Demo data is already there. Nothing changed."

        now = datetime.utcnow()
        users = {}
        for username, name in (("marcus", "Marcus Vance"), ("ananya", "Ananya Rao")):
            user = User(
                email=f"{username}@example.com",
                password_hash=hash_password(DEMO_PASSWORD),
                username=username,
                name=name,
                bio="Demo account.",
            )
            db.add(user)
            users[username] = user
        db.flush()

        for title, description, category, visibility, owner, shared_with, places in MAPS:
            map_ = Map(
                owner_id=users[owner].id, title=title, description=description,
                category=category, visibility=visibility, created_at=now, updated_at=now,
            )
            map_.shares = [MapShare(email=email) for email in shared_with]
            db.add(map_)
            db.flush()
            for name, lat, lng, tags, added_by, text, verified in places:
                db.add(Location(
                    map_id=map_.id, owner_id=users[added_by].id, name=name, description=text,
                    lat=lat, lng=lng, visibility=visibility, tags=tags, created_at=now, updated_at=now,
                    verified_at=now if verified else None,
                    verified_by_id=users[added_by].id if verified else None,
                ))

        db.commit()
        return f"Added 2 demo accounts (password: {DEMO_PASSWORD}) and {len(MAPS)} maps."
    finally:
        db.close()


if __name__ == "__main__":
    print(seed())
