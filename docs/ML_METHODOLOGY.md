# Machine Learning Methodology & Validation Report — StudentOS

## 1. Feature Engineering: The 10-Dimensional Vector

The machine learning models in StudentOS do not operate on raw unindexed inputs; they consume an engineered, clamped 10-dimensional feature vector synthesized from real student records:

| Index | Feature Name | Domain | Derivation Source |
| :---: | :--- | :---: | :--- |
| 1 | `previous_cgpa` | $[0.0, 10.0]$ | Previous semester SGPA or baseline CGPA |
| 2 | `attendance_rate` | $[0.0, 1.0]$ | Total attended / total conducted across active courses |
| 3 | `daily_study_hours` | $[0.0, 16.0]$ | Weighted average non-classroom study hours (past 14 days) |
| 4 | `assignment_completion_rate` | $[0.0, 1.0]$ | Completed submissions / total active assignments |
| 5 | `internal_assessment_avg` | $[0.0, 100.0]$ | Normalized mean percentage across mid-term/quiz marks |
| 6 | `study_consistency_score` | $[0.0, 100.0]$ | Reciprocal of daily study duration variance + logging frequency |
| 7 | `dsa_problems_solved` | $[0, 5000]$ | Cumulative count of algorithmic problems marked "Solved" |
| 8 | `coding_hours_per_week` | $[0.0, 60.0]$ | 7-day trailing velocity of competitive coding practice |
| 9 | `skill_gap_average` | $[0.0, 100.0]$ | Target proficiency minus current proficiency across tracked skills |
| 10 | `backlogs_count` | $[0, 20]$ | Cumulative count of failed courses currently un-cleared |

---

## 2. Regression Model: Performance Estimation

### Objective
To predict the student's prospective **Next Semester CGPA** on a continuous scale of $[0.0, 10.0]$.

### Model Selection & Benchmark Comparison
We benchmarked 4 regression architectures on an 80/20 train-test split ($N=2,500$ synthetic samples):

| Model Candidate | Validation $R^2$ Score | Validation RMSE | Inference Latency |
| :--- | :---: | :---: | :---: |
| **Ridge Regression ($\alpha=1.0$)** | **0.9034** | **0.2753** | **< 1.0 ms** |
| Random Forest Regressor ($n=100$) | 0.8912 | 0.2921 | 14.2 ms |
| Gradient Boosting Regressor | 0.8980 | 0.2831 | 8.5 ms |
| Dummy Baseline (Mean Predictor) | -0.0012 | 0.8841 | < 0.1 ms |

**Selection Decision:**  
`RidgeRegression` with feature standardization (`StandardScaler`) was selected as the primary estimator. It achieves superior $R^2$ generalization, provides stable feature coefficients without overfitting synthetic distributions, and delivers sub-millisecond inference for real-time slider updates in the simulator.

---

## 3. Classification Model: Early Risk Detection

### Objective
To classify the student's academic vulnerability into three actionable tiers:
- **Low Risk:** On track for graduation without academic debarment.
- **Moderate Risk:** At least one critical deficit (attendance between 65-75%, or internal marks $<50\%$).
- **High Risk:** Severe probability of course failure, debarment ($<65\%$ attendance), or multiple backlogs.

### Model Selection & Benchmark Comparison
Benchmarked on the same 80/20 stratified split:

| Model Candidate | Macro F1-Score | ROC-AUC (OVR) | Accuracy |
| :--- | :---: | :---: | :---: |
| **Gradient Boosting Classifier** | **0.8558** | **0.9788** | **89.2%** |
| Random Forest Classifier | 0.8420 | 0.9690 | 87.8% |
| Logistic Regression (L2 penalty) | 0.8211 | 0.9542 | 85.6% |

**Selection Decision:**  
`GradientBoostingClassifier` demonstrates superior non-linear boundary separation on class threshold edges (e.g. attendance dropping below 75%), yielding an outstanding ROC-AUC of 0.9788.

---

## 4. Model Persistence & Versioning
Trained model pipelines are serialized using `joblib` into `backend/artifacts/`:
- `performance_model.joblib`: Contains the fitted `StandardScaler` + `Ridge` pipeline, training metrics, and feature coefficients.
- `risk_model.joblib`: Contains the fitted `GradientBoostingClassifier`, label encoders, and training metrics.
- Artifacts are loaded as singletons via `app/ml/artifact_loader.py` with DataFrame feature name validation to prevent silent feature permutation bugs.
