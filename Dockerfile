# =============================================================================
# Stage 1: Build React application
#
# Pinned to $BUILDPLATFORM so multi-arch builds (linux/amd64,linux/arm64) run
# `npm ci`/`vite build` natively on the runner instead of under QEMU. The
# resulting dist/ is pure static assets and architecture-independent, so only
# the final nginx stage needs to be cross-built.
# =============================================================================
FROM --platform=$BUILDPLATFORM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --ignore-scripts --prefer-offline --no-audit --fund=false

COPY . .

ARG APP_VERSION=dev
ENV VITE_APP_VERSION=${APP_VERSION}
RUN npm run build

# =============================================================================
# Stage 2: Serve with nginx
# =============================================================================
FROM nginx:alpine

COPY nginx.conf /etc/nginx/nginx.conf

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

COPY --from=builder /app/dist /usr/share/nginx/html-template

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

EXPOSE 80

ARG APP_VERSION=dev
LABEL org.opencontainers.image.title="otel-data-ui"
LABEL org.opencontainers.image.description="React frontend with Apollo Client consuming otel-data-gateway GraphQL BFF"
LABEL org.opencontainers.image.version="${APP_VERSION}"
LABEL org.opencontainers.image.vendor="homelab"

ENTRYPOINT ["/entrypoint.sh"]
