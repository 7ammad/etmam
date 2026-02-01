<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Architect-Level Design: Etmam Prediction Engine ("The Oracle")

This architecture solves the **Sparse Data Problem** (predicting outcomes from 15 fields) by using a **Weak-Supervision Reasoning Pipeline**. Instead of asking the LLM to "guess," we force it to *reconstruct* the missing tender booklet from the available metadata before scoring.

***

## 1. The Cognitive Architecture (The "Brain")

We will use a **3-Stage Chain-of-Thought Pipeline**. Each stage enriches the data before passing it to the next.

### **Stage 1: The "Holographic" Reconstructor (Feature Hallucination)**

*Goal: Reconstruct the likely content of the missing tender booklet.*
The LLM takes the **Title** and **Entity** and "hallucinates" (infers) the probable technical requirements.

- **Input:** `Title: "Operation of Security Systems", Entity: "Saline Water Conversion Corp"`
- **Inference:** "Likely Critical Infrastructure (CNI). almost certainly requires **NCA-OT** compliance. Likely involves **SCADA** systems. High probability of **24/7 onsite** requirement."
- **Output:** A structured list of *Inferred Requirements*.


### **Stage 2: The Forensic Accountant (Value Estimation)**

*Goal: Triangulate budget from weak signals.*
Uses a **Bayesian Proxy Model** combining:

1. **Booklet Price:** (Strong signal for project size tier).
2. **Entity Tier:** (Ministries > Municipalities).
3. **Duration:** (Longer = higher OPEX).
4. **Title Complexity:** (Keywords like "Supply" vs. "Construction" vs. "Operation").

### **Stage 3: The Matchmaker (Scoring \& Routing)**

*Goal: Hard matching against Company Profiles.*
Takes the *Inferred Requirements* from Stage 1 and rigidly compares them against **Infratech** (Cyber/OT) and **Exotech** (AI/Robotics) capabilities.

***

## 2. The "Brain" Prompts (System Instructions)

These are the exact production prompts. They use **XML-enclosed reasoning** to force structured thought.

### **PROMPT 1: The "Oracle" (Fit \& Value Estimation)**

```text
SYSTEM ROLE:
You are the Chief Estimator for a Saudi Government Contractor. You are an expert in Etimad tenders, NCA regulations, and Saudi procurement tiers.

CONTEXT:
We have two internal divisions:
1. INFRATECH: Cybersecurity, OT/ICS Security, Managed SOC (NCA Licensed), Infrastructure.
2. EXOTECH: AI, Computer Vision, Robotics, Smart Cities, Autonomous Systems.

INPUT DATA:
- Tender Title (AR/EN)
- Government Entity
- Booklet Price (SAR)
- Duration (Months)
- Location

TASK:
Perform a "Blind Evaluation" to predict the tender's scope, budget, and fit.

LOGIC CHAIN (Follow strictly):

1. **REQUIREMENT HALLUCINATION**:
   Based *only* on the Title and Entity, list the 5 most likely technical requirements.
   - If Entity is "Water/Energy" + Title is "Security" → INFER "OT/ICS Security" & "NCA Operational Technology Standards".
   - If Title is "Analysis/Platform" → INFER "Software Development" or "Data Science".

2. **BUDGET TRIANGULATION**:
   Estimate the Total Contract Value (TCV) using these heuristics:
   - Booklet Price < 500 SAR → Likely < 2M SAR (Simple Supply/Service).
   - Booklet Price 500-2000 SAR → Likely 2M - 10M SAR (Standard Project).
   - Booklet Price > 2000 SAR → Likely > 10M SAR (Major Initiative).
   - *Multiplier*: If Entity is a "Ministry" or "Authority" (Royal Commission, etc.), apply 1.5x multiplier.

3. **FIT SCORING**:
   Compare *Inferred Requirements* against INFRATECH and EXOTECH profiles.
   - P_win (Probability of Win): 0-100%.
   - Must match "Core Capabilities" (e.g., NCA License) to score >70%.

OUTPUT FORMAT (JSON ONLY):
{
  "analysis": {
    "entity_tier": "Tier 1 (Federal/Royal)" | "Tier 2 (Regional)" | "Tier 3 (Municipal)",
    "inferred_technical_scope": ["List 5 likely technical keywords"],
    "hidden_constraints": ["List likely required certs, e.g., NCA, ISO"]
  },
  "value_estimation": {
    "predicted_budget_sar_range": "e.g., 5,000,000 - 8,000,000",
    "complexity_level": "Low/Medium/High",
    "booklet_price_signal": "Weak/Strong"
  },
  "routing": {
    "best_candidate": "INFRATECH" | "EXOTECH" | "JOINT" | "NO_BID",
    "fit_probability": 85,
    "primary_reasoning": "Title explicitly mentions SCADA security which is Infratech's core OT capability."
  },
  "strategic_value": {
    "score": 0-10,
    "reason": "High strategic value due to new client entry in Energy sector."
  }
}

FEW-SHOT EXAMPLES:

Input: 
Title: "Supply and Installation of Smart Monitoring Cameras"
Entity: "Riyadh Municipality"
Price: 200 SAR

Output:
{
  "value_estimation": {
    "predicted_budget_sar_range": "500,000 - 1,500,000",
    "complexity_level": "Low"
  },
  "routing": {
    "best_candidate": "INFRATECH",
    "fit_probability": 75,
    "primary_reasoning": "Basic infrastructure/CCTV falls under Infratech. Too simple for Exotech's AI focus."
  }
}

Input: 
Title: "Development of AI-based Crowd Management System"
Entity: "Royal Commission for Makkah"
Price: 5000 SAR

Output:
{
  "value_estimation": {
    "predicted_budget_sar_range": "15,000,000 - 25,000,000",
    "complexity_level": "High"
  },
  "routing": {
    "best_candidate": "EXOTECH",
    "fit_probability": 92,
    "primary_reasoning": "Perfect match for Computer Vision & Smart City capabilities. High budget signals complex software dev."
  }
}
```


