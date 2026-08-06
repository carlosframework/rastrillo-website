---
name: rastrillo.org
description: The account book — a ledger-grammar landing page where declared lines balance against generated lines.
colors:
  page: "#fbfbf7"
  ink: "#1f242b"
  muted: "#57616c"
  ruling: "rgba(94, 128, 168, 0.28)"
  ruling-soft: "rgba(94, 128, 168, 0.16)"
  margin-red: "rgba(179, 64, 46, 0.5)"
  red-ink: "#9c3322"
  red-stamp: "#b3402e"
  cloth: "#17604a"
  cloth-deep: "#114938"
  cloth-soft: "rgba(23, 96, 74, 0.1)"
  paper-btn-ink: "#f6faf7"
typography:
  display:
    fontFamily: "Charter, Georgia, 'Times New Roman', serif"
    fontSize: "clamp(2.15rem, 5vw, 3.4rem)"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Charter, Georgia, 'Times New Roman', serif"
    fontSize: "clamp(1.5rem, 3.2vw, 1.95rem)"
    fontWeight: 700
    lineHeight: 1.22
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Charter, Georgia, 'Times New Roman', serif"
    fontSize: "1.05rem"
    fontWeight: 700
    lineHeight: 1.35
  body:
    fontFamily: "Charter, Georgia, 'Times New Roman', serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "0.78rem"
    fontWeight: 700
    letterSpacing: "0.14em"
  code:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "0.85rem"
    fontWeight: 400
    lineHeight: "1.5rem"
rounded:
  sm: "3px"
  md: "4px"
  lg: "6px"
spacing:
  flow: "1.1rem"
  gutter: "1.25rem"
  entry: "1.15rem"
  section: "3.4rem"
  hero: "4.5rem"
components:
  button-primary:
    backgroundColor: "{colors.cloth}"
    textColor: "{colors.paper-btn-ink}"
    rounded: "{rounded.sm}"
    padding: "0.72rem 1.5rem"
  button-primary-hover:
    backgroundColor: "{colors.cloth-deep}"
    textColor: "{colors.paper-btn-ink}"
  button-ghost:
    textColor: "{colors.cloth}"
    rounded: "{rounded.sm}"
    padding: "0.72rem 1.5rem"
  button-ghost-hover:
    textColor: "{colors.cloth-deep}"
  code-inline:
    backgroundColor: "{colors.cloth-soft}"
    rounded: "{rounded.sm}"
    padding: "0.08em 0.32em"
---

# 🤖 Design System: rastrillo.org

## Overview

**Creative North Star: "The Account Book"**

rastrillo.org is drawn as the audience's own artifact of audit: an accountant's ledger where declared lines balance against generated lines. The page is near-white paper ruled with blue feint lines; a single red margin rule runs down the book's gutter; prose is serif ink; every figure is set in tabular mono against a red-fenced cash column; totals carry the accountant's double rule; live proof is a red rubber stamp, pressed slightly askew. The dark theme is not a second design — it is the same book read under a banker's lamp: green-black cloth, pale ruling, the same grammar re-inked.

The system deliberately refuses the category default — the dark neon code-window hero — and every other piece of framework-marketing theater. It is flat, quiet, and evidentiary: the design's job is to make numbers legible and claims checkable. There is zero client JavaScript, no external font or asset request, and both themes hold WCAG AA contrast; the site obeys the framework's own rules, and the visual system must keep obeying them.

**Key Characteristics:**
- Ledger grammar: hairline blue-feint ruling for structure, one red margin rule, red-fenced number columns, double-ruled totals.
- Serif ink prose (Charter/Georgia) with tabular mono figures; the numbers are the argument.
- Two accent inks with strict jobs: auditor's red for evidence, bottle-green book cloth for actions.
- Flat paper — no shadows, no glows; depth is drawn with lines and faint tint fills.
- One authored motion (the stamp press), fully gated behind `@supports` and `prefers-reduced-motion`.
- Light and dark via `prefers-color-scheme`, with `:root[data-theme="light|dark"]` override hooks.

## Colors

Two inks on ruled paper: auditor's red and bottle-green book cloth, over a near-white page structured by translucent blue feint lines.

