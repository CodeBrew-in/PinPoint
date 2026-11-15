"""Signed photo links, photos stored in the database, the signup switch, and the engine settings."""
import re
import time

import pytest

from app.services.media import link_is_valid, signed_photo_url
from images import PNG, make_image

API = "/api/v1"


def new_place(client, headers, visibility="public"):
    return client.post(
        f"{API}/locations", json={"name": "Qila Mubarak", "lat": 30.3, "lng": 76.4, "visibility": visibility}, headers=headers
    ).json()["id"]


def upload(client, headers, place_id, data=PNG, content_type="image/png"):
    return client.post(f"{API}/locations/{place_id}/photos", files={"file": ("p", data, content_type)}, headers=headers)


# ---------- signed links ----------


def test_a_fresh_link_is_valid_and_a_wrong_one_is_not():
    url = signed_photo_url(7)
    exp = int(re.search(r"exp=(\d+)", url).group(1))
    sig = re.search(r"sig=([0-9a-f]+)", url).group(1)

    assert link_is_valid(7, exp, sig)
    assert not link_is_valid(8, exp, sig)  # a signature belongs to one photo
    assert not link_is_valid(7, exp + 1, sig)  # and to one expiry time
    assert not link_is_valid(7, exp, sig[:-1] + ("0" if sig[-1] != "0" else "1"))


def test_a_link_expires():
    url = signed_photo_url(7)
    exp = int(re.search(r"exp=(\d+)", url).group(1))
    sig = re.search(r"sig=([0-9a-f]+)", url).group(1)

    assert not link_is_valid(7, exp, sig, now=exp + 1)


def test_links_are_stable_inside_a_time_window():
    now = time.time()

    assert signed_photo_url(7, now=now) == signed_photo_url(7, now=now + 60)  # so the browser can cache the picture


def test_the_photo_route_refuses_bad_links(client, make_user):
    owner = make_user()
    photo = upload(client, owner, new_place(client, owner)).json()
    bare = photo["url"].split("?")[0]

    assert client.get(bare).status_code == 422  # no signature at all
    assert client.get(f"{bare}?exp=9999999999&sig=deadbeef").status_code == 403  # forged
    assert client.get(photo["url"].replace("sig=", "sig=0")).status_code == 403  # tampered
    assert client.get(photo["url"]).status_code == 200


def test_the_photo_of_a_private_place_is_only_listed_for_people_who_can_see_it(client, make_user):
    owner, stranger = make_user(), make_user()
    map_id = client.post(f"{API}/maps", json={"title": "Secret", "visibility": "private"}, headers=owner).json()["id"]
    place_id = client.post(f"{API}/locations", json={"name": "Hidden", "lat": 30.3, "lng": 76.4, "map_id": map_id}, headers=owner).json()["id"]
    upload(client, owner, place_id)

    assert client.get(f"{API}/locations/{place_id}", headers=stranger).status_code == 404  # no place, so no photo link
    assert client.get(f"{API}/locations/{place_id}", headers=owner).json()["photos"][0]["url"].startswith("/api/v1/media/")


def test_a_deleted_photo_is_gone_even_with_its_old_link(client, make_user):
    owner = make_user()
    place_id = new_place(client, owner)
    photo = upload(client, owner, place_id).json()

    assert client.delete(f"{API}/locations/{place_id}/photos/{photo['id']}", headers=owner).status_code == 204
    assert client.get(photo["url"]).status_code == 404


def test_the_old_public_media_folder_is_gone(client, make_user):
    owner = make_user()
    upload(client, owner, new_place(client, owner))

    assert client.get("/media/photos/1.png").status_code == 404


# ---------- photos stored in the database ----------


@pytest.fixture
def db_storage(monkeypatch):
    monkeypatch.setenv("MEDIA_BACKEND", "db")


def test_database_storage_keeps_the_picture_in_the_row(client, make_user, db_storage):
    from app.db.database import get_db
    from app.main import app
    from app.models.location import Photo

    owner = make_user()
    photo = upload(client, owner, new_place(client, owner)).json()

    row = app.dependency_overrides[get_db]().get(Photo, photo["id"])
    assert row.filename is None and row.size_bytes > 0 and row.content_type == "image/png"
    response = client.get(photo["url"])
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/png"
    assert response.content.startswith(b"\x89PNG")
    assert response.headers["x-content-type-options"] == "nosniff"


def test_big_photos_are_shrunk_before_they_are_stored(client, make_user, db_storage):
    from io import BytesIO

    from PIL import Image

    owner = make_user()
    big = make_image("JPEG", size=(3200, 2400))
    photo = upload(client, owner, new_place(client, owner), big, "image/jpeg").json()
    stored = Image.open(BytesIO(client.get(photo["url"]).content))

    assert max(stored.size) == 1600


def test_database_photos_are_removed_with_their_place(client, make_user, db_storage):
    owner = make_user()
    place_id = new_place(client, owner)
    photo = upload(client, owner, place_id).json()

    client.delete(f"{API}/locations/{place_id}", headers=owner)

    assert client.get(photo["url"]).status_code == 404


# ---------- signup switch and config ----------


def test_signups_are_open_by_default(client):
    assert client.get(f"{API}/config").json() == {"signups_open": True}
    assert client.post(f"{API}/auth/signup", json={"email": "new@pinpoint.com", "password": "password123"}).status_code == 201


def test_closing_signups_refuses_new_accounts_but_not_sign_in(client, make_user, monkeypatch):
    make_user("old@pinpoint.com")
    monkeypatch.setenv("SIGNUPS", "closed")

    assert client.get(f"{API}/config").json() == {"signups_open": False}
    blocked = client.post(f"{API}/auth/signup", json={"email": "new@pinpoint.com", "password": "password123"})
    assert blocked.status_code == 403
    assert "closed" in blocked.json()["detail"].lower()
    assert client.post(f"{API}/auth/login", json={"email": "old@pinpoint.com", "password": "password123"}).status_code == 200


# ---------- database engine ----------


def test_the_engine_checks_connections_before_use():
    from app.db.database import engine

    assert engine.pool._pre_ping is True
    assert engine.pool._recycle == 300
