import type { GridApi } from 'ag-grid-community'
import { createResource, Match, Switch } from 'solid-js'
import { TextInput } from 'tweak-ui'
import { columnWidth, Grid, indexColumn } from '../../common/grid'
import { contentBytes } from './content'
import { parseLocXml, type LocString } from '../../../formats/loc/loc'
import type { ViewContext } from './registry'

// a loop, a spread into Math.max overflows the stack for large files
function longest(rows: LocString[]) {
  let chars = 0
  for (const row of rows) {
    chars = Math.max(chars, row.key.length)
  }
  return chars
}

/**
 * A localization file as a key / value table with a filter. Default export for `lazy()`, ag-grid loads with it.
 */
export default function LocMode(props: { ctx: ViewContext }) {
  const [strings] = createResource(
    () => props.ctx.path,
    async (path) => parseLocXml(new TextDecoder().decode(await contentBytes(path))),
  )
  let api: GridApi<LocString> | undefined

  return (
    <Switch
      fallback={
        <div class="nw-empty">
          <p class="nw-note">Reading…</p>
        </div>
      }
    >
      <Match when={strings.error}>
        <div class="nw-empty">
          <p class="nw-note">Could not be read: {String(strings.error)}</p>
        </div>
      </Match>
      <Match when={strings()}>
        {(rows) => (
          <>
            <div class="nw-view-bar">
              <TextInput
                class="nw-view-filter"
                placeholder="Filter keys and values"
                onInput={(text) => api?.setGridOption('quickFilterText', text)}
              />
              <span class="nw-muted">{rows().length.toLocaleString()} strings</span>
            </div>
            <Grid<LocString>
              ref={(it) => (api = it)}
              options={{
                rowData: rows(),
                columnDefs: [
                  indexColumn(rows().length),
                  {
                    field: 'key',
                    headerName: 'Key',
                    width: columnWidth('Key', longest(rows())),
                    tooltipField: 'key',
                  },
                  { field: 'value', headerName: 'Value', flex: 1, tooltipField: 'value' },
                ],
                defaultColDef: { sortable: true, resizable: true },
              }}
            />
          </>
        )}
      </Match>
    </Switch>
  )
}
