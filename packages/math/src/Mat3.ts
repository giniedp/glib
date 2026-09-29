import type { ArrayLike, IVec3, IVec4 } from './Types'
import { vec3 } from './Vec3'

// prettier-ignore
const
  C0R0 = 0, C1R0 = 3, C2R0 = 6,
  C0R1 = 1, C1R1 = 4, C2R1 = 7,
  C0R2 = 2, C1R2 = 5, C2R2 = 8

export type Mat3 = Float16Array | Float32Array | Float64Array | number[]

/**
 * Creates a new matrix with all components set to 0
 */
export function mat3(): Mat3 {
  return new Float32Array(9)
}

/**
 * Sets the components of a matrix. The values are read in column major order.
 *
 * @param out The matrix to set
 * @param m00 Column 0, row 0
 * @param m01 Column 0, row 1
 * @param m02 Column 0, row 2
 * @param m10 Column 1, row 0
 * @param m11 Column 1, row 1
 * @param m12 Column 1, row 2
 * @param m20 Column 2, row 0
 * @param m21 Column 2, row 1
 * @param m22 Column 2, row 2
 */
export function mat3$init(
  out: Mat3,
  m00: number,
  m01: number,
  m02: number,
  m10: number,
  m11: number,
  m12: number,
  m20: number,
  m21: number,
  m22: number,
): Mat3 {
  out[C0R0] = m00
  out[C0R1] = m01
  out[C0R2] = m02
  out[C1R0] = m10
  out[C1R1] = m11
  out[C1R2] = m12
  out[C2R0] = m20
  out[C2R1] = m21
  out[C2R2] = m22
  return out
}

/**
 * Creates a new matrix from the given components. The values are read in column major order.
 *
 * @param m00 Column 0, row 0
 * @param m01 Column 0, row 1
 * @param m02 Column 0, row 2
 * @param m10 Column 1, row 0
 * @param m11 Column 1, row 1
 * @param m12 Column 1, row 2
 * @param m20 Column 2, row 0
 * @param m21 Column 2, row 1
 * @param m22 Column 2, row 2
 */
export function mat3Create(
  m00: number,
  m01: number,
  m02: number,
  m10: number,
  m11: number,
  m12: number,
  m20: number,
  m21: number,
  m22: number,
): Mat3 {
  return mat3$init(mat3(), m00, m01, m02, m10, m11, m12, m20, m21, m22)
}

/**
 * Sets the components of a matrix. The values are read in row major order.
 *
 * @remarks
 * Only the order of the arguments is row major. The matrix is still stored in column major order.
 *
 * @param out The matrix to set
 * @param m00 Column 0, row 0
 * @param m10 Column 1, row 0
 * @param m20 Column 2, row 0
 * @param m01 Column 0, row 1
 * @param m11 Column 1, row 1
 * @param m21 Column 2, row 1
 * @param m02 Column 0, row 2
 * @param m12 Column 1, row 2
 * @param m22 Column 2, row 2
 */
export function mat3$initRowMajor(
  out: Mat3,
  m00: number,
  m10: number,
  m20: number,
  m01: number,
  m11: number,
  m21: number,
  m02: number,
  m12: number,
  m22: number,
): Mat3 {
  out[C0R0] = m00
  out[C0R1] = m01
  out[C0R2] = m02
  out[C1R0] = m10
  out[C1R1] = m11
  out[C1R2] = m12
  out[C2R0] = m20
  out[C2R1] = m21
  out[C2R2] = m22
  return out
}

/**
 * Creates a new matrix from the given components. The values are read in row major order.
 *
 * @remarks
 * Only the order of the arguments is row major. The matrix is still stored in column major order.
 *
 * @param m00 Column 0, row 0
 * @param m10 Column 1, row 0
 * @param m20 Column 2, row 0
 * @param m01 Column 0, row 1
 * @param m11 Column 1, row 1
 * @param m21 Column 2, row 1
 * @param m02 Column 0, row 2
 * @param m12 Column 1, row 2
 * @param m22 Column 2, row 2
 */
export function mat3CreateRowMajor(
  m00: number,
  m10: number,
  m20: number,
  m01: number,
  m11: number,
  m21: number,
  m02: number,
  m12: number,
  m22: number,
): Mat3 {
  return mat3$initRowMajor(mat3(), m00, m10, m20, m01, m11, m21, m02, m12, m22)
}

/**
 * Sets all components of a matrix to the same value
 *
 * @param out The matrix to set
 * @param value The value for all components
 */
export function mat3$initFill(out: Mat3, value: number): Mat3 {
  out[0] = value
  out[1] = value
  out[2] = value
  out[3] = value
  out[4] = value
  out[5] = value
  out[6] = value
  out[7] = value
  out[8] = value
  return out
}

/**
 * Creates a new matrix with all components set to the same value
 *
 * @param value The value for all components
 */
export function mat3CreateFill(value: number): Mat3 {
  return mat3$initFill(mat3(), value)
}

/**
 * Sets a matrix to the identity matrix
 *
 * @param out The matrix to set
 */
export function mat3$initIdentity(out: Mat3): Mat3 {
  out[0] = 1
  out[1] = 0
  out[2] = 0
  out[3] = 0
  out[4] = 1
  out[5] = 0
  out[6] = 0
  out[7] = 0
  out[8] = 1
  return out
}

/**
 * Creates a new identity matrix
 */
export function mat3CreateIdentity(): Mat3 {
  return mat3$initIdentity(mat3())
}

/**
 * Copies the components of another matrix into a matrix
 *
 * @param out The matrix to set
 * @param other The matrix to copy from
 */
export function mat3$initFrom(out: Mat3, other: Mat3): Mat3 {
  out[0] = other[0]
  out[1] = other[1]
  out[2] = other[2]
  out[3] = other[3]
  out[4] = other[4]
  out[5] = other[5]
  out[6] = other[6]
  out[7] = other[7]
  out[8] = other[8]
  return out
}

/**
 * Creates a new matrix as a copy of another matrix
 *
 * @param other The matrix to copy from
 */
export function mat3CreateFrom(other: Mat3): Mat3 {
  return mat3$initFrom(mat3(), other)
}

/**
 * Sets the components of a matrix from an array
 *
 * @param out The matrix to set
 * @param array The array to read from
 * @param offset The index of the first value in the array. Defaults to 0.
 */
export function mat3$initFromArray(out: Mat3, array: ArrayLike<number>, offset: number = 0): Mat3 {
  out[0] = array[offset]
  out[1] = array[offset + 1]
  out[2] = array[offset + 2]
  out[3] = array[offset + 3]
  out[4] = array[offset + 4]
  out[5] = array[offset + 5]
  out[6] = array[offset + 6]
  out[7] = array[offset + 7]
  out[8] = array[offset + 8]
  return out
}

/**
 * Creates a new matrix from the values of an array
 *
 * @param array The array to read from
 * @param offset The index of the first value in the array. Defaults to 0.
 */
export function mat3CreateFromArray(array: ArrayLike<number>, offset: number = 0): Mat3 {
  return mat3$initFromArray(mat3(), array, offset)
}

/**
 * Sets a matrix to the rotation of a quaternion
 *
 * @param out The matrix to set
 * @param quat The rotation quaternion
 */
export function mat3$initFromQuat(out: Mat3, quat: IVec4): Mat3 {
  return mat3$initFromQuatValues(out, quat.x, quat.y, quat.z, quat.w)
}

/**
 * Creates a new rotation matrix from a quaternion
 *
 * @param quat The rotation quaternion
 */
export function mat3CreateFromQuat(quat: IVec4): Mat3 {
  return mat3$initFromQuat(mat3(), quat)
}

