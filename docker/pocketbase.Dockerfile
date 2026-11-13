# PocketBase n'a pas d'image Docker officielle : on télécharge ici le binaire officiel de la release
# GitHub, à une version épinglée, et on vérifie son empreinte SHA-256 avant de l'utiliser.
# Les migrations du dépôt (pb_migrations/) sont copiées dans l'image et appliquées au démarrage.
# Pour changer de version : modifier PB_VERSION et les deux empreintes (fichier checksums.txt de la release).

# ── 1. Téléchargement ───────────────────────────────────────────────────────
FROM alpine:3.24.4 AS fetch
ARG TARGETARCH
ARG PB_VERSION=0.40.6
# Empreintes de pocketbase_0.40.6_linux_amd64.zip et pocketbase_0.40.6_linux_arm64.zip.
ARG PB_SHA256_AMD64=0e1f609158ed945f809f8a02ae012aa0427129c66ebb63c1aee76f2c0309373f
ARG PB_SHA256_ARM64=d22c66ceb67ca92b7d767f36d826e848a276bcfa3c197ead20bf87c42208984f
RUN apk add --no-cache ca-certificates curl unzip
RUN set -eu; \
    case "${TARGETARCH:-amd64}" in \
      amd64) arch=amd64; sha="${PB_SHA256_AMD64}" ;; \
      arm64) arch=arm64; sha="${PB_SHA256_ARM64}" ;; \
      *) echo "Architecture non prévue : ${TARGETARCH}" >&2; exit 1 ;; \
    esac; \
    curl -fsSL -o /tmp/pb.zip "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${arch}.zip"; \
    echo "${sha}  /tmp/pb.zip" | sha256sum -c -; \
    unzip /tmp/pb.zip pocketbase -d /out

# ── 2. Image finale ─────────────────────────────────────────────────────────
FROM alpine:3.24.4
# ca-certificates : pour les connexions sortantes de PocketBase (e-mails, etc.).
RUN apk add --no-cache ca-certificates \
    && addgroup -S pocketbase && adduser -S -G pocketbase pocketbase \
    && mkdir -p /pb/pb_data /pb/pb_migrations \
    && chown -R pocketbase:pocketbase /pb

COPY --from=fetch /out/pocketbase /pb/pocketbase
COPY pb_migrations/ /pb/pb_migrations/

WORKDIR /pb
USER pocketbase
EXPOSE 8090
# Les données (base SQLite, fichiers envoyés) vivent dans /pb/pb_data : à monter sur un volume.
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/pb/pb_data", "--migrationsDir=/pb/pb_migrations"]
