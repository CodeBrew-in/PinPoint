API = "/api/v1"


def new_map(client, headers, title="Patiala heritage", visibility="public", **extra):
    body = {"title": title, "visibility": visibility, **extra}
    return client.post(f"{API}/maps", json=body, headers=headers)


def add_place(client, headers, map_id, name="Qila Mubarak", lat=30.3241, lng=76.4031):
    return client.post(
        f"{API}/locations", json={"name": name, "lat": lat, "lng": lng, "map_id": map_id}, headers=headers
    )


def titles(response):
    return [m["title"] for m in response.json()["items"]]


def test_create_map_requires_a_token(client):
    assert client.post(f"{API}/maps", json={"title": "Abc", "visibility": "public"}).status_code == 401


def test_create_map(client, make_user):
    owner = make_user("a@pinpoint.com", username="walker")

    response = new_map(client, owner, description="Forts", category="Heritage")

    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "Patiala heritage"
    assert body["category"] == "Heritage"
    assert body["visibility"] == "public"
    assert body["owner_username"] == "walker"
    assert body["place_count"] == 0
    assert body["pins"] == []
    assert body["shared_with"] == []


def test_create_map_validates_the_input(client, make_user):
    owner = make_user()

    assert new_map(client, owner, title="ab").status_code == 422
    assert new_map(client, owner, title="x" * 73).status_code == 422
    assert new_map(client, owner, visibility="secret").status_code == 422
    assert client.post(f"{API}/maps", json={"title": "Abc"}, headers=owner).status_code == 422


def test_guest_sees_public_maps_only(client, make_user):
    owner = make_user()
    new_map(client, owner, title="Open map", visibility="public")
    new_map(client, owner, title="Closed map", visibility="private")

    assert titles(client.get(f"{API}/maps")) == ["Open map"]
    # the owner's own list also shows the private one when asked for it
    assert sorted(titles(client.get(f"{API}/maps?scope=mine", headers=owner))) == ["Closed map", "Open map"]


def test_mine_and_shared_need_a_token(client):
    assert client.get(f"{API}/maps?scope=mine").status_code == 401
    assert client.get(f"{API}/maps?scope=shared").status_code == 401


def test_mine_lists_only_my_maps(client, make_user):
    me, other = make_user(), make_user()
    new_map(client, me, title="Mine")
    new_map(client, other, title="Theirs")

    assert titles(client.get(f"{API}/maps?scope=mine", headers=me)) == ["Mine"]


def test_a_private_map_is_a_404_for_everyone_but_the_owner(client, make_user):
    owner, stranger = make_user(), make_user()
    map_id = new_map(client, owner, visibility="private").json()["id"]

    assert client.get(f"{API}/maps/{map_id}", headers=owner).status_code == 200
    assert client.get(f"{API}/maps/{map_id}").status_code == 404
    assert client.get(f"{API}/maps/{map_id}", headers=stranger).status_code == 404
    assert client.get(f"{API}/maps/{map_id}/locations", headers=stranger).status_code == 404


def test_sharing_gives_access_and_unsharing_takes_it_back(client, make_user):
    owner = make_user("owner@pinpoint.com")
    friend = make_user("Friend@pinpoint.com")
    map_id = new_map(client, owner, title="Secret", visibility="private").json()["id"]

    shared = client.post(f"{API}/maps/{map_id}/shares", json={"email": "friend@pinpoint.com"}, headers=owner)
    assert shared.status_code == 200
    assert shared.json()["shared_with"] == ["friend@pinpoint.com"]

    assert client.get(f"{API}/maps/{map_id}", headers=friend).status_code == 200
    assert titles(client.get(f"{API}/maps?scope=shared", headers=friend)) == ["Secret"]
    # the friend is not told who else it is shared with
    assert client.get(f"{API}/maps/{map_id}", headers=friend).json()["shared_with"] == []

    removed = client.delete(f"{API}/maps/{map_id}/shares/friend@pinpoint.com", headers=owner)
    assert removed.status_code == 200
    assert removed.json()["shared_with"] == []
    assert client.get(f"{API}/maps/{map_id}", headers=friend).status_code == 404


