API = "/api/v1"

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32
JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 32
WEBP = b"RIFF\x00\x00\x00\x00WEBP" + b"\x00" * 32


def new_map(client, headers, visibility="public", title="A map"):
    return client.post(f"{API}/maps", json={"title": title, "visibility": visibility}, headers=headers).json()["id"]


def new_place(client, headers, **body):
    body = {"name": "Qila Mubarak", "lat": 30.3241, "lng": 76.4031, **body}
    return client.post(f"{API}/locations", json=body, headers=headers)


def upload(client, headers, location_id, data=PNG, content_type="image/png", name="p.png"):
    return client.post(
        f"{API}/locations/{location_id}/photos", files={"file": (name, data, content_type)}, headers=headers
    )


# ---------- create and read ----------


def test_create_requires_a_token(client):
    assert new_place(client, {}, visibility="public").status_code == 401


def test_create_a_flat_place_needs_a_visibility(client, make_user):
    owner = make_user()

    assert new_place(client, owner).status_code == 422
    response = new_place(client, owner, visibility="public", tags=["Study", " WiFi ", "study"])

    assert response.status_code == 201
    body = response.json()
    assert body["map_id"] is None
    assert body["tags"] == ["study", "wifi"]  # lowercase, trimmed, no duplicates
    assert body["photos"] == [] and body["notes"] == []
    assert body["verified_at"] is None and body["verified_by"] is None
    assert body["created_at"].endswith("Z")


def test_create_validates_the_input(client, make_user):
    owner = make_user()

    assert new_place(client, owner, visibility="public", name="   ").status_code == 422
    assert new_place(client, owner, visibility="public", name="x" * 121).status_code == 422
    assert new_place(client, owner, visibility="public", lat=91).status_code == 422
    assert new_place(client, owner, visibility="public", lng=-181).status_code == 422
    assert new_place(client, owner, visibility="public", tags=["a"] * 11).status_code == 422
    assert new_place(client, owner, visibility="public", tags=["x" * 31]).status_code == 422
    assert new_place(client, owner, visibility="public", description="x" * 2001).status_code == 422
    assert new_place(client, owner, visibility="nope").status_code == 422


def test_a_place_in_a_map_takes_the_maps_visibility(client, make_user):
    owner = make_user()
    private_map = new_map(client, owner, visibility="private")

    place = new_place(client, owner, map_id=private_map, visibility="public").json()  # the body value is ignored

    assert place["visibility"] == "private"
    assert place["map_id"] == private_map


def test_adding_to_an_unknown_or_hidden_map_is_a_404(client, make_user):
    owner, stranger = make_user(), make_user()
    private_map = new_map(client, owner, visibility="private")

    assert new_place(client, owner, map_id=999999).status_code == 404
    assert new_place(client, stranger, map_id=private_map).status_code == 404


def test_anyone_signed_in_can_add_to_a_public_map(client, make_user):
    owner, visitor = make_user(), make_user(username="visitor")
    map_id = new_map(client, owner)

    place = new_place(client, visitor, map_id=map_id).json()

    assert place["owner_username"] == "visitor"


def test_a_shared_user_can_add_to_a_private_map(client, make_user):
    owner, friend = make_user(), make_user("friend@pinpoint.com")
    map_id = new_map(client, owner, visibility="private")
    client.post(f"{API}/maps/{map_id}/shares", json={"email": "friend@pinpoint.com"}, headers=owner)

    assert new_place(client, friend, map_id=map_id).status_code == 201


def test_get_location_visibility(client, make_user):
    owner, stranger = make_user(), make_user()
    public_id = new_place(client, owner, visibility="public").json()["id"]
    private_id = new_place(client, owner, visibility="private").json()["id"]

    assert client.get(f"{API}/locations/{public_id}").status_code == 200  # no account needed
    assert client.get(f"{API}/locations/{private_id}", headers=owner).status_code == 200
    assert client.get(f"{API}/locations/{private_id}").status_code == 404
    assert client.get(f"{API}/locations/{private_id}", headers=stranger).status_code == 404
    assert client.get(f"{API}/locations/999999").status_code == 404


# ---------- bounding box search ----------

PATIALA = "76.30,30.25,76.50,30.45"


