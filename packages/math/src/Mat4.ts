import { quat$initFromMat3, quat$initIdentity } from './Quat'
import type { ArrayLike, IVec2, IVec3, IVec4 } from './Types'
import { vec2 } from './Vec2'
import { vec3, vec3Format } from './Vec3'
import { vec4, vec4Format } from './Vec4'

export type NdcMinZ = -1 | 0
export const NdcMinZ = {
  MinusOne: -1 as NdcMinZ,
  Zero: 0 as NdcMinZ,
}

export type ReversedZ = boolean
export const ReversedZ = {
  No: false as ReversedZ,
  Yes: true as ReversedZ,
}

// prettier-ignore
const
  C0R0 = 0, C1R0 = 4, C2R0 = 8, C3R0 = 12,
  C0R1 = 1, C1R1 = 5, C2R1 = 9, C3R1 = 13,
  C0R2 = 2, C1R2 = 6, C2R2 = 10, C3R2 = 14,
  C0R3 = 3, C1R3 = 7, C2R3 = 11, C3R3 = 15

const SIZE = 16
const _tmpRotation: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0]

export type Mat4 = ArrayLike<number>

/**
 * Creates a new matrix with all components set to 0
 */
export function mat4(): Mat4 {
  return new Float32Array(SIZE)
}

mat4.$0 = mat4Identity()
mat4.$1 = mat4Identity()
mat4.$2 = mat4Identity()

export function mat4Assert(m: ArrayLike<number>): Mat4 {
  console.assert(m.length === SIZE, `matrix data must have length of ${SIZE}`)
  return m as Mat4
}

/**
 * Sets the components of a matrix. The values are read in column major order.
 *
 * @param out The matrix to set
 * @param m00 Column 0, row 0
 * @param m01 Column 0, row 1
 * @param m02 Column 0, row 2
 * @param m03 Column 0, row 3
 * @param m10 Column 1, row 0
 * @param m11 Column 1, row 1
 * @param m12 Column 1, row 2
 * @param m13 Column 1, row 3
 * @param m20 Column 2, row 0
 * @param m21 Column 2, row 1
 * @param m22 Column 2, row 2
 * @param m23 Column 2, row 3
 * @param m30 Column 3, row 0
 * @param m31 Column 3, row 1
 * @param m32 Column 3, row 2
 * @param m33 Column 3, row 3
 */
export function mat4$init(
  out: Mat4,
  m00: number,
  m01: number,
  m02: number,
  m03: number,
  m10: number,
  m11: number,
  m12: number,
  m13: number,
  m20: number,
  m21: number,
  m22: number,
  m23: number,
  m30: number,
  m31: number,
  m32: number,
  m33: number,
): Mat4 {
  out[C0R0] = m00
  out[C0R1] = m01
  out[C0R2] = m02
  out[C0R3] = m03
  out[C1R0] = m10
  out[C1R1] = m11
  out[C1R2] = m12
  out[C1R3] = m13
  out[C2R0] = m20
  out[C2R1] = m21
  out[C2R2] = m22
  out[C2R3] = m23
  out[C3R0] = m30
  out[C3R1] = m31
  out[C3R2] = m32
  out[C3R3] = m33
  return out
}

/**
 * Creates a new matrix from the given components. The values are read in column major order.
 *
 * @param m00 Column 0, row 0
 * @param m01 Column 0, row 1
 * @param m02 Column 0, row 2
 * @param m03 Column 0, row 3
 * @param m10 Column 1, row 0
 * @param m11 Column 1, row 1
 * @param m12 Column 1, row 2
 * @param m13 Column 1, row 3
 * @param m20 Column 2, row 0
 * @param m21 Column 2, row 1
 * @param m22 Column 2, row 2
 * @param m23 Column 2, row 3
 * @param m30 Column 3, row 0
 * @param m31 Column 3, row 1
 * @param m32 Column 3, row 2
 * @param m33 Column 3, row 3
 */
