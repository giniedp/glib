import { Log } from '@glib/core'
import { IVec3, IVec4, Mat4 } from '@glib/math'

export interface PlayerOptions {
  skeleton: number[]
  pose: Mat4[]
  takes: AnimationTake[]
}

export interface AnimationTake {
  name: string
  duration: number
  keyframes: AnimationFrame[]
}

export interface AnimationFrame {
  time: number
  bone: number
  position: IVec3
  rotation: IVec4
  scale: IVec3
}

const tempMat = Mat4.createIdentity()

export class AnimationPlayer {
  /**
   * The skeleton bone hierarchy
   */
  public skeleton: number[]
  /**
   * The binding pose
   */
  public pose: Mat4[]
  /**
   * The inverse binding pose
   */
  public poseInverse: Mat4[]
  /**
   * Collection of all animation takes for this model
   */
  public takes: AnimationTake[]

  /**
   * The transform matrix for the roo bone. This is optional
   * and may be used if the root position needs to be shifted
   */
  public rootTransform: Mat4

  /**
   * The calculated bone transforms for current frame.
   * Each entry is a relative transform seen from parent bone.
   */
  public boneTransforms: Mat4[]
  /**
   * The calculated world transforms for current frame
   * Each entry is an absolute transform for that bone.
   */
  public worldTransforms: Mat4[]
  /**
   * The calculated skin transforms for current frame
   */
  public skinTransforms: Mat4[]

  public take: AnimationTake
  public time: number

  private frame: number

  constructor(options: PlayerOptions) {
    this.setup(options)
  }

  public setup(options: PlayerOptions) {
    this.skeleton = options.skeleton
    this.pose = options.pose
    this.takes = options.takes
    this.take = this.takes[0]

    let isValid = true
    if (!this.skeleton) {
      Log.w('[Player] skeleton is missing')
    }
    if (!this.pose) {
      Log.w('[Player] pose is missing')
    }
    if (this.skeleton && this.pose && this.skeleton.length !== this.pose.length) {
      Log.w('[Player] skeleton and pose dont match')
    }
    if (!this.takes) {
      Log.w('[Player] takes are missing')
      isValid = false
    }

    // generate inverse of the binding pose
    this.poseInverse = []
    for (const mat of this.pose) {
      this.poseInverse.push(Mat4.invert(mat))
    }

    // create transform matrices
    this.boneTransforms = this.boneTransforms || []
    this.worldTransforms = this.worldTransforms || []
    this.skinTransforms = this.skinTransforms || []

    // ensure all matrices are initialized
    for (let i = 0; i < this.skeleton.length; i++) {
      this.boneTransforms[i] = this.boneTransforms[i] || Mat4.createIdentity()
      this.worldTransforms[i] = this.worldTransforms[i] || Mat4.createIdentity()
      this.skinTransforms[i] = this.skinTransforms[i] || Mat4.createIdentity()

      this.boneTransforms[i].initIdentity()
      this.worldTransforms[i].initIdentity()
      this.skinTransforms[i].initIdentity()
    }
  }

  public play(nameOrIndex?: string|number) {
    if (nameOrIndex != null) {
      if (typeof nameOrIndex === 'number') {
        this.take = this.takes[nameOrIndex]
      } else {
        this.take = this.takes.find((it) => it.name === nameOrIndex)
      }
    }

    if (!this.take) {
      Log.w('[Player] cant play animation. Take is not set')
      return
    }

    this.time = 0
    this.frame = 0
    for (let i = 0; i < this.pose.length; i++) {
      this.boneTransforms[i].initFrom(this.pose[i])
    }
  }

  public update(dt: number) {
    this.updateTime(this.time + dt)
  }

  public updateTime(time: number) {
    while (time >= this.take.duration) {
      time -= this.take.duration
    }
    if (time < this.time) {
      this.frame = 0
      for (let i = 0; i < this.pose.length; i++) {
        this.boneTransforms[i].initFrom(this.pose[i])
      }
    }

    while (this.frame < this.take.keyframes.length) {
      const keyframe = this.take.keyframes[this.frame]
      if (keyframe.time > time) {
        break
      }

      this.boneTransforms[keyframe.bone]
        .initIdentity()
        .setScale(keyframe.scale)
        .multiply(tempMat.initFromQuaternion(keyframe.rotation))
        .setTranslation(keyframe.position)

      this.frame++
    }
    this.time = time

    this.updateWorld()
    this.updateSkin()
  }

  private updateWorld() {
    for (let bone = 0; bone < this.worldTransforms.length; bone++) {
      const parent = this.skeleton[bone]
      if (parent === -1) {
        if (this.rootTransform) {
          Mat4.multiply(this.boneTransforms[0], this.rootTransform, this.worldTransforms[0])
        } else {
          this.worldTransforms[0].initFrom(this.boneTransforms[0])
        }
      } else {
        Mat4.multiply(this.boneTransforms[bone], this.worldTransforms[parent], this.worldTransforms[bone])
      }
    }
  }

  private updateSkin() {
    for (let i = 0; i < this.skinTransforms.length; i++) {
      Mat4.multiply(this.poseInverse[i], this.worldTransforms[i], this.skinTransforms[i])
    }
  }
}

export default AnimationPlayer
