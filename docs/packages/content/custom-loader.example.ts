import { AssetContainer, AssetLoader, ContentLoader, LoaderContext } from '@gglib/content'
import {
  CommonMaterial,
  buildBox,
  Color,
  CommonMaterialProps,
  createDevice,
  CullState,
  DepthState,
  GeometryBuilder,
  MaterialOptions,
  PlatformId,
  TaskContext,
  TextureOptions,
} from '@gglib/graphics'
import { DEGREE_TO_RAD, Mat4 } from '@gglib/math'
import { Model, ModelOptions } from '@gglib/model'
import { mountUi } from 'tweak-ui'

export default async (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const device = await createDevice({ canvas, platform, autosize: true }).ready
  const content = new ContentLoader(device)

  // Register our custom loader. All matching criteria is exposed
  // as static properties on the PixelsLoader class
  content.registerLoader(PixelsLoader)

  // enforce CommonMaterial
  content.registerMaterial(CommonMaterial, () => true)

  // Hardcoded options that we can pick from for this demo
  const assets = ['/megaman.pixels', '/sonic.pixels', '/mario.pixels']
  const scene = {
    model: null! as Model,
  }

  // loadModel will be called with one of the asset paths
  function loadModel(path: string) {
    content
      .loadModel(path, {
        // For demonstraion purposes enforce a type, that will be matched against all
        // registered loaders. Not needed here, since the path already contains
        // the .pixels extension which would be used otherwise
        type: '.pixels',
      })
      .then((result) => {
        scene.model = result
      })
  }

  // load initial asset and mount the ui options
  loadModel(assets[0])
  mountUi(tools, (ui) => {
    ui.select({ model: assets[0] }, 'model', {
      options: assets,
      onchange: (_, value) => loadModel(value),
    })
  })

  // everything else is just common scene rendering procedure
  const world = Mat4.createIdentity()
  const view = Mat4.createIdentity()
  const proj = Mat4.createIdentity()
  const cam = Mat4.createIdentity()

  const msaaDepth = device.createDepthTarget({
    width: device.output.width,
    height: device.output.height,
    format: 'DEPTH24_PLUS_STENCIL8',
    sampleCount: 4,
  })
  const msaaColor = device.createRenderTarget({
    width: device.output.width,
    height: device.output.height,
    format: device.output.format,
    sampleCount: 4,
  })

  const pass = device.renderPass
  function frame(ctx: TaskContext) {
    let time2pi = ctx.time * 2 * Math.PI

    msaaColor.resizeToMatch(device.output)
    msaaDepth.resizeToMatch(device.output)

    cam.initTranslationXYZ(0, 0, 30)
    view.initFrom(cam).invert()
    proj.initPerspectiveFieldOfView(60 * DEGREE_TO_RAD, device.output.aspectRatio, 0.1, 100, device.ndcMinZ)

    if (scene.model) {
      world.initRotationY(time2pi / 5000)
      for (const mesh of scene.model.meshes) {
        for (const material of mesh.materials) {
          const mtl = material as CommonMaterial
          mtl.World = world
          mtl.View = view
          mtl.Projection = proj
          mtl.CameraPosition = cam.getTranslation()
        }
      }
    }

    pass.setRenderTarget(0, msaaColor, 0, 0, device.output)
    pass.setDepthTarget(msaaDepth)
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.setClearDepth(1)
    pass.clear()
    pass.setDepthState(DepthState.LessEqual)
    pass.setCullState(CullState.CullBack)

    if (scene.model) {
      scene.model.draw()
    }

    pass.submit()
    pass.resolve()
    pass.flush()
  }

  device.scheduler.schedule(frame)
  return () => {
    device.dispose()
  }
}

export class PixelsLoader implements AssetLoader {
  // the file extensions that this loader is able to handle
  public static extensions = ['.pixels']

  // optionally we could match against mime types
  public static mimeTypes = []

  // the loader factory that will be called once for every load request
  public static create = () => new PixelsLoader()

  public async load(url: string, context: LoaderContext): Promise<AssetContainer> {
    // Usually we would fetch the file from the network like this:
    //
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

    // The loader is only responsible for fetching data and creating an asset container.
    // Here we just pass the loaded data to PixelsContainer for further processing
    return new PixelsContainer(input)
  }
}

export class PixelsContainer extends AssetContainer {
  public modelCount = 0
  public materialCount = 0
  public textureCount = 0

  private data: string
  public constructor(data: string) {
    super()
    this.data = data
  }

  public async loadModel(index: number, context: LoaderContext): Promise<ModelOptions> {
    // lookup map for colors
    const colorMap: Record<string, Color> = {
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

    const colors: Color[] = []
    const builders: GeometryBuilder[] = []
    const materials: MaterialOptions[] = []

    const transform = Mat4.createIdentity()
    const rows = this.data.split('\n')
    rows.forEach((row, y) => {
      const cols = row.trim().split('')
      return cols.forEach((col, x) => {
        const color = colorMap[col]
        if (!color) {
          return
        }
        if (!colors.includes(color)) {
          colors.push(color)
          builders.push(new GeometryBuilder({ layout: [['position', 'normal', 'texture']] }))
          materials.push({
            properties: {
              BaseColor: color.toVec4(),
            } satisfies CommonMaterialProps,
          })
        }
        const index = colors.indexOf(color)
        const builder = builders[index]
        transform.initTranslationXYZ(
          x - cols.length / 2 + 0.5 + x * gap,
          rows.length - y - rows.length / 2 + 0.5 - y * gap,
          0,
        )
        builder.withTransform(transform, () => {
          buildBox(builder, { size: 1 })
        })
      })
    })

    return {
      meshes: [
        {
          materials: materials,
          partImports: builders.map((it, index) => {
            return {
              geometry: it.toGeometryOptions()!,
              materialIndex: index,
            }
          }),
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

  public loadMaterial(index: number, context: LoaderContext): Promise<MaterialOptions> {
    // this container does not provide materials
    throw new Error('Method not implemented.')
  }

  public loadTexture(index: number, context: LoaderContext): Promise<TextureOptions> {
    // this container does not provide textures
    throw new Error('Method not implemented.')
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
