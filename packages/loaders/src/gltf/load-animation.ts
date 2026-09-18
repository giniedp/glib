import { ResourceNode, ResourceRef } from '@gglib/content'
import { AnimationData } from '@gglib/model'
import { GltfAssetContainer } from './asset'
import { GLTFAccessorBase } from './load-buffer'

export function loadAnimation(asset: GltfAssetContainer, index: number): ResourceNode<AnimationData> {
  const key = `skin:${index}`
  if (asset.graph.has(key)) {
    return asset.graph.get(key)!
  }

  const gltf = asset.document.animations?.[index]
  if (!gltf) {
    throw new Error(`Animation with index ${index} not found in document`)
  }

  const node = asset.graph.node<AnimationData>(key, {
    name: gltf.name || null,
    type: 'channels',
    duration: null,
    channels: [],
  })

  const samplerRefs: Record<number, ResourceRef<GLTFAccessorBase>> = {}
  for (const channel of gltf.channels) {
    const sampler = gltf.samplers[channel.sampler]
    if (!samplerRefs[sampler.input]) {
      samplerRefs[sampler.input] = asset.graph.dependency(node, asset.accessorNode(sampler.input))
    }
    if (!samplerRefs[sampler.output]) {
      samplerRefs[sampler.output] = asset.graph.dependency(node, asset.accessorNode(sampler.output))
    }
  }

  node.build = (_, node, get) => {
    for (const gltfChannel of gltf.channels) {
      const gltfSampler = gltf.samplers[gltfChannel.sampler]
      const accIn = get(samplerRefs[gltfSampler.input])
      const accOut = get(samplerRefs[gltfSampler.output])

      const target = gltfChannel.target.node
      let channel = node.data.channels.find((it) => it.target === target)
      if (!channel) {
        channel = { target }
        node.data.channels.push(channel)
      }

      const path = gltfChannel.target.path
      if (path in channel) {
        console.warn('channel samples ignored. It targets same path of same node as one of the previous channels.')
        continue
      }

      const interpolation = (gltfSampler.interpolation?.toLocaleLowerCase() as any) || 'linear'
      const isCubic = interpolation === 'cubicspline'

      channel[path] = {
        interpolation: interpolation,
        samples: [],
      }

      for (let i = 0; i < accIn.attributeCount; i++) {
        const time = accIn.readComponent(i, 0)
        const i3 = i * 3
        switch (path) {
          case 'rotation':
            if (isCubic) {
              channel.rotation.samples.push({
                time: time,
                tangent0: accOut.readV4(i3 + 0),
                value: accOut.readV4(i3 + 1),
                tangent1: accOut.readV4(i3 + 2),
              })
            } else {
              channel.rotation.samples.push({
                time: time,
                value: accOut.readV4(i),
              })
            }
            break
          case 'scale':
            if (isCubic) {
              channel.scale.samples.push({
                time: time,
                tangent0: accOut.readV3(i3 + 0),
                value: accOut.readV3(i3 + 1),
                tangent1: accOut.readV3(i3 + 2),
              })
            } else {
              channel.scale.samples.push({
                time: time,
                value: accOut.readV3(i),
              })
            }
            break
          case 'translation':
            if (isCubic) {
              channel.translation.samples.push({
                time: time,
                tangent0: accOut.readV3(i3 + 0),
                value: accOut.readV3(i3 + 1),
                tangent1: accOut.readV3(i3 + 2),
              })
            } else {
              channel.translation.samples.push({
                time: time,
                value: accOut.readV3(i),
              })
            }
            break
          case 'weights':
            // TODO:
            break
        }
      }
    }

    return node.data
  }

  return node
}
