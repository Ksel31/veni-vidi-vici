# Image de l'appli (SvelteKit + adapter-node). PocketBase a sa propre image : docker/pocketbase.Dockerfile.
# Aucune adresse n'est écrite dans l'image : PUBLIC_STORE et PUBLIC_POCKETBASE_URL sont lues
# quand le conteneur démarre (voir src/env.js), donc la même image sert partout.

# ── 1. Build ────────────────────────────────────────────────────────────────
FROM node:24.16.0-alpine AS build
WORKDIR /app

# Dépendances d'abord : cette couche reste en cache tant que package*.json ne bouge pas.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# ADAPTER=node : serveur Node autonome. Sans cette variable, vite.config.js garde adapter-auto
# (la démo Vercel n'est pas touchée).
ENV ADAPTER=node
RUN npm run build

# ── 2. Exécution ────────────────────────────────────────────────────────────
FROM node:24.16.0-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Seules les dépendances « dependencies » (le SDK pocketbase) sont nécessaires pour faire tourner `build/`.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/build ./build

# Port d'écoute : PORT (3000 par défaut) ; HOST vaut 0.0.0.0 par défaut avec adapter-node.
EXPOSE 3000
USER node
CMD ["node", "build"]
