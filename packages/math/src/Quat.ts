import type { IMat, IVec3, IVec4 } from './Types'
import { vec4 } from './Vec4'

/**
 * Sets a quaternion to the identity rotation `(0, 0, 0, 1)`
 *
 * @param out The quaternion to set
 */
export function quat$initIdentity(out: IVec4): IVec4 {
  out.x = 0
  out.y = 0
  out.z = 0
  out.w = 1
  return out
}

/**
 * Creates a new identity quaternion `(0, 0, 0, 1)`
 */
export function quatCreateIdentity(): IVec4 {
  return quat$initIdentity(vec4())
}

/**
 * Sets a quaternion to a rotation around an axis
 *
 * @param out The quaternion to set
 * @param axis The normalized rotation axis
 * @param angle The rotation angle in radians
 */
export function quat$initAxisAngle(out: IVec4, axis: IVec3, angle: number): IVec4 {
  const halfAngle = angle * 0.5
  const scale = Math.sin(halfAngle)
  out.x = axis.x * scale
  out.y = axis.y * scale
  out.z = axis.z * scale
  out.w = Math.cos(halfAngle)
  return out
}

/**
 * Creates a new quaternion that rotates around an axis
 *
 * @param axis The normalized rotation axis
 * @param angle The rotation angle in radians
 */
export function quatCreateAxisAngle(axis: IVec3, angle: number): IVec4 {
  return quat$initAxisAngle(vec4(), axis, angle)
}

/**
 * Sets a quaternion to a rotation from yaw, pitch and roll angles
 *
 * @param out The quaternion to set
 * @param yaw The rotation angle in radians around the Y axis
 * @param pitch The rotation angle in radians around the X axis
 * @param roll The rotation angle in radians around the Z axis
 */
export function quat$initYawPitchRoll(out: IVec4, yaw: number, pitch: number, roll: number): IVec4 {
  const xHalf = pitch * 0.5
  const xSin = Math.sin(xHalf)
  const xCos = Math.cos(xHalf)

  const yHalf = yaw * 0.5
  const ySin = Math.sin(yHalf)
  const yCos = Math.cos(yHalf)

  const zHalf = roll * 0.5
  const zSin = Math.sin(zHalf)
  const zCos = Math.cos(zHalf)

  out.x = yCos * xSin * zCos + ySin * xCos * zSin
  out.y = ySin * xCos * zCos - yCos * xSin * zSin
  out.z = yCos * xCos * zSin - ySin * xSin * zCos
  out.w = yCos * xCos * zCos + ySin * xSin * zSin
  return out
}

/**
 * Creates a new quaternion from yaw, pitch and roll angles
 *
 * @param yaw The rotation angle in radians around the Y axis
 * @param pitch The rotation angle in radians around the X axis
 * @param roll The rotation angle in radians around the Z axis
 */
export function quatCreateYawPitchRoll(yaw: number, pitch: number, roll: number): IVec4 {
  return quat$initYawPitchRoll(vec4(), yaw, pitch, roll)
}

/**
 * Sets a quaternion from the components of a rotation matrix
 *
 * @remarks
 * See http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm
 */
function initFromRotation(
  out: IVec4,
  m00: number,
  m01: number,
  m02: number,
  m10: number,
  m11: number,
  m12: number,
  m20: number,
  m21: number,
  m22: number,
): IVec4 {
  const tr = m00 + m11 + m22
  if (tr > 0) {
    const s = Math.sqrt(tr + 1.0) * 2 // S=4*qw
    out.w = 0.25 * s
    out.x = (m12 - m21) / s
    out.y = (m20 - m02) / s
    out.z = (m01 - m10) / s
  } else if (m00 > m11 && m00 > m22) {
    const s = Math.sqrt(1.0 + m00 - m11 - m22) * 2 // S=4*qx
    out.w = (m12 - m21) / s
    out.x = 0.25 * s
    out.y = (m10 + m01) / s
    out.z = (m20 + m02) / s
  } else if (m11 > m22) {
    const s = Math.sqrt(1.0 + m11 - m00 - m22) * 2 // S=4*qy
    out.w = (m20 - m02) / s
    out.x = (m10 + m01) / s
    out.y = 0.25 * s
    out.z = (m21 + m12) / s
  } else {
    const s = Math.sqrt(1.0 + m22 - m00 - m11) * 2 // S=4*qz
    out.w = (m01 - m10) / s
    out.x = (m20 + m02) / s
    out.y = (m21 + m12) / s
    out.z = 0.25 * s
  }
  return out
}

