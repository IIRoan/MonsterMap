# Use alpine for an even smaller base image
FROM node:18-alpine AS base

# Install necessary build tools
RUN apk add --no-cache python3 make g++ gcc libc6-compat

# Enable pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Add package manager field to package.json
COPY package.json ./
RUN npm pkg set packageManager="pnpm@9.15.4"

COPY pnpm-lock.yaml ./

# Install dependencies with specific flags to reduce size
RUN pnpm install --frozen-lockfile \
    --no-optional \
    --ignore-scripts

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Install SWC binary explicitly
RUN pnpm add -D @next/swc-linux-x64-musl

# Build with memory optimization flags
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN pnpm build

# Production dependencies
FROM base AS prod-deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile \
    --prod \
    --no-optional \
    --ignore-scripts

# Final stage - use alpine for minimum size
FROM node:18-alpine AS runner
WORKDIR /app

# Set production environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME="0.0.0.0" \
    NODE_OPTIONS="--max-old-space-size=2048"

# Copy only necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=prod-deps /app/node_modules ./node_modules

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

# Add memory optimization flags to node command
CMD ["node", "--optimize-for-size", "--max-old-space-size=2048", "server.js"]