import { ContentLoader } from '@gglib/content'
import { Color, createDevice, PlatformId, SpriteBatch } from '@gglib/graphics'
import { TGA } from '@gglib/loaders'

export default async (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const device = await createDevice({ canvas, platform, autosize: true }).ready

  const content = new ContentLoader(device)
  content.registerLoader(TGA.Loader)

  const textures = await Promise.all(
    [
      '/testimages/tga/avatar.tga',
      '/testimages/tga/cbw8.tga',
      '/testimages/tga/ccm8.tga',
      '/testimages/tga/ctc16.tga',
      '/testimages/tga/ctc24.tga',
      '/testimages/tga/ctc32.tga',
      '/testimages/tga/ubw8.tga',
      '/testimages/tga/ucm8.tga',
      '/testimages/tga/utc16.tga',
      '/testimages/tga/utc24.tga',
      '/testimages/tga/utc32.tga',
    ].map((url) => {
      return content.loadTexture(url)
    }),
  )

  const spriteBatch = new SpriteBatch(device)
  const pass = device.renderPass
  function frame() {
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.clear()

    spriteBatch.begin()

    const rows = 3
    const cols = 4
    const cellW = Math.round(device.output.width / cols)
    const cellH = Math.round(device.output.height / rows)
    for (let i = 0; i < textures.length; i++) {
      const row = Math.floor(i / cols)
      const col = i % cols
      const texture = textures[i]
      spriteBatch.next(texture).destination(col * cellW + 10, row * cellH + 10, cellW - 20, cellH - 20)
    }

    spriteBatch.draw()

    pass.flush()
  }

  device.schedule(frame)
  return () => {
    device.dispose()
  }
}
