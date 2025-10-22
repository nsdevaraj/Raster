import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    """Test root endpoint returns correct response"""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["service"] == "Image to SVG Converter"
    assert response.json()["status"] == "running"


def test_health_endpoint():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "cache" in data
    assert "settings" in data


def test_cache_stats_endpoint():
    """Test cache statistics endpoint"""
    response = client.get("/cache/stats")
    assert response.status_code == 200
    data = response.json()
    assert "enabled" in data


def test_convert_without_file():
    """Test conversion fails without file"""
    response = client.post("/convert")
    assert response.status_code == 422


def test_metrics_endpoint():
    """Test metrics endpoint"""
    response = client.get("/metrics")
    assert response.status_code in [200, 404]