export function mat4Create(
  m00: number,
  m01: number,
  m02: number,
  m03: number,
  m10: number,
  m11: number,
  m12: number,
  m13: number,
  m20: number,
  m21: number,
  m22: number,
  m23: number,
  m30: number,
  m31: number,
  m32: number,
  m33: number,
): Mat4 {
  return mat4$init(mat4(), m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33)
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
 * @param m30 Column 3, row 0
 * @param m01 Column 0, row 1
 * @param m11 Column 1, row 1
 * @param m21 Column 2, row 1
 * @param m31 Column 3, row 1
 * @param m02 Column 0, row 2
 * @param m12 Column 1, row 2
 * @param m22 Column 2, row 2
 * @param m32 Column 3, row 2
 * @param m03 Column 0, row 3
 * @param m13 Column 1, row 3
 * @param m23 Column 2, row 3
 * @param m33 Column 3, row 3
 */
export function mat4$initRowMajor(
  out: Mat4,
  m00: number,
  m10: number,
  m20: number,
  m30: number,
  m01: number,
  m11: number,
  m21: number,
  m31: number,
  m02: number,
  m12: number,
  m22: number,
  m32: number,
  m03: number,
  m13: number,
  m23: number,
  m33: number,
): Mat4 {
  out[C0R0] = m00
  out[C0R1] = m01
  out[C0R2] = m02
  out[C0R3] = m03
  out[C1R0] = m10
  out[C1R1] = m11
  out[C1R2] = m12
  out[C1R3] = m13
  out[C2R0] = m20
  out[C2R1] = m21
  out[C2R2] = m22
  out[C2R3] = m23
  out[C3R0] = m30
  out[C3R1] = m31
  out[C3R2] = m32
  out[C3R3] = m33
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
 * @param m30 Column 3, row 0
 * @param m01 Column 0, row 1
 * @param m11 Column 1, row 1
 * @param m21 Column 2, row 1
 * @param m31 Column 3, row 1
 * @param m02 Column 0, row 2
 * @param m12 Column 1, row 2
 * @param m22 Column 2, row 2
 * @param m32 Column 3, row 2
 * @param m03 Column 0, row 3
 * @param m13 Column 1, row 3
 * @param m23 Column 2, row 3
 * @param m33 Column 3, row 3
 */
export function mat4CreateRowMajor(
  m00: number,
  m10: number,
  m20: number,
  m30: number,
  m01: number,
  m11: number,
  m21: number,
  m31: number,
  m02: number,
  m12: number,
  m22: number,
  m32: number,
  m03: number,
  m13: number,
  m23: number,
  m33: number,
): Mat4 {
  return mat4$initRowMajor(mat4(), m00, m10, m20, m30, m01, m11, m21, m31, m02, m12, m22, m32, m03, m13, m23, m33)
}

/**
 * Sets all components of a matrix to the same value
 *
 * @param out The matrix to set
 * @param value The value for all components
 */
export function mat4$initFill(out: Mat4, value: number): Mat4 {
  out[0] = value
  out[1] = value
  out[2] = value
  out[3] = value
  out[4] = value
  out[5] = value
  out[6] = value
  out[7] = value
  out[8] = value
  out[9] = value
  out[10] = value
  out[11] = value
  out[12] = value
  out[13] = value
  out[14] = value
  out[15] = value
  return out
}

/**
 * Creates a new matrix with all components set to the same value
 *
 * @param value The value for all components
 */
export function mat4CreateFill(value: number): Mat4 {
  return mat4$initFill(mat4(), value)
}

/**
 * Sets a matrix to the identity matrix
 *
 * @param out The matrix to set
 */
export function mat4$initIdentity(out: Mat4): Mat4 {
  out[0] = 1
  out[1] = 0
  out[2] = 0
  out[3] = 0
  out[4] = 0
  out[5] = 1
  out[6] = 0
  out[7] = 0
  out[8] = 0
  out[9] = 0
  out[10] = 1
  out[11] = 0
  out[12] = 0
  out[13] = 0
  out[14] = 0
  out[15] = 1
  return out
}

/**
 * Creates a new identity matrix
 */
export function mat4CreateIdentity(): Mat4 {
  return mat4$initIdentity(mat4())
}

/**
 * Creates a new identity matrix
 */
export function mat4Identity(): Mat4 {
  return mat4$initIdentity(mat4())
}

/**
 * Copies the components of another matrix into a matrix
 *
 * @param out The matrix to set
 * @param other The matrix to copy from
 */
export function mat4$initFrom(out: Mat4, other: Mat4): Mat4 {
  out[0] = other[0]
  out[1] = other[1]
  out[2] = other[2]
  out[3] = other[3]
  out[4] = other[4]
  out[5] = other[5]
  out[6] = other[6]
  out[7] = other[7]
  out[8] = other[8]
  out[9] = other[9]
  out[10] = other[10]
  out[11] = other[11]
  out[12] = other[12]
  out[13] = other[13]
  out[14] = other[14]
  out[15] = other[15]
  return out
}

/**
 * Creates a new matrix as a copy of another matrix
 *
 * @param other The matrix to copy from
 */
export function mat4CreateFrom(other: Mat4): Mat4 {
  return mat4$initFrom(mat4(), other)
}

/**
 * Sets the components of a matrix from an array
 *
 * @param out The matrix to set
 * @param array The array to read from
 * @param offset The index of the first value in the array. Defaults to 0.
 */
export function mat4$initFromArray(out: Mat4, array: ArrayLike<number>, offset: number = 0): Mat4 {
  out[0] = array[offset]
  out[1] = array[offset + 1]
  out[2] = array[offset + 2]
  out[3] = array[offset + 3]
  out[4] = array[offset + 4]
  out[5] = array[offset + 5]
  out[6] = array[offset + 6]
  out[7] = array[offset + 7]
  out[8] = array[offset + 8]
  out[9] = array[offset + 9]
  out[10] = array[offset + 10]
  out[11] = array[offset + 11]
  out[12] = array[offset + 12]
  out[13] = array[offset + 13]
  out[14] = array[offset + 14]
  out[15] = array[offset + 15]
  return out
}

/**
 * Creates a new matrix from the values of an array
 *
 * @param array The array to read from
 * @param offset The index of the first value in the array. Defaults to 0.
 */
export function mat4CreateFromArray(array: ArrayLike<number>, offset: number = 0): Mat4 {
  return mat4$initFromArray(mat4(), array, offset)
}

/**
 * Sets a matrix to the rotation of a quaternion
 *
 * @param out The matrix to set
 * @param quat The rotation quaternion
 */
export function mat4$initFromQuat(out: Mat4, quat: IVec4): Mat4 {
  return mat4$initFromQuatValues(out, quat.x, quat.y, quat.z, quat.w)
}

/**
 * Creates a new rotation matrix from a quaternion
 *
 * @param quat The rotation quaternion
 */
export function mat4CreateFromQuat(quat: IVec4): Mat4 {
  return mat4$initFromQuat(mat4(), quat)
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
export function mat4$initFromQuatValues(out: Mat4, x: number, y: number, z: number, w: number): Mat4 {
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
  out[C0R3] = 0
  out[C1R0] = r10
  out[C1R1] = r11
  out[C1R2] = r12
  out[C1R3] = 0
  out[C2R0] = r20
  out[C2R1] = r21
  out[C2R2] = r22
  out[C2R3] = 0
  out[C3R0] = 0
  out[C3R1] = 0
  out[C3R2] = 0
  out[C3R3] = 1
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
export function mat4CreateFromQuatValues(x: number, y: number, z: number, w: number): Mat4 {
  return mat4$initFromQuatValues(mat4(), x, y, z, w)
}

/**
 * Rotates a matrix by a quaternion
 *
 * @remarks
 * The rotation is multiplied from the right, so it is applied in local space and keeps the translation.
 *
 * @param out The matrix to rotate
 * @param quat The rotation quaternion
 */
export function mat4$rotateByQuat(out: Mat4, quat: IVec4): Mat4 {
  return mat4$rotateByQuatValues(out, quat.x, quat.y, quat.z, quat.w)
}

/**
 * Rotates a matrix by a quaternion
 *
 * @remarks
 * The rotation is multiplied from the right, so it is applied in local space and keeps the translation.
 *
 * @param out The matrix to rotate
 * @param x The x component of the quaternion
 * @param y The y component of the quaternion
 * @param z The z component of the quaternion
 * @param w The w component of the quaternion
 */
export function mat4$rotateByQuatValues(out: Mat4, x: number, y: number, z: number, w: number): Mat4 {
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
  const m03 = out[C0R3]
  const m10 = out[C1R0]
  const m11 = out[C1R1]
  const m12 = out[C1R2]
  const m13 = out[C1R3]
  const m20 = out[C2R0]
  const m21 = out[C2R1]
  const m22 = out[C2R2]
  const m23 = out[C2R3]

  out[C0R0] = m00 * r00 + m10 * r01 + m20 * r02
  out[C0R1] = m01 * r00 + m11 * r01 + m21 * r02
  out[C0R2] = m02 * r00 + m12 * r01 + m22 * r02
  out[C0R3] = m03 * r00 + m13 * r01 + m23 * r02
  out[C1R0] = m00 * r10 + m10 * r11 + m20 * r12
  out[C1R1] = m01 * r10 + m11 * r11 + m21 * r12
  out[C1R2] = m02 * r10 + m12 * r11 + m22 * r12
  out[C1R3] = m03 * r10 + m13 * r11 + m23 * r12
  out[C2R0] = m00 * r20 + m10 * r21 + m20 * r22
  out[C2R1] = m01 * r20 + m11 * r21 + m21 * r22
  out[C2R2] = m02 * r20 + m12 * r21 + m22 * r22
  out[C2R3] = m03 * r20 + m13 * r21 + m23 * r22
  return out
}

/**
 * Rotates a matrix by a quaternion in world space
 *
 * @remarks
 * The rotation is multiplied from the left, so it is applied in world space and also rotates the translation.
 *
 * @param out The matrix to rotate
 * @param quat The rotation quaternion
 */
export function mat4$preRotateByQuat(out: Mat4, quat: IVec4): Mat4 {
  return mat4$preRotateByQuatValues(out, quat.x, quat.y, quat.z, quat.w)
}

/**
 * Rotates a matrix by a quaternion in world space
 *
 * @remarks
 * The rotation is multiplied from the left, so it is applied in world space and also rotates the translation.
 *
 * @param out The matrix to rotate
 * @param x The x component of the quaternion
 * @param y The y component of the quaternion
 * @param z The z component of the quaternion
 * @param w The w component of the quaternion
 */
export function mat4$preRotateByQuatValues(out: Mat4, x: number, y: number, z: number, w: number): Mat4 {
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
  const m30 = out[C3R0]
  const m31 = out[C3R1]
  const m32 = out[C3R2]

  out[C0R0] = r00 * m00 + r10 * m01 + r20 * m02
  out[C0R1] = r01 * m00 + r11 * m01 + r21 * m02
  out[C0R2] = r02 * m00 + r12 * m01 + r22 * m02
  out[C1R0] = r00 * m10 + r10 * m11 + r20 * m12
  out[C1R1] = r01 * m10 + r11 * m11 + r21 * m12
  out[C1R2] = r02 * m10 + r12 * m11 + r22 * m12
  out[C2R0] = r00 * m20 + r10 * m21 + r20 * m22
  out[C2R1] = r01 * m20 + r11 * m21 + r21 * m22
  out[C2R2] = r02 * m20 + r12 * m21 + r22 * m22
  out[C3R0] = r00 * m30 + r10 * m31 + r20 * m32
  out[C3R1] = r01 * m30 + r11 * m31 + r21 * m32
  out[C3R2] = r02 * m30 + r12 * m31 + r22 * m32
  return out
}

/**
 * Sets a matrix from a rotation, a translation and a scale
 *
 * @remarks
 * The result equals `T * R * S`, so the scale is applied first, then the rotation, then the translation.
 *
 * @param out The matrix to set
 * @param rotation The rotation quaternion
 * @param translation The translation vector
 * @param scale The scale vector
 */
export function mat4$initFromRTS(out: Mat4, rotation: IVec4, translation: IVec3, scale: IVec3): Mat4 {
  const x = rotation.x
  const y = rotation.y
  const z = rotation.z
  const w = rotation.w

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

  out[C0R0] = r00 * scale.x
  out[C0R1] = r01 * scale.x
  out[C0R2] = r02 * scale.x
  out[C0R3] = 0
  out[C1R0] = r10 * scale.y
  out[C1R1] = r11 * scale.y
  out[C1R2] = r12 * scale.y
  out[C1R3] = 0
  out[C2R0] = r20 * scale.z
  out[C2R1] = r21 * scale.z
  out[C2R2] = r22 * scale.z
  out[C2R3] = 0
  out[C3R0] = translation.x
  out[C3R1] = translation.y
  out[C3R2] = translation.z
  out[C3R3] = 1
  return out
}

/**
 * Creates a new matrix from a rotation, a translation and a scale
 *
 * @remarks
 * The result equals `T * R * S`, so the scale is applied first, then the rotation, then the translation.
 *
 * @param rotation The rotation quaternion
 * @param translation The translation vector
 * @param scale The scale vector
 */
export function mat4CreateFromRTS(rotation: IVec4, translation: IVec3, scale: IVec3): Mat4 {
  return mat4$initFromRTS(mat4(), rotation, translation, scale)
}

/**
 * Splits a matrix into scale, rotation and translation
 *
 * @remarks
 * Returns false if one of the scale components is 0. The rotation is set to identity in that case.
 * The matrix is expected to have no shear and no projection.
 *
 * @param mat The matrix to decompose
 * @param outScale The vector to write the scale to
 * @param outRotation The quaternion to write the rotation to
 * @param outTranslation The vector to write the translation to. Skipped if not given.
 */
export function mat4Decompose(mat: Mat4, outScale: IVec3, outRotation: IVec4, outTranslation?: IVec3): boolean {
  const m = mat
  if (outTranslation) {
    outTranslation.x = m[C3R0]
    outTranslation.y = m[C3R1]
    outTranslation.z = m[C3R2]
  }

  const sx = Math.sqrt(m[C0R0] * m[C0R0] + m[C0R1] * m[C0R1] + m[C0R2] * m[C0R2])
  const sy = Math.sqrt(m[C1R0] * m[C1R0] + m[C1R1] * m[C1R1] + m[C1R2] * m[C1R2])
  const sz = Math.sqrt(m[C2R0] * m[C2R0] + m[C2R1] * m[C2R1] + m[C2R2] * m[C2R2])
  outScale.x = sx
  outScale.y = sy
  outScale.z = sz

  if (sx === 0 || sy === 0 || sz === 0) {
    quat$initIdentity(outRotation)
    return false
  }

  const r = _tmpRotation
  r[0] = m[C0R0] / sx
  r[1] = m[C0R1] / sx
  r[2] = m[C0R2] / sx
  r[3] = m[C1R0] / sy
  r[4] = m[C1R1] / sy
  r[5] = m[C1R2] / sy
  r[6] = m[C2R0] / sz
  r[7] = m[C2R1] / sz
  r[8] = m[C2R2] / sz
  quat$initFromMat3(outRotation, r)
  return true
}

/**
 * Sets a matrix to a rotation around an axis
 *
 * @param out The matrix to set
 * @param axis The normalized rotation axis
 * @param angle The rotation angle in radians
 */
export function mat4$initAxisAngle(out: Mat4, axis: IVec3, angle: number): Mat4 {
  return mat4$initAxisAngleValues(out, axis.x, axis.y, axis.z, angle)
}

/**
 * Creates a new rotation matrix around an axis
 *
 * @param axis The normalized rotation axis
 * @param angle The rotation angle in radians
 */
export function mat4CreateAxisAngle(axis: IVec3, angle: number): Mat4 {
  return mat4$initAxisAngle(mat4(), axis, angle)
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
export function mat4$initAxisAngleValues(out: Mat4, x: number, y: number, z: number, angle: number): Mat4 {
  const halfAngle = angle * 0.5
  const scale = Math.sin(halfAngle)
  return mat4$initFromQuatValues(out, x * scale, y * scale, z * scale, Math.cos(halfAngle))
}

/**
 * Creates a new rotation matrix around an axis
 *
 * @param x The x component of the normalized rotation axis
 * @param y The y component of the normalized rotation axis
 * @param z The z component of the normalized rotation axis
 * @param angle The rotation angle in radians
 */
export function mat4CreateAxisAngleValues(x: number, y: number, z: number, angle: number): Mat4 {
  return mat4$initAxisAngleValues(mat4(), x, y, z, angle)
}

/**
 * Rotates a matrix around an axis
 *
 * @remarks
 * The rotation is multiplied from the right, so it is applied in local space and keeps the translation.
 *
 * @param out The matrix to rotate
 * @param axis The normalized rotation axis
 * @param angle The rotation angle in radians
 */
export function mat4$rotateByAxisAngle(out: Mat4, axis: IVec3, angle: number): Mat4 {
  return mat4$rotateByAxisAngleValues(out, axis.x, axis.y, axis.z, angle)
}

/**
 * Rotates a matrix around an axis
 *
 * @remarks
 * The rotation is multiplied from the right, so it is applied in local space and keeps the translation.
 *
 * @param out The matrix to rotate
 * @param x The x component of the normalized rotation axis
 * @param y The y component of the normalized rotation axis
 * @param z The z component of the normalized rotation axis
 * @param angle The rotation angle in radians
 */
export function mat4$rotateByAxisAngleValues(out: Mat4, x: number, y: number, z: number, angle: number): Mat4 {
  const halfAngle = angle * 0.5
  const scale = Math.sin(halfAngle)
  return mat4$rotateByQuatValues(out, x * scale, y * scale, z * scale, Math.cos(halfAngle))
}

/**
 * Rotates a matrix around an axis in world space
 *
 * @remarks
 * The rotation is multiplied from the left, so it is applied in world space and also rotates the translation.
 *
 * @param out The matrix to rotate
 * @param axis The normalized rotation axis
 * @param angle The rotation angle in radians
 */
export function mat4$preRotateByAxisAngle(out: Mat4, axis: IVec3, angle: number): Mat4 {
  return mat4$preRotateByAxisAngleValues(out, axis.x, axis.y, axis.z, angle)
}

/**
 * Rotates a matrix around an axis in world space
 *
 * @remarks
 * The rotation is multiplied from the left, so it is applied in world space and also rotates the translation.
 *
 * @param out The matrix to rotate
 * @param x The x component of the normalized rotation axis
 * @param y The y component of the normalized rotation axis
 * @param z The z component of the normalized rotation axis
 * @param angle The rotation angle in radians
 */
export function mat4$preRotateByAxisAngleValues(out: Mat4, x: number, y: number, z: number, angle: number): Mat4 {
  const halfAngle = angle * 0.5
  const scale = Math.sin(halfAngle)
  return mat4$preRotateByQuatValues(out, x * scale, y * scale, z * scale, Math.cos(halfAngle))
}

/**
 * Sets a matrix to a rotation from yaw, pitch and roll angles
 *
 * @param out The matrix to set
 * @param yaw The rotation angle in radians around the Y axis
 * @param pitch The rotation angle in radians around the X axis
 * @param roll The rotation angle in radians around the Z axis
 */
export function mat4$initYawPitchRoll(out: Mat4, yaw: number, pitch: number, roll: number): Mat4 {
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
  return mat4$initFromQuatValues(out, x, y, z, w)
}

/**
 * Creates a new rotation matrix from yaw, pitch and roll angles
 *
 * @param yaw The rotation angle in radians around the Y axis
 * @param pitch The rotation angle in radians around the X axis
 * @param roll The rotation angle in radians around the Z axis
 */
export function mat4CreateYawPitchRoll(yaw: number, pitch: number, roll: number): Mat4 {
  return mat4$initYawPitchRoll(mat4(), yaw, pitch, roll)
}

/**
 * Rotates a matrix by yaw, pitch and roll angles
 *
 * @remarks
 * The rotation is multiplied from the right, so it is applied in local space and keeps the translation.
 *
 * @param out The matrix to rotate
 * @param yaw The rotation angle in radians around the Y axis
 * @param pitch The rotation angle in radians around the X axis
 * @param roll The rotation angle in radians around the Z axis
 */
export function mat4$rotateYawPitchRoll(out: Mat4, yaw: number, pitch: number, roll: number): Mat4 {
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
  return mat4$rotateByQuatValues(out, x, y, z, w)
}

/**
 * Rotates a matrix by yaw, pitch and roll angles in world space
 *
 * @remarks
 * The rotation is multiplied from the left, so it is applied in world space and also rotates the translation.
 *
 * @param out The matrix to rotate
 * @param yaw The rotation angle in radians around the Y axis
 * @param pitch The rotation angle in radians around the X axis
 * @param roll The rotation angle in radians around the Z axis
 */
export function mat4$preRotateYawPitchRoll(out: Mat4, yaw: number, pitch: number, roll: number): Mat4 {
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
  return mat4$preRotateByQuatValues(out, x, y, z, w)
}

/**
 * Sets a matrix to a rotation around the X axis
 *
 * @param out The matrix to set
 * @param angle The rotation angle in radians
 */
export function mat4$initRotationX(out: Mat4, angle: number): Mat4 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return mat4$initRowMajor(out, 1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0, 0, 0, 0, 1)
}

/**
 * Creates a new rotation matrix around the X axis
 *
 * @param angle The rotation angle in radians
 */
export function mat4CreateRotationX(angle: number): Mat4 {
  return mat4$initRotationX(mat4(), angle)
}

/**
 * Rotates a matrix around the X axis
 *
 * @remarks
 * The rotation is multiplied from the right, so it is applied in local space and keeps the translation.
 *
 * @param out The matrix to rotate
 * @param angle The rotation angle in radians
 */
export function mat4$rotateX(out: Mat4, angle: number): Mat4 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const a0 = out[C1R0]
  const a1 = out[C1R1]
  const a2 = out[C1R2]
  const a3 = out[C1R3]
  const b0 = out[C2R0]
  const b1 = out[C2R1]
  const b2 = out[C2R2]
  const b3 = out[C2R3]

  out[C1R0] = c * a0 + s * b0
  out[C1R1] = c * a1 + s * b1
  out[C1R2] = c * a2 + s * b2
  out[C1R3] = c * a3 + s * b3
  out[C2R0] = c * b0 - s * a0
  out[C2R1] = c * b1 - s * a1
  out[C2R2] = c * b2 - s * a2
  out[C2R3] = c * b3 - s * a3
  return out
}

/**
 * Rotates a matrix around the X axis in world space
 *
 * @remarks
 * The rotation is multiplied from the left, so it is applied in world space and also rotates the translation.
 *
 * @param out The matrix to rotate
 * @param angle The rotation angle in radians
 */
export function mat4$preRotateX(out: Mat4, angle: number): Mat4 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const a0 = out[C0R1]
  const a1 = out[C1R1]
  const a2 = out[C2R1]
  const a3 = out[C3R1]
  const b0 = out[C0R2]
  const b1 = out[C1R2]
  const b2 = out[C2R2]
  const b3 = out[C3R2]

  out[C0R1] = c * a0 - s * b0
  out[C1R1] = c * a1 - s * b1
  out[C2R1] = c * a2 - s * b2
  out[C3R1] = c * a3 - s * b3
  out[C0R2] = c * b0 + s * a0
  out[C1R2] = c * b1 + s * a1
  out[C2R2] = c * b2 + s * a2
  out[C3R2] = c * b3 + s * a3
  return out
}

/**
 * Sets a matrix to a rotation around the Y axis
 *
 * @param out The matrix to set
 * @param angle The rotation angle in radians
 */
export function mat4$initRotationY(out: Mat4, angle: number): Mat4 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return mat4$initRowMajor(out, c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0, 0, 0, 1)
}

/**
 * Creates a new rotation matrix around the Y axis
 *
 * @param angle The rotation angle in radians
 */
export function mat4CreateRotationY(angle: number): Mat4 {
  return mat4$initRotationY(mat4(), angle)
}

/**
 * Rotates a matrix around the Y axis
 *
 * @remarks
 * The rotation is multiplied from the right, so it is applied in local space and keeps the translation.
 *
 * @param out The matrix to rotate
 * @param angle The rotation angle in radians
 */
export function mat4$rotateY(out: Mat4, angle: number): Mat4 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const a0 = out[C2R0]
  const a1 = out[C2R1]
  const a2 = out[C2R2]
  const a3 = out[C2R3]
  const b0 = out[C0R0]
  const b1 = out[C0R1]
  const b2 = out[C0R2]
  const b3 = out[C0R3]

  out[C2R0] = c * a0 + s * b0
  out[C2R1] = c * a1 + s * b1
  out[C2R2] = c * a2 + s * b2
  out[C2R3] = c * a3 + s * b3
  out[C0R0] = c * b0 - s * a0
  out[C0R1] = c * b1 - s * a1
  out[C0R2] = c * b2 - s * a2
  out[C0R3] = c * b3 - s * a3
  return out
}

