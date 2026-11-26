import { BufferUsage, ResourceOwnership, type Buffer, type Device, type Ownable } from '@gglib/graphics'
import type { AnimationPose } from './AnimationPose'
import type { AnimationRig } from './AnimationRig'

/**
 * The layout of a skinning palette: a column major 4x4 matrix (16 floats) or a dual quaternion (8 floats: real x y z
 * w, dual x y z w) per joint
 *
 * @public
 */
export type SkinFormat = 'mat4' | 'dualquat'

/**
 * Floats per joint of a palette format
 *
 * @public
 */
export function skinFormatSize(format: SkinFormat): number {
  return format === 'mat4' ? 16 : 8
}

/**
 * Writes the skinning transforms of a model space pose: per joint the pose times the inverse default model transform,
 * which moves a vertex bound in the default pose
 *
 * @public
 *
 * @remarks
 * Dual quaternions carry no scale: a scaled pose moves the joint origins (translations) but not the rotation part, use
 * matrices for scaled rigs. Each joint's dual quaternion is turned to the hemisphere of its parent's, so
 * blending the influences of a vertex does not flip (CryAnimation skinning transforms).
 *
 * @param model - the pose in model space (see {@link poseToModel})
 * @param offset - the first joint in `out`, in joints
 */
export function writeSkinPalette(
  model: AnimationPose,
  rig: AnimationRig,
  format: SkinFormat,
  out: Float32Array,
  offset: number,
) {
  const pr = model.rotations
  const pt = model.translations
  const ps = model.scales
  const ir = rig.inverseBindRotations
  const it = rig.inverseBindTranslations
  const is = rig.inverseBindScales
  const size = skinFormatSize(format)
  for (let j = 0; j < rig.count; j++) {
    const r = j * 4
    const t = j * 3
    const o = (offset + j) * size
    const px = pr[r]
    const py = pr[r + 1]
    const pz = pr[r + 2]
    const pw = pr[r + 3]
    const bx = ir[r]
    const by = ir[r + 1]
    const bz = ir[r + 2]
    const bw = ir[r + 3]
    // rotation = pose * inverse bind
    let qx = px * bw + bx * pw + py * bz - pz * by
    let qy = py * bw + by * pw + pz * bx - px * bz
    let qz = pz * bw + bz * pw + px * by - py * bx
    let qw = pw * bw - px * bx - py * by - pz * bz
    // translation = pose.t + pose.r * (pose.s * inverseBind.t), the inverse bind translation includes 1 / default scale
    let vx = it[t]
    let vy = it[t + 1]
    let vz = it[t + 2]
    if (ps) {
      vx *= ps[t]
      vy *= ps[t + 1]
      vz *= ps[t + 2]
    }
    const cx = py * vz - pz * vy
    const cy = pz * vx - px * vz
    const cz = px * vy - py * vx
    const tx = pt[t] + vx + 2 * (pw * cx + py * cz - pz * cy)
    const ty = pt[t + 1] + vy + 2 * (pw * cy + pz * cx - px * cz)
    const tz = pt[t + 2] + vz + 2 * (pw * cz + px * cy - py * cx)

    if (format === 'dualquat') {
      const parent = rig.parents[j]
      if (parent >= 0) {
        const p = (offset + parent) * size
        if (qx * out[p] + qy * out[p + 1] + qz * out[p + 2] + qw * out[p + 3] < 0) {
          qx = -qx
          qy = -qy
          qz = -qz
          qw = -qw
        }
      }
      out[o] = qx
      out[o + 1] = qy
      out[o + 2] = qz
      out[o + 3] = qw
      // dual = 0.5 * (t, 0) * real
      out[o + 4] = 0.5 * (tx * qw + ty * qz - tz * qy)
      out[o + 5] = 0.5 * (ty * qw + tz * qx - tx * qz)
      out[o + 6] = 0.5 * (tz * qw + tx * qy - ty * qx)
      out[o + 7] = -0.5 * (tx * qx + ty * qy + tz * qz)
      continue
    }

    // matrix: pose rotation * (pose scale / default scale) * inverse bind rotation, column major
    let sx = 1
    let sy = 1
    let sz = 1
    if (ps) {
      sx = ps[t]
      sy = ps[t + 1]
      sz = ps[t + 2]
    }
    if (is) {
      sx *= is[t]
      sy *= is[t + 1]
      sz *= is[t + 2]
    }
    if (sx === 1 && sy === 1 && sz === 1) {
      writeRotation(qx, qy, qz, qw, out, o)
    } else {
      // R(pose) * S * R(inverse bind): rotate the scaled axes of the inverse bind rotation
      writeRotation(bx, by, bz, bw, out, o)
      for (let c = 0; c < 3; c++) {
        const k = o + c * 4
        const ax = out[k] * sx
        const ay = out[k + 1] * sy
        const az = out[k + 2] * sz
        const dx = py * az - pz * ay
        const dy = pz * ax - px * az
        const dz = px * ay - py * ax
        out[k] = ax + 2 * (pw * dx + py * dz - pz * dy)
        out[k + 1] = ay + 2 * (pw * dy + pz * dx - px * dz)
        out[k + 2] = az + 2 * (pw * dz + px * dy - py * dx)
      }
    }
    out[o + 3] = 0
    out[o + 7] = 0
    out[o + 11] = 0
    out[o + 12] = tx
    out[o + 13] = ty
    out[o + 14] = tz
    out[o + 15] = 1
  }
}

