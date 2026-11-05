# 🤖 AGENTS.md

Working notes for anyone (human or agent) changing this repo.

## What this is

The website for **Rastrillo** — the CARLOS web framework
(`rastrilloorg/rastrillo`) — served at `rastrillo.org`. One landing
page, marketing-led but claim-backed, with a try-it-now path front and
centre.

The site is built with **Eleventy** (Nunjucks templates in `src/`,
output in `_site/`). The build step exists for the author, not the
visitor: the *served* output is static files, with nothing fetched from
another origin and no analytics. Keep it that way. The homepage
(`src/index.njk`, `src/home.css`, `src/home.js`) is one hand-built page:
its copy is the owner's, edited directly in the template.
`src/SKILL.md` is the framework's SKILL.md at the docs' sha, published at
`/SKILL.md` because the homepage tells agents to read it; refresh it
whenever you re-sync the docs.

## The one rule: AI authorship is always marked (🤖 / 👨)

This repo practices factor X on itself. Every piece of prose carries an
authorship marker so a reader — human or agent — can tell who wrote what,
and so a human can fence text off from AI rewriting.

Exception (owner's decision, 2026-10-22): the homepage carries no 🤖
marker. Its copy was written or rewritten line by line by the owner. The
docs pages keep their markers.

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

- **Static output, no third parties.** No frameworks in the browser, no
  request to any other origin, no analytics. Fonts are self-hosted under
  `src/fonts/` (OFL, licences alongside). The homepage ships one script,
  `/home.js`, which only adds motion and conveniences (the flags, the
  raked furrows, the de-jank frame, copy buttons, pinned tabs): every
  section must read completely with it off, and under
  `prefers-reduced-motion` it shows final states. The docs ship none.
  Eleventy and its node_modules never appear in the shipped artifact —
  only `_site/` ships.
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

## The design system is generated, not vendored

🤖 `/design-system` — the gallery of every partial, class idiom and
token, in three themes and twelve languages — is 369 files and 20 MB.
It is **not in this repo**. `src/design-system/` is gitignored and
rebuilt on every `npm run build` by `hack/gen-design-system.mjs`, which
shells out to the framework's own generator:

```
go run github.com/carlosframework/rastrillo/cmd/dsgen@<sha> \
    -out src/design-system -mount /design-system
```

`go run …@<sha>` resolves an unreleased commit through
`proxy.golang.org`, including the module path's redirect from
`carlosframework/rastrillo` to the public `rastrilloorg/rastrillo` —
measured cold at ~24s, warm at ~1s. If that ever stops working (a
rename undone, a private module, an offline build), the fallback is a
framework checkout at the same sha and `go run ./cmd/dsgen` with the
same two flags; the output is byte-identical.

The sha is read from `src/_data/docsversion.json` — the same commit
`hack/sync-docs.mjs` vendored the 49 markdown pages from. That is the
point of reading it from there rather than pinning it twice: the gallery
and the prose beside it can never end up describing different versions
of the framework. To move both, re-sync the docs from a newer rastrillo
checkout and rebuild; the sha follows.

**So building this site needs Go 1.25+ and network access**, not just
Node. It also brings the one failure this repo never used to have: a
generator that dies quietly, or an Eleventy run that beats it, publishes
a site with no design system and no error. `npm run check` is what
catches that — `hack/check-docs.mjs` fails unless the generator's
`.dsgen` stamp is there, the sha it recorded matches the docs' sha, and
every theme, locale and page kind arrived in `_site`. Don't weaken it.

## Accuracy rules (these matter more than the prose)

- **Don't overclaim the framework's maturity.** Rastrillo is a young
  framework: the core loop (new/generate/dev/Run/Serve), localization,
  the ui component vocabulary, the manifest system (Resource → store/
  actions/screens/locale keys, filters, Required, delete flows), and
  the v0.6.0 subsystem packages (crypto, auth, webauthn, eventlog,
  blobs, mail, agents/tools — landed 2026-08-18) are real. Still not
  built: richer manifest kinds and derived fields, mergeable manifest
  wiring and edge sync, step-up auth, invite derivation. The homepage's
  feature list names only what is built; add to it when the work lands,
  not before.
- **Every technical claim traces to `rastrilloorg/rastrillo`** — its
  README, its code, its examples. If you change a claim, check it against
  the repo rather than against the previous copy. The homepage's
  `actions/` tree is real files from `examples/blog`, and its markup
  window is the design system's real markup rendered by the site's own
  `/design-system/*.css`; when either changes shape, the page follows.
- **The live-proof link must actually be live.** Before shipping a change
  that touches it, curl the URL.
- **Rastrillo is the framework; CARLOS is the architecture and platform.**
  Don't blur them: rastrillo builds apps, the platform runs them.

## Deploying

🤖 The site is the console app `rastrillo` in account `ops` (sqid `bab`)
on `https://console.carloku.com`, claimed on 2026-11-05 over the routes
that were filed by hand under the operator. It deploys like
carlosframework.com: `carlos deploy` through the console API, with no
AWS profile, deployment bucket or release key. It is moving to its own
account, `rastrillo` (`bfu`), once the platform can run `carlos accounts
migrate` for it; when that lands, `--account ops` below becomes
`--account rastrillo`.

**This repo has a build step, so never ship the repo tree.** Ship the
built `_site/` of a clean export of the merged commit, and keep scratch
on disk under `~/.cache`, not the shared `/tmp` RAM disk:

```
sha=$(git rev-parse --short origin/main)
dir=$(mktemp -d "$HOME/.cache/rastrillo-ship.XXXXXX")
git archive origin/main | tar -x -C "$dir"
cd "$dir" && npm ci && npm run check
carlos deploy --console https://console.carloku.com --account ops \
  --app rastrillo --kind static --channel canary/rehearsal \
  --version "$sha" --no-prompt _site
cd ~ && rm -rf "$dir"
```

The export carries no `src/design-system/`: the gallery is generated,
not committed (above), so whatever runs it needs **Go on `PATH` and
network access to `proxy.golang.org`** as well as Node. `npm run check`
renders the gallery first and refuses to pass if it is missing or
partial, so a green check on the export is a complete `_site`.

`carlos deploy` ships, promotes and watches the platform host
(`rastrillo.bab.oncarlos.com`). A static route re-checks its channel
about every 60 seconds, so the custom hostnames can lag that long. Verify
both, by header and then by content:

```
for h in rastrillo.org www.rastrillo.org; do
  curl -sI https://$h/docs/ | grep -i x-carlos-version
done
curl -s https://rastrillo.org | grep -i "<something from the change>"
carlos channels --console https://console.carloku.com --account ops --app rastrillo
```

The apex can serve the new sha a little after `www` does: poll it before
concluding a deploy failed.

`rastrillo.org` and `www.rastrillo.org` are routes on the same app and
channel. The channel is `canary/rehearsal` for the same reason
carlosframework.com's is: `stable` bakes 72h on a box's first sighting of
a channel head. The routes' registry lives on the flagship box annie;
DNS for the apex points at another flagship box, which serves them from
annie's published edges file. Do not hand-edit routes or DNS for a
release.

Rollback is a pointer move: `carlos rollback --console
https://console.carloku.com --account ops --app rastrillo
canary/rehearsal`, or promote the previous good sha. Record the version
`carlos channels` shows before deploying so you know what to go back to.
