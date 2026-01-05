# Business Requirements Document (BRD)
## National Data Index (NDI) Compliance Assessment System
### نظام تقييم الامتثال لمؤشر البيانات الوطني

**Document Version:** 1.0
**Date:** January 2026
**Status:** Reverse-Engineered from Implementation

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Scope](#2-project-scope)
3. [Stakeholders](#3-stakeholders)
4. [Functional Requirements](#4-functional-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [Technical Architecture](#6-technical-architecture)
7. [Data Models](#7-data-models)
8. [API Endpoints](#8-api-endpoints)
9. [User Interface](#9-user-interface)
10. [Assumptions and Dependencies](#10-assumptions-and-dependencies)
11. [Risks and Mitigations](#11-risks-and-mitigations)
12. [Glossary](#12-glossary)
13. [Appendices](#13-appendices)

---

## 1. Executive Summary

### 1.1 Project Background

The **National Data Index (NDI) Compliance Assessment System** (codename: "Nadee") is a comprehensive web-based platform designed to help Saudi government entities assess, track, and improve their compliance with the National Data Index framework issued by SDAIA (Saudi Data and Artificial Intelligence Authority).

The system was developed to address the Kingdom's Vision 2030 digital transformation goals by providing a structured methodology for evaluating organizational data governance maturity across 14 key domains.

### 1.2 Business Problem

Saudi government entities face several challenges in achieving NDI compliance:

| Challenge | Impact |
|-----------|--------|
| **Manual Assessment Processes** | Organizations rely on spreadsheets and manual documentation, leading to inconsistencies and errors |
| **Lack of Standardization** | No unified platform exists for conducting assessments against the NDI framework |
| **Evidence Management Complexity** | Managing hundreds of supporting documents across 14 domains is cumbersome |
| **Gap Identification Difficulty** | Identifying specific capability gaps requires expert analysis |
| **Bilingual Requirements** | Systems must support both Arabic and English for government use |
| **Limited AI Integration** | Manual review of evidence is time-consuming and resource-intensive |

### 1.3 Solution Overview

The NDI Compliance Assessment System provides:

- **Structured Assessment Framework** - 14 domains, 42 questions, 6 maturity levels (0-5)
- **Dual Assessment Types** - Maturity assessments and compliance assessments
- **Evidence Management** - Upload, organize, and track supporting documentation
- **AI-Powered Analysis** - Automated evidence analysis and gap identification
- **Collaborative Workflows** - Task assignment and team collaboration
- **Real-time Scoring** - Automatic calculation of maturity and compliance scores
- **Bilingual Interface** - Full Arabic/English support with RTL layout
- **Comprehensive Reporting** - Executive reports with recommendations

### 1.4 Business Value Proposition

| Value | Description |
|-------|-------------|
| **Regulatory Compliance** | Ensures government entities meet NDI standards |
| **Data Governance** | Establishes structured approach to data management |
| **Capability Assessment** | Identifies current maturity levels and gaps |
| **Improvement Roadmap** | AI-driven recommendations for enhancement |
| **Transparency** | Clear visibility into organizational data practices |
| **Efficiency** | Automated scoring and evidence analysis |
| **Collaboration** | Team-based task management and review processes |
| **Intelligence** | Data-driven insights through advanced analytics |

---

## 2. Project Scope

### 2.1 In-Scope Features (Implemented)

#### 2.1.1 Assessment Management

| Feature | Description | Implementation Reference |
|---------|-------------|-------------------------|
| Assessment Creation | Create maturity and compliance assessments | `backend/app/routers/assessments.py:132-160` |
| Domain Navigation | Navigate through 14 NDI domains | `frontend/app/[locale]/dashboard/assessments/[id]/domain/[code]/page.tsx` |
| Question Response | Answer 42 questions with maturity levels 0-5 | `backend/app/routers/assessments.py:365-442` |
| Progress Tracking | Real-time progress percentage calculation | `backend/app/routers/assessments.py:176-206` |
| Assessment Lifecycle | Draft → In Progress → Completed states | `backend/app/models/assessment.py` |

#### 2.1.2 Evidence Management

| Feature | Description | Implementation Reference |
|---------|-------------|-------------------------|
| File Upload | Upload PDF, DOCX, XLSX, PPTX, TXT, images | `backend/app/routers/evidence.py:40-95` |
| Text Extraction | Extract text from uploaded documents | `backend/app/services/evidence_service.py` |
| Organized Storage | Store by assessment/domain/level structure | `backend/app/routers/evidence.py:60-70` |
| Evidence Linking | Link evidence to specific responses | `backend/app/models/evidence.py` |

#### 2.1.3 Scoring Engine

| Feature | Description | Implementation Reference |
|---------|-------------|-------------------------|
| Maturity Score | Average of selected levels (0-5 scale) | `backend/app/services/score_service.py` |
| Compliance Score | Percentage of specifications met | `backend/app/services/score_service.py` |
| Domain Scores | Per-domain maturity breakdown | `backend/app/routers/scores.py` |
| Score Recalculation | Force recalculate on demand | `backend/app/routers/scores.py` |

#### 2.1.4 AI Integration

| Feature | Description | Implementation Reference |
|---------|-------------|-------------------------|
| Multi-Provider Support | OpenAI, Claude, Gemini, Azure OpenAI | `backend/app/services/ai_service.py:275-338` |
| Evidence Analysis | AI-powered document analysis | `backend/app/services/ai_evidence_service.py` |
| Gap Analysis | Identify capability gaps by domain | `backend/app/services/ai_service.py` |
| RAG Chat | Retrieval-augmented Q&A | `backend/app/services/rag_service.py` |
| Model Selection | Fetch and select models per provider | `backend/app/routers/settings.py:484-554` |

#### 2.1.5 Task Management

| Feature | Description | Implementation Reference |
|---------|-------------|-------------------------|
| Task Creation | Assign questions to team members | `backend/app/routers/tasks.py` |
| Priority Levels | Low, Medium, High, Urgent | `backend/app/models/task.py` |
| Status Tracking | Pending, In Progress, Completed, Overdue | `backend/app/models/task.py` |
| Due Dates | Track deadlines and overdue tasks | `backend/app/routers/tasks.py` |

#### 2.1.6 User Experience

| Feature | Description | Implementation Reference |
|---------|-------------|-------------------------|
| Bilingual UI | Arabic and English with proper RTL | `frontend/messages/ar.json`, `frontend/messages/en.json` |
| Dark Mode | Theme switching support | `frontend/components/theme-provider.tsx` |
| Responsive Design | Mobile, tablet, desktop layouts | Tailwind CSS responsive classes |
| Dashboard | Statistics, charts, activity feed | `frontend/app/[locale]/dashboard/page.tsx` |

#### 2.1.7 Settings & Configuration

| Feature | Description | Implementation Reference |
|---------|-------------|-------------------------|
| Organization Settings | Name, sector, contact info | `backend/app/routers/settings.py:68-140` |
| AI Provider Config | API keys, models, endpoints | `backend/app/routers/settings.py:142-280` |
| Connection Testing | Validate AI provider connectivity | `backend/app/routers/settings.py:380-481` |

### 2.2 Out-of-Scope (Not Implemented)

| Feature | Status | Notes |
|---------|--------|-------|
| User Authentication | Partial | NextAuth configured but not fully integrated |
| Role-Based Access Control | Schema Only | User roles defined but not enforced |
| Multi-Tenancy | Schema Only | Organization model exists, not enforced |
| Audit Logging | Not Implemented | No formal audit trail beyond timestamps |
| Email Notifications | Not Implemented | No notification system |
| Scheduled Assessments | Not Implemented | No recurring assessment capability |
| Benchmarking | Not Implemented | No cross-organization comparison |
| Mobile App | Not Implemented | Web-responsive only |
| SSO/SAML Integration | Not Implemented | Basic auth only |
| Data Export to External Systems | Not Implemented | No ERP/GRC integration |
| Workflow Approvals | Not Implemented | No multi-level approval chains |
| Document Versioning | Not Implemented | No version history for evidence |

---

## 3. Stakeholders

### 3.1 Primary Users

| Stakeholder | Role | System Usage |
|-------------|------|--------------|
| **Compliance Officers** | Primary Assessors | Conduct assessments, upload evidence, track progress |
| **Data Governance Teams** | Domain Experts | Answer domain-specific questions, provide justifications |
| **IT Administrators** | System Admins | Configure AI providers, manage settings |
| **Executive Leadership** | Report Consumers | Review dashboards, export reports |

### 3.2 Secondary Users

| Stakeholder | Role | System Usage |
|-------------|------|--------------|
| **External Auditors** | Reviewers | Verify evidence and assessment accuracy |
| **SDAIA Representatives** | Regulators | Review compliance reports |
| **Department Heads** | Task Owners | Complete assigned assessment tasks |

### 3.3 Technical Maintainers

| Stakeholder | Role | Responsibilities |
|-------------|------|------------------|
| **Backend Developers** | Python/FastAPI | API development, database management |
| **Frontend Developers** | React/Next.js | UI implementation, integration |
| **DevOps Engineers** | Docker/Infrastructure | Deployment, monitoring, scaling |
| **AI/ML Engineers** | LangChain/RAG | AI feature development |

---

## 4. Functional Requirements

### 4.1 Assessment Module

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| **FR-ASM-01** | The system shall allow users to create new assessments with a name, type (Maturity/Compliance), and optional description | High | ✅ |
| **FR-ASM-02** | The system shall display all 14 NDI domains with progress indicators | High | ✅ |
| **FR-ASM-03** | The system shall present 3 questions per domain with maturity levels 0-5 | High | ✅ |
| **FR-ASM-04** | The system shall allow users to select a maturity level and provide justification for each question | High | ✅ |
| **FR-ASM-05** | The system shall calculate maturity scores in real-time as responses are entered | High | ✅ |
| **FR-ASM-06** | The system shall track assessment status through Draft, In Progress, and Completed states | Medium | ✅ |
| **FR-ASM-07** | The system shall allow users to set a target maturity level for improvement tracking | Medium | ✅ |
| **FR-ASM-08** | The system shall validate all questions are answered before assessment submission | Medium | ✅ |

### 4.2 Evidence Module

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| **FR-EVD-01** | The system shall accept file uploads in PDF, DOCX, XLSX, PPTX, TXT, PNG, JPG formats | High | ✅ |
| **FR-EVD-02** | The system shall enforce a maximum file size of 50MB per upload | Medium | ✅ |
| **FR-EVD-03** | The system shall extract text content from uploaded documents | High | ✅ |
| **FR-EVD-04** | The system shall organize evidence by assessment name, domain code, and maturity level | Medium | ✅ |
| **FR-EVD-05** | The system shall link multiple evidence files to a single assessment response | Medium | ✅ |
| **FR-EVD-06** | The system shall track evidence analysis status (Pending, Processing, Completed, Failed) | Low | ✅ |
| **FR-EVD-07** | The system shall require a saved response before allowing evidence upload | Medium | ✅ |

### 4.3 AI Analysis Module

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| **FR-AI-01** | The system shall support multiple AI providers (OpenAI, Claude, Gemini, Azure) | High | ✅ |
| **FR-AI-02** | The system shall securely store encrypted API keys for AI providers | High | ✅ |
| **FR-AI-03** | The system shall fetch available models from provider APIs | Medium | ✅ |
| **FR-AI-04** | The system shall analyze uploaded evidence against acceptance criteria | High | ✅ |
| **FR-AI-05** | The system shall generate gap analysis reports by domain | Medium | ✅ |
| **FR-AI-06** | The system shall provide AI-driven improvement recommendations | Medium | ✅ |
| **FR-AI-07** | The system shall support RAG-based Q&A using assessment context | Low | ✅ |
| **FR-AI-08** | The system shall allow testing AI provider connectivity before saving | Medium | ✅ |

### 4.4 Task Module

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| **FR-TSK-01** | The system shall allow creating tasks linked to specific assessment questions | Medium | ✅ |
| **FR-TSK-02** | The system shall support task assignment to specific users | Medium | ✅ |
| **FR-TSK-03** | The system shall track task priority (Low, Medium, High, Urgent) | Low | ✅ |
| **FR-TSK-04** | The system shall track task due dates and flag overdue tasks | Medium | ✅ |
| **FR-TSK-05** | The system shall display task statistics on the dashboard | Low | ✅ |

### 4.5 Reporting Module

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| **FR-RPT-01** | The system shall generate assessment reports with scores by domain | High | ✅ |
| **FR-RPT-02** | The system shall display dashboard statistics (assessments, scores, tasks) | High | ✅ |
| **FR-RPT-03** | The system shall show recent activity feed on dashboard | Low | ✅ |
| **FR-RPT-04** | The system shall export reports in PDF and Excel formats | Medium | ⚠️ Partial |

### 4.6 User Experience Module

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| **FR-UX-01** | The system shall provide full Arabic language support with RTL layout | High | ✅ |
| **FR-UX-02** | The system shall provide full English language support | High | ✅ |
| **FR-UX-03** | The system shall allow switching between Arabic and English | High | ✅ |
| **FR-UX-04** | The system shall support dark and light themes | Medium | ✅ |
| **FR-UX-05** | The system shall be responsive across mobile, tablet, and desktop | Medium | ✅ |

---

## 5. Non-Functional Requirements

### 5.1 Performance

| ID | Requirement | Target | Evidence |
|----|-------------|--------|----------|
| **NFR-PRF-01** | API response time shall be under 500ms for list operations | < 500ms | Async SQLAlchemy with selectinload |
| **NFR-PRF-02** | File uploads shall support up to 50MB | 50MB | `settings.max_upload_size` |
| **NFR-PRF-03** | Dashboard shall load within 2 seconds | < 2s | Parallel API calls, React optimization |
| **NFR-PRF-04** | System shall support 100 concurrent users | 100 users | Configurable connection pool |
| **NFR-PRF-05** | AI analysis shall complete within 30 seconds | < 30s | Async AI provider calls |

### 5.2 Compatibility

| ID | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| **NFR-CMP-01** | Backend shall run on Python 3.11+ | ✅ | `pyproject.toml` |
| **NFR-CMP-02** | Frontend shall support modern browsers | ✅ | Next.js 14 compatibility |
| **NFR-CMP-03** | Database shall use PostgreSQL 15+ with pgvector | ✅ | `docker-compose.yml` |
| **NFR-CMP-04** | System shall run in Docker containers | ✅ | `Dockerfile`, `docker-compose.yml` |
| **NFR-CMP-05** | System shall support external database connections | ✅ | Environment variable configuration |

### 5.3 Security

| ID | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| **NFR-SEC-01** | API keys shall be encrypted at rest | ✅ | Fernet encryption in `settings.py` |
| **NFR-SEC-02** | Stable encryption key for persistence | ✅ | `_DEFAULT_KEY` with SHA256 derivation |
| **NFR-SEC-03** | Primary keys shall use UUIDs | ✅ | All models use `UUID(as_uuid=True)` |
| **NFR-SEC-04** | CORS shall be configurable | ✅ | `cors_origins` in config |
| **NFR-SEC-05** | User authentication | ⚠️ | NextAuth configured, not enforced |
| **NFR-SEC-06** | Role-based access control | ⚠️ | User roles defined, not enforced |

### 5.4 Reliability

| ID | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| **NFR-REL-01** | Database sessions shall auto-commit on success | ✅ | `get_db()` context manager |
| **NFR-REL-02** | Database sessions shall rollback on failure | ✅ | Exception handling in `get_db()` |
| **NFR-REL-03** | Health checks shall be available | ✅ | Docker healthcheck configuration |
| **NFR-REL-04** | System shall handle null values gracefully | ✅ | `or ""`, `or 0` fallbacks |

### 5.5 Maintainability

| ID | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| **NFR-MNT-01** | Code shall follow modular architecture | ✅ | Routers, services, models separation |
| **NFR-MNT-02** | API shall be documented via OpenAPI | ✅ | FastAPI auto-generated docs |
| **NFR-MNT-03** | Configuration via environment variables | ✅ | Pydantic Settings class |
| **NFR-MNT-04** | Database migrations shall be supported | ✅ | Alembic integration |

---

## 6. Technical Architecture

### 6.1 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend Framework** | Next.js | 14.x | React-based SSR/SSG framework |
| **UI Components** | shadcn/ui | Latest | Radix-based accessible components |
| **Styling** | Tailwind CSS | 3.x | Utility-first CSS framework |
| **Backend Framework** | FastAPI | 0.100+ | Async Python web framework |
| **ORM** | SQLAlchemy | 2.0 | Async database ORM |
| **Database** | PostgreSQL | 15+ | Primary data store |
| **Vector Database** | Qdrant | Latest | Semantic search for RAG |
| **Cache** | Redis | 7+ | Session and query caching |
| **AI Orchestration** | LangChain | Latest | AI pipeline management |
| **Containerization** | Docker | Latest | Deployment packaging |
| **Reverse Proxy** | Nginx | Latest | Request routing |

### 6.2 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USER BROWSER                                │
│                    (Arabic/English, Desktop/Mobile)                      │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           NGINX (Port 80)                                │
│                    Reverse Proxy + Static Files                          │
└─────────────────────────────────────────────────────────────────────────┘
                          │                    │
                          ▼                    ▼
┌─────────────────────────────┐    ┌──────────────────────────────────────┐
│   NEXT.JS FRONTEND (3388)   │    │     FASTAPI BACKEND (8833)           │
│  ┌───────────────────────┐  │    │  ┌────────────────────────────────┐  │
│  │  Dashboard Pages      │  │    │  │  Assessment Router             │  │
│  │  Assessment Pages     │  │    │  │  Evidence Router               │  │
│  │  Settings Pages       │  │    │  │  Task Router                   │  │
│  │  Task Pages           │  │    │  │  AI Router                     │  │
│  │  Report Pages         │  │    │  │  Settings Router               │  │
│  └───────────────────────┘  │    │  │  Score Router                  │  │
└─────────────────────────────┘    │  │  Dashboard Router              │  │
                                   │  └────────────────────────────────┘  │
                                   │                 │                    │
                                   │  ┌──────────────┴─────────────────┐  │
                                   │  │         SERVICES               │  │
                                   │  │  ┌──────────────────────────┐  │  │
                                   │  │  │ AssessmentService        │  │  │
                                   │  │  │ ScoreService             │  │  │
                                   │  │  │ AIService                │  │  │
                                   │  │  │ AIEvidenceService        │  │  │
                                   │  │  │ RAGService               │  │  │
                                   │  │  │ EvidenceService          │  │  │
                                   │  │  └──────────────────────────┘  │  │
                                   │  └────────────────────────────────┘  │
                                   └──────────────────────────────────────┘
                                              │           │
                    ┌─────────────────────────┼───────────┼──────────────┐
                    │                         │           │              │
                    ▼                         ▼           ▼              ▼
          ┌─────────────────┐    ┌─────────────────┐  ┌───────┐  ┌──────────────┐
          │   PostgreSQL    │    │     Qdrant      │  │ Redis │  │ AI Providers │
          │   (Port 5432)   │    │  (Port 6333)    │  │(6379) │  │  - OpenAI    │
          │                 │    │                 │  │       │  │  - Claude    │
          │ ┌─────────────┐ │    │ Vector Store    │  │ Cache │  │  - Gemini    │
          │ │ assessments │ │    │ for RAG         │  │       │  │  - Azure     │
          │ │ responses   │ │    │ Embeddings      │  │       │  │              │
          │ │ evidence    │ │    └─────────────────┘  └───────┘  └──────────────┘
          │ │ tasks       │ │
          │ │ ndi_*       │ │
          │ │ users       │ │
          │ │ settings    │ │
          │ └─────────────┘ │
          └─────────────────┘
```

### 6.3 Key Data Flows

#### Assessment Response Flow
```
User Selects Level → Frontend setState → POST /assessments/{id}/responses
→ Backend Validates → Creates/Updates AssessmentResponse → Commits to DB
→ Returns Response with ID → Frontend Stores ID → Enables Evidence Upload
```

#### Evidence Upload Flow
```
User Uploads File → Frontend FormData → POST /evidence/upload
→ Backend Validates File → Saves to Storage → Extracts Text
→ Creates Evidence Record → Returns Evidence Details
```

#### AI Analysis Flow
```
User Requests Analysis → POST /ai/analyze-evidence
→ Backend Gets Active Provider → Decrypts API Key
→ Builds Prompt with Context → Calls AI Provider API
→ Parses Response → Stores Analysis in Evidence.ai_analysis → Returns Results
```

---

## 7. Data Models

### 7.1 Core Domain Models

#### Assessment (تقييم)
```
- id: UUID (Primary Key)
- assessment_type: Enum (maturity, compliance)
- status: Enum (draft, in_progress, completed)
- name: String
- description: Text (optional)
- target_level: Integer (0-5)
- maturity_score: Float
- compliance_score: Float
- created_by: UUID (FK → User)
- created_at: Timestamp
- updated_at: Timestamp
- completed_at: Timestamp (optional)
```

#### AssessmentResponse (إجابة التقييم)
```
- id: UUID (Primary Key)
- assessment_id: UUID (FK → Assessment)
- question_id: UUID (FK → NDIQuestion)
- selected_level: Integer (0-5, nullable)
- justification: Text (optional)
- notes: Text (optional)
- created_at: Timestamp
- updated_at: Timestamp
```

#### Evidence (الشاهد/الدليل)
```
- id: UUID (Primary Key)
- response_id: UUID (FK → AssessmentResponse)
- file_name: String
- file_path: String
- file_type: String
- file_size: Integer
- mime_type: String
- extracted_text: Text
- ai_analysis: JSONB
- analysis_status: Enum (pending, processing, completed, failed)
- created_at: Timestamp
- analyzed_at: Timestamp (optional)
```

#### Task (مهمة)
```
- id: UUID (Primary Key)
- assessment_id: UUID (FK → Assessment)
- question_id: UUID (FK → NDIQuestion, optional)
- assigned_to: UUID (FK → User)
- assigned_by: UUID (FK → User)
- title_en: String
- title_ar: String
- description_en: Text
- description_ar: Text
- status: Enum (pending, in_progress, completed, overdue)
- priority: Enum (low, medium, high, urgent)
- due_date: Date
- notes: Text
- created_at: Timestamp
- completed_at: Timestamp (optional)
```

### 7.2 NDI Framework Models

#### NDIDomain (المجال)
```
- id: UUID (Primary Key)
- code: String (Unique, e.g., "DG", "MCM")
- name_en: String
- name_ar: String
- description_en: Text
- description_ar: Text
- question_count: Integer (default: 3)
- icon: String
- color: String
- is_oe_domain: Boolean
- sort_order: Integer
```

#### NDIQuestion (السؤال)
```
- id: UUID (Primary Key)
- domain_id: UUID (FK → NDIDomain)
- code: String (Unique, e.g., "DG.MQ.1")
- question_en: Text
- question_ar: Text
- sort_order: Integer
```

#### NDIMaturityLevel (مستوى النضج)
```
- id: UUID (Primary Key)
- question_id: UUID (FK → NDIQuestion)
- level: Integer (0-5)
- name_en: String
- name_ar: String
- description_en: Text
- description_ar: Text
- Unique constraint: (question_id, level)
```

#### NDIAcceptanceEvidence (معايير القبول)
```
- id: UUID (Primary Key)
- maturity_level_id: UUID (FK → NDIMaturityLevel)
- evidence_id: Integer (sequential within level)
- text_en: Text
- text_ar: Text
- specification_code: String (optional)
- inherits_from_level: Integer (optional)
- sort_order: Integer
```

### 7.3 Entity Relationship Diagram

```
┌──────────────────┐     ┌──────────────────┐
│   Organization   │     │      User        │
└────────┬─────────┘     └────────┬─────────┘
         │                        │
         │                        │ created_by
         │                        ▼
         │              ┌──────────────────┐
         │              │   Assessment     │◄────────────────┐
         │              └────────┬─────────┘                 │
         │                       │                           │
         │                       │ 1:N                       │
         │                       ▼                           │
         │              ┌──────────────────┐                 │
         │              │AssessmentResponse│                 │
         │              └────────┬─────────┘                 │
         │                       │                           │
         │            ┌──────────┴──────────┐               │
         │            │ 1:N            N:1  │               │
         │            ▼                     ▼               │
         │   ┌──────────────┐      ┌──────────────┐        │
         │   │   Evidence   │      │  NDIQuestion │        │
         │   └──────────────┘      └──────┬───────┘        │
         │                                │                 │
         │                         N:1    │                 │
         │                                ▼                 │
         │                       ┌──────────────┐          │
         │                       │  NDIDomain   │          │
         │                       └──────────────┘          │
         │                                                  │
         │                       ┌──────────────┐          │
         └───────────────────────┤    Task      ├──────────┘
                                 └──────────────┘
```

---

## 8. API Endpoints

### 8.1 Assessments API (`/api/v1/assessments`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/` | List all assessments (paginated, filterable) |
| POST | `/` | Create new assessment |
| GET | `/{id}` | Get assessment details |
| PUT | `/{id}` | Update assessment |
| DELETE | `/{id}` | Delete assessment |
| POST | `/{id}/submit` | Submit/complete assessment |
| GET | `/{id}/responses` | Get all responses for assessment |
| POST | `/{id}/responses` | Save individual response |
| GET | `/{id}/report` | Generate assessment report |

### 8.2 Tasks API (`/api/v1/tasks`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/` | List all tasks (paginated, filterable) |
| GET | `/my-tasks` | Get tasks assigned to current user |
| GET | `/assigned-by-me` | Get tasks assigned by current user |
| GET | `/stats` | Get task statistics |
| POST | `/` | Create task |
| GET | `/{id}` | Get task details |
| PUT | `/{id}` | Update task |
| PATCH | `/{id}/status` | Update task status |
| DELETE | `/{id}` | Delete task |

### 8.3 Scores API (`/api/v1/scores`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/assessments/{id}/maturity-score` | Calculate maturity score |
| GET | `/assessments/{id}/compliance-score` | Calculate compliance score |
| GET | `/assessments/{id}/combined` | Get both scores |
| POST | `/assessments/{id}/recalculate` | Force recalculation |

### 8.4 Evidence API (`/api/v1/evidence`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/upload` | Upload evidence file |
| GET | `/{id}` | Get evidence details |
| DELETE | `/{id}` | Delete evidence |
| POST | `/{id}/analyze` | Analyze uploaded file |

### 8.5 AI API (`/api/v1/ai`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/analyze-evidence` | Analyze evidence documents |
| POST | `/gap-analysis` | Generate gap analysis |
| POST | `/recommendations` | Get AI recommendations |
| POST | `/chat` | RAG-based Q&A |
| POST | `/evidence/analyze-response` | Analyze question response |
| POST | `/evidence/suggest-structure` | Suggest documentation structure |

### 8.6 Settings API (`/api/v1/settings`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/organization` | Get organization settings |
| PUT | `/organization` | Update organization settings |
| GET | `/ai-providers` | List AI providers |
| PUT | `/ai-providers/{id}` | Update provider config |
| POST | `/ai-providers/{id}/test` | Test provider connection |
| POST | `/ai-providers/{id}/fetch-models` | Fetch available models |

### 8.7 NDI API (`/api/v1/ndi`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/domains` | List all 14 domains |
| GET | `/domains/{code}` | Get domain with questions |
| GET | `/domains/{code}/questions` | Get questions in domain |
| GET | `/questions/{code}` | Get question with levels |
| GET | `/questions/{code}/levels` | Get maturity levels |

### 8.8 Dashboard API (`/api/v1/dashboard`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/stats` | Dashboard statistics |
| GET | `/overview` | System overview counts |
| GET | `/recent-activity` | Activity feed |
| GET | `/domain-summary` | Summary by domain |

---

## 9. User Interface

### 9.1 Page Structure

| Page | Route | Purpose |
|------|-------|---------|
| Dashboard | `/dashboard` | Main statistics and overview |
| Assessments List | `/dashboard/assessments` | View all assessments |
| Assessment Detail | `/dashboard/assessments/{id}` | View/edit assessment |
| Domain Assessment | `/dashboard/assessments/{id}/domain/{code}` | Answer domain questions |
| Assessment Report | `/dashboard/assessments/{id}/report` | View assessment report |
| New Assessment | `/dashboard/assessments/new` | Create wizard |
| Tasks | `/dashboard/tasks` | View assigned tasks |
| Reports | `/dashboard/reports` | Generate reports |
| Chat | `/dashboard/chat` | AI Q&A interface |
| Settings | `/dashboard/settings` | Configuration |

### 9.2 Key Components

- **Assessment Components:** List, Card, Detail View, Domain Navigator
- **Task Components:** List, Card, Status Manager, Assignment
- **Evidence Components:** Uploader, Analyzer, File Manager
- **UI Components:** Cards, Forms, Tables, Charts, Modals, Tabs
- **Navigation:** Sidebar with collapsible menu, Header with language/theme toggle

---

## 10. Assumptions and Dependencies

### 10.1 Assumptions

1. Users have modern web browsers with JavaScript enabled
2. Organizations have internet connectivity for AI provider access
3. AI provider API keys are obtained separately by organizations
4. NDI framework domains and questions remain stable (14 domains, 42 questions)
5. PostgreSQL and Redis are available (containerized or external)

### 10.2 Dependencies

| Dependency | Type | Risk Level |
|------------|------|------------|
| PostgreSQL 15+ | Database | Low |
| Qdrant | Vector DB | Medium |
| Redis | Cache | Low |
| OpenAI/Claude/Gemini | External API | Medium |
| Docker | Runtime | Low |
| Node.js 18+ | Runtime | Low |
| Python 3.11+ | Runtime | Low |

---

## 11. Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| AI Provider API Outage | Medium | Low | Multiple provider support, fallback messages |
| Database Connection Failure | High | Low | Connection pooling, retry logic |
| File Upload Failures | Medium | Medium | Size limits, format validation, error messages |
| Encryption Key Loss | High | Low | Stable default key, environment variable support |
| Language Translation Errors | Low | Medium | Separate message files, review process |
| Score Calculation Errors | High | Low | Unit tests, null safety checks |

---

## 12. Glossary

| Term | Arabic | Definition |
|------|--------|------------|
| **NDI** | مؤشر البيانات الوطني | National Data Index - SDAIA framework |
| **Maturity Level** | مستوى النضج | Capability level from 0 (Absence) to 5 (Pioneer) |
| **Domain** | المجال | One of 14 areas of data governance |
| **Acceptance Evidence** | معايير القبول | Criteria for a maturity level |
| **RAG** | - | Retrieval Augmented Generation |
| **SDAIA** | سدايا | Saudi Data and AI Authority |

---

## 13. Appendices

### Appendix A: NDI Domains Reference

| Code | English Name | Arabic Name |
|------|--------------|-------------|
| DG | Data Governance | حوكمة البيانات |
| MCM | Metadata & Catalog Management | إدارة البيانات الوصفية والفهرسة |
| DQ | Data Quality | جودة البيانات |
| DO | Data Operations | عمليات البيانات |
| DCM | Document & Content Management | إدارة المستندات والمحتوى |
| DAM | Data Architecture & Modeling | هندسة ونمذجة البيانات |
| DSI | Data Sharing & Interoperability | مشاركة البيانات والتكامل |
| RMD | Reference & Master Data | البيانات المرجعية والرئيسية |
| BIA | Business Intelligence & Analytics | ذكاء الأعمال والتحليلات |
| DVR | Data Value Realization | تحقيق قيمة البيانات |
| OD | Open Data | البيانات المفتوحة |
| FOI | Freedom of Information | حرية المعلومات |
| DC | Data Classification | تصنيف البيانات |
| PDP | Personal Data Protection | حماية البيانات الشخصية |

### Appendix B: Maturity Levels Reference

| Level | English | Arabic | Description |
|-------|---------|--------|-------------|
| 0 | Absence of Capabilities | غياب القدرات | No formal processes exist |
| 1 | Establishing | التأسيس | Initial processes being established |
| 2 | Defined | التحديد | Processes documented and standardized |
| 3 | Activated | التفعيل | Processes actively implemented |
| 4 | Managed | الإدارة | Processes measured and controlled |
| 5 | Pioneer | الريادة | Continuous improvement and innovation |

### Appendix C: Scoring Algorithm

#### Maturity Score
```
Maturity Score = Σ(Selected Levels) / Count(Answered Questions)
Range: 0.0 to 5.0
```

#### Compliance Score
```
Compliance Score = (Specifications Met / Total Specifications) × 100
Range: 0% to 100%
```

#### Level Color Thresholds
| Score Range | Level | Color |
|-------------|-------|-------|
| 0 - 0.24 | 0 | Gray |
| 0.25 - 1.24 | 1 | Red |
| 1.25 - 2.49 | 2 | Orange |
| 2.5 - 3.99 | 3 | Yellow |
| 4 - 4.74 | 4 | Green |
| 4.75 - 5 | 5 | Emerald |

---

**Document End**