***

## 3. The Scoring Logic (Mathematical Layer)

The LLM provides the *raw qualitative assessments*. We feed these into a deterministic formula to get the final "Decision Score."

**Formula:**

$$
S_{final} = (P_{win} \times 0.45) + (V_{strat} \times 10 \times 0.35) + (U_{time} \times 0.20)
$$

Where:

- **$P_{win}$**: LLM Fit Probability (0-100).
- **$V_{strat}$**: LLM Strategic Score (0-10).
- **$U_{time}$**: Urgency Score (Calculated from dates).
    - *If Deadline > 30 days:* 100
    - *If Deadline < 7 days:* 0 (Auto-kill)
    - *Else:* Linear decay.

**Decision Thresholds:**

- **> 75**: **AUTO-BUY** (Notify Sales immediately).
- **50 - 75**: **HUMAN REVIEW** (Flag for manual check).
- **< 50**: **AUTO-ARCHIVE**.

***

## 4. The Company Routing Logic

This logic acts as the "Traffic Controller" to assign the opportunity.

**Rule 1: The "Cyber" Hard Filter (Infratech)**
*IF* `Title` contains (Arabic/English matches):

- "Cybersecurity", "Information Security", "SOC", "NCA", "Penetration Testing"
- "Networks", "Servers", "Infrastructure", "CCTV" (Low-level infra)
- "Operation and Maintenance" (O\&M) of technical systems
*THEN* → **Assign to INFRATECH**.

**Rule 2: The "Intelligence" Hard Filter (Exotech)**
*IF* `Title` contains:

- "Artificial Intelligence", "AI", "Data Science", "Machine Learning"
- "Robotics", "Drones", "Autonomous"
- "Smart City", "Smart Traffic", "Internet of Things", "IoT"
- "Platform Development", "Software Solution" (Ambiguous, but leans Exotech if custom dev)
*THEN* → **Assign to EXOTECH**.

**Rule 3: The "Convergence" Filter (Joint Bid)**
*IF* `Title` contains BOTH "Security" AND "Smart/AI":

- E.g., "AI-Powered Security Monitoring", "Smart SOC"
*THEN* → **Assign to JOINT VENTURE**.

**Rule 4: The "Budget" Tie-Breaker**
*IF* Routing is ambiguous (e.g., just "Technical Support"):

- *AND* Budget Estimate > 5M SAR → **Assign to INFRATECH** (They have the financial classification/bonding capacity).
- *AND* Budget Estimate < 5M SAR → **Assign to EXOTECH** (Agile, lower overhead).

***

### Implementation Note for the Coding Agent:

When building this, ensure the **Value Estimation** (Stage 2) is modular. We will want to update the "Booklet Price vs. Budget" heuristics as we gather actual data from purchased booklets. Start with the heuristics defined in the Prompt above.
<span style="display:none">[^1][^2][^3][^4][^5]</span>

<div align="center">⁂</div>

[^1]: Etimad-Pre-Purchase-Guesstimation-Engine.md

[^2]: Infratech-and-Exotech-Comprehensive-Company-Profiles-for-Etmam-AI-Engine.md

[^3]: etimad_impl_guide.md

[^4]: etimad_field_inventory_summary.md

[^5]: Etimad-Public-Tender-Data-Automation-Options.docx

