from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_create_and_list_service():
    response = client.post(
        "/services",
        json={"name": "Example", "url": "https://example.com", "expected_status": 200},
    )

    assert response.status_code == 201
    service = response.json()
    assert service["name"] == "Example"
    assert service["latest_check"] is None

    list_response = client.get("/services")
    assert list_response.status_code == 200
    assert any(item["id"] == service["id"] for item in list_response.json())


def test_update_and_delete_service():
    create_response = client.post(
        "/services",
        json={"name": "Old Name", "url": "https://example.com", "expected_status": 200},
    )
    service_id = create_response.json()["id"]

    update_response = client.put(
        f"/services/{service_id}",
        json={"name": "New Name", "url": "https://example.org", "expected_status": 200},
    )

    assert update_response.status_code == 200
    assert update_response.json()["name"] == "New Name"

    delete_response = client.delete(f"/services/{service_id}")
    assert delete_response.status_code == 204

    checks_response = client.get(f"/services/{service_id}/checks")
    assert checks_response.status_code == 404
