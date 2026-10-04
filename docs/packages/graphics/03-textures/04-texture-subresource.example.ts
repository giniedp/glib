import { Color, createDevice, Device, PlatformId, SamplerState, SpriteBatch } from '@gglib/graphics'
import { mountUi } from 'tweak-ui'

const settings = {
  sampler: SamplerState.PointClamp,
  range: 'single' as 'single' | 'chain',
}

export default async (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const device: Device = await createDevice({ canvas, platform, autosize: true }).ready

  const spriteBatch = new SpriteBatch(device)

  // The mip chain is allocated when the texture is created, so pass the
  // image size up front. A 1024x1024 texture has 11 mip levels (1024 ... 1).
  // `generateMipmap` fills the smaller levels once the image is loaded.
  const texture = device.createTexture({
    width: 1024,
    height: 1024,
    generateMipmap: true,
    source: '/textures/formats/uv_checker.png',
  })

  mountUi(tools, (ui) => {
    ui.select(settings, 'sampler', {
      options: [
        { value: SamplerState.PointClamp, label: 'Point + Clamp' },
        { value: SamplerState.LinearClamp, label: 'Linear + Clamp' },
        { value: SamplerState.LinearClampNoMipMap, label: 'Linear + Clamp (no mip filter)' },
      ],
    })
    ui.select(settings, 'range', {
      label: 'Mip range',
      options: [
        { value: 'single', label: 'Single level' },
        { value: 'chain', label: 'Level to end of chain' },
      ],
    })
  })

  const pass = device.renderPass
  function frame() {
    const levels = texture.mipLevelCount
    const cols = Math.ceil(Math.sqrt(levels))
    const rows = Math.ceil(levels / cols)
    const size = Math.floor(Math.min(device.output.width / cols, device.output.height / rows))
    const offsetX = Math.floor((device.output.width - size * cols) / 2)
    const offsetY = Math.floor((device.output.height - size * rows) / 2)
    const gap = 4

    spriteBatch.sampler = settings.sampler
    spriteBatch.begin()
    for (let level = 0; level < levels; level++) {
      // `subresource(baseMipLevel, mipLevelCount)` returns a view on a
      // range of mip levels. In the shader, mip 0 of the view is
      // `baseMipLevel` of the texture. Views are cached by the texture,
      // calling this every frame returns the same instance.
      //
      // - 'single': exactly one level, the sampler can not pick another one
      // - 'chain': the level and all smaller ones, so a sampler with a mip
      //   filter may still select a smaller level when the cell is small
      const view = settings.range === 'single' ? texture.subresource(level, 1) : texture.subresource(level)

      // The sprite batch accepts a view wherever it accepts a texture.
      // Sprites with different views are drawn in separate batches.
      const col = level % cols
      const row = Math.floor(level / cols)
      spriteBatch
        .next(view)
        .destination(offsetX + col * size + gap, offsetY + row * size + gap, size - 2 * gap, size - 2 * gap)
    }

    pass.setClearColor(0, Color.CornflowerBlue)
    pass.clear()
    pass.render(spriteBatch)
    pass.submit()
    pass.flush()
  }

  device.schedule(frame)
  return () => {
    device.dispose()
  }
}
