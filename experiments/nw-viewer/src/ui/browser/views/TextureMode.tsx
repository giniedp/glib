import { DDS } from '@gglib/loaders'
import { createEffect, createMemo, createResource, createSignal, For, Match, onCleanup, Show, Switch } from 'solid-js'
import { Button, ButtonGroup, ScalarInput } from 'tweak-ui'
import type { TexturePreview } from '../../../graphics/passes/texture/TexturePreview'
import type {
  TexturePreviewChannels,
  TexturePreviewProjection,
} from '../../../graphics/passes/texture/TexturePreview.wgsl'
import type { NwViewer } from '../../../viewer'
import { EngineSurface } from '../../app/EngineSurface'
import { loadDds, type DdsTexture } from './dds'
import type { ViewContext } from './registry'

const CHANNELS: { value: TexturePreviewChannels; label: string; title: string }[] = [
  { value: 'rgba', label: 'RGBA', title: 'Color over a checkerboard by alpha' },
  { value: 'rgb', label: 'RGB', title: 'Color, alpha ignored' },
  { value: 'r', label: 'R', title: 'Red channel' },
  { value: 'g', label: 'G', title: 'Green channel' },
  { value: 'b', label: 'B', title: 'Blue channel' },
  { value: 'alpha', label: 'A', title: 'Alpha (or the .dds.a texture)' },
]

const PROJECTIONS: { value: TexturePreviewProjection; label: string; title: string }[] = [
  { value: 'sphere', label: 'Sphere', title: 'The cubemap on a sphere, by direction. Drag to rotate.' },
  { value: 'cube', label: 'Cube', title: 'The cubemap on a cube, by direction. Drag to rotate.' },
  { value: 'faces', label: 'Faces', title: 'One face at a time' },
]

const ZOOM_STEP = 1.15

/**
 * A `.dds` (or `.dds.a`) rendered by the engine: mip, face or slice, channels, fit, 1:1, wheel zoom at the cursor and
 * drag to pan. The texture is assembled from its split files in the frontend (D6) and uploaded as stored.
 *
 * @remarks
 * The engine shows one content at a time (D5): showing a texture unloads the level, the viewer opens it again. The
 * GPU texture exists only while the mode is shown, the assembled file stays loaded with the tab.
 */
export default function TextureMode(props: { ctx: ViewContext; shown: boolean }) {
  // tabs restored at startup mount their mode hidden: the files are read once the mode is shown
  const [wasShown, setWasShown] = createSignal(false)
  createEffect(() => props.shown && setWasShown(true))
  const [dds] = createResource(
    () => wasShown() && props.ctx.path,
    (path) => loadDds(path),
  )
  const facts = createMemo(() => (dds() ? describeDds(dds(), props.ctx.path) : null))

  const [mip, setMip] = createSignal(0)
  const [layer, setLayer] = createSignal(0)
  const [channels, setChannels] = createSignal<TexturePreviewChannels>('rgba')
  // cubemaps: one face at a time, or on a sphere or a cube
  const [projection, setProjection] = createSignal<TexturePreviewProjection>('sphere')
  // encode linear values for the display, the default follows the format
  const [encode, setEncode] = createSignal<boolean | null>(null)
  const [error, setError] = createSignal<string | null>(null)

  let viewer: NwViewer | null = null
  let preview: TexturePreview | null = null

  const release = () => {
    preview?.dispose()
    preview = null
  }

  // creates the GPU texture when the engine runs and the file is assembled, shows it
  const show = () => {
    const texture = dds()
    if (!viewer || !texture || !props.shown) {
      return
    }
    if (!preview) {
      try {
        preview = viewer.createTexturePreview({
          name: props.ctx.path,
          color: texture.color.data,
          alpha: texture.alpha?.data,
          normalMap: isNormalMap(props.ctx.path),
        })
        setError(null)
      } catch (e) {
        setError(String((e as Error)?.message ?? e))
        return
      }
    }
    applyState()
    viewer.showTexture(preview)
  }

  const applyState = () => {
    if (!preview) {
      return
    }
    preview.state.mip = mip()
    preview.state.layer = layer()
    preview.state.channels = channels()
    preview.state.encode = encode() ?? preview.info.linear
    preview.state.projection = projection()
  }

  createEffect(() => {
    // the controls
    mip(), layer(), channels(), encode(), projection()
    applyState()
  })

  const fit = () => {
    preview?.fit()
    preview?.resetRotation()
  }
  createEffect(() => {
    if (dds() && props.shown) {
      show()
    }
  })
  onCleanup(release)

  const onRunning = (it: NwViewer) => {
    viewer = it
    show()
  }
  const onDetach = () => {
    // hidden or closed: the next surface decides what the engine shows, the texture goes
    release()
  }

  // wheel zoom at the cursor, drag to pan, double click fits
  let drag: { x: number; y: number } | null = null
  const onWheel = (e: WheelEvent) => {
    e.preventDefault()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    preview?.zoomAt(
      (e.clientX - rect.left) / rect.width,
      (e.clientY - rect.top) / rect.height,
      e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP,
    )
  }
  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) {
      return
    }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    drag = { x: e.clientX, y: e.clientY }
  }
  const onPointerMove = (e: PointerEvent) => {
    if (!drag) {
      return
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const fx = (e.clientX - drag.x) / rect.width
    const fy = (e.clientY - drag.y) / rect.height
    // a cubemap on a sphere or a cube turns, everything else moves
    if (preview?.isProjected) {
      preview.rotateBy(fx, fy)
    } else {
      preview?.panBy(fx, fy)
    }
    drag = { x: e.clientX, y: e.clientY }
  }
  const onPointerUp = () => {
    drag = null
  }

  return (
    <Switch
      fallback={
        <div class="nw-empty">
          <p class="nw-note">Assembling the texture…</p>
        </div>
      }
    >
      <Match when={dds.error}>
        <div class="nw-empty">
          <p class="nw-note">The texture could not be assembled: {String(dds.error?.message ?? dds.error)}</p>
        </div>
      </Match>
      <Match when={facts()}>
        {(tex) => (
          <div class="nw-texture">
            <div class="nw-view-bar">
              <ButtonGroup>
                <For each={CHANNELS}>
                  {(c) => (
                    <Button ghost active={channels() === c.value} title={c.title} onClick={() => setChannels(c.value)}>
                      {c.label}
                    </Button>
                  )}
                </For>
              </ButtonGroup>
              <Show when={tex().mips > 1}>
                <ScalarInput
                  class="nw-texture-slider"
                  value={mip()}
                  min={0}
                  max={tex().mips - 1}
                  step={1}
                  decimals={0}
                  range
                  slotBefore={<span class="nw-texture-label">mip</span>}
                  unit={mipSize(tex(), mip())}
                  onInput={(value) => setMip(Math.round(value))}
                />
              </Show>
              <Show when={tex().cubemap}>
                <ButtonGroup>
                  <For each={PROJECTIONS}>
                    {(p) => (
                      <Button
                        ghost
                        active={projection() === p.value}
                        title={p.title}
                        onClick={() => setProjection(p.value)}
                      >
                        {p.label}
                      </Button>
                    )}
                  </For>
                </ButtonGroup>
              </Show>
              <Show when={layerCount(tex(), projection()) > 1}>
                <ScalarInput
                  class="nw-texture-slider"
                  value={layer()}
                  min={0}
                  max={layerCount(tex(), projection()) - 1}
                  step={1}
                  decimals={0}
                  range
                  slotBefore={<span class="nw-texture-label">{tex().cubemap ? 'face' : 'slice'}</span>}
                  onInput={(value) => setLayer(Math.round(value))}
                />
              </Show>
              <ButtonGroup>
                <Button ghost title="Fit into the view and reset the rotation (double click)" onClick={fit}>
                  Fit
                </Button>
                <Button ghost title="One texel per pixel" onClick={() => preview?.actualSize()}>
                  1:1
                </Button>
                <Button
                  ghost
                  active={encode() ?? tex().linear}
                  title="The values are linear: encode them for the display (on for sRGB and float formats)"
                  onClick={() => setEncode(!(encode() ?? tex().linear))}
                >
                  sRGB
                </Button>
              </ButtonGroup>
              <span class="nw-texture-info nw-push-end">{describe(tex())}</span>
            </div>
            <EngineSurface class="nw-texture-surface" active={props.shown} onRunning={onRunning} onDetach={onDetach}>
              <Show when={error()}>
                <div class="nw-empty nw-texture-error">
                  <p class="nw-note">The texture can not be shown: {error()}</p>
                </div>
              </Show>
              <div
                class="nw-texture-input"
                onWheel={onWheel}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onDblClick={fit}
              />
            </EngineSurface>
          </div>
        )}
      </Match>
    </Switch>
  )
}

