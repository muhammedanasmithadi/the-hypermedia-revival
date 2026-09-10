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
| 05 | Ask without harm. Repeat without doubt. | next |
| 06 | Keep the old copy. Ask if it is still good. | next |

## Site structure

- `index.html` — course home.
- `lessons/index.html` — section list.
- `lessons/0001…0006.html` — the sections, in order.
- `assets/shared-styles.css` — tokens, typography, and widget styles for every page.
- `assets/social/` — og card, hero images, and the chain-link source mark.
- `scripts/generate-assets.sh` — regenerates og, hero, and favicon assets from the source mark.
- `scripts/check-js.mjs` — parses every inline script on every shipped page.

## Run locally

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000` in a browser.

## Verify

```sh
node scripts/check-js.mjs
npx vnu-jar index.html 404.html lessons/index.html lessons/*.html
```

The same checks run in CI on every push and pull request to `main`

## Docs

- `STYLE.md` — writing style and teaching method.
- `MISSION.md` — why the course exists.
- `SYLLABUS.md` — the plan for all six sections.
- `RESOURCES.md` — sources and reading list.

## License

This work is licensed under the
[Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License](https://creativecommons.org/licenses/by-nc-sa/4.0/).
See `LICENSE` for the full text.