import { ContentLoader } from '@gglib/content'
import { Color, createDevice, PlatformId, SpriteBatch } from '@gglib/graphics'
import { TGA } from '@gglib/loaders'

export default async (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const device = await createDevice({ canvas, platform, autosize: true }).ready

  const content = new ContentLoader(device)
  const textures = await Promise.all(
    [
      '/textures/formats/colored_castle.bmp',
      '/textures/formats/colored_castle.jpg',
      '/textures/formats/colored_castle.png',
      '/textures/formats/colored_castle.webp',
    ].map((url) => {
      return content.loadTexture(url, { color: 'srgb' })
    }),
  )

  const spriteBatch = new SpriteBatch(device)
  const pass = device.renderPass
  function frame() {
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.clear()

    spriteBatch.linearToSrgb = true
    spriteBatch.begin()

    const rows = 2
    const cols = 2
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
