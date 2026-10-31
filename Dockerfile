# =============================================================================
# Kyodo Food Attendance - Multi-stage Dockerfile
# =============================================================================
# Stage 1: Build frontend assets
# =============================================================================
FROM node:22-slim AS frontend-builder

WORKDIR /app

# Copy package files and install all dependencies (ignore dev git hooks like husky)
COPY package*.json ./
RUN npm ci --legacy-peer-deps --ignore-scripts

# Copy source and build
COPY . .
RUN npm run build

# =============================================================================
# Stage 2: Install production dependencies only
# =============================================================================
FROM node:22-slim AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps --ignore-scripts

# =============================================================================
# Stage 3: Production runtime
# =============================================================================
FROM node:22-slim AS runner

WORKDIR /app

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Copy package files
COPY --chown=node:node package*.json ./

# Copy production dependencies
COPY --chown=node:node --from=deps /app/node_modules ./node_modules

# Copy built frontend assets
COPY --chown=node:node --from=frontend-builder /app/dist ./dist

# Copy server files
COPY --chown=node:node server ./server

# Copy data directory structure
COPY --chown=node:node data ./data

# Copy public assets
COPY --chown=node:node public ./public

# Ensure data directory and files have full 777 read/write permissions for node user
RUN mkdir -p /app/data /app/data/backups /app/public && \
    chown -R node:node /app && \
    chmod -R 777 /app/data /app/public

# Use standard non-root node user for security
USER node

EXPOSE 5000

# Start server
CMD ["node", "server/server.js"]
