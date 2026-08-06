# 🤖 rastrillo.org Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy the one-page, manifest-led marketing site for Rastrillo at rastrillo.org.

**Architecture:** Eleventy 3 (ESM config, Nunjucks) renders `src/index.njk` + `src/_data/*.json` into a static `_site/` with zero client-side JavaScript. Visual design comes from an impeccable cycle (Task 3) after the content is structurally complete. Deploy is CARLOS bucket-mode ship/promote + registry-mode routes, per CLAUDE.md.

**Tech Stack:** Node 20, @11ty/eleventy ^3.0, Nunjucks, hand-written CSS. No client JS, no external fonts.

## Global Constraints

- Served output: **zero client-side JavaScript**, no external fonts, no analytics (spec "Stack").
- All prose is AI-written and must carry the visible 🤖 marking per CLAUDE.md; the page renders a visible robot-note.
- Hero headline verbatim: **"Fast, cost-efficient, good: pick all three with rastrillo."** (spec "Decisions").
- Every technical claim traces to `carlosframework/rastrillo` (origin/main), never to previous marketing copy.
- Light and dark themes both work (`prefers-color-scheme`).
- Manifest showcase numbers (16 lines TOML → 21 files, ~1,980 lines) were measured from `examples/tickets` at origin/main on 2026-08-06; re-measure if the example changed.
- Commits end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: Eleventy scaffold + CI

**Files:**
- Create: `package.json`, `eleventy.config.js`, `src/_includes/base.njk`, `src/index.njk` (minimal), `src/site.css` (empty placeholder comment), `.github/workflows/build.yml`, `hack/check-anchors.mjs`
- Test: the build itself + anchor checker

**Interfaces:**
- Produces: `npm run build` → `_site/index.html` + `_site/site.css`; `npm run check` → runs build then anchor check; layout `base.njk` consumed by Task 2's `index.njk`.

- [ ] **Step 1: package.json**

```json
{
  "name": "rastrillo-website",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "eleventy",
    "serve": "eleventy --serve",
    "check": "eleventy && node hack/check-anchors.mjs _site/index.html"
  },
  "devDependencies": {
    "@11ty/eleventy": "^3.0.0"
  }
}
```

- [ ] **Step 2: eleventy.config.js**

```js
// 🤖 Build-time only — the served site ships no JavaScript.
export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/site.css": "site.css" });
  eleventyConfig.addPassthroughCopy({ "src/favicon.svg": "favicon.svg" });
  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
  };
}
```

(`src/favicon.svg` arrives in Task 3; passthrough of a missing file is not an error in Eleventy 3 — if the build complains, add a 1-line placeholder SVG.)

- [ ] **Step 3: src/_includes/base.njk**

```njk
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{ title }}</title>
<meta name="description" content="{{ description }}">
<meta property="og:title" content="{{ title }}">
<meta property="og:description" content="{{ description }}">
<meta property="og:type" content="website">
<meta property="og:url" content="https://rastrillo.org/">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/site.css">
</head>
<body>
{{ content | safe }}
</body>
</html>
```

- [ ] **Step 4: minimal src/index.njk**

```njk
---
layout: base.njk
title: Rastrillo — the CARLOS web framework
description: "🤖 Rastrillo is the CARLOS web framework: declare a resource in a few lines of TOML and read every line it generates. Try it now — go install it and have an app running locally in a minute."
---
<h1>rastrillo</h1>
```

- [ ] **Step 5: src/site.css placeholder**

```css
/* 🤖 rastrillo.org stylesheet — real design lands with the impeccable cycle (Task 3). */
```

- [ ] **Step 6: hack/check-anchors.mjs**

```js
// 🤖 Fails the build when an in-page href="#x" has no matching id="x".
import { readFileSync } from "node:fs";
const html = readFileSync(process.argv[2], "utf8");
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
const missing = [...html.matchAll(/\bhref="#([^"]+)"/g)]
  .map((m) => m[1])
  .filter((a) => !ids.has(a));
if (missing.length) {
  console.error(`broken anchors: ${missing.join(", ")}`);
  process.exit(1);
}
console.log("anchors ok");
```

- [ ] **Step 7: .github/workflows/build.yml**

```yaml
name: build
on:
  push:
    branches: [main]
  pull_request:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run check
```

- [ ] **Step 8: install and verify**

