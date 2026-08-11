# System Architecture

```
USER → React (Vite, :5173) → Axios → Node.js/Express (:5000)
                                          │            │
                                      MongoDB      FastAPI ML Service (:8000)
                                                        │
                                              Classifier + Isolation Forest
                                                        │
                                                 Diagnosis Engine
```

## Principles
- **React talks only to Node.** The frontend never calls FastAPI directly — this keeps auth, validation, and persistence centralized in one place.
- **Node talks to MongoDB and to FastAPI.** MongoDB for persistent application data (users, machines, sensor records, predictions); FastAPI for ML inference only. FastAPI has no database dependency.
- **FastAPI loads models once at startup** (`services/predictor.py`) and never retrains on request. If model artifacts are missing, every ML endpoint returns a clear `503` explaining that `training/train.py` must be run first — no silent fallback, no fake predictions.
- **Timeouts and graceful degradation:** the Node `mlService.js` client has a 10s timeout (60s for CSV batches); if FastAPI is unreachable, Node returns a clean `503` to the client instead of crashing or hanging.

## Request flow: manual analysis
```
POST /api/predictions/analyze (React → Node, JWT required)
  → Node validates sensor payload
  → Node calls FastAPI POST /analyze
      → FastAPI applies the saved preprocessing pipeline
      → runs classifier.predict_proba()
      → runs isolation_forest.predict() + decision_function()
      → diagnosis.py combines both into risk level + recommendation
  → Node stores the Prediction document in MongoDB
  → Node upserts the Machine document (status, risk, lastAnalyzedAt)
  → Node returns the result to React
  → React renders the diagnosis card and the machine/history pages update
```
