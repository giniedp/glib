import { DocumentReader } from './format'
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
        result.inverseBindMatrices.push(null)
      }
    } else {
      const accessor = await reader.loadAccessor(srcSkin.inverseBindMatrices)
      const data = accessor.getDataWithoutOffset().slice() as Float32Array
      for (let i = 0; i < result.joints.length; i++) {
        result.inverseBindMatrices.push(new Mat4(new Float32Array(data, 16 * 4 * i, 16)))
      }
    }
    for (let i = 0; i < result.joints.length; i++) {
      if (result.inverseBindMatrices[i]) {
        result.bindMatrices.push(Mat4.invert(result.inverseBindMatrices[i]))
      }
    }

    return result
  })

  return Promise.all(result || [])
}
