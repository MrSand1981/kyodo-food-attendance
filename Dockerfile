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

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy built frontend assets
COPY --from=frontend-builder /app/dist ./dist

# Copy server files
COPY server ./server

# Copy data directory structure
COPY data ./data

# Copy public assets
COPY public ./public

# Use standard non-root node user for security
USER node

EXPOSE 5000

# Start server
CMD ["node", "server/server.js"]
