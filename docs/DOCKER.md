# Docker Guide - NDI Compliance System

<div dir="rtl">

# دليل Docker - نظام الامتثال لمؤشر البيانات الوطني

</div>

---

## Table of Contents / الفهرس

- [Overview / نظرة عامة](#overview--نظرة-عامة)
- [Prerequisites / المتطلبات](#prerequisites--المتطلبات)
- [Quick Start / البداية السريعة](#quick-start--البداية-السريعة)
- [Architecture / البنية](#architecture--البنية)
- [Configuration / الإعدادات](#configuration--الإعدادات)
- [Commands Reference / مرجع الأوامر](#commands-reference--مرجع-الأوامر)
- [Troubleshooting / استكشاف الأخطاء](#troubleshooting--استكشاف-الأخطاء)

---

## Overview / نظرة عامة

The NDI Compliance System uses a **unified Docker image** that contains both the backend (FastAPI) and frontend (Next.js) in a single container. This simplifies deployment and reduces complexity.

يستخدم نظام الامتثال لمؤشر البيانات الوطني **صورة Docker موحدة** تحتوي على كل من الخلفية (FastAPI) والواجهة الأمامية (Next.js) في حاوية واحدة. هذا يبسط النشر ويقلل التعقيد.

### Key Features / الميزات الرئيسية

| Feature | Description | الميزة | الوصف |
|---------|-------------|--------|-------|
| Unified Image | Single container for backend + frontend | صورة موحدة | حاوية واحدة للخلفية والواجهة |
| Nginx Proxy | Built-in reverse proxy | خادم Nginx | وكيل عكسي مدمج |
| Supervisord | Process manager for multiple services | مدير العمليات | إدارة خدمات متعددة |
| Single Port | Expose only port 80 | منفذ واحد | كشف المنفذ 80 فقط |

---

## Prerequisites / المتطلبات

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 4GB RAM available
- 10GB free disk space

---

## Quick Start / البداية السريعة

```bash
# Clone the repository / استنساخ المستودع
git clone https://github.com/azizmazrou/NDI-.git
cd NDI-

# Copy environment file / نسخ ملف البيئة
cp .env.example .env

# Start all services / بدء جميع الخدمات
docker-compose up -d

# View logs / عرض السجلات
docker-compose logs -f

# Access the application / الوصول إلى التطبيق
# http://localhost (port 80)
```

---

## Architecture / البنية

### System Architecture / بنية النظام

```
┌─────────────────────────────────────────────────────────────┐
│                    NDI App Container                         │
│                       (Port 80)                              │
├─────────────────────────────────────────────────────────────┤
│                     Supervisord                              │
│                  (Process Manager)                           │
├─────────────────────────────────────────────────────────────┤
│                        Nginx                                 │
│                   (Reverse Proxy)                            │
│              /api/* → Backend (8000)                         │
│              /docs, /redoc → Backend                         │
│              /* → Frontend (3000)                            │
├───────────────────────┬─────────────────────────────────────┤
│      Frontend         │           Backend                    │
│     (Next.js)         │          (FastAPI)                   │
│   127.0.0.1:3000      │       127.0.0.1:8000                 │
└───────────────────────┴─────────────────────────────────────┘
              │                           │
    ┌─────────┴─────────┬────────────────┴───────────┐
    ▼                   ▼                            ▼
┌─────────┐      ┌─────────────┐              ┌──────────┐
│PostgreSQL│     │    Redis    │              │  Qdrant  │
│  :5432   │     │    :6379    │              │  :6333   │
└─────────┘      └─────────────┘              └──────────┘
```

### Services / الخدمات

| Service | Port | Purpose | الخدمة | الغرض |
|---------|------|---------|--------|-------|
| app | 80 | Unified app (nginx + backend + frontend) | التطبيق | التطبيق الموحد |
| postgres | 5432 | PostgreSQL with pgvector | قاعدة البيانات | PostgreSQL مع pgvector |
| redis | 6379 | Cache and session storage | Redis | التخزين المؤقت |
| qdrant | 6333 | Vector database for RAG | Qdrant | قاعدة المتجهات |

---

## Configuration / الإعدادات

### Environment Variables / متغيرات البيئة

Create `.env` file from `.env.example`:

```env
# =============================================================================
# Database / قاعدة البيانات
# =============================================================================
POSTGRES_USER=ndi_user
POSTGRES_PASSWORD=ndi_password
POSTGRES_DB=ndi_db
POSTGRES_PORT=5432

# =============================================================================
# Redis
# =============================================================================
REDIS_PORT=6379

# =============================================================================
# Qdrant
# =============================================================================
QDRANT_HTTP_PORT=6333
QDRANT_GRPC_PORT=6334

# =============================================================================
# Application / التطبيق
# =============================================================================
APP_PORT=80
SECRET_KEY=your-secret-key-here

# =============================================================================
# Authentication / المصادقة
# =============================================================================
NEXTAUTH_URL=http://localhost
NEXTAUTH_SECRET=your-nextauth-secret

# =============================================================================
# AI Providers (Optional) / مزودي الذكاء الاصطناعي
# =============================================================================
GOOGLE_API_KEY=your-google-api-key
OPENAI_API_KEY=your-openai-api-key
AZURE_OPENAI_API_KEY=your-azure-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
```

### Generate Secure Secrets / إنشاء مفاتيح آمنة

```bash
# Generate SECRET_KEY
openssl rand -hex 32

# Generate NEXTAUTH_SECRET
openssl rand -base64 32
```

---

## Commands Reference / مرجع الأوامر

### Using Make / باستخدام Make

```bash
make up           # Start all services / بدء الخدمات
make up-build     # Build and start / بناء وبدء
make down         # Stop services / إيقاف الخدمات
make restart      # Restart services / إعادة التشغيل
make logs         # View logs / عرض السجلات
make logs-app     # View app logs / عرض سجلات التطبيق
make shell        # Shell into app / الدخول للتطبيق
make shell-db     # Shell into database / الدخول لقاعدة البيانات
make status       # Show status / عرض الحالة
make health       # Check health / فحص الصحة
make migrate      # Run migrations / تشغيل الترحيلات
make seed         # Seed NDI data / زرع البيانات
make backup       # Backup database / نسخ احتياطي
make build        # Build images / بناء الصور
make clean        # Clean resources / تنظيف الموارد
```

### Using Docker Compose / باستخدام Docker Compose

```bash
# Start services / بدء الخدمات
docker-compose up -d

# Stop services / إيقاف الخدمات
docker-compose down

# Stop and remove volumes / إيقاف وحذف وحدات التخزين
docker-compose down -v

# View logs / عرض السجلات
docker-compose logs -f app

# Execute command in container / تنفيذ أمر في الحاوية
docker-compose exec app /bin/bash

# Build images / بناء الصور
docker-compose build --no-cache
```

### Database Operations / عمليات قاعدة البيانات

```bash
# Run migrations / تشغيل الترحيلات
docker-compose exec app /opt/venv/bin/alembic -c /app/backend/alembic.ini upgrade head

# Seed NDI data / زرع بيانات المؤشر
docker-compose exec app /opt/venv/bin/python -m app.scripts.seed_ndi_data

# Access PostgreSQL shell / الدخول لقاعدة البيانات
docker-compose exec postgres psql -U ndi_user -d ndi_db

# Backup database / نسخ احتياطي
docker-compose exec postgres pg_dump -U ndi_user ndi_db > backup.sql

# Restore database / استعادة
cat backup.sql | docker-compose exec -T postgres psql -U ndi_user -d ndi_db
```

---

## Troubleshooting / استكشاف الأخطاء

### Common Issues / المشاكل الشائعة

#### Container Won't Start / الحاوية لا تعمل

```bash
# Check logs
docker-compose logs app

# Check all services status
docker-compose ps

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

#### Database Connection Error / خطأ اتصال قاعدة البيانات

```bash
# Check if postgres is running
docker-compose ps postgres

# View postgres logs
docker-compose logs postgres

# Restart postgres
docker-compose restart postgres

# Wait and retry
sleep 10 && docker-compose restart app
```

#### Port 80 Already in Use / المنفذ 80 مستخدم

```bash
# Check what's using port 80
sudo lsof -i :80

# Change port in .env
APP_PORT=8080

# Or stop conflicting service
sudo systemctl stop nginx  # if nginx is running
```

### Health Checks / فحوصات الصحة

```bash
# Overall health check
curl http://localhost/health

# Backend health
docker-compose exec app curl http://127.0.0.1:8000/health

# Frontend health
docker-compose exec app curl http://127.0.0.1:3000

# PostgreSQL health
docker-compose exec postgres pg_isready -U ndi_user -d ndi_db

# Redis health
docker-compose exec redis redis-cli ping
```

### View Internal Logs / عرض السجلات الداخلية

```bash
# Supervisor logs
docker-compose exec app cat /var/log/supervisor/supervisord.log

# Nginx logs
docker-compose exec app cat /var/log/supervisor/nginx.log
docker-compose exec app cat /var/log/supervisor/nginx-error.log

# Backend logs
docker-compose exec app cat /var/log/supervisor/backend.log

# Frontend logs
docker-compose exec app cat /var/log/supervisor/frontend.log
```

---

## Pre-built Images / الصور الجاهزة

### Using GitHub Container Registry / استخدام سجل حاويات GitHub

```bash
# Pull latest image / سحب أحدث صورة
docker pull ghcr.io/azizmazrou/ndi-compliance-system:latest

# Create override file / إنشاء ملف التجاوز
cat > docker-compose.override.yml << 'EOF'
version: '3.8'
services:
  app:
    image: ghcr.io/azizmazrou/ndi-compliance-system:latest
    build: !reset null
EOF

# Start with pre-built image / بدء بالصورة الجاهزة
docker-compose up -d
```

---

## Security Best Practices / أفضل ممارسات الأمان

1. **Never commit `.env` files** - Add to `.gitignore`
2. **Use strong passwords** - Generate random secrets for production
3. **Keep images updated** - Regularly update base images
4. **Backup regularly** - Automate database backups
5. **Use HTTPS in production** - Configure SSL/TLS certificates

---

## Support / الدعم

- GitHub Issues: [Report an issue](https://github.com/azizmazrou/NDI-/issues)
- Documentation: [README](../README.md)
- Installation Guide: [INSTALLATION.md](./INSTALLATION.md)
