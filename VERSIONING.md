# Versioning Policy

Effective from **`@minimal-viz/core@1.0.0`** and **`xviz-cli@1.0.0`**
(2026-05). Earlier 0.x releases predate this policy and offered no
compatibility guarantees.

`@minimal-viz/maps` remains on its own 0.x track until further notice and
does **not** participate in the 1.x semver commitment yet — see §5.

## 1. Semantic versioning commitment

All three packages follow [SemVer 2.0.0](https://semver.org/spec/v2.0.0.html)
strictly:

| Change                                                              | Version bump |
|---------------------------------------------------------------------|--------------|
| Breaking change to the **public API** (defined in §2)               | **major**    |
| New chart type, new `formData` field, new CLI flag, new MCP tool    | **minor**    |
| Bug fix, doc-only change, internal refactor, dep bump w/o API drift | **patch**    |

Pre-release identifiers (`-rc.N`, `-next.N`) are reserved for future use.
1.0.0 itself ships **without** an RC stage.

## 2. The public API surface

The frozen surface for `@minimal-viz/core@1.x` is exactly the symbols
re-exported from `dist/index.{js,cjs,d.ts}` — i.e. everything declared in
`src/viz/index.ts`. This is verified mechanically by
`src/viz/public-api.test.ts`, which inline-snapshots the top-level export
list. Any change to that list (adding, removing, renaming) requires a
matching version bump per the table above.

For `xviz-cli@1.x`, the frozen surface is:

- The **`xviz` binary**'s subcommand list and documented flags
  (`xviz render | query | serve | mcp`).
- The **HTTP API** of `xviz serve` — `GET /health`, `POST /render`
  payload shape and response formats (PNG / JPG / PDF / HTML).
- The **MCP tool surface** of `xviz mcp` — tool names, parameter shapes,
  and response shapes.
- The **`window.__CHART__`** contract that the renderer reads. The full
  list of valid `type` strings is defined in `xviz-cli/renderer/main.tsx`.

For `@minimal-viz/maps@0.x` (still pre-1.0): the surface is the symbols
exported from `src/index.ts`. They are **not** frozen yet, but breaking
changes will still bump the minor (0.1.x → 0.2.0) per pre-1.0 SemVer.

### Out of scope (may change in any release without notice)

- ECharts' own `option` shape, leaked via `Echart` and any `transform*Props`
  helper return value. We re-export `Echart` for advanced users; consumers
  of its `option` argument follow ECharts' own versioning.
- Theme token internals beyond `Theme`, `LIGHT_THEME`, `DARK_THEME`,
  `DEFAULT_THEME`, `extendTheme`. The token *names* are public; the exact
  RGB values may shift between minors.
- The Puppeteer launch sequence, Chrome flags, and the structure of files
  inside `xviz-cli/dist/renderer/`.
- Internal modules under `src/viz/<chart>/transformProps.ts` (other than
  the two we explicitly re-export, `transformPieProps` and
  `transformCartesianProps`).
- File layout of repository sources.

## 3. Deprecation policy

When we deprecate part of the public API:

1. We mark it `@deprecated` in JSDoc + types in the same release where the
   replacement lands. The deprecation entry goes in `CHANGELOG.md`.
2. The deprecated symbol keeps working for **at least one full minor
   version** (e.g. deprecated in 1.3 ⇒ removable no earlier than 1.5).
3. We document the migration path in the CHANGELOG entry of the release
   that introduces the deprecation.
4. We remove the symbol in the next major (e.g. 2.0).

## 4. Supported versions

We provide security and critical-bug fixes for:

- The latest minor of the latest major.
- The latest minor of the previous major (for ≤ 6 months after the next
  major's release).

Currently (2026-05):
- `@minimal-viz/core@1.x` — latest minor.
- `@minimal-viz/core@0.10.x` — last 0.x line; supported through 2026-11.
- `xviz-cli@1.x` — latest minor.
- `xviz-cli@0.10.x` — last 0.x line; supported through 2026-11.
- `@minimal-viz/maps@0.1.x` — only the latest minor while on 0.x.

## 5. Why `@minimal-viz/maps` is separate

The maps satellite shipped on 2026-04-29 with effectively no production
deployments. Freezing its API alongside core would lock in abstractions
that haven't been validated against real workloads. Once the package has
seen meaningful adoption (either user feedback or our own dogfooding), it
will graduate to 1.0 with the same commitments listed here. Until then it
follows pre-1.0 SemVer rules: minor bumps may break compatibility.

## 6. Pre-release channel

There is no current `next` / `beta` / `rc` channel. If we add one in the
future:

- The `latest` dist-tag will continue to track stable releases.
- Pre-release versions will be tagged `next` and use the version pattern
  `<next>-rc.N`.
- Pre-releases are not covered by the deprecation or support policies
  above.
