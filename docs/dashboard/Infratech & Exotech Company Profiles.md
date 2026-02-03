<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# we need to produce a full company profile for both Infratech/Exotech including but not limited to capability matrices to use it in our Etmam build, the gusstimation AI engine.

give me a deep research prompt to that and wrap it in the below anti-hallucination protocol so the report become decision safe and factual

The Anti-Hallucination protocol:
ROLE
You are a senior research analyst and domain expert.
Your primary goal is to produce source-grounded, non-speculative research that can be wired directly into product and business decisions.

ANTI‑HALLUCINATION CONTRACT (NON‑NEGOTIABLE)

- You MUST only use:
(a) user-provided context,
(b) documents or tools explicitly available to you in this session,
(c) clearly identified, reputable public sources (e.g., official docs, major journals, regulators).
- No guessing or filling gaps.
If you cannot confidently verify a fact from sources, you MUST:
    - Output "UNKNOWN" for that fact, and
    - Add a short note: "Reason: not verifiable from available sources."
- Distinguish clearly between:
    - VERIFIED facts (directly supported by sources),
    - PLAUSIBLE inferences (clearly labelled as inference + low/medium confidence),
    - OPEN QUESTIONS (clearly marked as UNCERTAIN / UNKNOWN).
- Every factual claim MUST be traceable:
    - Attach inline citations (e.g. [S1], [S2]) and provide a "Sources" section mapping S1/S2 to URLs or documents.
- If sources conflict, you MUST:
    - Explicitly describe the conflict,
    - Avoid choosing a side unless one source is clearly more authoritative,
    - Mark the conclusion as UNCERTAIN.
- If the task is impossible with available data, you MUST say so, and propose clarifying questions or additional data needed.

CHAIN‑OF‑VERIFICATION LOOP
You MUST follow this 4‑step loop (do not skip steps):

1) Draft Answer
    - Write a concise initial answer to the user’s question.
2) Verification Plan
    - List the key factual claims in your draft that could be wrong or disputed.
    - For each claim, write a verification question (e.g., "Is X actually required by regulation Y?").
3) Evidence Check
    - For each verification question:
        - Search/inspect the available sources.
        - Summarize the evidence FOR and AGAINST.
        - Decide one of: CONFIRMED / CONTRADICTED / NOT ENOUGH EVIDENCE.
4) Refined Answer
    - Rewrite your answer using ONLY the verified evidence from step 3.
    - Mark each major claim as CONFIRMED / PARTIAL / UNCERTAIN.
    - Remove or downgrade any claim that is not clearly supported.

TASK
User topic: {{TOPIC_OR_QUESTION}}
Scope:

- Timeframe of interest: {{TIMEFRAME}} (if relevant).
- Geography / jurisdiction: {{REGION}} (if relevant).
- Target depth: {{"Executive brief" | "Practitioner playbook" | "Full technical deep dive"}}.

OUTPUT FORMAT

1) Executive Summary (5–10 bullet points, clearly tagged with [CONFIRMED] / [UNCERTAIN]).
2) Key Questions \& Assumptions
3) Detailed Findings
    - Use subsections.
    - For each important statement, add [CONFIRMED], [INFERRED], or [UNCERTAIN].
4) Risks \& Unknowns
5) Actionable Next Steps
6) Sources
    - S1: ...
    - S2: ...
    - etc.

END CHECK (MANDATORY)
Before finalizing, run this self-check:

- Remove any sentence that is not explicitly supported by your cited sources or clearly labelled as speculation.
- If too many UNKNOWNs block a solid answer, say:
"With current information I cannot safely answer this. Here is what would be needed next: …"

Here is the deep research prompt structured within your anti-hallucination protocol for producing decision-safe company profiles:

***

**DEEP RESEARCH PROMPT: Infratech \& Exotech Company Profiles for Etmam AI Engine**

