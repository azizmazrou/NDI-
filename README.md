# NDI Compliance System
# نظام الامتثال لمؤشر البيانات الوطني (نضيء)

A comprehensive web system for assessing Saudi government entities' compliance with the National Data Index (NDI) issued by SDAIA.

نظام ويب شامل لتقييم امتثال الجهات الحكومية السعودية لمؤشر البيانات الوطني (NDI) الصادر من سدايا.

## Features / المميزات

### Core Assessment Features / ميزات التقييم الأساسية
- **Maturity Assessment** - تقييم النضج (14 domains, 42 questions)
- **Compliance Assessment** - تقييم الامتثال (191 specifications)
- **Maturity Score Calculator** - حاسبة درجة النضج (0-5 levels)
- **Compliance Score Calculator** - حاسبة درجة الامتثال (evidence-specification mapping)

### Task Management / إدارة المهام
- **Task Assignment** - تعيين المهام للمستخدمين
- **Task Tracking** - تتبع حالة المهام
- **Priority Management** - إدارة الأولويات
- **Due Date Tracking** - تتبع تواريخ الاستحقاق

### AI-Powered Features / ميزات الذكاء الاصطناعي
- **Evidence Analysis** - تحليل الشواهد بالذكاء الاصطناعي
- **Gap Analysis** - تحليل الفجوات
- **Smart Recommendations** - توصيات ذكية
- **Evidence Structure Suggestions** - اقتراحات هيكل الشواهد

### Reporting / التقارير
- **Assessment Reports** - تقارير التقييم
- **Domain Score Analysis** - تحليل درجات المجالات
- **Gap Reports** - تقارير الفجوات
- **Excel Export** - تصدير Excel

### User Experience / تجربة المستخدم
- **Bilingual Support (AR/EN)** - دعم ثنائي اللغة
- **RTL Interface** - واجهة تدعم الاتجاه من اليمين لليسار
- **Dark Mode** - الوضع الداكن
- **Responsive Design** - تصميم متجاوب

## Technology Stack / المكدس التقني

| Component | Technology |
|-----------|------------|
| **Frontend** | Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui |
| **Backend** | FastAPI (Python 3.11+) |
| **Database** | PostgreSQL 15+ with pgvector |
| **Vector DB** | Qdrant (for RAG) |
| **AI** | LangChain + Google Gemini / OpenAI |
| **i18n** | next-intl (AR/EN) |
| **Container** | Docker with unified image (backend + frontend + nginx) |

## Quick Start / البدء السريع

### Using Docker (Recommended) / باستخدام Docker (موصى به)

```bash
# Clone the repository / استنساخ المستودع
git clone https://github.com/azizmazrou/NDI-.git
cd NDI-

# Copy environment file / نسخ ملف البيئة
cp .env.example .env

# Start all services / بدء جميع الخدمات
docker-compose up -d

# Seed NDI data / زرع بيانات المؤشر
docker-compose exec app /opt/venv/bin/python -m app.scripts.seed_ndi_data

# Access the application / الوصول إلى التطبيق
# http://localhost (port 80)
```

### Using Make Commands / باستخدام أوامر Make

```bash
make up          # Start all services / بدء الخدمات
make up-build    # Build and start / بناء وبدء
make down        # Stop services / إيقاف الخدمات
make logs        # View logs / عرض السجلات
make seed        # Seed NDI data / زرع البيانات
make health      # Check health / فحص الصحة
```

### Manual Setup / الإعداد اليدوي

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8833
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Architecture / البنية

```
┌─────────────────────────────────────────────────────────────┐
│                      NDI App Container                       │
│                         (Port 80)                            │
├─────────────────────────────────────────────────────────────┤
│                          Nginx                               │
│                     (Reverse Proxy)                          │
│                    /api/* → Backend                          │
│                    /*     → Frontend                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐              ┌─────────────────┐       │
│  │    Frontend     │              │     Backend     │       │
│  │   (Next.js)     │              │   (FastAPI)     │       │
│  │   Port 3388     │              │   Port 8833     │       │
│  └─────────────────┘              └─────────────────┘       │
└─────────────────────────────────────────────────────────────┘
              │                           │
    ┌─────────┴─────────┬────────────────┴───────────┐
    ▼                   ▼                            ▼
┌─────────┐      ┌─────────────┐              ┌──────────┐
│PostgreSQL│     │    Redis    │              │  Qdrant  │
│  :5432   │     │    :6379    │              │  :6333   │
└─────────┘      └─────────────┘              └──────────┘
```

