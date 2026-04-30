# xviz 1.0：一个把 Apache Superset 图表层独立成包的稳定版本

**2026-04-30** · 发版 / 可视化 / SemVer / Docker

![hero](./images/hero-pie.png)

> TL;DR：xviz 1.0 已发到 npm 和 GHCR。`@minimal-viz/core@1.0.0` + `xviz-cli@1.0.0` 进入 SemVer 稳定期，可选的 `@minimal-viz/maps` 卫星包 (0.1.0) 把 deck.gl 地图能力作为另一条版本线提供。整套工程现在覆盖 **52 种图表**，对得上 Apache Superset 在 2026 年的全量目录。

六天前我[写了一篇](./2026-04-24-extracting-superset-viz.md)记录怎么把 Superset 的可视化层拆出来做成独立可用的库。当时是 10 种图表、26% 的 Superset 覆盖、0.2.0 版本号。这周末我把覆盖率推到 100%、把版本号推到 1.0，并且把所有"准生产"该有的脚手架（API 冻结、CI 多操作系统、bundle size budget、Docker 镜像、自动发版流水线）一次到位。

这篇文章不再讲怎么抽离——那篇已经写过了。这篇讲的是 **从 0.x 走到 1.0 中间发生的事**，以及 1.0 这个版本号到底承诺了什么、不承诺什么。

---

## 1.0 不是终点，是**承诺**

人们经常把 1.0 当成"终于做完了"的信号。我不喜欢这个解读。**1.0 是一份合同**：从今往后，

- 移除任何公开 API → major bump（`2.0.0`）
- 加新图表、新 CLI 选项、新 MCP 工具 → minor bump（`1.1.0`）
- 修 bug、改文档、内部重构 → patch bump（`1.0.1`）

**仅此而已**。1.0 不是说"我们觉得 xviz 完美了"——它是"我们写下来了什么是公开 API、哪些可以变、哪些不可以变，并且承担后续不破坏的责任"。

具体清单见仓库根的 [`VERSIONING.md`](../../VERSIONING.md)。摘几条：

- **`@minimal-viz/core@1.x` 的公开表面 = 从 `src/viz/index.ts` 重新导出的那几十个名字**。这套清单被一个 [snapshot 测试](../../minimal-viz/src/viz/public-api.test.ts) inline 钉住了——任何不小心加 / 删 / 改都会让 CI 红，必须在 PR 里明确"这是想要的"才能过。
- **不公开的部分**也写进 spec：ECharts option 的内部形状、theme token 的具体 RGB 值、`transformProps.ts` 内部模块、仓库的文件布局。这些可以在任意 minor 版本里变。
- **deprecation 政策**：被弃用的符号至少保留一个完整的 minor cycle（1.3 弃用 → 最早 1.5 才能删）。

`@minimal-viz/maps` **没有**进 1.0。它一天前才发了 0.1.0，没有任何已知的生产用户——过早冻结一个没人用过的 API 等于把错抽象焊死。它会在卫星包累积到一定反馈后再单独 graduate 到 1.x。

---

## 数字层面：从 v0.2 到 v1.0 发生了什么

v0.2.0（2026-04-25）和 v1.0.0（2026-04-30）之间的差：

| | v0.2.0 | v1.0.0 |
|---|---|---|
| **图表数** | 10 | 39 (core) + 13 (maps satellite) = **52** |
| **Superset 覆盖率** | ~26% | ~100%（ECharts-based） + 全量地图（deck.gl/maplibre 卫星包） |
| **核心 bundle (gzip)** | ~5 KB | ~18 KB ESM dist（+13KB 来自 9 张新图共用的 ECharts 模块） |
| **渲染器 bundle (gzip)** | ~360 KB | ~374 KB（默认）/ ~884 KB（maps-enabled） |
| **测试** | ~32 | **163** Vitest + 一个 puppeteer + WebGL 实跑的烟雾测试 |
| **CI 矩阵** | Linux × Node 20 | Linux + macOS + Windows × Node 20+22 |
| **发版工件** | npm | npm + Docker (ghcr.io) + auto-generated GitHub release |

