# NDI Compliance System
# نظام الامتثال لمؤشر البيانات الوطني (نضيء)

A comprehensive web system for assessing Saudi government entities' compliance with the National Data Index (NDI) issued by SDAIA.

نظام ويب شامل لتقييم امتثال الجهات الحكومية السعودية لمؤشر البيانات الوطني (NDI) الصادر من سدايا.

## Features / المميزات

- **Maturity Assessment** - تقييم النضج (42 questions)
- **Compliance Assessment** - تقييم الامتثال (191 specifications)
- **Operational Excellence** - التميز التشغيلي (6 domains)
- **AI-Powered Evidence Analysis** - تحليل الشواهد بالذكاء الاصطناعي
- **Bilingual Support (AR/EN)** - دعم ثنائي اللغة
- **RTL Interface** - واجهة تدعم الاتجاه من اليمين لليسار

## Technology Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL 15+ with pgvector
- **Vector DB**: Qdrant (for RAG)
- **AI**: LangChain + Google Gemini / Azure OpenAI
- **Auth**: NextAuth.js
- **i18n**: next-intl (AR/EN)
- **Container**: Docker with unified image (backend + frontend)

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

### Using Pre-built Docker Image / استخدام صورة Docker الجاهزة

```bash
# Pull the image / سحب الصورة
docker pull ghcr.io/azizmazrou/ndi-compliance-system:latest

# Run with docker-compose / التشغيل مع docker-compose
docker-compose up -d
```

### Manual Setup / الإعداد اليدوي

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Architecture / البنية

The system runs as a unified Docker container with:

```
┌─────────────────────────────────────────────────────────────┐
│                      NDI App Container                       │
│                      (Port 80)                               │
├─────────────────────────────────────────────────────────────┤
│                         Nginx                                │
│                    (Reverse Proxy)                          │
│                   /api/* → Backend                          │
│                   /*     → Frontend                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐              ┌─────────────────┐       │
│  │    Frontend     │              │     Backend     │       │
│  │   (Next.js)     │              │   (FastAPI)     │       │
│  │   Port 3000     │              │   Port 8000     │       │
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
├── Dockerfile           # Unified Docker image
├── docker-compose.yml   # Docker services configuration
├── Makefile            # Convenient commands
├── frontend/           # Next.js 14 application
│   ├── app/           # App router pages
│   ├── components/    # React components
│   ├── messages/      # i18n translations (ar/en)
│   └── lib/           # Utilities and API client
├── backend/            # FastAPI application
│   ├── app/
│   │   ├── models/    # SQLAlchemy models
│   │   ├── schemas/   # Pydantic schemas
│   │   ├── routers/   # API endpoints
│   │   └── services/  # Business logic
│   └── alembic/       # Database migrations
├── docker/             # Docker configuration
│   ├── nginx.conf     # Nginx reverse proxy
│   └── supervisord.conf # Process manager
├── data/               # Seed data (JSON)
└── docs/               # Documentation
```

## NDI Structure / هيكل المؤشر

### 14 Domains / المجالات الـ14

| Code | English | العربية |
|------|---------|---------|
| DG | Data Governance | حوكمة البيانات |
| MCM | Metadata and Data Catalog | البيانات الوصفية ودليل البيانات |
| DQ | Data Quality | جودة البيانات |
| DO | Data Operations | تخزين البيانات |
| DCM | Document and Content Management | إدارة المحتوى والوثائق |
| DAM | Data Architecture and Modelling | النمذجة وهيكلة البيانات |
| DSI | Data Sharing and Interoperability | تكامل البيانات ومشاركتها |
| RMD | Reference and Master Data Management | إدارة البيانات المرجعية والرئيسية |
| BIA | Business Intelligence and Analytics | ذكاء الأعمال والتحليلات |
| DVR | Data Value Realization | تحقيق القيمة من البيانات |
| OD | Open Data | البيانات المفتوحة |
| FOI | Freedom of Information | حرية المعلومات |
| DC | Data Classification | تصنيف البيانات |
| PDP | Personal Data Protection | حماية البيانات الشخصية |

### 6 Maturity Levels / مستويات النضج الـ6

| Level | English | العربية | Score Range |
|-------|---------|---------|-------------|
| 0 | Absence of Capabilities | غياب القدرات | 0 - 0.24 |
| 1 | Establishing | التأسيس | 0.25 - 1.24 |
| 2 | Defined | التحديد | 1.25 - 2.49 |
| 3 | Activated | التفعيل | 2.5 - 3.99 |
| 4 | Managed | الإدارة | 4 - 4.74 |
| 5 | Pioneer | الريادة | 4.75 - 5 |

## Environment Variables / متغيرات البيئة

Copy `.env.example` to `.env` and configure:

```env
# Database / قاعدة البيانات
POSTGRES_USER=ndi_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=ndi_db

# Application / التطبيق
SECRET_KEY=your_secret_key
APP_PORT=80

# Auth / المصادقة
NEXTAUTH_URL=http://localhost
NEXTAUTH_SECRET=your_secret

# AI Providers (Optional) / مزودي الذكاء الاصطناعي
GOOGLE_API_KEY=your_key
OPENAI_API_KEY=your_key
AZURE_OPENAI_API_KEY=your_key
```

## API Documentation / توثيق API

When running, access API documentation at:
- Swagger UI: http://localhost/docs
- ReDoc: http://localhost/redoc

## Docker Image / صورة Docker

The unified Docker image is automatically built and published to GitHub Container Registry:

```bash
# Pull latest image / سحب أحدث صورة
docker pull ghcr.io/azizmazrou/ndi-compliance-system:latest

# Pull specific version / سحب إصدار محدد
docker pull ghcr.io/azizmazrou/ndi-compliance-system:v1.0.0
```

## Documentation / التوثيق

- [Installation Guide / دليل التثبيت](./docs/INSTALLATION.md)
- [Docker Guide / دليل Docker](./docs/DOCKER.md)

## License

MIT License

## References / المراجع

- [NDI English PDF](https://sdaia.gov.sa/en/Research/Documents/National-Data-Index_v1.0_EN.PDF)
- [NDI Arabic PDF](https://sdaia.gov.sa/ar/Research/Documents/National-Data-Index_v1.0_AR.PDF)
