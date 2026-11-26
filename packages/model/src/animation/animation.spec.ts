import { WebglDevice, WebGpuDevice } from '@gglib/graphics'
import { describe, expect, it } from 'vitest'
import { AnimationMixer } from './AnimationMixer'
import { AnimationPose, poseClear, poseCopy, poseIdentity, poseNormalize, poseToModel } from './AnimationPose'
import { AnimationRig } from './AnimationRig'
import { clipSource } from './AnimationSource'
import { AnimationClipCursor, AnimationTrackClip, sampleClip, type AnimationTrack } from './AnimationTrackClip'
import { normalizedSumBlender, slerpBlender } from './PoseBlender'
import { SkinPalette, writeSkinPalette, writeSkinPaletteMatrices } from './SkinPalette'

const S = Math.SQRT1_2

function quatZ(angle: number): number[] {
  return [0, 0, Math.sin(angle / 2), Math.cos(angle / 2)]
}

function rotation(pose: AnimationPose, joint: number) {
  return Array.from(pose.rotations.subarray(joint * 4, joint * 4 + 4))
}

function translation(pose: AnimationPose, joint: number) {
  return Array.from(pose.translations.subarray(joint * 3, joint * 3 + 3))
}

function expectClose(actual: ArrayLike<number>, expected: ArrayLike<number>, digits = 5) {
  expect(actual.length).toBe(expected.length)
  for (let i = 0; i < expected.length; i++) {
    expect(actual[i]).toBeCloseTo(expected[i], digits)
  }
}

/**
 * Same rotation: q and -q are equal
 */
function expectRotation(actual: ArrayLike<number>, expected: ArrayLike<number>) {
  const dot = actual[0] * expected[0] + actual[1] * expected[1] + actual[2] * expected[2] + actual[3] * expected[3]
  expect(Math.abs(dot)).toBeCloseTo(1, 5)
}

/**
 * A chain root → arm → hand along +x, 1 apart
 */
function chainRig() {
  const pose = new AnimationPose(3)
  pose.translations.set([0, 0, 0, 1, 0, 0, 1, 0, 0])
  return new AnimationRig({
    names: ['root', 'arm', 'hand'],
    parents: [-1, 0, 1],
    defaultPose: pose,
    targets: [100, 200, 300],
  })
}

function track(target: number, channel: AnimationTrack['channel'], times: number[], values: number[]): AnimationTrack {
  return {
    target,
    channel,
    times: Float32Array.from(times),
    values: Float32Array.from(values),
    interpolation: 'LINEAR',
  }
}

describe('AnimationPose', () => {
  it('starts at the identity with weight 1', () => {
    const pose = new AnimationPose(2, { scale: true })
    expect(rotation(pose, 1)).toEqual([0, 0, 0, 1])
    expect(Array.from(pose.scales)).toEqual([1, 1, 1, 1, 1, 1])
    expect(Array.from(pose.weights)).toEqual([1, 1])
  })

  it('composes model space with non commuting parents', () => {
    const local = new AnimationPose(3)
    // root at (1,0,0) turned 90° about z, child 1 along local x, grandchild 1 along local x and turned 90°
    local.translations.set([1, 0, 0, 1, 0, 0, 1, 0, 0])
    local.rotations.set([...quatZ(Math.PI / 2), 0, 0, 0, 1, ...quatZ(Math.PI / 2)])
    const model = poseToModel(local, [-1, 0, 1], new AnimationPose(3))
    expectClose(translation(model, 1), [1, 1, 0])
    expectClose(translation(model, 2), [1, 2, 0])
    expectRotation(rotation(model, 2), quatZ(Math.PI))
  })

  it('applies parent scale to child translations', () => {
    const local = new AnimationPose(2, { scale: true })
    local.translations.set([0, 0, 0, 1, 0, 0])
    local.scales.set([2, 2, 2, 1, 1, 1])
    const model = poseToModel(local, [-1, 0], new AnimationPose(2, { scale: true }))
    expectClose(translation(model, 1), [2, 0, 0])
    expectClose(Array.from(model.scales.subarray(3)), [2, 2, 2])
  })

  it('normalizes rotations, near zero ones to the identity', () => {
    const pose = new AnimationPose(2)
    pose.rotations.set([0, 0, 2, 0, 0, 0, 0.001, 0])
    poseNormalize(pose)
    expect(rotation(pose, 0)).toEqual([0, 0, 1, 0])
    expect(rotation(pose, 1)).toEqual([0, 0, 0, 1])
  })
})

