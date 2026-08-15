import { Color, createDevice, Device, PlatformId, SpriteBatch } from '@gglib/graphics'

export default async function run(canvas: HTMLCanvasElement, _: any, platform: PlatformId) {
  const device: Device = await createDevice({ canvas, platform, autosize: true }).ready

  // `SpriteBatch` owns its own shader and geometry internally - there is
  // no vertex buffer or shader module to create by hand for 2D sprites.
  const spriteBatch = new SpriteBatch(device)
  const texture = device.createTexture({
    source: '/textures/TextureCoordinateTemplate.png',
  })

  const pass = device.renderPass
  function frame() {
    const w = device.output.width
    const h = device.output.height

    // `begin()` resets the batch. Every `next()` call below queues one
    // sprite - nothing is actually drawn until `pass.render(spriteBatch)`
    // at the end of the frame.
    spriteBatch.begin()

    // The whole texture, placed in the top-left quarter of the canvas.
    spriteBatch
      .next(texture)
      .source(0, 0, texture.width, texture.height)
      .destination(20, 20, w / 2 - 40, h / 2 - 40)

    // `source` crops to a sub-rectangle of the texture - here, just its
    // top-left quarter - while `destination` still places and sizes it
    // freely on screen.
    spriteBatch
      .next(texture)
      .source(0, 0, texture.width / 2, texture.height / 2)
      .destination(w / 2 + 20, 20, w / 2 - 40, h / 2 - 40)

    // `destination` also accepts a rotation angle (in radians) and a pivot
    // point, given as 0..1 fractions of the sprite's own size.
    spriteBatch
      .next(texture)
      .source(0, 0, texture.width, texture.height)
      .destination(20, h / 2 + 20, w / 2 - 40, h / 2 - 40, 0, Math.PI / 8, 0.5, 0.5)

    // `tint` multiplies every pixel of the sprite by a color.
    spriteBatch
      .next(texture)
      .source(0, 0, texture.width, texture.height)
      .destination(w / 2 + 20, h / 2 + 20, w / 2 - 40, h / 2 - 40)
      .tint(Color.Orange)

    pass.setClearColor(0, Color.CornflowerBlue)
    pass.clear()
    pass.render(spriteBatch)
    pass.submit()
    pass.flush()
  }

  device.scheduler.schedule(frame)
  return () => {
    device.dispose()
  }
}
