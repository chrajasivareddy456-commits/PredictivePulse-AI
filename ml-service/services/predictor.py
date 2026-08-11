import json
import os

import joblib
import numpy as np
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")


class ModelNotTrainedError(Exception):
    pass


class Predictor:
    """Loads trained artifacts once at startup and serves predictions.
    Does NOT retrain on request — if artifacts are missing it raises a
    clear error instructing the caller to run training/train.py first."""

    def __init__(self):
        self.classifier = None
        self.anomaly_model = None
        self.preprocessor = None
        self.feature_columns = None
        self.metadata = None
        self.loaded = False
        self._try_load()

    def _try_load(self):
        paths = {
            "classifier": os.path.join(MODELS_DIR, "classifier.joblib"),
            "anomaly_model": os.path.join(MODELS_DIR, "anomaly_model.joblib"),
            "preprocessor": os.path.join(MODELS_DIR, "preprocessor.joblib"),
            "feature_columns": os.path.join(MODELS_DIR, "feature_columns.joblib"),
            "metadata": os.path.join(MODELS_DIR, "model_metadata.json"),
        }
        if not all(os.path.exists(p) for p in paths.values()):
            self.loaded = False
            return

        self.classifier = joblib.load(paths["classifier"])
        self.anomaly_model = joblib.load(paths["anomaly_model"])
        self.preprocessor = joblib.load(paths["preprocessor"])
        self.feature_columns = joblib.load(paths["feature_columns"])
        with open(paths["metadata"]) as f:
            self.metadata = json.load(f)
        self.loaded = True

    def require_loaded(self):
        if not self.loaded:
            raise ModelNotTrainedError(
                "Model artifacts not found. Run `python training/train.py` "
                "from the ml-service directory to train and save the models first."
            )

    def _to_row(self, sensor_dict: dict) -> pd.DataFrame:
        row = {col: sensor_dict.get(col, None) for col in self.feature_columns}
        return pd.DataFrame([row], columns=self.feature_columns)

    def predict_single(self, sensor_dict: dict) -> dict:
        self.require_loaded()
        missing = [c for c in self.feature_columns if c not in sensor_dict or sensor_dict[c] is None]
        # Missing values are allowed (imputer handles them) but we report which were absent
        X_raw = self._to_row(sensor_dict)
        X_proc = self.preprocessor.transform(X_raw)

        pred_class = self.classifier.predict(X_proc)[0]
        proba = self.classifier.predict_proba(X_proc)[0]
        classes = list(self.classifier.classes_)
        confidence = float(proba[classes.index(pred_class)])

        anomaly_raw = self.anomaly_model.predict(X_proc)[0]  # -1 anomaly, 1 normal
        anomaly_score = float(self.anomaly_model.decision_function(X_proc)[0])
        is_anomaly = bool(anomaly_raw == -1)

        return {
            "predictedStatus": str(pred_class),
            "classificationConfidence": round(confidence, 4),
            "classProbabilities": {c: round(float(p), 4) for c, p in zip(classes, proba)},
            "anomaly": is_anomaly,
            "anomalyScore": round(anomaly_score, 4),
            "missingFields": missing,
        }

    def predict_batch(self, df: pd.DataFrame) -> pd.DataFrame:
        self.require_loaded()
        for col in self.feature_columns:
            if col not in df.columns:
                df[col] = np.nan
        X_raw = df[self.feature_columns]
        X_proc = self.preprocessor.transform(X_raw)

        preds = self.classifier.predict(X_proc)
        probas = self.classifier.predict_proba(X_proc)
        classes = list(self.classifier.classes_)
        confidences = probas[np.arange(len(preds)), [classes.index(p) for p in preds]]

        anomaly_raw = self.anomaly_model.predict(X_proc)
        anomaly_scores = self.anomaly_model.decision_function(X_proc)

        out = df.copy()
        out["predictedStatus"] = preds
        out["classificationConfidence"] = np.round(confidences, 4)
        out["anomaly"] = anomaly_raw == -1
        out["anomalyScore"] = np.round(anomaly_scores, 4)
        return out

    def feature_importance(self, top_n: int = 15) -> dict:
        self.require_loaded()
        return dict(list(self.metadata.get("feature_importance", {}).items())[:top_n])


predictor = Predictor()
