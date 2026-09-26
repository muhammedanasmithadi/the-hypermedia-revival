# Hypermedia: the architecture we forgot

A plain-language course on hypermedia systems: what the web was built to do, and why the pattern
still wins. Each section is a self-contained page with interactive machines you run in your own
browser. No build step, no dependencies, no framework.

## Status

| Section | Title | State |
| --- | --- | --- |
| 01 | The machine that prints its own manual | done |
| 02 | How the idea got lost | done |
| 03 | Two architectures on the same table | done |
| 04 | The status line names what happened | done |
| 05 | Ask without harm. Repeat without doubt. | done |
| 06 | Keep the old copy. Ask if it is still good. | done |

All six sections are live. `state.liveMax` in `scripts/manifest.json` holds the number.

## Site structure

- `index.html` : home.
- `lessons/index.html` : section list.
- `lessons/NNNN-<slug>.html` : the sections, in order; `<slug>` matches the manifest slug.
- `glossary.html` : the term list, linked from the topbar of every page.
- `404.html` : the not-found page. Self-styled by design (standalone, noindex).
- `assets/styles.css` : the one stylesheet every page but `404.html` includes; it imports
  the modules below.
- `assets/styles/*.css` : seventeen modules — `tokens`, `base`, `chrome`, `typography`,
  `panels`, `footer`, `widget-kiosk`, `widget-experiment`, `widget-stepper`,
  `widget-timeline`, `widget-ledger`, `widget-statusline`, `widget-twolane`, `widget-cache`,
  `panels-callouts`, `pages`, `print`.
- `assets/js/site.js` : shared chrome (reading progress, scrollspy, reveal, ticker, `sleep`).
- `assets/js/ledger.js` : the shared ledger widget reused by sections 02 and 05.
- `assets/js/widget-000N.js` : one ES module per section page; it imports `site.js` (and
  `ledger.js` where needed).
- `assets/fonts/` : the four woff2 files the pages preload.
- `assets/social/` : the og card and the three hero images.
- `assets/favicon-32.png` and `assets/apple-touch-icon.png` : icons cut from the hero by
  `scripts/generate-assets.sh`.
- `scripts/manifest.json` : source of truth for the site name, root URL, og image, lastmod,
  sections, slugs, styles, widgets, shared scripts, and live state.
- `scripts/check-js.mjs` : parses every inline script on every shipped page.
- `scripts/check-consistency.mjs` : verifies pages and `sitemap.xml` against the manifest;
  `--write` regenerates the sitemap.
- `scripts/check-widgets.mjs` : walks every widget over the Chrome DevTools Protocol and runs
  axe-core on each page. Needs Bun and a Chrome binary.
- `scripts/generate-assets.sh` : regenerates the hero sizes and the two icons. Needs
  ImageMagick.
- `.github/workflows/validate.yml` : the four CI jobs.

## Add a section

- Pick a slug for the title, and add the section to `manifest.json` `sections`.
- Name the file `lessons/NNNN-<slug>.html` so the filename matches the slug.
- Copy the head, topbar, and footer from the last section. The checker requires the canonical
  link, `og:url`, the shared head tags, the skip link, the progress bar, the foot nav, and a
  `Section N of <total>` closing line on every live page.
- Style the interactive part in one `assets/styles/widget-*.css` module, then add that module
  to `manifest.json` `styles` and to the import list in `assets/styles.css`.
- Write the interactive script to `assets/js/widget-000N.js` as an ES module; every widget
  imports `site.js`, and 02/05 also import `ledger.js`. Add the page and file pair to
  `manifest.json` `widgets`.
- Include the widget with `<script type="module" src="../assets/js/widget-000N.js">`.
- Add a card to `lessons/index.html`. The checker reads that page's card count, titles, and
  blurbs and diffs them against the manifest, so each blurb must match the manifest word for
  word. The home page carries the same six-plus cards.
- Bump `state.liveMax` in the manifest. That number decides which sections are live, and it
  drives the sitemap, the lessons cards, and the `sections 01-NN live` byline.
- Watch the total. Adding section 07 makes the checker expect `Section 6 of 7` in the footer
  of all six shipped pages, so every one of them needs an edit.
- Run `node scripts/check-consistency.mjs --write` to refresh `sitemap.xml`, then run the
  checks under Verify.

## Run locally

Serve the site over HTTP with any static file server, then open
`http://localhost:8000` in a browser.

ES modules fail over `file://` (browser security). Always serve the site over HTTP —
any static host works.

## Verify

```sh
node scripts/check-js.mjs
node scripts/check-consistency.mjs --ci
npx --yes vnu-jar index.html 404.html lessons/index.html lessons/*.html glossary.html
bun run scripts/check-widgets.mjs
```

The widget walk needs Bun and a Chrome or Chromium binary. It searches `PATH`; set
`CHROME_BIN` to point at one.

`check-consistency.mjs --write` regenerates `sitemap.xml` when a lesson changes.

The same checks run in CI on every push and pull request to `main`.

## Report a problem

Found an error, a broken interaction, or a claim that does not match the RFCs? Open an
issue at <https://github.com/muhammedanasmithadi/the-hypermedia-revival/issues>.

Pull requests for fixes are welcome. Before you open one, run the checks under Verify
and follow the writing rules in `STYLE.md`.

## Docs

- `STYLE.md` : writing style and teaching method.
- `MISSION.md` : why the course exists.
- `SYLLABUS.md` : the plan for sections 04 to 06, and what each one shipped.
- `RESOURCES.md` : sources and reading list.

## License

This work is licensed under the
[Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License](https://creativecommons.org/licenses/by-nc-sa/4.0/).
See `LICENSE` for the full text.