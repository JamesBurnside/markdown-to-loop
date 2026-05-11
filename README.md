# md2loop

A tiny static web app that converts Markdown into clipboard HTML formatted for
Microsoft Loop. Paste markdown on the left, click **Copy as Loop HTML**, and
paste into Loop — headings, lists, task-list checkboxes, tables, and links come
through clean.

**Live:** <https://jamesburnside.github.io/markdown-to-loop/>

Inspired by [trsdn/md2loop](https://github.com/trsdn/md2loop), a Mac-only
Swift utility. This is a browser version — no install, works on any platform.

## How it works

1. Markdown → HTML via [marked](https://marked.js.org/)
2. Post-processed for Loop: strips `class` / `id` / `style` attributes,
   converts task-list `<input type="checkbox">` to Unicode glyphs (☑ / ☐),
   and cleans up table markup
3. Writes both `text/html` and `text/plain` to the clipboard via
   `navigator.clipboard.write()` with a `ClipboardItem`

## Development

No build step. Open `index.html` in a browser, or serve the folder:

```sh
python -m http.server 8000
# then visit http://localhost:8000
```

## Deploy

GitHub Pages, set to deploy from the `main` branch root.
