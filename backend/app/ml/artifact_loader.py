import os
import json
import joblib
import numpy as np
from typing import Dict, Any, Tuple, Optional
from app.ml.features import FEATURE_NAMES, validate_and_sanitize_features
from app.core.config import settings
from app.core.logging import logger

class ModelArtifactLoader:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelArtifactLoader, cls).__new__(cls)
            cls._instance._init_models()
        return cls._instance

    def _init_models(self):
        self.perf_model = None
        self.risk_model = None
        self.perf_meta = {}
        self.risk_meta = {}
        self.load_artifacts()

    def load_artifacts(self):
        artifacts_dir = settings.ML_ARTIFACTS_DIR
        perf_path = os.path.join(artifacts_dir, "performance_model.joblib")
        perf_meta_path = os.path.join(artifacts_dir, "performance_model_meta.json")
        risk_path = os.path.join(artifacts_dir, "risk_model.joblib")
        risk_meta_path = os.path.join(artifacts_dir, "risk_model_meta.json")

        if os.path.exists(perf_path):
            try:
                self.perf_model = joblib.load(perf_path)
                logger.info(f"Loaded performance model from {perf_path}")
            except Exception as e:
                logger.error(f"Failed to load performance model: {e}")
        
        if os.path.exists(perf_meta_path):
            try:
                with open(perf_meta_path, "r") as f:
                    self.perf_meta = json.load(f)
            except Exception as e:
                logger.error(f"Failed to load performance meta: {e}")

        if os.path.exists(risk_path):
            try:
                self.risk_model = joblib.load(risk_path)
                logger.info(f"Loaded risk model from {risk_path}")
            except Exception as e:
                logger.error(f"Failed to load risk model: {e}")

        if os.path.exists(risk_meta_path):
            try:
                with open(risk_meta_path, "r") as f:
                    self.risk_meta = json.load(f)
            except Exception as e:
                logger.error(f"Failed to load risk meta: {e}")

    def predict_performance(self, raw_features: Dict[str, Any]) -> Tuple[float, Dict[str, Any]]:
        sanitized = validate_and_sanitize_features(raw_features)
        X = np.array([sanitized])

        if self.perf_model is not None:
            pred = float(self.perf_model.predict(X)[0])
            pred = max(0.0, min(10.0, pred))
            pred = round(pred, 2)
            meta = {
                "model_name": self.perf_meta.get("model_name", "TrainedRegressor"),
                "version": self.perf_meta.get("version", "v1.0"),
                "source": "ml_trained_model",
                "features_used": dict(zip(FEATURE_NAMES, sanitized))
            }
            return pred, meta
        else:
            # Domain-grounded baseline fallback if model file is not present
            prev_cgpa = sanitized[0]
            internal_pct = sanitized[2]
            att_pct = sanitized[3]
            study_h = sanitized[5]
            
            baseline = (prev_cgpa * 0.6) + (internal_pct / 10.0 * 0.25) + (att_pct / 100.0 * 0.8) + (min(study_h, 4.0) * 0.15)
            baseline = max(0.0, min(10.0, round(baseline, 2)))
            meta = {
                "model_name": "DomainBaselineEstimator",
                "version": "baseline_v1",
                "source": "analytical_baseline",
                "features_used": dict(zip(FEATURE_NAMES, sanitized))
            }
            return baseline, meta

    def predict_risk(self, raw_features: Dict[str, Any]) -> Tuple[str, float, Dict[str, Any]]:
        sanitized = validate_and_sanitize_features(raw_features)
        X = np.array([sanitized])

        if self.risk_model is not None:
            pred_class = int(self.risk_model.predict(X)[0])
            prob = 0.5
            if hasattr(self.risk_model, "predict_proba"):
                prob = float(self.risk_model.predict_proba(X)[0][1])
            
            prob = round(prob, 3)
            if prob < 0.35:
                level = "Low"
            elif prob < 0.65:
                level = "Moderate"
            else:
                level = "High"

            meta = {
                "model_name": self.risk_meta.get("model_name", "TrainedClassifier"),
                "version": self.risk_meta.get("version", "v1.0"),
                "source": "ml_trained_model",
                "probability": prob
            }
            return level, prob, meta
        else:
            # Rule-based fallback
            att_pct = sanitized[3]
            backlogs = sanitized[7]
            internal_avg = sanitized[2]
            
            if att_pct < 65.0 or backlogs >= 2 or internal_avg < 45.0:
                level = "High"
                prob = 0.85
            elif att_pct < 75.0 or backlogs == 1 or internal_avg < 60.0:
                level = "Moderate"
                prob = 0.50
            else:
                level = "Low"
                prob = 0.15

            meta = {
                "model_name": "RuleBasedRiskAnalyzer",
                "version": "rule_v1",
                "source": "rule_indicator",
                "probability": prob
            }
            return level, prob, meta

    def get_metadata(self) -> Dict[str, Any]:
        return {
            "performance_model": self.perf_meta,
            "risk_model": self.risk_meta,
            "feature_names": FEATURE_NAMES,
            "models_loaded": {
                "performance_model": self.perf_model is not None,
                "risk_model": self.risk_model is not None
            }
        }

model_loader = ModelArtifactLoader()
