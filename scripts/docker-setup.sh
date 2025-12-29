#!/bin/bash
# =============================================================================
# NDI Compliance System - Docker Setup Script
# نظام الامتثال لمؤشر البيانات الوطني - سكريبت إعداد Docker
# =============================================================================

set -e

echo "======================================"
echo "NDI Compliance System - Docker Setup"
echo "نظام الامتثال لمؤشر البيانات الوطني"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
check_docker() {
    echo "Checking Docker installation... / فحص تثبيت Docker..."
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
        echo -e "${RED}Docker غير مثبت. يرجى تثبيت Docker أولاً.${NC}"
        exit 1
    fi
    echo -e "${GREEN}Docker is installed ✓${NC}"
}

# Check if Docker Compose is installed
check_docker_compose() {
    echo "Checking Docker Compose... / فحص Docker Compose..."
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}Docker Compose is not installed.${NC}"
        exit 1
    fi
    echo -e "${GREEN}Docker Compose is installed ✓${NC}"
}

# Check Docker daemon
check_docker_daemon() {
    echo "Checking Docker daemon... / فحص خدمة Docker..."
    if ! docker info &> /dev/null; then
        echo -e "${RED}Docker daemon is not running. Please start Docker.${NC}"
        echo -e "${RED}خدمة Docker غير قيد التشغيل. يرجى بدء Docker.${NC}"
        exit 1
    fi
    echo -e "${GREEN}Docker daemon is running ✓${NC}"
}

# Setup environment file
setup_env() {
    echo ""
    echo "Setting up environment... / إعداد البيئة..."

    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            echo -e "${GREEN}Created .env from .env.example ✓${NC}"
            echo -e "${YELLOW}Please edit .env with your configuration${NC}"
            echo -e "${YELLOW}يرجى تعديل .env بالإعدادات الخاصة بك${NC}"
        else
            echo -e "${RED}.env.example not found${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}.env already exists ✓${NC}"
    fi
}

# Create required directories
create_directories() {
    echo ""
    echo "Creating directories... / إنشاء المجلدات..."

    mkdir -p nginx/ssl
    mkdir -p backups
    mkdir -p logs

    echo -e "${GREEN}Directories created ✓${NC}"
}

# Build Docker images
build_images() {
    echo ""
    echo "Building Docker images... / بناء صور Docker..."
    echo "This may take a few minutes... / قد يستغرق هذا بضع دقائق..."

    docker-compose build

    echo -e "${GREEN}Images built successfully ✓${NC}"
}

# Start services
start_services() {
    echo ""
    echo "Starting services... / بدء الخدمات..."

    docker-compose up -d

    echo -e "${GREEN}Services started ✓${NC}"
}

# Wait for services
wait_for_services() {
    echo ""
    echo "Waiting for services to be ready... / انتظار جاهزية الخدمات..."

    # Wait for PostgreSQL
    echo -n "PostgreSQL: "
    for i in {1..30}; do
        if docker-compose exec -T postgres pg_isready -U ndi_user -d ndi_db &> /dev/null; then
            echo -e "${GREEN}Ready ✓${NC}"
            break
        fi
        echo -n "."
        sleep 2
    done

    # Wait for Backend
    echo -n "Backend: "
    for i in {1..30}; do
        if curl -s http://localhost:8000/health &> /dev/null; then
            echo -e "${GREEN}Ready ✓${NC}"
            break
        fi
        echo -n "."
        sleep 2
    done
}

# Run migrations and seed data
setup_database() {
    echo ""
    echo "Setting up database... / إعداد قاعدة البيانات..."

    # Run migrations
    echo "Running migrations... / تشغيل الترحيلات..."
    docker-compose exec -T backend alembic upgrade head || true

    # Seed NDI data
    echo "Seeding NDI data... / زرع بيانات المؤشر..."
    docker-compose exec -T backend python -m app.scripts.seed_ndi_data || true

    echo -e "${GREEN}Database setup complete ✓${NC}"
}

# Print access information
print_info() {
    echo ""
    echo "======================================"
    echo -e "${GREEN}Setup Complete! / تم الإعداد!${NC}"
    echo "======================================"
    echo ""
    echo "Access the application at:"
    echo "الوصول إلى التطبيق على:"
    echo ""
    echo "  Frontend / الواجهة الأمامية:"
    echo "    http://localhost:3000"
    echo ""
    echo "  Backend API / واجهة API:"
    echo "    http://localhost:8000/api/docs"
    echo ""
    echo "  API Documentation / توثيق API:"
    echo "    http://localhost:8000/api/redoc"
    echo ""
    echo "Useful commands / أوامر مفيدة:"
    echo ""
    echo "  View logs / عرض السجلات:"
    echo "    docker-compose logs -f"
    echo ""
    echo "  Stop services / إيقاف الخدمات:"
    echo "    docker-compose down"
    echo ""
    echo "  Restart services / إعادة تشغيل الخدمات:"
    echo "    docker-compose restart"
    echo ""
}

# Main
main() {
    check_docker
    check_docker_compose
    check_docker_daemon
    setup_env
    create_directories
    build_images
    start_services
    wait_for_services
    setup_database
    print_info
}

# Run
main
