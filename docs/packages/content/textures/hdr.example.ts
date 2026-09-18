import { ContentLoader } from '@gglib/content'
import { Color, createDevice, PlatformId, SpriteBatch } from '@gglib/graphics'
import { HDR, TGA } from '@gglib/loaders'

export default async (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const device = await createDevice({ canvas, platform, autosize: true }).ready

  const content = new ContentLoader(device)
  content.registerLoader(HDR.Loader)
  const textures = await Promise.all(
    [
      '/textures/hdr/footprint_court.hdr',
      '/textures/hdr/cannon_exterior.hdr',
      '/textures/hdr/overcast_puresky.hdr',
      '/textures/hdr/memorial.hdr',
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
    const pad = 0
    for (let i = 0; i < textures.length; i++) {
      const row = Math.floor(i / cols)
      const col = i % cols
      const texture = textures[i]
      spriteBatch.next(texture).destination(col * cellW + pad, row * cellH + pad, cellW - 2 * pad, cellH - 2 * pad)
    }
    spriteBatch.draw()

    pass.flush()
  }

  device.schedule(frame)
  return () => {
    device.dispose()
  }
}
