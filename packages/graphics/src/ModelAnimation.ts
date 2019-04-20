import { Log } from '@gglib/core'
import { Mat4, Quat, Vec3, Vec4 } from '@gglib/math'
import { ModelJoint, ModelJointPose, ModelSkin } from './ModelSkin'

/**
 * @public
 */
export type ModelAnimationSample = ModelJointPose[]

/**
 * @public
 */
export interface ModelAnimationClip {
  /**
   * The name of this animation clip
   */
  name: string
  /**
   * Frames per second
   */
  fps: number
  /**
   * All samples
   */
  samples: ModelAnimationSample[]
}

export interface ModelAnimationState {
  /**
   * The name of the animation clip that is being played
   */
  name: string
  /**
   * The local clock time
   */
  time: number
  /**
   * The blend weight
   */
  weight: number
  /**
   * Whether the animation is being played
   */
  active: number
  /**
   * Whether the animation is being looped
   */
  loop: number
}

/**
 * @public
 */
export interface ModelAnimationOptions extends ModelSkin {
  clips: ReadonlyArray<ModelAnimationClip>
}

const tempMat = Mat4.createIdentity()

/**
 * @public
 */
export class ModelAnimation {
  /**
   * The skeleton bone hierarchy
   */
  protected hierarchy: ReadonlyArray<ModelJoint>
  /**
   * The binding pose
   */
  protected bindPose: ReadonlyArray<ModelJointPose>
  /**
   * The inverse binding pose
   */
  protected inverseBindPose: ReadonlyArray<Mat4>

  /**
   * Collection of animation clips
   */
  protected clips: ReadonlyArray<ModelAnimationClip>

  /**
   * The calculated bone transforms for current frame.
   * Each entry is a relative transform seen from parent bone.
   */
  public localTransforms: ModelJointPose[]
  /**
   * The calculated world transforms for current frame
   * Each entry is an absolute transform for that bone.
   */
  public globalTransforms: ModelJointPose[]
  /**
   * The calculated skin transforms for current frame
   */
  public skinTransforms: Mat4[]

  public clip: ModelAnimationClip
  public time: number

  public get jointCount() {
    return this.hierarchy ? this.hierarchy.length : 0
  }

  constructor(options: ModelAnimationOptions) {
    this.setup(options)
  }

  public setup(options: ModelAnimationOptions) {
    this.hierarchy = options.hierarchy
    this.bindPose = options.bindPose
    this.clips = options.clips
    this.clip = this.clips ? this.clips[0] : null

    if (!this.hierarchy) {
      Log.w('[ModelAnimation] skeleton hierarchy is missing')
      this.hierarchy = []
    }
    if (!this.bindPose) {
      Log.w('[ModelAnimation] bindPose is missing')
      this.bindPose = []
    }
    if (options.inverseBindPose) {
      this.inverseBindPose = options.inverseBindPose.map((it) => new Mat4(it))
    }

    if (this.bindPose.length !== this.jointCount || this.inverseBindPose && this.inverseBindPose.length !== this.jointCount) {
      Log.w('[ModelAnimation] hierarchy and pose or inverseBindPose dont match')
    }

    // create transform matrices
    this.localTransforms = []
    this.globalTransforms = []
    this.skinTransforms = []
    for (let i = 0; i < this.jointCount; i++) {
      this.localTransforms[i] = {
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
        translation: { x: 0, y: 0, z: 0 },
      }
      this.globalTransforms[i] = {
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
        translation: { x: 0, y: 0, z: 0 },
      }
      this.skinTransforms[i] = Mat4.createIdentity()
    }
  }

  public startClip(nameOrIndex: string | number): this {
    this.clip = null
    this.time = 0
    if (this.clips) {
      if (typeof nameOrIndex === 'number') {
        this.clip = this.clips[nameOrIndex]
      } else {
        this.clip = this.clips.find((it) => it.name === nameOrIndex)
      }
    }
    if (!this.clip) {
      Log.w('[ModelAnimation] no clip found with nameOrIndex', nameOrIndex)
    }
    return this
  }

  public update(dt?: number) {
    if (dt != null) {
      this.time += dt
    }
    this.updateLocalTransforms()
    this.updateGlobalTransforms()
    this.updateSkinTransforms()
    return this
  }

  public updateLocalTransforms() {
    if (!this.clip) {
      for (let i = 0; i < this.jointCount; i++) {
        Vec3.clone(Vec3.One, this.localTransforms[i].scale)
        Vec4.clone(Vec4.UnitW, this.localTransforms[i].rotation)
        Vec3.clone(Vec3.Zero, this.localTransforms[i].translation)
      }
      return
    }
    const frameTime = 1000 / this.clip.fps

    const frame = Math.floor(this.time / frameTime) % (this.clip.samples.length - 1)
    const s1 = this.clip.samples[frame]
    const s2 = this.clip.samples[frame + 1] || s1
    const t = (this.time - frame * frameTime) / frameTime

    for (let i = 0; i < this.jointCount; i++) {
      Vec3.lerp(s1[i].scale, s2[i].scale, t, this.localTransforms[i].scale)
      Quat.slerp(s1[i].rotation, s2[i].rotation, t, this.localTransforms[i].rotation)
      Vec3.lerp(s1[i].translation, s2[i].translation, t, this.localTransforms[i].translation)
    }
  }

  public updateGlobalTransforms() {
    for (let i = 0; i < this.jointCount; i++) {
      const local = this.localTransforms[i]
      const output = this.globalTransforms[i]
      const parent = this.globalTransforms[this.hierarchy[i].parent]
      if (!parent) {
        Vec3.clone(local.scale, output.scale)
        Vec4.clone(local.rotation, output.rotation)
        Vec3.clone(local.translation, output.translation)
      } else {
        Vec3.multiply(local.scale, parent.scale, output.scale)
        Quat.multiply(local.rotation, parent.rotation, output.rotation)
        Vec3.add(local.translation, parent.translation, output.translation)
      }
    }
  }

  public updateSkinTransforms() {
    for (let i = 0; i < this.jointCount; i++) {
      const global = this.globalTransforms[i]
      this.skinTransforms[i]
        .initScale(global.scale.x, global.scale.y, global.scale.z)
        .multiply(tempMat.initFromQuaternion(global.rotation))
        .setTranslation(global.translation)
        .concat(this.inverseBindPose[i])
    }
  }
}