**ROLE**
You are a senior research analyst and domain expert focused on Saudi Arabian technology vendors. Your primary goal is to produce source-grounded, non-speculative capability matrices and company profiles that can be wired directly into the Etmam gusstimation AI engine without manual validation.

**ANTI‑HALLUCINATION CONTRACT (NON‑NEGOTIABLE)**

- You MUST only use: (a) user-provided context, (b) documents or tools explicitly available in this session, (c) clearly identified, reputable public sources (official company websites, Saudi government registries, NCA/CST certifications, LinkedIn company pages, Saudi Vision 2030 partner directories, Aramco/SABIC vendor lists).
- No guessing or filling capability gaps. If you cannot confidently verify a service offering, certification, or partnership from primary sources, you MUST output "UNKNOWN" for that capability and add: "Reason: not verifiable from available sources."
- Distinguish clearly between: VERIFIED facts (directly supported by source documents), PLAUSIBLE inferences (clearly labelled as inference + low/medium confidence), OPEN QUESTIONS (marked as UNCERTAIN/UNKNOWN).
- Every capability claim MUST be traceable: Attach inline citations (e.g. [S1], [S2]) and provide a "Sources" section mapping S1/S2 to exact URLs or official document names.
- If sources conflict on capability scope or certification status, you MUST explicitly describe the conflict, avoid choosing a side unless one source is authoritative (NCA > LinkedIn > Job posting), and mark the conclusion as UNCERTAIN.
- If the task is impossible with available data, you MUST say so and propose specific clarifying questions or additional data needed (e.g., "Direct access to Infratech's OT security capabilities whitepaper required").

**CHAIN‑OF‑VERIFICATION LOOP**
You MUST follow this 4‑step loop for EACH company:

1) **Draft Capability Matrix**
    - Extract raw capability claims from all sources for Infratech and Exotech separately.
    - Structure into standard matrix: Service Domain → Capability Category → Specific Offering → Verification Status.
2) **Verification Plan**
    - List every capability claim that could be inflated or unverified (e.g., "NCA-licensed mSOC" needs NCA registry confirmation; "Aramco approved vendor" needs Aramco vendor portal evidence; "OT security for hydrogen plants" needs case study or client reference).
    - For each claim, write a verification question: "Is [CAPABILITY] listed in [OFFICIAL SOURCE] as of [DATE]?"
3) **Evidence Check**
    - For each question: Search official sources (NCA public registry, CST telecom provider list, Saudi Ministry of Municipal Affairs contractor classification database, Aramco vendor portal (public section), SABIC partner directory, company PDF brochures with version numbers).
    - Summarize evidence FOR and AGAINST each capability claim.
    - Decide: CONFIRMED / CONTRADICTED / NOT ENOUGH EVIDENCE.
4) **Refined Capability Matrix**
    - Rewrite matrix including ONLY verified capabilities from step 3.
    - Mark each offering as [CONFIRMED], [PARTIAL], or [UNCERTAIN].
    - Remove any capability not clearly supported by official documentation.

**TASK**
User topic: Build complete company profiles and capability matrices for Infratech and Exotech to feed into Etmam gusstimation AI engine.

Scope:

- Timeframe of interest: Current as of Q1 2026; prioritize 2024-2025 certifications and service launches.
- Geography: Saudi Arabia primary; include GCC footprint if verifiable.
- Target depth: "Practitioner playbook" – detailed enough for AI engine to generate project cost estimates, timeline forecasts, and risk scoring without human interpretation.

**RESEARCH PAYLOAD (What to extract for each company)**

**A. Corporate Identity \& Financial Foundation**

- Legal entity name, registration number, founding date, HQ address[^1][^2]
- Ownership structure (partnership, LLC, one-person company)[^3][^4]
- Employee count range and growth trajectory[^3]
- Leadership: CEO name, background, board positions[^5]
- Financial strength indicators: credit rating, contractor classification tier[^6]

**B. Regulatory \& Strategic Positioning**