/**
 * Writes column major joint matrices (e.g. {@link Skeleton.jointMatrices}) in the palette format
 *
 * @public
 *
 * @remarks
 * Dual quaternions take the rotation and translation of each matrix, the scale is dropped. A joint is turned to the
 * hemisphere of its parent's dual quaternion when the parent comes first.
 *
 * @param matrices - 16 floats per joint
 * @param parents - the parent joint per joint, negative for a root, null without a hierarchy
 * @param offset - the first joint in `out`, in joints
 */
export function writeSkinPaletteMatrices(
  matrices: ArrayLike<number>,
  count: number,
  parents: ArrayLike<number> | null,
  format: SkinFormat,
  out: Float32Array,
  offset: number,
) {
  const size = skinFormatSize(format)
  for (let j = 0; j < count; j++) {
    const m = j * 16
    const o = (offset + j) * size
    if (format === 'mat4') {
      for (let i = 0; i < 16; i++) {
        out[o + i] = matrices[m + i]
      }
      continue
    }
    // rotation of the normalized axes, element (row r, column c) at m + c * 4 + r
    const sx = Math.hypot(matrices[m], matrices[m + 1], matrices[m + 2]) || 1
    const sy = Math.hypot(matrices[m + 4], matrices[m + 5], matrices[m + 6]) || 1
    const sz = Math.hypot(matrices[m + 8], matrices[m + 9], matrices[m + 10]) || 1
    const r00 = matrices[m] / sx
    const r10 = matrices[m + 1] / sx
    const r20 = matrices[m + 2] / sx
    const r01 = matrices[m + 4] / sy
    const r11 = matrices[m + 5] / sy
    const r21 = matrices[m + 6] / sy
    const r02 = matrices[m + 8] / sz
    const r12 = matrices[m + 9] / sz
    const r22 = matrices[m + 10] / sz
    let qx: number
    let qy: number
    let qz: number
    let qw: number
    const trace = r00 + r11 + r22
    if (trace > 0) {
      const s = 0.5 / Math.sqrt(trace + 1)
      qw = 0.25 / s
      qx = (r21 - r12) * s
      qy = (r02 - r20) * s
      qz = (r10 - r01) * s
    } else if (r00 > r11 && r00 > r22) {
      const s = 2 * Math.sqrt(1 + r00 - r11 - r22)
      qw = (r21 - r12) / s
      qx = 0.25 * s
      qy = (r01 + r10) / s
      qz = (r02 + r20) / s
    } else if (r11 > r22) {
      const s = 2 * Math.sqrt(1 + r11 - r00 - r22)
      qw = (r02 - r20) / s
      qx = (r01 + r10) / s
      qy = 0.25 * s
      qz = (r12 + r21) / s
    } else {
      const s = 2 * Math.sqrt(1 + r22 - r00 - r11)
      qw = (r10 - r01) / s
      qx = (r02 + r20) / s
      qy = (r12 + r21) / s
      qz = 0.25 * s
    }
    const parent = parents ? parents[j] : -1
    if (parent >= 0 && parent < j) {
      const p = (offset + parent) * size
      if (qx * out[p] + qy * out[p + 1] + qz * out[p + 2] + qw * out[p + 3] < 0) {
        qx = -qx
        qy = -qy
        qz = -qz
        qw = -qw
      }
    }
    const tx = matrices[m + 12]
    const ty = matrices[m + 13]
    const tz = matrices[m + 14]
    out[o] = qx
    out[o + 1] = qy
    out[o + 2] = qz
    out[o + 3] = qw
    // dual = 0.5 * (t, 0) * real
    out[o + 4] = 0.5 * (tx * qw + ty * qz - tz * qy)
    out[o + 5] = 0.5 * (ty * qw + tz * qx - tx * qz)
    out[o + 6] = 0.5 * (tz * qw + tx * qy - ty * qx)
    out[o + 7] = -0.5 * (tx * qx + ty * qy + tz * qz)
  }
}