Run: `npm install && npm run check`
Expected: `_site/index.html` written; `anchors ok`.

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "Eleventy scaffold: build, anchor check, CI 🤖"
```

---

### Task 2: Full page content (structure + copy, unstyled)

**Files:**
- Create: `src/_data/pillars.json`, `src/_data/status.json`, `src/_data/trysteps.json`, `src/_data/deploysteps.json`
- Modify: `src/index.njk` (replace minimal body)

**Interfaces:**
- Consumes: `base.njk` layout from Task 1.
- Produces: the complete semantic page — sections with ids `manifest`, `pillars`, `proof`, `start`, `deploy`, `status`; class hooks used by Task 3's CSS (`brandline`, `hero`, `lede`, `cta`, `btn primary|ghost`, `robot-note`, `eyebrow`, `epigraph`, `showcase`, `cards`/`card`, `status-strip`, `yesno built|not-built`, `step`/`stepnum`).

- [ ] **Step 1: src/_data/pillars.json**

```json
[
  {
    "title": "Filesystem routing",
    "body": "<code>actions/orders/[id]/cancel.POST.go</code> becomes <code>POST /orders/{id}/cancel</code> — the directory structure <em>is</em> the route table. Bracket segments are path params, the filename suffix is the HTTP verb, and <code>rastrillo generate</code> writes it all into a plain <code>gen/router.go</code> on Go's standard <code>http.ServeMux</code>: committed, readable, diffable."
  },
  {
    "title": "Platform-ready by default",
    "body": "<code>rastrillo.Run</code> speaks the CARLOS platform's activation contract end to end — hibernating instances, <code>carlos-app@</code> systemd unit tenants, plain instances, and a bare dev fallback, no separate integration per deployment shape. Hibernation is the cost-efficiency receipt: your app isn't running when nobody's knocking, and the platform wakes it when someone does."
  },
  {
    "title": "Localization built in",
    "body": "Declare your locales and <code>/fr/orders</code> and <code>/orders</code> reach the same route. Request-scoped <code>T</code>/<code>Tf</code> fall back through catalogs so a missing translation stays visible, never blank — and <code>generate --check</code> fails loudly on incomplete catalogs before you ship, not after."
  },
  {
    "title": "A UI vocabulary, zero JavaScript",
    "body": "<code>rastrillo/ui</code> ships list-screen and form partials plus design tokens: light and dark, WCAG AA contrast, and not one line of client-side JavaScript. <code>examples/blog</code> is a real blog, admin side and all, from stock components only."
  },
  {
    "title": "One binary, no toolchain sprawl",
    "body": "<code>go install</code> gets you the CLI, <code>go build</code> gets you the app — a single static binary with SQLite compiled in. No bundler, no separate codegen service, no runtime to babysit. The framework whose family motto is \"no build step\" doesn't ship one to your visitors either."
  }
]
```

- [ ] **Step 2: src/_data/status.json**

```json
{
  "built": [
    "<code>rastrillo new</code> / <code>generate</code> — scaffold and route",
    "<code>rastrillo dev</code> — save, and it regenerates, rebuilds, restarts",
    "Manifests: a declared <code>Resource</code> generates store, actions, screens, and locale keys — with declared filters and server-side <code>required</code> validation",
    "<code>examples/tickets</code> — a fully generated admin: zero hand actions, zero ejected templates",
    "<code>rastrillo.Run</code> — the full platform activation contract, hibernate and systemd tenants included",
    "SQLite bootstrap: pragma ordering, single-writer, additive migrations",
    "Localization: locale-resolved routes, <code>T</code>/<code>Tf</code> with fallback, a ship-gate catalog check",
    "<code>rastrillo/ui</code> — list-screen and form partials plus design tokens: light and dark, WCAG AA, zero JavaScript",
    "<code>examples/blog</code> — a real blog from stock components, coexisting with hand-written actions"
  ],
  "notyet": [
    "The mergeable event-log store, blobs",
    "The crypto core, WebAuthn",
    "Agents",
    "The rest of the component vocabulary — and the rest of the manifest surface (delete flows, derived fields, richer kinds)"
  ]
}
```

- [ ] **Step 3: src/_data/trysteps.json**

```json
[
  {
    "title": "Install the CLI",
    "cmd": "go install github.com/carlosframework/rastrillo/cmd/rastrillo@latest",
    "note": "Or via Homebrew: <code>brew install carlosframework/tap/rastrillo</code>."
  },
  {
    "title": "Scaffold an app",
    "cmd": "rastrillo new myapp",
    "note": "Writes a <code>go.mod</code>, one starter action, a <code>main.go</code> wiring <code>rastrillo.Run</code>, and the <code>rastrillo/ui</code> design tokens — then runs <code>generate</code> once, so the next step just works."
  },
  {
    "title": "Run it",
    "cmd": "cd myapp && go mod tidy && rastrillo dev",
    "note": "Visit <code>localhost:8080</code> — that's your app. Edit an action, save, refresh: <code>rastrillo dev</code> regenerates, rebuilds, and restarts for you in about a second. A save that doesn't compile keeps the previous build serving while you fix it."
  }
]
```

- [ ] **Step 4: src/_data/deploysteps.json**

```json
[
  {
    "title": "Install the platform binary",
    "cmd": "brew install carlosframework/tap/carlos",
    "note": "Or grab a binary directly from <a href=\"https://github.com/carlosframework/releases\">carlosframework/releases</a>."
  },
  {
    "title": "Build your app for the target host",
    "cmd": "GOOS=linux GOARCH=arm64 go build -o myapp ./cmd/myapp",
    "note": ""
  },
  {
    "title": "Ship, promote, route",
    "cmd": "carlos ship -app myapp -version $(git rev-parse --short HEAD) myapp-binary\ncarlos promote -app myapp <version> stable\ncarlos add -app myapp -kind instance myapp.yourdomain.com",
    "note": "The same sequence — against a real S3-backed bucket, a real edge, a real certificate — that put rastrillo's own example live at <a href=\"https://helloworld.dev.oncarlos.com\">helloworld.dev.oncarlos.com</a>. Standing up the box, bucket, and DNS is the one-off part; from then on every deploy is <code>ship</code> then <code>promote</code>."
  }
]
```

- [ ] **Step 5: src/index.njk full body** — front matter as Task 1 plus the page. The manifest TOML below is `examples/tickets/manifest/ticket_types.toml` **verbatim**; do not prettify it.

```njk
---
layout: base.njk
title: Rastrillo — the CARLOS web framework
description: "🤖 Rastrillo is the CARLOS web framework: declare a resource in a few lines of TOML and read every line it generates. Try it now — go install it and have an app running locally in a minute."
---
<p class="brandline"><a href="https://carlosframework.com"><b>CARLOS</b></a> <span aria-hidden="true">/</span> <span class="here">rastrillo</span></p>

