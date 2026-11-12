import { createSignal } from 'solid-js'
import { createStore } from 'solid-js/store'
import { statFile } from '../../api/browse'
import { releaseContent } from './views/content'

/**
 * A file opened in the browser
 */
export interface Tab {
  id: number
  path: string
  /**
   * Type id (index into the asset types), -1 until known
   */
  type: number
  /**
   * The display mode the user picked, see views/registry.ts. The first mode that applies if unset.
   */
  mode?: string
  /**
   * A temporary tab, opened by a single click: the next single click on another file replaces it. A double click on
   * the file or the tab keeps it (see {@link browserTabs.persist}).
   */
  preview?: boolean
}

export interface OpenOptions {
  /**
   * Opens the file in the temporary tab, which replaces the previous temporary tab. An open tab of the file is
   * activated as it is.
   */
  preview?: boolean
}

/**
 * localStorage key of the open tabs, a convenience: the app works without it
 */
const STORAGE_KEY = 'nw-viewer.browser.tabs'

interface Stored {
  tabs: Array<{ path: string; type: number; mode?: string; preview?: boolean }>
  active: string | null
}

let nextId = 1
// a store: changing a field of a tab keeps the tab object, so the `For` over the tabs does not remount
// its content (the views of a tab keep their state)
const [state, setState] = createStore<{ tabs: Tab[] }>({ tabs: [] })
const tabs = () => state.tabs
const [active, setActive] = createSignal<number | null>(null)
restore()

/**
 * The open files of the browser. Module state: the tabs stay while another tool is shown.
 */
export const browserTabs = {
  tabs,
  active,
  activeTab: () => tabs().find((tab) => tab.id === active()) ?? null,

  /**
   * Opens a file, or activates its tab if it is open. A split mip part (`.dds.N`, `.dds.Na`) opens its texture.
   * Without a type, the type is looked up.
   */
  open(file: { path: string; type?: number }, options?: OpenOptions) {
    const preview = !!options?.preview
    const base = splitPartBase(file.path)
    const path = base ?? file.path
    const open = tabs().find((tab) => tab.path === path)
    if (open) {
      if (!preview && open.preview) {
        update(open.id, { preview: false })
      }
      activate(open.id)
      return
    }
    const tab: Tab = { id: nextId++, path, type: base ? -1 : (file.type ?? -1), preview }
    // the temporary tab is replaced in place, a new tab object: its views mount again for the new file
    const replaced = preview ? tabs().findIndex((it) => it.preview) : -1
    if (replaced >= 0) {
      releaseContent(tabs()[replaced].path)
      setState('tabs', (list) => list.map((it, i) => (i === replaced ? tab : it)))
    } else {
      setState('tabs', (list) => [...list, tab])
    }
    activate(tab.id)
    if (tab.type < 0) {
      statFile(path).then(
        (stat) => update(tab.id, { type: stat.type }),
        () => {
          // unknown file: the tab shows the error when its content loads
        },
      )
    }
  },

  activate,

  /**
   * Closes a tab. The tab to its right becomes active, or the one to its left.
   */
  close(id: number) {
    const list = tabs()
    const index = list.findIndex((tab) => tab.id === id)
    if (index < 0) {
      return
    }
    releaseContent(list[index].path)
    setState('tabs', (tabs) => tabs.filter((tab) => tab.id !== id))
    const next = tabs()
    if (active() === id) {
      activate(next[Math.min(index, next.length - 1)]?.id ?? null)
    } else {
      save()
    }
  },

  /**
   * Keeps a temporary tab: it is no longer replaced by the next single click
   */
  persist(id: number) {
    if (tabs().find((tab) => tab.id === id)?.preview) {
      update(id, { preview: false })
    }
  },

  /**
   * Remembers the display mode of a tab
   */
  setMode(id: number, mode: string) {
    update(id, { mode })
  },

  /**
   * Activates the tab of a path, or opens it. For a url that names a file.
   */
  openPath(path: string) {
    browserTabs.open({ path })
  },
}

function activate(id: number | null) {
  setActive(id)
  save()
}

function update(id: number, values: Partial<Tab>) {
  setState('tabs', (tab) => tab.id === id, values)
  save()
}

/**
 * The texture of a split mip part: `x.dds.3` and `x.dds.3a` belong to `x.dds`. `x.dds.a` is a full alpha texture.
 */
function splitPartBase(path: string): string | null {
  const match = /^(.*\.dds)\.\d+a?$/.exec(path)
  return match ? match[1] : null
}

function save() {
  const stored: Stored = {
    tabs: tabs().map(({ path, type, mode, preview }) => ({ path, type, mode, preview })),
    active: browserTabs.activeTab()?.path ?? null,
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
  } catch {
    // storage blocked or full: tabs are not restored, nothing else breaks
  }
}

function restore() {
  let stored: Stored | null = null
  try {
    stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
  } catch {
    return
  }
  if (!stored?.tabs?.length) {
    return
  }
  const list = stored.tabs.map(({ path, type, mode, preview }): Tab => ({ id: nextId++, path, type, mode, preview }))
  setState('tabs', list)
  setActive(list.find((tab) => tab.path === stored.active)?.id ?? list[0].id)
}