/**
 * Rotation matrix of a unit quaternion into the upper 3x3 of a column major 4x4 at `o`
 */
function writeRotation(x: number, y: number, z: number, w: number, out: Float32Array, o: number) {
  const xx = x * x
  const yy = y * y
  const zz = z * z
  const xy = x * y
  const xz = x * z
  const yz = y * z
  const wx = w * x
  const wy = w * y
  const wz = w * z
  out[o] = 1 - 2 * (yy + zz)
  out[o + 1] = 2 * (xy + wz)
  out[o + 2] = 2 * (xz - wy)
  out[o + 4] = 2 * (xy - wz)
  out[o + 5] = 1 - 2 * (xx + zz)
  out[o + 6] = 2 * (yz + wx)
  out[o + 8] = 2 * (xz + wy)
  out[o + 9] = 2 * (yz - wx)
  out[o + 10] = 1 - 2 * (xx + yy)
}

/**
 * @public
 */
export interface SkinPaletteOptions {
  format: SkinFormat
  /**
   * Initial capacity in joints, grows by doubling. Default 256.
   */
  capacity?: number
  name?: string
}

/**
 * One storage buffer with the skinning palettes of many characters
 *
 * @public
 *
 * @remarks
 * Each character allocates a range of joints and writes its palette there, a draw reads its joints at that offset.
 * Materials stay shared between characters that play different animations. Upload once per frame.
 * Growing keeps the {@link buffer} object but replaces its GPU storage: {@link version} counts that, rebind on change.
 */
export class SkinPalette implements Ownable {
  public readonly ownership: ResourceOwnership = new ResourceOwnership(this)
  public readonly format: SkinFormat
  /**
   * Floats per joint
   */
  public readonly stride: number
  public readonly buffer: Buffer
  /**
   * The CPU copy of the palettes
   */
  public get data(): Float32Array<ArrayBuffer> {
    return this._data
  }
  /**
   * Capacity in joints
   */
  public get capacity(): number {
    return this._data.length / this.stride
  }
  /**
   * Incremented when the buffer's storage is replaced
   */
  public get version(): number {
    return this._version
  }

  private _data: Float32Array<ArrayBuffer>
  private _version = 0
  private used = 0
  /**
   * Released ranges: offset and count, pairs
   */
  private readonly free: number[] = []
  private dirtyMin = Infinity
  private dirtyMax = -Infinity

