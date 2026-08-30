// 🤖 Fails the build when the built docs site is internally broken.
//
// The rastrillo repo gates the corpus as markdown: nav and files agree,
// links resolve, anchors exist, symbols are covered. This checks what
// that cannot — that the rendering actually produced the pages and ids
// those links point at. A link can be correct in the source and still
// 404 in a browser if the renderer disagrees with the gate about how a
// heading becomes an anchor, which is exactly the failure worth
// catching here.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const site = "_site";
const docs = join(site, "docs");
const nav = JSON.parse(readFileSync("src/_data/docsnav.json", "utf8"));

const problems = [];
const fail = (m) => problems.push(m);

// Filled in by the design-system block below, for the success line.
let dsFiles = 0;
let dsThemes = 0;
let dsShort = "?";

const exists = (p) => {
  try {
    statSync(p);
    return true;
  } catch {
    return false;
  }
};

// The design-system gallery.
//
// This used to be a count: the tree was committed, the sync vendored it
// byte for byte, and a missing gallery was impossible. It is generated
// now — hack/gen-design-system.mjs runs the framework's dsgen at the
// pinned sha before Eleventy — and that buys a failure this repo has
// never had. A generator that dies quietly, or a build that reaches
// Eleventy first, publishes a site with no design system and no error;
// the pages that vanish are the ones nobody browses on the way to
// noticing. Nothing downstream would catch it, so this block is
// deliberately specific about what a whole gallery looks like.
{
  const src = "src/design-system";
  const out = join(site, "design-system");
  // Written by dsgen and by hack/gen-design-system.mjs respectively;
  // eleventy.config.js strips both from the built site.
  const STAMP = ".dsgen";
  const RECEIPT = ".dsgen-source.json";
  // One theme, one locale, rendered whole. Named rather than counted so
  // a half-generated gallery says which pages it is missing.
  const KINDS = [
    ["index.html", "Overview"],
    ["tokens.html", "Tokens"],
    ["getting-started.html", "Getting started"],
    ["icons.html", "Icons"],
    ["list-screen.html", "the List screen components"],
    ["display.html", "the Display components"],
    ["form.html", "the Form components"],
    ["date-and-time.html", "the Date and time components"],
    ["route.html", "the Route components"],
    ["primitives.html", "UI primitives"],
    ["shells.html", "Shells"],
    ["demo.html", "the demo app"],
    ["modal.html", "the modal"],
    [join("shells", "column.html"), "the column shell demo"],
    [join("shells", "sidebar.html"), "the sidebar shell demo"],
    [join("shells", "topbar.html"), "the topbar shell demo"],
  ];
  // Floors, not equalities: the framework ships three themes and twelve
  // locales today, and a build that suddenly renders one of each is a
  // broken build, not a design decision. If the framework really does
  // drop a theme or a language, change the number here on purpose.
  const MIN_THEMES = 3;
  const MIN_LOCALES = 12;

  // Files a browser would be served — dotfiles are build bookkeeping.
  const count = (dir) => {
    let n = 0;
    try {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith(".")) continue;
        n += entry.isDirectory() ? count(join(dir, entry.name)) : 1;
      }
    } catch {
      return -1;
    }
    return n;
  };
  const dirs = (dir) => {
    try {
      return readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isDirectory() && !e.name.startsWith("."))
        .map((e) => e.name)
        .sort();
    } catch {
      return [];
    }
  };

  // 1. The generator ran and owns the directory.
  if (!exists(join(src, STAMP))) {
    fail(
      `design-system: no ${STAMP} stamp at ${src} — the gallery was not generated. ` +
        `run: npm run gen-design-system`,
    );
  }

  // 2. It generated the version the prose was vendored from. The whole
  //    reason the sha is read from docsversion.json rather than pinned
  //    twice is that a gallery and a doc set describing different
  //    framework versions is a lie no reader can see.
  const version = JSON.parse(readFileSync("src/_data/docsversion.json", "utf8"));
  let receipt = null;
  try {
    receipt = JSON.parse(readFileSync(join(src, RECEIPT), "utf8"));
  } catch {
    fail(`design-system: no ${RECEIPT} at ${src} — cannot tell which sha the gallery came from`);
  }
  if (receipt) {
    if (receipt.sha !== version.sha) {
      fail(
        `design-system: generated from ${receipt.short ?? receipt.sha}, but the docs are ` +
          `vendored from ${version.short ?? version.sha} — regenerate: npm run gen-design-system`,
      );
    }
    if (receipt.mount !== "/design-system") {
      fail(
        `design-system: generated for mount ${JSON.stringify(receipt.mount)}, but the site ` +
          `serves it at /design-system — every link in the tree would be wrong`,
      );
    }
  }

  // 3. The built site carries all of it, and none of the bookkeeping.
  const want = count(src);
  const got = count(out);
  if (want < 1) fail(`design-system: nothing to publish at ${src}`);
  else if (got !== want) fail(`design-system: built ${got} files, generated ${want}`);
  if (receipt && receipt.files !== want) {
    fail(`design-system: ${RECEIPT} claims ${receipt.files} files, ${src} holds ${want}`);
  }
  for (const name of [STAMP, RECEIPT]) {
    if (exists(join(out, name))) fail(`design-system: ${name} was published to the built site`);
  }
  if (!exists(join(out, "index.html"))) fail("design-system: no index.html in the built site");
  if (!exists(join(out, "tokens.css"))) fail("design-system: no tokens.css in the built site");

  // 4. Every theme, every locale, every page kind. This is the check
  //    that turns "the tree silently didn't generate" from a deploy into
  //    a red build: a gallery missing one theme, one language or one
  //    page still looks like a gallery from the outside.
  const themes = dirs(out);
  dsFiles = got;
  dsThemes = themes.length;
  dsShort = receipt?.short ?? "?";
  if (themes.length < MIN_THEMES) {
    fail(`design-system: ${themes.length} theme(s) in the built site (${themes.join(", ") || "none"}), want at least ${MIN_THEMES}`);
  }
  for (const theme of themes) {
    if (!exists(join(out, `theme-${theme}.css`))) fail(`design-system: no theme-${theme}.css for theme ${theme}`);
    const locales = dirs(join(out, theme));
    if (locales.length < MIN_LOCALES) {
      fail(`design-system: theme ${theme} has ${locales.length} locale(s), want at least ${MIN_LOCALES}`);
    }
    if (!locales.includes("en")) fail(`design-system: theme ${theme} has no en locale`);
    for (const locale of locales) {
      for (const [file, label] of KINDS) {
        if (!exists(join(out, theme, locale, file))) {
          fail(`design-system: ${theme}/${locale} is missing ${label} (${file})`);
        }
      }
    }
  }

  // 5. The mount is really the mount. dsgen writes absolute URLs under
  //    -mount into every page, so a tree generated for the wrong path
  //    passes every check above and 404s on the first click.
  if (exists(join(out, "index.html"))) {
    const home = readFileSync(join(out, "index.html"), "utf8");
    if (!home.includes('href="/design-system/')) {
      fail("design-system: the built index.html carries no /design-system/ links — wrong -mount?");
    }
  }
}

