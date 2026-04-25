# Contributing to xviz

Thanks for your interest! This document covers everything you need to file
a useful bug report, propose a feature, or send a pull request. The Chinese
quick-reference is at the bottom (中文速览).

## Table of contents

- [What goes where](#what-goes-where)
- [Reporting bugs](#reporting-bugs)
- [Proposing features](#proposing-features)
- [Pull requests](#pull-requests)
- [Local development](#local-development)
- [Testing](#testing)
- [Coding style](#coding-style)
- [Release process](#release-process)
- [中文速览](#中文速览)

## What goes where

The repository hosts two npm packages and a demo app:

| Path | Package | What it is |
| --- | --- | --- |
| `minimal-viz/` | `@minimal-viz/core` | React component library (Pie, Bar, Line, …) |
| `xviz-cli/` | `xviz-cli` | Headless CLI / MCP / HTTP server that renders charts |
| `pie-demo/` | _(private)_ | Side-by-side demo, not published |

Most contributions touch one of the first two. If a change affects both, send
**one** PR — we squash-merge.

## Reporting bugs

Open a [bug issue](../../issues/new?template=bug.yml). Please include:

- The package and version (`xviz-cli@x.y.z` or `@minimal-viz/core@x.y.z`).
- Node version (`node --version`).
- A minimal reproduction (data file + form file is usually enough).
- The actual vs. expected output.

## Proposing features

Open a [feature issue](../../issues/new?template=feature.yml) **before**
opening a PR for anything beyond a one-line fix. We'd rather discuss the
shape than ask you to redo the work.

## Pull requests

1. Fork the repo, create a branch from `main`.
2. Make your change. Keep PRs focused — one logical change per PR.
3. Run the relevant test suite locally (see [Testing](#testing)).
4. Open a PR using the [template](.github/pull_request_template.md).
5. CI will run Vitest, the CSV regression suite, and a pack-smoke that
   does a real `xviz render` end-to-end. Run `npm run lint` (minimal-viz)
   and `npm run typecheck` (each package) locally before submitting.
6. A maintainer will review. Expect comments — the project is small enough
   that we read every line.

## Local development

```bash
# Clone
git clone https://github.com/caiyin-bit/xviz.git
cd xviz

# Install both packages
(cd minimal-viz && npm ci)
(cd xviz-cli && npm ci --include=optional)  # optional = sqlite/pg drivers

# Run the lib's playground
(cd minimal-viz && npm run dev)             # http://localhost:5173

# Build the CLI's renderer bundle (required before running the CLI from source)
(cd xviz-cli && npm run build)

# Try the CLI
node xviz-cli/bin/xviz.mjs render \
  -d xviz-cli/examples/pie-data.json \
  -f xviz-cli/examples/pie-form.json \
  -o /tmp/pie.png
```

You'll need Chrome or Chromium for any rendering test. If `xviz` can't
find it, set `XVIZ_CHROME=/path/to/chrome`.

## Testing

| Suite | Where | Command |
| --- | --- | --- |
| Lib unit / snapshot tests | `minimal-viz/` | `npm test` |
| CLI E2E (render/query/mcp) | `xviz-cli/` | `npm test` |
| CSV compatibility | `xviz-cli/` | `npm run test:csv` |
| Lint | `minimal-viz/` | `npm run lint` |
| Typecheck | each package | `npm run typecheck` |

CI runs all of these on every PR. To match CI locally:

```bash
(cd minimal-viz && npm test && npm run lint && npm run typecheck)
(cd xviz-cli && npm test && npm run test:csv && npm run typecheck)
```

## Coding style

- TypeScript / TSX in `minimal-viz/src/`, ES Modules (`.mjs`) in `xviz-cli/bin/`.
- Match the surrounding style; don't reformat untouched code.
- ESLint config (in `minimal-viz/`) is the source of truth for lint rules —
  if it doesn't flag it, it's fine.
- Comments explain **why**, not what. Code that isn't obvious deserves a line.

## Release process

Maintainer-only.

1. Bump versions in `minimal-viz/package.json` and `xviz-cli/package.json`.
2. Update `CHANGELOG.md` — move entries from `[Unreleased]` into a new
   `[x.y.z] — YYYY-MM-DD` section.
3. Commit, tag (`git tag vX.Y.Z`), push including tags.
4. The `Release` workflow (`.github/workflows/release.yml`) publishes both
   packages with `--provenance` if the tag matches the package version.

## 中文速览

- 报 bug：用 [bug 模板](../../issues/new?template=bug.yml)，附 Node 版本和最小复现。
- 提需求：先开 [feature issue](../../issues/new?template=feature.yml)，确认方向再写代码。
- 本地开发：`npm ci` 安装依赖；`npm test` 跑测试；图表渲染需要本地有 Chrome（或设 `XVIZ_CHROME`）。
- 提 PR：从 `main` 切分支，一个 PR 解决一件事，CI 全绿才会 review。
- 中英文都欢迎；issue / PR 描述用任何一种都行。
