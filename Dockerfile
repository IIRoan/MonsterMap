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

# Set environment variables
ARG CLICKHOUSE_HOST
ARG CLICKHOUSE_USER
ARG CLICKHOUSE_PASSWORD
ARG GEOAPIFY_API_KEY
ENV CLICKHOUSE_HOST=$CLICKHOUSE_HOST \
    CLICKHOUSE_USER=$CLICKHOUSE_USER \
    CLICKHOUSE_PASSWORD=$CLICKHOUSE_PASSWORD \
    GEOAPIFY_API_KEY=$GEOAPIFY_API_KEY

# Build application with output compression
RUN npm run build

# Production image, using distroless for minimal footprint
FROM gcr.io/distroless/nodejs18-debian11 AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

# Copy only necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Only copy production dependencies
COPY --from=builder /app/package.json /app/package-lock.json ./
RUN ["npm", "ci", "--only=production"]

EXPOSE 3000

CMD ["server.js"]