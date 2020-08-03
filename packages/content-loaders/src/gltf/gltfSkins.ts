import { DocumentReader, AccessorComponentType } from './format'
import { Mat4 } from '@gglib/math'
import { ModelSkin } from '@gglib/graphics'

export async function loadGltfSkins(reader: DocumentReader): Promise<ModelSkin[]> {
  const doc = reader.doc
  const result = doc.skins?.map(async (srcSkin) => {
    const result: ModelSkin = {
      joints: [...srcSkin.joints],
      inverseBindMatrices: [],
      bindMatrices: []
    }

    if (!srcSkin.inverseBindMatrices) {
      for (let i = 0; i < result.joints.length; i++) {
        result.inverseBindMatrices.push(Mat4.createIdentity())
      }
    } else {
      const accessor = doc.accessors[srcSkin.inverseBindMatrices]
      if (accessor.type !== 'MAT4' || accessor.componentType !== AccessorComponentType.FLOAT) {
        return result
      }

      const bufferView = doc.bufferViews[accessor.bufferView]
      const buffer = await reader.loadBuffer(bufferView.buffer)
      const byteOffset = (accessor.byteOffset || 0) + (accessor.byteOffset || 0)

      const arrayBuffer = new Float32Array(buffer, byteOffset, accessor.count * 16)
      for (let i = 0; i < result.joints.length; i++) {
        result.inverseBindMatrices.push(Mat4.createFromArray(arrayBuffer, i * 16))
      }
    }

    for (let i = 0; i < result.joints.length; i++) {
      result.bindMatrices.push(Mat4.invert(result.inverseBindMatrices[i]))
    }

    return result
  })

  return Promise.all(result || [])
}
