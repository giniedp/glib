import { createSignal } from 'solid-js'
import { entryParams, type LevelEntry } from '../../levels/catalog'
import { loadLevelCatalog } from '../../levels/load'
import { VIEWER_MODE_PARAMS } from '../../scenes'
import type { NwViewer } from '../../viewer'

/**
 * The parameters of the url that select the content, without the camera
 */
const CONTENT_PARAMS = ['level', 'mission', 'model', 'material']

/**
 * The content parameters of the url that were opened last. Showing the tool again with the same content keeps the
 * scene, other content (e.g. "Open in viewer" of the browser, a scene of the dialog) opens that.
 */
const [openedContent, setOpenedContent] = createSignal<string | null>(null)

const [sceneEntry, setSceneEntry] = createSignal<{ id: string; content: string } | null>(null)

/**
 * The id of the catalog entry that is shown, null when the url shows something else (a model, a level from a link)
 */
export function currentSceneId(): string | null {
  const entry = sceneEntry()
  return entry && entry.content === openedContent() ? entry.id : null
}

/**
 * Shows a scene of the level catalog, see {@link showScene}
 */
export function showSceneEntry(viewer: NwViewer, entry: LevelEntry) {
  showScene(viewer, entryParams(entry))
  setSceneEntry({ id: entry.id, content: openedContent() })
}

/**
 * Opens what the url names, when it differs from what was opened last. A url without content opens the default scene
 * of the level catalog (the main menu of today, see levels/catalog.ts) and writes it into the url.
 */
export function openUrlContent(viewer: NwViewer) {
  const params = new URLSearchParams(location.search)
  const previewed = viewer.previewing
  if (previewed) {
    // a texture or model preview of the browser replaced the content: the engine shows one content at a time (D5),
    // also when the browser was shown first
    viewer.endPreview()
  }
  if (!hasContent(params)) {
    openDefault(viewer)
    return
  }
  const content = contentKey(params)
  if (!previewed && content === openedContent()) {
    return
  }
  // the camera of the url, not the one of the previous content (the first time, the engine places it at start)
  if (previewed || openedContent() != null) {
    viewer.teleportFromUrl()
  }
  setOpenedContent(content)
  openFromUrl(viewer, params)
}

/**
 * Shows a scene: replaces the content and camera parameters of the url (other parameters such as `clock` stay) and
 * opens it, without a page load
 */
export function showScene(viewer: NwViewer, params: Record<string, string>) {
  const url = new URL(location.href)
  for (const key of VIEWER_MODE_PARAMS) {
    url.searchParams.delete(key)
  }
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  history.replaceState(history.state, '', `${url.pathname}${url.search}`)
  openUrlContent(viewer)
}

async function openDefault(viewer: NwViewer) {
  const catalog = await loadLevelCatalog().catch((err) => {
    console.error('level catalog not loaded:', String(err))
    return null
  })
  const entry = catalog?.defaultEntry
  // the user may have moved on while the catalog loaded
  if (!entry || !location.pathname.startsWith('/viewer') || hasContent(new URLSearchParams(location.search))) {
    return
  }
  console.log('default scene:', entry.id)
  showSceneEntry(viewer, entry)
}

function hasContent(params: URLSearchParams) {
  return CONTENT_PARAMS.some((key) => params.has(key))
}

function contentKey(params: URLSearchParams) {
  return CONTENT_PARAMS.map((key) => `${key}=${params.get(key) ?? ''}`).join('&')
}

function openFromUrl(viewer: NwViewer, params: URLSearchParams) {
  if (params.has('material')) {
    viewer.loadMaterial(params.get('material'))
  } else if (params.has('model')) {
    viewer.loadModel(params.get('model'))
  } else if (params.has('level')) {
    // `mission`: the level folder when it differs from the coatlicue (main menus). Without a position in the url,
    // the camera starts at the level's own camera placement, if it has one.
    viewer.loadLevel(params.get('level'), { mission: params.get('mission'), levelCamera: !params.has('x') })
  }
}
