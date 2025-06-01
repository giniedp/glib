import { AssetContainer, AssetLoader, ContentLoader, LoaderContext } from '@gglib/content'
import { beginGeometry } from '@gglib/graphics'
import { STL } from './format'

export function registerLoader() {
  ContentLoader.registerLoader(Loader)
}
export class Loader implements AssetLoader {
  public static extensions = ['.stl']
  public static mimeTypes = []
  public static loader = Loader

  public async load(url: string, context: LoaderContext): Promise<AssetContainer> {
    const response = await context.content.fetch(url, {
      responseType: 'arraybuffer',
    })
    const data = STL.parse(response.body)

    const builder = beginGeometry({
      layout: [['position', 'normal']],
    })
    for (const solid of data.solids) {
      for (const f of solid.facets) {
        if (builder.vertexCount > 65536 - 2) {
          // prettier-ignore
          builder
            .calculateTangents()
            .calculateBoundings()
            .closeGeometry({
              name: solid.name,
              materialId: 0,
            })
        }

        builder.addIndex(builder.vertexCount + 0)
        builder.addIndex(builder.vertexCount + 1)
        builder.addIndex(builder.vertexCount + 2)
        for (const v of f.vertices) {
          builder.addVertex({
            position: [v.x, v.y, v.z],
            normal: [f.normal.x, f.normal.y, f.normal.z],
          })
        }
      }

      // prettier-ignore
      builder
        .calculateTangents()
        .calculateBoundings()
        .closeGeometry({
          name: solid.name,
          materialId: 0,
        })
    }

    builder.closeMesh({
      materials: [
        {
          effectName: 'BasicEffect',
          parameters: {
            Color: [1, 1, 1, 1],
          },
        },
      ],
    })

    return {
      source: url,
      meshes: builder.meshes,
    }
  }
}