describe('normalizedSumBlender', () => {
  it('sums rotations in one hemisphere and averages translations', () => {
    const a = new AnimationPose(1)
    const b = new AnimationPose(1)
    a.rotations.set(quatZ(0))
    // the same rotation as quatZ(Math.PI / 2), but in the other hemisphere
    b.rotations.set(quatZ(Math.PI / 2).map((it) => -it))
    a.translations.set([0, 0, 0])
    b.translations.set([2, 0, 0])
    const out = new AnimationPose(1)
    normalizedSumBlender.begin(out)
    normalizedSumBlender.add(a, 0.5, out, null)
    normalizedSumBlender.add(b, 0.5, out, null)
    normalizedSumBlender.end(out)
    expectRotation(rotation(out, 0), quatZ(Math.PI / 4))
    expectClose(translation(out, 0), [1, 0, 0])
    expect(out.weights[0]).toBe(1)
  })

  it('leaves joints outside the mask without weight', () => {
    const src = new AnimationPose(2)
    const out = new AnimationPose(2)
    normalizedSumBlender.begin(out)
    normalizedSumBlender.add(src, 1, out, Uint8Array.from([0, 1]))
    normalizedSumBlender.end(out)
    expect(Array.from(out.weights)).toEqual([0, 1])
  })

  it('blends an override layer by the layer weight times the joint weight', () => {
    const layer = new AnimationPose(1)
    layer.translations.set([4, 0, 0])
    layer.weights[0] = 0.5
    const out = new AnimationPose(1)
    normalizedSumBlender.layer(layer, 0.5, false, out)
    expectClose(translation(out, 0), [1, 0, 0])
  })

  it('composes an additive layer onto the pose', () => {
    const delta = new AnimationPose(1)
    delta.rotations.set(quatZ(Math.PI / 2))
    delta.translations.set([0, 1, 0])
    const out = new AnimationPose(1)
    out.rotations.set(quatZ(Math.PI / 2))
    out.translations.set([1, 0, 0])
    normalizedSumBlender.layer(delta, 1, true, out)
    expectRotation(rotation(out, 0), quatZ(Math.PI))
    expectClose(translation(out, 0), [1, 1, 0])
    // half the delta
    out.rotations.set(quatZ(0))
    normalizedSumBlender.layer(delta, 0.5, true, out)
    expectRotation(rotation(out, 0), quatZ(Math.PI / 4))
  })
})

describe('slerpBlender', () => {
  it('slerps by the share of the weight', () => {
    const a = new AnimationPose(1)
    const b = new AnimationPose(1)
    b.rotations.set(quatZ(Math.PI / 2))
    const out = new AnimationPose(1)
    slerpBlender.begin(out)
    slerpBlender.add(a, 1, out, null)
    slerpBlender.add(b, 1, out, null)
    slerpBlender.end(out)
    expectRotation(rotation(out, 0), quatZ(Math.PI / 4))
    expect(out.weights[0]).toBe(2)
  })
})

