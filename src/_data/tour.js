// 🤖 The tour, as hack/gen-tour.mjs left it in _tour/tour.json, with
// the few things every page needs worked out once: each step's URL,
// its neighbours, and a short name for each file's tab.
//
// No fallback when the file is missing. A site that quietly builds
// without its tour is the failure gen-tour.mjs exists to prevent, so
// the build stops here with the command that fixes it.
import { readFileSync } from "node:fs";
import { basename } from "node:path";

const SOURCE = "_tour/tour.json";

export default function () {
  let tour;
  try {
    tour = JSON.parse(readFileSync(SOURCE, "utf8"));
  } catch (err) {
    throw new Error(
      `${SOURCE} is missing or unreadable (${err.message}). ` +
        "Run `node hack/gen-tour.mjs` (or `--from test/fixtures/tour`) first; " +
        "`npm run build` does this for you.",
    );
  }
  const total = tour.steps.length;
  const steps = tour.steps.map((step) => {
    const nn = String(step.number).padStart(2, "0");
    return {
      ...step,
      nn,
      url: `/tour/${tour.slug}/${nn}-${step.slug}/`,
      zipUrl: `/tour/zips/${step.zip}`,
      files: step.files.map((file, i) => ({
        ...file,
        name: basename(file.path),
        id: `file-${i + 1}`,
      })),
    };
  });
  steps.forEach((step, i) => {
    step.prev = steps[i - 1] ? { url: steps[i - 1].url, title: steps[i - 1].title } : null;
    step.next = steps[i + 1] ? { url: steps[i + 1].url, title: steps[i + 1].title } : null;
  });
  return { ...tour, total, steps };
}
