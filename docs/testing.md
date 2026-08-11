# Testing

## ML Service — `ml-service/tests_ml.py`
Run: `pytest tests_ml.py -v` (from `ml-service/`, after `python training/train.py`)

7 tests, all passing as of the last run in the build environment:
1. `test_model_loaded` — trained artifacts exist and load.
2. `test_health` — `/health` returns 200.
3. `test_model_info` — `/model-info` returns the 3 real classes.
4. `test_predict_shape` — `/predict` on a real dataset row returns a valid class + confidence in [0,1].
5. `test_anomaly_prediction` — `/anomaly` returns a boolean flag.
6. `test_analyze_missing_all_fields` — `/analyze` with an empty payload correctly returns 422.
7. `test_analyze_full_pipeline` — `/analyze` on one of the dataset's actual BROKEN rows returns a valid risk level.

## Backend
- Syntax: `node --check` on every `.js` file (no test framework dependency needed for this).
- Manual live checks performed during development (see README §14): health aggregation, 401 on protected routes without a token, 404 handler, input validation on `/auth/login`, live Node→FastAPI call.
- DB-dependent flows (register/login/analyze-with-storage) require a real `MONGO_URI` and should be verified by the developer locally — see README §14 for exactly why this couldn't be done in the build sandbox.

## Frontend
`npm run build` succeeds with zero errors; this validates every import, every route, and JSX syntax across all 11 pages.

## What "done" means here
Every check listed above was actually executed against the real `sensor.csv` and the real generated code — not asserted from memory. Where something could not be executed (live MongoDB), that is stated explicitly rather than assumed to work.