/**
 * Sets a matrix to the rotation of a quaternion
 *
 * @param out The matrix to set
 * @param x The x component of the quaternion
 * @param y The y component of the quaternion
 * @param z The z component of the quaternion
 * @param w The w component of the quaternion
 */
export function mat3$initFromQuatValues(out: Mat3, x: number, y: number, z: number, w: number): Mat3 {
  const xx = x * x
  const xy = x * y
  const xz = x * z
  const xw = x * w
  const yy = y * y
  const yz = y * z
  const yw = y * w
  const zz = z * z
  const zw = z * w

  // rotation matrix components, rCR = column C, row R
  const r00 = 1 - 2 * (yy + zz)
  const r01 = 2 * (xy + zw)
  const r02 = 2 * (xz - yw)
  const r10 = 2 * (xy - zw)
  const r11 = 1 - 2 * (zz + xx)
  const r12 = 2 * (yz + xw)
  const r20 = 2 * (xz + yw)
  const r21 = 2 * (yz - xw)
  const r22 = 1 - 2 * (yy + xx)

  out[C0R0] = r00
  out[C0R1] = r01
  out[C0R2] = r02
  out[C1R0] = r10
  out[C1R1] = r11
  out[C1R2] = r12
  out[C2R0] = r20
  out[C2R1] = r21
  out[C2R2] = r22
  return out
}

/**
 * Creates a new rotation matrix from a quaternion
 *
 * @param x The x component of the quaternion
 * @param y The y component of the quaternion
 * @param z The z component of the quaternion
 * @param w The w component of the quaternion
 */
export function mat3CreateFromQuatValues(x: number, y: number, z: number, w: number): Mat3 {
  return mat3$initFromQuatValues(mat3(), x, y, z, w)
}

/**
 * Rotates a matrix by a quaternion
 *
 * @param out The matrix to rotate
 * @param quat The rotation quaternion
 */
export function mat3$rotateByQuat(out: Mat3, quat: IVec4): Mat3 {
  return mat3$rotateByQuatValues(out, quat.x, quat.y, quat.z, quat.w)
}

/**
 * Rotates a matrix by a quaternion
 *
 * @param out The matrix to rotate
 * @param x The x component of the quaternion
 * @param y The y component of the quaternion
 * @param z The z component of the quaternion
 * @param w The w component of the quaternion
 */
export function mat3$rotateByQuatValues(out: Mat3, x: number, y: number, z: number, w: number): Mat3 {
  const xx = x * x
  const xy = x * y
  const xz = x * z
  const xw = x * w
  const yy = y * y
  const yz = y * z
  const yw = y * w
  const zz = z * z
  const zw = z * w

  // rotation matrix components, rCR = column C, row R
  const r00 = 1 - 2 * (yy + zz)
  const r01 = 2 * (xy + zw)
  const r02 = 2 * (xz - yw)
  const r10 = 2 * (xy - zw)
  const r11 = 1 - 2 * (zz + xx)
  const r12 = 2 * (yz + xw)
  const r20 = 2 * (xz + yw)
  const r21 = 2 * (yz - xw)
  const r22 = 1 - 2 * (yy + xx)

  const m00 = out[C0R0]
  const m01 = out[C0R1]
  const m02 = out[C0R2]
  const m10 = out[C1R0]
  const m11 = out[C1R1]
  const m12 = out[C1R2]
  const m20 = out[C2R0]
  const m21 = out[C2R1]
  const m22 = out[C2R2]

  out[C0R0] = m00 * r00 + m10 * r01 + m20 * r02
  out[C0R1] = m01 * r00 + m11 * r01 + m21 * r02
  out[C0R2] = m02 * r00 + m12 * r01 + m22 * r02
  out[C1R0] = m00 * r10 + m10 * r11 + m20 * r12
  out[C1R1] = m01 * r10 + m11 * r11 + m21 * r12
  out[C1R2] = m02 * r10 + m12 * r11 + m22 * r12
  out[C2R0] = m00 * r20 + m10 * r21 + m20 * r22
  out[C2R1] = m01 * r20 + m11 * r21 + m21 * r22
  out[C2R2] = m02 * r20 + m12 * r21 + m22 * r22
  return out
}

/**
 * Rotates a matrix by a quaternion in world space
 *
 * @remarks
 * The rotation is multiplied from the left, so it is applied in world space.
 *
 * @param out The matrix to rotate
 * @param quat The rotation quaternion
 */
export function mat3$preRotateByQuat(out: Mat3, quat: IVec4): Mat3 {
  return mat3$preRotateByQuatValues(out, quat.x, quat.y, quat.z, quat.w)
}

/**
 * Rotates a matrix by a quaternion in world space
 *
 * @remarks
 * The rotation is multiplied from the left, so it is applied in world space.
 *
 * @param out The matrix to rotate
 * @param x The x component of the quaternion
 * @param y The y component of the quaternion
 * @param z The z component of the quaternion
 * @param w The w component of the quaternion
 */
export function mat3$preRotateByQuatValues(out: Mat3, x: number, y: number, z: number, w: number): Mat3 {
  const xx = x * x
  const xy = x * y
  const xz = x * z
  const xw = x * w
  const yy = y * y
  const yz = y * z
  const yw = y * w
  const zz = z * z
  const zw = z * w

  // rotation matrix components, rCR = column C, row R
  const r00 = 1 - 2 * (yy + zz)
  const r01 = 2 * (xy + zw)
  const r02 = 2 * (xz - yw)
  const r10 = 2 * (xy - zw)
  const r11 = 1 - 2 * (zz + xx)
  const r12 = 2 * (yz + xw)
  const r20 = 2 * (xz + yw)
  const r21 = 2 * (yz - xw)
  const r22 = 1 - 2 * (yy + xx)

  const m00 = out[C0R0]
  const m01 = out[C0R1]
  const m02 = out[C0R2]
  const m10 = out[C1R0]
  const m11 = out[C1R1]
  const m12 = out[C1R2]
  const m20 = out[C2R0]
  const m21 = out[C2R1]
  const m22 = out[C2R2]

  out[C0R0] = r00 * m00 + r10 * m01 + r20 * m02
  out[C0R1] = r01 * m00 + r11 * m01 + r21 * m02
  out[C0R2] = r02 * m00 + r12 * m01 + r22 * m02
  out[C1R0] = r00 * m10 + r10 * m11 + r20 * m12
  out[C1R1] = r01 * m10 + r11 * m11 + r21 * m12
  out[C1R2] = r02 * m10 + r12 * m11 + r22 * m12
  out[C2R0] = r00 * m20 + r10 * m21 + r20 * m22
  out[C2R1] = r01 * m20 + r11 * m21 + r21 * m22
  out[C2R2] = r02 * m20 + r12 * m21 + r22 * m22
  return out
}

/**
 * Sets a matrix to a rotation around an axis
 *
 * @param out The matrix to set
 * @param axis The normalized rotation axis
 * @param angle The rotation angle in radians
 */
export function mat3$initAxisAngle(out: Mat3, axis: IVec3, angle: number): Mat3 {
  return mat3$initAxisAngleValues(out, axis.x, axis.y, axis.z, angle)
}

/**
 * Creates a new rotation matrix around an axis
 *
 * @param axis The normalized rotation axis
 * @param angle The rotation angle in radians
 */
export function mat3CreateAxisAngle(axis: IVec3, angle: number): Mat3 {
  return mat3$initAxisAngle(mat3(), axis, angle)
}

/**
 * Sets a matrix to a rotation around an axis
 *
 * @param out The matrix to set
 * @param x The x component of the normalized rotation axis
 * @param y The y component of the normalized rotation axis
 * @param z The z component of the normalized rotation axis
 * @param angle The rotation angle in radians
 */
