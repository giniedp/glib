import { AssetContainer, AssetLoader, AssetType, ContentLoader, LoadContext, ResourceGraph } from '@gglib/content'
import { GeometryBuilder, MeshPartImport } from '@gglib/graphics'
import { Quat, Vec4 } from '@gglib/math'
import { ModelOptions } from '@gglib/model'
import { Document, parse } from './format'

export class Loader implements AssetLoader {
  public static extensions: ['.md5mesh']
  public static mimeTypes: ['application/x-md5mesh']
  public static create = () => new Loader()
  public static register(registry = ContentLoader.loaders) {
    registry.register(Loader)
  }

  public async load(url: string, context: LoadContext): Promise<AssetContainer> {
    const response = await context.content.fetch(url, {
      responseType: 'text',
    })
    const data = parse(response.body)
    return new Container(data)
  }
}

export class Container implements AssetContainer {
  public readonly graph = new ResourceGraph()
  public readonly document: Document

  public constructor(document: Document) {
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

  // TODO: implement material loader
  public modelNode() {
    const node = this.graph.node<ModelOptions>('model', {
      meshes: [
        {
          partImports: buildMeshParts(this.document),
        },
      ],
    })
    return node
  }
}

function buildMeshParts(data: Document): MeshPartImport[] {
  const builder = new GeometryBuilder({
    layout: [['position', 'normal', 'texture']],
  })

  const mtlIds: string[] = []
  return data.meshes.map((mesh): MeshPartImport => {
    mesh.tri.forEach((tri, index) => {
      for (const i of [tri.v1, tri.v2, tri.v3]) {
        const vert = mesh.vert[i]
        const pos = [0, 0, 0]
        for (let j = 0; j < 1; j++) {
          const weight = mesh.weight[vert.weightIndex + j]
          const joint = data.joints[weight.jointIndex]

          const jOrient = Quat.convert(joint.rotation)
          const jConjugate = Quat.conjugate(joint.rotation)
          const jPos = Vec4.convert(joint.position)
          const wPos = Vec4.convert(weight.position)
          const rPos = Quat.multiply(Quat.multiply(jOrient, wPos), jConjugate)
          pos[0] += (rPos.x + jPos.x) * weight.value
          pos[1] += (rPos.y + jPos.y) * weight.value
          pos[2] += (rPos.z + jPos.z) * weight.value
        }
        const uv = [vert.uv.x, vert.uv.y]
        builder.addIndex(index + i)
        builder.addVertex({
          position: pos,
          texture: uv,
          // skip normal, it will be calculated
        })
      }
    })
    if (mtlIds.indexOf(mesh.shader) === -1) {
      mtlIds.push(mesh.shader)
    }
    return {
      materialIndex: mtlIds.indexOf(mesh.shader),
      geometry: builder.toGeometryOptions({
        name: mesh.name,
      }),
    }
  })
}
