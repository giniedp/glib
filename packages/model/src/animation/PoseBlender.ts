import type { AnimationPose } from './AnimationPose'

/**
 * Selects joints: a non-zero entry per joint takes part, null selects all joints
 *
 * @public
 */
export type JointMask = Uint8Array | null

/**
 * The routine an {@link AnimationMixer} blends poses with
 *
 * @public
 *
 * @remarks
 * A layer accumulates its entries with {@link PoseBlender.begin}, {@link PoseBlender.add} and {@link PoseBlender.end},
 * then {@link PoseBlender.layer} puts the result onto the pose of the layers below.
 * The per joint {@link AnimationPose.weights} carry the accumulated weight between the steps.
 * {@link normalizedSumBlender} is the default, {@link slerpBlender} an alternative. Implement the interface to bring
 * your own.
 */
export interface PoseBlender {
  /**
   * Starts an accumulation into `out`
   */
  begin(out: AnimationPose): void
  /**
   * Adds `src` with the weight into `out`, for the joints of the mask
   */
  add(src: AnimationPose, weight: number, out: AnimationPose, mask: JointMask): void
  /**
   * Ends the accumulation: `out` holds the blended pose, its weights the summed weight per joint (0 for joints no
   * source touched)
   */
  end(out: AnimationPose): void
  /**
   * Puts an accumulated layer onto `out`. Per joint the layer counts with `weight * src.weights[joint]`.
   *
   * @param additive - the layer holds deltas that compose onto `out` instead of replacing it
   */
  layer(src: AnimationPose, weight: number, additive: boolean, out: AnimationPose): void
}

/**
 * The blend of the game (CryAnimation pose commands): a weighted sum of the rotations, each turned to the hemisphere
 * of the sum so far, then normalized. Translations and scales are weighted averages.
 *
 * @public
 *
 * @remarks
 * - add: `SampleAddAnimFull` / `AddPoseBuffer` (`q += w * src.q * sign(dot)`)
 * - end: `NormalizeFull`
 * - layer: `PerJointBlending`: override layers nlerp to the layer, additive layers apply
 *   `nlerp(identity, layer.q, w) * pose.q` and `pose.t += w * layer.t`
 *
 * The result hardly depends on the order of the sources: with three or more, the hemisphere of a source is chosen
 * against the sum so far.
 */
export const normalizedSumBlender: PoseBlender = {
  begin: beginAccumulation,
  add(src, weight, out, mask) {
    const sq = src.rotations
    const oq = out.rotations
    for (let j = 0; j < src.count; j++) {
      if (mask && !mask[j]) {
        continue
      }
      const r = j * 4
      const dot = oq[r] * sq[r] + oq[r + 1] * sq[r + 1] + oq[r + 2] * sq[r + 2] + oq[r + 3] * sq[r + 3]
      // fsgnnz: the sign, zero counts as positive
      const w = dot < 0 ? -weight : weight
      oq[r] += w * sq[r]
      oq[r + 1] += w * sq[r + 1]
      oq[r + 2] += w * sq[r + 2]
      oq[r + 3] += w * sq[r + 3]
      addWeighted3(src, weight, out, j)
      out.weights[j] += weight
    }
  },
  end(out) {
    const q = out.rotations
    for (let j = 0; j < out.count; j++) {
      const total = out.weights[j]
      if (total <= 0) {
        continue
      }
      const r = j * 4
      normalize(q, r)
      averageTranslation(out, j, total)
    }
  },
  layer(src, weight, additive, out) {
    for (let j = 0; j < src.count; j++) {
      const amount = layerAmount(weight, src.weights[j], additive)
      if (amount <= 0) {
        continue
      }
      if (additive) {
        applyAdditive(src, amount, out, j)
      } else {
        nlerpJoint(out.rotations, src.rotations, j * 4, amount)
        lerpTranslation(src, amount, out, j)
      }
    }
  },
}

/**
 * Blends like glTF players do: each source is slerped onto the running result by its share of the weight
 *
 * @public
 *
 * @remarks
 * Order dependent for more than two sources, rotations follow the shortest arc exactly.
 */
