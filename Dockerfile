# Base Node image
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install dependencies based on the package.json
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

ENV CLICKHOUSE_HOST=$CLICKHOUSE_HOST
ENV CLICKHOUSE_USER=$CLICKHOUSE_USER
ENV CLICKHOUSE_PASSWORD=$CLICKHOUSE_PASSWORD
ENV GEOAPIFY_API_KEY=$GEOAPIFY_API_KEY

# Build application
RUN npm run build

# Production image, copy all files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy necessary files
COPY --from=builder /app/public ./public
# Copy standalone directory
COPY --from=builder /app/.next/standalone ./
# Copy static files
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Ensure we have the required node_modules
COPY --from=builder /app/node_modules ./node_modules

CMD ["node", "server.js"]