describe('AnimationTrackClip', () => {
  const clip = new AnimationTrackClip({
    name: 'turn',
    rate: 30,
    tracks: [
      track(200, 'rotation', [0, 30], [...quatZ(0), ...quatZ(Math.PI / 2)]),
      track(300, 'translation', [0, 15, 30], [1, 0, 0, 2, 0, 0, 1, 0, 0]),
      track(999, 'translation', [0], [5, 5, 5]),
    ],
  })

  it('takes its range from the keys and its duration from the rate', () => {
    expect(clip.start).toBe(0)
    expect(clip.end).toBe(30)
    expect(clip.duration).toBe(1)
    expect(clip.timeAt(0.5)).toBe(15)
  })

  it('samples by normalized lerp, clamps outside the keys, skips unbound tracks', () => {
    const rig = chainRig()
    const binding = rig.bind(clip)
    expect(Array.from(binding.joints)).toEqual([1, 2, -1])
    expect(rig.bind(clip)).toBe(binding)
    const cursor = new AnimationClipCursor(clip)
    const pose = rig.defaultPose.clone()
    sampleClip(binding, cursor, 15, pose)
    expectRotation(rotation(pose, 1), quatZ(Math.PI / 4))
    expectClose(translation(pose, 2), [2, 0, 0])
    expectClose(translation(pose, 0), [0, 0, 0])
    sampleClip(binding, cursor, 7.5, pose)
    expectClose(translation(pose, 2), [1.5, 0, 0])
    sampleClip(binding, cursor, 60, pose)
    expectRotation(rotation(pose, 1), quatZ(Math.PI / 2))
    expectClose(translation(pose, 2), [1, 0, 0])
    sampleClip(binding, cursor, -1, pose)
    expectRotation(rotation(pose, 1), quatZ(0))
  })

  it('composes an additive clip onto the pose, or writes the delta', () => {
    const rig = chainRig()
    const additive = new AnimationTrackClip({
      additive: true,
      tracks: [track(200, 'rotation', [0], quatZ(Math.PI / 2)), track(200, 'translation', [0], [0, 1, 0])],
    })
    const binding = rig.bind(additive)
    const pose = rig.defaultPose.clone()
    pose.rotations.set(quatZ(Math.PI / 2), 4)
    sampleClip(binding, new AnimationClipCursor(additive), 0, pose)
    expectRotation(rotation(pose, 1), quatZ(Math.PI))
    expectClose(translation(pose, 1), [1, 1, 0])
    const delta = poseIdentity(new AnimationPose(3))
    sampleClip(binding, new AnimationClipCursor(additive), 0, delta, true)
    expectRotation(rotation(delta, 1), quatZ(Math.PI / 2))
    expectClose(translation(delta, 1), [0, 1, 0])
  })

  it('leaves tracks without keys unbound', () => {
    const rig = chainRig()
    const empty = new AnimationTrackClip({ tracks: [track(100, 'translation', [], [])] })
    const binding = rig.bind(empty)
    expect(Array.from(binding.joints)).toEqual([-1])
    const pose = rig.defaultPose.clone()
    sampleClip(binding, new AnimationClipCursor(empty), 0, pose)
    expect(translation(pose, 0)).toEqual([0, 0, 0])
  })

  it('falls back to seconds for a rate of 0', () => {
    const clip = new AnimationTrackClip({ rate: 0, tracks: [track(100, 'translation', [0, 2], [0, 0, 0, 1, 0, 0])] })
    expect(clip.rate).toBe(1)
    expect(clip.duration).toBe(2)
  })

  it('keeps a played range that does not start at the first key', () => {
    const ranged = new AnimationTrackClip({
      start: 10,
      end: 20,
      rate: 10,
      tracks: [track(100, 'translation', [0, 20], [0, 0, 0, 2, 0, 0])],
    })
    expect(ranged.duration).toBe(1)
    expect(ranged.timeAt(0)).toBe(10)
  })

  it('converts glTF data', () => {
    const converted = AnimationTrackClip.fromData({
      name: 'gltf',
      channels: [
        {
          target: 1,
          rotation: {
            interpolation: 'STEP',
            samples: [
              { time: 0, value: { x: 0, y: 0, z: 0, w: 1 } },
              { time: 2, value: { x: 0, y: 0, z: 1, w: 0 } },
            ],
          },
        },
      ],
    })
    expect(converted.duration).toBe(2)
    expect(converted.tracks[0]).toMatchObject({ target: 1, channel: 'rotation', interpolation: 'STEP' })
    expect(Array.from(converted.tracks[0].values)).toEqual([0, 0, 0, 1, 0, 0, 1, 0])
  })
})