**新 charts** 是按照 [一份 7-milestone 的 parity roadmap](../../docs/superpowers/specs/2026-04-26-xviz-superset-parity-roadmap.md) 落的——M1 到 M7 每个里程碑都对应一个 npm minor release。详细的图表故事这里不展开，仓库 README 有完整的对照表。

---

## 关键架构决策：把地图剥成卫星包

这是 1.0 之前最重要的工程决定。

Superset 的地图栈用 deck.gl + maplibre-gl，加进来一次 bundle 从 1.15 MB 涨到 3.5 MB。如果 xviz 默认带这套：

- 99% 用户付了 4 倍的 bundle 但根本不画地图
- React lib 用户的 webpack/vite 打包时间显著拉长
- xviz-cli 的 npm install 时间从 5 秒变成 30 秒

但如果不做地图，又对不上 Superset 全量。

**最终方案**：核心保持 echarts-only 的轻量姿态；地图作为 `@minimal-viz/maps` 独立 npm 包（独立版本号、独立 git tag `maps-v*`、独立 release CI job），用户按需装。xviz-cli 增加一个 build-time flag `XVIZ_ENABLE_MAPS=1`：

```bash
# 不画地图的人：照常装，bundle 不变
npm i -g xviz-cli

# 要画地图的人：装卫星包 + 重新 build 一次 xviz-cli
git clone https://github.com/caiyin-bit/xviz.git
cd xviz/xviz-cli && npm ci --include=optional
npm run build:maps    # XVIZ_ENABLE_MAPS=1 vite build
xviz render -d cities.json -f deck-scatter.json -o map.png
```

底下原理就是 Vite 的 alias swap：默认 build 把 `@xviz-renderer/maps` 别名映射到一个空 stub，`build:maps` 切到真实的 `@minimal-viz/maps` 入口。Tree-shaking 干掉死分支，maps 代码完全不进默认产物。

License 角度也藏着一个非平凡选择：xviz 的地图卫星用 **maplibre-gl@^5（BSD-3 clause）**，**不用 mapbox-gl**——后者从 v2 起切到 BSL（Business Source License），与 xviz 的 Apache 2.0 不兼容；并且它强制要 token，对 LLM agent / CLI 类的"零配置"使用是 onboarding 灾难。完整的判断过程在 [`docs/superpowers/specs/2026-04-29-m7-spike-report.md`](../../docs/superpowers/specs/2026-04-29-m7-spike-report.md) 里。

---

## 1.0 真正能用的"新东西"

API 冻结之外，1.0 还附带一些**实质可用的能力**——这些其实比版本号更重要。

### 1) Docker 镜像

```bash
docker run --rm -v "$PWD:/data" \
  ghcr.io/caiyin-bit/xviz/xviz-cli:1.0 \
  render -d /data/sales.json -f /data/pie.json -o /data/out.png
```

之前要在 host 装 Chrome / Chromium，puppeteer-core 才能找到 binary。现在直接 `docker run` 就行。镜像是 multi-stage 构建：node 20 builder 跑 vite 出 renderer bundle，alpine 3.20 + chromium + tini 做 runtime。最终 ~250 MB，对一个能渲染 39 种图表的命令行工具来说是合理的。

每个 `v*` tag 自动推三个 tag：`:1.0.0`、`:1.0`、`:latest`。生产上推荐 pin `:1.0`，让 patch 滚动但绑定 minor。

### 2) MCP 接口稳定下来了

去年我把 MCP server 的初始版本扔出来纯属实验。这次 1.0 把它的工具表面写进了 SemVer 合同：

```jsonc
// Claude Desktop config
{ "mcpServers": { "xviz": {
  "command": "npx",
  "args": ["xviz-cli", "mcp"]
}}}
```

工具名（`render_chart`）、参数 schema、响应形状从此锁定。我会在 1.x 里**加新工具**（比如未来可能加 `validate_form_data` 或 `query_database`），但不会**改老工具的入参**。

