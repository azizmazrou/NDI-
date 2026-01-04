# Installation Guide - NDI Compliance System

<div dir="rtl">

# دليل التثبيت - نظام الامتثال لمؤشر البيانات الوطني

</div>

---

## Table of Contents / الفهرس

1. [System Requirements / متطلبات النظام](#1-system-requirements--متطلبات-النظام)
2. [Quick Installation / التثبيت السريع](#2-quick-installation--التثبيت-السريع)
3. [Manual Installation / التثبيت اليدوي](#3-manual-installation--التثبيت-اليدوي)
4. [Using Pre-built Images / استخدام الصور الجاهزة](#4-using-pre-built-images--استخدام-الصور-الجاهزة)
5. [Configuration / الإعدادات](#5-configuration--الإعدادات)
6. [Post-Installation / ما بعد التثبيت](#6-post-installation--ما-بعد-التثبيت)
7. [Upgrading / الترقية](#7-upgrading--الترقية)
8. [Uninstallation / إلغاء التثبيت](#8-uninstallation--إلغاء-التثبيت)

---

## 1. System Requirements / متطلبات النظام

### Minimum Requirements / الحد الأدنى من المتطلبات

| Component | Minimum | Recommended | المكون |
|-----------|---------|-------------|--------|
| CPU | 2 cores | 4+ cores | المعالج |
| RAM | 4 GB | 8+ GB | الذاكرة |
| Storage | 20 GB | 50+ GB SSD | التخزين |
| OS | Ubuntu 20.04+ / Debian 11+ | Ubuntu 22.04 LTS | نظام التشغيل |

### Software Requirements / متطلبات البرمجيات

| Software | Version | Required | البرنامج |
|----------|---------|----------|---------|
| Docker | 20.10+ | ✅ Yes | Docker |
| Docker Compose | 2.0+ | ✅ Yes | Docker Compose |
| Git | 2.30+ | ✅ Yes | Git |
| Make | Any | ⚡ Optional | Make |

### Check Your System / فحص نظامك

```bash
# Check Docker version / فحص إصدار Docker
docker --version

# Check Docker Compose version / فحص إصدار Docker Compose
docker compose version

# Check available resources / فحص الموارد المتاحة
free -h
df -h
```

---

## 2. Quick Installation / التثبيت السريع

### One-Command Installation / التثبيت بأمر واحد

```bash
# Clone and setup / الاستنساخ والإعداد
git clone https://github.com/azizmazrou/NDI-.git
cd NDI-
cp .env.example .env
docker-compose up -d
```

### Using Make / باستخدام Make

```bash
git clone https://github.com/azizmazrou/NDI-.git
cd NDI-
cp .env.example .env
make up-build
make seed
```

### Access / الوصول

After installation, access the application at:

بعد التثبيت، يمكنك الوصول إلى التطبيق على:

- **Application / التطبيق**: http://localhost (port 80)
- **API Documentation / توثيق API**: http://localhost/api/docs
- **API (ReDoc) / واجهة API**: http://localhost/api/redoc

---

## 3. Manual Installation / التثبيت اليدوي

### Step 1: Clone Repository / الخطوة 1: استنساخ المستودع

```bash
git clone https://github.com/azizmazrou/NDI-.git
cd NDI-
```

### Step 2: Configure Environment / الخطوة 2: تكوين البيئة

```bash
# Copy example environment file / نسخ ملف البيئة المثال
cp .env.example .env

# Edit configuration / تعديل الإعدادات
nano .env  # or use any text editor
```

### Step 3: Start Infrastructure / الخطوة 3: بدء البنية التحتية

```bash
# Start database, cache, and vector store
# بدء قاعدة البيانات والتخزين المؤقت ومخزن المتجهات
docker-compose up -d postgres redis qdrant

# Wait for services to be ready / انتظار جاهزية الخدمات
sleep 30

# Check service health / فحص صحة الخدمات
docker-compose ps
```

### Step 4: Start Application / الخطوة 4: بدء التطبيق

```bash
# Start the unified app container / بدء حاوية التطبيق الموحدة
docker-compose up -d app

# View logs / عرض السجلات
docker-compose logs -f app
```

### Step 5: Initialize Database / الخطوة 5: تهيئة قاعدة البيانات

```bash
# Run database migrations / تشغيل ترحيلات قاعدة البيانات
docker-compose exec app /opt/venv/bin/alembic -c /app/backend/alembic.ini upgrade head

# Seed NDI data (domains, questions, levels)
# زرع بيانات المؤشر (المجالات، الأسئلة، المستويات)
docker-compose exec app /opt/venv/bin/python -m app.scripts.seed_ndi_data
```

### Step 6: Verify Installation / الخطوة 6: التحقق من التثبيت

```bash
# Check all services are running / التحقق من تشغيل جميع الخدمات
docker-compose ps

# Test application health / اختبار صحة التطبيق
curl http://localhost/health

# Test frontend / اختبار الواجهة الأمامية
curl -I http://localhost

# Test API / اختبار API
curl http://localhost/api/v1/ndi/domains
```

---

## 4. Using Pre-built Images / استخدام الصور الجاهزة

### From GitHub Container Registry / من سجل حاويات GitHub

```bash
# Pull pre-built image / سحب الصورة الجاهزة
docker pull ghcr.io/azizmazrou/ndi-compliance-system:latest
```

### Create docker-compose.override.yml / إنشاء ملف التجاوز

```yaml
# docker-compose.override.yml
version: '3.8'

services:
  app:
    image: ghcr.io/azizmazrou/ndi-compliance-system:latest
    build: !reset null
```

### Run with Pre-built Images / التشغيل بالصور الجاهزة

```bash
docker-compose up -d
```

---

## 5. Configuration / الإعدادات

### Environment Variables / متغيرات البيئة

Create and edit `.env` file / إنشاء وتعديل ملف `.env`:

```env
# =============================================================================
# Database Configuration / إعدادات قاعدة البيانات
# =============================================================================
POSTGRES_USER=ndi_user
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=ndi_db
POSTGRES_PORT=5432

# =============================================================================
# Redis Configuration / إعدادات Redis
# =============================================================================
REDIS_PORT=6379

# =============================================================================
# Qdrant Configuration / إعدادات Qdrant
# =============================================================================
QDRANT_HTTP_PORT=6333
QDRANT_GRPC_PORT=6334

# =============================================================================
# Backend Configuration / إعدادات الخلفية
# =============================================================================
BACKEND_PORT=8833
SECRET_KEY=generate-a-long-random-secret-key-here
APP_ENV=production
DEBUG=false

# =============================================================================
# Frontend Configuration / إعدادات الواجهة الأمامية
# =============================================================================
FRONTEND_PORT=3388
NEXT_PUBLIC_API_URL=/api/v1

# =============================================================================
# AI Configuration (Optional) / إعدادات الذكاء الاصطناعي (اختياري)
# =============================================================================
# Google Gemini
GOOGLE_API_KEY=your-google-api-key

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Azure OpenAI
AZURE_OPENAI_API_KEY=your-azure-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
```

### Generate Secure Secrets / إنشاء مفاتيح آمنة

```bash
# Generate SECRET_KEY / إنشاء SECRET_KEY
openssl rand -hex 32

# Generate NEXTAUTH_SECRET / إنشاء NEXTAUTH_SECRET
openssl rand -base64 32
```

### SSL/TLS Configuration / إعدادات SSL/TLS

For production with HTTPS / للإنتاج مع HTTPS:

```bash
# Create SSL directory / إنشاء مجلد SSL
mkdir -p nginx/ssl

# Option 1: Use Let's Encrypt / الخيار 1: استخدام Let's Encrypt
sudo certbot certonly --standalone -d your-domain.com
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/

# Option 2: Self-signed (development only) / الخيار 2: موقعة ذاتياً (للتطوير فقط)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/privkey.pem \
  -out nginx/ssl/fullchain.pem
```

---

## 6. Post-Installation / ما بعد التثبيت

### Configure Organization Settings / إعداد معلومات الجهة

The system is configured for a single organization. Update organization settings via:

النظام مُعد لجهة واحدة. قم بتحديث إعدادات الجهة عبر:

1. **Dashboard Settings** - Go to Settings in the dashboard
2. **API** - Use the settings API endpoint:

```bash
curl -X PUT http://localhost/api/v1/settings/organization \
  -H "Content-Type: application/json" \
  -d '{
    "name_en": "Your Organization Name",
    "name_ar": "اسم الجهة",
    "sector": "Government",
    "website": "https://example.gov.sa"
  }'
```

### Create Your First Assessment / إنشاء أول تقييم

```bash
# Create a maturity assessment / إنشاء تقييم نضج
curl -X POST http://localhost/api/v1/assessments \
  -H "Content-Type: application/json" \
  -d '{
    "assessment_type": "maturity",
    "name": "Q1 2025 Assessment",
    "target_level": 3
  }'
```

### Verify NDI Data / التحقق من بيانات المؤشر

```bash
# Check domains / فحص المجالات
curl http://localhost/api/v1/ndi/domains | jq

# Check questions / فحص الأسئلة
curl http://localhost/api/v1/ndi/domains/DG/questions | jq
```

### Setup Backups / إعداد النسخ الاحتياطي

```bash
# Create backup script / إنشاء سكريبت النسخ الاحتياطي
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker-compose exec -T postgres pg_dump -U ndi_user ndi_db > "$BACKUP_DIR/db_$DATE.sql"

# Compress
gzip "$BACKUP_DIR/db_$DATE.sql"

# Keep only last 7 days
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/db_$DATE.sql.gz"
EOF

chmod +x backup.sh

# Add to crontab (daily at 2 AM) / إضافة إلى crontab (يومياً الساعة 2 صباحاً)
(crontab -l 2>/dev/null; echo "0 2 * * * cd $(pwd) && ./backup.sh") | crontab -
```

---

## 7. Upgrading / الترقية

### Standard Upgrade / الترقية العادية

```bash
# Pull latest changes / سحب آخر التغييرات
git pull origin main

# Backup database / نسخ احتياطي لقاعدة البيانات
make backup

# Rebuild and restart / إعادة البناء والتشغيل
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Run migrations / تشغيل الترحيلات
docker-compose exec app /opt/venv/bin/alembic -c /app/backend/alembic.ini upgrade head

# Verify / التحقق
make health
```

### Upgrade with Pre-built Images / الترقية بالصور الجاهزة

```bash
# Pull latest image / سحب أحدث الصورة
docker pull ghcr.io/azizmazrou/ndi-compliance-system:latest

# Restart services / إعادة تشغيل الخدمات
docker-compose up -d --force-recreate app

# Run migrations / تشغيل الترحيلات
docker-compose exec app /opt/venv/bin/alembic -c /app/backend/alembic.ini upgrade head
```

### Rollback / التراجع

```bash
# Stop services / إيقاف الخدمات
docker-compose down

# Checkout previous version / استعادة الإصدار السابق
git checkout v1.0.0  # or specific commit

# Restore database backup / استعادة النسخة الاحتياطية
gunzip < backups/db_YYYYMMDD_HHMMSS.sql.gz | \
  docker-compose exec -T postgres psql -U ndi_user -d ndi_db

# Rebuild and start / إعادة البناء والتشغيل
docker-compose up -d --build
```

---

## 8. Uninstallation / إلغاء التثبيت

### Stop Services / إيقاف الخدمات

```bash
docker-compose down
```

### Remove Data (Optional) / حذف البيانات (اختياري)

```bash
# Remove all containers and volumes / حذف جميع الحاويات ووحدات التخزين
docker-compose down -v

# Remove Docker images / حذف صور Docker
docker rmi $(docker images "ndi-*" -q)
```

### Complete Cleanup / تنظيف كامل

```bash
# Stop and remove everything / إيقاف وحذف كل شيء
docker-compose down -v --rmi all --remove-orphans

# Remove project directory / حذف مجلد المشروع
cd ..
rm -rf NDI-
```

---

## Troubleshooting / استكشاف الأخطاء

### Common Issues / المشاكل الشائعة

#### Port Already in Use / المنفذ قيد الاستخدام

```bash
# Check what's using the port / فحص ما يستخدم المنفذ
sudo lsof -i :80

# Kill the process or change port in .env
# إنهاء العملية أو تغيير المنفذ في .env
```

#### Database Connection Failed / فشل اتصال قاعدة البيانات

```bash
# Check PostgreSQL logs / فحص سجلات PostgreSQL
docker-compose logs postgres

# Restart PostgreSQL / إعادة تشغيل PostgreSQL
docker-compose restart postgres
```

#### Out of Memory / نفاد الذاكرة

```bash
# Check Docker memory usage / فحص استخدام ذاكرة Docker
docker stats

# Increase Docker memory limit in Docker Desktop settings
# زيادة حد الذاكرة في إعدادات Docker Desktop
```

#### API Returning 404 / API يرجع 404

```bash
# Check if backend is running / تحقق من تشغيل الخلفية
docker-compose exec app curl http://127.0.0.1:8833/health

# Check nginx logs / فحص سجلات nginx
docker-compose exec app cat /var/log/nginx/error.log
```

### Getting Help / الحصول على المساعدة

- **GitHub Issues**: [Report a bug](https://github.com/azizmazrou/NDI-/issues)
- **Documentation**: [Full docs](./README.md)
- **Docker Guide**: [Docker docs](./DOCKER.md)

---

## Next Steps / الخطوات التالية

1. ✅ Installation complete / اكتمل التثبيت
2. 📝 Configure organization settings / إعداد معلومات الجهة
3. 📊 Start your first assessment / بدء أول تقييم
4. 👥 Assign tasks to users / تعيين المهام للمستخدمين
5. 📄 Generate reports / إنشاء التقارير