## Project Structure / هيكل المشروع

```
ndi-system/
├── Dockerfile              # Unified Docker image
├── docker-compose.yml      # Docker services configuration
├── Makefile               # Convenient commands
│
├── frontend/              # Next.js 14 application
│   ├── app/              # App router pages
│   │   └── [locale]/     # i18n routes
│   │       └── dashboard/
│   │           ├── assessments/  # Assessment management
│   │           ├── tasks/        # Task management
│   │           ├── reports/      # Reports & analytics
│   │           └── settings/     # Organization settings
│   ├── components/       # React components
│   │   └── ui/          # shadcn/ui components
│   ├── lib/             # Utilities and API client
│   ├── messages/        # i18n translations (ar/en)
│   └── types/           # TypeScript definitions
│
├── backend/              # FastAPI application
│   └── app/
│       ├── models/      # SQLAlchemy models
│       │   ├── assessment.py    # Assessment & responses
│       │   ├── task.py          # Task management
│       │   ├── ndi.py           # NDI domains, questions, levels
│       │   ├── user.py          # User management
│       │   ├── evidence.py      # Evidence files
│       │   └── settings.py      # Organization settings
│       ├── schemas/     # Pydantic schemas
│       ├── routers/     # API endpoints
│       │   ├── assessments.py   # Assessment CRUD
│       │   ├── tasks.py         # Task management
│       │   ├── scores.py        # Score calculations
│       │   ├── reports.py       # Report generation
│       │   ├── dashboard.py     # Dashboard stats
│       │   ├── ndi.py           # NDI data endpoints
│       │   ├── evidence.py      # Evidence upload
│       │   └── ai.py            # AI analysis
│       └── services/    # Business logic
│           ├── score_service.py      # Score calculations
│           ├── assessment_service.py # Assessment operations
│           └── ai_evidence_service.py # AI evidence analysis
│
├── docker/               # Docker configuration
│   ├── nginx.conf       # Nginx reverse proxy
│   └── supervisord.conf # Process manager
│
├── data/                 # Seed data (JSON)
│   └── domains.json     # 14 domains + 42 questions + levels
│
└── docs/                 # Documentation
```

## NDI Structure / هيكل المؤشر

### 14 Domains / المجالات الـ14

| Code | English | العربية | Questions |
|------|---------|---------|-----------|
| DG | Data Governance | حوكمة البيانات | 3 |
| MCM | Metadata and Data Catalog | البيانات الوصفية ودليل البيانات | 3 |
| DQ | Data Quality | جودة البيانات | 3 |
| DO | Data Operations | تخزين البيانات | 3 |
| DCM | Document and Content Management | إدارة المحتوى والوثائق | 3 |
| DAM | Data Architecture and Modelling | النمذجة وهيكلة البيانات | 3 |
| DSI | Data Sharing and Interoperability | تكامل البيانات ومشاركتها | 3 |
| RMD | Reference and Master Data Management | إدارة البيانات المرجعية والرئيسية | 3 |
| BIA | Business Intelligence and Analytics | ذكاء الأعمال والتحليلات | 3 |
| DVR | Data Value Realization | تحقيق القيمة من البيانات | 3 |
| OD | Open Data | البيانات المفتوحة | 3 |
| FOI | Freedom of Information | حرية المعلومات | 3 |
| DC | Data Classification | تصنيف البيانات | 3 |
| PDP | Personal Data Protection | حماية البيانات الشخصية | 3 |

**Total: 14 Domains × 3 Questions = 42 Questions**

### 6 Maturity Levels / مستويات النضج الـ6

| Level | English | العربية | Score Range | Color |
|-------|---------|---------|-------------|-------|
| 0 | Absence of Capabilities | غياب القدرات | 0 - 0.24 | Gray |
| 1 | Establishing | التأسيس | 0.25 - 1.24 | Red |
| 2 | Defined | التحديد | 1.25 - 2.49 | Orange |
| 3 | Activated | التفعيل | 2.5 - 3.99 | Yellow |
| 4 | Managed | الإدارة | 4 - 4.74 | Green |
| 5 | Pioneer | الريادة | 4.75 - 5 | Emerald |

## API Endpoints / نقاط النهاية