<header class="hero">
  <h1>Fast, cost-efficient, good: pick <span class="x">all three</span> with rastrillo.</h1>
  <p class="lede">The web framework companion to CARLOS: declare what your app is, read every line it generates, and ship it to a platform that only bills you when someone shows up.</p>
  <div class="cta">
    <a class="btn primary" href="#start">Try it now</a>
    <a class="btn ghost" href="https://github.com/carlosframework/rastrillo">Read the source</a>
  </div>
  <p class="robot-note">🤖 This page was written by an LLM, on the ideas, instruction, and editing of humans. AI-written text here is always marked, visibly, like this — that's <a href="https://11factor.org/#x">factor X</a>.</p>
</header>

<main>

<section id="manifest">
  <span class="eyebrow">the manifest system</span>
  <h2>Sixteen lines in. An admin you can read, out.</h2>
  <p class="epigraph">Generated, not interpreted — everything it writes, you can read.</p>

  <div class="showcase">
    <figure class="manifest-in">
      <figcaption>manifest/ticket_types.toml — the whole file</figcaption>
      <pre><code>name  = "ticket_types"
route = "/admin/ticket_types"
store = "exclusive"

[list]
columns = [{ field = "Name" }, { field = "Price", kind = "money" }, { field = "Status" }]
search  = true

[[list.filters]]
field  = "Status"
values = ["draft", "on_sale", "sold_out"]

