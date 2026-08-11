"""
Preprocessing utilities for PredictivePulse AI.

This module defines the canonical list of sensor feature columns and the
preprocessing pipeline used identically at both training time and inference
time (single-record and batch/CSV), so there is no train/serve skew.
"""
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.compose import ColumnTransformer

# sensor_15 is dropped: it is 100% NaN for every row in the supplied
# sensor.csv (verified during EDA), so it carries zero information and
# cannot be imputed meaningfully.
DROPPED_SENSOR_COLUMNS = ["sensor_15"]

RAW_SENSOR_COLUMNS = [f"sensor_{i:02d}" for i in range(52)]
FEATURE_COLUMNS = [c for c in RAW_SENSOR_COLUMNS if c not in DROPPED_SENSOR_COLUMNS]

TARGET_COLUMN = "machine_status"
TIMESTAMP_COLUMN = "timestamp"
INDEX_ARTIFACT_COLUMN = "Unnamed: 0"

CLASS_LABELS = ["NORMAL", "RECOVERING", "BROKEN"]


def load_raw_dataset(csv_path: str) -> pd.DataFrame:
    """Load sensor.csv, parse timestamp, drop the index artifact column."""
    df = pd.read_csv(csv_path)

    if INDEX_ARTIFACT_COLUMN in df.columns:
        df = df.drop(columns=[INDEX_ARTIFACT_COLUMN])

    if TIMESTAMP_COLUMN in df.columns:
        df[TIMESTAMP_COLUMN] = pd.to_datetime(df[TIMESTAMP_COLUMN])

    missing_required = [c for c in FEATURE_COLUMNS if c not in df.columns]
    if missing_required:
        raise ValueError(f"Dataset is missing required sensor columns: {missing_required}")

    return df


def build_preprocessing_pipeline() -> ColumnTransformer:
    """
    Numeric pipeline: median imputation + standard scaling, applied uniformly
    to all sensor feature columns via ColumnTransformer so the same object
    can be fit once during training and reused unchanged at inference time.
    """
    numeric_pipeline = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ])

    preprocessor = ColumnTransformer(
        transformers=[("sensors", numeric_pipeline, FEATURE_COLUMNS)],
        remainder="drop",
    )
    return preprocessor


def sensor_dict_to_row(sensor_dict: dict) -> pd.DataFrame:
    """Convert a single {"sensor_00": v, ...} payload into a 1-row DataFrame
    with columns in the canonical FEATURE_COLUMNS order, filling any
    unspecified feature with NaN (the imputer will handle it)."""
    row = {col: sensor_dict.get(col, None) for col in FEATURE_COLUMNS}
    return pd.DataFrame([row], columns=FEATURE_COLUMNS)
