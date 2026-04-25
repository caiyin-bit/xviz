# Examples

Five end-to-end examples covering the most common ways to use `xviz-cli`.
Each subdirectory contains its own walkthrough plus a pre-rendered
`chart.png` so you can see the expected output before running anything.

| Example | Demonstrates | Inputs |
| --- | --- | --- |
| [`postgres-pie/`](./postgres-pie/README.md) | `xviz query` against PostgreSQL | schema + seed SQL + form |
| [`csv-bar/`](./csv-bar/README.md) | `xviz render` from a CSV (Superset export) | CSV + form |
| [`sqlite-cron/`](./sqlite-cron/README.md) | A cronable daily-report shell script | sample.db + script + form |
| [`mcp-claude-desktop/`](./mcp-claude-desktop/README.md) | MCP integration with Claude Desktop | `claude_desktop_config.json` snippet |
| [`serve-curl/`](./serve-curl/README.md) | `xviz serve` + remote `curl` | bash demo + JSON payload |

There are also single-file examples at the top of `examples/` (one form
file per chart type — `pie-form.json`, `bar-form.json`, etc.) for quick
reference. Run them with the `render-all.sh` helper.
