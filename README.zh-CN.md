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
  <img src="https://img.shields.io/badge/v1.0-stable-success.svg" alt="Stability" />
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
> 没有 BI 平台、没有元数据库、没有 dashboard。**已稳定 1.0**：核心 39 张图 +
> 可选的 `@minimal-viz/maps` 卫星包再补 13 张 deck.gl 地图，覆盖 Apache Superset
> 全量图表目录。SemVer 承诺见 [VERSIONING.md](./VERSIONING.md)。

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

把这段加进 Claude Desktop 的配置，Claude 就能按需渲染 39 种图表中的任何一种。
完整走查见 [MCP 示例](./xviz-cli/examples/mcp-claude-desktop/README.md)。

## 支持的图表类型

39 种图表（截至 v0.10.0），覆盖 BI 日常约 99% 的需求。

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

**v0.5.0 新增**——同一路线图 M2 阶段成果：

| 图表 | 适用场景 | 说明 |
|---|---|---|
| **Waterfall（瀑布图）** | 累计变化 / 利润分解 | 正值（绿）、负值（红）、可选 Total 总计柱 |
| **Step（阶梯图）** | 状态变更时序 | LineChart 加 `step: 'start' / 'middle' / 'end'` |
| **Tree（树形图）** | 组织 / 分类结构 | 正交（LR/RL/TB/BT）或径向布局 |
| **Graph（关系图）** | 节点-边网络 | 边表输入、自动推断节点；force 布局（关闭动画以兼容无头渲染） |

**v0.6.0 新增**——同一路线图 M3 阶段成果（时序基线）：

| 图表 | 适用场景 | 说明 |
|---|---|---|
| **TimeseriesBar / TimeseriesLine** | 真正的时间轴柱 / 折线 | ECharts `time` 轴（区别于现有的 categorical Bar / Line），接受 ISO-8601 字符串或数字 epoch ms |
| **MixedTimeseries（混合时序）** | 同时间轴柱+线混合 | 可选双 Y 轴（`dualAxis: true`）——柱在左、线在右 |
| **Gantt（甘特图）** | 任务 / 项目排期 | ECharts `custom` series 渲染时间轴上的横向矩形；可按 owner 分色 |

**v0.7.0 新增**——同一路线图 M4 阶段成果（表格族 + KPI 变体）：

| 图表 | 适用场景 | 说明 |
|---|---|---|
| **BigNumberTotal（KPI 总数）** | 单一数字 KPI 卡片 | 多行求和（与默认 BigNumber 仅显示最后一行不同）|
| **BigNumberPeriodOverPeriod（同环比）** | 周期对比 KPI | 当前值 + 上一期值 + delta（绝对+%）；支持长格式或宽格式 |
| **TimeTable（时序表）** | metrics × 时间透视 | 纯 HTML；时间列自动排序；缺失单元格显示破折号 |
| **PivotTable（透视表）** | 完整 row × column × value 透视 | 5 种聚合（sum/avg/count/min/max）；可选行/列/总计 |

**v0.8.0 新增**——同一路线图 M5 阶段成果（日历；WordCloud 推迟）：

| 图表 | 适用场景 | 说明 |
|---|---|---|
| **Calendar（日历热力图）** | GitHub-contributions 风格热力图 | 每天一格，按指标强度上色。范围自动从数据推断；日期列接受 ISO-8601 或 epoch ms |

> **WordCloud 推迟** —— `echarts-wordcloud@2.x` 仍依赖 `echarts@5`，与 xviz 用的 `echarts@6` 冲突。等上游兼容 echarts 6 后再纳入。

**v0.9.0 新增**——同一路线图 M6 阶段成果（legacy 独立图族；9 张）：

| 图表 | 适用场景 | 说明 |
|---|---|---|
| **Rose（玫瑰图）** | Nightingale rose | Pie 变体，`roseType: 'radius' \| 'area'` |
| **ParallelCoordinates（平行坐标）** | 多轴折线 | 每行一条折线穿过 N 个轴；ECharts 原生 `parallel` |
| **Bullet（子弹图）** | KPI 仪表板 | 渐变 ranges (poor/good/excellent) + 实际值 bar + target tick |
| **Compare（对比图）** | 同比 / 环比 line plot | 包装 TimeseriesLine；周期通过 seriesColumn 区分 |
| **Partition（分区图）** | 层级 icicle | 包装 Treemap，带 breadcrumb |
| **TimePivot（时序透视表）** | metrics × 时间表 | TimeTable 别名，方便 Superset `time_pivot` 用户迁移 |
| **Chord（弦图）** | 圆形流向图 | 边表输入；ECharts 6 原生 ChordChart |
| **Horizon（地平线图）** | 单 band 时序面积图 | 简化版——多 band 折叠版本在 backlog |
| **PairedTTest（配对 t 检验）** | 配对统计探索 | BoxPlot 变体，按 pair 分组 |

**v0.10.0 新增**——同一路线图 M7-A 阶段成果（无 SDK 地图族；deck.gl 类地图推迟）：

| 图表 | 适用场景 | 说明 |
|---|---|---|
| **WorldMap（世界地图）** | 国家级填色图 | ECharts 原生 MapChart + 用户提供 GeoJSON。零新依赖、零 token、无 tile 服务 |
| **CountryMap（国家地图）** | 子级行政区填色图（州/省/县） | 与 WorldMap 同渲染器，仅命名表意不同 |

> **地图 SDK 选型** —— xviz core 的静态填色图用 ECharts 原生 MapChart。Superset 的 13 张 deck.gl 系地图（PointClusterMap、Cartodiagram、DeckGL Arc/Geojson/Grid/Hex/Heatmap/Multi/Path/Polygon/Scatter/Screengrid/Contour）**有意推迟**到未来的可选卫星包 `@minimal-viz/maps`。把它们塞进 core 会让 bundle 3×-膨胀（1.1 MB → 3.5+ MB）。届时卫星包将使用 **`maplibre-gl@^5`**（BSD-3 许可、无需 token、OSM 友好），**不用 `mapbox-gl`**（BSL 许可与 Apache 2.0 不兼容）。完整决策见 [`docs/superpowers/specs/2026-04-29-m7-spike-report.md`](./docs/superpowers/specs/2026-04-29-m7-spike-report.md)。

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
- 🧩 **[minimal-viz 库文档](./minimal-viz/README.md)** ——完整 API、主题、39 种图表
- 🛠️ **[xviz CLI 文档](./xviz-cli/README.md)** ——`render`、`query`、`serve`、`mcp` 命令
- 🧪 **[可运行示例](./xviz-cli/examples/README.md)** ——Postgres、SQLite、CSV、MCP、HTTP
- 🤝 **[贡献指南](./CONTRIBUTING.md)** ——bug 报告、PR、开发环境
- 📜 **[行为准则](./CODE_OF_CONDUCT.md)**

## 许可证

Apache 2.0
