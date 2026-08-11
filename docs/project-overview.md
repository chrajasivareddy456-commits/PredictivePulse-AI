# Project Overview

**PredictivePulse AI** is an AI-powered predictive maintenance prototype built around the IBM internship theme "Factory Sensor Anomaly & Failure Diagnostics System." It uses the supplied Pump Sensor Data for Predictive Maintenance (`sensor.csv`, 220,320 rows, 52 sensors) to:

1. Classify known machine states (NORMAL / RECOVERING / BROKEN) with a supervised model.
2. Detect unknown/unusual operational behavior with Isolation Forest.
3. Combine both into a single risk level and maintenance recommendation.
4. Persist machine profiles, sensor history, and prediction history for a small factory-monitoring web application.

See the root `README.md` for full setup instructions and actual results. This file exists to satisfy the documented project structure; deeper detail on each subsystem lives in the other `docs/*.md` files.
