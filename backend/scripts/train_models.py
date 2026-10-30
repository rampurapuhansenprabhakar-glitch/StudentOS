import os
import sys

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), "..")))

from app.ml.dataset_generator import generate_synthetic_dataset
from app.ml.performance_model import train_academic_performance_model
from app.ml.risk_model import train_academic_risk_model

def run_training_pipeline():
    print("=" * 60)
    print("STUDENTOS MACHINE LEARNING TRAINING PIPELINE")
    print("=" * 60)
    
    data_dir = os.path.realpath(os.path.join(os.path.dirname(__file__), "../data/synthetic"))
    artifacts_dir = os.path.realpath(os.path.join(os.path.dirname(__file__), "../artifacts"))
    
    print(f"\n[Step 1/3] Generating reproducible synthetic dataset (n=2500, seed=42)...")
    df, dataset_path = generate_synthetic_dataset(
        n_samples=2500,
        random_seed=42,
        output_dir=data_dir
    )
    print(f"Dataset generated and saved to: {dataset_path}")
    print(f"Features: {list(df.columns)}")
    
    print(f"\n[Step 2/3] Training and evaluating Academic Performance Regression Models...")
    perf_meta = train_academic_performance_model(
        df=df,
        artifacts_dir=artifacts_dir,
        random_seed=42
    )
    print(f"Best Regression Model: {perf_meta['model_name']}")
    print(f"Evaluations across candidates:")
    for m_name, metrics in perf_meta["all_candidate_metrics"].items():
        print(f"  - {m_name:20s}: MAE={metrics['MAE']:.4f}, RMSE={metrics['RMSE']:.4f}, R²={metrics['R2']:.4f}")
    print(f"Feature Importances:")
    for feat, imp in sorted(perf_meta["feature_importances"].items(), key=lambda x: x[1], reverse=True)[:5]:
        print(f"  * {feat:30s}: {imp:.4f}")
        
    print(f"\n[Step 3/3] Training and evaluating Academic Risk Classification Models...")
    risk_meta = train_academic_risk_model(
        df=df,
        artifacts_dir=artifacts_dir,
        random_seed=42
    )
    print(f"Best Risk Model: {risk_meta['model_name']}")
    print(f"Evaluations across candidates:")
    for m_name, metrics in risk_meta["all_candidate_metrics"].items():
        print(f"  - {m_name:25s}: Accuracy={metrics['Accuracy']:.4f}, Precision={metrics['Precision']:.4f}, Recall={metrics['Recall']:.4f}, F1={metrics['F1']:.4f}, ROC_AUC={metrics['ROC_AUC']:.4f}")
        
    print("\n" + "=" * 60)
    print("TRAINING COMPLETE! Model artifacts saved to:", artifacts_dir)
    print("=" * 60)

if __name__ == "__main__":
    run_training_pipeline()
