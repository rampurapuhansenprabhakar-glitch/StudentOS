# Dataset Documentation & Generation Methodology — StudentOS

## 1. Transparency Statement
In adherence to Section 3.4 of the Project Specification, **all training data used in StudentOS is synthetic**. Real student educational records are legally protected under educational confidentiality acts and institutional data protection policies. 

The dataset is generated via a reproducible script (`backend/app/ml/dataset_generator.py`) to simulate representative behavioral and academic distributions observed in undergraduate engineering programs.

---

## 2. Dataset Specifications
- **File Location:** `backend/data/synthetic/student_academic_records.csv`
- **Total Records:** 2,500 samples
- **Feature Count:** 10 input attributes + 2 target labels
- **Random Seed:** `42` (for deterministic reproducibility)

---

## 3. Attribute Distributions & Generation Heuristics

1. **`previous_cgpa`:**
   - Truncated normal distribution: $\mu = 7.2$, $\sigma = 1.1$, clamped to $[4.0, 9.8]$.
2. **`attendance_rate`:**
   - Beta distribution skewed towards compliance: mode $\approx 0.82$, range $[0.40, 1.0]$.
3. **`daily_study_hours`:**
   - Gamma distribution: shape $k = 3.0$, scale $\theta = 1.0$, mean $\approx 3.0$ hours/day.
4. **`assignment_completion_rate`:**
   - Correlated with attendance ($\rho = 0.65$), range $[0.20, 1.0]$.
5. **`internal_assessment_avg`:**
   - Linear combination of prior CGPA and attendance with Gaussian noise ($\sigma = 4.0$).
6. **`study_consistency_score`:**
   - Uniform distribution with higher density in $[60, 95]$ interval.
7. **`dsa_problems_solved`:**
   - Log-normal distribution reflecting competitive coding tiers (median $\approx 85$ problems, tail extending to 600+).
8. **`coding_hours_per_week`:**
   - Proportional to DSA problems solved, mean $\approx 7.5$ hours/week.
9. **`skill_gap_average`:**
   - Inverse relationship to study consistency and practice volume, mean $\approx 32\%$.
10. **`backlogs_count`:**
    - Poisson distribution with $\lambda = 0.35$ (majority having 0, subset having 1-3).

---

## 4. Target Label Formulations

### Continuous Target (`next_cgpa`):
Calculated using a weighted polynomial combination reflecting domain educational dynamics:
$$\text{Next CGPA} = 0.40 \cdot \text{prior\_cgpa} + 0.25 \cdot (\text{internal\_avg} / 10) + 0.15 \cdot (\text{attendance} \cdot 10) + 0.10 \cdot (\text{study\_hours} / 1.5) + \epsilon$$
Where $\epsilon \sim \mathcal{N}(0, 0.25)$ represents unobserved external factors.

### Categorical Target (`academic_risk_level`):
Determined through boundary risk conditions:
- **High Risk:** $\text{attendance} < 0.65$ OR $\text{internal\_avg} < 45.0$ OR $\text{backlogs} \ge 2$
- **Moderate Risk:** $0.65 \le \text{attendance} < 0.75$ OR $45.0 \le \text{internal\_avg} < 60.0$ OR $\text{backlogs} = 1$
- **Low Risk:** All indicators above baseline thresholds.