/**
 * Rotates a matrix around the Y axis in world space
 *
 * @remarks
 * The rotation is multiplied from the left, so it is applied in world space and also rotates the translation.
 *
 * @param out The matrix to rotate
 * @param angle The rotation angle in radians
 */
export function mat4$preRotateY(out: Mat4, angle: number): Mat4 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const a0 = out[C0R2]
  const a1 = out[C1R2]
  const a2 = out[C2R2]
  const a3 = out[C3R2]
  const b0 = out[C0R0]
  const b1 = out[C1R0]
  const b2 = out[C2R0]
  const b3 = out[C3R0]

  out[C0R2] = c * a0 - s * b0
  out[C1R2] = c * a1 - s * b1
  out[C2R2] = c * a2 - s * b2
  out[C3R2] = c * a3 - s * b3
  out[C0R0] = c * b0 + s * a0
  out[C1R0] = c * b1 + s * a1
  out[C2R0] = c * b2 + s * a2
  out[C3R0] = c * b3 + s * a3
  return out
}

/**
 * Sets a matrix to a rotation around the Z axis
 *
 * @param out The matrix to set
 * @param angle The rotation angle in radians
 */
export function mat4$initRotationZ(out: Mat4, angle: number): Mat4 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return mat4$initRowMajor(out, c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)
}

/**
 * Creates a new rotation matrix around the Z axis
 *
 * @param angle The rotation angle in radians
 */
export function mat4CreateRotationZ(angle: number): Mat4 {
  return mat4$initRotationZ(mat4(), angle)
}

/**
 * Rotates a matrix around the Z axis
 *
 * @remarks
 * The rotation is multiplied from the right, so it is applied in local space and keeps the translation.
 *
 * @param out The matrix to rotate
 * @param angle The rotation angle in radians
 */
export function mat4$rotateZ(out: Mat4, angle: number): Mat4 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const a0 = out[C0R0]
  const a1 = out[C0R1]
  const a2 = out[C0R2]
  const a3 = out[C0R3]
  const b0 = out[C1R0]
  const b1 = out[C1R1]
  const b2 = out[C1R2]
  const b3 = out[C1R3]

  out[C0R0] = c * a0 + s * b0
  out[C0R1] = c * a1 + s * b1
  out[C0R2] = c * a2 + s * b2
  out[C0R3] = c * a3 + s * b3
  out[C1R0] = c * b0 - s * a0
  out[C1R1] = c * b1 - s * a1
  out[C1R2] = c * b2 - s * a2
  out[C1R3] = c * b3 - s * a3
  return out
}

/**
 * Rotates a matrix around the Z axis in world space
 *
 * @remarks
 * The rotation is multiplied from the left, so it is applied in world space and also rotates the translation.
 *
 * @param out The matrix to rotate
 * @param angle The rotation angle in radians
 */
export function mat4$preRotateZ(out: Mat4, angle: number): Mat4 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const a0 = out[C0R0]
  const a1 = out[C1R0]
  const a2 = out[C2R0]
  const a3 = out[C3R0]
  const b0 = out[C0R1]
  const b1 = out[C1R1]
  const b2 = out[C2R1]
  const b3 = out[C3R1]

  out[C0R0] = c * a0 - s * b0
  out[C1R0] = c * a1 - s * b1
  out[C2R0] = c * a2 - s * b2
  out[C3R0] = c * a3 - s * b3
  out[C0R1] = c * b0 + s * a0
  out[C1R1] = c * b1 + s * a1
  out[C2R1] = c * b2 + s * a2
  out[C3R1] = c * b3 + s * a3
  return out
}

/**
 * Sets a matrix to a scale matrix
 *
 * @param out The matrix to set
 * @param vec The scale vector
 */
export function mat4$initScale(out: Mat4, vec: IVec3): Mat4 {
  return mat4$initScaleXYZ(out, vec.x, vec.y, vec.z)
}

/**
 * Creates a new scale matrix
 *
 * @param vec The scale vector
 */
export function mat4CreateScale(vec: IVec3): Mat4 {
  return mat4$initScale(mat4(), vec)
}

/**
 * Sets a matrix to a scale matrix
 *
 * @param out The matrix to set
 * @param x The scale on the x axis
 * @param y The scale on the y axis
 * @param z The scale on the z axis
 */
export function mat4$initScaleXYZ(out: Mat4, x: number, y: number, z: number): Mat4 {
  return mat4$initRowMajor(out, x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1)
}

/**
 * Creates a new scale matrix
 *
 * @param x The scale on the x axis
 * @param y The scale on the y axis
 * @param z The scale on the z axis
 */
export function mat4CreateScaleXYZ(x: number, y: number, z: number): Mat4 {
  return mat4$initScaleXYZ(mat4(), x, y, z)
}

/**
 * Sets a matrix to a uniform scale matrix
 *
 * @param out The matrix to set
 * @param scale The scale on all axes
 */
export function mat4$initScaleUniform(out: Mat4, scale: number): Mat4 {
  return mat4$initScaleXYZ(out, scale, scale, scale)
}

/**
 * Creates a new uniform scale matrix
 *
 * @param scale The scale on all axes
 */
export function mat4CreateScaleUniform(scale: number): Mat4 {
  return mat4$initScaleUniform(mat4(), scale)
}

/**
 * Scales a matrix
 *
 * @remarks
 * The scale is multiplied from the right, so it is applied in local space and keeps the translation.
 *
 * @param out The matrix to scale
 * @param scale The scale vector
 */
export function mat4$scale(out: Mat4, scale: IVec3): Mat4 {
  return mat4$scaleXYZ(out, scale.x, scale.y, scale.z)
}

/**
 * Scales a matrix
 *
 * @remarks
 * The scale is multiplied from the right, so it is applied in local space and keeps the translation.
 *
 * @param out The matrix to scale
 * @param x The scale on the x axis
 * @param y The scale on the y axis
 * @param z The scale on the z axis
 */
export function mat4$scaleXYZ(out: Mat4, x: number, y: number, z: number): Mat4 {
  out[C0R0] *= x
  out[C0R1] *= x
  out[C0R2] *= x
  out[C0R3] *= x
  out[C1R0] *= y
  out[C1R1] *= y
  out[C1R2] *= y
  out[C1R3] *= y
  out[C2R0] *= z
  out[C2R1] *= z
  out[C2R2] *= z
  out[C2R3] *= z
  return out
}

/**
 * Scales a matrix on the x axis
 *
 * @remarks
 * The scale is multiplied from the right, so it is applied in local space and keeps the translation.
 *
 * @param out The matrix to scale
 * @param x The scale on the x axis
 */
export function mat4$scaleX(out: Mat4, x: number): Mat4 {
  out[C0R0] *= x
  out[C0R1] *= x
  out[C0R2] *= x
  out[C0R3] *= x
  return out
}

/**
 * Scales a matrix on the y axis
 *
 * @remarks
 * The scale is multiplied from the right, so it is applied in local space and keeps the translation.
 *
 * @param out The matrix to scale
 * @param y The scale on the y axis
 */
export function mat4$scaleY(out: Mat4, y: number): Mat4 {
  out[C1R0] *= y
  out[C1R1] *= y
  out[C1R2] *= y
  out[C1R3] *= y
  return out
}

/**
 * Scales a matrix on the z axis
 *
 * @remarks
 * The scale is multiplied from the right, so it is applied in local space and keeps the translation.
 *
 * @param out The matrix to scale
 * @param z The scale on the z axis
 */
export function mat4$scaleZ(out: Mat4, z: number): Mat4 {
  out[C2R0] *= z
  out[C2R1] *= z
  out[C2R2] *= z
  out[C2R3] *= z
  return out
}

/**
 * Scales a matrix by the same value on all axes
 *
 * @remarks
 * The scale is multiplied from the right, so it is applied in local space and keeps the translation.
 *
 * @param out The matrix to scale
 * @param scale The scale on all axes
 */
export function mat4$scaleUniform(out: Mat4, scale: number): Mat4 {
  out[C0R0] *= scale
  out[C0R1] *= scale
  out[C0R2] *= scale
  out[C0R3] *= scale
  out[C1R0] *= scale
  out[C1R1] *= scale
  out[C1R2] *= scale
  out[C1R3] *= scale
  out[C2R0] *= scale
  out[C2R1] *= scale
  out[C2R2] *= scale
  out[C2R3] *= scale
  return out
}

/**
 * Scales a matrix in world space
 *
 * @remarks
 * The scale is multiplied from the left, so it is applied in world space and also scales the translation.
 *
 * @param out The matrix to scale
 * @param scale The scale vector
 */
export function mat4$preScale(out: Mat4, scale: IVec3): Mat4 {
  return mat4$preScaleXYZ(out, scale.x, scale.y, scale.z)
}

