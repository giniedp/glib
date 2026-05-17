import { AssetContainer, AssetLoader, ContentLoader, LoaderContext } from '@gglib/content'
import {
  BasicMaterial,
  beginGeometry,
  buildCube,
  Color,
  createDevice,
  LightType,
  MaterialOptions,
  PlatformId,
  TaskContext,
} from '@gglib/graphics'
import { LightParams } from '@gglib/materials'
import { Mat4 } from '@gglib/math'
import { Model } from '@gglib/model'
import { mountUi, redrawUi } from 'tweak-ui'

export default async (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const device = await createDevice({ canvas, platform }).ready
  const content = new ContentLoader(device)
  content.registerLoader(PixelsLoader)
  content.registerMaterial(BasicMaterial, () => true)

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

  const pass = device.renderPass
  function frame(ctx: TaskContext) {
    device.resize()
    let time2pi = ctx.time * 2 * Math.PI

    cam.initTranslationXYZ(0, 0, 30)
    view.initFrom(cam).invert()
    proj.initPerspectiveFieldOfView(Math.PI / 2, device.output.aspectRatio, 1, 1000, device.ndcMinZ)

    if (model) {
      world.initRotationY(time2pi / 5000)
      for (const mesh of model.meshes) {
        for (const material of mesh.materials) {
          const mtl = material as BasicMaterial
          mtl.World = world
          mtl.View = view
          mtl.Projection = proj
          mtl.CameraPosition = cam.getTranslation()
        }
      }
    }

    redrawUi()

    pass.flush()
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.clear()

    if (model) {
      model.draw()
    }
    pass.submit()
  }

  let assets = ['/megaman.pixels', '/sonic.pixels', '/mario.pixels']
  function loadModel(path: string) {
    content.loadModel(path).then((result) => {
      model = result
    })
  }
  loadModel(assets[0])

  mountUi(tools, (ui) => {
    ui.select({ model: assets[0] }, 'model', {
      options: assets,
      onchange: (ctrl: any) => {
        loadModel(ctrl.model)
      },
    })
    // ui.object("GPU Stats", stats)
  })

  device.scheduler.schedule(frame)
  return () => {
    device.dispose()
  }
}

export class PixelsLoader implements AssetLoader {
  public static extensions = ['.pixels']
  public static mimeTypes = []
  public static create = () => new PixelsLoader()

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
      0: Color.fromBytes(0, 0, 0, 255),
      1: Color.fromBytes(255, 0, 0, 255),
      2: Color.fromBytes(0, 255, 0, 255),
      3: Color.fromBytes(255, 255, 0, 255),
      4: Color.fromBytes(0, 0, 255, 255),
      5: Color.fromBytes(255, 0, 255, 255),
      6: Color.fromBytes(0, 255, 255, 255),
      7: Color.fromBytes(255, 255, 255, 255),
    }
    const gap = 0.1

    const builder = beginGeometry({ layout: [['position', 'normal', 'texture']] })
    const transform = Mat4.createIdentity()

    const rows = input.split('\n')
    rows.forEach((row, y) => {
      const cols = row.trim().split('')
      return cols.forEach((col, x) => {
        if (!(col in colorMap)) {
          return
        }
        transform.initTranslationXYZ(
          x - cols.length / 2 + 0.5 + x * gap,
          rows.length - y - rows.length / 2 + 0.5 - y * gap,
          0,
        )
        builder.withTransform(transform, () => {
          // builder.defaults.color = Color.to colorMap[col]
          buildCube(builder, { size: 1 })
        })
      })
    })

    const material: MaterialOptions = {
      properties: {
        // VertexColor: true,
        // LightCount: 1,
      },
    }

    const geometry = builder.calculateNormals().calculateBounds().endGeometry({})!

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
