import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple
from sklearn.model_selection import train_test_split
from sklearn.dummy import DummyRegressor
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score
from app.ml.features import FEATURE_NAMES

def train_academic_performance_model(
    df: pd.DataFrame,
    artifacts_dir: str = "artifacts",
    random_seed: int = 42
) -> Dict[str, Any]:
    """
    Trains and compares candidate regression models to predict future academic CGPA.
    Evaluates DummyRegressor, Ridge, RandomForest, and GradientBoosting using proper validation.
    Saves the best model artifact along with exact measured metrics and feature importances.
    """
    X = df[FEATURE_NAMES]
    y = df["target_next_cgpa"]
    
    # Train / Test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=random_seed
    )
    
    candidates = {
        "DummyBaseline": DummyRegressor(strategy="mean"),
        "RidgeRegression": Ridge(alpha=1.0, random_state=random_seed),
        "RandomForest": RandomForestRegressor(n_estimators=100, max_depth=8, random_state=random_seed, n_jobs=-1),
        "GradientBoosting": GradientBoostingRegressor(n_estimators=100, max_depth=4, learning_rate=0.08, random_state=random_seed)
    }
    
    model_evaluations = {}
    best_model_name = None
    best_rmse = float("inf")
    trained_models = {}
    
    for name, model in candidates.items():
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        
        mae = float(mean_absolute_error(y_test, y_pred))
        rmse = float(root_mean_squared_error(y_test, y_pred))
        r2 = float(r2_score(y_test, y_pred))
        
        model_evaluations[name] = {
            "MAE": round(mae, 4),
            "RMSE": round(rmse, 4),
            "R2": round(r2, 4)
        }
        trained_models[name] = model
        
        if rmse < best_rmse:
            best_rmse = rmse
            best_model_name = name

    best_model = trained_models[best_model_name]
    
    # Extract feature importance if available
    feature_importances = {}
    if hasattr(best_model, "feature_importances_"):
        for feat, imp in zip(FEATURE_NAMES, best_model.feature_importances_):
            feature_importances[feat] = round(float(imp), 4)
    elif hasattr(best_model, "coef_"):
        for feat, coef in zip(FEATURE_NAMES, best_model.coef_):
            feature_importances[feat] = round(float(abs(coef)), 4)
            
    # Serialize best artifact
    os.makedirs(artifacts_dir, exist_ok=True)
    artifact_path = os.path.join(artifacts_dir, "performance_model.joblib")
    joblib.dump(best_model, artifact_path)
    
    metadata = {
        "model_name": best_model_name,
        "version": "v1.0",
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "features": FEATURE_NAMES,
        "target": "target_next_cgpa",
        "all_candidate_metrics": model_evaluations,
        "best_metrics": model_evaluations[best_model_name],
        "feature_importances": feature_importances,
        "is_synthetic": True,
        "trained_at": pd.Timestamp.now().isoformat(),
        "disclaimer": "Trained on controlled synthetic data for demonstration and scenario simulation. Not a real-world scientific certainty."
    }
    
    meta_path = os.path.join(artifacts_dir, "performance_model_meta.json")
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)
        
    return metadata
