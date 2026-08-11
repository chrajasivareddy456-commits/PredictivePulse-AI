"""
Basic ML service tests.
Run with:  pytest tests_ml.py -v   (from ml-service/ directory, after training)
"""
import math

import pandas as pd
from fastapi.testclient import TestClient

import app as app_module
from services.predictor import predictor

client = TestClient(app_module.app)


def _clean_payload(row: dict) -> dict:
    """Sensor payloads must be JSON-serializable: replace NaN with None."""
    return {
        k: (None if (isinstance(v, float) and math.isnan(v)) else v)
        for k, v in row.items()
        if k.startswith("sensor_")
    }


def test_model_loaded():
    assert predictor.loaded, "Run training/train.py before running tests."


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_model_info():
    r = client.get("/model-info")
    assert r.status_code == 200
    body = r.json()
    assert "classes" in body
    assert set(body["classes"]) == {"NORMAL", "RECOVERING", "BROKEN"}


def test_predict_shape():
    df = pd.read_csv("data/sensor.csv")
    row = df.iloc[0].to_dict()
    payload = _clean_payload(row)
    r = client.post("/predict", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert body["predictedStatus"] in {"NORMAL", "RECOVERING", "BROKEN"}
    assert 0.0 <= body["classificationConfidence"] <= 1.0


def test_anomaly_prediction():
    df = pd.read_csv("data/sensor.csv")
    row = df.iloc[0].to_dict()
    payload = _clean_payload(row)
    r = client.post("/anomaly", json=payload)
    assert r.status_code == 200
    assert isinstance(r.json()["anomaly"], bool)


def test_analyze_missing_all_fields():
    r = client.post("/analyze", json={})
    assert r.status_code == 422


def test_analyze_full_pipeline():
    df = pd.read_csv("data/sensor.csv")
    row = df.iloc[17155].to_dict()  # a known BROKEN row
    payload = _clean_payload(row)
    r = client.post("/analyze", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert body["riskLevel"] in {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
