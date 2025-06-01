import { ITransformBase } from '@gglib/math'
import { describe, expect, it } from 'vitest'
import { AnimationPlayer } from './AnimationPlayer'

describe('Graphics.AnimationPlayer', () => {
  it('singular sample', () => {
    const player = new AnimationPlayer([
      {
        name: 'Test Animation',
        duration: null,
        type: 'channels',
        channels: [
          {
            target: 0,
            rotation: null,
            scale: null,
            translation: {
              interpolation: 'linear',
              samples: [
                {
                  time: 0,
                  value: { x: 1, y: 2, z: 3 },
                },
              ],
            },
          },
        ],
      },
    ])

    expect(player).toBeDefined()

    const pose: ITransformBase = {
      translation: null,
      rotation: null,
      scale: null,
    }
    player.loadClip(0).sample(0, 0, pose)
    expect(pose.translation).toEqual({ x: 1, y: 2, z: 3 })
    expect(pose.rotation).toEqual({ x: 0, y: 0, z: 0, w: 1 })
    expect(pose.scale).toEqual({ x: 1, y: 1, z: 1 })
  })

  it('interpolate step', () => {
    const player = new AnimationPlayer([
      {
        name: 'Step Animation',
        duration: null,
        type: 'channels',
        channels: [
          {
            target: 0,
            rotation: null,
            scale: null,
            translation: {
              interpolation: 'step',
              samples: [
                {
                  time: 0,
                  value: { x: 1, y: 0, z: 0 },
                },
                {
                  time: 2,
                  value: { x: 0, y: 2, z: 0 },
                },
                {
                  time: 3,
                  value: { x: 0, y: 0, z: 3 },
                },
              ],
            },
          },
        ],
      },
    ])

    expect(player).toBeDefined()
    player.loadClip(0)

    const pose: ITransformBase = {
      translation: null,
      rotation: null,
      scale: null,
    }

    player.clip.sample(0.0, 0, pose)
    expect(pose.translation).toEqual({ x: 1, y: 0, z: 0 })

    player.clip.sample(0.5, 0, pose)
    expect(pose.translation).toEqual({ x: 1, y: 0, z: 0 })

    player.clip.sample(2.0, 0, pose)
    expect(pose.translation).toEqual({ x: 0, y: 2, z: 0 })

    player.clip.sample(2.5, 0, pose)
    expect(pose.translation).toEqual({ x: 0, y: 2, z: 0 })

    player.clip.sample(3.0, 0, pose)
    expect(pose.translation).toEqual({ x: 0, y: 0, z: 3 })
  })

  it('interpolate linear', () => {
    const player = new AnimationPlayer([
      {
        name: 'Step Animation',
        duration: null,
        type: 'channels',
        channels: [
          {
            target: 0,
            rotation: null,
            scale: null,
            translation: {
              interpolation: 'linear',
              samples: [
                {
                  time: 0,
                  value: { x: 1, y: 0, z: 0 },
                },
                {
                  time: 1,
                  value: { x: 2, y: 0, z: 0 },
                },
                {
                  time: 2,
                  value: { x: 3, y: 0, z: 0 },
                },
              ],
            },
          },
        ],
      },
    ])

    expect(player).toBeDefined()
    player.loadClip(0)

    const pose: ITransformBase = {
      translation: null,
      rotation: null,
      scale: null,
    }

    player.clip.sample(0.0, 0, pose)
    expect(pose.translation).toEqual({ x: 1.0, y: 0, z: 0 })

    player.clip.sample(0.5, 0, pose)
    expect(pose.translation).toEqual({ x: 1.5, y: 0, z: 0 })

    player.clip.sample(1.0, 0, pose)
    expect(pose.translation).toEqual({ x: 2.0, y: 0, z: 0 })

    player.clip.sample(1.5, 0, pose)
    expect(pose.translation).toEqual({ x: 2.5, y: 0, z: 0 })

    player.clip.sample(3.0, 0, pose)
    expect(pose.translation).toEqual({ x: 3.0, y: 0, z: 0 })
  })
})