  public constructor(device: Device, options: SkinPaletteOptions) {
    this.format = options.format
    this.stride = skinFormatSize(options.format)
    this._data = new Float32Array(Math.max(1, options.capacity ?? 256) * this.stride)
    this.buffer = this.ownership.adopt(
      device.createBuffer({
        name: options.name ?? 'skin palette',
        usage: BufferUsage.STORAGE,
        size: this._data.byteLength,
      }),
    )
  }

  /**
   * Reserves a range of joints
   *
   * @returns the offset of the range, in joints
   */
  public allocate(count: number): number {
    for (let i = 0; i < this.free.length; i += 2) {
      if (this.free[i + 1] === count) {
        const offset = this.free[i]
        this.free.splice(i, 2)
        return offset
      }
    }
    const offset = this.used
    this.used += count
    if (this.used > this.capacity) {
      this.grow(this.used)
    }
    return offset
  }

  /**
   * Releases a range of {@link allocate}
   */
  public release(offset: number, count: number) {
    this.free.push(offset, count)
  }

  /**
   * Writes the palette of a model space pose at a range
   */
  public write(offset: number, model: AnimationPose, rig: AnimationRig) {
    writeSkinPalette(model, rig, this.format, this._data, offset)
    this.dirtyMin = Math.min(this.dirtyMin, offset)
    this.dirtyMax = Math.max(this.dirtyMax, offset + rig.count)
  }

  /**
   * Writes column major joint matrices at a range, see {@link writeSkinPaletteMatrices}
   */
  public writeMatrices(offset: number, matrices: ArrayLike<number>, count: number, parents: ArrayLike<number> | null) {
    writeSkinPaletteMatrices(matrices, count, parents, this.format, this._data, offset)
    this.dirtyMin = Math.min(this.dirtyMin, offset)
    this.dirtyMax = Math.max(this.dirtyMax, offset + count)
  }

  /**
   * Copies joints of a written range into another range in a different order, for a mesh whose joint indices do not
   * follow the rig (e.g. a skin with its own bone list)
   *
   * @param source - offset of the range the rig was written to
   * @param target - offset of the mesh's range
   * @param joints - the rig joint per mesh joint, negative for a joint the rig lacks: it gets the identity transform
   *   (the vertex stays where the mesh has it)
   */
  public remap(source: number, target: number, joints: ArrayLike<number>) {
    const data = this._data
    const stride = this.stride
    for (let i = 0; i < joints.length; i++) {
      const o = (target + i) * stride
      const joint = joints[i]
      if (joint >= 0) {
        data.copyWithin(o, (source + joint) * stride, (source + joint + 1) * stride)
        continue
      }
      data.fill(0, o, o + stride)
      if (this.format === 'dualquat') {
        // real w
        data[o + 3] = 1
      } else {
        data[o] = 1
        data[o + 5] = 1
        data[o + 10] = 1
        data[o + 15] = 1
      }
    }
    this.dirtyMin = Math.min(this.dirtyMin, target)
    this.dirtyMax = Math.max(this.dirtyMax, target + joints.length)
  }

  /**
   * Uploads the ranges written since the last upload
   */
  public upload() {
    if (this.dirtyMax <= this.dirtyMin) {
      return
    }
    const start = this.dirtyMin * this.stride
    const length = (this.dirtyMax - this.dirtyMin) * this.stride
    this.buffer.setSubData(start * 4, this._data, start, length)
    this.dirtyMin = Infinity
    this.dirtyMax = -Infinity
  }

  /**
   * Releases the buffer
   */
  public dispose() {
    this.ownership.finalize()
  }

  private grow(required: number) {
    let capacity = this.capacity
    while (capacity < required) {
      capacity *= 2
    }
    const data = new Float32Array(capacity * this.stride)
    data.set(this._data)
    this._data = data
    // setData replaces the GPU storage on a size change and uploads everything (reset keeps an existing resource)
    this.buffer.setData(data)
    this._version++
  }
}
