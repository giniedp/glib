import { AnimationPose, poseToModel } from './AnimationPose'
import type { AnimationClipBinding, AnimationTrackClip } from './AnimationTrackClip'

/**
 * @public
 */
export interface AnimationRigOptions {
  /**
   * Joint names, one per joint
   */
  names: ReadonlyArray<string>
  /**
   * Parent joint index per joint, negative for roots. Parents must come before their children.
   */
  parents: ArrayLike<number>
  /**
   * The default local pose (each joint relative to its parent)
   */
  defaultPose: AnimationPose
  /**
   * The id clips address a joint with (see {@link AnimationTrack.target}), one per joint: e.g. a glTF node index or
   * a Cry controller id. Defaults to the joint index.
   */
  targets?: ArrayLike<number>
}

/**
 * The joints a pose is about: hierarchy, default pose and inverse bind transforms
 *
 * @public
 *
 * @remarks
 * Immutable. Bindings of clips to the rig are built once and kept on the rig ({@link bind}).
 */
export class AnimationRig {
  public readonly count: number
  public readonly names: ReadonlyArray<string>
  public readonly parents: Int16Array
  /**
   * The default local pose
   */
  public readonly defaultPose: AnimationPose
  /**
   * The default pose in model space
   */
  public readonly defaultModelPose: AnimationPose
  /**
   * The inverse of each joint's default model transform as rotation (x y z w per joint)
   */
  public readonly inverseBindRotations: Float32Array<ArrayBuffer>
  /**
   * The inverse of each joint's default model transform as translation (x y z per joint), applied after
   * {@link inverseBindRotations} and {@link inverseBindScales}
   */
  public readonly inverseBindTranslations: Float32Array<ArrayBuffer>
  /**
   * The inverse of each joint's default model scale (x y z per joint), null for rigs without scale
   */
  public readonly inverseBindScales: Float32Array<ArrayBuffer> | null
  /**
   * The target id per joint, see {@link AnimationRigOptions.targets}
   */
  public readonly targets: ReadonlyArray<number>

  private readonly jointsByTarget = new Map<number, number>()
  private readonly bindings = new Map<AnimationTrackClip, AnimationClipBinding>()

  public constructor(options: AnimationRigOptions) {
    const count = options.names.length
    if (options.parents.length !== count || options.defaultPose.count !== count) {
      throw new Error(`AnimationRig: names, parents and default pose must have the same count (${count})`)
    }
    this.count = count
    this.names = options.names
    this.parents = Int16Array.from(options.parents)
    for (let i = 0; i < count; i++) {
      if (this.parents[i] >= i) {
        throw new Error(`AnimationRig: joint ${i} has parent ${this.parents[i]}, parents must come first`)
      }
    }
    this.defaultPose = options.defaultPose
    this.targets = options.targets ? Array.from(options.targets) : Array.from({ length: count }, (_, i) => i)
    for (let i = 0; i < count; i++) {
      if (!this.jointsByTarget.has(this.targets[i])) {
        this.jointsByTarget.set(this.targets[i], i)
      }
    }
    this.defaultModelPose = poseToModel(
      this.defaultPose,
      this.parents,
      new AnimationPose(count, { scale: !!this.defaultPose.scales }),
    )
    this.inverseBindRotations = new Float32Array(count * 4)
    this.inverseBindTranslations = new Float32Array(count * 3)
    const ms = this.defaultModelPose.scales
    this.inverseBindScales = ms ? new Float32Array(count * 3) : null
    const mr = this.defaultModelPose.rotations
    const mt = this.defaultModelPose.translations
    for (let j = 0; j < count; j++) {
      // the inverse of x → t + q·(s ⊙ x) is y → (1/s) ⊙ (q*·(y - t))
      const r = j * 4
      const t = j * 3
      const x = -mr[r]
      const y = -mr[r + 1]
      const z = -mr[r + 2]
      const w = mr[r + 3]
      this.inverseBindRotations[r] = x
      this.inverseBindRotations[r + 1] = y
      this.inverseBindRotations[r + 2] = z
      this.inverseBindRotations[r + 3] = w
      const tx = -mt[t]
      const ty = -mt[t + 1]
      const tz = -mt[t + 2]
      const cx = y * tz - z * ty
      const cy = z * tx - x * tz
      const cz = x * ty - y * tx
      let ix = tx + 2 * (w * cx + y * cz - z * cy)
      let iy = ty + 2 * (w * cy + z * cx - x * cz)
      let iz = tz + 2 * (w * cz + x * cy - y * cx)
      if (ms && this.inverseBindScales) {
        const sx = inverse(ms[t])
        const sy = inverse(ms[t + 1])
        const sz = inverse(ms[t + 2])
        this.inverseBindScales[t] = sx
        this.inverseBindScales[t + 1] = sy
        this.inverseBindScales[t + 2] = sz
        ix *= sx
        iy *= sy
        iz *= sz
      }
      this.inverseBindTranslations[t] = ix
      this.inverseBindTranslations[t + 1] = iy
      this.inverseBindTranslations[t + 2] = iz
    }
  }

  /**
   * The joint a target id addresses, -1 when the rig has none
   */
  public jointOf(target: number): number {
    return this.jointsByTarget.get(target) ?? -1
  }

  /**
   * The joint with the name, -1 when the rig has none
   */
  public jointByName(name: string): number {
    return this.names.indexOf(name)
  }

  /**
   * Binds the tracks of a clip to the joints of this rig by their target ids, built once per clip
   */
  public bind(clip: AnimationTrackClip): AnimationClipBinding {
    let result = this.bindings.get(clip)
    if (!result) {
      result = {
        clip,
        // a track without keys has nothing to sample
        joints: Int16Array.from(clip.tracks, (it) => (it.times.length ? this.jointOf(it.target) : -1)),
      }
      this.bindings.set(clip, result)
    }
    return result
  }

  /**
   * Forgets the binding of a clip, e.g. when the clip is unloaded
   */
  public unbind(clip: AnimationTrackClip) {
    this.bindings.delete(clip)
  }

  /**
   * A mask of the joints selected by the predicate, for {@link AnimationMixer.play}
   */
  public mask(select: (joint: number, rig: AnimationRig) => boolean): Uint8Array {
    const result = new Uint8Array(this.count)
    for (let j = 0; j < this.count; j++) {
      result[j] = select(j, this) ? 1 : 0
    }
    return result
  }

  /**
   * A mask of a joint and all joints below it
   */
  public maskBranch(joint: number): Uint8Array {
    const result = new Uint8Array(this.count)
    if (joint < 0) {
      return result
    }
    result[joint] = 1
    for (let j = joint + 1; j < this.count; j++) {
      const parent = this.parents[j]
      if (parent >= 0 && result[parent]) {
        result[j] = 1
      }
    }
    return result
  }
}

function inverse(value: number) {
  return value === 0 ? 0 : 1 / value
}
