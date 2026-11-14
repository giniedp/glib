/**
 * AG Grid community, client row model. Import this module only from views that are loaded lazily: ag-grid is
 * large and only the tabs with tables pay for it.
 */
import {
  AllCommunityModule,
  createGrid,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
  type GridApi,
  type GridOptions,
} from 'ag-grid-community'
import { onCleanup, onMount } from 'solid-js'

ModuleRegistry.registerModules([AllCommunityModule])

/**
 * Horizontal padding of cells and headers, each side, in px. Column widths add it, see {@link columnWidth}.
 */
const CELL_PADDING_PX = 10

/**
 * AG Grid in the page's colors: every parameter is one of our tokens (styles/tokens.css), so the grid follows
 * the tweak-ui theme without a stylesheet of its own
 */
export const gridTheme = themeQuartz.withParams({
  browserColorScheme: 'inherit',
  backgroundColor: 'var(--nw-bg)',
  foregroundColor: 'var(--nw-text)',
  textColor: 'var(--nw-text)',
  subtleTextColor: 'var(--nw-text-dim)',
  accentColor: 'var(--nw-accent)',
  invalidColor: 'var(--nw-error)',
  borderColor: 'var(--nw-line)',
  chromeBackgroundColor: 'var(--nw-bg-sunken)',
  headerBackgroundColor: 'var(--nw-bg-sunken)',
  headerTextColor: 'var(--nw-text-dim)',
  headerFontWeight: 'normal',
  headerCellHoverBackgroundColor: 'var(--nw-hover)',
  rowHoverColor: 'var(--nw-hover)',
  selectedRowBackgroundColor: 'var(--nw-line-strong)',
  oddRowBackgroundColor: 'transparent',
  fontFamily: 'var(--twk-font-mono)',
  fontSize: 'var(--nw-text-md)',
  headerFontSize: 'var(--nw-text-md)',
  spacing: 4,
  rowHeight: 20,
  headerHeight: 24,
  // room between a right aligned number header and the name of the next header
  cellHorizontalPadding: CELL_PADDING_PX,
  wrapperBorder: false,
  wrapperBorderRadius: 0,
  borderRadius: 2,
  columnBorder: { color: 'var(--nw-line)' },
  // right aligned number headers would run into the name of the next header
  headerColumnBorder: { color: 'var(--nw-line-strong)' },
  pinnedColumnBorder: { color: 'var(--nw-line-strong)' },
})

let charPx: number | undefined

/**
 * Width of a mono character at the grid's font size, in px
 */
export function gridCharPx() {
  if (charPx === undefined) {
    const probe = document.createElement('span')
    // not `.tweak-ui`: its panel box (width, flex) would be measured instead of the text. The tokens are on :root.
    probe.className = 'nw-ag-probe'
    probe.textContent = '0000000000'
    document.body.append(probe)
    charPx = probe.getBoundingClientRect().width / 10 || 7
    probe.remove()
  }
  return charPx
}

/**
 * Widest values (characters) shown in full, longer ones are cut and show in the tooltip
 */
const MAX_VALUE_CHARS = 60

/**
 * The width of a column in px: its widest value, capped, and at least the whole header with room for the menu
 * button and the sort icon
 */
export function columnWidth(name: string, valueChars: number, sortable = true) {
  const header = name.length + 2 + (sortable ? 2 : 0)
  const chars = Math.max(4, header, Math.min(MAX_VALUE_CHARS, valueChars))
  return Math.ceil(chars * gridCharPx() + 2 * CELL_PADDING_PX + COLUMN_BORDER_PX)
}

/**
 * The column border and rounding, so that a value of exactly the counted characters is not cut
 */
const COLUMN_BORDER_PX = 2

/**
 * The row number, pinned at the left
 */
export function indexColumn<T>(total: number): ColDef<T> {
  return {
    colId: '#',
    headerName: '#',
    valueGetter: (p) => p.node?.rowIndex,
    // digits plus the cell padding
    width: Math.ceil(
      Math.max(2, String(Math.max(total - 1, 0)).length) * gridCharPx() + 2 * CELL_PADDING_PX + COLUMN_BORDER_PX,
    ),
    pinned: 'left',
    sortable: false,
    resizable: false,
    suppressMovable: true,
    cellClass: 'nw-ag-index',
  }
}

/**
 * Hosts an AG Grid. `options` are read once, later changes go through the api handed to `ref`.
 */
export function Grid<T>(props: { options: GridOptions<T>; ref?: (api: GridApi<T>) => void; class?: string }) {
  let el!: HTMLDivElement
  onMount(() => {
    const api = createGrid(el, {
      theme: gridTheme,
      loadThemeGoogleFonts: false,
      animateRows: false,
      suppressCellFocus: true,
      tooltipShowDelay: 400,
      enableBrowserTooltips: false,
      ...props.options,
    })
    props.ref?.(api)
    onCleanup(() => api.destroy())
  })
  return <div class={props.class ? `nw-ag ${props.class}` : 'nw-ag'} ref={el} />
}
