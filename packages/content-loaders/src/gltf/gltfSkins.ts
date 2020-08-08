import { Mat4 } from '@gglib/math'
import { ModelSkin } from '@gglib/graphics'
import { GLTFReader } from './reader'

export async function loadGltfSkins(reader: GLTFReader): Promise<ModelSkin[]> {
  const doc = reader.doc
  const result = doc.skins?.map(async (srcSkin) => {
    const result: ModelSkin = {
      joints: [...srcSkin.joints],
      inverseBindMatrices: [],
    }

    if (!srcSkin.inverseBindMatrices) {
      for (let i = 0; i < result.joints.length; i++) {
        result.inverseBindMatrices[i] = null
      }
    } else {
      const accessor = await reader.loadAccessor(srcSkin.inverseBindMatrices)
      const data = accessor.getDataWithoutOffset().slice() as Float32Array
      for (let i = 0; i < result.joints.length; i++) {
        result.inverseBindMatrices[i] = new Mat4(data.subarray(i * 16, (i + 1) * 16))
      }
    }

    return result
  })

  return Promise.all(result || [])
}
