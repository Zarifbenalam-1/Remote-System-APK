# =============================================================================
# ENTERPRISE REMOTE DEVICE MANAGEMENT SERVER - DOCKERFILE
# =============================================================================
# Multi-stage production-ready Docker build for the Remote Device Management Server
# Features: Security hardening, minimal attack surface, health checks, non-root user
# =============================================================================

# =============================================================================
# STAGE 1: DEPENDENCY INSTALLATION
# =============================================================================
FROM node:18-alpine AS dependencies

# Install security updates and build dependencies
RUN apk update && apk upgrade && \
    apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production --no-audit --no-fund && \
    npm cache clean --force

# =============================================================================
# STAGE 2: APPLICATION BUILD
# =============================================================================
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files and source code
COPY package*.json ./
COPY . .

# Install all dependencies (including dev dependencies)
RUN npm ci --no-audit --no-fund

# Run build steps (if any)
# RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# =============================================================================
# STAGE 3: PRODUCTION RUNTIME
# =============================================================================
FROM node:18-alpine AS production

# Install runtime dependencies and security updates
RUN apk update && apk upgrade && \
    apk add --no-cache \
    dumb-init \
    curl \
    tini \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Create app directory with proper permissions
WORKDIR /app
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Copy production dependencies from dependencies stage
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodejs:nodejs . .

# Create uploads directory with proper permissions
RUN mkdir -p uploads logs && \
    chmod 755 uploads logs

# Expose ports
EXPOSE 3000 9090

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Use tini as PID 1 for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["npm", "start"]

# =============================================================================
# STAGE 4: DEVELOPMENT BUILD (Optional)
# =============================================================================
FROM node:18-alpine AS development

# Install development tools
RUN apk add --no-cache \
    dumb-init \
    curl \
    git \
    bash \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

WORKDIR /app
RUN chown -R nodejs:nodejs /app

USER nodejs

# Copy package files
COPY --chown=nodejs:nodejs package*.json ./

# Install all dependencies (including dev)
RUN npm install --no-audit --no-fund

# Copy application code
COPY --chown=nodejs:nodejs . .

# Create directories
RUN mkdir -p uploads logs

EXPOSE 3000 9090

# Development health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Use tini for signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start in development mode
CMD ["npm", "run", "dev"]

# =============================================================================
# BUILD INSTRUCTIONS
# =============================================================================

# Production build:
# docker build --target production -t remote-device-server:latest .
# docker run -p 3000:3000 --env-file .env remote-device-server:latest

# Development build:
# docker build --target development -t remote-device-server:dev .
# docker run -p 3000:3000 -v $(pwd):/app --env-file .env remote-device-server:dev

# Multi-platform build:
# docker buildx build --platform linux/amd64,linux/arm64 -t remote-device-server:latest .

# Security scan:
# docker scan remote-device-server:latest

# =============================================================================
# LABELS FOR METADATA
# =============================================================================

LABEL maintainer="Harvard CS Application <your-email@example.com>"
LABEL version="1.0.0"
LABEL description="Enterprise Remote Device Management Server"
LABEL vendor="Harvard Application Project"
LABEL org.opencontainers.image.title="Remote Device Management Server"
LABEL org.opencontainers.image.description="Production-grade relay server for Android-Windows device management"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.created="2025-05-26"
LABEL org.opencontainers.image.source="https://github.com/your-org/remote-device-server"
LABEL org.opencontainers.image.licenses="MIT"
