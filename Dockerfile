# Dockerfile multi-stage optimisé pour Railway avec Debian Slim + Chromium
# Migration Alpine → Debian pour compatibilité Chromium/Puppeteer
# Basé sur recommandations Gemini + Google Search Grounding (2025)

# Stage 1: Dependencies - Install Node.js, pnpm et dependencies
FROM node:20-slim AS dependencies

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
FROM node:20-slim AS builder

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

# Stage 3: Runner - Production runtime avec Chromium système
FROM node:20-slim AS runner

# Install pnpm globally
RUN npm install -g pnpm@9.1.0

# ============================================================================
# Installation Chromium + Dépendances (Debian Bookworm)
# Basé sur best practices 2025: stackoverflow.com, medium.com, github.com
# ============================================================================
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-driver \
    fonts-liberation \
    fonts-noto-color-emoji \
    fonts-freefont-ttf \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    ca-certificates \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# ============================================================================
# Variables d'environnement Puppeteer (Skip download, use system Chromium)
# ============================================================================
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV CHROME_BIN=/usr/bin/chromium

# Create non-root user for security (Railway best practices)
RUN groupadd --system --gid 1001 nuxtjs && \
    useradd --system --uid 1001 --gid nuxtjs --shell /bin/bash --create-home nuxtjs

# Set working directory
WORKDIR /app

# Copy built application and dependencies
COPY --from=builder --chown=nuxtjs:nuxtjs /app/apps/election-mvp/.output ./.output
COPY --from=builder --chown=nuxtjs:nuxtjs /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/.npmrc ./
COPY --from=builder --chown=nuxtjs:nuxtjs /app/apps/election-mvp/package.json ./apps/election-mvp/
# Copier le dossier templates pour les emails MJML
COPY --from=builder --chown=nuxtjs:nuxtjs /app/apps/election-mvp/templates ./templates/
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
