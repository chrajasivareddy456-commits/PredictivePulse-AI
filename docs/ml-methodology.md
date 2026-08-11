# ML Methodology

## Data
- Source: `ml-service/data/sensor.csv` (220,320 rows × 55 columns).
- `Unnamed: 0` dropped (index artifact). `timestamp` parsed to datetime.
- `sensor_15` dropped: verified during EDA to be 100% NaN across all 220,320 rows — carries zero information.
- 51 usable sensor features (`sensor_00`–`sensor_51`, excluding `sensor_15`).
- No duplicate rows found.
- Average missing rate across the remaining 51 sensor features: ~2.8%. Handled via median imputation, fit only on the training split.

## Class imbalance
NORMAL 205,836 / RECOVERING 14,477 / BROKEN 7. `class_weight="balanced"` used in both classifiers. No synthetic oversampling (e.g. SMOTE) was applied — with only 7 real BROKEN examples spread across a 5-month time series, synthesizing additional samples would fabricate data the dataset does not support, which this project's explicit "no fake data" requirement rules out.

## Split strategy (see also README §4)
Stratified random 80/20 split, chosen over a chronological split specifically because a chronological split would exclude BROKEN from the test set entirely (all 7 BROKEN rows occur before 2018-07-25, well before the end of the timeline). This is a documented tradeoff, not an oversight.

## Models
- `DecisionTreeClassifier(class_weight="balanced", max_depth=12)`
- `RandomForestClassifier(n_estimators=200, class_weight="balanced", max_depth=16)`
- Selected by **macro F1** on the held-out test set (not accuracy).
- `IsolationForest(n_estimators=200, contamination=0.02)`, trained only on NORMAL-labelled training rows.

## Evaluation
Accuracy, macro precision/recall/F1, weighted F1, per-class precision/recall/F1/support, and a full confusion matrix are all computed and saved to `ml-service/models/model_metadata.json` and `ml-service/reports/evaluation_report.json`. See the README for the actual numbers from the last training run.

## Feature importance
Extracted directly from the selected model's `feature_importances_` (tree-based, so no permutation importance was needed) and saved in `model_metadata.json`. Surfaced as-is in the Model Information page — feature importance reflects correlation with the model's decisions, not a causal claim about the physical machine.

## Diagnosis / risk engine
`ml-service/services/diagnosis.py` — deterministic rule table combining predicted class, classifier confidence, and Isolation Forest anomaly flag into LOW/MEDIUM/HIGH/CRITICAL. Documented inline; thresholds (e.g. `LOW_CONFIDENCE_THRESHOLD = 0.55`) are named constants, not magic numbers scattered through the code.
