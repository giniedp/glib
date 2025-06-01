import { AssetContainer, AssetLoader, ContentLoader, LoaderContext } from '@gglib/content'
import { GeometryBuilder, GeometryOptions } from '@gglib/graphics'
import { Quat, Vec4 } from '@gglib/math'
import { parse } from './format'

export function registerLoader() {
  ContentLoader.registerLoader(Loader)
}

export class Loader implements AssetLoader {
  public static extensions: ['.md5mesh']
  public static mimeTypes: ['application/x-md5mesh']
  public static loader = Loader

  public async load(url: string, context: LoaderContext): Promise<AssetContainer> {
    const response = await context.content.fetch(url, {
      responseType: 'text',
    })
    const data = parse(response.body)

    const builder = new GeometryBuilder({
      layout: [['position', 'normal', 'texture']],
    })

    const mtlIds: string[] = []
    const parts = data.meshes.map((mesh): GeometryOptions => {
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
      return builder.endGeometry({
        name: mesh.name,
        materialId: mtlIds.indexOf(mesh.shader),
      })
    })

    return {
      source: context.assetUrl,
      meshes: [
        {
          parts: parts,
          // TODO: load materials
          // materials: await Promise.all(
          //   mtlIds.map((name: string) => context.manager.load(resolveUri(name, context), Material)),
          // ),
        },
      ],
    }
  }
}
