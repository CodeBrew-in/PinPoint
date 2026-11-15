"""Deleting content, quotas, sharing rules, photo metadata and account deletion."""
import io
import os
from pathlib import Path

import pytest
from PIL import Image

from images import PNG, make_image

API = "/api/v1"


def new_map(client, headers, visibility="public", title="A map"):
    return client.post(f"{API}/maps", json={"title": title, "visibility": visibility}, headers=headers).json()["id"]


def new_place(client, headers, map_id=None, name="Qila Mubarak"):
    body = {"name": name, "lat": 30.3241, "lng": 76.4031}
    body.update({"map_id": map_id} if map_id else {"visibility": "public"})
    return client.post(f"{API}/locations", json=body, headers=headers).json()["id"]


def upload(client, headers, place_id, data=PNG, content_type="image/png"):
    return client.post(f"{API}/locations/{place_id}/photos", files={"file": ("p", data, content_type)}, headers=headers)


def file_of(photo) -> Path:
    return Path(os.environ["MEDIA_DIR"]) / "photos" / photo["url"].rsplit("/", 1)[1]


# ---------- deleting places, photos, notes and maps ----------


def test_author_can_delete_their_place_and_its_photo_files(client, make_user):
    owner = make_user()
    place_id = new_place(client, owner)
    photo = upload(client, owner, place_id).json()

    assert client.delete(f"{API}/locations/{place_id}", headers=owner).status_code == 204
    assert client.get(f"{API}/locations/{place_id}").status_code == 404
    assert not file_of(photo).exists()


def test_map_owner_can_remove_what_others_added_to_their_public_map(client, make_user):
    owner, stranger = make_user(), make_user()
    map_id = new_map(client, owner)
    vandalism = new_place(client, stranger, map_id, name="Spam")

    assert client.delete(f"{API}/locations/{vandalism}", headers=owner).status_code == 204


def test_others_cannot_delete_a_place(client, make_user):
    owner, stranger = make_user(), make_user()
    place_id = new_place(client, owner)

    assert client.delete(f"{API}/locations/{place_id}").status_code == 401
    assert client.delete(f"{API}/locations/{place_id}", headers=stranger).status_code == 403


def test_hidden_places_answer_404_on_delete(client, make_user):
    owner, stranger = make_user(), make_user()
    place_id = new_place(client, owner, new_map(client, owner, visibility="private"))

    assert client.delete(f"{API}/locations/{place_id}", headers=stranger).status_code == 404


def test_uploader_can_delete_their_photo_but_others_cannot(client, make_user):
    owner, visitor, stranger = make_user(), make_user(), make_user()
    place_id = new_place(client, owner)
    photo = upload(client, visitor, place_id).json()
    url = f"{API}/locations/{place_id}/photos/{photo['id']}"

    assert client.delete(url, headers=stranger).status_code == 403
    assert client.delete(url, headers=visitor).status_code == 204
    assert client.get(f"{API}/locations/{place_id}").json()["photos"] == []
    assert not file_of(photo).exists()


def test_note_author_can_delete_their_note(client, make_user):
    owner, visitor = make_user(), make_user()
    place_id = new_place(client, owner)
    note = client.post(f"{API}/locations/{place_id}/notes", json={"text": "Closed on Mondays"}, headers=visitor).json()["notes"][0]

    assert client.delete(f"{API}/locations/{place_id}/notes/{note['id']}", headers=visitor).status_code == 204
    assert client.get(f"{API}/locations/{place_id}").json()["notes"] == []


def test_owner_deletes_a_map_with_all_its_places(client, make_user):
    owner, visitor = make_user(), make_user()
    map_id = new_map(client, owner)
    mine, theirs = new_place(client, owner, map_id), new_place(client, visitor, map_id)

    assert client.delete(f"{API}/maps/{map_id}", headers=visitor).status_code == 403
    assert client.delete(f"{API}/maps/{map_id}", headers=owner).status_code == 204
    assert client.get(f"{API}/maps/{map_id}").status_code == 404
    assert client.get(f"{API}/locations/{mine}").status_code == 404
    assert client.get(f"{API}/locations/{theirs}").status_code == 404


def test_deletions_are_recorded_in_the_audit_log(client, make_user):
    from app.db.database import get_db
    from app.main import app
    from app.models.audit import AuditEvent

    owner = make_user()
    place_id = new_place(client, owner)
    client.delete(f"{API}/locations/{place_id}", headers=owner)

    session = app.dependency_overrides[get_db]()
    event = session.query(AuditEvent).filter(AuditEvent.target_id == place_id).one()
    assert event.action == "place_deleted"
    assert event.actor_id is not None


# ---------- verify and report rules ----------


def test_authors_cannot_verify_their_own_place(client, make_user):
    owner, visitor = make_user(), make_user()
    place_id = new_place(client, owner)

    assert client.post(f"{API}/locations/{place_id}/verify", headers=owner).status_code == 400
    assert client.post(f"{API}/locations/{place_id}/verify", headers=visitor).status_code == 200


