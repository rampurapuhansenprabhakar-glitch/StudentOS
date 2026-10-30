# Project Limitations & Future Roadmap — StudentOS

## 1. Technical & Methodological Limitations

### A. Synthetic Training Data Generalization
- The supervised machine learning models (Ridge Regression and Gradient Boosting Classifier) are trained on 2,500 algorithmically generated synthetic engineering student records.
- While the synthetic generation incorporates domain relationships (correlating attendance, internal scores, and study consistency with CGPA), synthetic distributions cannot fully capture unexpected real-world grading curves, varying professor grading subjectivity, or institutional syllabus divergences.

### B. Self-Reported Metrics & Subjectivity
- Behavioral indicators such as daily study hours, focus ratings (1 to 5), and qualitative confidence are entered directly by the student.
- Self-reporting is subject to optimism bias, recall errors, and sporadic logging, which can temporarily skew consistency scores.

### C. Absence of Hardware Telemetry
- In strict adherence to software-only project boundaries, StudentOS does not utilize biometric sensors, smartwatches, or webcams to verify student study focus. All behavioral tracking is intentionally self-regulated.

### D. Counterfactual Linearity & Extrapolation
- The What-If simulation engine evaluates isolated parameter adjustments assuming other un-manipulated features remain constant (ceteris paribus). In reality, extreme increases in study hours may cause cognitive fatigue or diminish coding practice time if not properly balanced.

---

## 2. Future Development Roadmap

1. **Automated LMS & University Portal Integration:**
   - Develop secure OAuth connectors to institutional platforms (Moodle, Canvas, Google Classroom) to automatically sync lecture attendance and assignment deadlines.
2. **Competitive Programming Webhook Sync:**
   - Integrate public APIs for LeetCode, Codeforces, and GitHub to automatically verify problem submissions and coding streaks without manual entry.
3. **Multi-Semester Longitudinal Modeling:**
   - Transition from single-semester horizon projections to Recurrent Neural Networks (LSTM / GRU) or Time-Series Transformers that model 8-semester longitudinal graduation trajectories.
4. **Peer Benchmarking with Differential Privacy:**
   - Introduce anonymized cohort comparisons (e.g., comparing study consistency with branch percentiles) using local differential privacy ($\epsilon$-DP) to ensure individual grade confidentiality.
5. **Mobile Native Application:**
   - Package the client as a cross-platform React Native / Expo application with push notifications for lecture reminders and evening focus logging.
