# 🤖 CLAUDE.md

Working notes for anyone (human or agent) changing this repo.

## What this is

The website for **Rastrillo** — the CARLOS web framework
(`carlosframework/rastrillo`) — served at `rastrillo.org`. One landing
page, marketing-led but claim-backed, with a try-it-now path front and
centre.

The site is built with **Eleventy** (Nunjucks templates in `src/`,
output in `_site/`). The build step exists for the author, not the
visitor: the *served* output is static files with **zero client-side
JavaScript**, no external fonts, no analytics. Keep it that way. Content
that changes as the framework moves (the Built/Not-yet lists, the pillar
cards, the try-it steps) lives in `src/_data/` so status updates are
data edits, not template surgery.

## The one rule: AI authorship is always marked (🤖 / 👨)

This repo practices factor X on itself. Every piece of prose carries an
authorship marker so a reader — human or agent — can tell who wrote what,
and so a human can fence text off from AI rewriting.

- **🤖 — written by an LLM.** Always **visible**, immediately before the
  heading, paragraph, or section it applies to. A 🤖 on a heading **cascades**:
  it marks that heading and everything beneath it, down to the next marker of
  the same-or-higher level or a human-certified block. One 🤖 on a document's
  top heading marks the whole document. On the website, the marker must render
  visibly on the page — never hide it in a comment.
- **No marker — ambiguous.** Could be either. Never *assume* AI authorship;
  when you genuinely don't know, leave it unmarked.
- **A person emoji (👨 / 👤 / 🧑 …) — certified human, off-limits.** The text
  was written or vetted by a person. **An LLM must not rewrite, rephrase,
  condense, or delete it.** You may add new 🤖 prose nearby, but the human's
  words are fixed. In HTML/Markdown the person marker may hide in a comment
  (`<!-- 👨 -->`) so it doesn't render; the 🤖 marker must **never** be hidden.

Baseline: **everything in this repo was AI-written unless a block carries a
person marker.**

## Conventions

- **Static output, zero client dependencies.** No frameworks in the
  browser, no fonts fetched from anywhere, no analytics, no JavaScript
  shipped to the visitor. Eleventy and its node_modules never appear in
  the shipped artifact — only `_site/` ships.
- **Light and dark** via `prefers-color-scheme` — keep both working when
  touching styles.
- **Family resemblance, own identity.** Rastrillo shares the
  carlosframework.com family character (quiet, honest, hairline rules,
  visible 🤖 note) but carries its own design identity — its own accent,
  its own mark. A sibling, not a clone. The design contract from the
  build lives in `DESIGN.md` once the impeccable cycle records it.
- **The brandline links home.** The CARLOS / rastrillo breadcrumb at the
  top links to carlosframework.com — the two sites cross-reference, they
  don't duplicate each other.

## Accuracy rules (these matter more than the prose)

- **Don't overclaim the framework's maturity.** Rastrillo is a young
  framework: the core loop (new/generate/dev/Run/Serve), localization,
  the ui List-screen partials, and manifest slices 1–2 (Resource → four
  generated states, declared filters, Required validation) are real;
  Mergeable, blobs, crypto, WebAuthn, agents and the rest are designed
  but not built. The site says so, in its own Built/Not-yet section.
  Update that section when the work actually lands, not before.
- **Every technical claim traces to `carlosframework/rastrillo`** — its
  README, its code, its examples. If you change a claim, check it against
  the repo rather than against the previous copy. The manifest showcase
  on the page uses real code from `examples/tickets`; when the example
  changes shape, the page follows the example, never the reverse.
- **The live-proof link must actually be live.** Before shipping a change
  that touches it, curl the URL.
- **Rastrillo is the framework; CARLOS is the architecture and platform.**
  Don't blur them: rastrillo builds apps, the platform runs them.

## Deploying

The site runs on the **CARLOS flagship** as app `rastrillo` — the same
bucket-mode `ship`/`promote` + registry-mode `add` sequence as
carlosframework.com (whose runbook in `carlosframework/website`'s
CLAUDE.md is the canonical reference, alongside `ship-app.sh` /
`promote-app.sh` in `carlosframework/platform-infrastructure`).

The one difference: **this repo has a build step, so never ship the repo
tree.** Ship the built `_site/` of a clean export:

```
mkdir -p /tmp/rastrillo-ship
git archive <sha> --prefix=export/ | tar -x -C /tmp/rastrillo-ship
cd /tmp/rastrillo-ship/export && npm ci && npm run check

export AWS_PROFILE=keymail AWS_REGION=eu-west-1 \
       CARLOS_DEPLOYMENT_BUCKET=carlos-flagship-271376211898
carlos ship -app rastrillo -kind static -version <sha> _site
CARLOS_RELEASE_KEY=$(aws ssm get-parameter --name /carlos/release-key \
  --with-decryption --query Parameter.Value --output text) \
  carlos promote -app rastrillo <sha> canary/rehearsal
```

The env matters: without `CARLOS_DEPLOYMENT_BUCKET` the CLI goes through
the console API, where this app is not registered, and fails with "not
found". Routes (`carlos add`) are registry-mode: they run on the flagship
box itself (instance `i-092c0c1eea75723cb`, via SSM; env comes from
`/etc/carlos/host.env`, binary at `/opt/carlos/carlos`).

`rastrillo.org` and `www.rastrillo.org` are CARLOS routes on the same
app and channel; DNS `A` records point at the flagship
(`99.81.104.219`). The channel is `canary/rehearsal` for the same reason
carlosframework.com's is: `stable` bakes 72h on a box's first sighting
of a channel head, which would mean 72h of downtime for a
never-before-served route.

Rollback is a pointer move: promote the previous good sha back onto
`canary/rehearsal` and the edge swaps within a minute
(`carlos channels -app rastrillo` to see what's on the channel).
