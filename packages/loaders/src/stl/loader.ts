import { AssetContainer, AssetLoader, AssetType, ContentLoader, LoadContext, ResourceGraph } from '@gglib/content'
import { GeometryBuilder, MeshPartImport } from '@gglib/graphics'
import { ModelOptions } from '@gglib/model'
import { STL } from './format'

export class Loader implements AssetLoader {
  public static extensions = ['.stl']
  public static mimeTypes = []
  public static create = () => new Loader()
  public static register(registry = ContentLoader.loaders) {
    registry.register(Loader)
  }

  public async load(url: string, context: LoadContext): Promise<AssetContainer> {
    const response = await context.content.fetch(url, {
      responseType: 'arraybuffer',
    })
    const data = STL.parse(response.body)
    return new Container(data)
  }
}

export class Container implements AssetContainer {
  public readonly graph = new ResourceGraph()
  public readonly document: STL

  public constructor(document: STL) {
    this.document = document
  }

  public count(asset: AssetType<any, any>): number {
    if (asset === AssetType.Model) {
      return 1
    }
    return 0
  }

  public async load<T>(asset: AssetType<T, any>, index: number, context: LoadContext): Promise<T>
  public async load(asset: AssetType<any, any>, index: number, context: LoadContext): Promise<any> {
    if (asset !== AssetType.Model) {
      throw new Error(`AssetType not supported by this container: ${asset}`)
    }
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
