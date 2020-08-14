import { AnimationData, AnimationDataChannels } from '@gglib/graphics'
import { Log, append } from '@gglib/utils'
import { GLTFReader } from './reader'

export async function loadGltfAnimations(reader: GLTFReader): Promise<AnimationData[]> {
  const result: AnimationData[] = []

  for (const srcAnimation of reader.doc.animations || []) {
    const animation: AnimationData = {
      name: srcAnimation.name || null,
      type: 'channels',
      duration: null,
      channels: null,
    }

    const channels = new Map<number, AnimationDataChannels>()

    for (const srcChannel of srcAnimation.channels) {
      const target = srcChannel.target.node
      if (!channels.has(target)) {
        channels.set(target, { target: target })
      }
      const channel = channels.get(target)
      const path = srcChannel.target.path
      if (path in channel) {
        Log.warn('channel samples ignored. It targets same path of same node as one of the previous channels.')
        continue
      }

      const srcSampler = srcAnimation.samplers[srcChannel.sampler]
      const accIn = await reader.loadAccessor(srcSampler.input)
      const accOut = await reader.loadAccessor(srcSampler.output)

      const interpolation = (srcSampler.interpolation?.toLocaleLowerCase() as any) || 'linear'
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
            channel.rotation.samples = append(
              channel.rotation.samples,
              isCubic
                ? {
                    time: time,
                    ti: accOut.readV4(i3 + 0),
                    value: accOut.readV4(i3 + 1),
                    to: accOut.readV4(i3 + 2),
                  }
                : {
                    time: time,
                    value: accOut.readV4(i),
                  },
            )
            break
          case 'scale':
            channel.scale.samples = append(
              channel.scale.samples,
              isCubic
                ? {
                    time: time,
                    ti: accOut.readV3(i3 + 0),
                    value: accOut.readV3(i3 + 1),
                    to: accOut.readV3(i3 + 2),
                  }
                : {
                    time: time,
                    value: accOut.readV3(i),
                  },
            )
            break
          case 'translation':
            channel.translation.samples = append(
              channel.translation.samples,
              isCubic
                ? {
                    time: time,
                    ti: accOut.readV3(i3 + 0),
                    value: accOut.readV3(i3 + 1),
                    to: accOut.readV3(i3 + 2),
                  }
                : {
                    time: time,
                    value: accOut.readV3(i),
                  },
            )
            break
          case 'weights':
            // TODO:
            break
        }
      }
    }

    animation.channels = Array.from(channels.values())

    if (animation.channels.length) {
      result.push(animation)
    }
  }

  return result
}
