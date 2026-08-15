import { ResourceNode } from '@gglib/content'
import { Mat4 } from '@gglib/math'
import { SkinData } from '@gglib/model'
import { GltfAssetContainer } from './asset'

export function loadSkin(asset: GltfAssetContainer, index: number): ResourceNode<SkinData> {
  const key = `skin:${index}`
  if (asset.graph.has(key)) {
    return asset.graph.get(key)!
  }

  const gltf = asset.document.skins?.[index]
  if (!gltf) {
    throw new Error(`Skin with index ${index} not found in document`)
  }

  const node = asset.graph.node<SkinData>(key, {
    name: gltf.name || null,
    joints: [...gltf.joints],
    skeleton: gltf.skeleton || null,
    inverseBindMatrices: [],
  })

  if (gltf.inverseBindMatrices == null) {
    for (let i = 0; i < node.data.joints.length; i++) {
      node.data.inverseBindMatrices[i] = Mat4.createIdentity()
    }
    return node
  }

  const accessorKey = asset.graph.dependency(node, asset.accessorNode(gltf.inverseBindMatrices))
  node.build = (_, node, get) => {
    const joints = node.data.joints
    const accessor = get(accessorKey)
    const data = accessor.getDataWithoutOffset().slice() as Float32Array
    for (let i = 0; i < joints.length; i++) {
      node.data.inverseBindMatrices[i] = new Mat4(data.subarray(i * 16, (i + 1) * 16))
    }
    return node.data
  }

  return node
}
