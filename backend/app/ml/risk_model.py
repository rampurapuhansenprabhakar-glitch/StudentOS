import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from app.ml.features import FEATURE_NAMES

def train_academic_risk_model(
    df: pd.DataFrame,
    artifacts_dir: str = "artifacts",
    random_seed: int = 42
) -> Dict[str, Any]:
    """
    Trains and compares classification models for early academic risk identification.
    Evaluates Logistic Regression, Random Forest, and Gradient Boosting Classifiers.
    Computes Accuracy, Precision, Recall, F1-score, and ROC-AUC.
    """
    X = df[FEATURE_NAMES]
    y = df["target_academic_risk"]
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=random_seed, stratify=y
    )
    
    candidates = {
        "LogisticRegression": LogisticRegression(max_iter=1000, random_state=random_seed),
        "RandomForestClassifier": RandomForestClassifier(n_estimators=100, max_depth=6, random_state=random_seed, n_jobs=-1),
        "GradientBoostingClassifier": GradientBoostingClassifier(n_estimators=100, max_depth=3, learning_rate=0.08, random_state=random_seed)
    }
    
    model_evaluations = {}
    best_model_name = None
    best_f1 = -1.0
    trained_models = {}
    
    for name, model in candidates.items():
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test)[:, 1] if hasattr(model, "predict_proba") else y_pred
        
        acc = float(accuracy_score(y_test, y_pred))
        prec = float(precision_score(y_test, y_pred, zero_division=0))
        rec = float(recall_score(y_test, y_pred, zero_division=0))
        f1 = float(f1_score(y_test, y_pred, zero_division=0))
        roc_auc = float(roc_auc_score(y_test, y_prob))
        
        model_evaluations[name] = {
            "Accuracy": round(acc, 4),
            "Precision": round(prec, 4),
            "Recall": round(rec, 4),
            "F1": round(f1, 4),
            "ROC_AUC": round(roc_auc, 4)
        }
        trained_models[name] = model
        
        if f1 > best_f1:
            best_f1 = f1
            best_model_name = name

    best_model = trained_models[best_model_name]
    
    feature_importances = {}
    if hasattr(best_model, "feature_importances_"):
        for feat, imp in zip(FEATURE_NAMES, best_model.feature_importances_):
            feature_importances[feat] = round(float(imp), 4)
    elif hasattr(best_model, "coef_"):
        for feat, coef in zip(FEATURE_NAMES, best_model.coef_[0]):
            feature_importances[feat] = round(float(abs(coef)), 4)
            
    os.makedirs(artifacts_dir, exist_ok=True)
    artifact_path = os.path.join(artifacts_dir, "risk_model.joblib")
    joblib.dump(best_model, artifact_path)
    
    metadata = {
        "model_name": best_model_name,
        "version": "v1.0",
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "features": FEATURE_NAMES,
        "target": "target_academic_risk",
        "all_candidate_metrics": model_evaluations,
        "best_metrics": model_evaluations[best_model_name],
        "feature_importances": feature_importances,
        "is_synthetic": True,
        "trained_at": pd.Timestamp.now().isoformat(),
        "disclaimer": "Academic risk classification based on synthetic baseline data. Results are supportive indicators, not deterministic student labels."
    }
    
    meta_path = os.path.join(artifacts_dir, "risk_model_meta.json")
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)
        
    return metadata