describe('AnimationRig', () => {
  it('keeps the inverse of the default model transforms', () => {
    const rig = chainRig()
    expectClose(translation(rig.defaultModelPose, 2), [2, 0, 0])
    expectClose(Array.from(rig.inverseBindTranslations.subarray(6, 9)), [-2, 0, 0])
  })

  it('rejects children before their parents', () => {
    const pose = new AnimationPose(2)
    expect(() => new AnimationRig({ names: ['a', 'b'], parents: [1, -1], defaultPose: pose })).toThrow(
      /parents must come first/,
    )
  })

  it('masks a branch', () => {
    const rig = chainRig()
    expect(Array.from(rig.maskBranch(1))).toEqual([0, 1, 1])
    expect(rig.jointByName('hand')).toBe(2)
    expect(rig.jointOf(300)).toBe(2)
  })
})

describe('AnimationMixer', () => {
  function setup() {
    const rig = chainRig()
    const xClip = new AnimationTrackClip({ rate: 1, tracks: [track(100, 'translation', [0, 1], [1, 0, 0, 1, 0, 0])] })
    const yClip = new AnimationTrackClip({ rate: 1, tracks: [track(100, 'translation', [0, 1], [0, 1, 0, 0, 1, 0])] })
    const mixer = new AnimationMixer(rig)
    return {
      rig,
      mixer,
      x: clipSource(rig.bind(xClip)),
      y: clipSource(rig.bind(yClip)),
      pose: new AnimationPose(rig.count),
    }
  }

  it('starts from the default pose', () => {
    const { rig, mixer, pose } = setup()
    mixer.evaluate(pose)
    expectClose(translation(pose, 1), translation(rig.defaultPose, 1))
  })

  it('cross fades with weights that sum to one', () => {
    const { mixer, x, y, pose } = setup()
    const a = mixer.play(x, { loop: true })
    const b = mixer.play(y, { loop: true, fade: 1 })
    mixer.update(0.25)
    expect(b.blendWeight).toBeCloseTo(0.25)
    expect(a.blendWeight).toBeCloseTo(0.75)
    mixer.evaluate(pose)
    expectClose(translation(pose, 0), [0.75, 0.25, 0])
    mixer.update(1)
    expect(a.active).toBe(false)
    expect(mixer.entries(0)).toEqual([b])
    mixer.evaluate(pose)
    expectClose(translation(pose, 0), [0, 1, 0])
  })

  it('loops or holds the last pose', () => {
    const { mixer, x } = setup()
    const looped = mixer.play(x, { loop: true })
    mixer.update(1.25)
    expect(looped.time).toBeCloseTo(0.25)
    const held = mixer.play(x, { layer: 1, speed: 2 })
    mixer.update(0.75)
    expect(held.time).toBe(1)
    expect(held.done).toBe(true)
  })

  it('puts an upper layer on top, only on its masked joints', () => {
    const { rig, mixer, x, y, pose } = setup()
    mixer.play(x)
    // y animates the root only, the mask of the arm branch leaves the root to layer 0
    mixer.play(y, { layer: 1, mask: rig.maskBranch(1) })
    mixer.update(0)
    mixer.evaluate(pose)
    expectClose(translation(pose, 0), [1, 0, 0])
    mixer.play(y, { layer: 2 })
    mixer.setLayerWeight(2, 0.5)
    mixer.update(0)
    mixer.evaluate(pose)
    expectClose(translation(pose, 0), [0.5, 0.5, 0])
  })

  it('leaves the joints an upper layer clip has no tracks for to the layers below', () => {
    const { rig, mixer, x, pose } = setup()
    mixer.play(x)
    // the hand clip animates the hand only: root and arm keep layer 0, not the default pose
    const handClip = new AnimationTrackClip({
      rate: 1,
      tracks: [track(300, 'translation', [0, 1], [0, 2, 0, 0, 2, 0])],
    })
    const hand = clipSource(rig.bind(handClip))
    expect(Array.from(hand.mask ?? [])).toEqual([0, 0, 1])
    mixer.play(hand, { layer: 1 })
    mixer.update(0)
    mixer.evaluate(pose)
    expectClose(translation(pose, 0), [1, 0, 0])
    expectClose(translation(pose, 2), [0, 2, 0])
    // on layer 0 a clip still samples over the whole default pose
    mixer.stopAll()
    mixer.play(hand)
    mixer.update(0)
    mixer.evaluate(pose)
    expectClose(translation(pose, 0), translation(rig.defaultPose, 0))
    expectClose(translation(pose, 2), [0, 2, 0])
  })

  it('composes an additive layer', () => {
    const { rig, mixer, x, pose } = setup()
    const lift = new AnimationTrackClip({ additive: true, tracks: [track(100, 'translation', [0], [0, 0, 1])] })
    mixer.play(x)
    mixer.play(clipSource(rig.bind(lift)), { layer: 1 })
    mixer.update(0)
    mixer.evaluate(pose)
    expectClose(translation(pose, 0), [1, 0, 1])
  })

  it('fades a layer out and removes its entries', () => {
    const { mixer, x } = setup()
    const entry = mixer.play(x, { layer: 1, loop: true })
    mixer.stop(1, 0.5)
    mixer.update(0.25)
    expect(mixer.layerWeight(1)).toBeCloseTo(0.5)
    mixer.update(0.5)
    expect(entry.active).toBe(false)
    expect(mixer.entries(1).length).toBe(0)
  })

  it('reuses released entries', () => {
    const { mixer, x } = setup()
    const first = mixer.play(x)
    mixer.stop(0)
    const second = mixer.play(x)
    expect(second).toBe(first)
    expect(second.active).toBe(true)
  })

  it('puts the override and additive chains of one layer on their own', () => {
    const { rig, mixer, pose } = setup()
    // holds the arm at its default, an override
    const hold = new AnimationTrackClip({ tracks: [track(200, 'translation', [0], [1, 0, 0])] })
    const lift = new AnimationTrackClip({ additive: true, tracks: [track(200, 'translation', [0], [0, 0, 1])] })
    mixer.play(clipSource(rig.bind(hold)), { layer: 1 })
    mixer.play(clipSource(rig.bind(lift)), { layer: 1, fade: 1 })
    mixer.update(0.25)
    mixer.evaluate(pose)
    expectClose(translation(pose, 1), [1, 0, 0.25])
  })

  it('keeps a layer weight the user set when new entries play', () => {
    const { mixer, x } = setup()
    mixer.play(x, { layer: 2, loop: true })
    mixer.setLayerWeight(2, 0.5)
    mixer.play(x, { layer: 2, loop: true, fade: 0.2 })
    mixer.update(0.1)
    expect(mixer.layerWeight(2)).toBe(0.5)
    // a weight of 0 mutes the layer but keeps its entries
    mixer.setLayerWeight(2, 0, 0.1)
    mixer.update(0.2)
    expect(mixer.entries(2).length).toBeGreaterThan(0)
  })

  it('brings a stopping layer back when an entry plays', () => {
    const { mixer, x } = setup()
    mixer.play(x, { layer: 1, loop: true })
    mixer.stop(1, 1)
    mixer.update(0.5)
    mixer.play(x, { layer: 1, loop: true, fade: 0.5 })
    mixer.update(0.5)
    expect(mixer.layerWeight(1)).toBe(1)
    expect(mixer.entries(1).length).toBeGreaterThan(0)
  })

  it('is done at the start when playing backwards', () => {
    const { mixer, x } = setup()
    const entry = mixer.play(x, { speed: -1, time: 0.5 })
    expect(entry.done).toBe(false)
    mixer.update(1)
    expect(entry.time).toBe(0)
    expect(entry.done).toBe(true)
  })

  it('takes a blend routine', () => {
    const rig = chainRig()
    const mixer = new AnimationMixer(rig, { blender: slerpBlender })
    expect(mixer.blender).toBe(slerpBlender)
  })
})

