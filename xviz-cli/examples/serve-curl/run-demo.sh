#!/usr/bin/env bash
# Start xviz serve, hit it with curl, save the PNG, then shut down.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT=3737

echo "==> Starting xviz serve on :$PORT (background)"
xviz serve --port "$PORT" &
SERVE_PID=$!
trap 'kill "$SERVE_PID" 2>/dev/null || true' EXIT

# Wait for /health to come up (max ~10s)
for i in $(seq 1 20); do
  if curl -fsS "http://localhost:$PORT/health" >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

echo "==> POST /render"
curl -fsS -X POST "http://localhost:$PORT/render" \
  -H 'Content-Type: application/json' \
  --data @"$SCRIPT_DIR/payload.json" \
  -o "$SCRIPT_DIR/chart.png"

ls -la "$SCRIPT_DIR/chart.png"
echo "==> Done. Server will shut down on exit."