export function mat3$initAxisAngleValues(out: Mat3, x: number, y: number, z: number, angle: number): Mat3 {
  const halfAngle = angle * 0.5
  const scale = Math.sin(halfAngle)
  return mat3$initFromQuatValues(out, x * scale, y * scale, z * scale, Math.cos(halfAngle))
}

/**
 * Creates a new rotation matrix around an axis
 *
 * @param x The x component of the normalized rotation axis
 * @param y The y component of the normalized rotation axis
 * @param z The z component of the normalized rotation axis
 * @param angle The rotation angle in radians
 */
export function mat3CreateAxisAngleValues(x: number, y: number, z: number, angle: number): Mat3 {
  return mat3$initAxisAngleValues(mat3(), x, y, z, angle)
}

/**
 * Rotates a matrix around an axis
 *
 * @param out The matrix to rotate
 * @param axis The normalized rotation axis
 * @param angle The rotation angle in radians
 */
export function mat3$rotateByAxisAngle(out: Mat3, axis: IVec3, angle: number): Mat3 {
  return mat3$rotateByAxisAngleValues(out, axis.x, axis.y, axis.z, angle)
}

/**
 * Rotates a matrix around an axis
 *
 * @param out The matrix to rotate
 * @param x The x component of the normalized rotation axis
 * @param y The y component of the normalized rotation axis
 * @param z The z component of the normalized rotation axis
 * @param angle The rotation angle in radians
 */
export function mat3$rotateByAxisAngleValues(out: Mat3, x: number, y: number, z: number, angle: number): Mat3 {
  const halfAngle = angle * 0.5
  const scale = Math.sin(halfAngle)
  return mat3$rotateByQuatValues(out, x * scale, y * scale, z * scale, Math.cos(halfAngle))
}

/**
 * Rotates a matrix around an axis in world space
 *
 * @remarks
 * The rotation is multiplied from the left, so it is applied in world space.
 *
 * @param out The matrix to rotate
 * @param axis The normalized rotation axis
 * @param angle The rotation angle in radians
 */
export function mat3$preRotateByAxisAngle(out: Mat3, axis: IVec3, angle: number): Mat3 {
  return mat3$preRotateByAxisAngleValues(out, axis.x, axis.y, axis.z, angle)
}

/**
 * Rotates a matrix around an axis in world space
 *
 * @remarks
 * The rotation is multiplied from the left, so it is applied in world space.
 *
 * @param out The matrix to rotate
 * @param x The x component of the normalized rotation axis
 * @param y The y component of the normalized rotation axis
 * @param z The z component of the normalized rotation axis
 * @param angle The rotation angle in radians
 */
export function mat3$preRotateByAxisAngleValues(out: Mat3, x: number, y: number, z: number, angle: number): Mat3 {
  const halfAngle = angle * 0.5
  const scale = Math.sin(halfAngle)
  return mat3$preRotateByQuatValues(out, x * scale, y * scale, z * scale, Math.cos(halfAngle))
}

/**
 * Sets a matrix to a rotation from yaw, pitch and roll angles
 *
 * @param out The matrix to set
 * @param yaw The rotation angle in radians around the Y axis
 * @param pitch The rotation angle in radians around the X axis
 * @param roll The rotation angle in radians around the Z axis
 */
export function mat3$initYawPitchRoll(out: Mat3, yaw: number, pitch: number, roll: number): Mat3 {
  const zHalf = roll * 0.5
  const zSin = Math.sin(zHalf)
  const zCos = Math.cos(zHalf)
  const xHalf = pitch * 0.5
  const xSin = Math.sin(xHalf)
  const xCos = Math.cos(xHalf)
  const yHalf = yaw * 0.5
  const ySin = Math.sin(yHalf)
  const yCos = Math.cos(yHalf)

  const x = yCos * xSin * zCos + ySin * xCos * zSin
  const y = ySin * xCos * zCos - yCos * xSin * zSin
  const z = yCos * xCos * zSin - ySin * xSin * zCos
  const w = yCos * xCos * zCos + ySin * xSin * zSin
  return mat3$initFromQuatValues(out, x, y, z, w)
}

/**
 * Creates a new rotation matrix from yaw, pitch and roll angles
 *
 * @param yaw The rotation angle in radians around the Y axis
 * @param pitch The rotation angle in radians around the X axis
 * @param roll The rotation angle in radians around the Z axis
 */
export function mat3CreateYawPitchRoll(yaw: number, pitch: number, roll: number): Mat3 {
  return mat3$initYawPitchRoll(mat3(), yaw, pitch, roll)
}

/**
 * Rotates a matrix by yaw, pitch and roll angles
 *
 * @param out The matrix to rotate
 * @param yaw The rotation angle in radians around the Y axis
 * @param pitch The rotation angle in radians around the X axis
 * @param roll The rotation angle in radians around the Z axis
 */
export function mat3$rotateYawPitchRoll(out: Mat3, yaw: number, pitch: number, roll: number): Mat3 {
  const zHalf = roll * 0.5
  const zSin = Math.sin(zHalf)
  const zCos = Math.cos(zHalf)
  const xHalf = pitch * 0.5
  const xSin = Math.sin(xHalf)
  const xCos = Math.cos(xHalf)
  const yHalf = yaw * 0.5
  const ySin = Math.sin(yHalf)
  const yCos = Math.cos(yHalf)

  const x = yCos * xSin * zCos + ySin * xCos * zSin
  const y = ySin * xCos * zCos - yCos * xSin * zSin
  const z = yCos * xCos * zSin - ySin * xSin * zCos
  const w = yCos * xCos * zCos + ySin * xSin * zSin
  return mat3$rotateByQuatValues(out, x, y, z, w)
}

/**
 * Rotates a matrix by yaw, pitch and roll angles in world space
 *
 * @remarks
 * The rotation is multiplied from the left, so it is applied in world space.
 *
 * @param out The matrix to rotate
 * @param yaw The rotation angle in radians around the Y axis
 * @param pitch The rotation angle in radians around the X axis
 * @param roll The rotation angle in radians around the Z axis
 */
export function mat3$preRotateYawPitchRoll(out: Mat3, yaw: number, pitch: number, roll: number): Mat3 {
  const zHalf = roll * 0.5
  const zSin = Math.sin(zHalf)
  const zCos = Math.cos(zHalf)
  const xHalf = pitch * 0.5
  const xSin = Math.sin(xHalf)
  const xCos = Math.cos(xHalf)
  const yHalf = yaw * 0.5
  const ySin = Math.sin(yHalf)
  const yCos = Math.cos(yHalf)

  const x = yCos * xSin * zCos + ySin * xCos * zSin
  const y = ySin * xCos * zCos - yCos * xSin * zSin
  const z = yCos * xCos * zSin - ySin * xSin * zCos
  const w = yCos * xCos * zCos + ySin * xSin * zSin
  return mat3$preRotateByQuatValues(out, x, y, z, w)
}

/**
 * Sets a matrix to a rotation around the X axis
 *
 * @param out The matrix to set
 * @param angle The rotation angle in radians
 */
export function mat3$initRotationX(out: Mat3, angle: number): Mat3 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return mat3$initRowMajor(out, 1, 0, 0, 0, c, -s, 0, s, c)
}

/**
 * Creates a new rotation matrix around the X axis
 *
 * @param angle The rotation angle in radians
 */
export function mat3CreateRotationX(angle: number): Mat3 {
  return mat3$initRotationX(mat3(), angle)
}

/**
 * Rotates a matrix around the X axis
 *
 * @param out The matrix to rotate
 * @param angle The rotation angle in radians
 */
