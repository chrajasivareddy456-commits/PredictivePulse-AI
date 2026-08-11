from typing import Optional

from pydantic import BaseModel, Field, create_model

from preprocessing.preprocess import FEATURE_COLUMNS

# Dynamically build a Pydantic model with one Optional[float] field per
# sensor column so we don't hand-write 51 fields, while still getting
# FastAPI request validation + Swagger docs "for free".
_sensor_fields = {col: (Optional[float], Field(default=None)) for col in FEATURE_COLUMNS}

SensorPayload = create_model(
    "SensorPayload",
    machineId=(Optional[str], Field(default="DEFAULT-PUMP")),
    **_sensor_fields,
)


class AnalyzeResponse(BaseModel):
    machineId: str
    predictedStatus: str
    classificationConfidence: float
    anomaly: bool
    anomalyScore: float
    riskLevel: str
    machineStatus: str
    recommendation: str
    explanation: str
    timestamp: str