/**
 * Scales a matrix in world space
 *
 * @remarks
 * The scale is multiplied from the left, so it is applied in world space and also scales the translation.
 *
 * @param out The matrix to scale
 * @param x The scale on the x axis
 * @param y The scale on the y axis
 * @param z The scale on the z axis
 */
export function mat4$preScaleXYZ(out: Mat4, x: number, y: number, z: number): Mat4 {
  out[C0R0] *= x
  out[C1R0] *= x
  out[C2R0] *= x
  out[C3R0] *= x
  out[C0R1] *= y
  out[C1R1] *= y
  out[C2R1] *= y
  out[C3R1] *= y
  out[C0R2] *= z
  out[C1R2] *= z
  out[C2R2] *= z
  out[C3R2] *= z
  return out
}

/**
 * Scales a matrix on the x axis in world space
 *
 * @remarks
 * The scale is multiplied from the left, so it is applied in world space and also scales the translation.
 *
 * @param out The matrix to scale
 * @param x The scale on the x axis
 */
export function mat4$preScaleX(out: Mat4, x: number): Mat4 {
  out[C0R0] *= x
  out[C1R0] *= x
  out[C2R0] *= x
  out[C3R0] *= x
  return out
}

/**
 * Scales a matrix on the y axis in world space
 *
 * @remarks
 * The scale is multiplied from the left, so it is applied in world space and also scales the translation.
 *
 * @param out The matrix to scale
 * @param y The scale on the y axis
 */
export function mat4$preScaleY(out: Mat4, y: number): Mat4 {
  out[C0R1] *= y
  out[C1R1] *= y
  out[C2R1] *= y
  out[C3R1] *= y
  return out
}

/**
 * Scales a matrix on the z axis in world space
 *
 * @remarks
 * The scale is multiplied from the left, so it is applied in world space and also scales the translation.
 *
 * @param out The matrix to scale
 * @param z The scale on the z axis
 */
export function mat4$preScaleZ(out: Mat4, z: number): Mat4 {
  out[C0R2] *= z
  out[C1R2] *= z
  out[C2R2] *= z
  out[C3R2] *= z
  return out
}

/**
 * Scales a matrix by the same value on all axes in world space
 *
 * @remarks
 * The scale is multiplied from the left, so it is applied in world space and also scales the translation.
 *
 * @param out The matrix to scale
 * @param scale The scale on all axes
 */
export function mat4$preScaleUniform(out: Mat4, scale: number): Mat4 {
  out[C0R0] *= scale
  out[C1R0] *= scale
  out[C2R0] *= scale
  out[C3R0] *= scale
  out[C0R1] *= scale
  out[C1R1] *= scale
  out[C2R1] *= scale
  out[C3R1] *= scale
  out[C0R2] *= scale
  out[C1R2] *= scale
  out[C2R2] *= scale
  out[C3R2] *= scale
  return out
}

/**
 * Sets a matrix to a translation matrix
 *
 * @param out The matrix to set
 * @param vec The translation vector
 */
export function mat4$initTranslation(out: Mat4, vec: IVec3): Mat4 {
  return mat4$initTranslationXYZ(out, vec.x, vec.y, vec.z)
}

/**
 * Creates a new translation matrix
 *
 * @param vec The translation vector
 */
export function mat4CreateTranslation(vec: IVec3): Mat4 {
  return mat4$initTranslation(mat4(), vec)
}

/**
 * Sets a matrix to a translation matrix
 *
 * @param out The matrix to set
 * @param x The translation on the x axis
 * @param y The translation on the y axis
 * @param z The translation on the z axis
 */
export function mat4$initTranslationXYZ(out: Mat4, x: number, y: number, z: number): Mat4 {
  return mat4$initRowMajor(out, 1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z, 0, 0, 0, 1)
}

/**
 * Creates a new translation matrix
 *
 * @param x The translation on the x axis
 * @param y The translation on the y axis
 * @param z The translation on the z axis
 */
export function mat4CreateTranslationXYZ(x: number, y: number, z: number): Mat4 {
  return mat4$initTranslationXYZ(mat4(), x, y, z)
}

/**
 * Translates a matrix
 *
 * @remarks
 * The translation is multiplied from the right, so it is applied in local space.
 *
 * @param out The matrix to translate
 * @param vec The translation vector
 */
export function mat4$translate(out: Mat4, vec: IVec3): Mat4 {
  return mat4$translateXYZ(out, vec.x, vec.y, vec.z)
}

/**
 * Translates a matrix
 *
 * @remarks
 * The translation is multiplied from the right, so it is applied in local space.
 *
 * @param out The matrix to translate
 * @param x The translation on the x axis
 * @param y The translation on the y axis
 * @param z The translation on the z axis
 */
export function mat4$translateXYZ(out: Mat4, x: number, y: number, z: number): Mat4 {
  out[C3R0] += out[C0R0] * x + out[C1R0] * y + out[C2R0] * z
  out[C3R1] += out[C0R1] * x + out[C1R1] * y + out[C2R1] * z
  out[C3R2] += out[C0R2] * x + out[C1R2] * y + out[C2R2] * z
  out[C3R3] += out[C0R3] * x + out[C1R3] * y + out[C2R3] * z
  return out
}

/**
 * Translates a matrix on the x axis
 *
 * @remarks
 * The translation is multiplied from the right, so it is applied in local space.
 *
 * @param out The matrix to translate
 * @param x The translation on the x axis
 */
export function mat4$translateX(out: Mat4, x: number): Mat4 {
  out[C3R0] += out[C0R0] * x
  out[C3R1] += out[C0R1] * x
  out[C3R2] += out[C0R2] * x
  out[C3R3] += out[C0R3] * x
  return out
}

/**
 * Translates a matrix on the y axis
 *
 * @remarks
 * The translation is multiplied from the right, so it is applied in local space.
 *
 * @param out The matrix to translate
 * @param y The translation on the y axis
 */
export function mat4$translateY(out: Mat4, y: number): Mat4 {
  out[C3R0] += out[C1R0] * y
  out[C3R1] += out[C1R1] * y
  out[C3R2] += out[C1R2] * y
  out[C3R3] += out[C1R3] * y
  return out
}

/**
 * Translates a matrix on the z axis
 *
 * @remarks
 * The translation is multiplied from the right, so it is applied in local space.
 *
 * @param out The matrix to translate
 * @param z The translation on the z axis
 */
export function mat4$translateZ(out: Mat4, z: number): Mat4 {
  out[C3R0] += out[C2R0] * z
  out[C3R1] += out[C2R1] * z
  out[C3R2] += out[C2R2] * z
  out[C3R3] += out[C2R3] * z
  return out
}

/**
 * Translates a matrix in world space
 *
 * @remarks
 * The translation is multiplied from the left, so it is applied in world space.
 * For an affine matrix this simply adds the values to the translation part.
 *
 * @param out The matrix to translate
 * @param vec The translation vector
 */
export function mat4$preTranslate(out: Mat4, vec: IVec3): Mat4 {
  return mat4$preTranslateXYZ(out, vec.x, vec.y, vec.z)
}

/**
 * Translates a matrix in world space
 *
 * @remarks
 * The translation is multiplied from the left, so it is applied in world space.
 * For an affine matrix this simply adds the values to the translation part.
 *
 * @param out The matrix to translate
 * @param x The translation on the x axis
 * @param y The translation on the y axis
 * @param z The translation on the z axis
 */
export function mat4$preTranslateXYZ(out: Mat4, x: number, y: number, z: number): Mat4 {
  out[C0R0] += out[C0R3] * x
  out[C1R0] += out[C1R3] * x
  out[C2R0] += out[C2R3] * x
  out[C3R0] += out[C3R3] * x
  out[C0R1] += out[C0R3] * y
  out[C1R1] += out[C1R3] * y
  out[C2R1] += out[C2R3] * y
  out[C3R1] += out[C3R3] * y
  out[C0R2] += out[C0R3] * z
  out[C1R2] += out[C1R3] * z
  out[C2R2] += out[C2R3] * z
  out[C3R2] += out[C3R3] * z
  return out
}

/**
 * Translates a matrix on the x axis in world space
 *
 * @remarks
 * The translation is multiplied from the left, so it is applied in world space.
 * For an affine matrix this simply adds the values to the translation part.
 *
 * @param out The matrix to translate
 * @param x The translation on the x axis
 */
export function mat4$preTranslateX(out: Mat4, x: number): Mat4 {
  out[C0R0] += out[C0R3] * x
  out[C1R0] += out[C1R3] * x
  out[C2R0] += out[C2R3] * x
  out[C3R0] += out[C3R3] * x
  return out
}

/**
 * Translates a matrix on the y axis in world space
 *
 * @remarks
 * The translation is multiplied from the left, so it is applied in world space.
 * For an affine matrix this simply adds the values to the translation part.
 *
 * @param out The matrix to translate
 * @param y The translation on the y axis
 */
export function mat4$preTranslateY(out: Mat4, y: number): Mat4 {
  out[C0R1] += out[C0R3] * y
  out[C1R1] += out[C1R3] * y
  out[C2R1] += out[C2R3] * y
  out[C3R1] += out[C3R3] * y
  return out
}

/**
 * Translates a matrix on the z axis in world space
 *
 * @remarks
 * The translation is multiplied from the left, so it is applied in world space.
 * For an affine matrix this simply adds the values to the translation part.
 *
 * @param out The matrix to translate
 * @param z The translation on the z axis
 */
export function mat4$preTranslateZ(out: Mat4, z: number): Mat4 {
  out[C0R2] += out[C0R3] * z
  out[C1R2] += out[C1R3] * z
  out[C2R2] += out[C2R3] * z
  out[C3R2] += out[C3R3] * z
  return out
}

/**
 * Sets a matrix to a rotation that looks in the given direction
 *
 * @remarks
 * The translation is set to 0.
 *
 * @param out The matrix to set
 * @param forward The forward direction
 * @param up The up direction of the viewer
 */
export function mat4$initOrientation(out: Mat4, forward: IVec3, up: IVec3): Mat4 {
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

  // prettier-ignore
  return mat4$initRowMajor(
    out,
    rightX, x, backX, 0,
    rightY, y, backY, 0,
    rightZ, z, backZ, 0,
    0, 0, 0, 1,
  )
}

/**
 * Creates a new rotation matrix that looks in the given direction
 *
 * @remarks
 * The translation is set to 0.
 *
 * @param forward The forward direction
 * @param up The up direction of the viewer
 */
export function mat4CreateOrientation(forward: IVec3, up: IVec3): Mat4 {
  return mat4$initOrientation(mat4(), forward, up)
}

/**
 * Sets a matrix to a world transformation from a position and a direction
 *
 * @param out The matrix to set
 * @param position The translation part
 * @param forward The forward direction
 * @param up The up direction
 */
export function mat4$initWorld(out: Mat4, position: IVec3, forward: IVec3, up: IVec3): Mat4 {
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

  // prettier-ignore
  return mat4$initRowMajor(
    out,
    rightX, x, backX, position.x,
    rightY, y, backY, position.y,
    rightZ, z, backZ, position.z,
    0, 0, 0, 1,
  )
}

/**
 * Creates a new world transformation from a position and a direction
 *
 * @param position The translation part
 * @param forward The forward direction
 * @param up The up direction
 */
export function mat4CreateWorld(position: IVec3, forward: IVec3, up: IVec3): Mat4 {
  return mat4$initWorld(mat4(), position, forward, up)
}

/**
 * Sets a matrix to a world transformation that looks from a position to a target
 *
 * @remarks
 * This is the world transformation of the viewer. Invert it to get a view matrix.
 *
 * @param out The matrix to set
 * @param position The position of the viewer
 * @param target The position to look at
 * @param up The up direction of the viewer
 */
export function mat4$initLookAt(out: Mat4, position: IVec3, target: IVec3, up: IVec3): Mat4 {
  // back = position - target
  let backX = position.x - target.x
  let backY = position.y - target.y
  let backZ = position.z - target.z

  // right = cross(up, back)
  let rightX = up.y * backZ - up.z * backY
  let rightY = up.z * backX - up.x * backZ
  let rightZ = up.x * backY - up.y * backX

  // back = normalize(back)
  let d = 1.0 / Math.sqrt(backX * backX + backY * backY + backZ * backZ)
  backX *= d
  backY *= d
  backZ *= d

  // right = normalize(right)
  d = 1.0 / Math.sqrt(rightX * rightX + rightY * rightY + rightZ * rightZ)
  rightX *= d
  rightY *= d
  rightZ *= d

  // up = cross(back, right)
  const upX = backY * rightZ - backZ * rightY
  const upY = backZ * rightX - backX * rightZ
  const upZ = backX * rightY - backY * rightX

  // prettier-ignore
  return mat4$initRowMajor(
    out,
    rightX, upX, backX, position.x,
    rightY, upY, backY, position.y,
    rightZ, upZ, backZ, position.z,
    0, 0, 0, 1,
  )
}

