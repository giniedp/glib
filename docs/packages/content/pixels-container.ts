import { AssetContainer, AssetType, LoadContext } from '@gglib/content'
import { buildBox, Color, CommonMaterialProps, GeometryBuilder, MaterialOptions } from '@gglib/graphics'
import { Mat4 } from '@gglib/math'
import { ModelOptions } from '@gglib/model'

export class PixelsContainer implements AssetContainer {
  private data: string
  public constructor(data: string) {
    this.data = data
  }

  public count(type: AssetType<any, any>): number {
    if (type === AssetType.Model) {
      return 1
    }
    return 0
  }

  public load<T>(type: AssetType<T, any>, index: number, context: LoadContext): Promise<T>
  public load<T>(type: AssetType, index: number, context: LoadContext): Promise<any> {
    if (type !== AssetType.Model) {
      throw new Error(`asset type not supported: ${type}`)
    }
    return parsePixels(this.data)
  }
}

async function parsePixels(data: string): Promise<ModelOptions> {
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
  const rows = data.split('\n')
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
            BaseColor: [color.r, color.g, color.b],
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
