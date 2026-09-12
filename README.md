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
| 06 | Keep the old copy. Ask if it is still good. | next |

## Site structure

- `index.html` : home.
- `lessons/index.html` : section list.
- `lessons/NNNN-<slug>.html` : the sections, in order; `<slug>` matches the manifest slug.
- `assets/styles.css` : the one stylesheet every page includes; it imports the modules below.
  Exception: `404.html` is self-styled by design (standalone, noindex).
- `assets/styles/*.css` : sixteen modules — `tokens`, `base`, `chrome`, `typography`,
  `panels`, `footer`, `widget-kiosk`, `widget-experiment`, `widget-stepper`,
  `widget-timeline`, `widget-ledger`, `widget-statusline`, `widget-twolane`,
  `panels-callouts`, `pages`, `print`.
- `assets/js/site.js` : shared chrome (reading progress, scrollspy, reveal, ticker, `sleep`).
- `assets/js/ledger.js` : the shared ledger widget reused by sections 02 and 05.
- `assets/js/widget-000N.js` : one ES module per section page; it imports `site.js` (and
  `ledger.js` where needed).
- `scripts/manifest.json` : source of truth for sections, slugs, styles, widgets, and state.
- `scripts/check-consistency.mjs` : verifies pages and `sitemap.xml` against the manifest;
  `--write` regenerates the sitemap.
- `assets/social/` : og card, hero images, and favicon output.

## Add a section

- Pick a slug for the title, and add the section to `manifest.json` `sections`.
- Name the file `lessons/NNNN-<slug>.html` so the filename matches the slug.
- Style the interactive part in one `assets/styles/widget-*.css` module.
- Write the interactive script to `assets/js/widget-000N.js` as an ES module; every widget
  imports `site.js`, and 02/05 also import `ledger.js`.
- Include the widget with `<script type="module" src="../assets/js/widget-000N.js">`.
- Run `node scripts/check-consistency.mjs --write` to refresh `sitemap.xml`.

## Run locally

Serve the site over HTTP with any static file server, then open
`http://localhost:8000` in a browser.

ES modules fail over `file://` (browser security). Always serve the site over HTTP —
any static host works.

## Verify

```sh
node scripts/check-js.mjs
node scripts/check-consistency.mjs --ci
npx vnu-jar index.html 404.html lessons/index.html lessons/*.html
bun run scripts/check-widgets.mjs
```

`check-consistency.mjs --write` regenerates `sitemap.xml` when a lesson changes.

The same checks run in CI on every push and pull request to `main`.

## Docs

- `STYLE.md` : writing style and teaching method.
- `MISSION.md` : why the course exists.
- `SYLLABUS.md` : the plan for all six sections.
- `RESOURCES.md` : sources and reading list.

## License

This work is licensed under the
[Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License](https://creativecommons.org/licenses/by-nc-sa/4.0/).
See `LICENSE` for the full text.