function walk(dir, match) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p, match));
    else if (match(entry.name)) out.push(p);
  }
  return out;
}

// 1. Every nav entry has a built page and a built .md twin.
const slugs = [];
for (const section of nav.sections) {
  for (const entry of section.pages) {
    slugs.push(entry.slug);
    if (!exists(join(docs, entry.slug, "index.html"))) fail(`no built page for /docs/${entry.slug}/`);
    if (!exists(join(docs, `${entry.slug}.md`))) fail(`no markdown twin for /docs/${entry.slug}.md`);
    if (!entry.blurb) fail(`nav entry ${entry.slug} has no blurb`);
    if (!entry.label) fail(`nav entry ${entry.slug} has no label`);
  }
}
if (!exists(join(docs, "index.html"))) fail("no built /docs/ index");

// 2. Every internal href resolves — to a built page, and to a real id
//    when it carries a fragment.
const pages = walk(docs, (n) => n.endsWith(".html"));
if (pages.length === 0) fail("no built docs pages at all");

const idsFor = new Map();
for (const p of pages) {
  const html = readFileSync(p, "utf8");
  idsFor.set(p, new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1])));
}

const pageFor = (href) => {
  const clean = href.replace(/[?#].*$/, "");
  if (!clean.startsWith("/docs")) return null;
  const rel = clean.replace(/^\/docs\/?/, "").replace(/\/$/, "");
  if (rel === "" ) return join(docs, "index.html");
  if (rel.endsWith(".md")) return join(docs, rel);
  return join(docs, rel, "index.html");
};

for (const p of pages) {
  const html = readFileSync(p, "utf8");
  const where = relative(site, p);
  for (const m of html.matchAll(/href="(\/docs[^"]*)"/g)) {
    const href = m[1];
    const target = pageFor(href);
    if (!target || !exists(target)) {
      fail(`${where}: href="${href}" does not resolve to a built file`);
      continue;
    }
    const hash = href.includes("#") ? href.split("#")[1] : "";
    if (hash && !(idsFor.get(target) ?? new Set()).has(hash)) {
      fail(`${where}: href="${href}" — ${relative(site, target)} has no id="${hash}"`);
    }
  }
  // Same-page fragments.
  const ids = idsFor.get(p);
  for (const m of html.matchAll(/href="#([^"]+)"/g)) {
    if (!ids.has(m[1])) fail(`${where}: href="#${m[1]}" has no matching id`);
  }
}

// 3. The anchor rule agrees on both sides. The Go gate accepted these
//    fragments; if the renderer slugifies differently, they are dead
//    links that no earlier check can see.
const { slugify } = await import("../eleventy.config.js");
const fixture = {
  "Getting started": "getting-started",
  "The `db.Open` contract": "the-db-open-contract",
  "404, never 403": "404-never-403",
  "Sessions & identity": "sessions-identity",
  "  Leading and trailing  ": "leading-and-trailing",
  "Hyphen-joined words": "hyphen-joined-words",
  "`--allow-destructive`": "allow-destructive",
};
for (const [input, want] of Object.entries(fixture)) {
  const got = slugify(input);
  if (got !== want) fail(`slugify(${JSON.stringify(input)}) = ${JSON.stringify(got)}, want ${JSON.stringify(want)} — the renderer and internal/docsite.Anchor disagree`);
}

if (problems.length) {
  console.error(`docs check failed (${problems.length}):`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log(
  `docs ok — ${slugs.length} pages, ${pages.length} built, anchors agree; ` +
    `design-system: ${dsFiles} files across ${dsThemes} themes generated from ${dsShort}`,
);
