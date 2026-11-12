import { createSignal, onCleanup, Show } from 'solid-js'
import type { NwViewer } from '../../viewer'
import { EngineSurface } from '../app/EngineSurface'
import { openUrlContent } from './content'
import { ViewerOverlay } from './overlay'

/**
 * The viewer tool: the engine canvas fills the page, the overlay sits above it.
 * The url selects what is shown (`level` with an optional `mission`, `model`, `material`; without them the default
 * scene, see ./content.ts) and holds the camera position (`x`, `y`, `z`, `w`), which is kept up to date while the
 * tool is shown.
 */
export default function ViewerTool() {
  const [viewer, setViewer] = createSignal<NwViewer>()
  const timer = setInterval(() => writeCameraToUrl(viewer()), 1000)
  onCleanup(() => clearInterval(timer))

  return (
    <EngineSurface class="nw-tool" onEngine={setViewer} onRunning={openUrlContent}>
      <Show when={viewer()}>{(it) => <ViewerOverlay viewer={it()} />}</Show>
    </EngineSurface>
  )
}

/**
 * Keeps the camera position in the url, so a reload or a shared link opens the same view.
 * Replaces the history entry without the router: the router does not read these parameters.
 */
function writeCameraToUrl(viewer: NwViewer | undefined) {
  if (!viewer) {
    return
  }
  const params = new URLSearchParams(location.search)
  if (viewer.writeCameraParams(params)) {
    history.replaceState(history.state, '', `${location.pathname}?${params}`)
  }
}
