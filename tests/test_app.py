from fastapi.testclient import TestClient
import importlib

from src import app as app_module

# create a fresh client for each test by reloading the module to reset state

def get_client():
    importlib.reload(app_module)
    return TestClient(app_module.app)


def test_root_redirect():
    # Arrange
    client = get_client()

    # Act
    # disallow following redirects so we can inspect the original response
    response = client.get("/", follow_redirects=False)

    # Assert
    assert response.status_code == 307 or response.status_code == 302
    # FastAPI uses 307 for RedirectResponse by default
    assert response.headers["location"] == "/static/index.html"


def test_get_activities():
    # Arrange
    client = get_client()

    # Act
    response = client.get("/activities")

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_success_new_email():
    # Arrange
    client = get_client()
    activity = "Chess Club"
    email = "newstudent@mergington.edu"

    # Act
    response = client.post(f"/activities/{activity}/signup", params={"email": email})

    # Assert
    assert response.status_code == 200
    assert response.json()["message"] == f"Signed up {email} for {activity}"


def test_signup_nonexistent_activity():
    # Arrange
    client = get_client()

    # Act
    response = client.post("/activities/Nonexistent/signup", params={"email": "a@b.com"})

    # Assert
    assert response.status_code == 404


def test_signup_duplicate_email():
    # Arrange
    client = get_client()
    activity = "Chess Club"
    email = "michael@mergington.edu"  # already in initial participants

    # Act
    response = client.post(f"/activities/{activity}/signup", params={"email": email})

    # Assert
    assert response.status_code == 400


def test_remove_participant_success():
    # Arrange
    client = get_client()
    activity = "Chess Club"
    email = "temp@mergington.edu"
    # sign up first so we can remove
    signup = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert signup.status_code == 200

    # Act
    response = client.delete(f"/activities/{activity}/participants", params={"email": email})

    # Assert
    assert response.status_code == 200
    assert response.json()["message"] == f"Removed {email} from {activity}"


def test_remove_participant_activity_not_found():
    # Arrange
    client = get_client()

    # Act
    response = client.delete("/activities/NoSuchActivity/participants", params={"email": "x@y.com"})

    # Assert
    assert response.status_code == 404


def test_remove_participant_email_not_found():
    # Arrange
    client = get_client()
    activity = "Chess Club"
    email = "nobody@mergington.edu"  # not in list

    # Act
    response = client.delete(f"/activities/{activity}/participants", params={"email": email})

    # Assert
    assert response.status_code == 404
