# =============================================================================
# Kyodo Food Attendance - Multi-stage Dockerfile
# =============================================================================
# Stage 1: Build frontend assets
# =============================================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source and build
COPY . .
RUN npm run build

# =============================================================================
# Stage 2: Install production dependencies only
# =============================================================================
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

# =============================================================================
# Stage 3: Production runtime
# =============================================================================
FROM node:20-alpine AS runner

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

WORKDIR /app

# Copy production dependencies
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy built frontend assets
COPY --from=frontend-builder --chown=nextjs:nodejs /app/dist ./dist

# Copy server files
COPY --chown=nextjs:nodejs server ./server

# Copy data directory structure (will be mounted as volume in production)
COPY --chown=nextjs:nodejs data ./data

# Copy public assets
COPY --chown=nextjs:nodejs public ./public

# Switch to non-root user
USER nextjs

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Start server
CMD ["node", "server/server.js"]