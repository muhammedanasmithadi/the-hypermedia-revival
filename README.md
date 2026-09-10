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

- `index.html` : course home.
- `lessons/index.html` : section list.
- `lessons/NNNN-<slug>.html` : the sections, in order; `<slug>` matches the manifest slug.
- `assets/styles.css` : the one stylesheet every page includes; it imports the modules below.
- `assets/styles/*.css` : sixteen modules — `tokens`, `base`, `chrome`, `typography`,
  `panels`, `footer`, `widget-kiosk`, `widget-experiment`, `widget-stepper`,
  `widget-timeline`, `widget-ledger`, `widget-twolane`, `widget-statusline`,
  `panels-callouts`, `pages`, `print`.
- `assets/js/widget-000N.js` : one deferred script per section page.
- `scripts/manifest.json` : source of truth for sections, slugs, styles, widgets, and state.
- `scripts/check-consistency.mjs` : verifies pages and `sitemap.xml` against the manifest;
  `--write` regenerates the sitemap.
- `scripts/generate-assets.sh` : regenerates og, hero, and favicon assets; needs
  `assets/social/chainlink-2k.jpg` as the source mark.
- `assets/social/` : og card, hero images, and favicon output.
- `assets/social/chainlink-2k.jpg` : banner source for `generate-assets.sh`
  (2752x1536, restored from git history).

## Add a section

- Pick a slug for the title, and add the section to `manifest.json` `sections`.
- Name the file `lessons/NNNN-<slug>.html` so the filename matches the slug.
- Style the interactive part in one `assets/styles/widget-*.css` module.
- Write the interactive script to `assets/js/widget-000N.js` and include it with `defer`.
- Run `node scripts/check-consistency.mjs --write` to refresh `sitemap.xml`.

## Run locally

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000` in a browser.

## Verify

```sh
node scripts/check-js.mjs
node scripts/check-consistency.mjs --ci
npx vnu-jar index.html 404.html lessons/index.html lessons/*.html
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