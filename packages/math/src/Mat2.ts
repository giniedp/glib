import type { ArrayLike, IVec2, IVec3, IVec4 } from './Types'
import { vec2 } from './Vec2'

// prettier-ignore
const
  C0R0 = 0, C1R0 = 2,
  C0R1 = 1, C1R1 = 3

export type Mat2 = Float16Array | Float32Array | Float64Array | number[]

/**
 * Creates a new matrix with all components set to 0
 */
export function mat2() {
  return new Float32Array(4)
}

/**
 * Creates a new identity matrix
 */
export function mat2Identity() {
  return mat2$initIdentity(mat2())
}

/**
 * Sets the components of a matrix. The values are read in column major order.
 *
 * @param out The matrix to set
 * @param m0 Column 0, row 0
 * @param m1 Column 0, row 1
 * @param m2 Column 1, row 0
 * @param m3 Column 1, row 1
 */
export function mat2$init(out: Mat2, m0: number, m1: number, m2: number, m3: number) {
  const m = out
  m[0] = m0
  m[1] = m1
  m[2] = m2
  m[3] = m3
  return out
}

/**
 * Creates a new matrix from the given components. The values are read in column major order.
 *
 * @param m0 Column 0, row 0
 * @param m1 Column 0, row 1
 * @param m2 Column 1, row 0
 * @param m3 Column 1, row 1
 */
export function mat2Create(m0: number, m1: number, m2: number, m3: number): Mat2 {
  return mat2$init(mat2(), m0, m1, m2, m3)
}

/**
 * Sets the components of a matrix. The values are read in row major order.
 *
 * @remarks
 * Only the order of the arguments is row major. The matrix is still stored in column major order.
 *
 * @param out The matrix to set
 * @param m0 Column 0, row 0
 * @param m2 Column 1, row 0
 * @param m1 Column 0, row 1
 * @param m3 Column 1, row 1
 */
export function mat2$initRowMajor(out: Mat2, m0: number, m2: number, m1: number, m3: number) {
  const m = out
  m[0] = m0
  m[1] = m1
  m[2] = m2
  m[3] = m3
  return out
}

/**
 * Creates a new matrix from the given components. The values are read in row major order.
 *
 * @remarks
 * Only the order of the arguments is row major. The matrix is still stored in column major order.
 *
 * @param m0 Column 0, row 0
 * @param m2 Column 1, row 0
 * @param m1 Column 0, row 1
 * @param m3 Column 1, row 1
 */
export function mat2CreateRowMajor(m0: number, m2: number, m1: number, m3: number): Mat2 {
  return mat2$initRowMajor(mat2(), m0, m2, m1, m3)
}

/**
 * Sets all components of a matrix to the same value
 *
 * @param out The matrix to set
 * @param value The value for all components
 */
export function mat2$initFill(out: Mat2, value: number) {
  const m = out
  m[0] = value
  m[1] = value
  m[2] = value
  m[3] = value
  return out
}

/**
 * Creates a new matrix with all components set to the same value
 *
 * @param value The value for all components
 */
export function mat2CreateFill(value: number): Mat2 {
  return mat2$initFill(mat2(), value)
}

/**
 * Sets a matrix to the identity matrix
 *
 * @param out The matrix to set
 */
export function mat2$initIdentity(out: Mat2) {
  const m = out
  m[0] = 1
  m[1] = 0
  m[2] = 0
  m[3] = 1
  return out
}

/**
 * Creates a new identity matrix
 */
export function mat2CreateIdentity(): Mat2 {
  return mat2$initIdentity(mat2())
}

/**
 * Copies the components of another matrix into a matrix
 *
 * @param out The matrix to set
 * @param other The matrix to copy from
 */
export function mat2$initFrom(out: Mat2, other: Mat2) {
  const m = out
  m[0] = other[0]
  m[1] = other[1]
  m[2] = other[2]
  m[3] = other[3]
  return out
}

/**
 * Creates a new matrix as a copy of another matrix
 *
 * @param other The matrix to copy from
 */
export function mat2CreateFrom(other: Mat2): Mat2 {
  return mat2$initFrom(mat2(), other)
}

