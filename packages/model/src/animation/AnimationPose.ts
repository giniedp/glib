/**
 * The transforms of all joints of a rig, structure of arrays
 *
 * @public
 *
 * @remarks
 * Holds no objects per joint, so sampling and blending allocate nothing.
 * A pose is local (each joint relative to its parent) or model space (see {@link poseToModel}), the pose does not
 * know which.
 */
export class AnimationPose {
  /**
   * Number of joints
   */
  public readonly count: number
  /**
   * Translation x y z per joint
   */
  public readonly translations: Float32Array<ArrayBuffer>
  /**
   * Rotation quaternion x y z w per joint
   */
  public readonly rotations: Float32Array<ArrayBuffer>
  /**
   * Scale x y z per joint, null for rigs without scale
   */
  public readonly scales: Float32Array<ArrayBuffer> | null
  /**
   * Accumulated weight per joint while blending (see {@link PoseBlender}), 1 for a complete pose
   */
  public readonly weights: Float32Array<ArrayBuffer>

  public constructor(count: number, options?: { scale?: boolean }) {
    this.count = count
    this.translations = new Float32Array(count * 3)
    this.rotations = new Float32Array(count * 4)
    this.scales = options?.scale ? new Float32Array(count * 3) : null
    this.weights = new Float32Array(count)
    poseIdentity(this)
  }

  /**
   * A pose of the same size and channels
   */
  public clone(): AnimationPose {
    const result = new AnimationPose(this.count, { scale: !!this.scales })
    poseCopy(this, result)
    return result
  }
}

/**
 * Sets every joint to the identity transform with weight 1
 *
 * @public
 */
export function poseIdentity(out: AnimationPose): AnimationPose {
  out.translations.fill(0)
  out.rotations.fill(0)
  for (let i = 3; i < out.rotations.length; i += 4) {
    out.rotations[i] = 1
  }
  out.scales?.fill(1)
  out.weights.fill(1)
  return out
}

/**
 * Copies a pose, the poses must have the same joint count. Scales are copied when both have them.
 *
 * @public
 */
export function poseCopy(src: AnimationPose, out: AnimationPose): AnimationPose {
  out.translations.set(src.translations)
  out.rotations.set(src.rotations)
  if (out.scales && src.scales) {
    out.scales.set(src.scales)
  } else {
    out.scales?.fill(1)
  }
  out.weights.set(src.weights)
  return out
}

/**
 * Zeroes all channels and weights, the start of a weighted accumulation (Cry `ClearPoseBuffer`)
 *
 * @public
 */
export function poseClear(out: AnimationPose): AnimationPose {
  out.translations.fill(0)
  out.rotations.fill(0)
  out.scales?.fill(0)
  out.weights.fill(0)
  return out
}

/**
 * Composes a local pose into model space: each joint after its parent (parents must come first)
 *
 * @public
 *
 * @remarks
 * `model.rotation = parent.rotation * local.rotation`,
 * `model.translation = parent.translation + parent.rotation * (parent.scale * local.translation)`.
 * Rotations are normalized, a near zero quaternion (squared length below 1e-8) becomes the identity, as Cry's
 * relative-to-model pass does. Model space scale is the product of the scales (no shear).
 *
 * @param local - the local pose
 * @param parents - parent index per joint, negative for roots
 * @param out - the model space pose, may not be `local`
 */
