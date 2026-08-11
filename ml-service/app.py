"""
PredictivePulse AI — ML Service (FastAPI)
Run with:  uvicorn app:app --reload --port 8000   (from ml-service/ directory)
Swagger UI: http://localhost:8000/docs
"""
import io
import os
from datetime import datetime, timezone

import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from config import ALLOWED_ORIGINS
from preprocessing.preprocess import FEATURE_COLUMNS
from schemas.prediction import AnalyzeResponse, SensorPayload
from services.diagnosis import diagnose
from services.predictor import ModelNotTrainedError, predictor

app = FastAPI(
    title="PredictivePulse AI — ML Service",
    description=(
        "AI-powered factory sensor anomaly detection & failure diagnostics. "
        "Prototype system — not a certified industrial control system."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _model_unavailable_error():
    return HTTPException(
        status_code=503,
        detail=(
            "Model artifacts not found. Train the models first: "
            "run `python training/train.py` from the ml-service directory, "
            "then restart this service."
        ),
    )


@app.get("/health")
def health():
    return {
        "status": "ok",
        "modelLoaded": predictor.loaded,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/model-info")
def model_info():
    if not predictor.loaded:
        raise _model_unavailable_error()
    return predictor.metadata


@app.get("/sample")
def sample_row():
    """Returns one real row sampled from the training dataset, so the
    frontend's 'Load Example from Dataset' feature never invents values."""
    import pandas as pd

    csv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "sensor.csv")
    if not os.path.exists(csv_path):
        raise HTTPException(status_code=404, detail="Source dataset not found on the ML service.")
    df = pd.read_csv(csv_path)
    row = df.sample(1).iloc[0]
    sensor_values = {
        c: (None if pd.isna(row[c]) else float(row[c]))
        for c in FEATURE_COLUMNS
    }
    return {
        "sensorValues": sensor_values,
        "actualStatus": row.get("machine_status"),
        "timestamp": str(row.get("timestamp")),
        "note": "This is an actual row sampled from sensor.csv, not invented data.",
    }


@app.post("/predict")
def predict(payload: SensorPayload):
    if not predictor.loaded:
        raise _model_unavailable_error()
    sensor_dict = payload.model_dump(exclude={"machineId"})
    try:
        result = predictor.predict_single(sensor_dict)
    except ModelNotTrainedError:
        raise _model_unavailable_error()
    return result


@app.post("/anomaly")
def anomaly(payload: SensorPayload):
    if not predictor.loaded:
        raise _model_unavailable_error()
    sensor_dict = payload.model_dump(exclude={"machineId"})
    result = predictor.predict_single(sensor_dict)
    return {
        "anomaly": result["anomaly"],
        "anomalyScore": result["anomalyScore"],
    }


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(payload: SensorPayload):
    """Primary ML endpoint: combines classification + anomaly detection
    into a single diagnosis with risk level and recommendation."""
    if not predictor.loaded:
        raise _model_unavailable_error()

    machine_id = payload.machineId or "DEFAULT-PUMP"
    sensor_dict = payload.model_dump(exclude={"machineId"})

    provided = [c for c in FEATURE_COLUMNS if sensor_dict.get(c) is not None]
    if len(provided) == 0:
        raise HTTPException(status_code=422, detail="No sensor values were provided in the request.")

    result = predictor.predict_single(sensor_dict)
    diag = diagnose(
        predicted_status=result["predictedStatus"],
        classification_confidence=result["classificationConfidence"],
        is_anomaly=result["anomaly"],
        anomaly_score=result["anomalyScore"],
    )

    return {
        "machineId": machine_id,
        "predictedStatus": result["predictedStatus"],
        "classificationConfidence": result["classificationConfidence"],
        "anomaly": result["anomaly"],
        "anomalyScore": result["anomalyScore"],
        "riskLevel": diag["riskLevel"],
        "machineStatus": diag["machineStatus"],
        "recommendation": diag["recommendation"],
        "explanation": diag["explanation"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/predict-csv")
async def predict_csv(file: UploadFile = File(...)):
    """Batch inference: accepts a CSV with sensor_00..sensor_51 columns
    (extra columns like timestamp/machine_status are preserved and ignored
    for prediction). Returns a CSV with predictions appended, using the
    exact same preprocessing pipeline as single-record inference."""
    if not predictor.loaded:
        raise _model_unavailable_error()

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are supported.")

    raw = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(raw))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {e}")

    missing_cols = [c for c in FEATURE_COLUMNS if c not in df.columns]
    if len(missing_cols) > len(FEATURE_COLUMNS) * 0.5:
        raise HTTPException(
            status_code=422,
            detail=f"CSV is missing too many required sensor columns: {missing_cols[:10]}...",
        )

    result_df = predictor.predict_batch(df)

    diag_rows = []
    for _, row in result_df.iterrows():
        diag = diagnose(
            predicted_status=row["predictedStatus"],
            classification_confidence=row["classificationConfidence"],
            is_anomaly=bool(row["anomaly"]),
            anomaly_score=row["anomalyScore"],
        )
        diag_rows.append(diag["riskLevel"])
    result_df["riskLevel"] = diag_rows

    buf = io.StringIO()
    result_df.to_csv(buf, index=False)
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=predictions.csv"},
    )
