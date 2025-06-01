import { AssetContainer, AssetLoader, ContentLoader, LoaderContext } from '@gglib/content'
import {
  beginGeometry,
  BlendState,
  buildCube,
  Color,
  createDevice,
  CullState,
  DepthState,
  LightType,
  MaterialOptions,
} from '@gglib/graphics'
import { AutoMaterial, LightParams } from '@gglib/materials'
import { Mat4 } from '@gglib/math'
import { Model } from '@gglib/model'
import { loop } from '@gglib/utils'
import * as TweakUi from 'tweak-ui'

export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  const device = createDevice({
    canvas,
  })
  const content = new ContentLoader(device)
  content.registerLoader(PixelsLoader)
  content.registerMaterial({
    name: 'BasicEffect',
    type: AutoMaterial,
  })

  const world = Mat4.createIdentity()
  const view = Mat4.createIdentity()
  const proj = Mat4.createIdentity()
  const cam = Mat4.createIdentity()
  const light = new LightParams()
  light.color = [0.8, 0.8, 0.8]
  light.position = [0, 0, 500]
  light.direction = [0, 0, -1]
  light.type = LightType.Directional
  light.enabled = true

  let model: Model

  function frame(time: number) {
    let time2pi = time * 2 * Math.PI

    device.resize()
    device.cullState = CullState.CullClockWise
    device.depthState = DepthState.Default
    device.blendState = BlendState.Default
    device.clear(0xff2e2620, 1.0)

    cam.initTranslation(0, 0, 30)
    view.initFrom(cam).invert()
    proj.initPerspectiveFieldOfView(Math.PI / 2, device.drawingBufferAspectRatio, 1, 1000)

    if (model) {
      world.initRotationY(time2pi / 5000)

      model.meshes.forEach((mesh) => {
        mesh.materials.forEach((material) => {
          let params = material.parameters

          params.World = world
          params.View = view
          params.Projection = proj
          params.CameraPosition = cam.getTranslation()
          light.assign(0, params)
        })
      })
      model.draw()
    }
  }

  let assets = ['/megaman.pixels', '/sonic.pixels', '/mario.pixels']
  function loadModel(path: string) {
    content.loadModel(path).then((result) => {
      model = result
    })
  }
  loadModel(assets[0])

  TweakUi.mount(tools, (ui) => {
    ui.collapsible('Controls', { collapsed: true }, () => {
      ui.select({ model: assets[0] }, 'model', {
        options: assets,
        onChange: (ctrl) => {
          loadModel(ctrl!.target!.model)
        },
      })
    })
  })

  return loop(frame).stop
}

export class PixelsLoader implements AssetLoader {
  public static extensions = ['.pixels']
  public static mimeTypes = []
  public static loader = PixelsLoader

  public async load(url: string, context: LoaderContext): Promise<AssetContainer> {
    // Usually we would fetch the file from the network like this:
    //   const input = context.content.fetch(url, { responseType: 'text' }).then((response) => response.body)
    //
    // However, in this example we have hardcoded the pixel data
    const input = {
      '/mario.pixels': MARIO,
      '/megaman.pixels': MEGAMAN,
      '/sonic.pixels': SONIC,
    }[url]

    if (!input) {
      throw new Error(`PixelsLoader: No data found for URL: ${url}`)
    }

    // lookup map for colors
    const colorMap = {
      0: Color.rgba(0, 0, 0, 255),
      1: Color.rgba(255, 0, 0, 255),
      2: Color.rgba(0, 255, 0, 255),
      3: Color.rgba(255, 255, 0, 255),
      4: Color.rgba(0, 0, 255, 255),
      5: Color.rgba(255, 0, 255, 255),
      6: Color.rgba(0, 255, 255, 255),
      7: Color.rgba(255, 255, 255, 255),
    }
    const gap = 0.1

    const builder = beginGeometry({ layout: [['position', 'normal', 'color']] })
    const transform = Mat4.createIdentity()

    const rows = input.split('\n')
    rows.forEach((row, y) => {
      const cols = row.trim().split('')
      return cols.forEach((col, x) => {
        if (!(col in colorMap)) {
          return
        }
        transform.initTranslation(
          x - cols.length / 2 + 0.5 + x * gap,
          rows.length - y - rows.length / 2 + 0.5 - y * gap,
          0,
        )
        builder.withTransform(transform, () => {
          builder.defaults.color = colorMap[col]
          buildCube(builder, { size: 1 })
        })
      })
    })

    const material: MaterialOptions = {
      name: 'PixelsMaterial',
      parameters: {
        VertexColor: true,
        LightCount: 1,
      },
      effectName: 'BasicEffect',
      technique: 'default',
    }

    const geometry = builder.calculateNormals().calculateBoundings().endGeometry({})!

    return {
      source: url,
      meshes: [
        {
          boundingBox: geometry.boundingBox,
          boundingSphere: geometry.boundingSphere,
          parts: [geometry!],
          materials: [material],
        },
      ],
      nodes: [
        {
          mesh: 0,
        },
      ],
      scenes: [
        {
          nodes: [0],
        },
      ],
      scene: 0,
    }
  }
}

const MARIO = `
|   11111    |
|  111111111 |
|  2223303   |
| 2323330333 |
| 23223330333|
|  233330000 |
|   333333   |
|  11411411  |
| 1114114111 |
|111144441111|
|331434434133|
|333444444333|
|334444444433|
|  444  444  |
| 222    222 |
|2222    2222|
`.trim()

const MEGAMAN = `
|              000              |
|            000660             |
|           04440660            |
|          0444440000           |
|          04444406640          |
|         064444440040          |
|       00064437774470          |
|     0066064377003070          |
|    06666604377003070   0000   |
|   046666604337773730000444000 |
|   0444606604300003006604666060|
|   0444040660333330666604444040|
|    04404406600000666660444000 |
|     044440666666600000 0000   |
|      044066666660             |
|       0044666660              |
|        044444440              |
|       0644444460              |
|      066644446660             |
|     04666600666440            |
|   00444660  044440            |
| 004444440   0444000           |
|044444440   044444440          |
|000000000   000000000          |
`.trim()

const SONIC = `
|  000000000000   00  |
| 044444444444400040  |
|  04440344444444440  |
|   0440334444444440  |
|    0403444444444440 |
|   04444444477744440 |
|  044444444777774440 |
| 044444444477770470  |
|0000004444477770470  |
|    044444447770 000 |
|   0444443337777330  |
|  04444443333333330  |
| 00000000033333330   |
|        0300000000   |
|       030043330000  |
|      0307703330000  |
|      0077770330770  |
|       07777003070   |
|        077004000    |
|         004000      |
|         00401100    |
|        00110011700  |
|        011171001110 |
|        0117111101110|
|        0000000000000|
`.trim()