export function mat3$rotateX(out: Mat3, angle: number): Mat3 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const m10 = out[C1R0]
  const m11 = out[C1R1]
  const m12 = out[C1R2]
  const m20 = out[C2R0]
  const m21 = out[C2R1]
  const m22 = out[C2R2]

  out[C1R0] = c * m10 + s * m20
  out[C1R1] = c * m11 + s * m21
  out[C1R2] = c * m12 + s * m22
  out[C2R0] = c * m20 - s * m10
  out[C2R1] = c * m21 - s * m11
  out[C2R2] = c * m22 - s * m12
  return out
}

/**
 * Rotates a matrix around the X axis in world space
 *
 * @remarks
 * The rotation is multiplied from the left, so it is applied in world space.
 *
 * @param out The matrix to rotate
 * @param angle The rotation angle in radians
 */
export function mat3$preRotateX(out: Mat3, angle: number): Mat3 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const m01 = out[C0R1]
  const m11 = out[C1R1]
  const m21 = out[C2R1]
  const m02 = out[C0R2]
  const m12 = out[C1R2]
  const m22 = out[C2R2]

  out[C0R1] = c * m01 - s * m02
  out[C1R1] = c * m11 - s * m12
  out[C2R1] = c * m21 - s * m22
  out[C0R2] = c * m02 + s * m01
  out[C1R2] = c * m12 + s * m11
  out[C2R2] = c * m22 + s * m21
  return out
}

/**
 * Sets a matrix to a rotation around the Y axis
 *
 * @param out The matrix to set
 * @param angle The rotation angle in radians
 */
export function mat3$initRotationY(out: Mat3, angle: number): Mat3 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return mat3$initRowMajor(out, c, 0, s, 0, 1, 0, -s, 0, c)
}

/**
 * Creates a new rotation matrix around the Y axis
 *
 * @param angle The rotation angle in radians
 */
export function mat3CreateRotationY(angle: number): Mat3 {
  return mat3$initRotationY(mat3(), angle)
}

/**
 * Rotates a matrix around the Y axis
 *
 * @param out The matrix to rotate
 * @param angle The rotation angle in radians
 */
export function mat3$rotateY(out: Mat3, angle: number): Mat3 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const m00 = out[C0R0]
  const m01 = out[C0R1]
  const m02 = out[C0R2]
  const m20 = out[C2R0]
  const m21 = out[C2R1]
  const m22 = out[C2R2]

  out[C0R0] = c * m00 - s * m20
  out[C0R1] = c * m01 - s * m21
  out[C0R2] = c * m02 - s * m22
  out[C2R0] = c * m20 + s * m00
  out[C2R1] = c * m21 + s * m01
  out[C2R2] = c * m22 + s * m02
  return out
}

/**
 * Rotates a matrix around the Y axis in world space
 *
 * @remarks
 * The rotation is multiplied from the left, so it is applied in world space.
 *
 * @param out The matrix to rotate
 * @param angle The rotation angle in radians
 */
export function mat3$preRotateY(out: Mat3, angle: number): Mat3 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const m00 = out[C0R0]
  const m10 = out[C1R0]
  const m20 = out[C2R0]
  const m02 = out[C0R2]
  const m12 = out[C1R2]
  const m22 = out[C2R2]

  out[C0R0] = c * m00 + s * m02
  out[C1R0] = c * m10 + s * m12
  out[C2R0] = c * m20 + s * m22
  out[C0R2] = c * m02 - s * m00
  out[C1R2] = c * m12 - s * m10
  out[C2R2] = c * m22 - s * m20
  return out
}

/**
 * Sets a matrix to a rotation around the Z axis
 *
 * @param out The matrix to set
 * @param angle The rotation angle in radians
 */
export function mat3$initRotationZ(out: Mat3, angle: number): Mat3 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return mat3$initRowMajor(out, c, -s, 0, s, c, 0, 0, 0, 1)
}

/**
 * Creates a new rotation matrix around the Z axis
 *
 * @param angle The rotation angle in radians
 */
export function mat3CreateRotationZ(angle: number): Mat3 {
  return mat3$initRotationZ(mat3(), angle)
}

/**
 * Rotates a matrix around the Z axis
 *
 * @param out The matrix to rotate
 * @param angle The rotation angle in radians
 */
export function mat3$rotateZ(out: Mat3, angle: number): Mat3 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const m00 = out[C0R0]
  const m01 = out[C0R1]
  const m02 = out[C0R2]
  const m10 = out[C1R0]
  const m11 = out[C1R1]
  const m12 = out[C1R2]

  out[C0R0] = c * m00 + s * m10
  out[C0R1] = c * m01 + s * m11
  out[C0R2] = c * m02 + s * m12
  out[C1R0] = c * m10 - s * m00
  out[C1R1] = c * m11 - s * m01
  out[C1R2] = c * m12 - s * m02
  return out
}

/**
 * Rotates a matrix around the Z axis in world space
 *
 * @remarks
 * The rotation is multiplied from the left, so it is applied in world space.
 *
 * @param out The matrix to rotate
 * @param angle The rotation angle in radians
 */
export function mat3$preRotateZ(out: Mat3, angle: number): Mat3 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const m00 = out[C0R0]
  const m10 = out[C1R0]
  const m20 = out[C2R0]
  const m01 = out[C0R1]
  const m11 = out[C1R1]
  const m21 = out[C2R1]

  out[C0R0] = c * m00 - s * m01
  out[C1R0] = c * m10 - s * m11
  out[C2R0] = c * m20 - s * m21
  out[C0R1] = c * m01 + s * m00
  out[C1R1] = c * m11 + s * m10
  out[C2R1] = c * m21 + s * m20
  return out
}

/**
 * Sets a matrix to a rotation that looks in the given direction
 *
 * @param out The matrix to set
 * @param forward The forward direction
 * @param up The up direction of the viewer
 */
export function mat3$initOrientation(out: Mat3, forward: IVec3, up: IVec3): Mat3 {
  // backward = negate(normalize(forward))
  let x = forward.x
  let y = forward.y
  let z = forward.z
  let d = 1.0 / Math.sqrt(x * x + y * y + z * z)
  const backX = -x * d
  const backY = -y * d
  const backZ = -z * d

  // right = normalize(cross(up, back))
  x = up.y * backZ - up.z * backY
  y = up.z * backX - up.x * backZ
  z = up.x * backY - up.y * backX
  d = 1.0 / Math.sqrt(x * x + y * y + z * z)
  const rightX = x * d
  const rightY = y * d
  const rightZ = z * d

  // up = cross(back, right)
  x = backY * rightZ - backZ * rightY
  y = backZ * rightX - backX * rightZ
  z = backX * rightY - backY * rightX

  return mat3$initRowMajor(out, rightX, x, backX, rightY, y, backY, rightZ, z, backZ)
}

/**
 * Creates a new rotation matrix that looks in the given direction
 *
 * @param forward The forward direction
 * @param up The up direction of the viewer
 */
export function mat3CreateOrientation(forward: IVec3, up: IVec3): Mat3 {
  return mat3$initOrientation(mat3(), forward, up)
}

/**
 * Gets the forward direction of a matrix
 *
 * @param mat The matrix to read from
 * @param out The vector to write to.
 */
export function mat3GetForward(mat: Mat3, out?: IVec3): IVec3 {
  out ||= vec3()
  out.x = -mat[C2R0]
  out.y = -mat[C2R1]
  out.z = -mat[C2R2]
  return out
}

/**
 * Sets the forward direction of a matrix
 *
 * @param out The matrix to change
 * @param vec The forward direction
 */
export function mat3$setForward(out: Mat3, vec: IVec3): Mat3 {
  out[C2R0] = -vec.x
  out[C2R1] = -vec.y
  out[C2R2] = -vec.z
  return out
}

