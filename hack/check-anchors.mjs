// 🤖 Fails the build when an in-page href="#x" has no matching id="x".
import { readFileSync } from "node:fs";
const html = readFileSync(process.argv[2], "utf8");
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
const missing = [...html.matchAll(/\bhref="#([^"]+)"/g)]
  .map((m) => m[1])
  .filter((a) => !ids.has(a));
if (missing.length) {
  console.error(`broken anchors: ${missing.join(", ")}`);
  process.exit(1);
}
console.log("anchors ok");
