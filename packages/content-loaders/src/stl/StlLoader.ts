import { AssetContainer, AssetLoader, ContentLoader, LoaderContext } from '@gglib/content'
import { PROGRAM_BASIC, beginGeometry } from '@gglib/graphics'
import { STL } from './format'

class STLLoader implements AssetLoader {
  public static extensions = ['.stl']

  public static register() {
    ContentLoader.register({
      extensions: STLLoader.extensions,
      mimeTypes: [],
      loader: STLLoader,
    })
  }

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
          parameters: {
            color: [1, 1, 1, 1],
          },
          effect: {
            program: {
              vertexShader: PROGRAM_BASIC.vertexShader,
              fragmentShader: PROGRAM_BASIC.fragmentShader,
            },
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

STLLoader.register()
export { STLLoader }
