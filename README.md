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

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- Docker & Docker Compose (optional)

### Using Docker

```bash
docker-compose up -d
```

### Manual Setup

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

### Database Migrations

```bash
cd backend
alembic upgrade head
```

### Seed NDI Data

```bash
cd backend
python -m app.scripts.seed_ndi_data
```

## Project Structure

```
ndi-system/
├── frontend/          # Next.js 14 application
├── backend/           # FastAPI application
├── ai/                # AI/RAG modules
├── data/              # Seed data (JSON)
├── docker-compose.yml
└── README.md
```

## NDI Structure

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

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/ndi_db

# AI Providers
GOOGLE_API_KEY=your_key
AZURE_OPENAI_API_KEY=your_key

# Auth
NEXTAUTH_SECRET=your_secret
```

## License

MIT License

## References

- [NDI English PDF](https://sdaia.gov.sa/en/Research/Documents/National-Data-Index_v1.0_EN.PDF)
- [NDI Arabic PDF](https://sdaia.gov.sa/ar/Research/Documents/National-Data-Index_v1.0_AR.PDF)
