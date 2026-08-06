# 🤖 rastrillo.org — design spec

*Approved by Paul in conversation, 2026-08-06. This document records the
approved design; the implementation plan derives from it.*

## Goal

A standalone marketing site for Rastrillo at **rastrillo.org**: one meaty,
benefit-led landing page that keeps the "try it now" sentiment of the
current `carlosframework.com/rastrillo` page, re-anchored on the manifest
system (which landed after that page was written — the live page still
lists the manifest system under "Not yet"; this site corrects it).

## Decisions (all confirmed with Paul)

- **Scope:** one landing page. No subpages at launch; Eleventy's
  templates/data keep growth cheap later.
- **Structure:** product page, manifest-led (see Content below).
- **Hero:** keep "Fast, cost-efficient, good: pick all three with
  rastrillo." — already sell-y, already approved once.
- **Look:** own identity, family resemblance — rastrillo gets its own
  distinctive design (impeccable drives it) but shares the quiet, honest,
  no-client-JS character of carlosframework.com. A sibling, not a clone.
- **Deploy:** on the CARLOS flagship, exactly like carlosframework.com is
  deployed today (bucket-mode ship/promote, registry-mode routes).
- **Old page:** `carlosframework.com/rastrillo` redirects to rastrillo.org
  once live — a follow-up PR to `carlosframework/website`, not this repo.

## Stack

- **Eleventy 3** (ESM config), Nunjucks templates. `src/index.njk`, one
  base layout in `src/_includes/`, content data in `src/_data/`
  (pillar cards, Built/Not-yet lists, try-it and deploy steps) so status
  updates are data edits, not template surgery.
- One hand-written `site.css`, passthrough-copied. Own favicon/mark.
- **Zero client-side JavaScript.** Eleventy runs at build time only; the
  served output is static files, no external fonts, no analytics.
- 🤖/👨 authorship rule (CLAUDE.md), visible robot-note on the page.

## Content — one page, in order

1. **Brandline** breadcrumb: CARLOS / rastrillo, linking to
   carlosframework.com.
2. **Hero:** the "pick all three" headline + lede; CTAs *Get started*
   (→ try-it section) and *Read the source* (→ GitHub). Robot-note.
3. **Manifest showcase** (the new centerpiece): the real
   `examples/tickets` manifest — 16 lines of TOML
   (`manifest/ticket_types.toml`) — beside what `rastrillo generate`
   produced from it: 21 files, ~1,980 lines of readable Go, SQL, HTML and
   locale keys — seven actions, list/form/show screens, a sqlc store with
   schema and migrations, a working filter dropdown and server-side
   Required validation. Claim: "Generated, not interpreted — everything it
   writes, you can read." Numbers must be regenerated from the repo when
   the example changes.
4. **Pillars** (cards): filesystem routing; platform-ready (activation
   contract end to end; hibernation as the cost-efficiency receipt);
   localization (locale-resolved routes, T/Tf fallback, ship-gate catalog
   check); `rastrillo/ui` (light/dark, WCAG AA, zero JS); one binary, no
   toolchain beyond Go.
5. **Live proof** strip: helloworld.dev.oncarlos.com — real S3-backed
   storage, real edge, real certificate. (Verified 200 on 2026-08-06.)
6. **Try it now:** install (`go install
   github.com/carlosframework/rastrillo/cmd/rastrillo@latest` / brew) →
   `rastrillo new` → `rastrillo dev`. Kept from the current page,
   refreshed against the repo.
7. **Deploy for real:** carlos ship / promote / add — self-hostable, no
   PaaS account.
8. **Honest status:** Built / Not-yet, updated to post-manifest reality:
   manifest slices 1–2 (Resource → four generated states, declared
   filters, Required validation) move to Built; Mergeable/blobs, crypto,
   WebAuthn, agents, the rest of the component vocabulary stay Not-yet.
9. **Footer:** factor X provenance, CARLOS platform link, GitHub link.

Every claim traces to `carlosframework/rastrillo` (README, code,
examples) — never to previous marketing copy.

## Design direction

The impeccable cycle runs during implementation: direction contract and
comps first, then build, then finish-review. Constraints it inherits:
family resemblance to carlosframework.com (quiet confidence, hairline
rules, light+dark, visible 🤖 note) with rastrillo's own accent,
typography allowed to diverge, and an own mark/favicon (rastrillo =
"rake" in Spanish; a possible motif, the designer's call). The resulting
contract is recorded in `DESIGN.md`.

## Deploy

Same flow as carlosframework.com, adapted for the build step — ship the
built `_site/` of a clean `git archive` export, never the repo tree:

- App `rastrillo`, `-kind static`, bucket mode
  (`CARLOS_DEPLOYMENT_BUCKET=carlos-flagship-271376211898`,
  `AWS_PROFILE=keymail`), promote to `canary/rehearsal`.
- Registry-mode `carlos add` routes for `rastrillo.org` and
  `www.rastrillo.org` on the flagship box (`i-092c0c1eea75723cb`, SSM).
- DNS A records for apex + www → flagship `99.81.104.219`.
  **rastrillo.org was unregistered as of 2026-08-06 (NXDOMAIN)** —
  registration (DNSimple, auto-renew, whois privacy, like oncarlos.com)
  is part of the go-live work.
- Runbook lives in this repo's CLAUDE.md; rollback is a channel-pointer
  move.

## Verification

- `npm run build` must pass; CI workflow builds on PR.
- Internal anchors on the built page resolve; external proof links curl
  200 before ship.
- Impeccable finish-review gates the visual result.
- After go-live: `https://rastrillo.org` and `https://www.rastrillo.org`
  serve the site with valid certificates.

## Out of scope

- Subpages, docs, blog.
- The carlosframework.com `/rastrillo` redirect (follow-up PR to
  `carlosframework/website`).
- A `stable` channel flip (optional cleanup, mirrors the carlos site).
