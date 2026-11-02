from pathlib import Path

API = "/api/v1"
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32


def setup_world(client, make_user, monkeypatch):
    """A moderator, two members, one public map with one place."""
    monkeypatch.setenv("MODERATOR_EMAILS", "mod@pinpoint.com")
    mod = make_user("mod@pinpoint.com", username="mod")
    owner = make_user("owner@pinpoint.com", username="owner")
    visitor = make_user("visitor@pinpoint.com", username="visitor")
    map_id = client.post(f"{API}/maps", json={"title": "Patiala heritage", "visibility": "public"}, headers=owner).json()["id"]
    place_id = client.post(
        f"{API}/locations", json={"name": "Qila Mubarak", "lat": 30.3, "lng": 76.4, "map_id": map_id}, headers=owner
    ).json()["id"]
    return mod, owner, visitor, map_id, place_id


def report(client, headers, place_id, kind="wrong_location", note=""):
    return client.post(f"{API}/locations/{place_id}/reports", json={"kind": kind, "note": note}, headers=headers).json()


def test_only_moderators_can_list_reports(client, make_user, monkeypatch):
    mod, owner, visitor, _, place_id = setup_world(client, make_user, monkeypatch)
    report(client, visitor, place_id)

    assert client.get(f"{API}/reports").status_code == 401
    assert client.get(f"{API}/reports", headers=visitor).status_code == 403
    assert client.get(f"{API}/reports", headers=owner).status_code == 403
    response = client.get(f"{API}/reports", headers=mod)
    assert response.status_code == 200
    assert [r["place_name"] for r in response.json()["items"]] == ["Qila Mubarak"]


def test_reports_are_filtered_by_status_and_listed_newest_first(client, make_user, monkeypatch):
    mod, _, visitor, _, place_id = setup_world(client, make_user, monkeypatch)
    first = report(client, visitor, place_id, note="first")
    report(client, visitor, place_id, note="second")
    client.post(f"{API}/reports/{first['id']}/resolve", json={"action": "dismiss"}, headers=mod)

    open_notes = [r["note"] for r in client.get(f"{API}/reports", headers=mod).json()["items"]]
    dismissed = [r["note"] for r in client.get(f"{API}/reports?status=dismissed", headers=mod).json()["items"]]

    assert open_notes == ["second"]
    assert dismissed == ["first"]
    assert client.get(f"{API}/reports?status=nonsense", headers=mod).status_code == 422


def test_dismiss_keeps_the_place(client, make_user, monkeypatch):
    mod, _, visitor, _, place_id = setup_world(client, make_user, monkeypatch)
    item = report(client, visitor, place_id)

    response = client.post(f"{API}/reports/{item['id']}/resolve", json={"action": "dismiss"}, headers=mod)

    assert response.status_code == 200
    assert response.json()["status"] == "dismissed"
    assert client.get(f"{API}/locations/{place_id}").status_code == 200


def test_remove_deletes_the_place_and_closes_every_open_report_about_it(client, make_user, monkeypatch):
    mod, owner, visitor, map_id, place_id = setup_world(client, make_user, monkeypatch)
    first = report(client, visitor, place_id, kind="no_longer_exists")
    second = report(client, owner, place_id, kind="duplicate")

    response = client.post(f"{API}/reports/{first['id']}/resolve", json={"action": "remove"}, headers=mod)

    assert response.status_code == 200
    assert response.json()["status"] == "removed"
    assert response.json()["location_id"] is None
    assert response.json()["place_name"] == "Qila Mubarak"  # the report still makes sense
    assert client.get(f"{API}/locations/{place_id}").status_code == 404
    assert client.get(f"{API}/maps/{map_id}").json()["place_count"] == 0
    assert client.get(f"{API}/reports", headers=mod).json()["items"] == []
    removed = {r["id"] for r in client.get(f"{API}/reports?status=removed", headers=mod).json()["items"]}
    assert removed == {first["id"], second["id"]}


def test_remove_also_deletes_the_photo_files(client, make_user, monkeypatch):
    mod, owner, visitor, _, place_id = setup_world(client, make_user, monkeypatch)
    photo = client.post(
        f"{API}/locations/{place_id}/photos", files={"file": ("p.png", PNG, "image/png")}, headers=owner
    ).json()
    on_disk = Path(__import__("os").environ["MEDIA_DIR"]) / "photos" / f"{photo['id']}.png"
    assert on_disk.exists()

    item = report(client, visitor, place_id)
    client.post(f"{API}/reports/{item['id']}/resolve", json={"action": "remove"}, headers=mod)

    assert not on_disk.exists()


def test_resolve_rules(client, make_user, monkeypatch):
    mod, owner, visitor, _, place_id = setup_world(client, make_user, monkeypatch)
    item = report(client, visitor, place_id)

    url = f"{API}/reports/{item['id']}/resolve"
    assert client.post(url, json={"action": "dismiss"}).status_code == 401
    assert client.post(url, json={"action": "dismiss"}, headers=visitor).status_code == 403
    assert client.post(url, json={"action": "burn"}, headers=mod).status_code == 422
    assert client.post(f"{API}/reports/999999/resolve", json={"action": "dismiss"}, headers=mod).status_code == 404

    assert client.post(url, json={"action": "dismiss"}, headers=mod).status_code == 200
    again = client.post(url, json={"action": "dismiss"}, headers=mod)
    assert again.status_code == 400
    assert again.json()["detail"] == "Report is already resolved"
