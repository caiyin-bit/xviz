# xviz — Apache Superset 的图表引擎，独立成包

<p align="center">
  <a href="https://github.com/caiyin-bit/xviz/actions/workflows/ci.yml">
    <img src="https://github.com/caiyin-bit/xviz/actions/workflows/ci.yml/badge.svg" alt="CI" />
  </a>
  <a href="https://codecov.io/gh/caiyin-bit/xviz">
    <img src="https://codecov.io/gh/caiyin-bit/xviz/branch/main/graph/badge.svg" alt="Coverage" />
  </a>
  <img src="https://img.shields.io/badge/license-Apache_2.0-blue.svg" alt="License" />
  <img src="https://img.shields.io/badge/node-%E2%89%A520-brightgreen.svg" alt="Node" />
</p>

<p align="center">
  <a href="./README.md">English</a> · <a href="./README.zh-CN.md">中文</a>
</p>

<p align="center">
  <img src="docs/blog/images/hero-pie.png" width="520" alt="xviz 渲染的饼图" />
</p>

> 把 Apache Superset 的图表层剥出来做成独立可用的库。
> 既能在 React 应用里当组件用，也能用 CLI 把 JSON / CSV / SQL 查询结果无头渲染成
> PNG / PDF / HTML，还能通过 MCP 让 LLM agent 直接调用画图。
> 没有 BI 平台、没有元数据库、没有 dashboard ——只有 **15 种图表**（v0.4.0）+
> 一个把数据变成图片的渲染器。

## 三种使用方式

### 1 · 作为 React 组件库

```bash
npm install @minimal-viz/core react react-dom echarts
```

```tsx
import { PieChart } from '@minimal-viz/core'

<PieChart
  width={600} height={400}
  formData={{ vizType: 'pie', groupby: ['region'], metric: 'sales', donut: true }}
  queriesData={[{ data: [
    { region: 'NA', sales: 1200 },
    { region: 'EU', sales:  900 },
    { region: 'AS', sales: 1500 },
  ]}]}
/>
```

可在任何 React 18+ 应用中运行。三个运行时依赖：`react`、`react-dom`、
`echarts`。打包后约 5 KB（gzip，不含 peer 依赖）。

详见 [组件库文档 →](./minimal-viz/README.md)

### 2 · 作为命令行工具

```bash
npm i -g xviz-cli

# 从 JSON 或 CSV 出图
xviz render -d data.csv -f form.json -o chart.png

# 直接从数据库出图
xviz query --db sqlite:./orders.db \
  --sql "SELECT region, SUM(revenue) r FROM orders GROUP BY 1" \
  --form pie.json -o regions.png

# 或者起 HTTP 服务——浏览器保持热启动，单次请求约 1.2 秒
xviz serve --port 3737
```

运行时需要本机已安装 Chrome 或 Chromium（`xviz` 用 `puppeteer-core`，
不打包浏览器）。如果默认路径找不到，设置 `XVIZ_CHROME=/path/to/chrome`。

详见 [CLI 文档 →](./xviz-cli/README.md) 和
[可运行示例 →](./xviz-cli/examples/README.md)

### 3 · 作为 LLM 工具（MCP）

跟 Claude 说"把这些数据画成饼图"，它会直接调用 `render_chart` 工具：

<p align="center">
  <img src="docs/blog/images/15-mcp.png" width="420" alt="Claude 通过 MCP 调用 xviz 渲染的图" />
</p>

```json
{ "mcpServers": { "xviz": { "command": "npx",
  "args": ["xviz-cli", "mcp"] } } }
```

把这段加进 Claude Desktop 的配置，Claude 就能按需渲染 15 种图表中的任何一种。
完整走查见 [MCP 示例](./xviz-cli/examples/mcp-claude-desktop/README.md)。

## 支持的图表类型

15 种图表（截至 v0.4.0），覆盖 BI 日常约 95% 的需求。

| | | |
|:---:|:---:|:---:|
| ![饼图](docs/blog/images/hero-pie.png) | ![柱状图](docs/blog/images/02-bar-stacked.png) | ![折线图](docs/blog/images/03-line-area.png) |
| **饼图 / 环图** | **柱状图（堆叠）** | **折线图（平滑 + 面积）** |
| ![表格](docs/blog/images/04-table.png) | ![散点图](docs/blog/images/05-scatter.png) | ![热力图](docs/blog/images/06-heatmap.png) |
| **表格** | **散点 / 气泡图** | **热力图** |
| ![桑基图](docs/blog/images/07-sankey.png) | ![漏斗图](docs/blog/images/08-funnel.png) | ![仪表盘](docs/blog/images/09-gauge.png) |
| **桑基图** | **漏斗图** | **仪表盘** |

**v0.4.0 新增**——[Superset 功能对齐路线图](./docs/superpowers/specs/2026-04-26-xviz-superset-parity-roadmap.md) M1 阶段成果：

| 图表 | 适用场景 | 说明 |
|---|---|---|
| **BoxPlot（箱线图）** | 多组分布对比 | Tukey 或 min-max 触须，可选离群点叠加 |
| **Histogram（直方图）** | 单列分布 | 等宽分箱；可选 density 归一化 / cumulative 累计 |
| **Treemap（矩形树图）** | 层级占比 | 多列 `groupby` 自动构造嵌套树 |
| **Sunburst（旭日图）** | 同心环层级 | 数据接口与 Treemap 完全相同 |
| **Radar（雷达图）** | 多维比较 | 每个 metric 一个轴，每个 group 一个多边形 |

外加 **BigNumber**（KPI 大数 + 迷你趋势线 + 增减百分比）和明暗双主题：

<p align="center">
  <img src="docs/blog/images/10-pie-dark.png" width="340" alt="深色主题" />
  <img src="docs/blog/images/11-gauge-dark.png" width="340" alt="深色仪表盘" />
</p>

## CSV 兼容性

CSV 解析器能处理 BI 工具导出常见的边界情况：UTF-8 BOM、千位分隔符
（`"9,823,456"`）、嵌套双引号、CSV 注入字符防护、`SUM(x)` / `__timestamp`
这类聚合列名。16 个回归测试覆盖了真实导出的各种形态。

## 这个项目**不是**什么

xviz 不是 BI 平台。没有 dashboard、没有权限、没有保存的查询、没有元数据库。
它解决的是"我手里有点数据，想画个图"——仅此而已。

## 进一步阅读

- 📖 **[技术深度文章](./docs/blog/2026-04-24-extracting-superset-viz.md)**
  ——架构、取舍、新旧方案对比
- 🧩 **[minimal-viz 库文档](./minimal-viz/README.md)** ——完整 API、主题、15 种图表
- 🛠️ **[xviz CLI 文档](./xviz-cli/README.md)** ——`render`、`query`、`serve`、`mcp` 命令
- 🧪 **[可运行示例](./xviz-cli/examples/README.md)** ——Postgres、SQLite、CSV、MCP、HTTP
- 🤝 **[贡献指南](./CONTRIBUTING.md)** ——bug 报告、PR、开发环境
- 📜 **[行为准则](./CODE_OF_CONDUCT.md)**

## 许可证

Apache 2.0