def test_one_open_report_per_person_and_place(client, make_user):
    owner, visitor = make_user(), make_user()
    place_id = new_place(client, owner)
    url = f"{API}/locations/{place_id}/reports"

    assert client.post(url, json={"kind": "spam"}, headers=visitor).status_code == 201
    assert client.post(url, json={"kind": "spam"}, headers=visitor).status_code == 400


# ---------- quotas ----------


def test_a_place_holds_at_most_ten_photos(client, make_user):
    owner = make_user()
    place_id = new_place(client, owner)
    for _ in range(10):
        assert upload(client, owner, place_id).status_code == 201

    assert upload(client, owner, place_id).status_code == 422


def test_creating_places_is_rate_limited_per_user(client, make_user, monkeypatch):
    from app.core import ratelimit

    owner = make_user()
    monkeypatch.setenv("RATE_LIMIT_ENABLED", "true")
    ratelimit.reset()
    try:
        codes = [
            client.post(f"{API}/locations", json={"name": f"P{i}", "lat": 30.3, "lng": 76.4, "visibility": "public"}, headers=owner).status_code
            for i in range(61)
        ]
    finally:
        ratelimit.reset()

    assert codes[:60] == [201] * 60
    assert codes[60] == 429


def test_map_lists_are_paged(client, make_user):
    owner = make_user()
    for i in range(3):
        new_map(client, owner, title=f"Map {i}")

    assert len(client.get(f"{API}/maps?scope=mine&limit=2", headers=owner).json()["items"]) == 2
    assert client.get(f"{API}/maps?limit=999").status_code == 422


def test_search_treats_percent_and_underscore_literally(client, make_user):
    owner = make_user()
    new_map(client, owner, title="Plain map")

    assert client.get(f"{API}/maps?scope=mine&q=%25", headers=owner).json()["items"] == []
    assert client.get(f"{API}/maps?scope=mine&q=_", headers=owner).json()["items"] == []


# ---------- photo metadata ----------


def test_gps_and_camera_metadata_are_removed_from_uploads(client, make_user):
    exif = Image.Exif()
    exif[0x010F] = "PhoneMaker"  # camera make
    exif[0x8825] = {2: (30.0, 20.0, 0.0), 4: (76.0, 23.0, 0.0)}  # GPS latitude and longitude
    original = make_image("JPEG", exif=exif.tobytes())
    assert Image.open(io.BytesIO(original)).getexif()  # the test image really has metadata

    owner = make_user()
    photo = upload(client, owner, new_place(client, owner), original, "image/jpeg").json()
    stored = Image.open(io.BytesIO(client.get(photo["url"]).content))

    assert len(stored.getexif()) == 0


def test_a_file_that_only_starts_like_an_image_is_refused(client, make_user):
    owner = make_user()
    fake = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64

    assert upload(client, owner, new_place(client, owner), fake).status_code == 415


# ---------- sharing and moderator addresses ----------


def test_maps_can_only_be_shared_with_existing_accounts(client, make_user):
    owner = make_user()
    make_user("friend@pinpoint.com")
    map_id = new_map(client, owner, visibility="private")
    url = f"{API}/maps/{map_id}/shares"

    assert client.post(url, json={"email": "nobody-yet@pinpoint.com"}, headers=owner).status_code == 400
    assert client.post(url, json={"email": "Friend@pinpoint.com"}, headers=owner).status_code == 200


def test_an_unregistered_moderator_address_cannot_be_claimed(client, monkeypatch):
    monkeypatch.setenv("MODERATOR_EMAILS", "boss@pinpoint.com")
    response = client.post(f"{API}/auth/signup", json={"email": "boss@pinpoint.com", "password": "password123"})

    assert response.status_code == 400


# ---------- account deletion ----------


def test_account_deletion_needs_the_password(client, make_user):
    me = make_user("leaving@pinpoint.com")

    assert client.request("DELETE", f"{API}/auth/me", json={"password": "wrong"}, headers=me).status_code == 401
    assert client.get(f"{API}/auth/me", headers=me).status_code == 200


def test_account_deletion_removes_the_account_and_everything_it_owns(client, make_user):
    me, other = make_user("leaving@pinpoint.com"), make_user()
    my_map = new_map(client, me)
    my_place = new_place(client, me)
    others_place = new_place(client, other)
    my_photo_on_others_place = upload(client, me, others_place).json()

    response = client.request("DELETE", f"{API}/auth/me", json={"password": "password123"}, headers=me)

    assert response.status_code == 204
    assert client.get(f"{API}/auth/me", headers=me).status_code == 401
    assert client.get(f"{API}/maps/{my_map}").status_code == 404
    assert client.get(f"{API}/locations/{my_place}").status_code == 404
    assert client.get(f"{API}/locations/{others_place}").json()["photos"] == []
    assert not file_of(my_photo_on_others_place).exists()
    login = client.post(f"{API}/auth/login", json={"email": "leaving@pinpoint.com", "password": "password123"})
    assert login.status_code == 401


def test_password_length_is_capped(client):
    response = client.post(f"{API}/auth/signup", json={"email": "long@pinpoint.com", "password": "x" * 129})

    assert response.status_code == 422
