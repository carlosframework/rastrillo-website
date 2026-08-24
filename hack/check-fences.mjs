// 🤖 Gate: a rendered code fence must still contain what the source said.
//
// The bug this exists for: Eleventy ran the vendored docs through
// Nunjucks before markdown, so every {{ ... }} in a code fence was
// evaluated and vanished. Rastrillo's docs are full of Go template
// syntax, so `{{template "badge" ...}}` shipped as an EMPTY code block
// — live, for as long as the docs have been up.
//
// Neither existing gate could see it. The framework's docsite tests read
// the SOURCE markdown; this repo's check-docs.mjs counts pages and
// compares anchors. Nothing compared rendered output to source, which is
// the only place the loss was visible.
//
// Two checks, both cheap:
//   1. no rendered <pre><code> is empty when its source fence was not;
//   2. every source fence line containing {{ survives into the page.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const SRC = "src/docs";
const OUT = "_site/docs";

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.name.endsWith(".md")) out.push(p);
  }
  return out;
}

// The fenced blocks of one markdown source, as arrays of lines.
function fences(src) {
  const out = [];
  let cur = null;
  for (const line of src.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) {
      if (cur) { out.push(cur); cur = null; } else cur = [];
      continue;
    }
    if (cur) cur.push(line);
  }
  return out;
}

// markdown-it's escapeHtml escapes & < > " and leaves the apostrophe
// alone. Escaping ' here too produced a false positive on a shell
// snippet — match the renderer, not a general-purpose escaper.
const escape = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
   .replace(/"/g, "&quot;");

let problems = 0;
for (const file of walk(SRC)) {
  const slug = file.slice(SRC.length + 1).replace(/\.md$/, "");
  const page = slug === "index" ? join(OUT, "index.html")
                                : join(OUT, slug, "index.html");
  let html;
  try { html = readFileSync(page, "utf8"); } catch { continue; }

  // 1. an empty rendered block where the source had content
  const rendered = [...html.matchAll(/<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/g)]
    .map((m) => m[1].trim());
  const sourceBlocks = fences(readFileSync(file, "utf8"))
    .map((l) => l.join("\n").trim())
    .filter((b) => b !== "");
  const emptyRendered = rendered.filter((b) => b === "").length;
  if (emptyRendered > 0 && sourceBlocks.length > 0) {
    console.error(`${file}: ${emptyRendered} rendered code block(s) are empty`);
    problems += emptyRendered;
  }

  // 2. template syntax must survive verbatim
  for (const block of sourceBlocks) {
    for (const line of block.split("\n")) {
      if (!line.includes("{{")) continue;
      if (!html.includes(escape(line.trim()))) {
        console.error(`${file}: template syntax lost from the page: ${line.trim()}`);
        problems++;
      }
    }
  }
}

if (problems) {
  console.error(`fences FAILED — ${problems} problem(s)`);
  process.exit(1);
}
console.log("fences ok — rendered code blocks match their source");
