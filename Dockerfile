# Use a more minimal base image
FROM node:18-slim AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install ALL dependencies (including dev dependencies)
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build application with output compression
RUN npm run build

# Create a new stage for production dependencies
FROM base AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Production image, using distroless for minimal footprint
FROM gcr.io/distroless/nodejs18-debian11 AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# Copy production node_modules
COPY --from=prod-deps /app/node_modules ./node_modules

EXPOSE 3000

CMD ["server.js"]