/**
 * Gets the backward direction of a matrix
 *
 * @param mat The matrix to read from
 * @param out The vector to write to.
 */
export function mat3GetBackward(mat: Mat3, out?: IVec3): IVec3 {
  out ||= vec3()
  out.x = mat[C2R0]
  out.y = mat[C2R1]
  out.z = mat[C2R2]
  return out
}

/**
 * Sets the backward direction of a matrix
 *
 * @param out The matrix to change
 * @param vec The backward direction
 */
export function mat3$setBackward(out: Mat3, vec: IVec3): Mat3 {
  out[C2R0] = vec.x
  out[C2R1] = vec.y
  out[C2R2] = vec.z
  return out
}

/**
 * Gets the right direction of a matrix
 *
 * @param mat The matrix to read from
 * @param out The vector to write to.
 */
export function mat3GetRight(mat: Mat3, out?: IVec3): IVec3 {
  out ||= vec3()
  out.x = mat[C0R0]
  out.y = mat[C0R1]
  out.z = mat[C0R2]
  return out
}

/**
 * Sets the right direction of a matrix
 *
 * @param out The matrix to change
 * @param vec The right direction
 */
export function mat3$setRight(out: Mat3, vec: IVec3): Mat3 {
  out[C0R0] = vec.x
  out[C0R1] = vec.y
  out[C0R2] = vec.z
  return out
}

/**
 * Gets the left direction of a matrix
 *
 * @param mat The matrix to read from
 * @param out The vector to write to.
 */
export function mat3GetLeft(mat: Mat3, out?: IVec3): IVec3 {
  out ||= vec3()
  out.x = -mat[C0R0]
  out.y = -mat[C0R1]
  out.z = -mat[C0R2]
  return out
}

/**
 * Sets the left direction of a matrix
 *
 * @param out The matrix to change
 * @param vec The left direction
 */
export function mat3$setLeft(out: Mat3, vec: IVec3): Mat3 {
  out[C0R0] = -vec.x
  out[C0R1] = -vec.y
  out[C0R2] = -vec.z
  return out
}

/**
 * Gets the up direction of a matrix
 *
 * @param mat The matrix to read from
 * @param out The vector to write to.
 */
export function mat3GetUp(mat: Mat3, out?: IVec3): IVec3 {
  out ||= vec3()
  out.x = mat[C1R0]
  out.y = mat[C1R1]
  out.z = mat[C1R2]
  return out
}

/**
 * Sets the up direction of a matrix
 *
 * @param out The matrix to change
 * @param vec The up direction
 */
export function mat3$setUp(out: Mat3, vec: IVec3): Mat3 {
  out[C1R0] = vec.x
  out[C1R1] = vec.y
  out[C1R2] = vec.z
  return out
}

/**
 * Gets the down direction of a matrix
 *
 * @param mat The matrix to read from
 * @param out The vector to write to.
 */
export function mat3GetDown(mat: Mat3, out?: IVec3): IVec3 {
  out ||= vec3()
  out.x = -mat[C1R0]
  out.y = -mat[C1R1]
  out.z = -mat[C1R2]
  return out
}

/**
 * Sets the down direction of a matrix
 *
 * @param out The matrix to change
 * @param vec The down direction
 */
export function mat3$setDown(out: Mat3, vec: IVec3): Mat3 {
  out[C1R0] = -vec.x
  out[C1R1] = -vec.y
  out[C1R2] = -vec.z
  return out
}

/**
 * Gets the scale part of a matrix
 *
 * @param mat The matrix to read from
 * @param out The vector to write to.
 */
export function mat3GetScale(mat: Mat3, out?: IVec3): IVec3 {
  out ||= vec3()
  out.x = mat[C0R0]
  out.y = mat[C1R1]
  out.z = mat[C2R2]
  return out
}

/**
 * Sets the scale part of a matrix
 *
 * @param out The matrix to change
 * @param vec The scale vector
 */
export function mat3$setScale(out: Mat3, vec: IVec3): Mat3 {
  return mat3$setScaleXYZ(out, vec.x, vec.y, vec.z)
}

/**
 * Sets the scale part of a matrix
 *
 * @param out The matrix to change
 * @param x The scale on the x axis
 * @param y The scale on the y axis
 * @param z The scale on the z axis
 */
export function mat3$setScaleXYZ(out: Mat3, x: number, y: number, z: number): Mat3 {
  out[C0R0] = x
  out[C1R1] = y
  out[C2R2] = z
  return out
}

/**
 * Sets the x component of the scale part of a matrix
 *
 * @param out The matrix to change
 * @param value The scale on the x axis
 */
export function mat3$setScaleX(out: Mat3, value: number): Mat3 {
  out[C0R0] = value
  return out
}

/**
 * Sets the y component of the scale part of a matrix
 *
 * @param out The matrix to change
 * @param value The scale on the y axis
 */
export function mat3$setScaleY(out: Mat3, value: number): Mat3 {
  out[C1R1] = value
  return out
}

/**
 * Sets the z component of the scale part of a matrix
 *
 * @param out The matrix to change
 * @param value The scale on the z axis
 */
export function mat3$setScaleZ(out: Mat3, value: number): Mat3 {
  out[C2R2] = value
  return out
}

/**
 * Sets a matrix to a scale matrix
 *
 * @param out The matrix to set
 * @param vec The scale vector
 */
export function mat3$initScale(out: Mat3, vec: IVec3): Mat3 {
  return mat3$initScaleXYZ(out, vec.x, vec.y, vec.z)
}

/**
 * Creates a new scale matrix
 *
 * @param vec The scale vector
 */
export function mat3CreateScale(vec: IVec3): Mat3 {
  return mat3$initScale(mat3(), vec)
}

/**
 * Sets a matrix to a scale matrix
 *
 * @param out The matrix to set
 * @param x The scale on the x axis
 * @param y The scale on the y axis
 * @param z The scale on the z axis
 */
export function mat3$initScaleXYZ(out: Mat3, x: number, y: number, z: number): Mat3 {
  return mat3$initRowMajor(out, x, 0, 0, 0, y, 0, 0, 0, z)
}

/**
 * Creates a new scale matrix
 *
 * @param x The scale on the x axis
 * @param y The scale on the y axis
 * @param z The scale on the z axis
 */
export function mat3CreateScaleXYZ(x: number, y: number, z: number): Mat3 {
  return mat3$initScaleXYZ(mat3(), x, y, z)
}

/**
 * Sets a matrix to a uniform scale matrix
 *
 * @param out The matrix to set
 * @param scale The scale on all axes
 */
export function mat3$initScaleUniform(out: Mat3, scale: number): Mat3 {
  return mat3$initScaleXYZ(out, scale, scale, scale)
}

/**
 * Creates a new uniform scale matrix
 *
 * @param scale The scale on all axes
 */
export function mat3CreateScaleUniform(scale: number): Mat3 {
  return mat3$initScaleUniform(mat3(), scale)
}

/**
 * Scales a matrix
 *
 * @param out The matrix to scale
 * @param scale The scale vector
 */
export function mat3$scale(out: Mat3, scale: IVec3): Mat3 {
  return mat3$scaleXYZ(out, scale.x, scale.y, scale.z)
}

/**
 * Scales a matrix
 *
 * @param out The matrix to scale
 * @param x The scale on the x axis
 * @param y The scale on the y axis
 * @param z The scale on the z axis
 */
export function mat3$scaleXYZ(out: Mat3, x: number, y: number, z: number): Mat3 {
  out[C0R0] *= x
  out[C0R1] *= x
  out[C0R2] *= x
  out[C1R0] *= y
  out[C1R1] *= y
  out[C1R2] *= y
  out[C2R0] *= z
  out[C2R1] *= z
  out[C2R2] *= z
  return out
}