实际效果：你可以让 Claude 直接说"给这堆数据画一张漏斗图"，Claude 在后台调用 xviz 出 PNG，整个回路 ~1.5 秒（暖 puppeteer 实例的情况下）。

### 3) Performance baseline

仓库里现在有一个 [`xviz-cli/bench/render-bench.mjs`](../../xviz-cli/bench/render-bench.mjs)：5 个代表性 fixture（pie / line / heatmap / timeseries-bar / table）× N 次运行，跑同一个长生命周期的 `Engine` 实例（这才是 `xviz serve` 的真实形态），然后输出 markdown 报告：

```
# xviz Render Performance Baseline

- Cold start (puppeteer launch + bundle parse): 1245.6 ms
- Runs per fixture: 5
- Format: PNG · scale: 2× · post-render delay: 200 ms

| Fixture | Type | Size | min | p50 | max | mean |
|---|---|---|---|---|---|---|
| 01-pie         | pie            | 600×400 | 287 ms | 304 ms | 322 ms | 305 ms |
| 02-line        | line           | 700×400 | 264 ms | 271 ms | 281 ms | 271 ms |
| 03-heatmap     | heatmap        | 700×420 | 318 ms | 326 ms | 339 ms | 327 ms |
| ...
```

这不是 CI gate（perf 回归得人工判断"是不是该走 minor 还是 patch"，不能机械触发红屏）。但 baseline 落档了，未来如果哪个 PR 让 p50 翻倍，至少有数据可以指着说"这里慢了 2x"。

### 4) Bundle size budget（CI 强制）

CI 现在每次都校验：

```yaml
- @minimal-viz/core ESM dist ≤ 250 KB    (实测 ~76 KB)
- 默认 renderer ≤ 1.30 MB raw / 400 KB gzip   (实测 1.15 MB / 374 KB)
- maps-enabled renderer ≤ 3.30 MB raw / 950 KB gzip (实测 3.02 MB / 884 KB)
```

超出就红。这条配合一句 commit message 就能让 reviewer 立刻看到："你这次改动让 bundle 涨了 200 KB，确认是想要的吗？"——把无意识的 bundle 漂移转化为**有意识的决策**。

---

## CI 长什么样

为了让"轻量"这件事不只是口号，1.0 把 CI 从 6 个 job 推到 14 个 job：

```
csv-compat                        # 1 秒，纯 Node
build-lib (3 OS × 2 Node)         # 6 个并行：lib 在 Linux/macOS/Windows × Node 20+22 都能 build
build-renderer                     # vite build + bundle size budget
pack-smoke                         # npm pack + 全局装 + 渲染一次
vitest                             # full vitest 套件 (Linux only — 含 puppeteer)
vitest-cross-os (macos+windows)   # minimal-viz only，不带 puppeteer
maps-webgl-smoke                   # XVIZ_ENABLE_MAPS=1 build + 真实 deck.gl/maplibre-gl headless 渲染
lint-typecheck                     # eslint --max-warnings 0 + tsc --noEmit
```

最关键的新增是 `maps-webgl-smoke`：之前 maps WebGL 路径一直没人在 CI 里真跑——本地 macOS 上 puppeteer 跟我日常 Chrome 抢用户配置目录，从来没 reliably 通过。1.0 把这个洞补上：CI runner 用 fresh 的 chromium，每个 v* tag 都验证一次 deck.gl + maplibre-gl + headless GL 上下文真的能出 PNG。

`vitest-cross-os` 是这次踩坑的产物：原本想把 vitest 也扩到 macOS+Windows runner，发现 puppeteer 在 macOS GitHub runner 上 cold-start 经常 30s+，超过 vitest 默认 testTimeout。最后选择**让 cross-OS 只跑无浏览器的部分**——核心库的 SSR snapshot 和 transformProps 单测——puppeteer 部分继续 Linux only。这个权衡比"暴力 timeout 翻倍"更诚实。

---

## 自动化程度