/**
 * Sets a quaternion to the rotation of a 3x3 matrix
 *
 * @param out The quaternion to set
 * @param mat The rotation matrix in column major order
 */
export function quat$initFromMat3(out: IVec4, mat: IMat): IVec4 {
  const m = mat
  return initFromRotation(out, m[0], m[1], m[2], m[3], m[4], m[5], m[6], m[7], m[8])
}

/**
 * Creates a new quaternion from the rotation of a 3x3 matrix
 *
 * @param mat The rotation matrix in column major order
 */
export function quatCreateFromMat3(mat: IMat): IVec4 {
  return quat$initFromMat3(vec4(), mat)
}

/**
 * Sets a quaternion to the rotation of a 4x4 matrix
 *
 * @param out The quaternion to set
 * @param mat The transformation matrix in column major order
 */
export function quat$initFromMat4(out: IVec4, mat: IMat): IVec4 {
  const m = mat
  return initFromRotation(out, m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10])
}

/**
 * Creates a new quaternion from the rotation of a 4x4 matrix
 *
 * @param mat The transformation matrix in column major order
 */
export function quatCreateFromMat4(mat: IMat): IVec4 {
  return quat$initFromMat4(vec4(), mat)
}

/**
 * Conjugates a quaternion by negating the x, y and z components
 *
 * @param out The quaternion to conjugate
 */
export function quat$conjugate(out: IVec4): IVec4 {
  out.x = -out.x
  out.y = -out.y
  out.z = -out.z
  return out
}

/**
 * Conjugates a quaternion by negating the x, y and z components
 *
 * @param quat The quaternion to conjugate
 * @param out The quaternion to write to.
 */
export function quatConjugate(quat: IVec4, out?: IVec4): IVec4 {
  out ||= vec4()
  out.x = -quat.x
  out.y = -quat.y
  out.z = -quat.z
  out.w = quat.w
  return out
}

/**
 * Inverts a quaternion
 *
 * @param out The quaternion to invert
 */
export function quat$invert(out: IVec4): IVec4 {
  return quatInvert(out, out)
}

/**
 * Inverts a quaternion
 *
 * @remarks
 * The inverse is the conjugate divided by the squared length.
 * For a unit quaternion this equals the conjugate.
 *
 * @param quat The quaternion to invert
 * @param out The quaternion to write to.
 */
export function quatInvert(quat: IVec4, out?: IVec4): IVec4 {
  out ||= vec4()
  const x = quat.x
  const y = quat.y
  const z = quat.z
  const w = quat.w
  const d = 1.0 / (x * x + y * y + z * z + w * w)
  out.x = -x * d
  out.y = -y * d
  out.z = -z * d
  out.w = w * d
  return out
}

/**
 * Multiplies a quaternion with another quaternion: `out = out * other`
 *
 * @param out The left quaternion
 * @param other The right quaternion
 */
export function quat$multiply(out: IVec4, other: IVec4): IVec4 {
  return quatMultiply(out, other, out)
}

/**
 * Multiplies two quaternions: `out = a * b`
 *
 * @remarks
 * The result rotates by `b` first and then by `a`.
 *
 * @param a The left quaternion
 * @param b The right quaternion
 * @param out The quaternion to write to.
 */
export function quatMultiply(a: IVec4, b: IVec4, out?: IVec4): IVec4 {
  out ||= vec4()
  const x1 = a.x
  const y1 = a.y
  const z1 = a.z
  const w1 = a.w

  const x2 = b.x
  const y2 = b.y
  const z2 = b.z
  const w2 = b.w

  out.x = x1 * w2 + x2 * w1 + y1 * z2 - z1 * y2
  out.y = y1 * w2 + y2 * w1 + z1 * x2 - x1 * z2
  out.z = z1 * w2 + z2 * w1 + x1 * y2 - y1 * x2
  out.w = w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2
  return out
}