/**
 * Creates a new world transformation that looks from a position to a target
 *
 * @remarks
 * This is the world transformation of the viewer. Invert it to get a view matrix.
 *
 * @param position The position of the viewer
 * @param target The position to look at
 * @param up The up direction of the viewer
 */
export function mat4CreateLookAt(position: IVec3, target: IVec3, up: IVec3): Mat4 {
  return mat4$initLookAt(mat4(), position, target, up)
}

/**
 * Sets a matrix to a perspective projection
 *
 * @param out The matrix to set
 * @param width The width of the view volume at the near plane
 * @param height The height of the view volume at the near plane
 * @param near The near plane distance
 * @param far The far plane distance
 * @param ndcMinZ The minimum z value in normalized device coordinates. Use `-1` for WebGL and `0` for WebGPU.
 * @param reversedZ Whether to map the near plane to 1 and the far plane to 0. Defaults to false.
 */
export function mat4$initPerspective(
  out: Mat4,
  width: number,
  height: number,
  near: number,
  far: number,
  ndcMinZ: NdcMinZ,
  reversedZ: boolean = false,
): Mat4 {
  const d = far - near
  let m22: number
  let m32: number
  if (reversedZ) {
    m22 = near / d
    m32 = (far * near) / d
  } else if (!ndcMinZ) {
    // WebGPU
    m22 = -far / d
    m32 = -(far * near) / d
  } else {
    // WebGL
    m22 = -(far + near) / d
    m32 = -(2 * far * near) / d
  }
  // prettier-ignore
  return mat4$initRowMajor(
    out,
    (2 * near) / width, 0,                   0,   0,
    0,                  (2 * near) / height, 0,   0,
    0,                  0,                   m22, m32,
    0,                  0,                   -1,  0,
  )
}

/**
 * Creates a new perspective projection
 *
 * @param width The width of the view volume at the near plane
 * @param height The height of the view volume at the near plane
 * @param near The near plane distance
 * @param far The far plane distance
 * @param ndcMinZ The minimum z value in normalized device coordinates. Use `-1` for WebGL and `0` for WebGPU.
 * @param reversedZ Whether to map the near plane to 1 and the far plane to 0. Defaults to false.
 */
export function mat4CreatePerspective(
  width: number,
  height: number,
  near: number,
  far: number,
  ndcMinZ: NdcMinZ,
  reversedZ: boolean = false,
): Mat4 {
  return mat4$initPerspective(mat4(), width, height, near, far, ndcMinZ, reversedZ)
}

/**
 * Sets a matrix to a perspective projection with a field of view
 *
 * @param out The matrix to set
 * @param fov The vertical field of view angle in radians
 * @param aspect The aspect ratio, width divided by height
 * @param near The near plane distance
 * @param far The far plane distance
 * @param ndcMinZ The minimum z value in normalized device coordinates. Use `-1` for WebGL and `0` for WebGPU.
 * @param reversedZ Whether to map the near plane to 1 and the far plane to 0. Defaults to false.
 */
export function mat4$initPerspectiveFieldOfView(
  out: Mat4,
  fov: number,
  aspect: number,
  near: number,
  far: number,
  ndcMinZ: NdcMinZ,
  reversedZ: boolean = false,
): Mat4 {
  const s = 1.0 / Math.tan(fov * 0.5)
  const d = far - near
  let m22: number
  let m32: number
  if (reversedZ) {
    m22 = near / d
    m32 = (far * near) / d
  } else if (!ndcMinZ) {
    // WebGPU
    m22 = -far / d
    m32 = -(far * near) / d
  } else {
    // WebGL
    m22 = -(far + near) / d
    m32 = -(2 * far * near) / d
  }
  // prettier-ignore
  return mat4$initRowMajor(
    out,
    s / aspect, 0, 0,   0,
    0,          s, 0,   0,
    0,          0, m22, m32,
    0,          0, -1,  0,
  )
}

/**
 * Creates a new perspective projection with a field of view
 *
 * @param fov The vertical field of view angle in radians
 * @param aspect The aspect ratio, width divided by height
 * @param near The near plane distance
 * @param far The far plane distance
 * @param ndcMinZ The minimum z value in normalized device coordinates. Use `-1` for WebGL and `0` for WebGPU.
 * @param reversedZ Whether to map the near plane to 1 and the far plane to 0. Defaults to false.
 */
export function mat4CreatePerspectiveFieldOfView(
  fov: number,
  aspect: number,
  near: number,
  far: number,
  ndcMinZ: NdcMinZ,
  reversedZ: boolean = false,
): Mat4 {
  return mat4$initPerspectiveFieldOfView(mat4(), fov, aspect, near, far, ndcMinZ, reversedZ)
}

/**
 * Sets a matrix to an off center perspective projection
 *
 * @param out The matrix to set
 * @param left The left edge of the view volume
 * @param right The right edge of the view volume
 * @param bottom The bottom edge of the view volume
 * @param top The top edge of the view volume
 * @param near The near plane distance
 * @param far The far plane distance
 * @param ndcMinZ The minimum z value in normalized device coordinates. Use `-1` for WebGL and `0` for WebGPU.
 * @param reversedZ Whether to map the near plane to 1 and the far plane to 0. Defaults to false.
 */
export function mat4$initPerspectiveOffCenter(
  out: Mat4,
  left: number,
  right: number,
  bottom: number,
  top: number,
  near: number,
  far: number,
  ndcMinZ: NdcMinZ,
  reversedZ: boolean = false,
): Mat4 {
  const w = right - left
  const h = top - bottom
  const d = far - near
  let m22: number
  let m32: number
  if (reversedZ) {
    m22 = near / d
    m32 = (far * near) / d
  } else if (!ndcMinZ) {
    m22 = far / (near - far)
    m32 = (far * near) / (near - far)
  } else {
    m22 = -(far + near) / d
    m32 = -(2 * far * near) / d
  }
  // prettier-ignore
  return mat4$initRowMajor(
    out,
    (2 * near) / w, 0,              (right + left) / w, 0,
    0,              (2 * near) / h, (top + bottom) / h, 0,
    0,              0,              m22,                m32,
    0,              0,              -1,                 0,
  )
}

/**
 * Creates a new off center perspective projection
 *
 * @param left The left edge of the view volume
 * @param right The right edge of the view volume
 * @param bottom The bottom edge of the view volume
 * @param top The top edge of the view volume
 * @param near The near plane distance
 * @param far The far plane distance
 * @param ndcMinZ The minimum z value in normalized device coordinates. Use `-1` for WebGL and `0` for WebGPU.
 * @param reversedZ Whether to map the near plane to 1 and the far plane to 0. Defaults to false.
 */
export function mat4CreatePerspectiveOffCenter(
  left: number,
  right: number,
  bottom: number,
  top: number,
  near: number,
  far: number,
  ndcMinZ: NdcMinZ,
  reversedZ: boolean = false,
): Mat4 {
  return mat4$initPerspectiveOffCenter(mat4(), left, right, bottom, top, near, far, ndcMinZ, reversedZ)
}

/**
 * Sets a matrix to an orthographic projection
 *
 * @param out The matrix to set
 * @param width The width of the view volume
 * @param height The height of the view volume
 * @param near The near plane distance
 * @param far The far plane distance
 * @param ndcMinZ The minimum z value in normalized device coordinates. Use `-1` for WebGL and `0` for WebGPU.
 * @param reversedZ Whether to map the near plane to 1 and the far plane to 0. Defaults to false.
 */
export function mat4$initOrthographic(
  out: Mat4,
  width: number,
  height: number,
  near: number,
  far: number,
  ndcMinZ: NdcMinZ,
  reversedZ: boolean = false,
): Mat4 {
  const d = far - near
  let m22: number
  let m32: number
  if (reversedZ) {
    m22 = 1 / d
    m32 = far / d
  } else if (!ndcMinZ) {
    // WebGPU
    m22 = -1 / d
    m32 = -near / d
  } else {
    // WebGL
    m22 = -2 / d
    m32 = -(far + near) / d
  }
  // prettier-ignore
  return mat4$initRowMajor(
    out,
    2 / width, 0,          0,   0,
    0,         2 / height, 0,   0,
    0,         0,          m22, m32,
    0,         0,          0,   1,
  )
}

/**
 * Creates a new orthographic projection
 *
 * @param width The width of the view volume
 * @param height The height of the view volume
 * @param near The near plane distance
 * @param far The far plane distance
 * @param ndcMinZ The minimum z value in normalized device coordinates. Use `-1` for WebGL and `0` for WebGPU.
 * @param reversedZ Whether to map the near plane to 1 and the far plane to 0. Defaults to false.
 */
export function mat4CreateOrthographic(
  width: number,
  height: number,
  near: number,
  far: number,
  ndcMinZ: NdcMinZ,
  reversedZ: boolean = false,
): Mat4 {
  return mat4$initOrthographic(mat4(), width, height, near, far, ndcMinZ, reversedZ)
}

/**
 * Sets a matrix to an off center orthographic projection
 *
 * @param out The matrix to set
 * @param left The left edge of the view volume
 * @param right The right edge of the view volume
 * @param bottom The bottom edge of the view volume
 * @param top The top edge of the view volume
 * @param near The near plane distance
 * @param far The far plane distance
 * @param ndcMinZ The minimum z value in normalized device coordinates. Use `-1` for WebGL and `0` for WebGPU.
 * @param reversedZ Whether to map the near plane to 1 and the far plane to 0. Defaults to false.
 */
export function mat4$initOrthographicOffCenter(
  out: Mat4,
  left: number,
  right: number,
  bottom: number,
  top: number,
  near: number,
  far: number,
  ndcMinZ: NdcMinZ,
  reversedZ: boolean = false,
): Mat4 {
  const w = right - left
  const h = top - bottom
  const d = far - near
  let m22: number
  let m32: number
  if (reversedZ) {
    m22 = 1 / d
    m32 = far / d
  } else if (!ndcMinZ) {
    // WebGPU
    m22 = -1 / d
    m32 = -near / d
  } else {
    // WebGL
    m22 = -2 / d
    m32 = -(far + near) / d
  }
  // prettier-ignore
  return mat4$initRowMajor(
    out,
    2 / w, 0,     0,   -(right + left) / w,
    0,     2 / h, 0,   -(top + bottom) / h,
    0,     0,     m22, m32,
    0,     0,     0,   1,
  )
}

/**
 * Creates a new off center orthographic projection
 *
 * @param left The left edge of the view volume
 * @param right The right edge of the view volume
 * @param bottom The bottom edge of the view volume
 * @param top The top edge of the view volume
 * @param near The near plane distance
 * @param far The far plane distance
 * @param ndcMinZ The minimum z value in normalized device coordinates. Use `-1` for WebGL and `0` for WebGPU.
 * @param reversedZ Whether to map the near plane to 1 and the far plane to 0. Defaults to false.
 */
export function mat4CreateOrthographicOffCenter(
  left: number,
  right: number,
  bottom: number,
  top: number,
  near: number,
  far: number,
  ndcMinZ: NdcMinZ,
  reversedZ: boolean = false,
): Mat4 {
  return mat4$initOrthographicOffCenter(mat4(), left, right, bottom, top, near, far, ndcMinZ, reversedZ)
}

/**
 * Gets the forward direction of a matrix
 *
 * @param mat The matrix to read from
 * @param out The vector to write to.
 */