describe('skin palette', () => {
  function transformPoint(palette: Float32Array, format: 'mat4' | 'dualquat', joint: number, p: number[]) {
    if (format === 'mat4') {
      const m = palette.subarray(joint * 16, joint * 16 + 16)
      return [0, 1, 2].map((i) => m[i] * p[0] + m[4 + i] * p[1] + m[8 + i] * p[2] + m[12 + i])
    }
    const d = palette.subarray(joint * 8, joint * 8 + 8)
    const [x, y, z, w, dx, dy, dz, dw] = d
    // rotate
    const cx = y * p[2] - z * p[1]
    const cy = z * p[0] - x * p[2]
    const cz = x * p[1] - y * p[0]
    const r = [
      p[0] + 2 * (w * cx + y * cz - z * cy),
      p[1] + 2 * (w * cy + z * cx - x * cz),
      p[2] + 2 * (w * cz + x * cy - y * cx),
    ]
    // translation = 2 * dual * conjugate(real)
    const tx = 2 * (-dw * x + dx * w - dy * z + dz * y)
    const ty = 2 * (-dw * y + dy * w - dz * x + dx * z)
    const tz = 2 * (-dw * z + dz * w - dx * y + dy * x)
    return [r[0] + tx, r[1] + ty, r[2] + tz]
  }

  it('is the identity in the default pose', () => {
    const rig = chainRig()
    for (const format of ['mat4', 'dualquat'] as const) {
      const out = new Float32Array(rig.count * (format === 'mat4' ? 16 : 8))
      writeSkinPalette(rig.defaultModelPose, rig, format, out, 0)
      expectClose(transformPoint(out, format, 2, [2, 0.5, 0]), [2, 0.5, 0])
    }
  })

  it('moves bound vertices the same as matrices and dual quaternions', () => {
    const rig = chainRig()
    const local = rig.defaultPose.clone()
    local.rotations.set(quatZ(Math.PI / 2), 4)
    local.rotations.set(quatZ(-Math.PI / 3), 8)
    const model = poseToModel(local, rig.parents, new AnimationPose(rig.count))
    const matrices = new Float32Array(rig.count * 16)
    const dualQuats = new Float32Array(rig.count * 8)
    writeSkinPalette(model, rig, 'mat4', matrices, 0)
    writeSkinPalette(model, rig, 'dualquat', dualQuats, 0)
    // a vertex at the hand in the default pose follows the hand
    const vertex = [2.5, 0.2, 0.1]
    const expected = transformPoint(matrices, 'mat4', 2, vertex)
    expectClose(transformPoint(dualQuats, 'dualquat', 2, vertex), expected, 4)
    // hand at (1, 1, 0) after the arm turn
    expectClose(transformPoint(matrices, 'mat4', 2, [2, 0, 0]), [1, 1, 0])
  })

  it('turns a dual quaternion to the hemisphere of its parent', () => {
    const rig = chainRig()
    const local = rig.defaultPose.clone()
    local.rotations.set(quatZ(Math.PI * 0.9), 0)
    // the same turn in the other hemisphere: without the alignment the child's real part points away from the parent's
    local.rotations.set(
      quatZ(Math.PI * 0.9).map((it) => -it),
      4,
    )
    const model = poseToModel(local, rig.parents, new AnimationPose(rig.count))
    const raw = rotation(model, 0).reduce((sum, it, i) => sum + it * model.rotations[4 + i], 0)
    expect(raw).toBeLessThan(0)
    const out = new Float32Array(rig.count * 8)
    writeSkinPalette(model, rig, 'dualquat', out, 0)
    const dot = out[0] * out[8] + out[1] * out[9] + out[2] * out[10] + out[3] * out[11]
    expect(dot).toBeGreaterThan(0)
  })

  it('writes joint matrices as dual quaternions that move vertices the same', () => {
    const rig = chainRig()
    const local = rig.defaultPose.clone()
    local.rotations.set(quatZ(Math.PI / 2), 4)
    local.rotations.set(quatZ(-Math.PI * 0.9), 8)
    const model = poseToModel(local, rig.parents, new AnimationPose(rig.count))
    const matrices = new Float32Array(rig.count * 16)
    writeSkinPalette(model, rig, 'mat4', matrices, 0)
    const out = new Float32Array((rig.count + 1) * 8)
    writeSkinPaletteMatrices(matrices, rig.count, rig.parents, 'dualquat', out, 1)
    const vertex = [2.5, 0.2, 0.1]
    for (let joint = 0; joint < rig.count; joint++) {
      const expected = transformPoint(matrices, 'mat4', joint, vertex)
      expectClose(transformPoint(out, 'dualquat', joint + 1, vertex), expected, 4)
    }
    // children in the hemisphere of their parent
    for (let joint = 1; joint < rig.count; joint++) {
      const o = (joint + 1) * 8
      const p = (rig.parents[joint] + 1) * 8
      const dot = out[o] * out[p] + out[o + 1] * out[p + 1] + out[o + 2] * out[p + 2] + out[o + 3] * out[p + 3]
      expect(dot).toBeGreaterThanOrEqual(0)
    }
  })

  it('is the identity in the default pose of a scaled rig', () => {
    const pose = new AnimationPose(2, { scale: true })
    pose.translations.set([0, 0, 0, 1, 0, 0])
    pose.scales.set([2, 2, 2, 1, 1, 1])
    pose.rotations.set(quatZ(Math.PI / 2), 0)
    const rig = new AnimationRig({ names: ['root', 'child'], parents: [-1, 0], defaultPose: pose })
    const out = new Float32Array(rig.count * 16)
    writeSkinPalette(rig.defaultModelPose, rig, 'mat4', out, 0)
    expectClose(transformPoint(out, 'mat4', 0, [2, 0.5, 0]), [2, 0.5, 0])
    expectClose(transformPoint(out, 'mat4', 1, [0.3, 2, 1]), [0.3, 2, 1])
  })

  for (const create of [() => new WebglDevice({}), () => new WebGpuDevice({})]) {
    it(`allocates ranges in one buffer and grows by doubling (${create().constructor.name})`, async () => {
      const device = await create().ready
      const palette = new SkinPalette(device, { format: 'dualquat', capacity: 4 })
      const rig = chainRig()
      const a = palette.allocate(3)
      const b = palette.allocate(3)
      expect([a, b]).toEqual([0, 3])
      expect(palette.capacity).toBe(8)
      expect(palette.version).toBe(1)
      expect(palette.buffer.size).toBe(palette.data.byteLength)
      const resource = (palette.buffer as unknown as { resource?: { size?: number } }).resource
      if (resource && typeof resource.size === 'number') {
        // the GPU storage grew as well
        expect(resource.size).toBeGreaterThanOrEqual(palette.data.byteLength)
      }
      palette.write(b, rig.defaultModelPose, rig)
      palette.upload()
      palette.release(a, 3)
      expect(palette.allocate(3)).toBe(0)
      palette.dispose()
    })
  }

  it('remaps joints into another range, identity for missing joints', async () => {
    const device = await new WebGpuDevice({}).ready
    const palette = new SkinPalette(device, { format: 'dualquat', capacity: 8 })
    const rig = chainRig()
    const source = palette.allocate(rig.count)
    const target = palette.allocate(3)
    palette.write(source, rig.defaultModelPose, rig)
    palette.data.fill(5, target * 8, (target + 3) * 8)
    palette.remap(source, target, [2, -1, 0])
    const data = palette.data
    expect(Array.from(data.subarray(target * 8, target * 8 + 8))).toEqual(
      Array.from(data.subarray((source + 2) * 8, (source + 3) * 8)),
    )
    expect(Array.from(data.subarray((target + 1) * 8, (target + 2) * 8))).toEqual([0, 0, 0, 1, 0, 0, 0, 0])
    expect(Array.from(data.subarray((target + 2) * 8, (target + 3) * 8))).toEqual(
      Array.from(data.subarray(source * 8, (source + 1) * 8)),
    )
    palette.dispose()
  })
})

describe('pose helpers', () => {
  it('copies and clears', () => {
    const a = new AnimationPose(1)
    a.translations.set([1, 2, 3])
    const b = poseCopy(a, new AnimationPose(1))
    expect(translation(b, 0)).toEqual([1, 2, 3])
    poseClear(b)
    expect(rotation(b, 0)).toEqual([0, 0, 0, 0])
    expect(b.weights[0]).toBe(0)
  })
})
