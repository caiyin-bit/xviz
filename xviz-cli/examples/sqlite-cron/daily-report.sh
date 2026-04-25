#!/usr/bin/env bash
# Run every morning to produce a fresh PNG report of monthly revenue.
# Add to crontab (Linux/macOS):
#   0 7 * * *  /path/to/xviz-cli/examples/sqlite-cron/daily-report.sh
#
# Drop the resulting PNG into Slack / email / a static-site assets dir.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_PATH="$SCRIPT_DIR/../sql/sample.db"
FORM_PATH="$SCRIPT_DIR/form.json"
DATE="$(date +%Y-%m-%d)"
OUT_PATH="$SCRIPT_DIR/reports/$DATE.png"

mkdir -p "$(dirname "$OUT_PATH")"

xviz query \
  --db "sqlite:$DB_PATH" \
  --sql "SELECT strftime('%Y-%m', placed_at) AS month, SUM(revenue) AS revenue \
         FROM orders GROUP BY 1 ORDER BY 1" \
  -f "$FORM_PATH" \
  -o "$OUT_PATH" \
  --width 800 --height 400

echo "Wrote $OUT_PATH"
