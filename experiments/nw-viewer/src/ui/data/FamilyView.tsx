import type { ColDef, GridApi } from 'ag-grid-community'
import { createEffect, createMemo, createSignal, on, onCleanup, Show } from 'solid-js'
import { BoolInput, Button, ButtonGroup, SelectInput, TextInput } from 'tweak-ui'
import { ColumnType } from '../../formats/datasheet/datasheet'
import { columnWidth, Grid, indexColumn } from '../common/grid'
import { SheetGroupsView } from '../browser/views/SheetMode'
import { familyCell, familyText, rowKey, type FamilyRows } from './families'
import { locReady, locText } from './loc'
import { locPlain } from './locMarkup'
import { RowPanel } from './RowPanel'

interface GridRow {
  // an object: ag-grid drops rows whose data is falsy
  i: number
}

/**
 * Rows read to size the columns
 */
const WIDTH_SAMPLE_ROWS = 300
const FILTER_DELAY = 250

/**
 * The rows of a family in a grid, the selected row on the side. A wide family of one sheet (LootBuckets) also has
 * the Groups view of the browser, without links (loot is out of scope, plan.md).
 */
export function FamilyView(props: {
  rows: FamilyRows
  rowKey: string | null
  rowIndex: number | null
  onSelect: (key: string | null, row: number) => void
  onOpen: (family: string, key: string) => void
}) {
  const rows = () => props.rows
  const family = () => props.rows.family
  const [view, setView] = createSignal<'table' | 'groups'>(props.rows.groups ? 'groups' : 'table')
  const [showEmpty, setShowEmpty] = createSignal(false)
  const [sheet, setSheet] = createSignal(-1)
  let api: GridApi<GridRow> | undefined

  const selected = createMemo(() => {
    if (props.rowKey != null) {
      return props.rows.keys.get(props.rowKey.toLowerCase()) ?? null
    }
    if (props.rowIndex != null && props.rowIndex >= 0 && props.rowIndex < props.rows.count) {
      return props.rowIndex
    }
    return null
  })

  const empty = () => rows().filled.filter((it) => !it).length

  const columns = (withEmpty: boolean): ColDef<GridRow>[] => {
    const data = rows()
    const result: ColDef<GridRow>[] = [{ ...indexColumn<GridRow>(data.count), valueGetter: (p) => p.data?.i }]
    if (data.sheets.length > 1) {
      let longest = 0
      for (const info of data.family.sheets) {
        longest = Math.max(longest, info.name.length)
      }
      result.push({
        colId: 'sheet',
        headerName: 'Sheet',
        valueGetter: (p) => data.family.sheets[data.sheetOf[p.data!.i]].name,
        width: columnWidth('Sheet', longest),
      })
    }
    // sheets that start with other columns (VariationData: VariantID, HouseItems: HouseItemID) get their keys here
    const firstColumn = data.family.columns[0]?.name.toLowerCase()
    if (data.sheets.some((sheet) => sheet.columns[0]?.name.toLowerCase() !== firstColumn)) {
      let chars = 0
      for (let i = 0; i < Math.min(data.count, WIDTH_SAMPLE_ROWS); i++) {
        chars = Math.max(chars, rowKey(data, i).length)
      }
      result.push({
        colId: 'key',
        headerName: 'Key',
        headerTooltip: 'The first cell of the row in its sheet, the key the row is found by',
        valueGetter: (p) => rowKey(data, p.data!.i),
        width: columnWidth('Key', Math.max(chars, 32)),
        pinned: 'left',
      })
    }
    data.family.columns.forEach((column, c) => {
      if (!withEmpty && !data.filled[c]) {
        return
      }
      const loc = column.kind === 'loc'
      let chars = 0
      for (let i = 0; i < Math.min(data.count, WIDTH_SAMPLE_ROWS); i++) {
        chars = Math.max(chars, familyText(data, i, c).length)
      }
      result.push({
        colId: String(c),
        headerName: column.name,
        headerTooltip: column.kind ? `${column.name} (${kindLabel(column.kind, column.refs)})` : column.name,
        valueGetter: (p) => {
          const value = familyCell(data, p.data!.i, c)
          if (loc && typeof value === 'string') {
            return locPlain(locText(value) ?? value)
          }
          return value
        },
        valueFormatter: (p) => (p.value == null ? '' : String(typeof p.value === 'number' ? familyText(data, p.data!.i, c) : p.value)),
        tooltipValueGetter: (p) => (p.value == null ? '' : String(p.value)),
        width: columnWidth(column.name, loc ? Math.max(chars, 24) : chars),
        type: column.type === ColumnType.Number ? 'rightAligned' : undefined,
        cellClass: column.kind === 'ref' ? 'nw-cell-ref' : undefined,
      })
    })
    return result
  }

  const rowData = () => {
    const data = rows()
    const s = sheet()
    const result: GridRow[] = []
    for (let i = 0; i < data.count; i++) {
      if (s < 0 || data.sheetOf[i] === s) {
        result.push({ i })
      }
    }
    return result
  }

  // loc texts arrive after the grid
  createEffect(
    on(locReady, () => api?.refreshCells({ force: true }), { defer: true }),
  )
  // the selection follows the url (back / forward, links)
  createEffect(() => {
    const row = selected()
    if (!api || row == null) {
      return
    }
    const node = api.getRowNode(String(row))
    if (node && !node.isSelected()) {
      node.setSelected(true, true)
      api.ensureNodeVisible(node, 'middle')
    }
  })

  let timer: ReturnType<typeof setTimeout> | undefined
  onCleanup(() => clearTimeout(timer))

  return (
    <div class="nw-data-family">
      <div class="nw-view-bar">
        <span class="nw-view-label">{family().name}</span>
        <Show when={rows().groups}>
          <ButtonGroup>
            <Button ghost active={view() === 'groups'} title="The numbered column groups as rows" onClick={() => setView('groups')}>
              Groups
            </Button>
            <Button ghost active={view() === 'table'} onClick={() => setView('table')}>
              Table
            </Button>
          </ButtonGroup>
        </Show>
        <Show when={view() === 'table'}>
          <TextInput
            class="nw-view-filter"
            placeholder="Filter rows"
            onInput={(text) => {
              clearTimeout(timer)
              timer = setTimeout(() => api?.setGridOption('quickFilterText', text), FILTER_DELAY)
            }}
          />
          <Show when={rows().sheets.length > 1}>
            <SelectInput
              value={sheet()}
              options={[
                { label: `All ${rows().sheets.length} sheets`, value: -1 },
                ...family().sheets.map((info, s) => ({ label: `${info.name} (${info.rows})`, value: s })),
              ]}
              onChange={(value) => {
                setSheet(Number(value))
                api?.setGridOption('rowData', rowData())
              }}
            />
          </Show>
          <Show when={empty() > 0}>
            <label class="nw-view-option" title="Columns without any value">
              <BoolInput
                value={showEmpty()}
                onInput={(on) => {
                  setShowEmpty(on)
                  api?.setGridOption('columnDefs', columns(on))
                }}
              />
              <span>{empty().toLocaleString()} empty columns</span>
            </label>
          </Show>
        </Show>
        <span class="nw-muted nw-push-end">
          {rows().count.toLocaleString()} rows · {family().sheets.length} sheets
        </span>
      </div>
      <Show
        when={view() === 'table'}
        fallback={
          <div class="nw-data-groups">
            <SheetGroupsView data={rows().groups!} />
          </div>
        }
      >
        <div class="nw-sheet">
          <Grid<GridRow>
            ref={(it) => (api = it)}
            options={{
              rowData: rowData(),
              columnDefs: columns(false),
              defaultColDef: { sortable: true, resizable: true },
              getRowId: (p) => String(p.data.i),
              rowSelection: { mode: 'singleRow', checkboxes: false, enableClickSelection: true },
              onRowClicked: (e) => e.data && props.onSelect(rowKey(rows(), e.data.i) || null, e.data.i),
              onFirstDataRendered: () => {
                const row = selected()
                const node = row != null ? api?.getRowNode(String(row)) : null
                if (node) {
                  node.setSelected(true, true)
                  api?.ensureNodeVisible(node, 'middle')
                }
              },
            }}
          />
          <Show when={selected() != null}>
            <RowPanel rows={rows()} row={selected()!} onOpen={props.onOpen} />
          </Show>
        </div>
      </Show>
    </div>
  )
}

export function kindLabel(kind: string, refs?: string[]) {
  switch (kind) {
    case 'key':
      return 'the key of the rows'
    case 'ref':
      return `rows of ${refs?.join(', ')}`
    case 'loc':
      return 'localized text'
    case 'asset':
      return 'file paths'
    case 'audio':
      return 'audio triggers'
  }
  return kind
}