/**
 * What the toolbar tells about a texture, from the header of the assembled file
 */
interface TextureFacts {
  formatName: string
  width: number
  height: number
  mips: number
  depth: number
  cubemap: boolean
  volume: boolean
  linear: boolean
  parts: number
  dropped: number
  alpha: boolean
  normalMap: boolean
}

function describeDds(texture: DdsTexture, path: string): TextureFacts {
  const info = texture.color.info
  const formatName = (DDS.DXGI_FORMAT[info.format] ?? String(info.format)).replace(/^DXGI_FORMAT_/, '')
  return {
    formatName,
    width: info.width,
    height: info.height,
    mips: info.mipCount,
    depth: info.isVolume ? info.depth : 1,
    cubemap: info.isCubemap,
    volume: info.isVolume,
    linear: /SRGB|FLOAT|BC6H/.test(formatName),
    parts: texture.color.parts,
    dropped: texture.color.dropped,
    alpha: !!texture.alpha,
    normalMap: isNormalMap(path) && /^(BC5|R8G8_)/.test(formatName),
  }
}

/**
 * The layers the slider scrubs: the faces of a cubemap shown face by face, the slices of a volume
 */
function layerCount(tex: TextureFacts, projection: TexturePreviewProjection) {
  if (tex.cubemap) {
    return projection === 'faces' ? 6 : 1
  }
  return tex.depth
}

function isNormalMap(path: string) {
  return /_ddna?\.dds$/i.test(path)
}

function mipSize(tex: TextureFacts, mip: number) {
  return `${Math.max(tex.width >> mip, 1)}×${Math.max(tex.height >> mip, 1)}`
}

function describe(tex: TextureFacts) {
  const parts = [tex.formatName, `${tex.width}×${tex.height}`, `${tex.mips} mips`]
  if (tex.cubemap) {
    parts.push('cubemap')
  }
  if (tex.volume) {
    parts.push(`${tex.depth} slices`)
  }
  if (tex.parts) {
    parts.push(`${tex.parts} split mips`)
  }
  if (tex.alpha) {
    parts.push('alpha from .dds.a')
  }
  if (tex.normalMap) {
    parts.push('normal map, z reconstructed')
  }
  if (tex.dropped) {
    parts.push(`${tex.dropped} small mips missing`)
  }
  return parts.join(' · ')
}
