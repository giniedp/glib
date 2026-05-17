import { AssetContainer, AssetLoader, ContentLoader, LoaderContext, ResourceGraph } from '@gglib/content'
import { GeometryBuilder, MaterialOptions, MeshPartImport, TextureOptions } from '@gglib/graphics'
import { ModelOptions } from '@gglib/model'
import { STL } from './format'

export class Loader implements AssetLoader {
  public static extensions = ['.stl']
  public static mimeTypes = []
  public static create = () => new Loader()
  public static register(registry = ContentLoader.loaders) {
    registry.register(Loader)
  }

  public async load(url: string, context: LoaderContext): Promise<AssetContainer> {
    const response = await context.content.fetch(url, {
      responseType: 'arraybuffer',
    })
    const data = STL.parse(response.body)
    return new Container(data)
  }
}

export class Container extends AssetContainer {
  public readonly graph = new ResourceGraph()
  public readonly document: STL

  public override readonly modelCount: number
  public override readonly materialCount: number
  public override readonly textureCount: number

  public constructor(document: STL) {
    super()
    this.document = document
    this.modelCount = 1
    this.materialCount = 0
    this.textureCount = 0
  }

  public override loadMaterial(index: number, context: LoaderContext): Promise<MaterialOptions> {
    throw new Error('Method not implemented.')
  }
  public override loadTexture(index: number, context: LoaderContext): Promise<TextureOptions> {
    throw new Error('Method not implemented.')
  }

  public override loadModel(index: number, context: LoaderContext) {
    const node = this.modelNode()
    return this.graph.load(node, context)
  }

  public modelNode() {
    const key = `stl:${this.document.header}`
    if (this.graph.has(key)) {
      return this.graph.get(key)
    }

    const data = this.document
    const builder = new GeometryBuilder({
      layout: [['position', 'normal', 'texture']],
    })
    const parts: MeshPartImport[] = []
    for (const solid of data.solids) {
      for (const f of solid.facets) {
        if (builder.vertexCount > 65536 - 2) {
          // prettier-ignore
          builder
            .calculateTangents()
            .calculateBounds()
            .toGeometryOptions({
              name: solid.name,
            })
        }

        builder.addIndex(builder.vertexCount + 0)
        builder.addIndex(builder.vertexCount + 1)
        builder.addIndex(builder.vertexCount + 2)
        for (const v of f.vertices) {
          builder.addVertex({
            position: [v.x, v.y, v.z],
            normal: [f.normal.x, f.normal.y, f.normal.z],
            texture: [0, 0],
          })
        }
      }

      // prettier-ignore

      parts.push({
        materialIndex: 0,
        geometry: builder.calculateTangents().calculateBounds().toGeometryOptions({
          name: solid.name,
        }),
      })
    }

    return this.graph.node<ModelOptions>(key, {
      meshes: [
        {
          partImports: parts,
          materials: [
            {
              properties: {
                BaseColor: [1, 1, 1, 1],
              },
            },
          ],
        },
      ],
    })
  }
}
