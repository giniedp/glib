import { useSearchParams } from '@solidjs/router'
import { createEffect, createMemo, createSignal, For, onCleanup, onMount, Show } from 'solid-js'
import { Icon, Split, TextInput } from 'tweak-ui'
import type { ListFile } from '../../api/browse'
import { AppBar } from '../app/AppBar'
import { TabStrip } from '../common/TabStrip'
import svgSearch from '../icons/magnifying-glass.svg?raw'
import { assetTypes, typeIcon } from './assetTypes'
import { AssetTree } from './AssetTree'
import { SearchResults } from './SearchResults'
import { FolderInfo, SelectionInfo } from './SelectionInfo'
import { loadFilter, saveFilter } from './filterStorage'
import { browserTabs } from './tabs'
import { TypeFilter } from './TypeFilter'
import { TabView } from './views/TabView'

/**
 * Typing searches after this pause, Enter searches right away
 */
const SEARCH_DELAY = 250

/**
 * The asset browser tool: the archive on the left, the open files in tabs on the right.
 * The active file is in the url (`?file=`), the open tabs are kept while other tools are shown.
 * It must not import the engine statically (see ui/app/engine.ts), engine views load it on demand.
 */
export default function BrowserTool() {
  const types = assetTypes()
  // a file, or a folder of the tree, not both
  const [selected, setSelectedFile] = createSignal<ListFile | null>(null)
  const [selectedDir, setSelectedDir] = createSignal<string | null>(null)
  // a click opens the file in the temporary tab, a double click keeps it
  const setSelected = (file: ListFile | null) => {
    setSelectedFile(file)
    setSelectedDir(null)
    if (file) {
      browserTabs.open(file, { preview: true })
    }
  }
  const selectFolder = (dir: string) => {
    setSelectedFile(null)
    setSelectedDir(dir)
  }
  // kept for the browser session, the types by key: their indices depend on the type list of the server
  const stored = loadFilter()
  const [filterKeys, setFilterKeys] = createSignal<ReadonlySet<string>>(new Set(stored.types))
  const filter = createMemo(() => {
    const keys = filterKeys()
    const result = new Set<number>()
    types().forEach((type, index) => {
      if (keys.has(type.key)) {
        result.add(index)
      }
    })
    return result
  })
  const setFilter = (indices: ReadonlySet<number>) => {
    setFilterKeys(new Set([...indices].map((index) => types()[index].key)))
  }
  const filterTypes = createMemo(() => [...filter()])
  const [query, setQuery] = createSignal(stored.query)
  createEffect(() => saveFilter({ query: query(), types: [...filterKeys()] }))

  let timer: ReturnType<typeof setTimeout> | undefined
  onCleanup(() => clearTimeout(timer))
  const search = (text: string, delay: number) => {
    clearTimeout(timer)
    timer = setTimeout(() => setQuery(text.trim()), delay)
  }

  const open = (file: ListFile) => browserTabs.open(file)
  useActiveFileInUrl()
  useCloseShortcut()

  return (
    <div class="tweak-ui nw-tool nw-tool-page nw-browser">
      <AppBar />
      {/* the sidebar needs about a path's width, the tabs get the rest */}
      <Split row class="nw-browser-split" fluid={1} minSize={200} defaultSizes={['clamp(18rem, 24%, 30rem)']}>
        <aside class="nw-browser-sidebar">
          <div class="nw-search">
            <TextInput
              placeholder="Search path or asset id"
              defaultValue={stored.query}
              slotBefore={<Icon svg={svgSearch} />}
              onInput={(text) => search(text, SEARCH_DELAY)}
              onChange={(text) => search(text, 0)}
            />
            <TypeFilter types={types()} selected={filter()} onChange={setFilter} />
          </div>
          {/* the tree stays mounted while searching, it keeps its open folders */}
          <div class="nw-browser-list" classList={{ 'nw-hidden': !!query() }}>
            <AssetTree
              types={filterTypes()}
              selected={selected()?.path ?? (selectedDir() != null ? `${selectedDir()}/` : null)}
              onSelect={setSelected}
              onSelectFolder={selectFolder}
              onOpen={open}
            />
          </div>
          <Show when={query()}>
            <div class="nw-browser-list">
              <SearchResults
                query={query()}
                types={filterTypes()}
                selected={selected()?.path ?? null}
                onSelect={setSelected}
                onOpen={open}
              />
            </div>
          </Show>
          <Show when={selected()}>{(file) => <SelectionInfo file={file()} />}</Show>
          <Show when={selectedDir()}>{(dir) => <FolderInfo path={dir()} />}</Show>
        </aside>
        <main class="nw-browser-main">
          <Show
            when={browserTabs.tabs().length}
            fallback={
              <div class="nw-empty">
                <p class="nw-note">Click a file to open it, double click to keep its tab.</p>
              </div>
            }
          >
            <TabStrip
              items={browserTabs.tabs().map((tab) => ({
                id: tab.id,
                title: fileName(tab.path),
                tooltip: tab.path,
                icon: typeIcon(types()[tab.type]),
                preview: tab.preview,
              }))}
              active={browserTabs.active()}
              onActivate={browserTabs.activate}
              onClose={browserTabs.close}
              onPersist={browserTabs.persist}
            />
            {/* every tab stays mounted, inactive ones are hidden: views keep their state */}
            <div class="nw-tab-panes">
              <For each={browserTabs.tabs()}>
                {(tab) => (
                  <div class="nw-tab-pane" classList={{ 'nw-hidden': tab.id !== browserTabs.active() }}>
                    <TabView tab={tab} />
                  </div>
                )}
              </For>
            </div>
          </Show>
        </main>
      </Split>
    </div>
  )
}

/**
 * `?file=` opens that file when the tool is shown, and follows the active tab
 */
function useActiveFileInUrl() {
  const [params, setParams] = useSearchParams<{ file?: string }>()
  onMount(() => {
    if (params.file) {
      browserTabs.openPath(params.file)
    }
  })
  createEffect(() => {
    const path = browserTabs.activeTab()?.path
    if (path !== params.file) {
      setParams({ file: path }, { replace: true })
    }
  })
}

/**
 * Alt+W closes the active tab. Ctrl+W is the browser's own and can not be taken by a page.
 */
function useCloseShortcut() {
  const onKey = (e: KeyboardEvent) => {
    if (e.altKey && !e.ctrlKey && !e.shiftKey && e.code === 'KeyW') {
      const id = browserTabs.active()
      if (id != null) {
        e.preventDefault()
        browserTabs.close(id)
      }
    }
  }
  window.addEventListener('keydown', onKey)
  onCleanup(() => window.removeEventListener('keydown', onKey))
}

function fileName(path: string) {
  return path.slice(path.lastIndexOf('/') + 1)
}