def test_sharing_rules(client, make_user):
    owner = make_user("owner@pinpoint.com")
    friend = make_user("friend@pinpoint.com")
    private_id = new_map(client, owner, visibility="private").json()["id"]
    public_id = new_map(client, owner, title="Open map", visibility="public").json()["id"]

    share = lambda map_id, email, headers: client.post(f"{API}/maps/{map_id}/shares", json={"email": email}, headers=headers)

    assert share(public_id, "friend@pinpoint.com", owner).status_code == 400  # public maps need no sharing
    assert share(private_id, "owner@pinpoint.com", owner).status_code == 400  # already the owner
    assert share(private_id, "friend@pinpoint.com", owner).status_code == 200
    assert share(private_id, "friend@pinpoint.com", owner).status_code == 400  # already has access
    assert share(private_id, "not-an-email", owner).status_code == 422
    assert share(private_id, "x@pinpoint.com", friend).status_code == 403  # can see it, but is not the owner
    assert share(public_id, "x@pinpoint.com", friend).status_code == 403
    assert client.post(f"{API}/maps/{private_id}/shares", json={"email": "x@pinpoint.com"}).status_code == 401


def test_a_stranger_cannot_share_someone_elses_private_map(client, make_user):
    owner, stranger = make_user(), make_user()
    map_id = new_map(client, owner, visibility="private").json()["id"]

    # 404, not 403: they must not learn the map exists
    response = client.post(f"{API}/maps/{map_id}/shares", json={"email": "a@pinpoint.com"}, headers=stranger)
    assert response.status_code == 404


def test_search_and_category_filters(client, make_user):
    owner = make_user()
    new_map(client, owner, title="Patiala heritage", category="Heritage", description="Forts and palaces")
    new_map(client, owner, title="Chai stops", category="Street food")

    assert titles(client.get(f"{API}/maps?q=fort")) == ["Patiala heritage"]
    assert titles(client.get(f"{API}/maps?q=CHAI")) == ["Chai stops"]
    assert titles(client.get(f"{API}/maps?category=street food")) == ["Chai stops"]
    assert titles(client.get(f"{API}/maps?q=nothing-matches")) == []


def test_maps_are_listed_newest_update_first(client, make_user):
    owner = make_user()
    first = new_map(client, owner, title="First").json()["id"]
    new_map(client, owner, title="Second")

    add_place(client, owner, first)  # adding a place bumps its map to the top

    assert titles(client.get(f"{API}/maps")) == ["First", "Second"]


def test_map_counts_and_pins_follow_its_places(client, make_user):
    owner, visitor = make_user(), make_user()
    map_id = new_map(client, owner).json()["id"]

    add_place(client, owner, map_id, name="Qila Mubarak", lat=30.3241, lng=76.4031)
    add_place(client, visitor, map_id, name="Moti Bagh Palace", lat=30.3055, lng=76.3941)

    body = client.get(f"{API}/maps/{map_id}").json()
    assert body["place_count"] == 2
    assert body["contributor_count"] == 2
    assert [p["name"] for p in body["pins"]] == ["Qila Mubarak", "Moti Bagh Palace"]

    places = client.get(f"{API}/maps/{map_id}/locations").json()["items"]
    assert [p["name"] for p in places] == ["Qila Mubarak", "Moti Bagh Palace"]


def test_pins_are_capped_at_twelve(client, make_user):
    owner = make_user()
    map_id = new_map(client, owner).json()["id"]
    for i in range(14):
        add_place(client, owner, map_id, name=f"Place {i}")

    body = client.get(f"{API}/maps/{map_id}").json()
    assert body["place_count"] == 14
    assert len(body["pins"]) == 12


def test_unknown_map_is_a_404(client):
    assert client.get(f"{API}/maps/999999").status_code == 404
