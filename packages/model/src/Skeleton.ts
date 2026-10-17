import { type Buffer, BufferUsage, type Device } from '@gglib/graphics'
import { type Mat4, mat4Multiply, Transform } from '@gglib/math'

/**
 * Maximum number of joints per skeleton when rendering with WebGL
 *
 * @remarks
 * Matches the joint array size of the uniform block in the shaders, 256 joints fit into the minimum uniform block size of 16KB.
 */
export const SKELETON_MAX_JOINTS_WEBGL = 256

const _tmp: Mat4 = new Float32Array(16)

/**
 * Computes the joint matrices of a skin and uploads them to a GPU buffer
 *
 * @public
 *
 * @remarks
 * The joint matrices are in model space: `inverse(root.world) * bone.world * inverseBindMatrix`.
 * The shader applies the model matrix on top, so the joint matrices change only with the pose, not with the model transform.
 */
export class Skeleton {
  /**
   * Bone transforms of this skeleton
   *
   * @remarks
   * The transforms are part of the model or scene graph and are updated
   * from the outside, e.g. by the animation player.
   */
  public readonly bones: ReadonlyArray<Readonly<Transform>>

  /**
   * The skin inverse bind matrices, one per bone
   */
  public readonly inverseBindMatrices: ReadonlyArray<Mat4>

  /**
   * The joint matrices, 16 floats per bone in column major order
   */
  public readonly jointMatrices: Float32Array<ArrayBuffer>

  /**
   * GPU buffer with the {@link jointMatrices}, bind it to `CommonInputs.Skin.Joints`
   *
   * @remarks
   * A storage buffer on WebGPU. On WebGL a uniform buffer with room for {@link SKELETON_MAX_JOINTS_WEBGL} joints.
   * The buffer is not owned by the skeleton, the owner of the skeleton (the model) owns it.
   */
  public readonly buffer: Buffer

  public get boneCount() {
    return this.bones.length
  }

  /**
   * One view into {@link jointMatrices} per bone
   */
  private readonly joints: Mat4[] = []

  public constructor(device: Device, bones: Transform[], inverseBindMatrices: Mat4[]) {
    if (inverseBindMatrices.length !== bones.length) {
      throw new Error(
        `Expected inverse matrices length to match bones length, got ${inverseBindMatrices.length} vs ${bones.length}`,
      )
    }
    this.bones = bones
    this.inverseBindMatrices = inverseBindMatrices
    this.jointMatrices = new Float32Array(bones.length * 16)
    for (let i = 0; i < bones.length; i++) {
      this.joints[i] = this.jointMatrices.subarray(i * 16, i * 16 + 16)
    }

    let size = this.jointMatrices.byteLength
    if (!device.isWebGPU) {
      if (bones.length > SKELETON_MAX_JOINTS_WEBGL) {
        console.warn(`Skeleton has ${bones.length} joints, WebGL supports ${SKELETON_MAX_JOINTS_WEBGL}`)
      }
      size = SKELETON_MAX_JOINTS_WEBGL * 64
    }
    this.buffer = device.createBuffer({
      name: 'skeleton joints',
      usage: device.isWebGPU ? BufferUsage.STORAGE : BufferUsage.UNIFORM,
      size: size,
    })
  }

  /**
   * Updates the joint matrices from the current bone transforms and uploads them
   *
   * @param rootInverse - inverse world matrix of the model root, the joint matrices are relative to it
   */
  public update(rootInverse: Mat4) {
    const count = Math.min(this.boneCount, this.buffer.size / 64)
    for (let i = 0; i < count; i++) {
      mat4Multiply(rootInverse, this.bones[i].world, _tmp)
      mat4Multiply(_tmp, this.inverseBindMatrices[i], this.joints[i])
    }
    // sub data keeps the buffer size, the WebGL uniform block expects the full size
    this.buffer.setSubData(0, this.jointMatrices, 0, count * 16)
  }
}
