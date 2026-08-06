// 🤖 Build-time only — the served site ships no JavaScript.
export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/site.css": "site.css" });
  eleventyConfig.addPassthroughCopy({ "src/favicon.svg": "favicon.svg" });
  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
  };
}