[form]
basics   = [{ name = "Name", required = true }, { name = "Price", kind = "money", required = true }, { name = "Status" }]
advanced = [{ name = "MaxPerOrder" }]</code></pre>
    </figure>
    <div class="manifest-out">
      <h3>What <code>rastrillo generate</code> wrote from it</h3>
      <ul>
        <li><strong>21 files, ~1,980 lines</strong> of plain Go, SQL, HTML, and locale keys — committed under <code>gen/</code>, diffable in review like any code</li>
        <li><strong>Seven actions</strong>: list, create, show, edit — wired into the router</li>
        <li><strong>Three screens</strong>: list with search, a working Status filter dropdown, and paging; a two-tier form; a show page</li>
        <li><strong>A typed store</strong>: schema, additive migrations, and sqlc-generated queries</li>
        <li><strong>Server-side validation</strong>: <code>required = true</code> means the generated actions 400 with the field's own message, re-rendered in the form</li>
      </ul>
      <p>Nothing parses that TOML at request time. There is no <code>actions/</code> directory in this app at all — <a href="https://github.com/carlosframework/rastrillo/tree/main/examples/tickets">examples/tickets</a> is manifest-only, and it's the framework's own regression suite. And when a generated screen stops being enough, eject it: the file becomes yours, and the generator leaves it alone.</p>
    </div>
  </div>
</section>

<section id="pillars">
  <span class="eyebrow">what you stand on</span>
  <h2>Boring machinery, deliberately</h2>
  <p class="epigraph">Go's standard library, SQLite, and files you can read — nothing decided behind your back.</p>
  <div class="cards">
  {% for p in pillars %}
    <div class="card">
      <h3>{{ p.title }}</h3>
      <p>{{ p.body | safe }}</p>
    </div>
  {% endfor %}
  </div>
</section>

<section id="proof" class="status-strip">
  <p class="live">Live proof</p>
  <h2>Not a mockup</h2>
  <p>Rastrillo's example app is deployed on a real CARLOS platform right now: real S3-backed storage, a real edge, a real certificate. <a href="https://helloworld.dev.oncarlos.com">helloworld.dev.oncarlos.com</a> — the exact code you'll have running locally two minutes from now, actually shipped. This site is served the same way.</p>
</section>

<section id="start">
  <span class="eyebrow">try it now</span>
  <h2>Run it locally</h2>
  <p class="epigraph">One command to install, three more to a running app.</p>
  {% for s in trysteps %}
  <div class="step"><span class="stepnum">{{ loop.index }}</span><h3>{{ s.title }}</h3></div>
  <pre><code>{{ s.cmd }}</code></pre>
  {% if s.note %}<p>{{ s.note | safe }}</p>{% endif %}
  {% endfor %}
</section>

<section id="deploy">
  <span class="eyebrow">then ship it</span>
  <h2>Deploy it for real</h2>
  <p class="epigraph">CARLOS is self-hostable — one binary, a bucket, and DNS. No PaaS account to sign up for.</p>
  {% for s in deploysteps %}
  <div class="step"><span class="stepnum">{{ loop.index }}</span><h3>{{ s.title }}</h3></div>
  <pre><code>{{ s.cmd }}</code></pre>
  {% if s.note %}<p>{{ s.note | safe }}</p>{% endif %}
  {% endfor %}
</section>

<section id="status">
  <span class="eyebrow">honestly</span>
  <h2>What's real today</h2>
  <p class="epigraph">A young framework that ships its status on its homepage — this list moves when the work lands, not before.</p>
  <div class="yesno built">
    <h3>Built</h3>
    <ul>{% for item in status.built %}<li>{{ item | safe }}</li>{% endfor %}</ul>
  </div>
  <div class="yesno not-built">
    <h3>Not yet</h3>
    <ul>{% for item in status.notyet %}<li>{{ item | safe }}</li>{% endfor %}</ul>
  </div>
</section>

</main>

<footer>
  <p>🤖 Written by an LLM (Claude), on the ideas, instruction, and editing of humans. AI-written text here is always marked and always disclosed — see <a href="https://11factor.org/#x">factor X</a>.</p>
  <p>Rastrillo builds apps that run on <a href="https://carlosframework.com/platform">the CARLOS platform</a>, keeping the promises set out in <a href="https://11factor.org">The Eleven Factors</a>.</p>
  <p><a href="https://github.com/carlosframework/rastrillo">Source for rastrillo on GitHub</a>. Open, of course.</p>
</footer>
```

- [ ] **Step 6: verify**

Run: `npm run check`
Expected: build succeeds, `anchors ok`. Manually confirm `_site/index.html` contains all six section ids and the verbatim hero headline.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "Full page content: manifest showcase, pillars, proof, try-it, deploy, status 🤖"
```

