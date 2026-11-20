# Team and RACI

The project is built by **Team D**, a team of six. Each role owns one area of
the system, matching the service boundaries.

## Roles

| Role | Main ownership area |
|---|---|
| Project Lead, DevOps & Cloud | Planning, architecture, Docker Compose, nginx gateway, Azure Container Apps, final integration |
| Backend Developer: Auth & Security | `auth-service` (sign up, log in, JWT, admin users), bcrypt, token / owner / admin checks |
| Backend Developer: Task & Progress | `task-service` (task CRUD, due-date rule), `progress-service` (dashboard numbers, fault tolerance) |
| Backend Developer: Quiz & Admin | `quiz-service` (quizzes, questions, scores), admin quiz editing |
| Frontend Developer: UI/UX | React pages, UI mockups, navigation, responsive styling, toasts |
| QA, Testing & Documentation | Test cases, unit tests, CI checks, RTM upkeep, README, report and slides |

## RACI matrix

**R** = Responsible (does the work) · **A** = Accountable (signs off, one per row) ·
**C** = Consulted · **I** = Informed · **A/R** = both.

| Phase | Activity | Lead / DevOps | Auth & Security | Task & Progress | Quiz & Admin | Frontend | QA & Docs |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Planning | Project plan, schedule and weekly status | A/R | C | C | I | I | R |
| Planning | SRS / requirements gathering | R | C | C | I | A/R | I |
| Planning | Requirement traceability matrix upkeep | I | C | R | C | I | A/R |
| Design | UI/UX mockups (all pages) | I | I | C | R | A/R | C |
| Design | System architecture (microservices + gateway) | A/R | R | C | C | I | I |
| Design | Database design (one database per service) | C | C | A/R | R | I | I |
| Design | API design (endpoints, access rules) | I | R | C | A/R | C | I |
| Development | Auth service | C | A/R | I | I | R | C |
| Development | Task service and due-date rule | I | I | A/R | C | R | C |
| Development | Quiz service | I | I | R | A/R | C | C |
| Development | Progress service and Quiz-outage fallback | I | I | A/R | R | C | C |
| Development | Frontend pages | I | C | C | R | A/R | I |
| Development | Admin panel | I | C | I | A/R | R | C |
| Development | API gateway (nginx routing) | R | A/R | I | C | C | I |
| Development | Security: bcrypt, token checks, parameterised SQL | C | A/R | I | C | I | R |
| Testing | Unit tests (`node:test`) | C | I | R | C | I | A/R |
| Testing | Manual functional test cases | C | I | I | C | R | A/R |
| Testing | Integration and fault-tolerance testing | C | I | A/R | C | I | R |
| Testing | Bug fixing and retest | C | R | I | A/R | C | I |
| DevOps | Docker images and Docker Compose | A/R | R | C | I | I | C |
| DevOps | Network segmentation (internal data network) | R | A/R | C | I | C | I |
| DevOps | CI pipeline (GitHub Actions) | R | C | I | I | C | A/R |
| DevOps | Azure Container Apps deployment | A/R | I | R | I | C | C |
| Delivery | README and network guide | C | C | I | I | A/R | R |
| Delivery | Final report | R | R | R | R | R | A/R |
| Delivery | Presentation slides and live demo | A/R | R | R | R | R | R |

The editable source, with workload totals and the requirement owners, is the
[RTM and RACI workbook](../reports/SSP_RTM_RACI_Team_D_fixed.xlsx).
