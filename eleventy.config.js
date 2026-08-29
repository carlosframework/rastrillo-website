// 🤖 Build-time only — the served site ships no JavaScript.
import markdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";

// slugify must match internal/docsite's Anchor in the rastrillo repo
// exactly, or an internal fragment link passes that repo's Go gate and
// 404s in a browser. Both sides are deliberately plain — lowercase
// alphanumerics, everything else a separator — because
// markdown-it-anchor's own default URI-encodes punctuation, which would
// anchor a heading naming `db.Open` differently on each side.
// hack/check-anchors.mjs compares the two against a fixture.
export function slugify(text) {
  let out = "";
  let pendingSep = false;
  for (const ch of String(text).toLowerCase()) {
    if ((ch >= "a" && ch <= "z") || (ch >= "0" && ch <= "9")) {
      if (pendingSep && out.length > 0) out += "-";
      pendingSep = false;
      out += ch;
    } else {
      pendingSep = true;
    }
  }
  return out;
}

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/site.css": "site.css" });
  // The design-system tree (vendored by hack/sync-docs.mjs) is finished
  // static HTML — copy it through untouched, and keep Eleventy from
  // treating its .html files as input templates.
  eleventyConfig.addPassthroughCopy({ "src/design-system": "design-system" });
  eleventyConfig.ignores.add("src/design-system/**");
  eleventyConfig.addPassthroughCopy({ "src/favicon.svg": "favicon.svg" });

  const md = markdownIt({ html: true, linkify: false, typographer: false }).use(
    markdownItAnchor,
    { slugify, level: [2, 3, 4], tabIndex: false },
  );
  eleventyConfig.setLibrary("md", md);

  // The docs corpus is vendored from the rastrillo repo by
  // hack/sync-docs.mjs. Pages are addressed by slug — "migrations",
  // "reference/db" — which is also how nav.json and every internal
  // /docs link name them.
  eleventyConfig.addCollection("docs", (api) =>
    api
      .getFilteredByGlob("src/docs/**/*.md")
      .map((page) => {
        const slug = page.filePathStem.replace(/^\/docs\//, "");
        return { slug, page };
      })
      .filter(({ slug }) => slug !== "index"),
  );

  // The /docs index page's own prose, as its own collection.
  //
  // docs-index.njk renders this page's content above the cards. It must
  // NOT reach for collections.all to find it: that collection contains
  // docs-index.njk itself, and Eleventy rejects a template that reads
  // templateContent from a collection it belongs to as a circular
  // reference. A one-page collection it is not a member of is the way
  // to read another template's rendered output.
  eleventyConfig.addCollection("docsIndex", (api) =>
    api.getFilteredByGlob("src/docs/index.md"),
  );

  // Section headings of one page, for the sidebar's sub-nav. Read from
  // the source rather than the rendered HTML so it needs no DOM.
  eleventyConfig.addFilter("docsSections", (raw) => {
    const out = [];
    let inFence = false;
    for (const line of String(raw).split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) {
        inFence = !inFence;
        continue;
      }
      if (inFence) continue;
      const m = /^##\s+(.+?)\s*#*$/.exec(trimmed);
      if (m) out.push({ title: m[1], anchor: slugify(m[1]) });
    }
    return out;
  });

  eleventyConfig.addFilter("docsSlugify", slugify);

  // A page's own "# " title. The vendored markdown carries no front
  // matter — it is the framework repo's file, byte for byte — so the
  // title is read from the source rather than declared twice.
  eleventyConfig.addFilter("docsTitle", (raw) => {
    for (const line of String(raw).split("\n")) {
      const m = /^#\s+(.+?)\s*#*$/.exec(line);
      if (m) return m[1].replace(/^🤖\s*/, "");
    }
    return "";
  });

  // A page's raw markdown, looked up from the collection by slug.
  //
  // NOT passed through eleventyComputed: a computed value in Nunjucks
  // front matter is a string interpolation, which HTML-escapes it, and
  // an escaped apostrophe turns "rastrillo's" into "rastrillo-39-s" in
  // every anchor derived from it. The headings themselves are fine —
  // markdown-it-anchor reads the raw token — so the result was a
  // sub-nav whose links pointed at ids no page had.
  eleventyConfig.addFilter("docsRawFor", (docs, slug) => {
    for (const doc of docs) {
      if (doc.slug === slug) return doc.page.rawInput;
    }
    return "";
  });

  // A page's one-line blurb, from nav.json — the same string the /docs
  // index renders on its card, reused as the meta description so the
  // two cannot drift.
  eleventyConfig.addFilter("docsBlurb", (nav, slug) => {
    for (const section of nav.sections) {
      for (const entry of section.pages) {
        if (entry.slug === slug) return entry.blurb;
      }
    }
    return "";
  });

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
  };
}
