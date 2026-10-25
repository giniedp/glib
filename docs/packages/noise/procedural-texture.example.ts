// #region imports
import { BlendState, Color, createDevice, Device, PlatformId, SpriteBatch } from '@gglib/graphics'
import {
  abs,
  cell,
  color,
  fbm,
  gradient,
  type Field,
  mix,
  mul,
  opaque,
  perlin,
  ProceduralTexture,
  remap,
  rgba,
  ridged,
  scale,
  seamless,
  simplex,
  sin,
  smoothstep,
  uniform,
  warp,
} from '@gglib/noise'
import { mount } from 'tweak-ui'
// #endregion

const SIZE = 512

// every preset maps its output to [0, 1], the texture is rgba8unorm
const PRESETS: Record<string, () => Field<any>> = {
  clouds: () =>
    perlin().pipe(
      fbm({
        octaves: uniform('octaves', 6, { min: 1, max: 12, step: 1 }),
        gain: uniform('gain', 0.5, { min: 0.2, max: 0.8 }),
      }),
      remap(-0.7, 0.7, 0, 1),
    ),
  bands: () =>
    perlin().pipe(fbm({ octaves: 5 }), mul(uniform('bands', 10, { min: 1, max: 30 })), sin(), remap(-1, 1, 0, 1)),
  cells: () => cell({ output: 'f2-f1' }).pipe(smoothstep(0, uniform('border', 0.08, { min: 0.01, max: 0.5 }))),
  ridges: () =>
    perlin().pipe(ridged({ octaves: 6, gain: uniform('gain', 0.5, { min: 0.2, max: 0.8 }) }), remap(0.3, 1.9, 0, 1)),
  warped: () =>
    simplex().pipe(fbm({ octaves: 4 }), abs(), warp(perlin().pipe(scale(0.5)), uniform('warp', 1, { min: 0, max: 3 }))),

  // colored presets: a gradient maps the value to colors, its stop positions are uniforms
  sky: () =>
    perlin().pipe(
      fbm({ octaves: 6 }),
      remap(-0.7, 0.7, 0, 1),
      gradient([
        [0, '#1b3a6b'],
        [uniform('clouds', 0.5, { min: 0, max: 0.95 }), '#5b8fd6'],
        [1, '#ffffff'],
      ]),
    ),
  lava: () =>
    perlin().pipe(
      ridged({ octaves: 6 }),
      remap(0.3, 1.9, 0, 1),
      gradient([
        [0, '#000000'],
        [0.4, '#5a0a00'],
        [uniform('glow', 0.75, { min: 0.45, max: 0.95 }), '#ff4500'],
        [1, '#ffe680'],
      ]),
    ),
  'terrain map': () =>
    perlin().pipe(
      fbm({ octaves: 7 }),
      remap(-0.7, 0.7, 0, 1),
      gradient([
        [0, '#0b2f5c'],
        [uniform('water', 0.45, { min: 0.1, max: 0.8 }), '#3d7cc2'],
        [uniform('beach', 0.47, { min: 0.1, max: 0.8 }), '#d8c48f'],
        [0.55, '#4f8a3a'],
        [0.75, '#6b5d4f'],
        [0.85, '#ffffff'],
      ]),
    ),
  // a color mixed in by a field: random colors per region with dark cell borders
  'stained glass': () =>
    rgba(
      perlin().pipe(scale(0.7), remap(-0.7, 0.7, 0, 1)),
      simplex().pipe(scale(0.7), remap(-0.7, 0.7, 0, 1)),
      0.6,
    ).pipe(
      mix(
        color('#101418'),
        cell({ output: 'f2-f1' }).pipe(smoothstep(0, uniform('lead', 0.06, { min: 0, max: 0.3 })), remap(0, 1, 1, 0)),
      ),
    ),
}

const settings = { preset: 'clouds', zoom: 4, seamless: false, tile: false, animate: true, speed: 0.2 }

