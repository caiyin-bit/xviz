# Multi-stage Dockerfile for xviz-cli.
#
# Stage 1 (build): assemble the renderer bundle from monorepo sources.
# Stage 2 (runtime): alpine + chromium + the published xviz-cli tarball,
#                    plus the prebuilt renderer slot.
#
# Build context is the monorepo root so we can copy minimal-viz alongside
# xviz-cli during the build stage:
#   docker build -f xviz-cli/Dockerfile -t xviz .
#
# Run examples (defaults to `xviz --help`):
#   docker run --rm xviz
#   docker run --rm -v "$PWD:/data" xviz \
#     render -d /data/sales.json -f /data/pie.json -o /data/out.png

# -----------------------------------------------------------------------------
# Stage 1: build the renderer bundle.
FROM node:20-bookworm-slim AS build
WORKDIR /src

# Copy package manifests first to maximize cache reuse on dep changes.
COPY minimal-viz/package.json minimal-viz/package-lock.json minimal-viz/
COPY xviz-cli/package.json xviz-cli/package-lock.json xviz-cli/

RUN cd minimal-viz && npm ci --ignore-scripts \
 && cd ../xviz-cli && npm ci --ignore-scripts

# Copy sources only after deps are installed.
COPY minimal-viz minimal-viz
COPY xviz-cli xviz-cli

# Build the default (no-maps) renderer. Maps users should build their own
# image with XVIZ_ENABLE_MAPS=1 — see Dockerfile.maps below or override
# the build arg to opt in.
ARG XVIZ_ENABLE_MAPS=0
ENV XVIZ_ENABLE_MAPS=${XVIZ_ENABLE_MAPS}
RUN cd xviz-cli && npm run build

# -----------------------------------------------------------------------------
# Stage 2: runtime image.
FROM alpine:3.20 AS runtime

# Chromium for puppeteer-core. Alpine ships chromium and the matching shared
# libraries already configured to run headless.
RUN apk add --no-cache \
      nodejs \
      npm \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont \
      tini \
 && rm -rf /var/cache/apk/*

ENV XVIZ_CHROME=/usr/bin/chromium-browser \
    NODE_ENV=production

WORKDIR /app

# Copy the built CLI + renderer.
COPY --from=build /src/xviz-cli/package.json /src/xviz-cli/package-lock.json ./
COPY --from=build /src/xviz-cli/bin ./bin
COPY --from=build /src/xviz-cli/dist ./dist
COPY --from=build /src/xviz-cli/examples ./examples

# Production deps only. --ignore-scripts skips puppeteer-core's own browser
# download (we use the alpine chromium instead).
RUN npm ci --omit=dev --ignore-scripts \
 && npm cache clean --force

# Symlink the binary so it's on PATH.
RUN ln -s /app/bin/xviz.mjs /usr/local/bin/xviz \
 && chmod +x /app/bin/xviz.mjs

# Sandbox-incompatible distros (alpine, GH-runner-style containers) need
# --no-sandbox; the engine already passes that, but expose CHROME args env
# in case downstream users want to override.
ENV PUPPETEER_SKIP_DOWNLOAD=1

# tini reaps zombie processes from puppeteer's chromium spawns.
ENTRYPOINT ["/sbin/tini", "--", "xviz"]
CMD ["--help"]