/**
 * Scales a matrix on the x axis
 *
 * @param out The matrix to scale
 * @param x The scale on the x axis
 */
export function mat3$scaleX(out: Mat3, x: number): Mat3 {
  out[C0R0] *= x
  out[C0R1] *= x
  out[C0R2] *= x
  return out
}

/**
 * Scales a matrix on the y axis
 *
 * @param out The matrix to scale
 * @param y The scale on the y axis
 */
export function mat3$scaleY(out: Mat3, y: number): Mat3 {
  out[C1R0] *= y
  out[C1R1] *= y
  out[C1R2] *= y
  return out
}

/**
 * Scales a matrix on the z axis
 *
 * @param out The matrix to scale
 * @param z The scale on the z axis
 */
export function mat3$scaleZ(out: Mat3, z: number): Mat3 {
  out[C2R0] *= z
  out[C2R1] *= z
  out[C2R2] *= z
  return out
}

/**
 * Scales a matrix by the same value on all axes
 *
 * @param out The matrix to scale
 * @param scale The scale on all axes
 */
export function mat3$scaleUniform(out: Mat3, scale: number): Mat3 {
  out[0] *= scale
  out[1] *= scale
  out[2] *= scale
  out[3] *= scale
  out[4] *= scale
  out[5] *= scale
  out[6] *= scale
  out[7] *= scale
  out[8] *= scale
  return out
}

/**
 * Scales a matrix in world space
 *
 * @remarks
 * The scale is multiplied from the left, so it is applied in world space.
 *
 * @param out The matrix to scale
 * @param scale The scale vector
 */
export function mat3$preScale(out: Mat3, scale: IVec3): Mat3 {
  return mat3$preScaleXYZ(out, scale.x, scale.y, scale.z)
}

/**
 * Scales a matrix in world space
 *
 * @remarks
 * The scale is multiplied from the left, so it is applied in world space.
 *
 * @param out The matrix to scale
 * @param x The scale on the x axis
 * @param y The scale on the y axis
 * @param z The scale on the z axis
 */
export function mat3$preScaleXYZ(out: Mat3, x: number, y: number, z: number): Mat3 {
  out[C0R0] *= x
  out[C1R0] *= x
  out[C2R0] *= x
  out[C0R1] *= y
  out[C1R1] *= y
  out[C2R1] *= y
  out[C0R2] *= z
  out[C1R2] *= z
  out[C2R2] *= z
  return out
}

/**
 * Scales a matrix on the x axis in world space
 *
 * @remarks
 * The scale is multiplied from the left, so it is applied in world space.
 *
 * @param out The matrix to scale
 * @param x The scale on the x axis
 */
export function mat3$preScaleX(out: Mat3, x: number): Mat3 {
  out[C0R0] *= x
  out[C1R0] *= x
  out[C2R0] *= x
  return out
}

/**
 * Scales a matrix on the y axis in world space
 *
 * @remarks
 * The scale is multiplied from the left, so it is applied in world space.
 *
 * @param out The matrix to scale
 * @param y The scale on the y axis
 */
export function mat3$preScaleY(out: Mat3, y: number): Mat3 {
  out[C0R1] *= y
  out[C1R1] *= y
  out[C2R1] *= y
  return out
}

/**
 * Scales a matrix on the z axis in world space
 *
 * @remarks
 * The scale is multiplied from the left, so it is applied in world space.
 *
 * @param out The matrix to scale
 * @param z The scale on the z axis
 */
export function mat3$preScaleZ(out: Mat3, z: number): Mat3 {
  out[C0R2] *= z
  out[C1R2] *= z
  out[C2R2] *= z
  return out
}

/**
 * Copies a matrix
 *
 * @param mat The matrix to copy
 * @param out The matrix to write to.
 */
export function mat3Copy(mat: Mat3, out?: Mat3): Mat3 {
  out ||= mat3()
  out[0] = mat[0]
  out[1] = mat[1]
  out[2] = mat[2]
  out[3] = mat[3]
  out[4] = mat[4]
  out[5] = mat[5]
  out[6] = mat[6]
  out[7] = mat[7]
  out[8] = mat[8]
  return out
}

/**
 * Calculates the determinant of a matrix
 *
 * @param mat The matrix
 */
export function mat3Determinant(mat: Mat3): number {
  const a11 = mat[0]
  const a12 = mat[3]
  const a13 = mat[6]
  const a21 = mat[1]
  const a22 = mat[4]
  const a23 = mat[7]
  const a31 = mat[2]
  const a32 = mat[5]
  const a33 = mat[8]

  const d1 = a22 * a33 - a32 * a23
  const d2 = a21 * a33 - a31 * a23
  const d3 = a21 * a32 - a31 * a22

  return a11 * d1 - a12 * d2 + a13 * d3
}

/**
 * Transposes a matrix
 *
 * @param out The matrix to transpose
 */
export function mat3$transpose(out: Mat3): Mat3 {
  let t = out[C0R1]
  out[C0R1] = out[C1R0]
  out[C1R0] = t

  t = out[C0R2]
  out[C0R2] = out[C2R0]
  out[C2R0] = t

  t = out[C1R2]
  out[C1R2] = out[C2R1]
  out[C2R1] = t
  return out
}

/**
 * Transposes a matrix
 *
 * @param mat The matrix to transpose
 * @param out The matrix to write to.
 */
export function mat3Transpose(mat: Mat3, out?: Mat3): Mat3 {
  const m = mat
  return mat3$init(out || mat3(), m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8])
}

/**
 * Inverts a matrix
 *
 * @param out The matrix to invert
 */
export function mat3$invert(out: Mat3): Mat3 {
  return mat3Invert(out, out)
}

/**
 * Inverts a matrix
 *
 * @param mat The matrix to invert
 * @param out The matrix to write to.
 */
export function mat3Invert(mat: Mat3, out?: Mat3): Mat3 {
  out ||= mat3()

  const a11 = mat[0]
  const a12 = mat[3]
  const a13 = mat[6]
  const a21 = mat[1]
  const a22 = mat[4]
  const a23 = mat[7]
  const a31 = mat[2]
  const a32 = mat[5]
  const a33 = mat[8]

  const d1 = a22 * a33 - a32 * a23
  const d2 = a21 * a33 - a31 * a23
  const d3 = a21 * a32 - a31 * a22

  const detInv = 1 / (a11 * d1 - a12 * d2 + a13 * d3)

  out[0] = detInv * d1
  out[1] = -detInv * d2
  out[2] = detInv * d3
  out[3] = detInv * (a13 * a32 - a12 * a33)
  out[4] = detInv * (a11 * a33 - a13 * a31)
  out[5] = detInv * (a12 * a31 - a11 * a32)
  out[6] = detInv * (a12 * a23 - a13 * a22)
  out[7] = detInv * (a13 * a21 - a11 * a23)
  out[8] = detInv * (a11 * a22 - a12 * a21)

  return out
}

/**
 * Negates all components of a matrix
 *
 * @param out The matrix to negate
 */
export function mat3$negate(out: Mat3): Mat3 {
  out[0] = -out[0]
  out[1] = -out[1]
  out[2] = -out[2]
  out[3] = -out[3]
  out[4] = -out[4]
  out[5] = -out[5]
  out[6] = -out[6]
  out[7] = -out[7]
  out[8] = -out[8]
  return out
}

/**
 * Negates all components of a matrix
 *
 * @param mat The matrix to negate
 * @param out The matrix to write to.
 */
