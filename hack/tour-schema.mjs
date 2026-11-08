// 🤖 The shape of tour.json, as tourgen writes it and the tour pages
// read it. The schema itself is in the framework repo's design for the
// tour (docs/superpowers/specs/2026-11-03-chat-tour-design.md,
// "tour.json"); this is that schema as code, so a mismatch stops the
// build with a field name instead of rendering a blank page.
//
// Returns a list of problems; empty means the tour is usable.

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
// A zip is served from /tour/zips/<name>, so it must be a plain file
// name: no directories, nothing that climbs out.
const ZIP = /^[A-Za-z0-9][A-Za-z0-9._-]*\.zip$/;

const isText = (v) => typeof v === "string" && v.trim() !== "";

export function validateTour(tour) {
  const problems = [];
  const fail = (m) => problems.push(m);
  if (typeof tour !== "object" || tour === null) return ["the tour is not an object"];
  if (!SLUG.test(tour.slug ?? "")) fail(`slug ${JSON.stringify(tour.slug)} is not a lowercase slug`);
  if (!isText(tour.title)) fail("title is missing");
  if (!isText(tour.version)) fail("version is missing");
  if (!Array.isArray(tour.steps) || tour.steps.length === 0) {
    fail("steps is missing or empty");
    return problems;
  }
  const zips = new Set();
  tour.steps.forEach((step, i) => {
    const at = `step ${i + 1}`;
    if (step.number !== i + 1) fail(`${at}: number is ${step.number}, expected ${i + 1}`);
    if (!SLUG.test(step.slug ?? "")) fail(`${at}: slug ${JSON.stringify(step.slug)} is not a lowercase slug`);
    if (!isText(step.title)) fail(`${at}: title is missing`);
    if (!isText(step.lesson)) fail(`${at}: lesson is missing`);
    if (step.check !== undefined && typeof step.check !== "string") fail(`${at}: check is not a string`);
    if (!Array.isArray(step.commands) || !step.commands.every(isText)) {
      fail(`${at}: commands must be a list of strings`);
    }
    if (step.zip === undefined) { /* a step before the app exists has none */ }
    else if (!ZIP.test(step.zip)) fail(`${at}: zip ${JSON.stringify(step.zip)} is not a plain .zip file name`);
    else if (zips.has(step.zip)) fail(`${at}: zip ${step.zip} is used by an earlier step`);
    else zips.add(step.zip);
    if (!Array.isArray(step.files)) {
      fail(`${at}: files must be a list`);
      return;
    }
    const paths = new Set();
    step.files.forEach((file, j) => {
      const where = `${at}, file ${j + 1}`;
      if (!isText(file.path) || file.path.startsWith("/") || file.path.split("/").includes("..")) {
        fail(`${where}: path ${JSON.stringify(file.path)} is not a relative path`);
      } else if (paths.has(file.path)) {
        fail(`${where}: ${file.path} appears twice`);
      } else {
        paths.add(file.path);
      }
      if (file.status !== "new" && file.status !== "edit") {
        fail(`${where}: status ${JSON.stringify(file.status)} is not "new" or "edit"`);
      }
      if (typeof file.language !== "string") fail(`${where}: language is missing`);
      if (typeof file.content !== "string") {
        fail(`${where}: content is missing`);
        return;
      }
      const lines = file.content.replace(/\n$/, "").split("\n").length;
      if (!Array.isArray(file.changed)) {
        fail(`${where}: changed must be a list of [first, last] line ranges`);
        return;
      }
      for (const range of file.changed) {
        const ok =
          Array.isArray(range) &&
          range.length === 2 &&
          Number.isInteger(range[0]) &&
          Number.isInteger(range[1]) &&
          range[0] >= 1 &&
          range[0] <= range[1] &&
          range[1] <= lines;
        if (!ok) fail(`${where}: changed range ${JSON.stringify(range)} is not within lines 1–${lines}`);
      }
    });
  });
  return problems;
}
