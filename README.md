# 🤖 rastrillo.org

The marketing site for **Rastrillo**, the CARLOS web framework
(`rastrilloorg/rastrillo`). One meaty landing page: what a manifest
buys you, why generated-not-interpreted matters, and a try-it-now path
from `go install` to a deployed app.

Built with [Eleventy](https://www.11ty.dev/) — the build step runs here,
at authoring time. The *served* site stays true to the family rules:
static files, no client-side JavaScript, no fonts fetched from anywhere,
no analytics.

## Working here

Read [`AGENTS.md`](AGENTS.md) first — it carries the 🤖/👨 authorship
rule (AI-written prose is always visibly marked), the accuracy rules
(claims trace to the rastrillo repo, not to previous copy), and the
deploy runbook.

```
npm install
npm run serve    # local preview at localhost:8080
npm run build    # writes _site/
npm run check    # build, then the three gates
```

You need **Go 1.25+** alongside Node. The `/design-system` gallery is
not committed here: it is 20 MB of machine output, rendered on every
build by the framework's own `dsgen` command at the sha in
`src/_data/docsversion.json`. `AGENTS.md` has the details, including
what stops a build that fails to generate it.

## Deploying

The site runs on the CARLOS flagship as app `rastrillo` — the same
`ship`/`promote`/`add` sequence as carlosframework.com. See
[`AGENTS.md`](AGENTS.md) for the runbook.

## Provenance

Written by an LLM (Claude), on the ideas, instruction, and editing of
humans. Rastrillo builds apps that keep the promises set out in
[The Eleven Factors](https://11factor.org).

## License

[MIT](LICENSE).
