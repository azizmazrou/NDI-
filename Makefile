# =============================================================================
# NDI Compliance System - Makefile
# نظام الامتثال لمؤشر البيانات الوطني - ملف Make
# =============================================================================

.PHONY: help dev build clean logs shell seed migrate backup

# Default target
help:
	@echo "NDI Compliance System - Docker Commands"
	@echo "نظام الامتثال لمؤشر البيانات الوطني - أوامر Docker"
	@echo ""
	@echo "Main Commands / الأوامر الرئيسية:"
	@echo "  make up           - Start all services / بدء جميع الخدمات"
	@echo "  make up-build     - Build and start / بناء وبدء"
	@echo "  make down         - Stop all services / إيقاف جميع الخدمات"
	@echo "  make restart      - Restart all services / إعادة تشغيل الخدمات"
	@echo ""
	@echo "Database / قاعدة البيانات:"
	@echo "  make migrate      - Run database migrations / تشغيل ترحيل قاعدة البيانات"
	@echo "  make seed         - Seed NDI data / زرع بيانات المؤشر"
	@echo "  make backup       - Backup database / نسخ احتياطي لقاعدة البيانات"
	@echo ""
	@echo "Utilities / أدوات مساعدة:"
	@echo "  make logs         - View all logs / عرض جميع السجلات"
	@echo "  make shell        - Shell into app / الدخول للتطبيق"
	@echo "  make shell-db     - Shell into database / الدخول لقاعدة البيانات"
	@echo "  make clean        - Clean Docker resources / تنظيف موارد Docker"
	@echo "  make status       - Show service status / عرض حالة الخدمات"
	@echo "  make health       - Check service health / فحص صحة الخدمات"

# =============================================================================
# Main Commands / الأوامر الرئيسية
# =============================================================================

up:
	docker-compose up -d

up-build:
	docker-compose up -d --build

down:
	docker-compose down

restart:
	docker-compose restart

# =============================================================================
# Database Commands / أوامر قاعدة البيانات
# =============================================================================

migrate:
	docker-compose exec app /opt/venv/bin/alembic -c /app/backend/alembic.ini upgrade head

seed:
	docker-compose exec app /opt/venv/bin/python -m app.scripts.seed_ndi_data

backup:
	@mkdir -p backups
	docker-compose exec postgres pg_dump -U ndi_user ndi_db > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Backup saved to backups/ / تم حفظ النسخة الاحتياطية في backups/"

restore:
	@echo "Usage: cat backup.sql | docker-compose exec -T postgres psql -U ndi_user -d ndi_db"

# =============================================================================
# Utility Commands / أوامر مساعدة
# =============================================================================

logs:
	docker-compose logs -f

logs-app:
	docker-compose logs -f app

shell:
	docker-compose exec app /bin/bash

shell-db:
	docker-compose exec postgres psql -U ndi_user -d ndi_db

status:
	docker-compose ps

health:
	@echo "Checking service health... / فحص صحة الخدمات..."
	@curl -s http://localhost/health && echo " App OK ✓" || echo " App FAIL ✗"
	@docker-compose exec -T postgres pg_isready -U ndi_user -d ndi_db > /dev/null && echo " Database OK ✓" || echo " Database FAIL ✗"
	@docker-compose exec -T redis redis-cli ping > /dev/null && echo " Redis OK ✓" || echo " Redis FAIL ✗"

# =============================================================================
# Cleanup Commands / أوامر التنظيف
# =============================================================================

clean:
	docker-compose down -v --remove-orphans
	docker system prune -f

clean-all:
	docker-compose down -v --remove-orphans
	docker system prune -af
	docker volume prune -f

# =============================================================================
# Build Commands / أوامر البناء
# =============================================================================

build:
	docker-compose build

build-no-cache:
	docker-compose build --no-cache
