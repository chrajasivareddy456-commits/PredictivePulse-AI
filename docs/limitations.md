# Limitations

1. **BROKEN class: 7 examples total, 2 in the test set.** Any BROKEN-class precision/recall/F1 is not a statistically reliable estimate. Do not treat this prototype's BROKEN-detection as production-ready.
2. **Split strategy tradeoff.** A stratified (not chronological) split was used so BROKEN could appear in the test set at all; this trades away some protection against temporal leakage between near-in-time train/test rows.
3. **No real multi-machine data.** `DEFAULT-PUMP` is a software-level logical profile, not a claim that the dataset contains multiple physical machines.
4. **Isolation Forest limitation.** It flags statistically unusual patterns; it does not diagnose the specific physical cause of an anomaly.
5. **Not a certified control system.** This is a decision-support prototype. No safety, compliance, or industrial-certification claims are made.
6. **No real-time streaming.** Data enters the system via manual form entry or CSV upload, not a live sensor feed.
7. **MongoDB live-flow validation.** The end-to-end register→login→analyze→history flow against a real database was not executed in the build environment (no network path to MongoDB Atlas, and the in-memory MongoDB test binary could not be downloaded). It must be verified locally with a real `MONGO_URI`. Every non-DB component (ML pipeline, FastAPI, Node's graceful degradation without a DB, frontend build) was actually run and verified.
