# Security Policy

## Supported Versions

xviz follows a "latest-of-each-supported-major" support window. Security
fixes are only backported to the versions in the table below.

| Package                 | Versions in support                                       |
|-------------------------|-----------------------------------------------------------|
| `@minimal-viz/core`     | latest minor of latest major; latest minor of `major − 1` |
| `xviz-cli`              | latest minor of latest major; latest minor of `major − 1` |
| `@minimal-viz/maps`     | latest minor of latest major (still on the 0.x track)     |

Concretely, while the latest major is `1.x`, supported versions are:
- the most recently released `1.y.z`
- the most recently released `0.10.z` (last 0.x line)

`@minimal-viz/maps@0.x` is treated like a regular pre-1.0 package — only the
latest minor receives fixes.

## Reporting a Vulnerability

**Please do not file public GitHub issues for security problems.**

Use one of the following private channels:

1. GitHub's [private vulnerability reporting](https://github.com/caiyin-bit/xviz/security/advisories/new)
   (preferred — preserves an audit trail directly on the advisory).
2. Email the maintainer at the address listed on
   [`github.com/caiyin-bit`](https://github.com/caiyin-bit).

Please include:
- The package and version(s) affected.
- A minimal reproduction (data fixture + form fixture, or a code snippet).
- The impact you've observed (e.g. SSRF, prototype pollution, RCE in the
  CLI's headless Chrome, a tile-source XSS, etc).

We aim to:
- Acknowledge receipt within **3 business days**.
- Assess severity and provide a remediation timeline within **7 days**.
- For high-severity issues, ship a patch release within **14 days** of
  acknowledgement.

We will credit reporters in the release notes unless asked otherwise.

## Threat Model — In Scope

xviz is shipped as:
- A **headless renderer CLI** (`xviz`) that loads user-supplied JSON / CSV /
  SQL output into a Puppeteer-controlled Chrome. The CLI is intended to be
  run on infrastructure under the operator's control, against data the
  operator trusts to a similar degree.
- A **React component library** (`@minimal-viz/core`) that renders charts in
  the consumer's browser.
- An **MCP server** (`xviz mcp`) that exposes the renderer to LLM agents
  via stdio.

In scope for security reports:
- Code execution from a malicious `formData` payload (any of the three
  packages above).
- Path traversal / arbitrary file reads from CLI flags.
- SSRF via a custom `mapStyle` URL or arbitrary network access from the
  renderer beyond what the user's `formData` describes.
- Prototype pollution from `formData` parsing.
- Renderer XSS (formData → DOM injection that runs in the user's browser
  when consuming `@minimal-viz/core`).
- Supply-chain integrity (e.g. an unsigned tarball, broken provenance).

## Threat Model — Out of Scope

- Denial-of-service via "very large" `formData` / `queriesData`. The CLI
  has body-size caps on `xviz serve` (8 MiB default); larger DoS surface is
  considered the operator's responsibility.
- Issues caused by running `xviz` against actively malicious operators of
  the data pipeline (e.g. a compromised database). xviz is downstream of
  the operator's trust boundary.
- Vulnerabilities in **transitive** dependencies that are not exploitable
  in the way xviz uses them (please do still report — we will assess).
- Bugs in deck.gl, maplibre-gl, or echarts upstream — please report those
  to the respective project. We will track and ship patched versions when
  upstream releases them.

## Disclosure Policy

We follow a **coordinated disclosure** model. Please give us the
remediation window above before publicly disclosing the issue.
