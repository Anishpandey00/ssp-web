# Team and RACI

The project is built by **Team D**, a team of six. Each member leads one phase
of the project and is Accountable for it.

## Roles

| # | Member | Role | Main responsibilities |
|:-:|---|---|---|
| 1 | Thing Pemba Dorge (PT) | Planning & Requirements Lead | Project plan, schedule and weekly status; requirements (SRS); requirement traceability matrix (RTM); final acceptance against the requirements |
| 2 | Chand Rishab (RC) | Design Lead | UI/UX mockups and page flow; system architecture; use case and sequence diagrams; ER diagram (one database per service); API design (20 endpoints) |
| 3 | Pandey Anish Raj (AP) | Development Lead | React frontend; Auth, Task, Quiz and Progress services; AI service (study plan, Today's focus); security (JWT, bcrypt, parameterised SQL); bug fixes |
| 4 | Ayer Ritika (RA) | Testing (QA) Lead | Test plan and manual test cases; 28 automated unit tests; integration and fault-tolerance tests; retest and sign-off of every bug fix |
| 5 | Bashyal Sapana (SB) | DevOps & Cloud Lead | Docker images and Docker Compose (7 containers); nginx gateway and Docker networks; GitHub Actions CI; Azure Container Apps deployment |
| 6 | Oli Shubhash (OS) | Documentation & Delivery Lead | README and setup / network guides; final report; presentation slides; live demo and final submission |

## RACI matrix

**A/R** = Accountable + Responsible (the phase lead does the work and signs it off) ·
**A** = Accountable (signs off) · **R** = Responsible (does the work) ·
**C** = Consulted (gives input) · **I** = Informed (kept up to date) ·
blank = not involved.

| Phase | Activity / deliverable | Pemba (PT) | Rishab (RC) | Anish (AP) | Ritika (RA) | Sapana (SB) | Shubhash (OS) |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|
| **Planning & requirements** | Project plan, schedule and weekly status | **A/R** | C | C | I | I | I |
| | Requirements and SRS (functional, non-functional) | **A/R** | C | C | C | | I |
| | Requirement traceability matrix (RTM) | **A/R** | | | R | | I |
| **Design** | UI/UX mockups and page flow | C | **A/R** | C | | | I |
| | System architecture and UML (use case, sequence) | C | **A/R** | C | | C | I |
| | Database design (ER diagram, one DB per service) | | **A/R** | C | | I | |
| | API design (20 endpoints, access rules) | | **A/R** | C | C | | I |
| **Development** | Frontend: React pages, navigation, responsive UI | | C | **A/R** | I | | |
| | Microservices: Auth, Task, Quiz, Progress | | C | **A/R** | I | I | |
| | AI service: study plan and Today's focus (Ollama) | C | C | **A/R** | I | I | |
| | Security: JWT checks, bcrypt, parameterised SQL | | | **A/R** | C | C | |
| **Testing** | Test plan and manual test cases | C | | I | **A/R** | | |
| | Automated unit tests (28 tests, `node:test`) | | | C | **A/R** | I | |
| | Integration and fault-tolerance tests | | | | **A/R** | C | |
| | Bug fixing, closed only after retest | I | | R | **A** | | |
| | Acceptance check against the requirements | **A** | | | R | | I |
| **DevOps & deployment** | Docker images and Compose (7 containers, health checks) | | | C | I | **A/R** | |
| | nginx API gateway and Docker networks | | C | C | | **A/R** | |
| | CI pipeline (GitHub Actions) | | | I | C | **A/R** | |
| | Azure Container Apps deployment | I | | I | I | **A/R** | I |
| **Documentation & delivery** | README, setup and network guides | | | C | | C | **A/R** |
| | Final report and presentation slides | C | C | C | C | C | **A/R** |
| | Live demo of the running app | I | | R | | C | **A** |

### Rules

- Every activity has exactly one Accountable person (A or A/R) and at least one
  Responsible person (R or A/R). All 23 activities pass this check.
- **A/R** is normal when one person owns a deliverable: the phase lead both does
  the work and signs it off.
- **Separate sign-off.** On three activities a different person signs off, so
  the work is checked by someone else:
  - *Bug fixing:* the Development lead fixes the bug, and the Testing lead closes
    it only after a retest.
  - *Acceptance check:* the Testing lead runs the checks, and the Planning &
    Requirements lead accepts the system against the requirements.
  - *Live demo:* the Development lead runs the app, and the Documentation &
    Delivery lead owns the final delivery.

### Workload per member

| | Pemba (PT) | Rishab (RC) | Anish (AP) | Ritika (RA) | Sapana (SB) | Shubhash (OS) |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Accountable (A or A/R) | 4 | 4 | 4 | 4 | 4 | 3 |
| Responsible (R or A/R) | 3 | 4 | 6 | 5 | 4 | 2 |
| Consulted (C) | 5 | 7 | 11 | 5 | 6 | 0 |
| Informed (I) | 3 | 0 | 3 | 6 | 5 | 8 |

The editable source, with colour coding, drop-downs, the automatic check and
the requirement owners, is the
[RTM and RACI workbook](../reports/SSP_RTM_RACI_Team_D_Final.xlsx).
