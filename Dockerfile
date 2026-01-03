# =============================================================================
# NDI Compliance System - Unified Dockerfile
# نظام الامتثال لمؤشر البيانات الوطني - ملف Docker الموحد
# =============================================================================
# This single image contains both backend (FastAPI) and frontend (Next.js)
# هذه الصورة الموحدة تحتوي على الخلفية والواجهة الأمامية

# -----------------------------------------------------------------------------
# Stage 1: Backend Builder - مرحلة بناء الخلفية
# -----------------------------------------------------------------------------
FROM python:3.11-slim AS backend-builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# -----------------------------------------------------------------------------
# Stage 2: Frontend Builder - مرحلة بناء الواجهة الأمامية
# -----------------------------------------------------------------------------
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY frontend/package.json ./

# Install dependencies (use npm install instead of npm ci for flexibility)
RUN npm install --legacy-peer-deps

# Copy frontend source
COPY frontend/ ./

# Set build-time environment variables
ARG NEXT_PUBLIC_API_URL=/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js app
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 3: Production Image - مرحلة الإنتاج
# -----------------------------------------------------------------------------
FROM python:3.11-slim AS production

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    nginx \
    supervisor \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --shell /bin/bash --uid 1000 appuser

# Copy Python virtual environment
COPY --from=backend-builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy backend application
COPY --chown=appuser:appuser backend/ /app/backend/
COPY --chown=appuser:appuser data/ /app/data/

# Copy frontend build - Full Next.js build (no standalone)
COPY --from=frontend-builder /app/.next /app/frontend/.next
COPY --from=frontend-builder /app/public /app/frontend/public
COPY --from=frontend-builder /app/node_modules /app/frontend/node_modules
COPY --from=frontend-builder /app/package.json /app/frontend/package.json
COPY --from=frontend-builder /app/next.config.js /app/frontend/next.config.js
COPY --from=frontend-builder /app/messages /app/frontend/messages
COPY --from=frontend-builder /app/i18n.ts /app/frontend/i18n.ts

# Create necessary directories
RUN mkdir -p /app/uploads /app/logs /var/log/supervisor \
    && chown -R appuser:appuser /app /var/log/supervisor

# Copy configuration files
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    APP_ENV=production \
    NODE_ENV=production \
    PORT=3388 \
    PGSSLMODE=disable

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:80/health || curl -f http://localhost:8833/health || exit 1

# Expose ports for remote access
EXPOSE 80 8833 3388

# Start supervisor (manages nginx, backend, and frontend)
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
