/**
 * The datasheet views: Table (the sheet's columns) and Groups (the unpivot of a wide sheet), both with the
 * filled fields of the selected row on the side. Loaded lazily, ag-grid loads with them.
 */
import type { ColDef, GridApi } from 'ag-grid-community'
import { createSignal, For, onCleanup, Show, type JSX } from 'solid-js'
import { BoolInput, Button, Icon, PollWidget, TextInput } from 'tweak-ui'
import { cellText, formatF32 } from '../../../formats/datasheet/analysis'
import { ColumnType, type Datasheet } from '../../../formats/datasheet/datasheet'
import { columnWidth, Grid, indexColumn } from '../../common/grid'
import svgXmark from '../../icons/xmark.svg?raw'
import type { ViewContext } from './registry'
import type { SheetData } from './sheet'

/**
 * A row of the grid: an index into the sheet rows (Table) or the group entries (Groups). An object, ag-grid
 * drops rows whose data is falsy: a plain `0` lost the first row.
 */
interface GridRow {
  i: number
}

/**
 * Rows read to size the columns; the widths of a large sheet come from its start
 */
const WIDTH_SAMPLE_ROWS = 300
/**
 * Typing filters after this pause
 */
const FILTER_DELAY = 250

/**
 * A cell for the grid: null when empty (sorts first, shows blank), else the value
 */
function cellValue(sheet: Datasheet, row: number, col: number) {
  return sheet.isDefault(row, col) ? null : sheet.cell(row, col)
}

function formatValue(value: unknown) {
  if (value == null) {
    return ''
  }
  return typeof value === 'number' ? formatF32(value) : String(value)
}

/**
 * The widest text of a column in the first rows, in characters
 */
function sampleWidth(sheet: Datasheet, col: number) {
  let chars = 0
  for (let row = 0; row < Math.min(sheet.rowCount, WIDTH_SAMPLE_ROWS); row++) {
    chars = Math.max(chars, cellText(sheet, row, col).length)
  }
  return chars
}

/**
 * A column that shows a cell of the sheet; `source` maps a grid row to the sheet row and column (-1: empty)
 */
function sheetColumn(
  data: SheetData,
  id: string,
  name: string,
  col: number,
  source: (gridRow: number) => [row: number, col: number],
): ColDef<GridRow> {
  const sheet = data.sheet
  const numeric = col >= 0 && sheet.columns[col].type === ColumnType.Number
  return {
    colId: id,
    headerName: name,
    headerTooltip: name,
    valueGetter: (p) => {
      const [row, c] = source(p.data.i)
      return c < 0 ? null : cellValue(sheet, row, c)
    },
    valueFormatter: (p) => formatValue(p.value),
    tooltipValueGetter: (p) => formatValue(p.value),
    width: columnWidth(name, col >= 0 ? sampleWidth(sheet, col) : 0),
    type: numeric ? 'rightAligned' : undefined,
  }
}

/**
 * The layout of both views: a bar (filter, count, options), the grid and the panel of the selected row
 */
function SheetLayout(props: {
  data: SheetData
  /**
   * Number of grid rows
   */
  rows: number
  columns: ColDef<GridRow>[]
  count: string
  options?: JSX.Element
  /**
   * The sheet row of a grid row
   */
  sourceRow: (gridRow: number) => number
  ref?: (api: GridApi<GridRow>) => void
}) {
  let api: GridApi<GridRow> | undefined
  const [selected, setSelected] = createSignal<number | null>(null)
  let timer: ReturnType<typeof setTimeout> | undefined
  onCleanup(() => clearTimeout(timer))

  return (
    <>
      <div class="nw-view-bar">
        <TextInput
          class="nw-view-filter"
          placeholder="Filter rows"
          onInput={(text) => {
            clearTimeout(timer)
            timer = setTimeout(() => api?.setGridOption('quickFilterText', text), FILTER_DELAY)
          }}
        />
        {props.options}
        <span class="nw-muted">{props.count}</span>
      </div>
      <div class="nw-sheet">
        <Grid<GridRow>
          ref={(it) => {
            api = it
            props.ref?.(it)
          }}
          options={{
            rowData: Array.from({ length: props.rows }, (_, i) => ({ i })),
            columnDefs: [rowColumn(props.rows), ...props.columns],
            defaultColDef: { sortable: true, resizable: true },
            rowSelection: { mode: 'singleRow', checkboxes: false, enableClickSelection: true },
            onRowClicked: (e) => e.data && setSelected(props.sourceRow(e.data.i)),
          }}
        />
        <Show when={selected() != null}>
          <SheetRowPanel sheet={props.data.sheet} row={selected()} onClose={() => setSelected(null)} />
        </Show>
      </div>
    </>
  )
}

/**
 * The number of a grid row as the `#` column. Unlike ag-grid's display index it stays with the row when
 * sorting or filtering, it names the row in the sheet (Table) or the entry (Groups).
 */