/**
 * Sets the components of a matrix from an array
 *
 * @param out The matrix to set
 * @param array The array to read from
 * @param offset The index of the first value in the array. Defaults to 0.
 */
export function mat2$initFromArray(out: Mat2, array: ArrayLike<number>, offset?: number) {
  offset = offset || 0
  const m = out
  m[0] = array[offset]
  m[1] = array[offset + 1]
  m[2] = array[offset + 2]
  m[3] = array[offset + 3]
  return out
}

/**
 * Creates a new matrix from the values of an array
 *
 * @param array The array to read from
 * @param offset The index of the first value in the array. Defaults to 0.
 */
export function mat2CreateFromArray(array: ArrayLike<number>, offset?: number): Mat2 {
  return mat2$initFromArray(mat2(), array, offset)
}

/**
 * Sets a matrix to the rotation of a quaternion
 *
 * @param out The matrix to set
 * @param quat The rotation quaternion
 */
export function mat2$initFromQuat(out: Mat2, quat: IVec4) {
  mat2$initFromQuatValues(out, quat.x, quat.y, quat.z, quat.w)
  return out
}

/**
 * Creates a new rotation matrix from a quaternion
 *
 * @param quat The rotation quaternion
 */
export function mat2CreateFromQuat(quat: IVec4): Mat2 {
  return mat2$initFromQuat(mat2(), quat)
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
export function mat2$initFromQuatValues(out: Mat2, x: number, y: number, z: number, w: number) {
  const xx = x * x
  const yy = y * y
  const zz = z * z
  const xy = x * y
  const zw = z * w
  mat2$initRowMajor(out, 1 - 2 * (yy + zz), 2 * (xy - zw), 2 * (xy + zw), 1 - 2 * (zz + xx))
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
export function mat2CreateFromQuatValues(x: number, y: number, z: number, w: number): Mat2 {
  return mat2$initFromQuatValues(mat2(), x, y, z, w)
}

/**
 * Rotates a matrix by a quaternion
 *
 * @param out The matrix to rotate
 * @param quat The rotation quaternion
 */
export function mat2$rotateByQuat(out: Mat2, quat: IVec4) {
  mat2$rotateByQuatValues(out, quat.x, quat.y, quat.z, quat.w)
  return out
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
export function mat2$rotateByQuatValues(out: Mat2, x: number, y: number, z: number, w: number) {
  // matrix from quaternion
  const xx = x * x
  const yy = y * y
  const zz = z * z
  const xy = x * y
  const zw = z * w

  const r00 = 1 - 2 * (yy + zz)
  const r01 = 2 * (xy + zw)

  const r10 = 2 * (xy - zw)
  const r11 = 1 - 2 * (zz + xx)

  const m = out
  const m00 = m[0]
  const m01 = m[1]
  const m10 = m[2]
  const m11 = m[3]

  m[0] = r00 * m00 + r01 * m10
  m[1] = r00 * m01 + r01 * m11
  m[2] = r10 * m00 + r11 * m10
  m[3] = r10 * m01 + r11 * m11

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
export function mat2$preRotateByQuat(out: Mat2, quat: IVec4) {
  mat2$preRotateByQuatValues(out, quat.x, quat.y, quat.z, quat.w)
  return out
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
export function mat2$preRotateByQuatValues(out: Mat2, x: number, y: number, z: number, w: number) {
  // matrix from quaternion
  const xx = x * x
  const yy = y * y
  const zz = z * z
  const xy = x * y
  const zw = z * w

  const r00 = 1 - 2 * (yy + zz)
  const r01 = 2 * (xy + zw)

  const r10 = 2 * (xy - zw)
  const r11 = 1 - 2 * (zz + xx)

  const m = out
  const m00 = m[C0R0]
  const m10 = m[C1R0]
  const m01 = m[C0R1]
  const m11 = m[C1R1]

  m[C0R0] = r00 * m00 + r10 * m01
  m[C1R0] = r00 * m10 + r10 * m11
  m[C0R1] = r01 * m00 + r11 * m01
  m[C1R1] = r01 * m10 + r11 * m11

  return out
}

/**
 * Gets the scale part of a matrix
 *
 * @param mat The matrix to read from
 * @param out The vector to write to. A new vector is created if not given.
 */
export function mat2GetScale(mat: Mat2, out?: IVec2): IVec2 {
  out ||= vec2()
  out.x = mat[C0R0]
  out.y = mat[C1R1]
  return out
}

/**
 * Sets the scale part of a matrix
 *
 * @param out The matrix to change
 * @param vec The scale vector
 */
export function mat2$setScale(out: Mat2, vec: IVec2): Mat2 {
  out[C0R0] = vec.x
  out[C1R1] = vec.y
  return out
}

/**
 * Sets the scale part of a matrix
 *
 * @param out The matrix to change
 * @param x The scale on the x axis
 * @param y The scale on the y axis
 */
export function mat2$setScaleXY(out: Mat2, x: number, y: number): Mat2 {
  out[C0R0] = x
  out[C1R1] = y
  return out
}

/**
 * Sets the x component of the scale part of a matrix
 *
 * @param out The matrix to change
 * @param value The scale on the x axis
 */
export function mat2$setScaleX(out: Mat2, value: number): Mat2 {
  out[C0R0] = value
  return out
}

/**
 * Sets the y component of the scale part of a matrix
 *
 * @param out The matrix to change
 * @param value The scale on the y axis
 */
export function mat2$setScaleY(out: Mat2, value: number): Mat2 {
  out[C1R1] = value
  return out
}

/**
 * Sets a matrix to a rotation around an axis
 *
 * @param out The matrix to set
 * @param axis The normalized rotation axis
 * @param angle The rotation angle in radians
 */
export function mat2$initAxisAngle(out: Mat2, axis: IVec2 | IVec3, angle: number): Mat2 {
  return mat2$initAxisAngleValues(out, axis.x, axis.y, (axis as IVec3).z || 0, angle)
}

/**
 * Creates a new rotation matrix around an axis
 *
 * @param axis The normalized rotation axis
 * @param angle The rotation angle in radians
 */
export function mat2CreateAxisAngle(axis: IVec2 | IVec3, angle: number): Mat2 {
  return mat2$initAxisAngle(mat2(), axis, angle)
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
export function mat2$initAxisAngleValues(out: Mat2, x: number, y: number, z: number, angle: number): Mat2 {
  // create quaternion
  const halfAngle = angle * 0.5
  const scale = Math.sin(halfAngle)
  return mat2$initFromQuatValues(out, x * scale, y * scale, z * scale, Math.cos(halfAngle))
}

/**
 * Creates a new rotation matrix around an axis
 *
 * @param x The x component of the normalized rotation axis
 * @param y The y component of the normalized rotation axis
 * @param z The z component of the normalized rotation axis
 * @param angle The rotation angle in radians
 */
export function mat2CreateAxisAngleValues(x: number, y: number, z: number, angle: number): Mat2 {
  return mat2$initAxisAngleValues(mat2(), x, y, z, angle)
}

/**
 * Rotates a matrix around an axis
 *
 * @param out The matrix to rotate
 * @param axis The normalized rotation axis
 * @param angle The rotation angle in radians
 */
export function mat2$rotateByAxisAngle(out: Mat2, axis: IVec2 | IVec3, angle: number): Mat2 {
  return mat2$rotateByAxisAngleValues(out, axis.x, axis.y, (axis as IVec3).z || 0, angle)
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
export function mat2$rotateByAxisAngleValues(out: Mat2, x: number, y: number, z: number, angle: number): Mat2 {
  // create quaternion
  const halfAngle = angle * 0.5
  const scale = Math.sin(halfAngle)
  return mat2$rotateByQuatValues(out, x * scale, y * scale, z * scale, Math.cos(halfAngle))
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
export function mat2$preRotateByAxisAngle(out: Mat2, axis: IVec2 | IVec3, angle: number): Mat2 {
  return mat2$preRotateByAxisAngleValues(out, axis.x, axis.y, (axis as IVec3).z || 0, angle)
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
export function mat2$preRotateByAxisAngleValues(out: Mat2, x: number, y: number, z: number, angle: number): Mat2 {
  // create quaternion
  const halfAngle = angle * 0.5
  const scale = Math.sin(halfAngle)
  return mat2$preRotateByQuatValues(out, x * scale, y * scale, z * scale, Math.cos(halfAngle))
}

/**
 * Sets a matrix to a rotation around the X axis
 *
 * @param out The matrix to set
 * @param angle The rotation angle in radians
 */
export function mat2$initRotationX(out: Mat2, angle: number): Mat2 {
  const m = out
  m[0] = 1
  m[1] = 0
  m[2] = 0
  m[3] = Math.cos(angle)
  return out
}

/**
 * Creates a new rotation matrix around the X axis
 *
 * @param angle The rotation angle in radians
 */
export function mat2CreateRotationX(angle: number): Mat2 {
  return mat2$initRotationX(mat2(), angle)
}

/**
 * Rotates a matrix around the X axis
 *
 * @param out The matrix to rotate
 * @param angle The rotation angle in radians
 */
export function mat2$rotateX(out: Mat2, angle: number): Mat2 {
  const m = out
  const c = Math.cos(angle)
  m[2] = c * m[2]
  m[3] = c * m[3]
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
export function mat2$preRotateX(out: Mat2, angle: number): Mat2 {
  const m = out
  const c = Math.cos(angle)
  m[C0R1] = c * m[C0R1]
  m[C1R1] = c * m[C1R1]
  return out
}

/**
 * Sets a matrix to a rotation around the Y axis
 *
 * @param out The matrix to set
 * @param angle The rotation angle in radians
 */
export function mat2$initRotationY(out: Mat2, angle: number): Mat2 {
  const m = out
  m[0] = Math.cos(angle)
  m[1] = 0
  m[2] = 0
  m[3] = 1
  return out
}

/**
 * Creates a new rotation matrix around the Y axis
 *
 * @param angle The rotation angle in radians
 */
export function mat2CreateRotationY(angle: number): Mat2 {
  return mat2$initRotationY(mat2(), angle)
}

/**
 * Rotates a matrix around the Y axis
 *
 * @param out The matrix to rotate
 * @param angle The rotation angle in radians
 */
export function mat2$rotateY(out: Mat2, angle: number): Mat2 {
  const m = out
  const c = Math.cos(angle)
  m[0] = c * m[0]
  m[1] = c * m[1]
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
export function mat2$preRotateY(out: Mat2, angle: number): Mat2 {
  const m = out
  const c = Math.cos(angle)
  m[C0R0] = c * m[C0R0]
  m[C1R0] = c * m[C1R0]
  return out
}

/**
 * Sets a matrix to a rotation around the Z axis
 *
 * @param out The matrix to set
 * @param angle The rotation angle in radians
 */
export function mat2$initRotationZ(out: Mat2, angle: number): Mat2 {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const m = out
  m[0] = cos
  m[1] = sin
  m[2] = -sin
  m[3] = cos
  return out
}

/**
 * Creates a new rotation matrix around the Z axis
 *
 * @param angle The rotation angle in radians
 */
export function mat2CreateRotationZ(angle: number): Mat2 {
  return mat2$initRotationZ(mat2(), angle)
}

/**
 * Rotates a matrix around the Z axis
 *
 * @param out The matrix to rotate
 * @param angle The rotation angle in radians
 */
export function mat2$rotateZ(out: Mat2, angle: number): Mat2 {
  const m = out
  const m00 = m[0]
  const m01 = m[1]
  const m10 = m[2]
  const m11 = m[3]
  const c = Math.cos(angle)
  const s = Math.sin(angle)

  m[0] = c * m00 + s * m10
  m[1] = c * m01 + s * m11
  m[2] = c * m10 - s * m00
  m[3] = c * m11 - s * m01

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
export function mat2$preRotateZ(out: Mat2, angle: number): Mat2 {
  const m = out
  const m00 = m[C0R0]
  const m10 = m[C1R0]
  const m01 = m[C0R1]
  const m11 = m[C1R1]
  const c = Math.cos(angle)
  const s = Math.sin(angle)

  m[C0R0] = c * m00 - s * m01
  m[C1R0] = c * m10 - s * m11
  m[C0R1] = c * m01 + s * m00
  m[C1R1] = c * m11 + s * m10

  return out
}

/**
 * Sets a matrix to a scale matrix
 *
 * @param out The matrix to set
 * @param vec The scale vector
 */
export function mat2$initScale(out: Mat2, vec: IVec2): Mat2 {
  return mat2$initScaleXY(out, vec.x, vec.y)
}

/**
 * Creates a new scale matrix
 *
 * @param vec The scale vector
 */
export function mat2CreateScale(vec: IVec2): Mat2 {
  return mat2$initScale(mat2(), vec)
}

/**
 * Sets a matrix to a scale matrix
 *
 * @param out The matrix to set
 * @param x The scale on the x axis
 * @param y The scale on the y axis
 */
export function mat2$initScaleXY(out: Mat2, x: number, y: number): Mat2 {
  const m = out
  m[0] = x
  m[1] = 0
  m[2] = 0
  m[3] = y
  return out
}

/**
 * Creates a new scale matrix
 *
 * @param x The scale on the x axis
 * @param y The scale on the y axis
 */
export function mat2CreateScaleXY(x: number, y: number): Mat2 {
  return mat2$initScaleXY(mat2(), x, y)
}

/**
 * Sets a matrix to a uniform scale matrix
 *
 * @param out The matrix to set
 * @param scale The scale on all axes
 */
export function mat2$initScaleUniform(out: Mat2, scale: number): Mat2 {
  return mat2$initScaleXY(out, scale, scale)
}

/**
 * Creates a new uniform scale matrix
 *
 * @param scale The scale on all axes
 */
export function mat2CreateScaleUniform(scale: number): Mat2 {
  return mat2$initScaleUniform(mat2(), scale)
}

/**
 * Scales a matrix
 *
 * @param out The matrix to scale
 * @param scale The scale vector
 */
export function mat2$scale(out: Mat2, scale: IVec2): Mat2 {
  return mat2$scaleXY(out, scale.x, scale.y)
}

/**
 * Scales a matrix
 *
 * @param out The matrix to scale
 * @param x The scale on the x axis
 * @param y The scale on the y axis
 */
export function mat2$scaleXY(out: Mat2, x: number, y: number): Mat2 {
  const m = out
  m[C0R0] *= x
  m[C0R1] *= x
  m[C1R0] *= y
  m[C1R1] *= y
  return out
}

/**
 * Scales a matrix on the x axis
 *
 * @param out The matrix to scale
 * @param x The scale on the x axis
 */
export function mat2$scaleX(out: Mat2, x: number): Mat2 {
  out[C0R0] *= x
  out[C0R1] *= x
  return out
}

/**
 * Scales a matrix on the y axis
 *
 * @param out The matrix to scale
 * @param y The scale on the y axis
 */
export function mat2$scaleY(out: Mat2, y: number): Mat2 {
  out[C1R0] *= y
  out[C1R1] *= y
  return out
}

/**
 * Scales a matrix by the same value on all axes
 *
 * @param out The matrix to scale
 * @param scale The scale on all axes
 */
export function mat2$scaleUniform(out: Mat2, scale: number): Mat2 {
  const m = out
  m[0] *= scale
  m[1] *= scale
  m[2] *= scale
  m[3] *= scale
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
export function mat2$preScale(out: Mat2, scale: IVec2): Mat2 {
  return mat2$preScaleXY(out, scale.x, scale.y)
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
 */
export function mat2$preScaleXY(out: Mat2, x: number, y: number): Mat2 {
  const m = out
  m[C0R0] *= x
  m[C1R0] *= x
  m[C0R1] *= y
  m[C1R1] *= y
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
export function mat2$preScaleX(out: Mat2, x: number): Mat2 {
  out[C0R0] *= x
  out[C1R0] *= x
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
export function mat2$preScaleY(out: Mat2, y: number): Mat2 {
  out[C0R1] *= y
  out[C1R1] *= y
  return out
}

/**
 * Copies a matrix
 *
 * @param mat The matrix to copy
 * @param out The matrix to write to.
 */
export function mat2Copy(mat: Mat2, out?: Mat2): Mat2 {
  out ||= mat2()
  out[0] = mat[0]
  out[1] = mat[1]
  out[2] = mat[2]
  out[3] = mat[3]
  return out
}

/**
 * Calculates the determinant of a matrix
 *
 * @param mat The matrix
 */
export function mat2Determinant(mat: Mat2): number {
  return mat[0] * mat[3] - mat[1] * mat[2]
}

/**
 * Transposes a matrix
 *
 * @param out The matrix to transpose
 */
export function mat2$transpose(out: Mat2): Mat2 {
  const t = out[1]
  out[1] = out[2]
  out[2] = t
  return out
}

/**
 * Transposes a matrix
 *
 * @param mat The matrix to transpose
 * @param out The matrix to write to.
 */
export function mat2Transpose(mat: Mat2, out?: Mat2): Mat2 {
  return mat2$init(out || mat2(), mat[0], mat[2], mat[1], mat[3])
}

/**
 * Inverts a matrix
 *
 * @param out The matrix to invert
 */
export function mat2$invert(out: Mat2): Mat2 {
  return mat2Invert(out, out)
}

/**
 * Inverts a matrix
 *
 * @param mat The matrix to invert
 * @param out The matrix to write to.
 */
export function mat2Invert(mat: Mat2, out?: Mat2): Mat2 {
  out ||= mat2()

  const a11 = mat[0]
  const a12 = mat[2]
  const a21 = mat[1]
  const a22 = mat[3]

  const detInv = 1 / (a11 * a22 - a12 * a21)

  out[0] = detInv * a22
  out[1] = -detInv * a21
  out[2] = -detInv * a12
  out[3] = detInv * a11

  return out
}

/**
 * Negates all components of a matrix
 *
 * @param out The matrix to negate
 */
export function mat2$negate(out: Mat2): Mat2 {
  out[0] = -out[0]
  out[1] = -out[1]
  out[2] = -out[2]
  out[3] = -out[3]
  return out
}

/**
 * Negates all components of a matrix
 *
 * @param mat The matrix to negate
 * @param out The matrix to write to.
 */
export function mat2Negate(mat: Mat2, out?: Mat2): Mat2 {
  out ||= mat2()
  out[0] = -mat[0]
  out[1] = -mat[1]
  out[2] = -mat[2]
  out[3] = -mat[3]
  return out
}

/**
 * Adds a matrix to another matrix
 *
 * @param out The matrix to add to
 * @param other The matrix to add
 */
export function mat2$add(out: Mat2, other: Mat2): Mat2 {
  out[0] += other[0]
  out[1] += other[1]
  out[2] += other[2]
  out[3] += other[3]
  return out
}

/**
 * Adds two matrices
 *
 * @param a The first matrix
 * @param b The second matrix
 * @param out The matrix to write to.
 */
export function mat2Add(a: Mat2, b: Mat2, out?: Mat2): Mat2 {
  out ||= mat2()
  out[0] = a[0] + b[0]
  out[1] = a[1] + b[1]
  out[2] = a[2] + b[2]
  out[3] = a[3] + b[3]
  return out
}

/**
 * Adds a number to each component of a matrix
 *
 * @param out The matrix to add to
 * @param scalar The number to add
 */
export function mat2$addScalar(out: Mat2, scalar: number): Mat2 {
  out[0] += scalar
  out[1] += scalar
  out[2] += scalar
  out[3] += scalar
  return out
}

/**
 * Adds a number to each component of a matrix
 *
 * @param mat The matrix
 * @param scalar The number to add
 * @param out The matrix to write to.
 */
export function mat2AddScalar(mat: Mat2, scalar: number, out?: Mat2): Mat2 {
  out ||= mat2()
  out[0] = mat[0] + scalar
  out[1] = mat[1] + scalar
  out[2] = mat[2] + scalar
  out[3] = mat[3] + scalar
  return out
}

/**
 * Subtracts a matrix from another matrix
 *
 * @param out The matrix to subtract from
 * @param other The matrix to subtract
 */
export function mat2$subtract(out: Mat2, other: Mat2): Mat2 {
  out[0] -= other[0]
  out[1] -= other[1]
  out[2] -= other[2]
  out[3] -= other[3]
  return out
}

/**
 * Subtracts the second matrix from the first matrix
 *
 * @param a The first matrix
 * @param b The second matrix
 * @param out The matrix to write to.
 */
export function mat2Subtract(a: Mat2, b: Mat2, out?: Mat2): Mat2 {
  out ||= mat2()
  out[0] = a[0] - b[0]
  out[1] = a[1] - b[1]
  out[2] = a[2] - b[2]
  out[3] = a[3] - b[3]
  return out
}

/**
 * Subtracts a number from each component of a matrix
 *
 * @param out The matrix to subtract from
 * @param scalar The number to subtract
 */
export function mat2$subtractScalar(out: Mat2, scalar: number): Mat2 {
  out[0] -= scalar
  out[1] -= scalar
  out[2] -= scalar
  out[3] -= scalar
  return out
}

/**
 * Subtracts a number from each component of a matrix
 *
 * @param mat The matrix
 * @param scalar The number to subtract
 * @param out The matrix to write to.
 */
export function mat2SubtractScalar(mat: Mat2, scalar: number, out?: Mat2): Mat2 {
  out ||= mat2()
  out[0] = mat[0] - scalar
  out[1] = mat[1] - scalar
  out[2] = mat[2] - scalar
  out[3] = mat[3] - scalar
  return out
}

/**
 * Multiplies a matrix with another matrix: `out = out * other`
 *
 * @param out The left matrix
 * @param other The right matrix
 */
export function mat2$multiply(out: Mat2, other: Mat2): Mat2 {
  return mat2Multiply(out, other, out)
}

/**
 * Multiplies two matrices: `out = a * b`
 *
 * @param a The left matrix
 * @param b The right matrix
 * @param out The matrix to write to.
 */
export function mat2Multiply(a: Mat2, b: Mat2, out?: Mat2): Mat2 {
  out ||= mat2()
  // prettier-ignore
  const
    a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],
    b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3]
  out[0] = b0 * a0 + b1 * a2
  out[1] = b0 * a1 + b1 * a3
  out[2] = b2 * a0 + b3 * a2
  out[3] = b2 * a1 + b3 * a3
  return out
}

/**
 * Multiplies another matrix with a matrix: `out = other * out`
 *
 * @param out The right matrix
 * @param other The left matrix
 */
export function mat2$premultiply(out: Mat2, other: Mat2): Mat2 {
  return mat2Multiply(other, out, out)
}

/**
 * Multiplies two matrices in reverse order: `out = b * a`
 *
 * @param a The right matrix
 * @param b The left matrix
 * @param out The matrix to write to.
 */
export function mat2Premultiply(a: Mat2, b: Mat2, out?: Mat2): Mat2 {
  return mat2Multiply(b, a, out)
}

/**
 * Multiplies each component of a matrix by a number
 *
 * @param out The matrix to multiply
 * @param scalar The number to multiply by
 */
export function mat2$multiplyScalar(out: Mat2, scalar: number): Mat2 {
  out[0] *= scalar
  out[1] *= scalar
  out[2] *= scalar
  out[3] *= scalar
  return out
}

/**
 * Multiplies each component of a matrix by a number
 *
 * @param mat The matrix
 * @param scalar The number to multiply by
 * @param out The matrix to write to.
 */
export function mat2MultiplyScalar(mat: Mat2, scalar: number, out?: Mat2): Mat2 {
  out ||= mat2()
  out[0] = mat[0] * scalar
  out[1] = mat[1] * scalar
  out[2] = mat[2] * scalar
  out[3] = mat[3] * scalar
  return out
}

/**
 * Divides each component of a matrix by the matching component of another matrix
 *
 * @param out The matrix to divide
 * @param other The matrix to divide by
 */
export function mat2$divide(out: Mat2, other: Mat2): Mat2 {
  out[0] /= other[0]
  out[1] /= other[1]
  out[2] /= other[2]
  out[3] /= other[3]
  return out
}

/**
 * Divides each component of the first matrix by the matching component of the second matrix
 *
 * @param a The first matrix
 * @param b The second matrix
 * @param out The matrix to write to.
 */
export function mat2Divide(a: Mat2, b: Mat2, out?: Mat2): Mat2 {
  out ||= mat2()
  out[0] = a[0] / b[0]
  out[1] = a[1] / b[1]
  out[2] = a[2] / b[2]
  out[3] = a[3] / b[3]
  return out
}

/**
 * Divides each component of a matrix by a number
 *
 * @param out The matrix to divide
 * @param scalar The number to divide by
 */
export function mat2$divideScalar(out: Mat2, scalar: number): Mat2 {
  return mat2$multiplyScalar(out, 1 / scalar)
}

/**
 * Divides each component of a matrix by a number
 *
 * @param mat The matrix
 * @param scalar The number to divide by
 * @param out The matrix to write to.
 */
export function mat2DivideScalar(mat: Mat2, scalar: number, out?: Mat2): Mat2 {
  return mat2MultiplyScalar(mat, 1 / scalar, out)
}

/**
 * Transforms 2D vectors stored in an array with a matrix. The array is changed in place.
 *
 * @param mat The transformation matrix
 * @param array The array with the vector components
 * @param offset The index of the first vector in the array. Defaults to 0.
 * @param stride The number of array elements between two vectors. Defaults to 2.
 * @param count The number of vectors to transform. Defaults to all vectors in the array.
 */
export function mat2TransformVec2Array<T extends ArrayLike<number>>(
  mat: Mat2,
  array: T,
  offset?: number,
  stride?: number,
  count?: number,
): T {
  let x: number
  let y: number
  const d = mat
  offset = offset || 0
  stride = stride === undefined ? 2 : stride
  count = count === undefined ? array.length / stride : count

  while (count > 0) {
    count--
    x = array[offset]
    y = array[offset + 1]
    array[offset] = x * d[0] + y * d[2]
    array[offset + 1] = x * d[1] + y * d[3]
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
export function mat2Lerp(a: Mat2, b: Mat2, t: number, out?: Mat2): Mat2 {
  out ||= mat2()
  out[0] = a[0] + (b[0] - a[0]) * t
  out[1] = a[1] + (b[1] - a[1]) * t
  out[2] = a[2] + (b[2] - a[2]) * t
  out[3] = a[3] + (b[3] - a[3]) * t
  return out
}

/**
 * Smoothly interpolates between two matrices, component by component
 *
 * @param a The start matrix
 * @param b The end matrix
 * @param t The interpolation value.
 * @param out The matrix to write to.
 */
export function mat2Smooth(a: Mat2, b: Mat2, t: number, out?: Mat2): Mat2 {
  t = t > 1 ? 1 : t < 0 ? 0 : t
  t = t * t * (3 - 2 * t)
  return mat2Lerp(a, b, t, out)
}

/**
 * Checks if two matrices have equal components
 *
 * @param a The first matrix
 * @param b The second matrix
 */
export function mat2Equals(a: Mat2, b: Mat2): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3]
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
export function mat2Format(mat: Mat2, fractionDigits: number = 5): string {
  const m = mat
  return [
    [m[0].toFixed(fractionDigits), m[2].toFixed(fractionDigits)].join(','),
    [m[1].toFixed(fractionDigits), m[3].toFixed(fractionDigits)].join(','),
  ].join('\n')
}

/**
 * Copies the components of a matrix into an array
 *
 * @param mat The matrix to copy
 * @param array The array to write to. A new array is created if not given.
 * @param offset The index in the array to start writing at. Defaults to 0.
 */
export function mat2ToArray(mat: Mat2): number[]
export function mat2ToArray<T extends ArrayLike<number>>(mat: Mat2, array: T, offset?: number): T
export function mat2ToArray(mat: Mat2, array: ArrayLike<number> = [], offset: number = 0): ArrayLike<number> {
  array[offset] = mat[0]
  array[offset + 1] = mat[1]
  array[offset + 2] = mat[2]
  array[offset + 3] = mat[3]
  return array
}
