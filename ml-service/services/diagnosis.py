"""
Combined diagnosis / risk engine.

Combines the classifier's predicted machine_status with the Isolation
Forest's anomaly verdict to produce a single risk level and a maintenance
recommendation. Thresholds are centralized here (not scattered across the
codebase) and are intentionally simple/explainable rather than a black box.

This is an ML-based *application* risk signal for a prototype system —
NOT a safety-certified industrial risk score.
"""

RISK_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

RECOMMENDATIONS = {
    "LOW": "Continue normal operation and routine monitoring.",
    "MEDIUM": "Inspect sensor trends and schedule a preventive inspection.",
    "HIGH": "Inspect the machine and schedule maintenance as soon as possible.",
    "CRITICAL": "Stop or isolate the machine per factory safety procedures and perform immediate inspection.",
}

# Configurable thresholds
LOW_CONFIDENCE_THRESHOLD = 0.55  # below this, treat classifier as "uncertain"


def diagnose(predicted_status: str, classification_confidence: float,
             is_anomaly: bool, anomaly_score: float) -> dict:
    """
    Diagnosis rules (documented, deterministic):

      CRITICAL: predicted_status == "BROKEN"
                OR (is_anomaly AND predicted_status == "RECOVERING")
      HIGH:     is_anomaly AND predicted_status == "NORMAL"
                OR predicted_status == "RECOVERING" (no anomaly flag)
      MEDIUM:   NORMAL prediction but low classifier confidence
      LOW:      NORMAL prediction, no anomaly, reasonable confidence
    """
    if predicted_status == "BROKEN":
        risk = "CRITICAL"
    elif is_anomaly and predicted_status == "RECOVERING":
        risk = "CRITICAL"
    elif is_anomaly and predicted_status == "NORMAL":
        risk = "HIGH"
    elif predicted_status == "RECOVERING":
        risk = "HIGH"
    elif predicted_status == "NORMAL" and classification_confidence < LOW_CONFIDENCE_THRESHOLD:
        risk = "MEDIUM"
    else:
        risk = "LOW"

    machine_status = "CRITICAL" if risk == "CRITICAL" else ("WARNING" if risk in ("MEDIUM", "HIGH") else "NORMAL")

    explanation = (
        f"Prediction '{predicted_status}' (confidence {classification_confidence:.2f}); "
        f"anomaly detector {'flagged unusual sensor patterns' if is_anomaly else 'found no anomaly'} "
        f"(score {anomaly_score:.3f}). Risk derived from the combination of both signals using the "
        f"model's learned feature importance; this reflects correlation, not a confirmed causal fault."
    )

    return {
        "riskLevel": risk,
        "machineStatus": machine_status,
        "recommendation": RECOMMENDATIONS[risk],
        "explanation": explanation,
    }