---

### Task 3: Visual design (impeccable cycle)

**Files:**
- Create: `src/favicon.svg`, `DESIGN.md`
- Modify: `src/site.css` (the real stylesheet), `src/index.njk`/`base.njk` only if the approved comp requires structural hooks

**Interfaces:**
- Consumes: Task 2's class hooks.
- Produces: the finished visual design + `DESIGN.md` contract.

This task is executed via the **impeccable** skill (direction → comps → build → finish-review), not as a plain subagent task. Constraints handed to the cycle, from the spec:

- Own identity, family resemblance to carlosframework.com: quiet confidence, hairline rules, visible 🤖 note, light + dark via `prefers-color-scheme`; carlos house style is Charter/Georgia serif with a single accent (carlos teal `#0d6e63`/`#4cc3ae`; the current rastrillo page used blue `#0f5e85`/`#5db8dd`) — rastrillo may keep serif kinship or diverge, but must not be mistaken for the carlos homepage.
- Own mark/favicon; rastrillo means "rake" in Spanish — a possible motif, the designer's call.
- Zero client-side JavaScript, no external fonts. System font stacks only.
- WCAG AA contrast in both themes.
- The manifest showcase is the visual centerpiece — the TOML-beside-output composition must read on mobile (stacked) and desktop (side by side).

- [ ] **Step 1:** Run the impeccable cycle on the built site; get the direction approved (Paul is iterating post-launch, so a self-approved direction consistent with the constraints is acceptable for go-live).
- [ ] **Step 2:** `npm run check` passes; inspect both themes.
- [ ] **Step 3:** Record `DESIGN.md` via the impeccable documenter.
- [ ] **Step 4:** Commit: `git add -A && git commit -m "Visual design: <direction name> 🤖"`

---

### Task 4: Accuracy + finish review

**Files:**
- Modify: whatever the reviews flag.

- [ ] **Step 1:** Claim check — verify each Built bullet and showcase number against `carlosframework/rastrillo` origin/main (README + `examples/tickets`); fix any drift.
- [ ] **Step 2:** `curl -s -o /dev/null -w "%{http_code}" https://helloworld.dev.oncarlos.com` → 200, and every external href on the page returns 200.
- [ ] **Step 3:** Impeccable finish-review on the built page; apply material fixes.
- [ ] **Step 4:** Final whole-branch review by a fresh most-capable-model subagent (per workflow memory); fix Criticals.
- [ ] **Step 5:** Commit fixes.

---

### Task 5: GitHub repo + draft PR

- [ ] **Step 1:** `gh repo create carlosframework/rastrillo-website --public --source . --push` (bootstrap commit is main).
- [ ] **Step 2:** Site work happens on branch `site-v1`; push and open a **draft PR** titled "rastrillo.org v1: manifest-led marketing site 🤖" with a process paragraph (spec → plan → build → impeccable → reviews) in the body, ending with the 🤖 generation footer.
- [ ] **Step 3:** CI green on the PR.

---

### Task 6: Go live on rastrillo.org

Prereq: **rastrillo.org is unregistered (NXDOMAIN, 2026-08-06)** — register it first (DNSimple, auto-renew, whois privacy, like oncarlos.com; account choice mirrors where creds exist — note the choice for Paul).

- [ ] **Step 1:** Register rastrillo.org in DNSimple; add A records apex + `www` → `99.81.104.219`, TTL 300 (terraform in `platform-infrastructure` if the zone lands in the Team Tito account; direct records if account 285).
- [ ] **Step 2:** Clean-export build and ship per CLAUDE.md runbook (`git archive` → `npm ci && npm run build` → `carlos ship -app rastrillo -kind static -version <sha> _site` → promote to `canary/rehearsal`).
- [ ] **Step 3:** Registry-mode routes on the flagship box via SSM: `carlos add -app rastrillo -kind static rastrillo.org` and `www.rastrillo.org` (match the carlosframework www-route flags used on the box).
- [ ] **Step 4:** Verify: `curl -sI https://rastrillo.org` and `https://www.rastrillo.org` → 200 with valid certs; page contains the hero headline.
- [ ] **Step 5:** Update CLAUDE.md if any runbook detail differed in practice; commit.
