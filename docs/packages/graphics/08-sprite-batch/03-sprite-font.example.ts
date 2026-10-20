import {
  BlendState,
  Color,
  createDevice,
  createSpriteFont,
  Device,
  PlatformId,
  SpriteBatch,
  SpriteFont,
} from '@gglib/graphics'
import { vec4 } from '@gglib/math'
import { mount } from 'tweak-ui'

export default async (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const device: Device = await createDevice({ canvas, platform, autosize: true }).ready
  const spriteBatch = new SpriteBatch(device)

  const settings = {
    text: 'Hello SpriteFont!\nThe quick brown fox\njumps over the lazy dog.',
    family: 'sans-serif',
    size: 32,
    bold: false,
    outline: 0,
    kerning: true,
    spacing: 0,
    scale: 1,
    rotation: 0,
    centered: true,
    showBounds: false,
  }

  // a 1x1 white texture to draw the measured bounds
  const white = device.createTexture({
    source: Color.toByteArray(Color.White),
    width: 1,
    height: 1,
    format: 'rgba8unorm',
  })

  // the glyphs are generated with canvas, so the font has to be generated again when its look changes
  let font: SpriteFont | null = null
  let version = 0
  async function generateFont() {
    const current = ++version
    const next = await createSpriteFont(device, {
      family: settings.family,
      size: settings.size,
      weight: settings.bold ? 'bold' : undefined,
      kerning: settings.kerning,
      outline: settings.outline > 0 ? { width: settings.outline, color: '#000' } : undefined,
    })
    if (current !== version) {
      next.dispose()
      return
    }
    font?.dispose()
    font = next
  }
  await generateFont()

  const panel = mount(tools, (ui) => {
    ui.text(settings, 'text')
    ui.select(settings, 'family', {
      options: ['sans-serif', 'serif', 'monospace', 'cursive', 'Georgia', 'Courier New'].map((it) => ({
        value: it,
        label: it,
      })),
      onChange: generateFont,
    })
    ui.scalar(settings, 'size', { range: true, min: 8, max: 96, step: 1, onChange: generateFont })
    ui.bool(settings, 'bold', { onChange: generateFont })
    ui.bool(settings, 'kerning', { onChange: generateFont })
    ui.scalar(settings, 'outline', { range: true, min: 0, max: 6, step: 0.5, onChange: generateFont })
    ui.scalar(settings, 'spacing', { range: true, min: -4, max: 16, step: 0.5 })
    ui.scalar(settings, 'scale', { range: true, min: 0.25, max: 4, step: 0.01 })
    ui.scalar(settings, 'rotation', { range: true, min: -Math.PI, max: Math.PI, step: 0.01 })
    ui.bool(settings, 'centered', { label: 'Origin at center' })
    ui.bool(settings, 'showBounds', { label: 'Show measured bounds' })
  })

  const textColor = vec4(1, 0.85, 0.3, 1)
  const boundsColor = vec4(1, 1, 1, 0.15)
  const pass = device.renderPass
  function frame() {
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.clear()
    if (!font) {
      return
    }
    font.spacing = settings.spacing

    // like XNA: the origin is in unscaled text pixels and is placed at the given position
    const size = font.measureString(settings.text)
    const originX = settings.centered ? size.x / 2 : 0
    const originY = settings.centered ? size.y / 2 : 0
    const x = device.output.width / 2
    const y = device.output.height / 2

    spriteBatch.begin()
    if (settings.showBounds) {
      const left = x - originX * settings.scale
      const top = y - originY * settings.scale
      const width = size.x * settings.scale
      const height = size.y * settings.scale
      spriteBatch
        .next(white)
        .destination(left, top, width, height, 0, settings.rotation, (x - left) / width, (y - top) / height)
        .tint(boundsColor)
    }
    spriteBatch.drawString(font, settings.text, x, y, textColor, {
      originX,
      originY,
      scale: settings.scale,
      rotation: settings.rotation,
    })
    spriteBatch.end()

    pass.setRenderBlend(0, BlendState.Alpha)
    pass.render(spriteBatch)
    pass.submit()
    pass.flush()
  }

  device.schedule(frame)
  return () => {
    panel.dispose()
    font?.dispose()
    device.dispose()
  }
}
