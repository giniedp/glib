# nw-viewer UI

The UI is Solid + [tweak-ui](../../../../../tweak-ui). Simplicity and consistency come first.

## Components

- Use tweak-ui components first.
- Write a custom Solid component only where tweak-ui has nothing. Build it from tweak-ui's component
  classes (`twk-btn`, `twk-input`, `twk-tabs`, …) and the tokens below.
- Heavy dependencies load lazily on first use: monaco for text, ag-grid community for tables.
- Engine objects edited in panels go through `PanelScope` / `usePanel()`. Values the engine changes
  on its own go through `track`. Viewer and config events go through `fromChannel` / `configValue`.

## Content: does the user need to know it?

Before adding a label, number, badge or panel, ask whether the user needs it for the task at hand.
If not, leave it out, or put it where it is looked up on purpose (a details view, a tooltip).

## Styles

- Styles are `nw-` classes in `src/ui/styles/`, one file per area, imported by `styles/index.css`:
  - `tokens.css`: tokens and tweak-ui theme overrides
  - `base.css`: page, fonts, shared helpers
  - `viewer.css`: the viewer tool
  - a file per new area
- No inline styles for look. `style` is only for geometry computed at runtime, e.g. a popover
  positioned from a measured rect.
- **Colors** use only the `--nw-*` tokens from `tokens.css`, never literals. Tints use `color-mix`
  with the text color, so they follow the theme. Add a token instead of a one-off color.
- **Sizes** are rem. Only border and separator widths use px (`1px solid var(--nw-line)`). Relative
  units (`%`, `vh`, `fr`) are fine for layout.
- **Font sizes**: there are three, and no others:
  - `--nw-text-sm` (0.6875rem): secondary text such as counts, type labels and units
  - `--nw-text-md` (0.75rem): body text, the default, and the tweak-ui control text
  - `--nw-text-lg` (0.875rem): titles

  For emphasis, use weight or `--nw-text-dim` before another size.
- **Shared helpers**:
  - `.nw-muted`: secondary text
  - `.nw-note`: a short message in place of content, such as an empty list
- tweak-ui's public utilities (`twk:bg-*`, `twk:p-*`, …) are allowed in small amounts. A
  repeated combination becomes an `nw-` class.

## Icons

- Use only Font Awesome Pro icons (we have a license), style **sharp-light** (`svgs-full`).
- `src/ui/icons/` is the single source of all icons. It is flat and named exactly like the FA icon
  (`folder-open.svg`). Files there may be replaced by hand at any time, and code only refers to the
  name.
- Icons color through `fill="currentColor"` only, and are colored from CSS with `color`. No
  other fill or stroke colors, no `style`/`class` in the svg.
- Import with Vite's raw loader and pass it to tweak-ui:
  `import svgFolder from '../icons/folder.svg?raw'`, then `<Icon svg={svgFolder} />`.
- Never write svg markup in `.ts`/`.tsx`.

## Logging

Never log data objects, only primitives. Chrome keeps logged objects alive.