1.0 之前，每次发版我要手动：
1. `git tag vX.Y.Z`
2. `git push origin vX.Y.Z`（CI 自动 npm publish）
3. `gh release create vX.Y.Z --notes-file ...`（手动写 release notes）

1.0 之后只剩第一步和第二步：

```bash
git tag v1.0.1
git push origin v1.0.1
# 接下来全自动：
#   - publish-core    npm publish @minimal-viz/core@1.0.1 + provenance
#   - publish-cli     npm publish xviz-cli@1.0.1
#   - publish-docker  build & push ghcr.io/.../xviz-cli:{1.0.1, 1.0, latest}
#   - github-release  从 CHANGELOG 抽取对应 section 创建 GitHub release
```

`maps-v*` tag 走另一条流水线（只跑 `publish-maps`）。所有 publish job 用 npm provenance（sigstore）签名，下载方可以 `npm view ... --json` 看到 transparency log 索引。

附带说一个有点丢人的细节：第一次 v1.0.0 发的时候，`github-release` job 抽不出 CHANGELOG 内容——awk 把 `[1.0.0]` 当成 character class 匹配（regex `[1.0.0]` 等于"匹配任一 1/0/."）解析了。Release notes 退化成了 fallback 文本"see CHANGELOG.md"。Hotfix（[`commit 0ce2771`](https://github.com/caiyin-bit/xviz/commit/0ce2771)）改成 `index($0, prefix) == 1` 字面匹配，往后 tag 不会再踩。v1.0.0 的 release notes 我手动 back-fill 了。

记一下当作笑柄：连发版工具自身都得写 inline test 啊。

---

## 1.0 之后做什么

**短期（1.0.x patch / 1.1）**：
- WordCloud：等 `echarts-wordcloud@^6` 上游升级。它现在还 peer-require `echarts@^5`，硬塞会破坏 38 张其他图。
- Horizon multi-band：当前的 Horizon 是 TimeseriesLine 加 area=true 的 alias，真正的折叠多 band 需要 ECharts custom renderItem，1.x 某个 minor 补。
- Cartodiagram 完整 ECharts 嵌入：当前 Phase-2 实现是用 canvas donut + IconLayer 简化，能跑通但少了"每点一张完整 ECharts 子图"的能力。

**中期（卫星包）**：
- `@minimal-viz/maps` 累计 3-5 个生产用户后再 graduate 到 1.0
- 可能再开一个 `@minimal-viz/aggrid`（被 1.0 spec 砍掉的 AgGridTable，作为可选卫星包出现是合理的）

**长期 / 软目标**：
- 文档站（spec 里的 C 主题）。当前 README 已经够用，但 navigable 的 API 参考站对采纳是有用的。
- Migration guide：写一篇"Superset 用户怎么 1:1 迁过来"。
- 性能优化：先有 baseline 再有调优。

---

## 怎么开始用

最小路径：

```bash
# React 库
npm install @minimal-viz/core react react-dom echarts

# 命令行工具
npm i -g xviz-cli

# Docker 一键
docker run --rm -v "$PWD:/data" \
  ghcr.io/caiyin-bit/xviz/xviz-cli:1.0 \
  render -d /data/sales.json -f /data/pie.json -o /data/out.png

# 地图卫星包（按需）
npm install @minimal-viz/maps maplibre-gl \
  @deck.gl/core @deck.gl/layers @deck.gl/aggregation-layers @deck.gl/mapbox
```

仓库在 [github.com/caiyin-bit/xviz](https://github.com/caiyin-bit/xviz)。Apache 2.0。Issue / Discussion / PR 都开着。

如果你正在用 Superset 做 BI，但又想把图表能力放到 BI 平台之外（嵌进 React 应用 / 用作 ChatOps 的画图工具 / 给 LLM agent 做工具用），希望 xviz 1.0 对你有用。

---

*本文与 v1.0.0 同时发布。版本细节、完整 changelog、迁移注意事项都在仓库 [CHANGELOG.md](../../CHANGELOG.md) 里。*
