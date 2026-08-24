// 🤖 Directory data for the vendored docs corpus.
//
// The pages under src/docs are the framework repo's markdown, byte for
// byte — content, not templates. Without this override Eleventy runs
// each one through Nunjucks BEFORE markdown, and Nunjucks evaluates
// any {{ ... }} it finds. Rastrillo's docs are full of Go template
// syntax, so `{{template "badge" ...}}` and `{{.Dir}}` were being
// evaluated to nothing and shipped as EMPTY code blocks — silently,
// and worst on templates.md, the page about Go templates.
//
// Nothing here is authored for Eleventy, so there is nothing to lose
// by turning the pre-pass off: "md" means render as markdown only.
//
// The gates did not catch this. The framework's six docsite tests read
// the source markdown, and this repo's check-docs.mjs counts pages and
// compares anchors — neither compares rendered content against source,
// which is the only check that would have seen it. check-fences.mjs
// now does exactly that.
export default {
  templateEngineOverride: "md",
};
