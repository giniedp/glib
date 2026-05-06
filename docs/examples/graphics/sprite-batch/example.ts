import { BlendState, Color, createDevice, Device, PlatformId, SpriteBatch } from '@gglib/graphics'
import { Vec4 } from '@gglib/math'
import { mountUi } from 'tweak-ui'
export default async function run(canvas: HTMLCanvasElement, tools: any, platform: PlatformId) {
  const device: Device = await createDevice({ canvas, platform }).ready

  const spriteBatch = new SpriteBatch(device)
  const texture = device.createTexture({
    source: '/textures/TextureCoordinateTemplate.png',
  })

  const settings = {
    pivotX: 0.5,
    pivotY: 0.5,
    flipX: false,
    flipY: false,
    angle: 0,
    color: Vec4.init({}, 1, 1, 1, 1),
    alpha: 1,
  }

  const pass = device.renderPass
  function frame() {
    device.resize()

    spriteBatch.begin()
    spriteBatch
      .next(texture)
      .source(0, 0, texture.width, texture.height)
      .destination(
        0.25 * device.output.width,
        0.25 * device.output.height,
        0.5 * device.output.width,
        0.5 * device.output.height,
        0,
        settings.angle,
        settings.pivotX,
        settings.pivotY,
      )
      .flipX(settings.flipX)
      .flipY(settings.flipY)
      .tint(settings.color)
      .alpha(settings.alpha)

    spriteBatch
      .next(texture)
      .source(0, 0, 0.25 * texture.width, 0.25 * texture.height)
      .destination(0, 0, 0.25 * device.output.width, 0.25 * device.output.height)

    spriteBatch
      .next(texture)
      .source(0.75 * texture.width, 0 * texture.height, 0.25 * texture.width, 0.25 * texture.height)
      .destination(0.75 * device.output.width, 0, 0.25 * device.output.width, 0.25 * device.output.height)

    spriteBatch
      .next(texture)
      .source(0.75 * texture.width, 0.75 * texture.height, 0.25 * texture.width, 0.25 * texture.height)
      .destination(
        0.75 * device.output.width,
        0.75 * device.output.height,
        0.25 * device.output.width,
        0.25 * device.output.height,
      )

    spriteBatch
      .next(texture)
      .source(0, 0.75 * texture.height, 0.25 * texture.width, 0.25 * texture.height)
      .destination(0, 0.75 * device.output.height, 0.25 * device.output.width, 0.25 * device.output.height)
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.clear()
    if (settings.alpha < 1) {
      pass.setRenderBlend(0, BlendState.Alpha)
    } else {
      pass.setRenderBlend(0, BlendState.Disabled)
    }
    pass.render(spriteBatch)
    pass.submit()
    pass.flush()
  }

  mountUi(tools, (ui) => {
    ui.number(settings, 'pivotX', { slider: true, min: 0, max: 1, step: 0.01 })
    ui.number(settings, 'pivotY', { slider: true, min: 0, max: 1, step: 0.01 })
    ui.boolean(settings, 'flipX')
    ui.boolean(settings, 'flipY')
    ui.number(settings, 'angle', { slider: true, min: 0, max: Math.PI * 2, step: 0.001 })
    ui.color(settings, 'color', { format: '[n]rgb' })
    ui.number(settings, 'alpha', { slider: true, min: 0, max: 1, step: 0.01 })
  })
  device.scheduler.schedule(frame)
  return () => {
    device.dispose()
  }
}
