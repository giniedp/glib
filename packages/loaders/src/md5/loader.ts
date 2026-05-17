import { AssetContainer, AssetLoader, ContentLoader, LoaderContext, ResourceGraph } from '@gglib/content'
import { GeometryBuilder, MaterialOptions, MeshPartImport, TextureOptions } from '@gglib/graphics'
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

  public async load(url: string, context: LoaderContext): Promise<AssetContainer> {
    const response = await context.content.fetch(url, {
      responseType: 'text',
    })
    const data = parse(response.body)
    return new Container(data)
  }
}

export class Container extends AssetContainer {
  public readonly graph = new ResourceGraph()
  public readonly document: Document

  public override readonly modelCount: number
  public override readonly materialCount: number
  public override readonly textureCount: number

  public constructor(document: Document) {
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