### Assessments / التقييمات
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/assessments` | List assessments |
| POST | `/api/v1/assessments` | Create assessment |
| GET | `/api/v1/assessments/{id}` | Get assessment |
| PUT | `/api/v1/assessments/{id}` | Update assessment |
| DELETE | `/api/v1/assessments/{id}` | Delete assessment |
| POST | `/api/v1/assessments/{id}/submit` | Submit assessment |
| GET | `/api/v1/assessments/{id}/responses` | Get responses |
| POST | `/api/v1/assessments/{id}/responses` | Save response |

### Tasks / المهام
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/tasks` | List tasks |
| POST | `/api/v1/tasks` | Create task |
| GET | `/api/v1/tasks/{id}` | Get task |
| PUT | `/api/v1/tasks/{id}` | Update task |
| DELETE | `/api/v1/tasks/{id}` | Delete task |
| PUT | `/api/v1/tasks/{id}/status` | Update status |
| GET | `/api/v1/tasks/my` | My assigned tasks |

### Scores / الدرجات
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/scores/maturity/{id}` | Get maturity score |
| GET | `/api/v1/scores/compliance/{id}` | Get compliance score |
| POST | `/api/v1/scores/recalculate/{id}` | Recalculate scores |

### Reports / التقارير
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/reports/assessment/{id}` | Get assessment report |
| GET | `/api/v1/reports/generate/{id}` | Generate report (JSON/Excel) |

### Dashboard / لوحة التحكم
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/dashboard/stats` | Get dashboard statistics |

### NDI Data / بيانات المؤشر
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/ndi/domains` | List domains |
| GET | `/api/v1/ndi/domains/{code}` | Get domain |
| GET | `/api/v1/ndi/domains/{code}/questions` | Get domain questions |
| GET | `/api/v1/ndi/questions/{code}` | Get question with levels |

## Environment Variables / متغيرات البيئة

Copy `.env.example` to `.env` and configure:

```env
# Database / قاعدة البيانات
POSTGRES_USER=ndi_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=ndi_db
DATABASE_URL=postgresql://ndi_user:password@postgres:5432/ndi_db

# Application / التطبيق
SECRET_KEY=your_secret_key
APP_ENV=production
DEBUG=false

# AI Providers (Optional) / مزودي الذكاء الاصطناعي
GOOGLE_API_KEY=your_google_api_key
OPENAI_API_KEY=your_openai_api_key

# Vector Database / قاعدة بيانات المتجهات
QDRANT_URL=http://qdrant:6333

# Redis (Optional) / ريدس
REDIS_URL=redis://redis:6379
```

## Score Calculation / حساب الدرجات

### Maturity Score / درجة النضج
The maturity score is calculated as the average of all selected levels across questions:

```
Maturity Score = Σ(Selected Levels) / Number of Answered Questions
```

Domain scores are calculated similarly for each domain.

### Compliance Score / درجة الامتثال
The compliance score is based on evidence-specification mapping:

```
Compliance % = (Specifications Met / Total Specifications) × 100
```

Each maturity level has associated acceptance criteria and specifications that must be evidenced.

## API Documentation / توثيق API

When running, access API documentation at:
- **Swagger UI**: http://localhost/api/docs
- **ReDoc**: http://localhost/api/redoc
- **OpenAPI JSON**: http://localhost/api/openapi.json

## Docker Image / صورة Docker

The unified Docker image is automatically built and published to GitHub Container Registry:

```bash
# Pull latest image / سحب أحدث صورة
docker pull ghcr.io/azizmazrou/ndi-compliance-system:latest

# Pull specific version / سحب إصدار محدد
docker pull ghcr.io/azizmazrou/ndi-compliance-system:v1.0.0
```

## Development / التطوير

### Running Tests
```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Database Migrations
```bash
cd backend
alembic upgrade head
```

### Seeding Data
```bash
docker-compose exec app /opt/venv/bin/python -m app.scripts.seed_ndi_data
```

## License / الترخيص

MIT License

## References / المراجع

- [NDI English PDF](https://sdaia.gov.sa/en/Research/Documents/National-Data-Index_v1.0_EN.PDF)
- [NDI Arabic PDF](https://sdaia.gov.sa/ar/Research/Documents/National-Data-Index_v1.0_AR.PDF)
- [SDAIA Website](https://sdaia.gov.sa)

## Support / الدعم

For issues and feature requests, please use the GitHub issue tracker.

للمشاكل وطلبات الميزات، يرجى استخدام متتبع المشاكل على GitHub.
