"""
PredictivePulse AI — Training Pipeline
========================================
Run with:  python training/train.py   (from the ml-service/ directory)

Pipeline:
  1. Load sensor.csv, validate schema
  2. Parse timestamp, drop index artifact + fully-empty sensor_15
  3. Missing value / duplicate analysis
  4. EDA figures
  5. Preprocessing (median impute + scale)
  6. Train/test split (see SPLIT STRATEGY note below)
  7. Train Decision Tree + Random Forest, evaluate, pick production model
  8. Train Isolation Forest on NORMAL-labelled rows
  9. Save models, preprocessor, metadata, evaluation report

SPLIT STRATEGY
--------------
This is timestamped sensor data (1-minute cadence, 2018-04-01 to 2018-08-31),
so a chronological split is normally preferred to avoid leaking future
information into training. However, all 7 BROKEN-labelled rows in this
dataset fall between 2018-04-12 and 2018-07-25 — a pure chronological
80/20 split would put the final ~20% of the timeline (into September... in
practice the tail of the data) with ZERO BROKEN examples in the test set,
making it impossible to evaluate the model on the rarest and most important
class at all.

Given that trade-off, this script uses a STRATIFIED RANDOM split
(stratify=machine_status) for the classification train/test evaluation, so
that BROKEN examples appear in both partitions. This intentionally accepts
some risk of temporal leakage (a training row could be a near-neighbour in
time of a test row) in exchange for being able to report any BROKEN-class
metric at all. This trade-off is documented here and in the README/model
metadata; it is NOT hidden. The Isolation Forest anomaly model is trained
only on NORMAL rows and does not depend on this split.
"""
import json
import os
import sys
import time
import warnings
from datetime import datetime, timezone

import joblib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.metrics import (accuracy_score, classification_report,
                              confusion_matrix, f1_score,
                              precision_recall_fscore_support)
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from preprocessing.preprocess import (CLASS_LABELS, FEATURE_COLUMNS,
                                       TARGET_COLUMN,
                                       build_preprocessing_pipeline,
                                       load_raw_dataset)

warnings.filterwarnings("ignore")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "sensor.csv")
MODELS_DIR = os.path.join(BASE_DIR, "models")
FIGURES_DIR = os.path.join(BASE_DIR, "reports", "figures")
REPORTS_DIR = os.path.join(BASE_DIR, "reports")

RANDOM_STATE = 42


def log(msg):
    print(f"[train] {msg}", flush=True)


def run_eda(df: pd.DataFrame):
    log("Generating EDA figures...")
    os.makedirs(FIGURES_DIR, exist_ok=True)

    # 1. Machine status distribution
    plt.figure(figsize=(6, 4))
    order = df[TARGET_COLUMN].value_counts().index
    sns.countplot(x=TARGET_COLUMN, data=df, order=order)
    plt.title("Machine Status Distribution")
    plt.yscale("log")
    plt.ylabel("Count (log scale)")
    plt.tight_layout()
    plt.savefig(os.path.join(FIGURES_DIR, "01_status_distribution.png"), dpi=120)
    plt.close()

    # 2. Correlation heatmap (subset of sensors for readability)
    sample_sensors = FEATURE_COLUMNS[:20]
    corr = df[sample_sensors].corr()
    plt.figure(figsize=(10, 8))
    sns.heatmap(corr, cmap="coolwarm", center=0)
    plt.title("Sensor Correlation Heatmap (first 20 sensors)")
    plt.tight_layout()
    plt.savefig(os.path.join(FIGURES_DIR, "02_correlation_heatmap.png"), dpi=120)
    plt.close()

    # 3. Time-series plot for a couple of representative sensors
    plot_df = df.iloc[::50]  # downsample for a readable plot
    fig, axes = plt.subplots(2, 1, figsize=(12, 6), sharex=True)
    for ax, sensor in zip(axes, ["sensor_00", "sensor_04"]):
        ax.plot(plot_df["timestamp"], plot_df[sensor], linewidth=0.6)
        broken_pts = df[df[TARGET_COLUMN] == "BROKEN"]
        ax.scatter(broken_pts["timestamp"], broken_pts[sensor], color="red", s=25, label="BROKEN", zorder=5)
        ax.set_ylabel(sensor)
        ax.legend()
    axes[0].set_title("Sensor Time-Series with BROKEN Events Marked")
    plt.tight_layout()
    plt.savefig(os.path.join(FIGURES_DIR, "03_sensor_timeseries.png"), dpi=120)
    plt.close()

    # 4. Distribution of a sensor
    plt.figure(figsize=(6, 4))
    sns.histplot(df["sensor_00"].dropna(), bins=50, kde=True)
    plt.title("Distribution: sensor_00")
    plt.tight_layout()
    plt.savefig(os.path.join(FIGURES_DIR, "04_sensor_distribution.png"), dpi=120)
    plt.close()

    # 5. Sensor grouped by status (boxplot)
    plt.figure(figsize=(7, 5))
    sns.boxplot(x=TARGET_COLUMN, y="sensor_04", data=df)
    plt.title("sensor_04 by Machine Status")
    plt.tight_layout()
    plt.savefig(os.path.join(FIGURES_DIR, "05_sensor_by_status.png"), dpi=120)
    plt.close()

    # 6. Status over time
    plt.figure(figsize=(12, 3))
    status_numeric = df[TARGET_COLUMN].map({"NORMAL": 0, "RECOVERING": 1, "BROKEN": 2})
    plt.scatter(df["timestamp"].iloc[::20], status_numeric.iloc[::20], s=2)
    plt.yticks([0, 1, 2], ["NORMAL", "RECOVERING", "BROKEN"])
    plt.title("Machine Status Over Time")
    plt.tight_layout()
    plt.savefig(os.path.join(FIGURES_DIR, "06_status_over_time.png"), dpi=120)
    plt.close()

    log(f"Saved 6 EDA figures to {FIGURES_DIR}")


