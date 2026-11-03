// 🤖 Build-time rendering of the tour's code: one span per line, the
// step's changed lines marked, and a light colouring for the languages
// the tour uses. Nothing here runs in the browser.
//
// Each line is <span class="ln">…\n</span>, a block of its own, so a
// changed line can carry a full-width band and the <pre>'s textContent
// is still the file byte for byte (the "Copy file" button copies that).
//
// The colouring is deliberately small: keywords, strings and comments,
// the three the homepage's code samples colour. A token that spans
// lines (a raw string, a block comment) is closed at the end of each
// line and reopened on the next, so line spans never interleave with
// token spans.

const escapeHTML = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const words = (s) => new Set(s.split(/\s+/).filter(Boolean));

// Per language: line comments, block comments, string delimiters, and
// keywords. Anything not listed renders plain.
const LANGUAGES = {
  go: {
    line: ["//"],
    block: [["/*", "*/"]],
    strings: ['"', "'", "`"],
    keywords: words(`break case chan const continue default defer else
      fallthrough for func go goto if import interface map package range
      return select struct switch type var nil true false iota
      any bool byte error float32 float64 int int8 int16 int32 int64 rune
      string uint uint8 uint16 uint32 uint64 uintptr`),
  },
  sql: {
    line: ["--"],
    block: [["/*", "*/"]],
    strings: ["'"],
    keywords: words(`select from where insert into values update set delete
      create table index unique primary key not null default references
      on cascade drop alter add column integer text datetime blob real
      order by limit and or as if exists join left inner group having
      begin commit returning current_timestamp`),
    caseless: true,
  },
  sh: {
    line: ["#"],
    block: [],
    strings: ['"', "'"],
    keywords: words(`cd export if then fi for do done in case esac`),
  },
  toml: { line: ["#"], block: [], strings: ['"', "'"], keywords: words("true false") },
  yaml: { line: ["#"], block: [], strings: ['"', "'"], keywords: words("true false null") },
  html: { line: [], block: [["<!--", "-->"], ["{{/*", "*/}}"]], strings: ['"'], keywords: new Set() },
  css: { line: [], block: [["/*", "*/"]], strings: ['"', "'"], keywords: new Set() },
  js: {
    line: ["//"],
    block: [["/*", "*/"]],
    strings: ['"', "'", "`"],
    keywords: words(`const let var function return if else for while of in
      new class import export from default async await true false null
      undefined this`),
  },
};
const ALIASES = { bash: "sh", shell: "sh", gohtml: "html", tmpl: "html", javascript: "js", mjs: "js" };

function language(name) {
  const key = String(name ?? "").toLowerCase();
  return LANGUAGES[ALIASES[key] ?? key];
}

// Splits source into [class, text] tokens; class is "" for plain text,
// "k" keyword, "s" string, "c" comment (the homepage's class names).
function tokenize(src, lang) {
  if (!lang) return [["", src]];
  const tokens = [];
  let plain = "";
  const push = (cls, text) => {
    if (plain) tokens.push(["", plain]);
    plain = "";
    tokens.push([cls, text]);
  };
  let i = 0;
  outer: while (i < src.length) {
    for (const marker of lang.line) {
      if (src.startsWith(marker, i)) {
        const end = src.indexOf("\n", i);
        const stop = end === -1 ? src.length : end;
        push("c", src.slice(i, stop));
        i = stop;
        continue outer;
      }
    }
    for (const [open, close] of lang.block) {
      if (src.startsWith(open, i)) {
        const end = src.indexOf(close, i + open.length);
        const stop = end === -1 ? src.length : end + close.length;
        push("c", src.slice(i, stop));
        i = stop;
        continue outer;
      }
    }
    const ch = src[i];
    if (lang.strings.includes(ch)) {
      let j = i + 1;
      // Backquoted strings are raw in Go and JS templates; the others
      // honour backslash escapes and, except for JS templates, end at
      // a newline so one stray quote cannot colour the rest of a file.
      while (j < src.length && src[j] !== ch) {
        if (ch !== "`" && src[j] === "\\") j++;
        else if (ch !== "`" && src[j] === "\n") break;
        j++;
      }
      push("s", src.slice(i, Math.min(j + 1, src.length)));
      i = j + 1;
      continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      let j = i + 1;
      while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++;
      const word = src.slice(i, j);
      const key = lang.caseless ? word.toLowerCase() : word;
      if (lang.keywords.has(key)) push("k", word);
      else plain += word;
      i = j;
      continue;
    }
    plain += ch;
    i++;
  }
  if (plain) tokens.push(["", plain]);
  return tokens;
}

// Whether 1-based line n falls in one of the inclusive ranges.
const inRanges = (n, ranges) => ranges.some(([first, last]) => n >= first && n <= last);

// The <pre>'s inner HTML for one file of a step.
export function renderCode(file) {
  const content = String(file.content ?? "");
  const ranges = Array.isArray(file.changed) ? file.changed : [];
  const lines = [[]];
  for (const [cls, text] of tokenize(content, language(file.language))) {
    const parts = text.split("\n");
    parts.forEach((part, k) => {
      if (k > 0) lines.push([]);
      if (part) lines[lines.length - 1].push([cls, part]);
    });
  }
  // A file that ends in a newline leaves one empty entry after it; that
  // newline belongs to the last real line, not to a line of its own.
  const endsWithNewline = content.endsWith("\n");
  if (endsWithNewline) lines.pop();
  return lines
    .map((tokens, index) => {
      const n = index + 1;
      const body = tokens
        .map(([cls, text]) => (cls ? `<span class="${cls}">${escapeHTML(text)}</span>` : escapeHTML(text)))
        .join("");
      const last = index === lines.length - 1;
      const newline = last && !endsWithNewline ? "" : "\n";
      const cls = inRanges(n, ranges) ? "ln hl" : "ln";
      return `<span class="${cls}">${body}${newline}</span>`;
    })
    .join("");
}
