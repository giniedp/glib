import { createEffect, createResource, createSignal, For, on, onCleanup, Show } from 'solid-js'
import { BoolInput, Button, Icon } from 'tweak-ui'
import { getSlice } from '../../api/browse'
import type { NwViewer } from '../../viewer'
import { EngineSurface } from '../app/EngineSurface'
import { ExportButton } from '../common/ExportButton'
import svgCompress from '../icons/compress.svg?raw'
import svgExpand from '../icons/expand.svg?raw'
import type { FamilyRows } from './families'
import { rowPreviews, type RowPreviewOption } from './preview'

/**
 * How often the bar reads the load states of the parts, until all are loaded or failed
 */
const PARTS_POLL_MS = 250
/**
 * How often, and for how long, the camera follows the models of a slice while they load
 */
const FRAME_POLL_MS = 500
const FRAME_FOLLOW_MS = 15000

type Part = ReturnType<NwViewer['previewCharacterParts']>[number]

/**
 * Keeps the wheel over the engine for the camera: without it the row panel scrolls as well. The listener must not be
 * passive to cancel the scroll; the engine still gets the event.
 */
function stopWheelScroll(el: HTMLElement) {
  el.addEventListener('wheel', (e) => e.preventDefault(), { passive: false })
}

function fileStem(path: string) {
  return (path.split('/').pop() ?? path).replace(/\.[^.]+$/, '')
}

/**
 * The models of a row rendered by the engine: the options of the row (its own models, the appearances it references)
 * in a bar, the blend masks of an appearance applied. The engine shows one content at a time (pak browser D5): the
 * preview unloads the level, the viewer opens it again.
 */
export function RowPreview(props: { rows: FamilyRows; row: number }) {
  const [options] = createResource(
    () => ({ rows: props.rows, row: props.row }),
    ({ rows, row }) => rowPreviews(rows, row),
  )
  const [selected, setSelected] = createSignal(0)
  const [dyed, setDyed] = createSignal(false)
  const [masks, setMasks] = createSignal(true)
  const [parts, setParts] = createSignal<Part[]>([])
  const option = (): RowPreviewOption | undefined => options()?.[Math.min(selected(), (options()?.length ?? 1) - 1)]
  let viewer: NwViewer | null = null
  let timer: ReturnType<typeof setInterval> | null = null
  // the user moved the camera: a slice is no longer framed as its models load
  let touched = false
  const stopPolling = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }
  onCleanup(stopPolling)

  // another row starts with its first option
  createEffect(on(() => props.row, () => setSelected(0), { defer: true }))

  const show = async () => {
    const it = option()
    if (!viewer || !it) {
      return
    }
    stopPolling()
    setParts([])
    if (it.slice) {
      const slice = await getSlice(it.slice).catch(() => null)
      if (slice && viewer) {
        viewer.showSlice(it.slice, slice.root, slice.slices)
        // the models load after the spawn: frame them as they come in, until the user takes the camera (SliceMode)
        touched = false
        const start = performance.now()
        timer = setInterval(() => {
          if (touched || performance.now() - start > FRAME_FOLLOW_MS) {
            stopPolling()
            return
          }
          viewer?.framePreviewModel()
        }, FRAME_POLL_MS)
      }
      return
    }
    const params = !masks() ? null : dyed() ? it.dyedParams : it.params
    const key = `${it.key}|${masks() ? (dyed() ? 'dyed' : 'base') : 'mtl'}`
    viewer.showParts(key, it.parts ?? [], params)
    timer = setInterval(() => {
      if (viewer?.previewKey !== `parts:${key}`) {
        return
      }
      const list = viewer.previewCharacterParts()
      setParts(list)
      if (list.length && list.every((part) => part.state !== 'loading')) {
        stopPolling()
      }
    }, PARTS_POLL_MS)
  }
  createEffect(on([option, dyed, masks], () => void show(), { defer: true }))

  const count = (state: Part['state']) => parts().filter((it) => it.state === state).length

  // the files of the option as the browser exports them: each model with its material, or the slice
  const exportFiles = () => {
    const it = option()
    if (!it) {
      return []
    }
    if (it.slice) {
      return [{ path: it.slice, material: undefined }]
    }
    return (it.parts ?? []).map((part) => ({ path: part.mesh, material: part.material || undefined }))
  }

  let container: HTMLDivElement | undefined
  const [fullscreen, setFullscreen] = createSignal(false)
  const onFullscreenChange = () => setFullscreen(!!container && document.fullscreenElement === container)
  document.addEventListener('fullscreenchange', onFullscreenChange)
  onCleanup(() => document.removeEventListener('fullscreenchange', onFullscreenChange))
  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      void container?.requestFullscreen()
    }
  }

  return (
    <Show when={options()?.length}>
      {/* a click on an option starts a new preview, which clears `touched` again */}
      <div
        class="nw-data-preview"
        ref={(el) => (container = el)}
        onPointerDown={() => (touched = true)}
        onWheel={() => (touched = true)}
      >
        <div class="nw-view-bar nw-data-preview-bar">
          <For each={options()}>
            {(it, i) => (
              <Button ghost active={i() === selected()} title={it.source} onClick={() => setSelected(i())}>
                {it.label}
              </Button>
            )}
          </For>
        </div>
        <div class="nw-view-bar">
          <Show when={option()?.params}>
            <label class="nw-view-option" title="The blend mask colors of the appearance row">
              <BoolInput value={masks()} onInput={setMasks} />
              <span>Masks</span>
            </label>
            <label class="nw-view-option" title="The dye masks of the appearance row, as a dyed item (no dye colors)">
              <BoolInput value={dyed()} onInput={setDyed} />
              <span>Dyed</span>
            </label>
          </Show>
          <Button ghost title="Point the camera at the models again" onClick={() => viewer?.framePreviewModel()}>
            Reset camera
          </Button>
          <span class="nw-view-info nw-push-end" title={parts().map((it) => `${it.mesh} ${it.material}`).join('\n')}>
            {option()?.slice ? 'slice' : `${parts().length} parts`}
            {count('failed') ? ` · ${count('failed')} failed` : ''}
            {count('loading') ? ` · ${count('loading')} loading` : ''}
          </span>
          {/* the export of the browser, per file of the option: the materials as authored, without the masks */}
          <For each={exportFiles()}>
            {(file) => (
              <ExportButton
                ghost
                path={file.path}
                material={file.material}
                label={exportFiles().length > 1 ? `Export ${fileStem(file.path)}` : 'Export'}
              />
            )}
          </For>
          <Button
            ghost
            square
            title={fullscreen() ? 'Leave full screen' : 'Full screen'}
            icon={<Icon svg={fullscreen() ? svgCompress : svgExpand} />}
            onClick={toggleFullscreen}
          />
        </div>
        {/* the wheel zooms the camera, it must not scroll the row panel */}
        <div class="nw-data-preview-wheel" ref={stopWheelScroll}>
          <EngineSurface
            class="nw-data-preview-surface"
            onRunning={(it) => {
              viewer = it
              void show()
            }}
            onDetach={() => {
              viewer = null
              stopPolling()
            }}
          />
        </div>
      </div>
    </Show>
  )
}