// grayscale fields have their value in alpha too, the canvas would composite them see-through
function createField() {
  const field = PRESETS[settings.preset]()
  if (!settings.seamless) {
    return field.pipe(opaque())
  }
  // the period follows the region size, the presets are centered around 0.5. Blending the colored result is a
  // shortcut, for the best result apply seamless to the raw noise before remap and gradient, see the PBR material
  return field.pipe(seamless(uniform('period', settings.zoom), { mean: 0.5 }), opaque())
}

export default async (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const device: Device = await createDevice({ canvas, platform, autosize: true }).ready
  const spriteBatch = new SpriteBatch(device)

  let field = createField()
  let dirty = true

  const texture = new ProceduralTexture(device, field, {
    width: SIZE,
    height: SIZE,
    // values outside [0, 1] are clamped, use a float format to keep them
    format: 'rgba8unorm',
    region: [0, 0, settings.zoom, settings.zoom],
  })

  function changePreset() {
    field = createField()
    // compiles a new shader
    texture.field = field
    dirty = true
    remountPanel()
  }

  let panel = mountPanel()
  function remountPanel() {
    panel.dispose()
    panel = mountPanel()
  }
  function mountPanel() {
    const markDirty = () => (dirty = true)
    return mount(tools, (ui) => {
      ui.select(settings, 'preset', { options: Object.keys(PRESETS), onChange: changePreset })
      ui.group('Uniforms', (ui) => {
        // sliders for the scalar uniforms, the colors of these presets are constants
        for (const it of field.uniformList.filter((u) => u.type === 'f32' && u.name !== 'period')) {
          const { min, max, step } = it.options
          ui.scalar(field.params, it.name, { range: true, min, max, step: step ?? 0.01, onInput: markDirty })
        }
      })
      ui.group('Texture', (ui) => {
        ui.scalar(settings, 'zoom', {
          label: 'Region size',
          range: true,
          min: 0.5,
          max: 16,
          step: 0.1,
          onInput: markDirty,
        })
        ui.bool(settings, 'seamless', { onChange: changePreset })
        ui.bool(settings, 'tile', { label: 'Show 2 x 2' })
        ui.bool(settings, 'animate', { label: 'Animate z' })
        ui.scalar(settings, 'speed', { range: true, min: 0, max: 1, step: 0.01 })
      })
    })
  }

  const pass = device.renderPass
  device.schedule((ctx) => {
    if (settings.animate) {
      // the z coordinate moves through the 3D noise, the texture is rendered again every frame
      texture.z += ctx.delta * settings.speed
      dirty = true
    }
    if (dirty) {
      texture.region = [0, 0, settings.zoom, settings.zoom]
      if ('period' in field.params) {
        field.params.period = settings.zoom
      }
      // draws into the texture and flushes the pass. false while the shader compiles
      dirty = !texture.update(pass)
    }

    pass.setClearColor(0, Color.create(0.1, 0.1, 0.12, 1))
    pass.clear()

    // the texture as large square in the center of the canvas
    const size = Math.min(device.output.width, device.output.height) - 40
    const x = (device.output.width - size) / 2
    const y = (device.output.height - size) / 2
    spriteBatch.begin()
    if (settings.tile) {
      // four copies side by side, the seams show unless the field is seamless
      const half = size / 2
      for (let i = 0; i < 4; i++) {
        spriteBatch.next(texture.texture).destination(x + (i % 2) * half, y + Math.floor(i / 2) * half, half, half)
      }
    } else {
      spriteBatch.next(texture.texture).destination(x, y, size, size)
    }
    spriteBatch.end()

    pass.setRenderBlend(0, BlendState.Disabled)
    pass.render(spriteBatch)
    pass.submit()
    pass.flush()
  })

  return () => {
    panel.dispose()
    texture.dispose()
    spriteBatch.dispose()
    device.dispose()
  }
}
