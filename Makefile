# =============================================================================
# NDI Compliance System - Makefile
# نظام الامتثال لمؤشر البيانات الوطني - ملف Make
# =============================================================================

.PHONY: help dev prod build clean logs shell seed migrate backup

# Default target
help:
	@echo "NDI Compliance System - Docker Commands"
	@echo "نظام الامتثال لمؤشر البيانات الوطني - أوامر Docker"
	@echo ""
	@echo "Development / التطوير:"
	@echo "  make dev          - Start development environment / بدء بيئة التطوير"
	@echo "  make dev-build    - Build and start dev environment / بناء وبدء بيئة التطوير"
	@echo "  make dev-down     - Stop development environment / إيقاف بيئة التطوير"
	@echo ""
	@echo "Production / الإنتاج:"
	@echo "  make prod         - Start production environment / بدء بيئة الإنتاج"
	@echo "  make prod-build   - Build and start production / بناء وبدء الإنتاج"
	@echo "  make prod-down    - Stop production environment / إيقاف بيئة الإنتاج"
	@echo ""
	@echo "Database / قاعدة البيانات:"
	@echo "  make migrate      - Run database migrations / تشغيل ترحيل قاعدة البيانات"
	@echo "  make seed         - Seed NDI data / زرع بيانات المؤشر"
	@echo "  make backup       - Backup database / نسخ احتياطي لقاعدة البيانات"
	@echo ""
	@echo "Utilities / أدوات مساعدة:"
	@echo "  make logs         - View all logs / عرض جميع السجلات"
	@echo "  make shell-back   - Shell into backend / الدخول للخلفية"
	@echo "  make shell-front  - Shell into frontend / الدخول للواجهة"
	@echo "  make clean        - Clean Docker resources / تنظيف موارد Docker"
	@echo "  make status       - Show service status / عرض حالة الخدمات"

# =============================================================================
# Development Commands / أوامر التطوير
# =============================================================================

dev:
	docker-compose up -d

dev-build:
	docker-compose up -d --build

dev-down:
	docker-compose down

dev-restart:
	docker-compose restart

# =============================================================================
# Production Commands / أوامر الإنتاج
# =============================================================================

prod:
	docker-compose -f docker-compose.prod.yml up -d

prod-build:
	docker-compose -f docker-compose.prod.yml up -d --build

prod-down:
	docker-compose -f docker-compose.prod.yml down

prod-restart:
	docker-compose -f docker-compose.prod.yml restart

# =============================================================================
# Database Commands / أوامر قاعدة البيانات
# =============================================================================

migrate:
	docker-compose exec backend alembic upgrade head

seed:
	docker-compose exec backend python -m app.scripts.seed_ndi_data

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

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

shell-back:
	docker-compose exec backend /bin/bash

shell-front:
	docker-compose exec frontend /bin/sh

shell-db:
	docker-compose exec postgres psql -U ndi_user -d ndi_db

status:
	docker-compose ps

health:
	@echo "Checking service health... / فحص صحة الخدمات..."
	@curl -s http://localhost:8000/health && echo " Backend OK ✓" || echo " Backend FAIL ✗"
	@curl -s http://localhost:3000 > /dev/null && echo " Frontend OK ✓" || echo " Frontend FAIL ✗"
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

build-backend:
	docker-compose build backend

build-frontend:
	docker-compose build frontend
