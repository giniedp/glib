import { SpriteBatch, type Device, type Texture } from '@gglib/graphics'

async function getThumbnail(device: Device, texture: Texture, size = 128): Promise<ImageBitmap> {
  const target = device.createRenderTarget({
    width: size,
    height: size,
    depth: 1,
    format: 'RGBA8_UNORM',
  })

  const spriteBatch = new SpriteBatch(device, {})
  spriteBatch.begin()
  spriteBatch.next(texture)

  const pass = device.renderPass
  pass.setRenderTarget(0, target)
  pass.setViewportState(0, 0, size, size)
  spriteBatch.draw()
  pass.flush()

  const pixels = await target.readPixels(0, 0, size, size)

  return createImageBitmap(new ImageData(pixels as any as Uint8ClampedArray<ArrayBuffer>, size, size))
}
