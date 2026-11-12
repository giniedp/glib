import type { GridApi } from 'ag-grid-community'
import { createMemo, createResource, createSignal, For, Match, Show, Switch } from 'solid-js'
import { Button } from 'tweak-ui'
import { searchFiles } from '../../../api/browse'
import {
  describeChunk,
  hex,
  readChunkFile,
  type ByteRange,
  type ChunkEntry,
  type ChunkField,
  type ChunkFile,
  type ChunkTable,
} from '../../../formats/cgf/chunks'
import { formatBytes } from '../../common/format'
import { columnWidth, Grid, indexColumn } from '../../common/grid'
import { contentBytes } from './content'
import { showBytes } from './marks'
import type { ViewContext } from './registry'

/**
 * The chunks of a CryEngine chunk file (`.cgf`, `.skin`, `.chr`, `.caf`): the chunk table, the fields and lists of the
 * selected chunk, links to the chunks it refers to, and "bytes" links that show a range in the Hex mode of the file or
 * of its `.cgfheap`. Ported from nw-odin `browser/chunks/chunk-view.tsx`, decoded in the frontend
 * (formats/cgf/chunks.ts).
 */
export default function InspectMode(props: { ctx: ViewContext }) {
  const [file] = createResource(
    () => props.ctx.path,
    async (path) => {
      const bytes = await contentBytes(path)
      // the heap of a model, if there is one. Searched: a stat of a missing file is a 404 in the console.
      const heapPath = `${path}heap`
      const found = await searchFiles(heapPath, [], undefined, 4).catch(() => null)
      const heap = found?.files.find((it) => it.path === heapPath) ?? null
      return { bytes, chunks: readChunkFile(bytes), heapPath: heap?.path ?? null, heapSize: heap?.size ?? 0 }
    },
  )

  return (
    <Switch
      fallback={
        <div class="nw-empty">
          <p class="nw-note">Reading…</p>
        </div>
      }
    >
      <Match when={file.error}>
        <div class="nw-empty">
          <p class="nw-note">The chunks could not be read: {String(file.error?.message ?? file.error)}</p>
        </div>
      </Match>
      <Match when={file()}>
        {(it) => (
          <Inspector
            path={props.ctx.path}
            bytes={it().bytes}
            file={it().chunks}
            heapPath={it().heapPath}
            heapSize={it().heapSize}
          />
        )}
      </Match>
    </Switch>
  )
}

function Inspector(props: {
  path: string
  bytes: Uint8Array
  file: ChunkFile
  heapPath: string | null
  heapSize: number
}) {
  const chunks = () => props.file.chunks
  const byId = createMemo(() => new Map(chunks().map((c) => [c.id, c])))
  const [selected, setSelected] = createSignal<ChunkEntry | null>(chunks()[0] ?? null)
  let grid: GridApi<ChunkEntry> | undefined

  const select = (chunk: ChunkEntry | undefined) => {
    if (!chunk) {
      return
    }
    setSelected(chunk)
    const node = grid?.getRowNode(String(chunk.index))
    node?.setSelected(true)
    if (node?.rowIndex != null) {
      grid?.ensureIndexVisible(node.rowIndex)
    }
  }
  const openBytes = (range: ByteRange) => {
    const path = range.heap ? props.heapPath : props.path
    if (path) {
      showBytes(path, { offset: range.offset, length: range.length })
    }
  }

  const summary = () => {
    const parts = [`${props.file.signature} ${hex(props.file.version, 3)}`, `${chunks().length} chunks`, formatBytes(props.bytes.length)]
    if (props.heapPath) {
      parts.push(`heap ${formatBytes(props.heapSize)}`)
    }
    return parts.join(' · ')
  }
  const longestType = () => Math.max(...chunks().map((c) => c.typeName.length), 4)

  return (
    <div class="nw-inspect">
      <div class="nw-view-bar">
        <span class="nw-view-info">{summary()}</span>
        <Show when={props.heapPath}>
          <Button ghost title={`Show ${props.heapPath} in Hex`} onClick={() => openBytes({ heap: true, offset: 0, length: 0 })}>
            Heap
          </Button>
        </Show>
      </div>
      <div class="nw-inspect-body">
        <Grid<ChunkEntry>
          class="nw-inspect-chunks"
          ref={(api) => {
            grid = api
            select(selected() ?? undefined)
          }}
          options={{
            rowData: chunks(),
            getRowId: (p) => String(p.data.index),
            rowSelection: { mode: 'singleRow', checkboxes: false, enableClickSelection: true },
            onRowClicked: (e) => e.data && setSelected(e.data),
            columnDefs: [
              indexColumn(chunks().length),
              { field: 'id', headerName: 'Id', width: columnWidth('Id', 5) },
              { field: 'typeName', headerName: 'Type', width: columnWidth('Type', longestType()) },
              {
                colId: 'version',
                headerName: 'Version',
                valueGetter: (p) => (p.data ? hex(p.data.version) : ''),
                width: columnWidth('Version', 6),
              },
              { field: 'offset', headerName: 'Offset', width: columnWidth('Offset', 8), type: 'rightAligned' },
              { field: 'size', headerName: 'Size', width: columnWidth('Size', 8), type: 'rightAligned' },
            ],
          }}
        />
        <div class="nw-inspect-detail">
          <Show when={selected()} keyed fallback={<p class="nw-note">Select a chunk.</p>}>
            {(chunk) => (
              <ChunkPane
                bytes={props.bytes}
                chunk={chunk}
                byId={byId()}
                hasHeap={!!props.heapPath}
                onSelect={(id) => select(byId().get(id))}
                onBytes={openBytes}
              />
            )}
          </Show>
        </div>
      </div>
    </div>
  )
}

