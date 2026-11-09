API = "/api/v1"


def signup(client, email, username=None, password="password123"):
    body = {"email": email, "password": password}
    if username is not None:
        body["username"] = username
    return client.post(f"{API}/auth/signup", json=body)


def test_username_defaults_to_the_email_name(client):
    user = signup(client, "ananya.rao@pinpoint.com").json()

    assert user["username"] == "ananyarao"  # characters outside letters, digits, _ and - are dropped
    assert user["name"] == user["username"]
    assert user["bio"] == ""
    assert user["role"] == "member"


def test_default_username_is_made_unique(client):
    first = signup(client, "sam@one.com").json()
    second = signup(client, "sam@two.com").json()

    assert first["username"] == "sam"
    assert second["username"] == "sam2"


def test_signup_accepts_a_chosen_username(client):
    assert signup(client, "a@pinpoint.com", username="Trail_Walker").json()["username"] == "Trail_Walker"


def test_signup_rejects_a_taken_username_ignoring_case(client):
    signup(client, "a@pinpoint.com", username="walker")
    response = signup(client, "b@pinpoint.com", username="WALKER")

    assert response.status_code == 400
    assert response.json()["detail"] == "Username already taken"


def test_signup_rejects_a_bad_username(client):
    assert signup(client, "a@pinpoint.com", username="no spaces").status_code == 422
    assert signup(client, "a@pinpoint.com", username="ab").status_code == 422


def test_me_can_update_name_and_bio(client, make_user):
    headers = make_user("a@pinpoint.com", username="walker")

    response = client.patch(f"{API}/auth/me", json={"name": "Walker W", "bio": "Walks a lot."}, headers=headers)

    assert response.status_code == 200
    assert response.json()["name"] == "Walker W"
    assert response.json()["bio"] == "Walks a lot."
    assert client.get(f"{API}/auth/me", headers=headers).json()["name"] == "Walker W"


def test_update_me_rejects_an_empty_name_and_a_long_bio(client, make_user):
    headers = make_user()

    assert client.patch(f"{API}/auth/me", json={"name": "   "}, headers=headers).status_code == 422
    assert client.patch(f"{API}/auth/me", json={"bio": "x" * 181}, headers=headers).status_code == 422


def test_update_me_requires_a_token(client):
    assert client.patch(f"{API}/auth/me", json={"name": "x"}).status_code == 401


def test_moderator_role_comes_from_the_environment(client, make_user, monkeypatch):
    monkeypatch.setenv("MODERATOR_EMAILS", "boss@pinpoint.com, other@pinpoint.com")

    boss = make_user("Boss@pinpoint.com")
    member = make_user("member@pinpoint.com")

    assert client.get(f"{API}/auth/me", headers=boss).json()["role"] == "moderator"
    assert client.get(f"{API}/auth/me", headers=member).json()["role"] == "member"