function rowColumn(total: number): ColDef<GridRow> {
  return { ...indexColumn<GridRow>(total), valueGetter: (p) => p.data?.i }
}

/**
 * The filled fields of one row of the sheet
 */
function SheetRowPanel(props: { sheet: Datasheet; row: number; onClose: () => void }) {
  const fields = () =>
    props.sheet.columns
      .map((column, col) => ({ name: column.name, text: cellText(props.sheet, props.row, col) }))
      .filter((field) => field.text !== '')
  return (
    <aside class="nw-sheet-row">
      <div class="nw-view-bar">
        <span>Row {props.row}</span>
        <span class="nw-muted">{fields().length} filled fields</span>
        <Button ghost square class="nw-push-end" title="Close" icon={<Icon svg={svgXmark} />} onClick={props.onClose} />
      </div>
      <div class="nw-sheet-fields">
        <For each={fields()}>{(field) => <PollWidget label={field.name} value={field.text} />}</For>
      </div>
    </aside>
  )
}

/**
 * The sheet's columns. Columns without a filled cell are hidden unless asked for.
 */
export function SheetTableMode(props: { ctx: ViewContext }) {
  const data = props.ctx.sheet
  const sheet = data.sheet
  const empty = data.filled.filter((filled) => !filled).length
  const [showEmpty, setShowEmpty] = createSignal(false)
  let api: GridApi<GridRow> | undefined

  const columns = (withEmpty: boolean) =>
    sheet.columns.flatMap((column, col) =>
      withEmpty || data.filled[col] ? [sheetColumn(data, String(col), column.name, col, (row) => [row, col])] : [],
    )
  const toggle = (on: boolean) => {
    setShowEmpty(on)
    api?.setGridOption('columnDefs', [rowColumn(sheet.rowCount), ...columns(on)])
  }

  return (
    <SheetLayout
      data={data}
      rows={sheet.rowCount}
      columns={columns(false)}
      sourceRow={(row) => row}
      ref={(it) => (api = it)}
      count={`${sheet.rowCount.toLocaleString()} rows × ${(sheet.columns.length - (showEmpty() ? 0 : empty)).toLocaleString()} columns`}
      options={
        <Show when={empty > 0}>
          <label class="nw-view-option" title="Columns without any value">
            <BoolInput value={showEmpty()} onInput={toggle} />
            <span>{empty.toLocaleString()} empty columns</span>
          </label>
        </Show>
      }
    />
  )
}

/**
 * The unpivot of a wide sheet: one row per group and sheet row with a filled field. The keys of the sheet row,
 * the group number and name, then one column per field of the group.
 */
export function SheetGroupsMode(props: { ctx: ViewContext }) {
  return <SheetGroupsView data={props.ctx.sheet} />
}

/**
 * The groups view of a wide sheet, also used by the Data tool (ui/data) for wide families such as LootBuckets
 */
export function SheetGroupsView(props: { data: SheetData }) {
  const data = props.data
  const sheet = data.sheet
  const groups = data.groups
  const entries = groups.entries
  const entryRow = (i: number) => entries[i][1]
  let longestHeader = 0
  for (const header of groups.headers) {
    longestHeader = Math.max(longestHeader, header.length)
  }

  const columns: ColDef<GridRow>[] = [
    ...groups.keys.map((col) => sheetColumn(data, `key${col}`, sheet.columns[col].name, col, (i) => [entryRow(i), col])),
    {
      colId: 'group',
      headerName: 'Group',
      valueGetter: (p) => groups.numbers[entries[p.data.i][0]],
      width: columnWidth('Group', String(groups.numbers.at(-1) ?? '').length),
      type: 'rightAligned',
    },
    ...(groups.headerRow >= 0
      ? [
          {
            colId: 'name',
            headerName: 'Name',
            headerTooltip: 'The name of the group, from the FIRSTROW row',
            valueGetter: (p) => groups.headers[entries[p.data.i][0]],
            width: columnWidth('Name', longestHeader),
          } satisfies ColDef<GridRow>,
        ]
      : []),
    ...groups.bases.flatMap((base, b) =>
      groups.baseFilled[b]
        ? [
            sheetColumn(data, `base${b}`, base, firstColumnOf(groups.field, b), (i) => [
              entryRow(i),
              groups.field[entries[i][0]][b],
            ]),
          ]
        : [],
    ),
  ]

  return (
    <SheetLayout
      data={data}
      rows={entries.length}
      columns={columns}
      sourceRow={entryRow}
      count={`${entries.length.toLocaleString()} entries in ${groups.numbers.length.toLocaleString()} groups`}
    />
  )
}

/**
 * A column of a base in some group, to size and align the base's column
 */
function firstColumnOf(field: Int32Array[], base: number) {
  for (const cols of field) {
    if (cols[base] >= 0) {
      return cols[base]
    }
  }
  return -1
}
