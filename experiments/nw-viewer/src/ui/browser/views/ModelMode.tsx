import { createSignal, For, onCleanup, Show } from 'solid-js'
import { Button, ButtonGroup } from 'tweak-ui'
import type { NwViewer } from '../../../viewer'
import { EngineSurface } from '../../app/EngineSurface'
import type { ViewContext } from './registry'

/**
 * How often the toolbar reads the levels of detail of the shown model (loads finish, the rendered level changes)
 */
const LOD_POLL_MS = 250

/**
 * A `.cgf` or `.skin` shown by the engine: the model with the orbit camera (drag to turn, wheel to zoom), the sky and
 * the grid of the viewer's model mode. The file is parsed in the frontend (formats/cgf), like the level does.
 *
 * @remarks
 * The engine shows one content at a time (D5): showing a model unloads the level, the viewer opens it again. Showing
 * the same model again (e.g. after the Details mode) keeps it and the camera.
 */
export default function ModelMode(props: { ctx: ViewContext; shown: boolean }) {
  let viewer: NwViewer | null = null
  const [maxLevel, setMaxLevel] = createSignal(0)
  const [rendered, setRendered] = createSignal(0)
  const [forced, setForced] = createSignal<number | null>(null)

  let timer: ReturnType<typeof setInterval> | null = null
  const stopPolling = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }
  onCleanup(stopPolling)

  const onRunning = (it: NwViewer) => {
    viewer = it
    it.showModel(props.ctx.path)
    it.forcePreviewModelLod(forced())
    stopPolling()
    timer = setInterval(() => {
      if (viewer?.previewKey !== `model:${props.ctx.path}`) {
        return
      }
      const lod = viewer.previewModelLod()
      setMaxLevel(lod.maxLevel)
      setRendered(lod.rendered)
      // a level that is forced before the model loaded applies once it is there
      if (lod.forced !== forced()) {
        viewer.forcePreviewModelLod(forced())
      }
    }, LOD_POLL_MS)
  }
  const onDetach = () => {
    stopPolling()
  }

  const force = (level: number | null) => {
    setForced(level)
    viewer?.forcePreviewModelLod(level)
  }
  const levels = () => Array.from({ length: maxLevel() + 1 }, (_, i) => i)

  return (
    <div class="nw-model">
      <div class="nw-view-bar">
        <Show when={maxLevel() > 0}>
          <span class="nw-view-label">LOD</span>
          <ButtonGroup>
            <Button ghost active={forced() == null} title="By the distance to the camera" onClick={() => force(null)}>
              Auto
            </Button>
            <For each={levels()}>
              {(level) => (
                <Button ghost active={forced() === level} title={`Level of detail ${level}`} onClick={() => force(level)}>
                  {String(level)}
                </Button>
              )}
            </For>
          </ButtonGroup>
        </Show>
        <Button ghost title="Point the camera at the model again" onClick={() => viewer?.framePreviewModel()}>
          Reset camera
        </Button>
        <span class="nw-view-info nw-push-end">
          {maxLevel() > 0 ? `LOD ${rendered()} of ${maxLevel()} · ` : 'no levels of detail · '}
          drag to turn, wheel to zoom
        </span>
      </div>
      <EngineSurface class="nw-model-surface" active={props.shown} onRunning={onRunning} onDetach={onDetach} />
    </div>
  )
}