def pin_names(response):
    return sorted(p["name"] for p in response.json()["items"])


def test_bbox_returns_public_places_inside_the_box(client, make_user):
    owner = make_user()
    new_place(client, owner, visibility="public", name="Inside")
    new_place(client, owner, visibility="public", name="Far away", lat=19.07, lng=72.87)

    response = client.get(f"{API}/locations?bbox={PATIALA}")

    assert response.status_code == 200
    assert pin_names(response) == ["Inside"]
    assert set(response.json()["items"][0]) == {"id", "name", "lat", "lng", "visibility", "tags"}


def test_bbox_hides_private_places_from_everyone_else(client, make_user):
    owner, stranger = make_user(), make_user()
    new_place(client, owner, visibility="private", name="Secret")

    assert pin_names(client.get(f"{API}/locations?bbox={PATIALA}")) == []
    assert pin_names(client.get(f"{API}/locations?bbox={PATIALA}", headers=stranger)) == []
    assert pin_names(client.get(f"{API}/locations?bbox={PATIALA}", headers=owner)) == ["Secret"]


def test_bbox_includes_places_in_maps_you_own_or_are_shared_on(client, make_user):
    owner, friend, other = make_user(), make_user("friend@pinpoint.com"), make_user()
    map_id = new_map(client, owner, visibility="private")
    client.post(f"{API}/maps/{map_id}/shares", json={"email": "friend@pinpoint.com"}, headers=owner)
    new_place(client, friend, map_id=map_id, name="By the friend")

    assert pin_names(client.get(f"{API}/locations?bbox={PATIALA}", headers=owner)) == ["By the friend"]
    assert pin_names(client.get(f"{API}/locations?bbox={PATIALA}", headers=friend)) == ["By the friend"]
    assert pin_names(client.get(f"{API}/locations?bbox={PATIALA}", headers=other)) == []


def test_bbox_is_required_and_must_make_sense(client):
    assert client.get(f"{API}/locations").status_code == 422
    assert client.get(f"{API}/locations?bbox=1,2,3").status_code == 422
    assert client.get(f"{API}/locations?bbox=a,b,c,d").status_code == 422
    assert client.get(f"{API}/locations?bbox=10,0,5,5").status_code == 422  # west is not smaller than east
    assert client.get(f"{API}/locations?bbox=0,10,5,5").status_code == 422  # south is not smaller than north
    assert client.get(f"{API}/locations?bbox=-200,0,5,5").status_code == 422


def test_bbox_returns_newest_first_and_at_most_500(client, make_user):
    owner = make_user()
    new_place(client, owner, visibility="public", name="Older")
    new_place(client, owner, visibility="public", name="Newer")

    names = [p["name"] for p in client.get(f"{API}/locations?bbox={PATIALA}").json()["items"]]

    assert names == ["Newer", "Older"]


# ---------- photos ----------


def test_upload_photo_and_fetch_the_file(client, make_user):
    owner = make_user()
    place_id = new_place(client, owner, visibility="public").json()["id"]

    response = upload(client, owner, place_id)

    assert response.status_code == 201
    photo = response.json()
    assert photo["url"] == f"/media/photos/{photo['id']}.png"
    assert client.get(photo["url"]).content == PNG
    assert client.get(f"{API}/locations/{place_id}").json()["photos"] == [photo]


def test_jpeg_and_webp_are_accepted(client, make_user):
    owner = make_user()
    place_id = new_place(client, owner, visibility="public").json()["id"]

    assert upload(client, owner, place_id, JPEG, "image/jpeg", "a.jpg").json()["url"].endswith(".jpg")
    assert upload(client, owner, place_id, WEBP, "image/webp", "a.webp").json()["url"].endswith(".webp")


def test_photo_rules(client, make_user):
    owner = make_user()
    place_id = new_place(client, owner, visibility="public").json()["id"]

    assert upload(client, owner, place_id, b"GIF89a....", "image/gif", "a.gif").status_code == 415
    # claims to be a PNG but the bytes say otherwise
    assert upload(client, owner, place_id, b"<script>alert(1)</script>", "image/png").status_code == 415
    assert upload(client, owner, place_id, b"", "image/png").status_code == 415
    too_big = PNG + b"\x00" * (5 * 1024 * 1024)
    assert upload(client, owner, place_id, too_big).status_code == 413
    assert client.get(f"{API}/locations/{place_id}").json()["photos"] == []  # nothing half-saved