/**
 * Multiplies another quaternion with a quaternion: `out = other * out`
 *
 * @param out The right quaternion
 * @param other The left quaternion
 */
export function quat$premultiply(out: IVec4, other: IVec4): IVec4 {
  return quatMultiply(other, out, out)
}

/**
 * Multiplies two quaternions in reverse order: `out = b * a`
 *
 * @param a The right quaternion
 * @param b The left quaternion
 * @param out The quaternion to write to.
 */
export function quatPremultiply(a: IVec4, b: IVec4, out?: IVec4): IVec4 {
  return quatMultiply(b, a, out)
}

/**
 * Multiplies a quaternion with the inverse of another quaternion: `out = out * inv(other)`
 *
 * @param out The left quaternion
 * @param other The quaternion to invert
 */
export function quat$divide(out: IVec4, other: IVec4): IVec4 {
  return quatDivide(out, other, out)
}

/**
 * Multiplies a quaternion with the inverse of another quaternion: `out = a * inv(b)`
 *
 * @param a The left quaternion
 * @param b The quaternion to invert
 * @param out The quaternion to write to.
 */
export function quatDivide(a: IVec4, b: IVec4, out?: IVec4): IVec4 {
  out ||= vec4()
  const x1 = a.x
  const y1 = a.y
  const z1 = a.z
  const w1 = a.w

  // inverse of b
  let x2 = b.x
  let y2 = b.y
  let z2 = b.z
  let w2 = b.w
  const d = 1.0 / (x2 * x2 + y2 * y2 + z2 * z2 + w2 * w2)
  x2 = -x2 * d
  y2 = -y2 * d
  z2 = -z2 * d
  w2 = w2 * d

  out.x = x1 * w2 + x2 * w1 + y1 * z2 - z1 * y2
  out.y = y1 * w2 + y2 * w1 + z1 * x2 - x1 * z2
  out.z = z1 * w2 + z2 * w1 + x1 * y2 - y1 * x2
  out.w = w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2
  return out
}

/**
 * Spherically interpolates between two quaternions
 *
 * @remarks
 * Takes the shortest path. Falls back to a normalized linear interpolation
 * if the quaternions are very close to each other.
 *
 * @param a The start quaternion
 * @param b The end quaternion
 * @param t The interpolation value, expected in range [0, 1]
 * @param out The quaternion to write to.
 */
export function quatSlerp(a: IVec4, b: IVec4, t: number, out?: IVec4): IVec4 {
  out ||= vec4()

  let bx = b.x
  let by = b.y
  let bz = b.z
  let bw = b.w
  let dot = a.x * bx + a.y * by + a.z * bz + a.w * bw
  if (dot < 0) {
    dot = -dot
    bx = -bx
    by = -by
    bz = -bz
    bw = -bw
  }

  if (dot > 0.9995) {
    // too close for slerp, interpolate linearly and normalize
    const x = a.x + (bx - a.x) * t
    const y = a.y + (by - a.y) * t
    const z = a.z + (bz - a.z) * t
    const w = a.w + (bw - a.w) * t
    const d = 1.0 / Math.sqrt(x * x + y * y + z * z + w * w)
    out.x = x * d
    out.y = y * d
    out.z = z * d
    out.w = w * d
    return out
  }

  // dot is in range [0, 0.9995], so acos is safe
  const theta0 = Math.acos(dot) // angle between a and b
  const theta = theta0 * t // angle between a and result
  const sinTheta0 = Math.sin(theta0)
  const sinTheta = Math.sin(theta)
  const s0 = Math.cos(theta) - (dot * sinTheta) / sinTheta0 // sin(theta0 - theta) / sin(theta0)
  const s1 = sinTheta / sinTheta0

  out.x = a.x * s0 + bx * s1
  out.y = a.y * s0 + by * s1
  out.z = a.z * s0 + bz * s1
  out.w = a.w * s0 + bw * s1
  return out
}
