import { Material, Model, ModelBuilder, ModelMeshPartOptions, ModelOptions } from '@gglib/graphics'
import { Quat, Vec4 } from '@gglib/math'
import { loader, resolveUri, Loader } from '@gglib/content'

import { MD5Mesh } from './format'

/**
 * @public
 */
export const loadMd5meshToModelOptions: Loader<string, ModelOptions> = loader({
  input: ['.md5mesh'],
  output: Model.Options,
  handle: async (_, context): Promise<ModelOptions> => {
    const content = (await context.manager.downloadText(context.source)).content
    const data = MD5Mesh.parse(content)
    const builder = new ModelBuilder({
      layout: {
        position: {
          offset: 0,
          type: 'float',
          elements: 3,
        },
        normal: {
          offset: 20,
          type: 'float',
          elements: 3,
        },
        texture: {
          offset: 12,
          type: 'float',
          elements: 2,
        },
      },
    })

    const mtlIds: string[] = []
    const parts = data.meshes.map((mesh): ModelMeshPartOptions => {
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
      return builder.endMeshPart({
        name: mesh.name,
        materialId: mtlIds.indexOf(mesh.shader),
      })
    })

    return {
      meshes: [{
        parts: parts,
        materials: await Promise.all(mtlIds.map((name: string) => context.manager.load(resolveUri(name, context), Material))),
      }]
    }
  },
})