export function poseToModel(local: AnimationPose, parents: ArrayLike<number>, out: AnimationPose): AnimationPose {
  const localTranslations = local.translations
  const localRotations = local.rotations
  const localScales = local.scales
  const outTranslations = out.translations
  const outRotations = out.rotations
  const outScales = out.scales
  for (let j = 0; j < local.count; j++) {
    const t = j * 3
    const r = j * 4
    const p = parents[j]
    if (p < 0) {
      outTranslations[t] = localTranslations[t]
      outTranslations[t + 1] = localTranslations[t + 1]
      outTranslations[t + 2] = localTranslations[t + 2]
      normalizeInto(
        localRotations[r],
        localRotations[r + 1],
        localRotations[r + 2],
        localRotations[r + 3],
        outRotations,
        r,
      )
      if (outScales) {
        writeScale(localScales, t, outScales)
      }
      out.weights[j] = 1
      continue
    }
    const pt = p * 3
    const pr = p * 4
    const px = outRotations[pr]
    const py = outRotations[pr + 1]
    const pz = outRotations[pr + 2]
    const pw = outRotations[pr + 3]
    // the local translation in the parent's scaled frame
    let x = localTranslations[t]
    let y = localTranslations[t + 1]
    let z = localTranslations[t + 2]
    if (outScales) {
      x *= outScales[pt]
      y *= outScales[pt + 1]
      z *= outScales[pt + 2]
    }
    // rotate by the parent rotation: v + 2w(q×v) + 2q×(q×v)
    const cx = py * z - pz * y
    const cy = pz * x - px * z
    const cz = px * y - py * x
    outTranslations[t] = outTranslations[pt] + x + 2 * (pw * cx + py * cz - pz * cy)
    outTranslations[t + 1] = outTranslations[pt + 1] + y + 2 * (pw * cy + pz * cx - px * cz)
    outTranslations[t + 2] = outTranslations[pt + 2] + z + 2 * (pw * cz + px * cy - py * cx)
    // parent * local
    const qx = localRotations[r]
    const qy = localRotations[r + 1]
    const qz = localRotations[r + 2]
    const qw = localRotations[r + 3]
    normalizeInto(
      px * qw + qx * pw + py * qz - pz * qy,
      py * qw + qy * pw + pz * qx - px * qz,
      pz * qw + qz * pw + px * qy - py * qx,
      pw * qw - px * qx - py * qy - pz * qz,
      outRotations,
      r,
    )
    if (outScales) {
      outScales[t] = outScales[pt] * (localScales ? localScales[t] : 1)
      outScales[t + 1] = outScales[pt + 1] * (localScales ? localScales[t + 1] : 1)
      outScales[t + 2] = outScales[pt + 2] * (localScales ? localScales[t + 2] : 1)
    }
    out.weights[j] = 1
  }
  return out
}

/**
 * Normalizes every rotation, a near zero quaternion (squared length below 1e-4) becomes the identity
 * (Cry `NormalizeFull`)
 *
 * @public
 */
export function poseNormalize(out: AnimationPose): AnimationPose {
  const q = out.rotations
  for (let r = 0; r < q.length; r += 4) {
    const lengthSq = q[r] * q[r] + q[r + 1] * q[r + 1] + q[r + 2] * q[r + 2] + q[r + 3] * q[r + 3]
    if (lengthSq < 1e-4) {
      q[r] = 0
      q[r + 1] = 0
      q[r + 2] = 0
      q[r + 3] = 1
    } else {
      const inv = 1 / Math.sqrt(lengthSq)
      q[r] *= inv
      q[r + 1] *= inv
      q[r + 2] *= inv
      q[r + 3] *= inv
    }
  }
  return out
}

/**
 * Writes the normalized quaternion, the identity for a near zero one (squared length at most 1e-8)
 */
function normalizeInto(x: number, y: number, z: number, w: number, out: Float32Array, offset: number) {
  const lengthSq = x * x + y * y + z * z + w * w
  if (lengthSq <= 1e-8) {
    out[offset] = 0
    out[offset + 1] = 0
    out[offset + 2] = 0
    out[offset + 3] = 1
    return
  }
  const inv = 1 / Math.sqrt(lengthSq)
  out[offset] = x * inv
  out[offset + 1] = y * inv
  out[offset + 2] = z * inv
  out[offset + 3] = w * inv
}

function writeScale(src: Float32Array | null, offset: number, out: Float32Array) {
  if (src) {
    out[offset] = src[offset]
    out[offset + 1] = src[offset + 1]
    out[offset + 2] = src[offset + 2]
  } else {
    out[offset] = 1
    out[offset + 1] = 1
    out[offset + 2] = 1
  }
}