export function mat4GetForward(mat: Mat4, out?: IVec3): IVec3 {
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
export function mat4$setForward(out: Mat4, vec: IVec3): Mat4 {
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
export function mat4GetBackward(mat: Mat4, out?: IVec3): IVec3 {
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
export function mat4$setBackward(out: Mat4, vec: IVec3): Mat4 {
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
export function mat4GetRight(mat: Mat4, out?: IVec3): IVec3 {
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
export function mat4$setRight(out: Mat4, vec: IVec3): Mat4 {
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
export function mat4GetLeft(mat: Mat4, out?: IVec3): IVec3 {
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
export function mat4$setLeft(out: Mat4, vec: IVec3): Mat4 {
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
export function mat4GetUp(mat: Mat4, out?: IVec3): IVec3 {
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
export function mat4$setUp(out: Mat4, vec: IVec3): Mat4 {
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
export function mat4GetDown(mat: Mat4, out?: IVec3): IVec3 {
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
export function mat4$setDown(out: Mat4, vec: IVec3): Mat4 {
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
export function mat4GetScale(mat: Mat4, out?: IVec3): IVec3 {
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
export function mat4$setScale(out: Mat4, vec: IVec3): Mat4 {
  return mat4$setScaleXYZ(out, vec.x, vec.y, vec.z)
}

/**
 * Sets the scale part of a matrix
 *
 * @param out The matrix to change
 * @param x The scale on the x axis
 * @param y The scale on the y axis
 * @param z The scale on the z axis
 */
export function mat4$setScaleXYZ(out: Mat4, x: number, y: number, z: number): Mat4 {
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
export function mat4$setScaleX(out: Mat4, value: number): Mat4 {
  out[C0R0] = value
  return out
}

/**
 * Sets the y component of the scale part of a matrix
 *
 * @param out The matrix to change
 * @param value The scale on the y axis
 */
export function mat4$setScaleY(out: Mat4, value: number): Mat4 {
  out[C1R1] = value
  return out
}

/**
 * Sets the z component of the scale part of a matrix
 *
 * @param out The matrix to change
 * @param value The scale on the z axis
 */
export function mat4$setScaleZ(out: Mat4, value: number): Mat4 {
  out[C2R2] = value
  return out
}

/**
 * Gets the translation part of a matrix
 *
 * @param mat The matrix to read from
 * @param out The vector to write to.
 */
export function mat4GetTranslation(mat: Mat4, out?: IVec3): IVec3 {
  out ||= vec3()
  out.x = mat[C3R0]
  out.y = mat[C3R1]
  out.z = mat[C3R2]
  return out
}

/**
 * Sets the translation part of a matrix
 *
 * @param out The matrix to change
 * @param vec The translation vector
 */
export function mat4$setTranslation(out: Mat4, vec: IVec3): Mat4 {
  return mat4$setTranslationXYZ(out, vec.x, vec.y, vec.z)
}

/**
 * Sets the translation part of a matrix
 *
 * @param out The matrix to change
 * @param x The translation on the x axis
 * @param y The translation on the y axis
 * @param z The translation on the z axis
 */
export function mat4$setTranslationXYZ(out: Mat4, x: number, y: number, z: number): Mat4 {
  out[C3R0] = x
  out[C3R1] = y
  out[C3R2] = z
  return out
}

/**
 * Gets the translation.x part of a matrix
 *
 * @param mat The matrix to read from
 */
export function mat4GetTranslationX(mat: Mat4): number {
  return mat[C3R0]
}

/**
 * Gets the translation.y part of a matrix
 *
 * @param mat The matrix to read from
 */
export function mat4GetTranslationY(mat: Mat4): number {
  return mat[C3R1]
}

/**
 * Gets the translation.z part of a matrix
 *
 * @param mat The matrix to read from
 */
export function mat4GetTranslationZ(mat: Mat4): number {
  return mat[C3R2]
}

/**
 * Sets the x component of the translation part of a matrix
 *
 * @param out The matrix to change
 * @param value The translation on the x axis
 */
export function mat4$setTranslationX(out: Mat4, value: number): Mat4 {
  out[C3R0] = value
  return out
}

/**
 * Sets the y component of the translation part of a matrix
 *
 * @param out The matrix to change
 * @param value The translation on the y axis
 */
export function mat4$setTranslationY(out: Mat4, value: number): Mat4 {
  out[C3R1] = value
  return out
}

/**
 * Sets the z component of the translation part of a matrix
 *
 * @param out The matrix to change
 * @param value The translation on the z axis
 */
export function mat4$setTranslationZ(out: Mat4, value: number): Mat4 {
  out[C3R2] = value
  return out
}

/**
 * Gets a row of a matrix
 *
 * @param mat The matrix to read from
 * @param index The row index from 0 to 3
 * @param out The vector to write to.
 */
export function mat4GetRow(mat: Mat4, index: number, out?: IVec4): IVec4 {
  out ||= vec4()
  out.x = mat[index]
  out.y = mat[index + 4]
  out.z = mat[index + 8]
  out.w = mat[index + 12]
  return out
}

/**
 * Gets a column of a matrix
 *
 * @param mat The matrix to read from
 * @param index The column index from 0 to 3
 * @param out The vector to write to.
 */
export function mat4GetCol(mat: Mat4, index: number, out?: IVec4): IVec4 {
  out ||= vec4()
  const i = index * 4
  out.x = mat[i]
  out.y = mat[i + 1]
  out.z = mat[i + 2]
  out.w = mat[i + 3]
  return out
}

/**
 * Copies a matrix
 *
 * @param mat The matrix to copy
 * @param out The matrix to write to.
 */
export function mat4Copy(mat: Mat4, out?: Mat4): Mat4 {
  out ||= mat4()
  out[0] = mat[0]
  out[1] = mat[1]
  out[2] = mat[2]
  out[3] = mat[3]
  out[4] = mat[4]
  out[5] = mat[5]
  out[6] = mat[6]
  out[7] = mat[7]
  out[8] = mat[8]
  out[9] = mat[9]
  out[10] = mat[10]
  out[11] = mat[11]
  out[12] = mat[12]
  out[13] = mat[13]
  out[14] = mat[14]
  out[15] = mat[15]
  return out
}

/**
 * Calculates the determinant of a matrix
 *
 * @param mat The matrix
 */
export function mat4Determinant(mat: Mat4): number {
  const a = mat
  const a11 = a[0]
  const a12 = a[4]
  const a13 = a[8]
  const a14 = a[12]
  const a21 = a[1]
  const a22 = a[5]
  const a23 = a[9]
  const a24 = a[13]
  const a31 = a[2]
  const a32 = a[6]
  const a33 = a[10]
  const a34 = a[14]
  const a41 = a[3]
  const a42 = a[7]
  const a43 = a[11]
  const a44 = a[15]

  // 2x2 determinants
  const d1 = a33 * a44 - a43 * a34
  const d2 = a23 * a44 - a43 * a24
  const d3 = a23 * a34 - a33 * a24
  const d4 = a13 * a44 - a43 * a14
  const d5 = a13 * a34 - a33 * a14
  const d6 = a13 * a24 - a23 * a14

  // 3x3 determinants
  const det1 = a22 * d1 - a32 * d2 + a42 * d3
  const det2 = a12 * d1 - a32 * d4 + a42 * d5
  const det3 = a12 * d2 - a22 * d4 + a42 * d6
  const det4 = a12 * d3 - a22 * d5 + a32 * d6

  return a11 * det1 - a21 * det2 + a31 * det3 - a41 * det4
}

/**
 * Transposes a matrix
 *
 * @param out The matrix to transpose
 */
export function mat4$transpose(out: Mat4): Mat4 {
  let t: number
  t = out[1]
  out[1] = out[4]
  out[4] = t
  t = out[2]
  out[2] = out[8]
  out[8] = t
  t = out[3]
  out[3] = out[12]
  out[12] = t
  t = out[6]
  out[6] = out[9]
  out[9] = t
  t = out[7]
  out[7] = out[13]
  out[13] = t
  t = out[11]
  out[11] = out[14]
  out[14] = t
  return out
}

/**
 * Transposes a matrix
 *
 * @param mat The matrix to transpose
 * @param out The matrix to write to.
 */
export function mat4Transpose(mat: Mat4, out?: Mat4): Mat4 {
  const m = mat
  // prettier-ignore
  return mat4$init(
    out || mat4(),
    m[0], m[4], m[8], m[12],
    m[1], m[5], m[9], m[13],
    m[2], m[6], m[10], m[14],
    m[3], m[7], m[11], m[15],
  )
}

/**
 * Inverts a matrix
 *
 * @param out The matrix to invert
 */
export function mat4$invert(out: Mat4): Mat4 {
  return mat4Invert(out, out)
}

/**
 * Inverts a matrix
 *
 * @param mat The matrix to invert
 * @param out The matrix to write to.
 */
export function mat4Invert(mat: Mat4, out?: Mat4): Mat4 {
  out ||= mat4()
  const a = mat
  const b = out

  const a11 = a[0]
  const a12 = a[4]
  const a13 = a[8]
  const a14 = a[12]
  const a21 = a[1]
  const a22 = a[5]
  const a23 = a[9]
  const a24 = a[13]
  const a31 = a[2]
  const a32 = a[6]
  const a33 = a[10]
  const a34 = a[14]
  const a41 = a[3]
  const a42 = a[7]
  const a43 = a[11]
  const a44 = a[15]

  // 2x2 determinants
  const d1 = a33 * a44 - a43 * a34
  const d2 = a23 * a44 - a43 * a24
  const d3 = a23 * a34 - a33 * a24
  const d4 = a13 * a44 - a43 * a14
  const d5 = a13 * a34 - a33 * a14
  const d6 = a13 * a24 - a23 * a14

  // 3x3 determinants
  const det1 = a22 * d1 - a32 * d2 + a42 * d3
  const det2 = a12 * d1 - a32 * d4 + a42 * d5
  const det3 = a12 * d2 - a22 * d4 + a42 * d6
  const det4 = a12 * d3 - a22 * d5 + a32 * d6

  const detInv = 1 / (a11 * det1 - a21 * det2 + a31 * det3 - a41 * det4)

  b[0] = det1 * detInv
  b[4] = -det2 * detInv
  b[8] = det3 * detInv
  b[12] = -det4 * detInv
  b[1] = -(a21 * d1 - a31 * d2 + a41 * d3) * detInv
  b[5] = (a11 * d1 - a31 * d4 + a41 * d5) * detInv
  b[9] = -(a11 * d2 - a21 * d4 + a41 * d6) * detInv
  b[13] = (a11 * d3 - a21 * d5 + a31 * d6) * detInv

  let v1 = a32 * a44 - a42 * a34
  let v2 = a22 * a44 - a42 * a24
  let v3 = a22 * a34 - a32 * a24
  let v4 = a12 * a44 - a42 * a14
  let v5 = a12 * a34 - a32 * a14
  let v6 = a12 * a24 - a22 * a14
  b[2] = (a21 * v1 - a31 * v2 + a41 * v3) * detInv
  b[6] = -(a11 * v1 - a31 * v4 + a41 * v5) * detInv
  b[10] = (a11 * v2 - a21 * v4 + a41 * v6) * detInv
  b[14] = -(a11 * v3 - a21 * v5 + a31 * v6) * detInv

  v1 = a32 * a43 - a42 * a33
  v2 = a22 * a43 - a42 * a23
  v3 = a22 * a33 - a32 * a23
  v4 = a12 * a43 - a42 * a13
  v5 = a12 * a33 - a32 * a13
  v6 = a12 * a23 - a22 * a13
  b[3] = -(a21 * v1 - a31 * v2 + a41 * v3) * detInv
  b[7] = (a11 * v1 - a31 * v4 + a41 * v5) * detInv
  b[11] = -(a11 * v2 - a21 * v4 + a41 * v6) * detInv
  b[15] = (a11 * v3 - a21 * v5 + a31 * v6) * detInv

  return out
}

/**
 * Negates all components of a matrix
 *
 * @param out The matrix to negate
 */
export function mat4$negate(out: Mat4): Mat4 {
  out[0] = -out[0]
  out[1] = -out[1]
  out[2] = -out[2]
  out[3] = -out[3]
  out[4] = -out[4]
  out[5] = -out[5]
  out[6] = -out[6]
  out[7] = -out[7]
  out[8] = -out[8]
  out[9] = -out[9]
  out[10] = -out[10]
  out[11] = -out[11]
  out[12] = -out[12]
  out[13] = -out[13]
  out[14] = -out[14]
  out[15] = -out[15]
  return out
}

/**
 * Negates all components of a matrix
 *
 * @param mat The matrix to negate
 * @param out The matrix to write to.
 */
export function mat4Negate(mat: Mat4, out?: Mat4): Mat4 {
  out ||= mat4()
  out[0] = -mat[0]
  out[1] = -mat[1]
  out[2] = -mat[2]
  out[3] = -mat[3]
  out[4] = -mat[4]
  out[5] = -mat[5]
  out[6] = -mat[6]
  out[7] = -mat[7]
  out[8] = -mat[8]
  out[9] = -mat[9]
  out[10] = -mat[10]
  out[11] = -mat[11]
  out[12] = -mat[12]
  out[13] = -mat[13]
  out[14] = -mat[14]
  out[15] = -mat[15]
  return out
}

/**
 * Adds a matrix to another matrix
 *
 * @param out The matrix to add to
 * @param other The matrix to add
 */
export function mat4$add(out: Mat4, other: Mat4): Mat4 {
  out[0] += other[0]
  out[1] += other[1]
  out[2] += other[2]
  out[3] += other[3]
  out[4] += other[4]
  out[5] += other[5]
  out[6] += other[6]
  out[7] += other[7]
  out[8] += other[8]
  out[9] += other[9]
  out[10] += other[10]
  out[11] += other[11]
  out[12] += other[12]
  out[13] += other[13]
  out[14] += other[14]
  out[15] += other[15]
  return out
}

/**
 * Adds two matrices
 *
 * @param a The first matrix
 * @param b The second matrix
 * @param out The matrix to write to.
 */
export function mat4Add(a: Mat4, b: Mat4, out?: Mat4): Mat4 {
  out ||= mat4()
  out[0] = a[0] + b[0]
  out[1] = a[1] + b[1]
  out[2] = a[2] + b[2]
  out[3] = a[3] + b[3]
  out[4] = a[4] + b[4]
  out[5] = a[5] + b[5]
  out[6] = a[6] + b[6]
  out[7] = a[7] + b[7]
  out[8] = a[8] + b[8]
  out[9] = a[9] + b[9]
  out[10] = a[10] + b[10]
  out[11] = a[11] + b[11]
  out[12] = a[12] + b[12]
  out[13] = a[13] + b[13]
  out[14] = a[14] + b[14]
  out[15] = a[15] + b[15]
  return out
}

/**
 * Subtracts a matrix from another matrix
 *
 * @param out The matrix to subtract from
 * @param other The matrix to subtract
 */
export function mat4$subtract(out: Mat4, other: Mat4): Mat4 {
  out[0] -= other[0]
  out[1] -= other[1]
  out[2] -= other[2]
  out[3] -= other[3]
  out[4] -= other[4]
  out[5] -= other[5]
  out[6] -= other[6]
  out[7] -= other[7]
  out[8] -= other[8]
  out[9] -= other[9]
  out[10] -= other[10]
  out[11] -= other[11]
  out[12] -= other[12]
  out[13] -= other[13]
  out[14] -= other[14]
  out[15] -= other[15]
  return out
}

/**
 * Subtracts the second matrix from the first matrix
 *
 * @param a The first matrix
 * @param b The second matrix
 * @param out The matrix to write to.
 */
export function mat4Subtract(a: Mat4, b: Mat4, out?: Mat4): Mat4 {
  out ||= mat4()
  out[0] = a[0] - b[0]
  out[1] = a[1] - b[1]
  out[2] = a[2] - b[2]
  out[3] = a[3] - b[3]
  out[4] = a[4] - b[4]
  out[5] = a[5] - b[5]
  out[6] = a[6] - b[6]
  out[7] = a[7] - b[7]
  out[8] = a[8] - b[8]
  out[9] = a[9] - b[9]
  out[10] = a[10] - b[10]
  out[11] = a[11] - b[11]
  out[12] = a[12] - b[12]
  out[13] = a[13] - b[13]
  out[14] = a[14] - b[14]
  out[15] = a[15] - b[15]
  return out
}

/**
 * Divides each component of a matrix by the matching component of another matrix
 *
 * @param out The matrix to divide
 * @param other The matrix to divide by
 */
export function mat4$divide(out: Mat4, other: Mat4): Mat4 {
  out[0] /= other[0]
  out[1] /= other[1]
  out[2] /= other[2]
  out[3] /= other[3]
  out[4] /= other[4]
  out[5] /= other[5]
  out[6] /= other[6]
  out[7] /= other[7]
  out[8] /= other[8]
  out[9] /= other[9]
  out[10] /= other[10]
  out[11] /= other[11]
  out[12] /= other[12]
  out[13] /= other[13]
  out[14] /= other[14]
  out[15] /= other[15]
  return out
}

/**
 * Divides each component of the first matrix by the matching component of the second matrix
 *
 * @param a The first matrix
 * @param b The second matrix
 * @param out The matrix to write to.
 */
export function mat4Divide(a: Mat4, b: Mat4, out?: Mat4): Mat4 {
  out ||= mat4()
  out[0] = a[0] / b[0]
  out[1] = a[1] / b[1]
  out[2] = a[2] / b[2]
  out[3] = a[3] / b[3]
  out[4] = a[4] / b[4]
  out[5] = a[5] / b[5]
  out[6] = a[6] / b[6]
  out[7] = a[7] / b[7]
  out[8] = a[8] / b[8]
  out[9] = a[9] / b[9]
  out[10] = a[10] / b[10]
  out[11] = a[11] / b[11]
  out[12] = a[12] / b[12]
  out[13] = a[13] / b[13]
  out[14] = a[14] / b[14]
  out[15] = a[15] / b[15]
  return out
}

/**
 * Adds a number to each component of a matrix
 *
 * @param out The matrix to add to
 * @param scalar The number to add
 */
export function mat4$addScalar(out: Mat4, scalar: number): Mat4 {
  out[0] += scalar
  out[1] += scalar
  out[2] += scalar
  out[3] += scalar
  out[4] += scalar
  out[5] += scalar
  out[6] += scalar
  out[7] += scalar
  out[8] += scalar
  out[9] += scalar
  out[10] += scalar
  out[11] += scalar
  out[12] += scalar
  out[13] += scalar
  out[14] += scalar
  out[15] += scalar
  return out
}

/**
 * Adds a number to each component of a matrix
 *
 * @param mat The matrix
 * @param scalar The number to add
 * @param out The matrix to write to.
 */
export function mat4AddScalar(mat: Mat4, scalar: number, out?: Mat4): Mat4 {
  out ||= mat4()
  out[0] = mat[0] + scalar
  out[1] = mat[1] + scalar
  out[2] = mat[2] + scalar
  out[3] = mat[3] + scalar
  out[4] = mat[4] + scalar
  out[5] = mat[5] + scalar
  out[6] = mat[6] + scalar
  out[7] = mat[7] + scalar
  out[8] = mat[8] + scalar
  out[9] = mat[9] + scalar
  out[10] = mat[10] + scalar
  out[11] = mat[11] + scalar
  out[12] = mat[12] + scalar
  out[13] = mat[13] + scalar
  out[14] = mat[14] + scalar
  out[15] = mat[15] + scalar
  return out
}

/**
 * Subtracts a number from each component of a matrix
 *
 * @param out The matrix to subtract from
 * @param scalar The number to subtract
 */
export function mat4$subtractScalar(out: Mat4, scalar: number): Mat4 {
  out[0] -= scalar
  out[1] -= scalar
  out[2] -= scalar
  out[3] -= scalar
  out[4] -= scalar
  out[5] -= scalar
  out[6] -= scalar
  out[7] -= scalar
  out[8] -= scalar
  out[9] -= scalar
  out[10] -= scalar
  out[11] -= scalar
  out[12] -= scalar
  out[13] -= scalar
  out[14] -= scalar
  out[15] -= scalar
  return out
}

/**
 * Subtracts a number from each component of a matrix
 *
 * @param mat The matrix
 * @param scalar The number to subtract
 * @param out The matrix to write to.
 */
export function mat4SubtractScalar(mat: Mat4, scalar: number, out?: Mat4): Mat4 {
  out ||= mat4()
  out[0] = mat[0] - scalar
  out[1] = mat[1] - scalar
  out[2] = mat[2] - scalar
  out[3] = mat[3] - scalar
  out[4] = mat[4] - scalar
  out[5] = mat[5] - scalar
  out[6] = mat[6] - scalar
  out[7] = mat[7] - scalar
  out[8] = mat[8] - scalar
  out[9] = mat[9] - scalar
  out[10] = mat[10] - scalar
  out[11] = mat[11] - scalar
  out[12] = mat[12] - scalar
  out[13] = mat[13] - scalar
  out[14] = mat[14] - scalar
  out[15] = mat[15] - scalar
  return out
}

/**
 * Multiplies each component of a matrix by a number
 *
 * @param out The matrix to multiply
 * @param scalar The number to multiply by
 */
export function mat4$multiplyScalar(out: Mat4, scalar: number): Mat4 {
  out[0] *= scalar
  out[1] *= scalar
  out[2] *= scalar
  out[3] *= scalar
  out[4] *= scalar
  out[5] *= scalar
  out[6] *= scalar
  out[7] *= scalar
  out[8] *= scalar
  out[9] *= scalar
  out[10] *= scalar
  out[11] *= scalar
  out[12] *= scalar
  out[13] *= scalar
  out[14] *= scalar
  out[15] *= scalar
  return out
}

/**
 * Multiplies each component of a matrix by a number
 *
 * @param mat The matrix
 * @param scalar The number to multiply by
 * @param out The matrix to write to.
 */
export function mat4MultiplyScalar(mat: Mat4, scalar: number, out?: Mat4): Mat4 {
  out ||= mat4()
  out[0] = mat[0] * scalar
  out[1] = mat[1] * scalar
  out[2] = mat[2] * scalar
  out[3] = mat[3] * scalar
  out[4] = mat[4] * scalar
  out[5] = mat[5] * scalar
  out[6] = mat[6] * scalar
  out[7] = mat[7] * scalar
  out[8] = mat[8] * scalar
  out[9] = mat[9] * scalar
  out[10] = mat[10] * scalar
  out[11] = mat[11] * scalar
  out[12] = mat[12] * scalar
  out[13] = mat[13] * scalar
  out[14] = mat[14] * scalar
  out[15] = mat[15] * scalar
  return out
}

/**
 * Divides each component of a matrix by a number
 *
 * @param out The matrix to divide
 * @param scalar The number to divide by
 */
export function mat4$divideScalar(out: Mat4, scalar: number): Mat4 {
  return mat4$multiplyScalar(out, 1 / scalar)
}

/**
 * Divides each component of a matrix by a number
 *
 * @param mat The matrix
 * @param scalar The number to divide by
 * @param out The matrix to write to.
 */
export function mat4DivideScalar(mat: Mat4, scalar: number, out?: Mat4): Mat4 {
  return mat4MultiplyScalar(mat, 1 / scalar, out)
}

/**
 * Multiplies a matrix with another matrix: `out = out * other`
 *
 * @param out The left matrix
 * @param other The right matrix
 */
export function mat4$multiply(out: Mat4, other: Mat4): Mat4 {
  return mat4Multiply(out, other, out)
}

/**
 * Multiplies two matrices: `out = a * b`
 *
 * @param a The left matrix
 * @param b The right matrix
 * @param out The matrix to write to.
 */
export function mat4Multiply(a: Mat4, b: Mat4, out?: Mat4): Mat4 {
  out ||= mat4()
  // prettier-ignore
  const
    a00 = a[C0R0], a10 = a[C1R0], a20 = a[C2R0], a30 = a[C3R0],
    a01 = a[C0R1], a11 = a[C1R1], a21 = a[C2R1], a31 = a[C3R1],
    a02 = a[C0R2], a12 = a[C1R2], a22 = a[C2R2], a32 = a[C3R2],
    a03 = a[C0R3], a13 = a[C1R3], a23 = a[C2R3], a33 = a[C3R3],
    b00 = b[C0R0], b10 = b[C1R0], b20 = b[C2R0], b30 = b[C3R0],
    b01 = b[C0R1], b11 = b[C1R1], b21 = b[C2R1], b31 = b[C3R1],
    b02 = b[C0R2], b12 = b[C1R2], b22 = b[C2R2], b32 = b[C3R2],
    b03 = b[C0R3], b13 = b[C1R3], b23 = b[C2R3], b33 = b[C3R3]
  out[C0R0] = a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03
  out[C0R1] = a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03
  out[C0R2] = a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03
  out[C0R3] = a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03
  out[C1R0] = a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13
  out[C1R1] = a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13
  out[C1R2] = a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13
  out[C1R3] = a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13
  out[C2R0] = a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23
  out[C2R1] = a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23
  out[C2R2] = a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23
  out[C2R3] = a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23
  out[C3R0] = a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33
  out[C3R1] = a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33
  out[C3R2] = a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33
  out[C3R3] = a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33
  return out
}

/**
 * Multiplies another matrix with a matrix: `out = other * out`
 *
 * @param out The right matrix
 * @param other The left matrix
 */
export function mat4$premultiply(out: Mat4, other: Mat4): Mat4 {
  return mat4Multiply(other, out, out)
}

/**
 * Multiplies two matrices in reverse order: `out = b * a`
 *
 * @param a The right matrix
 * @param b The left matrix
 * @param out The matrix to write to.
 */
export function mat4Premultiply(a: Mat4, b: Mat4, out?: Mat4): Mat4 {
  return mat4Multiply(b, a, out)
}

/**
 * Transforms a 2D point with a matrix and divides by w
 *
 * @remarks
 * The point is treated as `(x, y, 0, 1)`. For a transform without the division by w use `vec2TransformByMat4`.
 *
 * @param mat The transformation matrix
 * @param vec The point to transform
 * @param out The vector to write to.
 */
export function mat4TransformPoint2(mat: Mat4, vec: IVec2, out?: IVec2): IVec2 {
  const x = vec.x
  const y = vec.y
  const d = mat
  out ||= vec2()
  out.x = x * d[C0R0] + y * d[C1R0] + d[C3R0]
  out.y = x * d[C0R1] + y * d[C1R1] + d[C3R1]
  const w = x * d[C0R3] + y * d[C1R3] + d[C3R3]
  if (w !== 1) {
    out.x /= w
    out.y /= w
  }
  return out
}

/**
 * Transforms a 3D point with a matrix and divides by w
 *
 * @remarks
 * The point is treated as `(x, y, z, 1)`. For a transform without the division by w use `vec3ApplyMat4`.
 *
 * @param mat The transformation matrix
 * @param vec The point to transform
 * @param out The vector to write to.
 */
export function mat4TransformPoint3(mat: Mat4, vec: IVec3, out?: IVec3): IVec3 {
  const x = vec.x
  const y = vec.y
  const z = vec.z
  const d = mat
  out ||= vec3()
  out.x = x * d[C0R0] + y * d[C1R0] + z * d[C2R0] + d[C3R0]
  out.y = x * d[C0R1] + y * d[C1R1] + z * d[C2R1] + d[C3R1]
  out.z = x * d[C0R2] + y * d[C1R2] + z * d[C2R2] + d[C3R2]
  const w = x * d[C0R3] + y * d[C1R3] + z * d[C2R3] + d[C3R3]
  if (w !== 1) {
    out.x /= w
    out.y /= w
    out.z /= w
  }
  return out
}

/**
 * Transforms a 2D direction with a matrix
 *
 * @remarks
 * The direction is treated as `(x, y, 0, 0)`, so the translation is ignored.
 *
 * @param mat The transformation matrix
 * @param vec The direction to transform
 * @param out The vector to write to.
 */
export function mat4TransformNormal2(mat: Mat4, vec: IVec2, out?: IVec2): IVec2 {
  const x = vec.x
  const y = vec.y
  const d = mat
  out ||= vec2()
  out.x = x * d[C0R0] + y * d[C1R0]
  out.y = x * d[C0R1] + y * d[C1R1]
  return out
}

/**
 * Transforms a 3D direction with a matrix
 *
 * @remarks
 * The direction is treated as `(x, y, z, 0)`, so the translation is ignored.
 *
 * @param mat The transformation matrix
 * @param vec The direction to transform
 * @param out The vector to write to.
 */
export function mat4TransformNormal3(mat: Mat4, vec: IVec3, out?: IVec3): IVec3 {
  const x = vec.x
  const y = vec.y
  const z = vec.z
  const d = mat
  out ||= vec3()
  out.x = x * d[C0R0] + y * d[C1R0] + z * d[C2R0]
  out.y = x * d[C0R1] + y * d[C1R1] + z * d[C2R1]
  out.z = x * d[C0R2] + y * d[C1R2] + z * d[C2R2]
  return out
}

/**
 * Transforms a 3D direction with the absolute values of a matrix
 *
 * @remarks
 * The translation is ignored. This is useful to transform the extents of a bounding box.
 *
 * @param mat The transformation matrix
 * @param vec The direction to transform
 * @param out The vector to write to.
 */
export function mat4TransformNormal3Abs(mat: Mat4, vec: IVec3, out?: IVec3): IVec3 {
  const x = vec.x
  const y = vec.y
  const z = vec.z
  const d = mat
  out ||= vec3()
  out.x = x * Math.abs(d[C0R0]) + y * Math.abs(d[C1R0]) + z * Math.abs(d[C2R0])
  out.y = x * Math.abs(d[C0R1]) + y * Math.abs(d[C1R1]) + z * Math.abs(d[C2R1])
  out.z = x * Math.abs(d[C0R2]) + y * Math.abs(d[C1R2]) + z * Math.abs(d[C2R2])
  return out
}

/**
 * Transforms 2D points stored in an array with a matrix. The array is changed in place.
 *
 * @remarks
 * The vectors are treated as `(x, y, 0, 1)`, so the translation is applied. There is no division by w.
 *
 * @param mat The transformation matrix
 * @param array The array with the vector components
 * @param offset The index of the first vector in the array. Defaults to 0.
 * @param stride The number of array elements between two vectors. Defaults to 2.
 * @param count The number of vectors to transform. Defaults to all vectors in the array.
 */
export function mat4ApplyToVec2Array<T extends ArrayLike<number>>(
  mat: Mat4,
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
    array[offset] = x * d[0] + y * d[4] + d[12]
    array[offset + 1] = x * d[1] + y * d[5] + d[13]
    offset += stride
  }
  return array
}

export function mat4ApplyToVec3(mat: Mat4, vec: IVec3, out?: IVec3): IVec3 {
  const x = vec.x
  const y = vec.y
  const z = vec.z
  const w = 1
  const d = mat
  out ||= vec3()
  out.x = x * d[C0R0] + y * d[C1R0] + z * d[C2R0] + w * d[C3R0]
  out.y = x * d[C0R1] + y * d[C1R1] + z * d[C2R1] + w * d[C3R1]
  out.z = x * d[C0R2] + y * d[C1R2] + z * d[C2R2] + w * d[C3R2]
  return out
}

/**
 * Transforms 3D points stored in an array with a matrix. The array is changed in place.
 *
 * @remarks
 * The vectors are treated as `(x, y, z, 1)`, so the translation is applied. There is no division by w.
 *
 * @param mat The transformation matrix
 * @param array The array with the vector components
 * @param offset The index of the first vector in the array. Defaults to 0.
 * @param stride The number of array elements between two vectors. Defaults to 3.
 * @param count The number of vectors to transform. Defaults to all vectors in the array.
 */
export function mat4ApplyToVec3Array<T extends ArrayLike<number>>(
  mat: Mat4,
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
    array[offset] = x * d[0] + y * d[4] + z * d[8] + d[12]
    array[offset + 1] = x * d[1] + y * d[5] + z * d[9] + d[13]
    array[offset + 2] = x * d[2] + y * d[6] + z * d[10] + d[14]
    offset += stride
  }
  return array
}

/**
 * Transforms 4D vectors stored in an array with a matrix. The array is changed in place.
 *
 * @param mat The transformation matrix
 * @param array The array with the vector components
 * @param offset The index of the first vector in the array. Defaults to 0.
 * @param stride The number of array elements between two vectors. Defaults to 4.
 * @param count The number of vectors to transform. Defaults to all vectors in the array.
 */
export function mat4ApplyToVec4Array<T extends ArrayLike<number>>(
  mat: Mat4,
  array: T,
  offset: number = 0,
  stride: number = 4,
  count: number = array.length / stride,
): T {
  const d = mat
  while (count > 0) {
    count--
    const x = array[offset]
    const y = array[offset + 1]
    const z = array[offset + 2]
    const w = array[offset + 3]
    array[offset] = x * d[0] + y * d[4] + z * d[8] + w * d[12]
    array[offset + 1] = x * d[1] + y * d[5] + z * d[9] + w * d[13]
    array[offset + 2] = x * d[2] + y * d[6] + z * d[10] + w * d[14]
    array[offset + 3] = x * d[3] + y * d[7] + z * d[11] + w * d[15]
    offset += stride
  }
  return array
}

/**
 * Transforms 2D directions stored in an array with a matrix. The array is changed in place.
 *
 * @remarks
 * The vectors are treated as `(x, y, 0, 0)`, so the translation is ignored.
 *
 * @param mat The transformation matrix
 * @param array The array with the vector components
 * @param offset The index of the first vector in the array. Defaults to 0.
 * @param stride The number of array elements between two vectors. Defaults to 2.
 * @param count The number of vectors to transform. Defaults to all vectors in the array.
 */
export function mat4ApplyToVec2DirArray<T extends ArrayLike<number>>(
  mat: Mat4,
  array: T,
  offset: number = 0,
  stride: number = 2,
  count: number = array.length / stride,
): T {
  const d = mat
  // prettier-ignore
  while (count > 0) {
    count--
    const x = array[offset]
    const y = array[offset + 1]
    array[offset    ] = x * d[0] + y * d[4]
    array[offset + 1] = x * d[1] + y * d[5]
    offset += stride
  }
  return array
}

/**
 * Transforms 3D directions stored in an array with a matrix. The array is changed in place.
 *
 * @remarks
 * The vectors are treated as `(x, y, z, 0)`, so the translation is ignored.
 *
 * @param mat The transformation matrix
 * @param array The array with the vector components
 * @param offset The index of the first vector in the array. Defaults to 0.
 * @param stride The number of array elements between two vectors. Defaults to 3.
 * @param count The number of vectors to transform. Defaults to all vectors in the array.
 */
export function mat4ApplyToVec3DirArray<T extends ArrayLike<number>>(
  mat: Mat4,
  array: T,
  offset: number = 0,
  stride: number = 3,
  count: number = array.length / stride,
): T {
  const d = mat
  // prettier-ignore
  while (count > 0) {
    count--
    const x = array[offset]
    const y = array[offset + 1]
    const z = array[offset + 2]
    array[offset    ] = x * d[0] + y * d[4] + z * d[8]
    array[offset + 1] = x * d[1] + y * d[5] + z * d[9]
    array[offset + 2] = x * d[2] + y * d[6] + z * d[10]
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
export function mat4Lerp(a: Mat4, b: Mat4, t: number, out?: Mat4): Mat4 {
  out ||= mat4()
  for (let i = 0; i < SIZE; i++) {
    out[i] = a[i] + (b[i] - a[i]) * t
  }
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
export function mat4Smooth(a: Mat4, b: Mat4, t: number, out?: Mat4): Mat4 {
  t = t > 1 ? 1 : t < 0 ? 0 : t
  t = t * t * (3 - 2 * t)
  return mat4Lerp(a, b, t, out)
}

/**
 * Checks if two matrices have equal components
 *
 * @param a The first matrix
 * @param b The second matrix
 */
export function mat4Equals(a: Mat4, b: Mat4): boolean {
  for (let i = 0; i < SIZE; i++) {
    if (a[i] !== b[i]) {
      return false
    }
  }
  return true
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
export function mat4Format(mat: Mat4, fractionDigits: number = 5): string {
  const m = mat
  return [
    [
      m[0].toFixed(fractionDigits),
      m[4].toFixed(fractionDigits),
      m[8].toFixed(fractionDigits),
      m[12].toFixed(fractionDigits),
    ].join(','),
    [
      m[1].toFixed(fractionDigits),
      m[5].toFixed(fractionDigits),
      m[9].toFixed(fractionDigits),
      m[13].toFixed(fractionDigits),
    ].join(','),
    [
      m[2].toFixed(fractionDigits),
      m[6].toFixed(fractionDigits),
      m[10].toFixed(fractionDigits),
      m[14].toFixed(fractionDigits),
    ].join(','),
    [
      m[3].toFixed(fractionDigits),
      m[7].toFixed(fractionDigits),
      m[11].toFixed(fractionDigits),
      m[15].toFixed(fractionDigits),
    ].join(','),
  ].join(',\n')
}

/**
 * Formats the scale, rotation and translation of a matrix as a readable string
 *
 * @remarks
 * Use this for debugging only, not for serialization.
 *
 * @param mat The matrix to format
 * @param fractionDigits The number of digits after the decimal point. Defaults to 2.
 */
export function mat4FormatComponents(mat: Mat4, fractionDigits: number = 2): string {
  const scale = vec3()
  const rotation = vec4()
  const translation = vec3()
  mat4Decompose(mat, scale, rotation, translation)
  return `scale: {${vec3Format(scale, fractionDigits)}} , rotation: {${vec4Format(rotation, fractionDigits)}}, translation: {${vec3Format(translation, fractionDigits)}}`
}

/**
 * Copies the components of a matrix into an array
 *
 * @param mat The matrix to copy
 * @param array The array to write to. A new array is created if not given.
 * @param offset The index in the array to start writing at. Defaults to 0.
 */
export function mat4ToArray(mat: Mat4): number[]
export function mat4ToArray<T extends ArrayLike<number>>(mat: Mat4, array: T, offset?: number): T
export function mat4ToArray(mat: Mat4, array: ArrayLike<number> = [], offset: number = 0): ArrayLike<number> {
  for (let i = 0; i < SIZE; i++) {
    array[offset + i] = mat[i]
  }
  return array
}
