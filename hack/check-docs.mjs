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

// The design-system passthrough: the built site must carry the tree the
// sync vendored — same count, and the root index present. Content
// equality is the framework repo's gate; this catches a broken
// passthrough (the failure mode the Nunjucks bug taught us to fear).
{
  const src = "src/design-system";
  const out = join(site, "design-system");
  const count = (dir) => {
    let n = 0;
    try {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, entry.name);
        n += entry.isDirectory() ? count(p) : 1;
      }
    } catch {
      return -1;
    }
    return n;
  };
  const want = count(src);
  const got = count(out);
  if (want < 1) fail(`no vendored design-system tree at ${src}`);
  else if (got !== want) fail(`design-system: built ${got} files, vendored ${want}`);
  try {
    statSync(join(out, "index.html"));
  } catch {
    fail("design-system: no index.html in the built site");
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

const exists = (p) => {
  try {
    statSync(p);
    return true;
  } catch {
    return false;
  }
};

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
console.log(`docs ok — ${slugs.length} pages, ${pages.length} built, anchors agree`);
