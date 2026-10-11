EMAIL = "test@pinpoint.com"
PASSWORD = "testpassword123"


def signup(client, email=EMAIL, password=PASSWORD):
    return client.post("/auth/signup", json={"email": email, "password": password})


def login(client, email=EMAIL, password=PASSWORD):
    return client.post("/auth/login", json={"email": email, "password": password})


def test_signup_creates_user(client):
    response = signup(client)

    assert response.status_code == 201
    assert response.json()["email"] == EMAIL
    assert "password_hash" not in response.json()


def test_signup_rejects_duplicate_email(client):
    signup(client)
    response = signup(client)

    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"


def test_signup_rejects_invalid_email(client):
    response = signup(client, email="not-an-email")

    assert response.status_code == 422


def test_login_returns_token(client):
    signup(client)
    response = login(client)

    assert response.status_code == 200
    assert response.json()["token_type"] == "bearer"
    assert response.json()["access_token"]


def test_login_rejects_wrong_password(client):
    signup(client)
    response = login(client, password="wrongpassword")

    assert response.status_code == 401


def test_login_rejects_unknown_email(client):
    response = login(client, email="nobody@pinpoint.com")

    assert response.status_code == 401


def test_me_returns_current_user(client):
    signup(client)
    token = login(client).json()["access_token"]

    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    assert response.json()["email"] == EMAIL


def test_me_rejects_invalid_token(client):
    response = client.get("/auth/me", headers={"Authorization": "Bearer garbage"})

    assert response.status_code == 401