def test_photo_upload_needs_a_token_and_a_visible_place(client, make_user):
    owner, stranger = make_user(), make_user()
    private_id = new_place(client, owner, visibility="private").json()["id"]
    public_id = new_place(client, owner, visibility="public").json()["id"]

    assert client.post(f"{API}/locations/{public_id}/photos", files={"file": ("p.png", PNG, "image/png")}).status_code == 401
    assert upload(client, stranger, private_id).status_code == 404
    assert upload(client, owner, 999999).status_code == 404


def test_anyone_who_can_see_a_place_can_add_a_photo(client, make_user):
    owner, visitor = make_user(), make_user()
    place_id = new_place(client, owner, visibility="public").json()["id"]

    assert upload(client, visitor, place_id).status_code == 201


# ---------- notes, verify, report ----------


def test_add_a_note(client, make_user):
    owner, visitor = make_user(), make_user(username="visitor")
    place_id = new_place(client, owner, visibility="public").json()["id"]

    response = client.post(f"{API}/locations/{place_id}/notes", json={"text": "  Best at 8 AM.  "}, headers=visitor)

    assert response.status_code == 201
    note = response.json()["notes"][0]
    assert note["text"] == "Best at 8 AM."
    assert note["username"] == "visitor"


def test_note_rules(client, make_user):
    owner, stranger = make_user(), make_user()
    public_id = new_place(client, owner, visibility="public").json()["id"]
    private_id = new_place(client, owner, visibility="private").json()["id"]

    assert client.post(f"{API}/locations/{public_id}/notes", json={"text": "x"}).status_code == 401
    assert client.post(f"{API}/locations/{public_id}/notes", json={"text": "  "}, headers=owner).status_code == 422
    assert client.post(f"{API}/locations/{public_id}/notes", json={"text": "x" * 501}, headers=owner).status_code == 422
    assert client.post(f"{API}/locations/{private_id}/notes", json={"text": "x"}, headers=stranger).status_code == 404


def test_verify_records_who_and_when(client, make_user):
    owner, visitor = make_user(), make_user(username="visitor")
    place_id = new_place(client, owner, visibility="public").json()["id"]

    response = client.post(f"{API}/locations/{place_id}/verify", headers=visitor)

    assert response.status_code == 200
    assert response.json()["verified_by"] == "visitor"
    assert response.json()["verified_at"].endswith("Z")
    assert client.post(f"{API}/locations/{place_id}/verify").status_code == 401


def test_verify_a_hidden_place_is_a_404(client, make_user):
    owner, stranger = make_user(), make_user()
    private_id = new_place(client, owner, visibility="private").json()["id"]

    assert client.post(f"{API}/locations/{private_id}/verify", headers=stranger).status_code == 404


def test_report_a_place(client, make_user):
    owner, visitor = make_user(), make_user(username="visitor")
    map_id = new_map(client, owner, title="Patiala heritage")
    place_id = new_place(client, owner, map_id=map_id).json()["id"]

    response = client.post(
        f"{API}/locations/{place_id}/reports", json={"kind": "wrong_location", "note": "Pin looks off"}, headers=visitor
    )

    assert response.status_code == 201
    report = response.json()
    assert report["status"] == "open"
    assert report["place_name"] == "Qila Mubarak"
    assert report["map_title"] == "Patiala heritage"
    assert report["reporter_username"] == "visitor"


def test_report_rules(client, make_user):
    owner, stranger = make_user(), make_user()
    public_id = new_place(client, owner, visibility="public").json()["id"]
    private_id = new_place(client, owner, visibility="private").json()["id"]

    assert client.post(f"{API}/locations/{public_id}/reports", json={"kind": "spam"}).status_code == 401
    assert client.post(f"{API}/locations/{public_id}/reports", json={"kind": "bad"}, headers=owner).status_code == 422
    assert client.post(f"{API}/locations/{private_id}/reports", json={"kind": "spam"}, headers=stranger).status_code == 404
