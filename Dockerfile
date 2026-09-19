# ---- Build stage ----
FROM node:22-bookworm-slim AS builder
WORKDIR /app

# Build tools for native modules (better-sqlite3, added in a later phase)
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY server/package.json server/package-lock.json ./server/
RUN npm --prefix server ci

COPY client/package.json client/package-lock.json ./client/
RUN npm --prefix client ci

COPY server ./server
COPY client ./client

RUN npm --prefix server run build
RUN npm --prefix client run build

RUN npm --prefix server prune --omit=dev

# ---- Runtime stage ----
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/server/package.json ./server/package.json
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 3000

CMD ["node", "server/dist/index.js"]