export function mat3Negate(mat: Mat3, out?: Mat3): Mat3 {
  out ||= mat3()
  out[0] = -mat[0]
  out[1] = -mat[1]
  out[2] = -mat[2]
  out[3] = -mat[3]
  out[4] = -mat[4]
  out[5] = -mat[5]
  out[6] = -mat[6]
  out[7] = -mat[7]
  out[8] = -mat[8]
  return out
}

/**
 * Adds a matrix to another matrix
 *
 * @param out The matrix to add to
 * @param other The matrix to add
 */
export function mat3$add(out: Mat3, other: Mat3): Mat3 {
  out[0] += other[0]
  out[1] += other[1]
  out[2] += other[2]
  out[3] += other[3]
  out[4] += other[4]
  out[5] += other[5]
  out[6] += other[6]
  out[7] += other[7]
  out[8] += other[8]
  return out
}

/**
 * Adds two matrices
 *
 * @param a The first matrix
 * @param b The second matrix
 * @param out The matrix to write to.
 */
export function mat3Add(a: Mat3, b: Mat3, out?: Mat3): Mat3 {
  out ||= mat3()
  out[0] = a[0] + b[0]
  out[1] = a[1] + b[1]
  out[2] = a[2] + b[2]
  out[3] = a[3] + b[3]
  out[4] = a[4] + b[4]
  out[5] = a[5] + b[5]
  out[6] = a[6] + b[6]
  out[7] = a[7] + b[7]
  out[8] = a[8] + b[8]
  return out
}

/**
 * Subtracts a matrix from another matrix
 *
 * @param out The matrix to subtract from
 * @param other The matrix to subtract
 */
export function mat3$subtract(out: Mat3, other: Mat3): Mat3 {
  out[0] -= other[0]
  out[1] -= other[1]
  out[2] -= other[2]
  out[3] -= other[3]
  out[4] -= other[4]
  out[5] -= other[5]
  out[6] -= other[6]
  out[7] -= other[7]
  out[8] -= other[8]
  return out
}

/**
 * Subtracts the second matrix from the first matrix
 *
 * @param a The first matrix
 * @param b The second matrix
 * @param out The matrix to write to.
 */
export function mat3Subtract(a: Mat3, b: Mat3, out?: Mat3): Mat3 {
  out ||= mat3()
  out[0] = a[0] - b[0]
  out[1] = a[1] - b[1]
  out[2] = a[2] - b[2]
  out[3] = a[3] - b[3]
  out[4] = a[4] - b[4]
  out[5] = a[5] - b[5]
  out[6] = a[6] - b[6]
  out[7] = a[7] - b[7]
  out[8] = a[8] - b[8]
  return out
}

/**
 * Divides each component of a matrix by the matching component of another matrix
 *
 * @param out The matrix to divide
 * @param other The matrix to divide by
 */
export function mat3$divide(out: Mat3, other: Mat3): Mat3 {
  out[0] /= other[0]
  out[1] /= other[1]
  out[2] /= other[2]
  out[3] /= other[3]
  out[4] /= other[4]
  out[5] /= other[5]
  out[6] /= other[6]
  out[7] /= other[7]
  out[8] /= other[8]
  return out
}

/**
 * Divides each component of the first matrix by the matching component of the second matrix
 *
 * @param a The first matrix
 * @param b The second matrix
 * @param out The matrix to write to.
 */
export function mat3Divide(a: Mat3, b: Mat3, out?: Mat3): Mat3 {
  out ||= mat3()
  out[0] = a[0] / b[0]
  out[1] = a[1] / b[1]
  out[2] = a[2] / b[2]
  out[3] = a[3] / b[3]
  out[4] = a[4] / b[4]
  out[5] = a[5] / b[5]
  out[6] = a[6] / b[6]
  out[7] = a[7] / b[7]
  out[8] = a[8] / b[8]
  return out
}

/**
 * Adds a number to each component of a matrix
 *
 * @param out The matrix to add to
 * @param scalar The number to add
 */
export function mat3$addScalar(out: Mat3, scalar: number): Mat3 {
  out[0] += scalar
  out[1] += scalar
  out[2] += scalar
  out[3] += scalar
  out[4] += scalar
  out[5] += scalar
  out[6] += scalar
  out[7] += scalar
  out[8] += scalar
  return out
}

/**
 * Adds a number to each component of a matrix
 *
 * @param mat The matrix
 * @param scalar The number to add
 * @param out The matrix to write to.
 */
export function mat3AddScalar(mat: Mat3, scalar: number, out?: Mat3): Mat3 {
  out ||= mat3()
  out[0] = mat[0] + scalar
  out[1] = mat[1] + scalar
  out[2] = mat[2] + scalar
  out[3] = mat[3] + scalar
  out[4] = mat[4] + scalar
  out[5] = mat[5] + scalar
  out[6] = mat[6] + scalar
  out[7] = mat[7] + scalar
  out[8] = mat[8] + scalar
  return out
}

/**
 * Subtracts a number from each component of a matrix
 *
 * @param out The matrix to subtract from
 * @param scalar The number to subtract
 */
export function mat3$subtractScalar(out: Mat3, scalar: number): Mat3 {
  out[0] -= scalar
  out[1] -= scalar
  out[2] -= scalar
  out[3] -= scalar
  out[4] -= scalar
  out[5] -= scalar
  out[6] -= scalar
  out[7] -= scalar
  out[8] -= scalar
  return out
}

/**
 * Subtracts a number from each component of a matrix
 *
 * @param mat The matrix
 * @param scalar The number to subtract
 * @param out The matrix to write to.
 */
export function mat3SubtractScalar(mat: Mat3, scalar: number, out?: Mat3): Mat3 {
  out ||= mat3()
  out[0] = mat[0] - scalar
  out[1] = mat[1] - scalar
  out[2] = mat[2] - scalar
  out[3] = mat[3] - scalar
  out[4] = mat[4] - scalar
  out[5] = mat[5] - scalar
  out[6] = mat[6] - scalar
  out[7] = mat[7] - scalar
  out[8] = mat[8] - scalar
  return out
}

/**
 * Multiplies each component of a matrix by a number
 *
 * @param out The matrix to multiply
 * @param scalar The number to multiply by
 */
export function mat3$multiplyScalar(out: Mat3, scalar: number): Mat3 {
  out[0] *= scalar
  out[1] *= scalar
  out[2] *= scalar
  out[3] *= scalar
  out[4] *= scalar
  out[5] *= scalar
  out[6] *= scalar
  out[7] *= scalar
  out[8] *= scalar
  return out
}

/**
 * Multiplies each component of a matrix by a number
 *
 * @param mat The matrix
 * @param scalar The number to multiply by
 * @param out The matrix to write to.
 */
export function mat3MultiplyScalar(mat: Mat3, scalar: number, out?: Mat3): Mat3 {
  out ||= mat3()
  out[0] = mat[0] * scalar
  out[1] = mat[1] * scalar
  out[2] = mat[2] * scalar
  out[3] = mat[3] * scalar
  out[4] = mat[4] * scalar
  out[5] = mat[5] * scalar
  out[6] = mat[6] * scalar
  out[7] = mat[7] * scalar
  out[8] = mat[8] * scalar
  return out
}

/**
 * Divides each component of a matrix by a number
 *
 * @param out The matrix to divide
 * @param scalar The number to divide by
 */
export function mat3$divideScalar(out: Mat3, scalar: number): Mat3 {
  return mat3$multiplyScalar(out, 1 / scalar)
}

/**
 * Divides each component of a matrix by a number
 *
 * @param mat The matrix
 * @param scalar The number to divide by
 * @param out The matrix to write to.
 */
export function mat3DivideScalar(mat: Mat3, scalar: number, out?: Mat3): Mat3 {
  return mat3MultiplyScalar(mat, 1 / scalar, out)
}

