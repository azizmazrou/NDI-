# Docker Guide - NDI Compliance System

<div dir="rtl">

# دليل Docker - نظام الامتثال لمؤشر البيانات الوطني

</div>

---

## Table of Contents / الفهرس

- [Prerequisites / المتطلبات](#prerequisites--المتطلبات)
- [Quick Start / البداية السريعة](#quick-start--البداية-السريعة)
- [Development Environment / بيئة التطوير](#development-environment--بيئة-التطوير)
- [Production Deployment / نشر الإنتاج](#production-deployment--نشر-الإنتاج)
- [Services Overview / نظرة عامة على الخدمات](#services-overview--نظرة-عامة-على-الخدمات)
- [Environment Variables / متغيرات البيئة](#environment-variables--متغيرات-البيئة)
- [Commands Reference / مرجع الأوامر](#commands-reference--مرجع-الأوامر)
- [Troubleshooting / استكشاف الأخطاء](#troubleshooting--استكشاف-الأخطاء)

---

## Prerequisites / المتطلبات

### English

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 4GB RAM available
- 10GB free disk space

### العربية

- محرك Docker الإصدار 20.10 أو أحدث
- Docker Compose الإصدار 2.0 أو أحدث
- ذاكرة RAM متاحة 4 جيجابايت على الأقل
- مساحة قرص حرة 10 جيجابايت

---

## Quick Start / البداية السريعة

### English

```bash
# Clone the repository
git clone https://github.com/your-org/ndi-compliance-system.git
cd ndi-compliance-system

# Copy environment file
cp .env.example .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000/api/docs
```

### العربية

```bash
# استنساخ المستودع
git clone https://github.com/your-org/ndi-compliance-system.git
cd ndi-compliance-system

# نسخ ملف البيئة
cp .env.example .env

# بدء جميع الخدمات
docker-compose up -d

# عرض السجلات
docker-compose logs -f

# الوصول إلى التطبيق
# الواجهة الأمامية: http://localhost:3000
# واجهة API: http://localhost:8000/api/docs
```

---

## Development Environment / بيئة التطوير

### Starting Development Services / بدء خدمات التطوير

```bash
# Start all services with hot reload
docker-compose up -d

# Start only infrastructure (database, redis, qdrant)
docker-compose up -d postgres redis qdrant

# Start specific service
docker-compose up -d backend

# Rebuild after changes
docker-compose up -d --build backend
```

### Development Features / ميزات التطوير

| Feature | Description | الميزة | الوصف |
|---------|-------------|--------|-------|
| Hot Reload | Code changes reflect immediately | إعادة التحميل التلقائي | تظهر تغييرات الكود فوراً |
| Volume Mounts | Source code mounted for editing | تحميل المجلدات | الكود المصدري مُحمَّل للتعديل |
| Debug Mode | Detailed error messages | وضع التصحيح | رسائل خطأ مفصلة |

### Database Operations / عمليات قاعدة البيانات

```bash
# Run database migrations
docker-compose exec backend alembic upgrade head

# Seed NDI data
docker-compose exec backend python -m app.scripts.seed_ndi_data

# Access PostgreSQL shell
docker-compose exec postgres psql -U ndi_user -d ndi_db

# Backup database
docker-compose exec postgres pg_dump -U ndi_user ndi_db > backup.sql
```

---

## Production Deployment / نشر الإنتاج

### Preparation / التحضير

1. **Create production environment file / إنشاء ملف بيئة الإنتاج:**

```bash
cp .env.example .env.prod
```

2. **Configure production variables / تكوين متغيرات الإنتاج:**

```env
# Required / مطلوب
POSTGRES_USER=secure_user
POSTGRES_PASSWORD=very_secure_password_here
POSTGRES_DB=ndi_production

SECRET_KEY=your-very-long-random-secret-key

NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=another-very-long-random-secret

NEXT_PUBLIC_API_URL=https://your-domain.com/api/v1

# AI Keys (optional) / مفاتيح الذكاء الاصطناعي (اختياري)
GOOGLE_API_KEY=your-google-api-key
OPENAI_API_KEY=your-openai-api-key
```

### Deployment Commands / أوامر النشر

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d

# View production logs
docker-compose -f docker-compose.prod.yml logs -f

# Check service health
docker-compose -f docker-compose.prod.yml ps
```

### SSL/TLS Configuration / تكوين SSL/TLS

1. Place SSL certificates in `nginx/ssl/`:
   - `fullchain.pem` - Certificate chain
   - `privkey.pem` - Private key

2. Update `nginx/nginx.conf` to enable HTTPS server block

3. Restart nginx:
```bash
docker-compose -f docker-compose.prod.yml restart nginx
```

---

## Services Overview / نظرة عامة على الخدمات

### Architecture Diagram / مخطط البنية

```
┌─────────────────────────────────────────────────────────────┐
│                         Nginx                                │
│                    (Reverse Proxy)                          │
│                   المخدم العكسي                              │
└─────────────────────────────────────────────────────────────┘
                    │                    │
         ┌──────────┴──────────┐        │
         ▼                     ▼        │
┌─────────────────┐    ┌─────────────────┐
│    Frontend     │    │     Backend     │
│   (Next.js)     │    │   (FastAPI)     │
│  الواجهة الأمامية │    │    الخلفية      │
└─────────────────┘    └─────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│   PostgreSQL    │   │     Redis       │   │     Qdrant      │
│   (Database)    │   │    (Cache)      │   │ (Vector Store)  │
│  قاعدة البيانات  │   │ التخزين المؤقت  │   │ متجر المتجهات   │
└─────────────────┘   └─────────────────┘   └─────────────────┘
```

### Service Ports / منافذ الخدمات

| Service | Development Port | Production Port | الخدمة |
|---------|-----------------|-----------------|--------|
| Frontend | 3000 | 80/443 (via nginx) | الواجهة الأمامية |
| Backend | 8000 | Internal only | الخلفية |
| PostgreSQL | 5432 | Internal only | قاعدة البيانات |
| Redis | 6379 | Internal only | ذاكرة التخزين |
| Qdrant | 6333/6334 | Internal only | قاعدة المتجهات |

---

## Environment Variables / متغيرات البيئة

### Required Variables / المتغيرات المطلوبة

| Variable | Description | الوصف | Default |
|----------|-------------|-------|---------|
| `POSTGRES_USER` | Database username | اسم مستخدم قاعدة البيانات | `ndi_user` |
| `POSTGRES_PASSWORD` | Database password | كلمة مرور قاعدة البيانات | `ndi_password` |
| `POSTGRES_DB` | Database name | اسم قاعدة البيانات | `ndi_db` |
| `SECRET_KEY` | Application secret | مفتاح التطبيق السري | - |
| `NEXTAUTH_SECRET` | NextAuth secret | مفتاح NextAuth السري | - |

### Optional Variables / المتغيرات الاختيارية

| Variable | Description | الوصف |
|----------|-------------|-------|
| `GOOGLE_API_KEY` | Google Gemini API key | مفتاح Google Gemini |
| `OPENAI_API_KEY` | OpenAI API key | مفتاح OpenAI |
| `S3_BUCKET` | S3 bucket for file storage | حاوية S3 لتخزين الملفات |

---

## Commands Reference / مرجع الأوامر

### Docker Compose Commands / أوامر Docker Compose

```bash
# Start services / بدء الخدمات
docker-compose up -d

# Stop services / إيقاف الخدمات
docker-compose down

# Stop and remove volumes / إيقاف وحذف وحدات التخزين
docker-compose down -v

# Restart service / إعادة تشغيل خدمة
docker-compose restart backend

# View logs / عرض السجلات
docker-compose logs -f [service]

# Execute command in container / تنفيذ أمر في الحاوية
docker-compose exec backend [command]

# Build images / بناء الصور
docker-compose build

# Build without cache / بناء بدون ذاكرة مؤقتة
docker-compose build --no-cache
```

### Maintenance Commands / أوامر الصيانة

```bash
# Check service health / فحص صحة الخدمات
docker-compose ps

# View resource usage / عرض استخدام الموارد
docker stats

# Clean unused resources / تنظيف الموارد غير المستخدمة
docker system prune -a

# View container logs / عرض سجلات الحاوية
docker logs ndi-backend -f --tail 100
```

---

## Troubleshooting / استكشاف الأخطاء

### Common Issues / المشاكل الشائعة

#### Database Connection Error / خطأ اتصال قاعدة البيانات

```bash
# Check if postgres is running
docker-compose ps postgres

# View postgres logs
docker-compose logs postgres

# Restart postgres
docker-compose restart postgres
```

#### Build Failures / فشل البناء

```bash
# Clean build cache
docker builder prune

# Rebuild from scratch
docker-compose build --no-cache
```

#### Port Conflicts / تعارض المنافذ

```bash
# Check what's using a port
lsof -i :8000

# Change port in .env
BACKEND_PORT=8001
```

### Health Checks / فحوصات الصحة

```bash
# Backend health
curl http://localhost:8000/health

# Frontend health
curl http://localhost:3000

# PostgreSQL health
docker-compose exec postgres pg_isready -U ndi_user -d ndi_db

# Redis health
docker-compose exec redis redis-cli ping
```

### Logs Analysis / تحليل السجلات

```bash
# All logs with timestamps
docker-compose logs -f --timestamps

# Filter errors
docker-compose logs backend 2>&1 | grep -i error

# Last 100 lines
docker-compose logs --tail 100 backend
```

---

## Security Best Practices / أفضل ممارسات الأمان

### English

1. **Never commit `.env` files** - Add to `.gitignore`
2. **Use strong passwords** - Generate random secrets for production
3. **Keep images updated** - Regularly update base images
4. **Limit exposed ports** - Only expose necessary ports in production
5. **Use non-root users** - Containers run as non-root by default
6. **Enable health checks** - Monitor service availability
7. **Backup regularly** - Automate database backups

### العربية

1. **لا تقم بإيداع ملفات `.env`** - أضفها إلى `.gitignore`
2. **استخدم كلمات مرور قوية** - أنشئ مفاتيح عشوائية للإنتاج
3. **حدّث الصور باستمرار** - حدّث الصور الأساسية بانتظام
4. **قلل المنافذ المكشوفة** - اكشف فقط المنافذ الضرورية في الإنتاج
5. **استخدم مستخدمين غير جذريين** - الحاويات تعمل كغير جذرية افتراضياً
6. **فعّل فحوصات الصحة** - راقب توفر الخدمات
7. **انسخ احتياطياً بانتظام** - أتمت النسخ الاحتياطي لقاعدة البيانات

---

## Support / الدعم

For issues and questions:
- GitHub Issues: [Report an issue](https://github.com/your-org/ndi-compliance-system/issues)
- Documentation: [Full documentation](./README.md)

للمشاكل والأسئلة:
- مشاكل GitHub: [الإبلاغ عن مشكلة](https://github.com/your-org/ndi-compliance-system/issues)
- التوثيق: [التوثيق الكامل](./README.md)
