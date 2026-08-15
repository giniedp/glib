import { BlendState, Color, createDevice, Device, PlatformId, SpriteBatch } from '@gglib/graphics'
import { vec4 } from '@gglib/math'
import { mountUi } from 'tweak-ui'

export default async function run(canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) {
  const device: Device = await createDevice({ canvas, platform, autosize: true }).ready

  const spriteBatch = new SpriteBatch(device)
  const texture = device.createTexture({
    source: '/textures/particles/whitePuff00.png',
  })

  const settings = {
    blend: BlendState.Additive,
    alpha: 0.8,
  }

  mountUi(tools, (ui) => {
    ui.select(settings, 'blend', {
      options: [
        { value: BlendState.Disabled, label: 'Disabled' },
        { value: BlendState.Alpha, label: 'Alpha' },
        { value: BlendState.Additive, label: 'Additive' },
        { value: BlendState.AlphaPremultiplied, label: 'AlphaPremultiplied' },
      ],
    })
    ui.scalar(settings, 'alpha', { range: true, min: 0, max: 1, step: 0.01 })
  })

  // A cluster of overlapping star sprites in different colors - a good
  // stress test for blend modes, since every overlap area shows the
  // difference immediately.
  const sprites = [
    { x: 0.38, y: 0.35, size: 0.34, color: Color.Red },
    { x: 0.55, y: 0.4, size: 0.34, color: Color.LimeGreen },
    { x: 0.47, y: 0.58, size: 0.34, color: Color.CornflowerBlue },
  ]

  const pass = device.renderPass
  function frame() {
    const w = device.output.width
    const h = device.output.height

    spriteBatch.begin()
    for (const sprite of sprites) {
      spriteBatch
        .next(texture)
        .source(0, 0, texture.width, texture.height)
        .destination(
          sprite.x * w - (sprite.size * w) / 2,
          sprite.y * h - (sprite.size * h) / 2,
          sprite.size * w,
          sprite.size * h,
        )
        .tint(
          vec4(
            sprite.color.x * settings.alpha,
            sprite.color.y * settings.alpha,
            sprite.color.z * settings.alpha,
            settings.alpha,
          ),
        )
    }

    pass.setClearColor(0, Color.Black)
    pass.clear()
    // The blend state is set like any other draw call - `SpriteBatch` does
    // not force a particular mode, it just queues geometry.
    pass.setRenderBlend(0, settings.blend)
    pass.render(spriteBatch)
    pass.submit()
    pass.flush()
  }

  device.scheduler.schedule(frame)
  return () => {
    device.dispose()
  }
}