- NCA certifications: mSOC license status, classification tier, scope of authorization[^7][^6]
- CST recognition: telecom sector provider status[^6]
- Vision 2030 alignment: specific programs, initiatives, or partnership status[^7]
- Approved vendor status: Aramco, SABIC (with verification links)[^6]

**C. Infratech Capability Matrix (Cybersecurity \& IT Infrastructure)**


| Service Domain | Capability Category | Specific Offering | Verification Status | Source |
| :-- | :-- | :-- | :-- | :-- |
| **Govern/Identify** | Risk \& Compliance | SAMA compliance consulting, NCA framework alignment | [ ] | [^7] |
|  | Professional Services | Cybersecurity strategy, GRC alignment | [ ] | [^7] |
| **Protect** | Managed Security Services | NCA-licensed mSOC, 24/7 SIEM management | [ ] | [^7] |
|  | OT Security | Critical infrastructure protection, hydrogen/solar plant security | [ ] | [^8][^6] |
|  | Cloud Security | Azure Expert MSP, Cloud Adoption Framework implementation | [ ] | [^9] |
|  | Network Security | Firewall, VPN, endpoint protection | [ ] | [^8] |
| **Detect \& Respond** | Incident Response | Real-time threat monitoring, digital forensics | [ ] | [^7][^10] |
|  | Offensive Security | Penetration testing, red team engagements (MITRE framework) | [ ] | [^7][^11] |
| **Research** | Threat Intelligence | Industrial ICS threat detection, behavioral analytics | [ ] | [^8] |

**D. Exotech Capability Matrix (AI \& Emerging Tech)**


| Service Domain | Capability Category | Specific Offering | Verification Status | Source |
| :-- | :-- | :-- | :-- | :-- |
| **AI Enablement** | Advisory \& Strategy | AI Enablement \& Advisory service | [ ] | [^12] |
|  | Agentic AI | Autonomous AI agents, intelligent systems | [ ] | [^12] |
| **Core AI Platforms** | Machine Learning | Custom ML models, predictive analytics | [ ] | [^13] |
|  | Computer Vision | Real-time object detection, image recognition | [ ] | [^13] |
|  | NLP | Text analysis, translation, generation models | [ ] | [^13] |
| **Hardware \& Integration** | Robotics | Service robotics, smart factory automation | [ ] | [^12] |
|  | IoT Systems | Intelligent IoT with ML processing | [ ] | [^12][^13] |
|  | Custom Hardware | AI-optimized hardware solutions | [ ] | [^13] |
| **Digital Transformation** | Cloud Integration | AI integration into existing systems | [ ] | [^13] |

**E. Client Base \& Market Evidence**

- Named client sectors (government, energy, finance, healthcare)[^7]
- Specific client logos or case studies if publicly shared
- Project scale indicators: "high-value national projects," "critical infrastructure"[^6]

**F. Competitive Differentiation**

- Unique capabilities: Infratech's OT security for renewable energy; Exotech's "AI is the core, not the add-on" positioning[^12][^6]
- Partnership network: IBM, Microsoft Azure, NourNet, Looptech, Haboob[^2][^3]

**OUTPUT FORMAT**

1) **Executive Summary (5–10 bullet points per company, tagged [CONFIRMED]/[UNCERTAIN])**
    - Example: "Infratech holds NCA First-Class Cybersecurity Classification as of Sept 2025 [CONFIRMED] "[^6]
2) **Key Questions \& Assumptions**
    - What is the exact scope of Infratech's mSOC license (sector coverage, event volume)?
    - Does Exotech have deployed robotics installations in Saudi Arabia or are solutions still in development?
    - What is the pricing model for Infratech's OT security services (project-based vs. retainer)?
3) **Detailed Capability Matrices**
    - Use tables above, populate with verification results.
4) **Risks \& Unknowns**
    - Capability gaps marked UNKNOWN with reasoning.
    - Source conflicts and UNCERTAIN markings.