function ChunkPane(props: {
  bytes: Uint8Array
  chunk: ChunkEntry
  byId: Map<number, ChunkEntry>
  hasHeap: boolean
  onSelect: (id: number) => void
  onBytes: (range: ByteRange) => void
}) {
  const detail = createMemo(() => describeChunk(props.bytes, props.chunk))
  return (
    <div class="nw-chunk">
      <div class="nw-chunk-head">
        <span class="nw-chunk-title">
          {props.chunk.typeName} #{props.chunk.id}
        </span>
        <span class="nw-view-info">
          {hex(props.chunk.version)} · {props.chunk.size} B @ {props.chunk.offset}
        </span>
        <Button
          ghost
          title="Show the bytes of the chunk in Hex"
          onClick={() => props.onBytes({ heap: false, offset: props.chunk.offset, length: props.chunk.size })}
        >
          bytes
        </Button>
      </div>
      <Show when={detail().error}>
        <p class="nw-note">{detail().error}</p>
      </Show>
      <div class="nw-fields">
        <FieldList
          fields={detail().fields}
          byId={props.byId}
          hasHeap={props.hasHeap}
          onSelect={props.onSelect}
          onBytes={props.onBytes}
        />
      </div>
      <For each={detail().tables}>{(table) => <ChunkTableGrid table={table} />}</For>
    </div>
  )
}

function FieldList(props: {
  fields: ChunkField[]
  byId: Map<number, ChunkEntry>
  hasHeap: boolean
  onSelect: (id: number) => void
  onBytes: (range: ByteRange) => void
}) {
  return (
    <For each={props.fields}>
      {(f) => (
        <Show
          when={f.children?.length}
          fallback={
            <div class="nw-field">
              <span class="nw-field-name">{f.name}</span>
              <span class="nw-field-value" title={f.value}>
                {f.value}
                <For each={f.links ?? []}>
                  {(id) => (
                    <Show when={props.byId.get(id)}>
                      {(target) => (
                        <button class="nw-link" onClick={() => props.onSelect(id)}>
                          → {target().typeName} #{id}
                        </button>
                      )}
                    </Show>
                  )}
                </For>
                <Show when={f.bytes && (!f.bytes.heap || props.hasHeap) && f.bytes}>
                  {(range) => (
                    <button class="nw-link" onClick={() => props.onBytes(range())}>
                      {range().heap ? 'heap' : 'bytes'} @ {range().offset}
                    </button>
                  )}
                </Show>
              </span>
            </div>
          }
        >
          <details class="nw-field-group" open>
            <summary class="nw-field-name">
              {f.name}
              <span class="nw-muted"> {f.value}</span>
            </summary>
            <div class="nw-field-children">
              <FieldList {...props} fields={f.children ?? []} />
            </div>
          </details>
        </Show>
      )}
    </For>
  )
}

function ChunkTableGrid(props: { table: ChunkTable }) {
  const rows = () => props.table.rows.map((cells, i) => ({ i, cells }))
  return (
    <div class="nw-chunk-table">
      <div class="nw-chunk-table-name nw-muted">
        {props.table.name} ({props.table.rows.length})
      </div>
      <Grid<{ i: number; cells: string[] }>
        class="nw-chunk-grid"
        options={{
          rowData: rows(),
          columnDefs: props.table.columns.map((name, c) => ({
            colId: String(c),
            headerName: name,
            valueGetter: (p) => p.data?.cells[c] ?? '',
            width: columnWidth(name, Math.max(...props.table.rows.map((r) => r[c]?.length ?? 0), 1)),
          })),
        }}
      />
    </div>
  )
}