export const slerpBlender: PoseBlender = {
  begin: beginAccumulation,
  add(src, weight, out, mask) {
    if (weight <= 0) {
      return
    }
    for (let j = 0; j < src.count; j++) {
      if (mask && !mask[j]) {
        continue
      }
      const total = out.weights[j] + weight
      const share = weight / total
      out.weights[j] = total
      slerpJoint(out.rotations, src.rotations, j * 4, share)
      if (share === 1) {
        copyTranslation(src, out, j)
      } else {
        lerpTranslation(src, share, out, j)
      }
    }
  },
  end() {
    // each add keeps the result normalized and averaged
  },
  layer(src, weight, additive, out) {
    for (let j = 0; j < src.count; j++) {
      const amount = layerAmount(weight, src.weights[j], additive)
      if (amount <= 0) {
        continue
      }
      if (additive) {
        applyAdditive(src, amount, out, j)
      } else {
        slerpJoint(out.rotations, src.rotations, j * 4, amount)
        lerpTranslation(src, amount, out, j)
      }
    }
  },
}

/**
 * How much of a layer a joint takes: override layers at most all of it, additive layers may exaggerate their deltas
 */
function layerAmount(weight: number, jointWeight: number, additive: boolean) {
  const amount = weight * jointWeight
  if (additive) {
    return amount
  }
  return Math.min(1, amount)
}

function beginAccumulation(out: AnimationPose) {
  out.translations.fill(0)
  out.rotations.fill(0)
  out.scales?.fill(0)
  out.weights.fill(0)
}

function addWeighted3(src: AnimationPose, weight: number, out: AnimationPose, j: number) {
  const t = j * 3
  out.translations[t] += weight * src.translations[t]
  out.translations[t + 1] += weight * src.translations[t + 1]
  out.translations[t + 2] += weight * src.translations[t + 2]
  if (out.scales) {
    const s = src.scales
    out.scales[t] += weight * (s ? s[t] : 1)
    out.scales[t + 1] += weight * (s ? s[t + 1] : 1)
    out.scales[t + 2] += weight * (s ? s[t + 2] : 1)
  }
}

function averageTranslation(out: AnimationPose, j: number, total: number) {
  const t = j * 3
  const inv = 1 / total
  out.translations[t] *= inv
  out.translations[t + 1] *= inv
  out.translations[t + 2] *= inv
  if (out.scales) {
    out.scales[t] *= inv
    out.scales[t + 1] *= inv
    out.scales[t + 2] *= inv
  }
}

function copyTranslation(src: AnimationPose, out: AnimationPose, j: number) {
  const t = j * 3
  out.translations[t] = src.translations[t]
  out.translations[t + 1] = src.translations[t + 1]
  out.translations[t + 2] = src.translations[t + 2]
  if (out.scales) {
    const s = src.scales
    out.scales[t] = s ? s[t] : 1
    out.scales[t + 1] = s ? s[t + 1] : 1
    out.scales[t + 2] = s ? s[t + 2] : 1
  }
}

function lerpTranslation(src: AnimationPose, amount: number, out: AnimationPose, j: number) {
  const t = j * 3
  const ot = out.translations
  const st = src.translations
  ot[t] += (st[t] - ot[t]) * amount
  ot[t + 1] += (st[t + 1] - ot[t + 1]) * amount
  ot[t + 2] += (st[t + 2] - ot[t + 2]) * amount
  if (out.scales) {
    const s = src.scales
    const os = out.scales
    os[t] += ((s ? s[t] : 1) - os[t]) * amount
    os[t + 1] += ((s ? s[t + 1] : 1) - os[t + 1]) * amount
    os[t + 2] += ((s ? s[t + 2] : 1) - os[t + 2]) * amount
  }
}

/**
 * `out.q = nlerp(identity, src.q, amount) * out.q`, `out.t += amount * src.t` (Cry PerJointBlending, additive)
 */
