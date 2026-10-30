# B.Tech Innovative Project Report

**Project Title:** StudentOS: An AI-Powered Digital Twin for Personalized Student Success  
**Domain:** Artificial Intelligence, Machine Learning, Educational Technology, Predictive Analytics  
**Academic Degree:** Bachelor of Technology in Computer Science and Engineering (AIML)  
**Academic Year:** 3rd Year / 6th Semester  

---

## Abstract
Traditional academic management systems function merely as static record repositories, notifying students of deficits only after irreversible consequences (such as course failure or attendance debarment) have materialized. This project presents **StudentOS**, a full-stack, local-first platform that establishes an evolving **Digital Twin** for undergraduate engineering students. Moving beyond descriptive statistics, StudentOS continuously aggregates multi-dimensional academic records, lecture attendance, self-directed study logs, and competitive coding milestones into a standardized 10-dimensional feature vector. 

Supervised machine learning algorithms—specifically `RidgeRegression` ($R^2 = 0.903$, $\text{RMSE} = 0.275$) and `GradientBoostingClassifier` ($\text{Macro } F1 = 0.856$, $\text{ROC-AUC} = 0.979$)—are deployed to compute prospective next-semester CGPA projections and multi-class early risk indicators. Furthermore, the system incorporates an isolated **Counterfactual What-If Simulation Sandbox**, enabling students to experiment with prospective behavioral adjustments in an ephemeral memory space without mutating production records. Complemented by deterministic rule-based recommendations and automated study schedule generation, StudentOS demonstrates how digital twin engineering can foster self-regulated learning and measurable academic success.

---

## 1. Introduction & Motivation
Undergraduate engineering curricula impose rigorous demands spanning core coursework, lab evaluations, continuous internal assessments, and independent technical skill development (e.g. Data Structures and Algorithms). Students frequently experience academic attrition due to the absence of unified visibility and proactive guidance. 

The central paradigm of StudentOS is:  
> *"What could happen if I change my current habits, and what specific actions should I take to improve my future?"*

By conceptualizing the student as an evolving dynamic system, StudentOS bridges the gap between historical tracking and proactive, prescriptive intervention.

---

## 2. System Architecture & Modules

### A. Modular Design
1. **Presentation Layer:** Next.js 15 (App Router), React 19, TypeScript strict mode, Tailwind CSS, Recharts.
2. **Application Layer:** FastAPI async web server, Argon2 password hashing, JWT session security.
3. **Data Layer:** SQLAlchemy ORM, Alembic schema migrations, SQLite relational persistence.
4. **Analytical & ML Layer:** scikit-learn feature standardizers, Ridge Regression, Gradient Boosting, in-memory deep-copy simulation sandbox.

### B. Functional Modules
- **Academic & Attendance Trackers:** Continuous evaluation recording with threshold warning alerts and math calculators.
- **Study & Coding Trackers:** Habit diaries tracking study durations, focus ratings, DSA solve counts, and active streaks.
- **Digital Twin Engine:** Temporal state synthesis, completeness metrics, and historical trajectory audit.
- **What-If Simulator:** Interactive counterfactual sliders providing instant side-by-side impact deltas.
- **Intelligent Planner:** Algorithmic schedule generator distributing hours across credit weightings and weak subjects.
- **Advisory Assistant:** Deterministic rule-grounded chat advisor querying live database context.

---

## 3. Machine Learning Methodology
- **Dataset:** 2,500 reproducibly generated synthetic records modeling undergraduate engineering distributions.
- **Feature Vector:** Clamped 10-dimensional representation capturing academic, behavioral, and technical velocity.
- **Regression Pipeline:** Ridge Regression with $L2$ regularization ($\alpha=1.0$) chosen for superior generalization ($R^2 = 0.903$) and sub-millisecond inference latency.
- **Classification Pipeline:** Multi-class Gradient Boosting Classifier delivering non-linear boundary separation on critical risk edges ($\text{ROC-AUC} = 0.979$).

---

## 4. Experimental Results & Verification
- **Pytest Backend Verification:** 9 automated test cases covering authentication, relational operations, digital twin synthesis, and simulation sandboxes (100% pass rate).
- **TypeScript Static Verification:** Strict compiler checks passing with zero type discrepancies.
- **Next.js Production Build:** All 23 static and dynamic routes compiled, bundled, and optimized without errors.

---

## 5. Conclusion
StudentOS demonstrates that applying digital twin principles to educational technology transforms passive grade monitoring into an active, foresight-driven self-regulation platform. By uniting rigorous machine learning, transparent simulation sandboxes, and honest AI disclosures, the project provides a robust, ethical engineering foundation for personalized student success.
