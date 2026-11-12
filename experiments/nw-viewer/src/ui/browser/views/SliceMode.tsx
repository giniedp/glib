import { onCleanup, Show } from 'solid-js'
import { Button } from 'tweak-ui'
import type { NwViewer } from '../../../viewer'
import { EngineSurface } from '../../app/EngineSurface'
import type { ViewContext } from './registry'

/**
 * How often, and for how long, the camera follows the models while they load (until the user moves it)
 */
const FRAME_POLL_MS = 500
const FRAME_FOLLOW_MS = 15000

/**
 * A `.dynamicslice` shown by the engine: the slice and every slice it spawns, at the origin, with the sky, the grid
 * and the orbit camera. The slices come converted from nwbt (`/browse/slice`, user decision), the engine spawns them
 * like the slices of a level. Only offered for slices with models. The engine shows one content at a time (D5).
 */
export default function SliceMode(props: { ctx: ViewContext; shown: boolean }) {
  let viewer: NwViewer | null = null
  let timer: ReturnType<typeof setInterval> | null = null
  let touched = false

  const stopFollowing = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }
  onCleanup(stopFollowing)

  const onRunning = (it: NwViewer) => {
    viewer = it
    const slice = props.ctx.slice
    if (!slice) {
      return
    }
    it.showSlice(props.ctx.path, slice.root, slice.slices)
    // the models load after the spawn: frame them as they come in, until the user takes the camera
    stopFollowing()
    if (!touched) {
      const start = performance.now()
      timer = setInterval(() => {
        if (touched || performance.now() - start > FRAME_FOLLOW_MS) {
          stopFollowing()
          return
        }
        viewer?.framePreviewModel()
      }, FRAME_POLL_MS)
    }
  }

  const sliceCount = () => Object.keys(props.ctx.slice?.slices ?? {}).length
  return (
    <div class="nw-model" onPointerDown={() => (touched = true)} onWheel={() => (touched = true)}>
      <div class="nw-view-bar">
        <Button ghost title="Point the camera at the models of the slice" onClick={() => viewer?.framePreviewModel()}>
          Frame
        </Button>
        <span class="nw-view-info nw-push-end">
          <Show when={props.ctx.slice}>
            {(slice) => `${slice().meshes} meshes in ${sliceCount()} slices · `}
          </Show>
          drag to turn, wheel to zoom
        </span>
      </div>
      <EngineSurface class="nw-model-surface" active={props.shown} onRunning={onRunning} onDetach={stopFollowing} />
    </div>
  )
}
