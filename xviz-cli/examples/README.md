# Examples

End-to-end examples covering the most common ways to use `xviz-cli`.
Each subdirectory contains its own walkthrough; the v0.2.0 examples
ship a pre-rendered `chart.png`, while the v0.4.0 additions ship
input fixtures only (render locally to verify).

## Workflow walkthroughs

| Example | Demonstrates | Inputs |
| --- | --- | --- |
| [`postgres-pie/`](./postgres-pie/README.md) | `xviz query` against PostgreSQL | schema + seed SQL + form |
| [`csv-bar/`](./csv-bar/README.md) | `xviz render` from a CSV (Superset export) | CSV + form |
| [`sqlite-cron/`](./sqlite-cron/README.md) | A cronable daily-report shell script | sample.db + script + form |
| [`mcp-claude-desktop/`](./mcp-claude-desktop/README.md) | MCP integration with Claude Desktop | `claude_desktop_config.json` snippet |
| [`serve-curl/`](./serve-curl/README.md) | `xviz serve` + remote `curl` | bash demo + JSON payload |
| [`boxplot-tukey/`](./boxplot-tukey/README.md) *(v0.4.0)* | Categorical box-and-whisker with Tukey outlier detection | data + form |
| [`treemap-regions/`](./treemap-regions/README.md) *(v0.4.0)* | 2-level hierarchical treemap from flat rows | data + form |
| [`waterfall-pnl/`](./waterfall-pnl/README.md) *(v0.5.0)* | Quarterly P&L decomposition with running total | data + form |
| [`graph-deps/`](./graph-deps/README.md) *(v0.5.0)* | Microservices call-graph with auto-inferred nodes | data + form |
| [`timeseries-revenue/`](./timeseries-revenue/README.md) *(v0.6.0)* | Multi-region monthly revenue on a true time axis | data + form |
| [`gantt-project/`](./gantt-project/README.md) *(v0.6.0)* | H1 project schedule (8 tasks × 4 owners) | data + form |
| [`pivot-financial/`](./pivot-financial/README.md) *(v0.7.0)* | H1 revenue by region × quarter × channel (multi-level pivot) | data + form |
| [`big-number-kpi/`](./big-number-kpi/README.md) *(v0.7.0)* | MAU month-over-month KPI tile with delta | data + form |
| [`calendar-contributions/`](./calendar-contributions/README.md) *(v0.8.0)* | GitHub-style yearly contribution heatmap | data + form |
| [`chord-trade/`](./chord-trade/README.md) *(v0.9.0)* | Global trade flows between 5 regions (chord diagram) | data + form |
| [`bullet-kpi/`](./bullet-kpi/README.md) *(v0.9.0)* | Q4 KPI dashboard (5 KPIs × graded bands + targets) | data + form |

## Single-file fixtures

There are also single-file payloads at the top of `examples/` (one
file per chart type — `pie-form.json` / `pie-data.json`, `scatter.json`,
`heatmap.json`, etc.) for quick reference. Run them all with the
`render-all.sh` helper. v0.4.0 added: `boxplot.json`, `histogram.json`,
`treemap.json`, `sunburst.json`, `radar.json`. v0.5.0 added:
`waterfall.json`, `step.json`, `tree.json`, `graph.json`. v0.6.0 added:
`timeseries-bar.json`, `timeseries-line.json`, `mixed-timeseries.json`,
`gantt.json`. v0.7.0 added: `big-number-total.json`,
`big-number-pop.json`, `time-table.json`, `pivot-table.json`. v0.8.0
added: `calendar.json`. v0.9.0 added: `rose.json`, `parallel.json`,
`bullet.json`, `chord.json` (Compare/Partition/TimePivot/Horizon/
PairedTTest reuse data shapes from their underlying renderers, so
no separate top-level fixture).