function applyAdditive(src: AnimationPose, amount: number, out: AnimationPose, j: number) {
  const r = j * 4
  const sq = src.rotations
  // nlerp from the identity, in the hemisphere of the delta's w
  const sign = sq[r + 3] < 0 ? -1 : 1
  let dx = sq[r] * amount * sign
  let dy = sq[r + 1] * amount * sign
  let dz = sq[r + 2] * amount * sign
  let dw = 1 - amount + sq[r + 3] * amount * sign
  const inv = 1 / Math.sqrt(dx * dx + dy * dy + dz * dz + dw * dw)
  dx *= inv
  dy *= inv
  dz *= inv
  dw *= inv
  const oq = out.rotations
  const qx = oq[r]
  const qy = oq[r + 1]
  const qz = oq[r + 2]
  const qw = oq[r + 3]
  oq[r] = dx * qw + qx * dw + dy * qz - dz * qy
  oq[r + 1] = dy * qw + qy * dw + dz * qx - dx * qz
  oq[r + 2] = dz * qw + qz * dw + dx * qy - dy * qx
  oq[r + 3] = dw * qw - dx * qx - dy * qy - dz * qz
  const t = j * 3
  out.translations[t] += amount * src.translations[t]
  out.translations[t + 1] += amount * src.translations[t + 1]
  out.translations[t + 2] += amount * src.translations[t + 2]
  if (out.scales && src.scales) {
    // scale deltas are factors: lerp from 1
    out.scales[t] *= 1 + (src.scales[t] - 1) * amount
    out.scales[t + 1] *= 1 + (src.scales[t + 1] - 1) * amount
    out.scales[t + 2] *= 1 + (src.scales[t + 2] - 1) * amount
  }
}

/**
 * Normalized lerp of quaternion `out[r..]` towards `src[r..]`, in the hemisphere of `out`
 */
function nlerpJoint(out: Float32Array, src: Float32Array, r: number, amount: number) {
  const dot = out[r] * src[r] + out[r + 1] * src[r + 1] + out[r + 2] * src[r + 2] + out[r + 3] * src[r + 3]
  const b = dot < 0 ? -amount : amount
  const a = 1 - amount
  out[r] = out[r] * a + src[r] * b
  out[r + 1] = out[r + 1] * a + src[r + 1] * b
  out[r + 2] = out[r + 2] * a + src[r + 2] * b
  out[r + 3] = out[r + 3] * a + src[r + 3] * b
  normalize(out, r)
}

/**
 * Spherical lerp of quaternion `out[r..]` towards `src[r..]` along the shortest arc
 */
function slerpJoint(out: Float32Array, src: Float32Array, r: number, amount: number) {
  let dot = out[r] * src[r] + out[r + 1] * src[r + 1] + out[r + 2] * src[r + 2] + out[r + 3] * src[r + 3]
  let sign = 1
  if (dot < 0) {
    dot = -dot
    sign = -1
  }
  let a = 1 - amount
  let b = amount
  if (dot < 0.9995) {
    const angle = Math.acos(dot)
    const sin = Math.sin(angle)
    a = Math.sin((1 - amount) * angle) / sin
    b = Math.sin(amount * angle) / sin
  }
  b *= sign
  out[r] = out[r] * a + src[r] * b
  out[r + 1] = out[r + 1] * a + src[r + 1] * b
  out[r + 2] = out[r + 2] * a + src[r + 2] * b
  out[r + 3] = out[r + 3] * a + src[r + 3] * b
  normalize(out, r)
}

function normalize(q: Float32Array, r: number) {
  const lengthSq = q[r] * q[r] + q[r + 1] * q[r + 1] + q[r + 2] * q[r + 2] + q[r + 3] * q[r + 3]
  if (lengthSq < 1e-8) {
    q[r] = 0
    q[r + 1] = 0
    q[r + 2] = 0
    q[r + 3] = 1
    return
  }
  const inv = 1 / Math.sqrt(lengthSq)
  q[r] *= inv
  q[r + 1] *= inv
  q[r + 2] *= inv
  q[r + 3] *= inv
}