/**
 * Multiplies a matrix with another matrix: `out = out * other`
 *
 * @param out The left matrix
 * @param other The right matrix
 */
export function mat3$multiply(out: Mat3, other: Mat3): Mat3 {
  return mat3Multiply(out, other, out)
}

/**
 * Multiplies two matrices: `out = a * b`
 *
 * @param a The left matrix
 * @param b The right matrix
 * @param out The matrix to write to.
 */
export function mat3Multiply(a: Mat3, b: Mat3, out?: Mat3): Mat3 {
  out ||= mat3()
  // prettier-ignore
  const
    a0 = a[0], a1 = a[1], a2 = a[2],
    a3 = a[3], a4 = a[4], a5 = a[5],
    a6 = a[6], a7 = a[7], a8 = a[8],
    b0 = b[0], b1 = b[1], b2 = b[2],
    b3 = b[3], b4 = b[4], b5 = b[5],
    b6 = b[6], b7 = b[7], b8 = b[8]
  out[0] = b0 * a0 + b1 * a3 + b2 * a6
  out[1] = b0 * a1 + b1 * a4 + b2 * a7
  out[2] = b0 * a2 + b1 * a5 + b2 * a8
  out[3] = b3 * a0 + b4 * a3 + b5 * a6
  out[4] = b3 * a1 + b4 * a4 + b5 * a7
  out[5] = b3 * a2 + b4 * a5 + b5 * a8
  out[6] = b6 * a0 + b7 * a3 + b8 * a6
  out[7] = b6 * a1 + b7 * a4 + b8 * a7
  out[8] = b6 * a2 + b7 * a5 + b8 * a8
  return out
}

/**
 * Multiplies another matrix with a matrix: `out = other * out`
 *
 * @param out The right matrix
 * @param other The left matrix
 */
export function mat3$premultiply(out: Mat3, other: Mat3): Mat3 {
  return mat3Multiply(other, out, out)
}

/**
 * Multiplies two matrices in reverse order: `out = b * a`
 *
 * @param a The right matrix
 * @param b The left matrix
 * @param out The matrix to write to.
 */
export function mat3Premultiply(a: Mat3, b: Mat3, out?: Mat3): Mat3 {
  return mat3Multiply(b, a, out)
}

/**
 * Transforms 2D points stored in an array with a matrix. The array is changed in place.
 *
 * @remarks
 * The vectors are treated as points with z = 1, so the third column is applied as translation.
 *
 * @param mat The transformation matrix
 * @param array The array with the vector components
 * @param offset The index of the first vector in the array. Defaults to 0.
 * @param stride The number of array elements between two vectors. Defaults to 2.
 * @param count The number of vectors to transform. Defaults to all vectors in the array.
 */
export function mat3TransformVec2Array<T extends ArrayLike<number>>(
  mat: Mat3,
  array: T,
  offset: number = 0,
  stride: number = 2,
  count: number = array.length / stride,
): T {
  const d = mat
  while (count > 0) {
    count--
    const x = array[offset]
    const y = array[offset + 1]
    array[offset] = x * d[0] + y * d[3] + d[6]
    array[offset + 1] = x * d[1] + y * d[4] + d[7]
    offset += stride
  }
  return array
}

/**
 * Transforms 3D vectors stored in an array with a matrix. The array is changed in place.
 *
 * @param mat The transformation matrix
 * @param array The array with the vector components
 * @param offset The index of the first vector in the array. Defaults to 0.
 * @param stride The number of array elements between two vectors. Defaults to 3.
 * @param count The number of vectors to transform. Defaults to all vectors in the array.
 */
export function mat3TransformVec3Array<T extends ArrayLike<number>>(
  mat: Mat3,
  array: T,
  offset: number = 0,
  stride: number = 3,
  count: number = array.length / stride,
): T {
  const d = mat
  while (count > 0) {
    count--
    const x = array[offset]
    const y = array[offset + 1]
    const z = array[offset + 2]
    array[offset] = x * d[0] + y * d[3] + z * d[6]
    array[offset + 1] = x * d[1] + y * d[4] + z * d[7]
    array[offset + 2] = x * d[2] + y * d[5] + z * d[8]
    offset += stride
  }
  return array
}

/**
 * Linearly interpolates between two matrices, component by component
 *
 * @param a The start matrix
 * @param b The end matrix
 * @param t The interpolation value, expected in range [0, 1]
 * @param out The matrix to write to.
 */
export function mat3Lerp(a: Mat3, b: Mat3, t: number, out?: Mat3): Mat3 {
  out ||= mat3()
  out[0] = a[0] + (b[0] - a[0]) * t
  out[1] = a[1] + (b[1] - a[1]) * t
  out[2] = a[2] + (b[2] - a[2]) * t
  out[3] = a[3] + (b[3] - a[3]) * t
  out[4] = a[4] + (b[4] - a[4]) * t
  out[5] = a[5] + (b[5] - a[5]) * t
  out[6] = a[6] + (b[6] - a[6]) * t
  out[7] = a[7] + (b[7] - a[7]) * t
  out[8] = a[8] + (b[8] - a[8]) * t
  return out
}

/**
 * Smoothly interpolates between two matrices, component by component
 *
 * @param a The start matrix
 * @param b The end matrix
 * @param t The interpolation value. It is clamped to range [0, 1].
 * @param out The matrix to write to.
 */
export function mat3Smooth(a: Mat3, b: Mat3, t: number, out?: Mat3): Mat3 {
  t = t > 1 ? 1 : t < 0 ? 0 : t
  t = t * t * (3 - 2 * t)
  return mat3Lerp(a, b, t, out)
}

/**
 * Checks if two matrices have equal components
 *
 * @param a The first matrix
 * @param b The second matrix
 */
export function mat3Equals(a: Mat3, b: Mat3): boolean {
  return (
    a[0] === b[0] &&
    a[1] === b[1] &&
    a[2] === b[2] &&
    a[3] === b[3] &&
    a[4] === b[4] &&
    a[5] === b[5] &&
    a[6] === b[6] &&
    a[7] === b[7] &&
    a[8] === b[8]
  )
}

/**
 * Formats a matrix as a readable string
 *
 * @remarks
 * Use this for debugging only, not for serialization.
 *
 * @param mat The matrix to format
 * @param fractionDigits The number of digits after the decimal point. Defaults to 5.
 */
export function mat3Format(mat: Mat3, fractionDigits: number = 5): string {
  const m = mat
  return [
    [m[0].toFixed(fractionDigits), m[3].toFixed(fractionDigits), m[6].toFixed(fractionDigits)].join(','),
    [m[1].toFixed(fractionDigits), m[4].toFixed(fractionDigits), m[7].toFixed(fractionDigits)].join(','),
    [m[2].toFixed(fractionDigits), m[5].toFixed(fractionDigits), m[8].toFixed(fractionDigits)].join(','),
  ].join('\n')
}

/**
 * Copies the components of a matrix into an array
 *
 * @param mat The matrix to copy
 * @param array The array to write to. A new array is created if not given.
 * @param offset The index in the array to start writing at. Defaults to 0.
 */
export function mat3ToArray(mat: Mat3): number[]
export function mat3ToArray<T extends ArrayLike<number>>(mat: Mat3, array: T, offset?: number): T
export function mat3ToArray(mat: Mat3, array: ArrayLike<number> = [], offset: number = 0): ArrayLike<number> {
  array[offset] = mat[0]
  array[offset + 1] = mat[1]
  array[offset + 2] = mat[2]
  array[offset + 3] = mat[3]
  array[offset + 4] = mat[4]
  array[offset + 5] = mat[5]
  array[offset + 6] = mat[6]
  array[offset + 7] = mat[7]
  array[offset + 8] = mat[8]
  return array
}
