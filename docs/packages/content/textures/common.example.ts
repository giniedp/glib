import { ContentLoader } from '@gglib/content'
import { Color, createDevice, PlatformId, SpriteBatch, Texture } from '@gglib/graphics'
import { mountUi, redrawUi } from 'tweak-ui'

export default async (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const device = await createDevice({ canvas, platform, autosize: true }).ready

  const content = new ContentLoader(device)

  const data = { texture: device.defaultTexture }
  attachUI(tools, data, (url) => {
    content
      .loadTexture(url)
      .then((result) => {
        data.texture = result
        redrawUi()
      })
      .catch((e) => {
        console.error(e)
      })
  })

  const spriteBatch = new SpriteBatch(device)
  const pass = device.renderPass
  function frame() {
    pass.setClearColor(0, Color.TransparentBlack)
    pass.clear()

    const texture = data.texture
    const aspect = texture.width / texture.height
    const width = device.output.height * aspect
    const height = device.output.height
    spriteBatch.begin()
    spriteBatch.next(texture).destination((device.output.width - width) / 2, 0, width, height)
    spriteBatch.draw()

    pass.flush()
  }

  device.scheduler.schedule(frame)
  return () => {
    device.dispose()
  }
}

const files = {
  Castle: '/textures/backgrounds/colored_castle.png',
}
const params = {
  texture: files.Castle,
}

function attachUI(element: HTMLElement, data: { texture: Texture }, load: (url: string) => void) {
  mountUi(element, (ui) => {
    load(params.texture)
    ui.select(params, 'texture', {
      options: files,
      onchange: () => load(params.texture),
    })
    ui.group('Texture', () => {
      ui.string(params, 'texture', {
        label: 'Size',
        readonly: true,
        binding: {
          get: () => `${data.texture.width} x ${data.texture.height}`,
        },
      })
      ui.string(params, 'texture', {
        label: 'Format',
        readonly: true,
        binding: {
          get: () => String(data.texture?.format),
        },
      })
      ui.string(params, 'texture', {
        label: 'Mip levels',
        readonly: true,
        binding: {
          get: () => String(data.texture?.mipLevelCount),
        },
      })
      ui.string(params, 'texture', {
        label: 'Size in bytes',
        readonly: true,
        binding: {
          get: () => String(data.texture?.sizeInBytes),
        },
      })
    })
  })
}
