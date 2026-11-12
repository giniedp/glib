import { createSignal, For, onCleanup, Show } from 'solid-js'
import { Button, ButtonGroup } from 'tweak-ui'
import type { NwViewer } from '../../../viewer'
import { EngineSurface } from '../../app/EngineSurface'
import type { ViewContext } from './registry'

/**
 * How often the toolbar asks for the sub materials while they load
 */
const NAMES_POLL_MS = 250

/**
 * A `.mtl` shown by the engine: every sub material on a shader ball, on a ground plate under the sky, with the orbit
 * camera. The toolbar frames one ball or all of them. The engine shows one content at a time (D5).
 */
export default function MaterialMode(props: { ctx: ViewContext; shown: boolean }) {
  let viewer: NwViewer | null = null
  const [names, setNames] = createSignal<string[]>([])
  const [focus, setFocus] = createSignal<number | null>(null)
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
    it.showMaterial(props.ctx.path)
    stopPolling()
    // the names arrive with the materials, then the balls are framed once
    timer = setInterval(() => {
      const list = viewer?.previewMaterialNames() ?? []
      if (list.length) {
        stopPolling()
        setNames(list)
        viewer?.framePreviewMaterial(focus())
      }
    }, NAMES_POLL_MS)
  }
  const frame = (index: number | null) => {
    setFocus(index)
    viewer?.framePreviewMaterial(index)
  }

  return (
    <div class="nw-model">
      <div class="nw-view-bar">
        <Show when={names().length > 1}>
          <ButtonGroup>
            <Button ghost active={focus() == null} title="Frame all shader balls" onClick={() => frame(null)}>
              All
            </Button>
            <For each={names()}>
              {(name, i) => (
                <Button ghost active={focus() === i()} title={`Frame the ball of ${name}`} onClick={() => frame(i())}>
                  {name || `#${i()}`}
                </Button>
              )}
            </For>
          </ButtonGroup>
        </Show>
        <Show when={names().length === 1}>
          <Button ghost title="Frame the shader ball" onClick={() => frame(null)}>
            Frame
          </Button>
        </Show>
        <span class="nw-view-info nw-push-end">
          {names().length ? `${names().length} sub materials · ` : 'loading · '}
          drag to turn, wheel to zoom
        </span>
      </div>
      <EngineSurface class="nw-model-surface" active={props.shown} onRunning={onRunning} onDetach={stopPolling} />
    </div>
  )
}
