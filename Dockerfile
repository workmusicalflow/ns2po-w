# Dockerfile multi-stage optimisé pour Railway selon recommandations Gemini
# Stage 1: Dependencies - Install Node.js, pnpm et dependencies
FROM node:20-alpine AS dependencies

# Install pnpm globally
RUN npm install -g pnpm@9.1.0

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/election-mvp/package.json ./apps/election-mvp/
# Copier les répertoires packages avec leur structure
COPY packages/composables/package.json ./packages/composables/
COPY packages/config/package.json ./packages/config/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/

# Install dependencies (no-frozen-lockfile pour monorepo Docker)
RUN pnpm install --no-frozen-lockfile

# Stage 2: Builder - Build application
FROM node:20-alpine AS builder

# Install pnpm globally
RUN npm install -g pnpm@9.1.0

# Set working directory
WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/.npmrc ./
COPY --from=dependencies /app/apps/election-mvp/package.json ./apps/election-mvp/
COPY --from=dependencies /app/packages ./packages/

# Copy all source code
COPY . .

# Build the election-mvp application avec preset Railway forcé
ENV NITRO_PRESET=node-server
ENV NODE_ENV=production
RUN pnpm --filter @ns2po/election-mvp build

# Stage 3: Runner - Production runtime sécurisé
FROM node:20-alpine AS runner

# Install pnpm globally
RUN npm install -g pnpm@9.1.0

# Create non-root user for security (Railway best practices)
RUN addgroup --system --gid 1001 nuxtjs
RUN adduser --system --uid 1001 nuxtjs

# Set working directory
WORKDIR /app

# Copy built application and dependencies
COPY --from=builder --chown=nuxtjs:nuxtjs /app/apps/election-mvp/.output ./.output
COPY --from=builder --chown=nuxtjs:nuxtjs /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/.npmrc ./
COPY --from=builder --chown=nuxtjs:nuxtjs /app/apps/election-mvp/package.json ./apps/election-mvp/
# Copier les packages pour les dépendances workspace
COPY --from=builder --chown=nuxtjs:nuxtjs /app/packages ./packages/

# Install only production dependencies for runtime
RUN pnpm install --no-frozen-lockfile --prod

# Switch to non-root user
USER nuxtjs

# Expose port 3000 (Railway standard)
EXPOSE 3000

# Set production environment variables
ENV NODE_ENV=production
ENV NITRO_PRESET=node-server
ENV NUXT_HOST=0.0.0.0
ENV PORT=3000

# Health check for Railway monitoring
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node .output/server/index.mjs --health-check || exit 1

# Start the application with Railway-optimized command
CMD ["node", ".output/server/index.mjs"]