def evaluate_model(name, model, X_test, y_test, label_order):
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    precision, recall, f1, support = precision_recall_fscore_support(
        y_test, y_pred, labels=label_order, zero_division=0
    )
    macro_p, macro_r, macro_f1, _ = precision_recall_fscore_support(
        y_test, y_pred, average="macro", zero_division=0
    )
    weighted_f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)
    cm = confusion_matrix(y_test, y_pred, labels=label_order)

    per_class = {
        label_order[i]: {
            "precision": float(precision[i]),
            "recall": float(recall[i]),
            "f1": float(f1[i]),
            "support": int(support[i]),
        }
        for i in range(len(label_order))
    }

    result = {
        "model_name": name,
        "accuracy": float(acc),
        "macro_precision": float(macro_p),
        "macro_recall": float(macro_r),
        "macro_f1": float(macro_f1),
        "weighted_f1": float(weighted_f1),
        "per_class": per_class,
        "confusion_matrix": cm.tolist(),
        "confusion_matrix_labels": label_order,
    }
    log(f"{name}: accuracy={acc:.4f} macro_f1={macro_f1:.4f} weighted_f1={weighted_f1:.4f}")
    log(f"  per-class recall -> " + ", ".join(f"{k}={v['recall']:.3f}" for k, v in per_class.items()))
    return result