### Primary
- **Bottle-Green Book Cloth** (`cloth`, #17604a): the action ink. Links, the primary button fill, "Posted" column heads and tick marks, the favicon's rake handle. If it's green, you can click it or it's done.
- **Deep Cloth** (`cloth-deep`, #114938): hover state of links and the primary button; the primary button's border.
- **Cloth Wash** (`cloth-soft`, rgba(23, 96, 74, 0.1)): faint tint fill behind inline code and the robot-note. The only background fill in the system.

### Secondary
- **Auditor's Red — Stamp** (`red-stamp`, #b3402e): the rubber stamp's border and text, and the focus-visible outline. Loud red, reserved for proof and focus.
- **Auditor's Red — Ink** (`red-ink`, #9c3322): red annotations in text: the headline's double-underlined phrase, total rows, step numbers, column heads, the brandline's current-site name.
- **Margin Red** (`margin-red`, rgba(179, 64, 46, 0.5)): the page's fixed margin rule, the vertical fence on every cash column, and the hairline under column heads. Always a 1px (or 3px, for marginalia) rule, never a fill.

### Neutral
- **Page** (`page`, #fbfbf7): the paper. Sole page background.
- **Ink** (`ink`, #1f242b): body text and headings.
- **Muted** (`muted`, #57616c): ledes, epigraphs, captions, footer, pending items.
- **Ruling** (`ruling`, rgba(94, 128, 168, 0.28)): the blue feint line. All structural borders: section dividers, table row rules, code-block borders, ghost-button borders, list separators (in its softer form `ruling-soft`, rgba(94, 128, 168, 0.16), also the ruled-paper lines inside code blocks).
- **Paper Button Ink** (`paper-btn-ink`, #f6faf7): text on cloth fills.

### Dark theme ("under the banker's lamp")
Same roles, re-inked; the frontmatter carries light values, these are normative for dark (both the `prefers-color-scheme: dark` block and `:root[data-theme="dark"]`): page #131813, ink #e8ece7, muted #a2aea4, ruling rgba(128, 164, 152, 0.26), ruling-soft rgba(128, 164, 152, 0.14), margin-red rgba(224, 112, 90, 0.45), red-ink and red-stamp both #e0705a, cloth #6cc79c, cloth-deep #8ad8b2, cloth-soft rgba(108, 199, 156, 0.12), paper-btn-ink #0d130f. Note the ruling shifts from blue feint to pale green-grey — lamplight, not moonlight.

### Named Rules
**The Two Inks Rule.** Red is the auditor's ink — margin rules, fences, totals, the stamp, focus; green cloth is the actor's ink — links, buttons, done-marks. Red is never interactive (focus outline aside); actions are never red.
**The Rule-Not-Fill Rule.** Red and the blue feint appear as lines, never as area fills. The only background tints in the system are the paper itself and `cloth-soft` at ≤12% alpha.

## Typography

**Display/Body Font:** Charter (with Georgia, "Times New Roman", serif)
**Label/Mono Font:** ui-monospace (SFMono-Regular, Menlo, Consolas, monospace)
**UI Sans Font:** ui-sans-serif (system-ui, -apple-system, sans-serif) — buttons, the stamp, and the robot-note only

**Character:** Serif ink prose against typewriter figures — a book kept by hand, totted up by machine. System stacks only; no external font may ever be loaded (brief-pinned).

### Hierarchy
- **Display** (700, clamp(2.15rem, 5vw, 3.4rem), 1.12, -0.015em, `text-wrap: balance`): the hero headline only. May carry one red double-underlined phrase (`0.09em double` in red-ink).
- **Headline** (700, clamp(1.5rem, 3.2vw, 1.95rem), 1.22, -0.01em, balanced): section headings, typically followed by an italic muted epigraph (1.12rem).
- **Title** (700, 1.05–1.08rem, 1.35): entry terms in the accounts list and step headings.
- **Body** (400, 1.0625rem, 1.65): serif prose; lede at 1.2rem muted. Prose column is capped at 44rem (~65ch).
- **Label** (mono, 700, 0.72–0.78rem, 0.14em tracking, UPPERCASE): ledger column heads — `colhead` badges over figures and the Posted/Pending list heads. Always underlined by a 1px rule in its own ink.
- **Code** (mono, 400, 0.85rem/1.5rem): code blocks on ruled paper; inline code at 0.86em on a cloth wash.

### Named Rules
**The Tabular Figures Rule.** `font-variant-numeric: tabular-nums` is set globally; every quantity is mono, right-aligned, and fenced by a red rule. Numbers are the argument — they must land in columns.
**The Column Head Rule.** The uppercase mono label is a ledger column head: it sits on tables, figure captions, and status lists, and is always ruled underneath. It never floats above a headline as a kicker.

## Layout

One book, one column. The binding measure is `--wide` (64rem) for the brandline, sections, and footer; inside a section every child is capped at `--max` (44rem) so all prose sits against the book's gutter — left-aligned, never centered (the stamp's `status-strip` section is the one centered exception). Spreads opt out explicitly: the manifest showcase (two columns ≥60rem, 1.05fr/1fr), the accounts list (15rem term column ≥52rem), and the Posted/Pending grid (1.15fr/1fr ≥52rem).

The red margin rule is a fixed `body::before` line down the left edge (at 0.55rem; at ≥74rem it moves to `calc(50% - 34.5rem)`, just outside the 64rem column — the book laid open). At ≥74rem the robot-note hangs off this rule as marginalia (negative margin, 3px margin-red left border); below 74rem it drops its border so the gutter never doubles up.

Sections are ledger entries: `3.4rem 0` padding, separated by 1px ruling border-tops. The hero opens at `4.5rem` top padding. Paragraph rhythm is 1.1rem; table rows and list items run 0.45rem vertical padding on 1px rules. Page gutter is 1.25rem of body padding. Breakpoints in use: 52rem, 60rem, 74rem — all `min-width`, mobile-first single column.

## Elevation & Depth

None. This is flat paper: **no box-shadows anywhere in the system**, no glows, no layered surfaces. Depth is conveyed the way a ledger conveys it — with rules: 1px feint lines separate, a 3px double rule closes, a fenced column contains, and a ≤12% tint wash (`cloth-soft`) is the only "raised" surface. The one illusion of physicality is the rubber stamp, which achieves it with rotation, an SVG turbulence filter, and an ink mask — not shadow.

### Named Rules
**The Flat Paper Rule.** Nothing casts a shadow on this page. If a surface needs distinguishing, rule it with a 1px feint line or wash it with `cloth-soft`.

## Shapes

Near-square. Corners are barely eased: 3px on buttons and inline code, 4px on code blocks and the robot-note, 6px on the stamp — nothing rounder, no pills, no circles (except the drawn "pending" circle glyph). Borders are 1px hairlines in `ruling` or `margin-red`; the two sanctioned heavy strokes are the total row's `3px double` red rule and the stamp's `3px solid` red border. The signature silhouette is the ruled line itself: horizontal feint rules, one red vertical, and the double rule that closes an account. The stamp is the one rotated element (-3.5deg), roughened by `feTurbulence` displacement and unevened by a radial-gradient ink mask — stamped, not drawn. Icons are hand-drawn inline stroke SVGs (the 0.72rem tick and pending circle, `stroke-width` 1.4–1.6, round caps), matching the favicon's stroke-drawn rake.

## Components

### Buttons
- **Character:** book-cloth pressings — sans-serif (600, 1rem), quiet, square-shouldered.
- **Shape:** barely-eased corners (3px), padding 0.72rem 1.5rem, 1px border.
- **Primary:** cloth fill, paper-btn-ink text, cloth-deep border. Hover: fill deepens to cloth-deep. Transition 140ms ease-out on background/border only.
- **Ghost:** transparent, cloth text, ruling border. Hover: border takes cloth, text deepens. Reads as a ruled blank next to the filled primary.
- **Focus:** 2px red-stamp outline, 3px offset, 1px radius (shared with links).

### The Posting Table (signature)
The system's core artifact: a borderless-collapse ledger table. Row labels are serif 400, left-aligned, ruled under with 1px feint lines; amounts are mono 0.92rem, right-aligned, `white-space: nowrap`, in a fixed 6.5rem cash column fenced on its left by a 1px margin-red rule. The `.total` row is bold, closed with a `3px double` red-ink bottom rule, its amount in red-ink. Use it for any declared-vs-generated accounting; the double-ruled figure is the page's argument.

### The Stamp (signature)
Live proof only. Sans 800, 1.05rem, 0.22em tracking, uppercase, red-stamp ink and 3px red-stamp border, 6px radius, rotated -3.5deg, with a smaller 0.62rem/0.3em sub-line. Roughened by an inline SVG `feTurbulence` filter and a radial ink mask. Carries the site's only authored motion: a scroll-driven press-in (`animation-timeline: view()`, entry 0%–60%, from rotate(-8deg) scale(1.25) at opacity 0), double-gated behind `@supports` and `prefers-reduced-motion: no-preference`. Do not mint new stamps casually — it certifies deployment, nothing less.

### Brandline (navigation)
A folio line, not a navbar: mono 0.85rem, 0.04em tracking, baseline-aligned flex row under a 1px ruling, family name bold in ink, current site in red-ink bold, the domain as a muted right-aligned folio (0.78rem). Links undecorated, muted.

### Code Blocks
Ruled paper: mono 0.85rem on an exact 1.5rem line height, 1px ruling border, 4px radius, and a `repeating-linear-gradient` of `ruling-soft` feint lines locked to the line height (`background-attachment: local` so the ruling scrolls with the code). Inline code sits on a cloth-soft wash, 3px radius. Thin scrollbars in `ruling`. When every line must be countable, wrap with hang-indented `.ln` blocks rather than clip.

### Column Heads / Status Lists
`colhead`: the uppercase mono label (see Typography), red-ink over a 1px margin-red underline, used in figure captions. The Posted/Pending lists reuse it as list heads — cloth-colored and cloth-ruled for built, muted and feint-ruled for pending — over rows of stroke-SVG ticks (cloth) and open circles (muted) on `ruling-soft` hairlines.

### Marginalia (robot-note)
The factor-X disclosure: sans 0.9rem muted on cloth-soft, 4px radius. At ≥74rem it hangs off the margin rule with a 3px margin-red left border. This pattern is reserved for annotations *about* the page, in the margin's voice.

### Steps
Baseline-flex rows: a red-ink mono step number with a CSS-generated period, beside a serif title (700, 1.05rem), each followed by a ruled code block.

## Do's and Don'ts

### Do:
- **Do** draw all structure with 1px feint rules (`ruling` / `ruling-soft`); separate sections, rows, and list items with lines, not boxes or shadows.
- **Do** set every figure in tabular mono, right-aligned, fenced left by a 1px margin-red rule; close a table's decisive figure with the 3px double red rule — and only that figure.
- **Do** keep the two inks in role: green cloth for anything actionable, auditor's red for evidence, totals, and focus.
- **Do** gate any new motion the way the stamp is gated: `@supports` + `prefers-reduced-motion`, and keep transitions at 140ms ease-out on color properties.
- **Do** hold WCAG AA contrast in both themes, and theme exclusively through the custom properties (`prefers-color-scheme` plus `:root[data-theme]` overrides).
- **Do** mark AI-authored prose with a visible 🤖 (binding factor-X commitment; the robot-note is the page-level pattern).

### Don't:
- **Don't** ship client JavaScript, external fonts, icon fonts, or any third-party request; interactivity is CSS-only and icons are inline stroke SVGs.
- **Don't** build the dark neon code-window hero or any syntax-highlight-glow treatment — the world's confirmed anti-reference; code sits on ruled paper in one ink.
- **Don't** use box-shadows, glows, or decorative gradients; gradients exist only as feint ruled lines and the stamp's ink mask.
- **Don't** make red interactive or green evidentiary; never fill an area with red.
- **Don't** float an uppercase mono label above a headline as a kicker; column heads belong on tables, captions, and lists, ruled underneath.
- **Don't** round past 6px, center prose (stamp section excepted), or rotate anything but the stamp.
