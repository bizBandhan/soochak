# ==============================================================================
# Soochak by BizBandhan — Multi-Stage Dockerfile
# Targets:
#   1. development -> For local containerized development with live source mounting
#   2. build       -> Intermediate builder that compiles TypeScript & Vite PWA bundle
#   3. production  -> High-performance, minimal Nginx image serving static SPA assets
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Base image with Node.js runtime and dependency manifests
# ------------------------------------------------------------------------------
FROM node:22-alpine AS base

WORKDIR /app

# Install system dependencies if required for native builds
RUN apk add --no-cache libc6-compat

# Copy dependency specifications
COPY package.json package-lock.json* bun.lock* ./

# ------------------------------------------------------------------------------
# Stage 2: Development Stage
# Used for active development with source code mounted from host
# Command: docker build --target development -t soochak:dev .
# Run: docker run -p 3000:3000 -v $(pwd):/app -v /app/node_modules soochak:dev
# ------------------------------------------------------------------------------
FROM base AS development

ENV NODE_ENV=development

# Install all dependencies (including devDependencies)
RUN npm install

# Copy project source files
COPY . .

# Expose Vite dev server port
EXPOSE 3000

# Start Vite dev server bound to all interfaces
CMD ["npm", "run", "dev"]

# ------------------------------------------------------------------------------
# Stage 3: Builder Stage
# Installs dependencies, runs type-checking and builds production Vite assets
# ------------------------------------------------------------------------------
FROM base AS build

ENV NODE_ENV=production

# Install all dependencies required for Vite build & TypeScript checks
RUN npm install

# Copy application source code
COPY . .

# Build production assets into /app/dist
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 4: Production Stage
# Minimal, hardened Nginx Alpine container serving optimized SPA build
# Command: docker build --target production -t soochak:prod .
# Run: docker run -p 80:80 soochak:prod
# ------------------------------------------------------------------------------
FROM nginx:1.27-alpine AS production

# Copy custom Nginx configuration optimized for React SPA and Service Workers
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Health check to ensure Nginx is serving traffic
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
