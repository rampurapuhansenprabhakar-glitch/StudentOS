# B.Tech Viva Voce & Defense Preparation Guide — StudentOS

Comprehensive technical questions and authoritative answers prepared for external examiners, project guides, and evaluation committees.

---

## 1. Conceptual & Domain Questions

### Q1: What makes StudentOS a "Digital Twin" rather than a typical dashboard or student portal?
**Answer:**  
A conventional portal is a passive, historical record store. A **Digital Twin** is a dynamic, evolving virtual representation of a physical entity (here, a student). StudentOS:
1. Continuously captures multi-dimensional operational metrics (attendance, internal marks, daily study durations, focus ratings, coding velocity).
2. Maintains a standardized, real-time internal state vector (the 10-dimensional Derived Feature Vector).
3. Uses this state to continuously execute predictive models forecasting future system behavior (next semester CGPA and risk level).
4. Provides a counterfactual sandbox (*What-If Simulator*) where prospective control adjustments can be evaluated in an isolated virtual model before taking action in the real world.

### Q2: Why is the tagline "Track. Predict. Simulate. Improve." central to the system?
**Answer:**  
It outlines the 4-phase closed-loop feedback cycle of the system:
- **Track:** Multi-dimensional logging of academic evaluations, attendance, study habits, and coding.
- **Predict:** Machine learning models forecast future CGPA and classify early debarment/failure risks.
- **Simulate:** Counterfactual sandbox allows testing prospective behavioral adjustments without touching real records.
- **Improve:** Prescriptive, prioritized recommendations and automated study schedules guide targeted student action.

---

## 2. Machine Learning & Analytical Questions

### Q3: Why did you choose Ridge Regression over Random Forest or Deep Neural Networks for CGPA prediction?
**Answer:**  
In our empirical benchmarking across 2,500 samples:
1. **Generalization:** Ridge Regression achieved an $R^2$ score of $0.9034$ and RMSE of $0.2753$, outperforming Random Forest ($R^2 = 0.8912$). $L2$ regularization prevents overfitting to synthetic noise.
2. **Inference Latency:** Ridge executes inference in $<1.0\text{ ms}$, whereas Random Forests require $\approx 14\text{ ms}$. Sub-millisecond latency is essential for providing real-time slider responsiveness in the What-If Simulator.
3. **Interpretability:** Ridge provides direct linear coefficient weights, allowing the system to explain which features drive predictions. Deep neural networks would be excessive for a 10-dimensional tabular dataset and introduce black-box opacity.

### Q4: Why is Gradient Boosting used for Academic Risk Classification?
**Answer:**  
Academic risk classification involves critical non-linear boundary thresholds (e.g. attendance dropping below 75% or 65% triggers abrupt institutional debarment). Gradient Boosting excels at fitting sequential decision stumps along these sharp boundaries, achieving an ROC-AUC of $0.9788$ and Macro F1 of $0.8558$.

### Q5: How do you address the ethical use of AI and synthetic training data?
**Answer:**  
In strict compliance with educational privacy laws, live student records cannot be distributed or used without consent. We generated 2,500 synthetic engineering student profiles using domain distributions. In accordance with honest AI principles:
- Synthetic data is explicitly labeled in the UI, documentation, and database.
- Predictions are presented as analytical projections, not guaranteed outcomes.
- The system distinguishes between ML inference, statistical trends, rule heuristics, and simulations.

---

## 3. Architecture & Software Engineering Questions

### Q6: How does the What-If Simulator ensure that real student records are not accidentally modified?
**Answer:**  
The `SimulationService` retrieves the student's baseline feature state and immediately executes an in-memory `copy.deepcopy()`. The prospective parameters from the client are applied only to this ephemeral copy. Inference is run on the clone, and results are returned directly without ever calling `db.commit()` on the student's actual database tables.

### Q7: How is user data isolated in the backend?
**Answer:**  
Every incoming request is authenticated using JWT tokens verified via FastAPI dependency injection (`get_current_user`). All database queries explicitly filter by `user_id == current_user.id`, ensuring a student cannot access or modify another student's records by manipulating IDs in URLs or request payloads.

### Q8: What database migrations framework is used?
**Answer:**  
Alembic is utilized alongside SQLAlchemy. Schema revisions are version-controlled in `backend/alembic/versions/` and applied programmatically using `alembic upgrade head`, ensuring consistent database schema reproduction across environments.

### Q9: What happens if an external LLM (Ollama) is offline or unavailable?
**Answer:**  
StudentOS implements a local-first fallback architecture. The AI Advisory Assistant uses a deterministic, rule-grounded response engine that directly queries the student's live relational records to provide advice. Ollama is completely optional and will never crash or block the application if uninstalled or stopped.