5) **Actionable Next Steps**
    - Direct outreach to Infratech CEO Ayman Al Suhaim for OT security case studies.
    - Request Exotech's AI platform architecture documentation.
    - Verify Aramco vendor status via Aramco portal.
6) **Sources**
    - S1: Infratech official website (infratech.com.sa) – corporate profile, services
    - S2: LinkedIn Company Page – employee count, leadership, updates
    - S3: NCA Public Registry – verify mSOC license and classification
    - S4: EIN Presswire June 2025 – NCA licensing announcement
    - S5: Exotech LinkedIn/website – service descriptions
    - S6: Saudi Ministry of Municipal Affairs contractor classification database

**END CHECK (MANDATORY)**
Before finalizing, run this self-check:

- Remove any capability not explicitly supported by official documentation or government registry.
- If more than 30% of critical capabilities are UNKNOWN, output: "With current information I cannot safely build capability matrices. Required next: Direct access to NCA certification registry for Infratech license verification; Exotech service delivery case studies with client references."

***

**Usage Instructions:** Feed this entire prompt into your research agent. The agent must execute the chain-of-verification loop for each capability cell before populating the matrices. Only CONFIRMED capabilities should be assigned numerical weights in the Etmam gusstimation engine. UNCERTAIN capabilities should trigger human review flags in the system.
<span style="display:none">[^14][^15][^16][^17][^18][^19][^20][^21][^22][^23][^24][^25][^26][^27][^28]</span>

<div align="center">⁂</div>

[^1]: https://www.infratech.com.sa

[^2]: https://www.ibm.com/partnerplus/directory/company/8790

[^3]: https://www.linkedin.com/company/infratech-co

[^4]: https://clarifiedby.diligenciagroup.com/company/summary/9582063-exotech-arabia-information-technology-company-one-person-company/

[^5]: https://www.infratech.com.sa/about-us/

[^6]: https://www.einpresswire.com/article/854037040/infratech-earns-first-class-cybersecurity-classification-in-saudi-arabia

[^7]: https://www.einpresswire.com/article/826100682/infratech-strengthens-cyber-security-in-saudi-arabia-with-nca-licensed-managed-soc-and-advanced-offensive-capabilities

[^8]: https://www.infratech.com.sa/ot-services/

[^9]: https://www.infratech.com.sa/azure/

[^10]: https://www.infratech.com.sa/wp-content/uploads/2022/09/Profile-Infratech-V1.4-Outlined.pdf

[^11]: https://ee.linkedin.com/company/infratech-co

[^12]: https://www.linkedin.com/company/exotech-co

[^13]: https://www.exotechai.com

[^14]: https://www.facebook.com/InfratechCompany/

[^15]: https://www.zoominfo.com/c/rs-infratech-llc/557146398

[^16]: https://cms.business.sa.gov.au/assets/uploads/downloads/diis/DIIS036-SA-Cyber-Industry-Capability-Matrix-Update-FA-WEB.pdf

[^17]: https://www.goodfirms.co/company/infratech

[^18]: https://sa.trabajo.org/job-3819-641eb6f7dc130520d7edf2dfab64eab1

[^19]: https://x.com/InfratechCo

[^20]: https://sa.trabajo.org/job-3819-ad880c7694321af0fd22593726332a73

[^21]: https://www.exquitech.com/solutions/cybersecurity-risk-management/

[^22]: https://www.infratech.com.sa/pricing/

[^23]: https://www.infratech.com.sa/security-solutions-services-company/

[^24]: https://provenrobotics.ai/robotics-in-saudi-arabia/

[^25]: https://www.infratech.com.sa/mobility/

[^26]: https://exotech.com.sa

[^27]: https://www.linkedin.com/posts/infratech-co_infratech-cybersecurity-saudivision2030-activity-7375055515262885888-0MEo

[^28]: https://www.exotec.com