def main():
    t0 = time.time()
    os.makedirs(MODELS_DIR, exist_ok=True)
    os.makedirs(REPORTS_DIR, exist_ok=True)

    log(f"Loading dataset from {DATA_PATH}")
    df = load_raw_dataset(DATA_PATH)
    log(f"Loaded {len(df)} rows, {len(df.columns)} columns")

    dup_count = int(df.duplicated().sum())
    log(f"Duplicate rows: {dup_count}")
    if dup_count > 0:
        df = df.drop_duplicates()
        log(f"Dropped duplicates, {len(df)} rows remain")

    missing_pct = df[FEATURE_COLUMNS].isna().mean().mean()
    log(f"Average missing rate across sensor features: {missing_pct:.4%}")

    status_counts = df[TARGET_COLUMN].value_counts().to_dict()
    log(f"machine_status distribution: {status_counts}")

    run_eda(df)

    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]

    # See module docstring: SPLIT STRATEGY — stratified random split chosen
    # over chronological split specifically because of the 7-row BROKEN class.
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y
    )
    log(f"Train size: {len(X_train)}, Test size: {len(X_test)}")

    preprocessor = build_preprocessing_pipeline()
    X_train_proc = preprocessor.fit_transform(X_train)
    X_test_proc = preprocessor.transform(X_test)

    label_order = CLASS_LABELS

    # ---- Classification models ----
    models = {
        "DecisionTree": DecisionTreeClassifier(
            class_weight="balanced", random_state=RANDOM_STATE, max_depth=12
        ),
        "RandomForest": RandomForestClassifier(
            n_estimators=200, class_weight="balanced", random_state=RANDOM_STATE,
            max_depth=16, n_jobs=-1
        ),
    }

    evaluations = {}
    fitted_models = {}
    for name, clf in models.items():
        log(f"Training {name}...")
        clf.fit(X_train_proc, y_train)
        fitted_models[name] = clf
        evaluations[name] = evaluate_model(name, clf, X_test_proc, y_test, label_order)

    # Select production model by macro F1 (fair to the rare class), not accuracy.
    best_name = max(evaluations, key=lambda n: evaluations[n]["macro_f1"])
    best_model = fitted_models[best_name]
    log(f"Selected production classifier: {best_name} (macro_f1={evaluations[best_name]['macro_f1']:.4f})")

    # ---- Isolation Forest (trained on NORMAL rows only) ----
    log("Training Isolation Forest on NORMAL-labelled training rows...")
    normal_mask = (y_train == "NORMAL").values
    X_train_normal = X_train_proc[normal_mask]
    iso_forest = IsolationForest(
        n_estimators=200, contamination=0.02, random_state=RANDOM_STATE, n_jobs=-1
    )
    iso_forest.fit(X_train_normal)

    test_anomaly_pred = iso_forest.predict(X_test_proc)  # -1 anomaly, 1 normal
    anomaly_rate_by_class = {}
    for cls in label_order:
        mask = (y_test == cls).values
        if mask.sum() > 0:
            anomaly_rate_by_class[cls] = float((test_anomaly_pred[mask] == -1).mean())
    log(f"Isolation Forest anomaly rate by true class on test set: {anomaly_rate_by_class}")

    # ---- Feature importance (from best model, if tree-based) ----
    feature_importance = {}
    if hasattr(best_model, "feature_importances_"):
        importances = best_model.feature_importances_
        feature_importance = dict(
            sorted(zip(FEATURE_COLUMNS, importances.tolist()), key=lambda kv: kv[1], reverse=True)
        )

    # ---- Save artifacts ----
    joblib.dump(best_model, os.path.join(MODELS_DIR, "classifier.joblib"))
    joblib.dump(iso_forest, os.path.join(MODELS_DIR, "anomaly_model.joblib"))
    joblib.dump(preprocessor, os.path.join(MODELS_DIR, "preprocessor.joblib"))
    joblib.dump(FEATURE_COLUMNS, os.path.join(MODELS_DIR, "feature_columns.joblib"))

    metadata = {
        "model_name": best_name,
        "training_date": datetime.now(timezone.utc).isoformat(),
        "dataset_path": "data/sensor.csv",
        "dataset_size": int(len(df)),
        "training_size": int(len(X_train)),
        "test_size": int(len(X_test)),
        "feature_count": len(FEATURE_COLUMNS),
        "dropped_features": ["sensor_15 (100% missing in source data)"],
        "classes": label_order,
        "class_distribution_full_dataset": {k: int(v) for k, v in status_counts.items()},
        "split_strategy": "stratified_random_80_20 (see train.py docstring for rationale)",
        "evaluations": evaluations,
        "selected_model_metrics": evaluations[best_name],
        "isolation_forest": {
            "contamination": 0.02,
            "n_estimators": 200,
            "trained_on": "NORMAL-labelled training rows only",
            "test_anomaly_rate_by_true_class": anomaly_rate_by_class,
        },
        "feature_importance": feature_importance,
        "known_limitations": [
            "BROKEN class has only 7 total labelled examples in the source dataset; "
            "any BROKEN-class metric (precision/recall/F1) is statistically unreliable "
            "and should not be treated as a robust estimate of real-world performance.",
            "Stratified (not chronological) train/test split was used specifically so "
            "that BROKEN examples could appear in both partitions; this trades some risk "
            "of temporal leakage for the ability to evaluate the rare class at all.",
            "Isolation Forest flags statistically unusual sensor patterns; it does not "
            "identify the specific cause or fault type of an anomaly.",
            "This is a research/internship prototype, not a certified industrial control system.",
        ],
    }
    with open(os.path.join(MODELS_DIR, "model_metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    with open(os.path.join(REPORTS_DIR, "evaluation_report.json"), "w") as f:
        json.dump(evaluations, f, indent=2)

    elapsed = time.time() - t0
    log(f"Done in {elapsed:.1f}s. Artifacts saved to {MODELS_DIR}")
    log(f"Production classifier: {best_name}")
    return metadata


if __name__ == "__main__":
    main()
