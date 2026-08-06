# Product

<!-- impeccable:product-schema 1 -->

🤖 (Interview skipped on Paul's standing "go ahead until it's live, I'll
iterate" instruction, 2026-08-06; facts below come from the committed
spec, `carlosframework/rastrillo`, and the carlosframework.com site.
Inferred rather than user-confirmed facts are marked *(inferred)*.)

## Platform

web

## Stack

Eleventy 3 (user-chosen, in the approved spec), Nunjucks, one
hand-written `src/site.css`. Served output is static files with zero
client-side JavaScript, no external fonts, no analytics.

## Users

Working software developers — mostly Go-curious or Go-fluent, often
solo or tiny-team — evaluating whether Rastrillo is worth an hour of
their evening. They arrive skeptical of framework marketing and of AI
codegen magic; they respect readable code, honest status lists, and a
try-it path that works first time. *(inferred from the framework's
positioning and the carlos-family site voice)*

## Product Purpose

rastrillo.org is the marketing site for Rastrillo, the CARLOS web
framework. It exists to turn a skeptical developer's visit into a
`go install` — the "try it now" sentiment is the site's one conversion
goal — while never overclaiming what the young framework can do.

## Positioning

Rastrillo's uncopyable claim: **declare a resource in 15 lines of
TOML and read every line of the ~2,000 it generates** — plain Go, SQL,
HTML, and locale keys, committed under `gen/`, diffable, ejectable.
Generated, not interpreted; nothing parses a manifest at request time.
Plus: the only framework whose apps speak the CARLOS platform's
hibernation/activation contract natively, which is the cost-efficiency
receipt (apps that aren't running when nobody's knocking).

## Operating Context

Visitors land from the carlosframework.com family sites, GitHub, or
word of mouth. The proof surface is real: `examples/tickets` (fully
generated admin), `examples/blog` (coexistence with hand actions), and
a live deployment at helloworld.dev.oncarlos.com. The site itself is
served by the CARLOS flagship — it runs on the thing it markets.

## Capabilities and Constraints

- One landing page; no subpages, docs, or blog at launch.
- Content that moves with the framework (Built/Not-yet, pillars,
  steps) lives in `src/_data/` JSON.
- Every technical claim must trace to `carlosframework/rastrillo`
  (README, code, examples) — never to previous marketing copy.
- The framework is young: manifest slices 1–2, core loop, i18n, and
  `rastrillo/ui` are real; Mergeable, blobs, crypto, WebAuthn, agents
  are designed but unbuilt. The site says so in its own Built/Not-yet
  section.

## Brand Commitments

- Name: **Rastrillo** (Spanish for "rake"); lowercase `rastrillo` in
  code and the brandline. Part of the CARLOS family
  (carlosframework.com) — sibling sites, visibly related, never
  identical. Family character: quiet confidence, hairline rules,
  light+dark via `prefers-color-scheme`, serif kinship allowed
  (carlos house style: Charter/Georgia, single accent — carlos teal
  `#0d6e63`/`#4cc3ae`; the retiring rastrillo page used blue
  `#0f5e85`/`#5db8dd`).
- **Factor X marking is binding:** AI-written prose always carries a
  visible 🤖 marker; the page renders a robot-note. See CLAUDE.md.
- Hero headline is fixed copy: "Fast, cost-efficient, good: pick all
  three with rastrillo."

## Evidence on Hand

- The verbatim `ticket_types.toml` manifest (15 lines) and its
  measured output (21 files, 1,978 lines) from `examples/tickets`.
- Live deployment: https://helloworld.dev.oncarlos.com (200 as of
  2026-08-06).
- No testimonials, no adopter logos, no benchmarks — do not fabricate
  any.

## Product Principles

- Honesty converts: the Built/Not-yet list is a feature, not a risk.
- Show the artifact: real TOML beside real generated output beats any
  adjective.
- The try-it path is the product: every section should shorten the
  distance to `go install`.
- Practice what it preaches: zero client JS, no external requests,
  AA contrast — the site obeys the framework's own rules.

## Accessibility & Inclusion

WCAG AA contrast in both themes (a stated spec requirement; the
framework's own ui package holds the same bar).
