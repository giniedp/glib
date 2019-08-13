import { ArrayLike, IVec2, IVec3, IVec4, Mat3Data } from './Types'
import { Vec3 } from './Vec3'

const enum M {
 _00 = 0, _10 = 3, _20 = 6,
 _01 = 1, _11 = 4, _21 = 7,
 _02 = 2, _12 = 5, _22 = 8,
}

/**
 * A 3x3 matrix using column major layout
 *
 * @public
 * @remarks
 * The matrix stores its values in a typed `Float32Array` array.
 * The elements are laid out in column major order meaning that
 * elements of each base vector reside next to each other.
 */
export class Mat3 {
  /**
   * The matrix data array
   */
  public readonly m: Float32Array | Float64Array

  /**
   * Gets and sets value at column 0 row 0
   */
  public get m00() {
    return this.m[M._00]
  }
  public set m00(v: number) {
    this.m[M._00] = v
  }

  /**
   * Gets and sets value at column 0 row 1
   */
  public get m01() {
    return this.m[M._01]
  }
  public set m01(v: number) {
    this.m[M._01] = v
  }

  /**
   * Gets and sets value at column 0 row 2
   */
  public get m02() {
    return this.m[M._02]
  }
  public set m02(v: number) {
    this.m[M._02] = v
  }

  /**
   * Gets and sets value at column 1 row 0
   */
  public get m10() {
    return this.m[M._10]
  }
  public set m10(v: number) {
    this.m[M._10] = v
  }

  /**
   * Gets and sets value at column 1 row 1
   */
  public get m11() {
    return this.m[M._11]
  }
  public set m11(v: number) {
    this.m[M._11] = v
  }

  /**
   * Gets and sets value at column 1 row 2
   */
  public get m12() {
    return this.m[M._12]
  }
  public set m12(v: number) {
    this.m[M._12] = v
  }

  /**
   * Gets and sets value at column 2 row 0
   */
  public get m20() {
    return this.m[M._20]
  }
  public set m20(v: number) {
    this.m[M._20] = v
  }

  /**
   * Gets and sets value at column 2 row 1
   */
  public get m21() {
    return this.m[M._21]
  }
  public set m21(v: number) {
    this.m[M._21] = v
  }

  /**
   * Gets and sets value at column 2 row 2
   */
  public get m22() {
    return this.m[M._22]
  }
  public set m22(v: number) {
    this.m[M._22] = v
  }

  /**
   * Constructs a new instance of {@link Mat4}
   *
   * @param m - the data to initialize with
   */
  constructor(m?: Mat3Data) {
    if (Array.isArray(m)) {
      this.m = new Float32Array(m)
    } else {
      this.m = m || new Float32Array(9)
    }
  }

  /**
   * Gets the forward direction as a new vector
   */
  public getForward(): Vec3
  /**
   * Gets the forward direction into an existing vector
   */
  public getForward<T>(out?: T): T & IVec3
  public getForward(out?: Vec3): Vec3 {
    out = out || new Vec3()
    out.x = -this.m[M._20]
    out.y = -this.m[M._21]
    out.z = -this.m[M._22]
    return out
  }

  /**
   * Sets the forward vector
   */
  public setForward(vec: IVec3): this {
    this.m[M._20] = -vec.x
    this.m[M._21] = -vec.y
    this.m[M._22] = -vec.z
    return this
  }

  /**
   * Gets the backward direction as a new vector
   */
  public getBackward(): Vec3
  /**
   * Gets the backward direction into an existing vector
   */
  public getBackward<T>(out?: T): T & IVec3
  public getBackward(out?: Vec3): Vec3 {
    out = out || new Vec3()
    out.x = this.m[M._20]
    out.y = this.m[M._21]
    out.z = this.m[M._22]
    return out
  }

  /**
   * Sets the backward vector
   */
  public setBackward(vec: IVec3): this {
    this.m[M._20] = vec.x
    this.m[M._21] = vec.y
    this.m[M._22] = vec.z
    return this
  }

  /**
   * Gets the right direction as a new vector
   */
  public getRight(): Vec3
  /**
   * Gets the right direction into an existing vector
   */
  public getRight<T>(out?: T): T & IVec3
  public getRight(out?: Vec3): Vec3 {
    out = out || new Vec3()
    out.x = this.m[M._00]
    out.y = this.m[M._01]
    out.z = this.m[M._02]
    return out
  }

  /**
   * Sets the right vector
   */
  public setRight(vec: IVec3): this {
    this.m[M._00] = vec.x
    this.m[M._01] = vec.y
    this.m[M._02] = vec.z
    return this
  }

  /**
   * Gets the left direction as a new vector
   */
  public getLeft(): Vec3
  /**
   * Gets the left direction into an existing vector
   */
  public getLeft<T>(out?: T): T & IVec3
  public getLeft(out?: Vec3): Vec3 {
    out = out || new Vec3()
    out.x = -this.m[M._00]
    out.y = -this.m[M._01]
    out.z = -this.m[M._02]
    return out
  }

  /**
   * Sets the left vector
   */
  public setLeft(vec: IVec3): this {
    this.m[M._00] = -vec.x
    this.m[M._01] = -vec.y
    this.m[M._02] = -vec.z
    return this
  }

  /**
   * Gets the up direction as a new vector
   */
  public getUp(): Vec3
  /**
   * Gets the up direction into an existing vector
   */
  public getUp<T>(out?: T): T & IVec3
  public getUp(out?: Vec3): Vec3 {
    out = out || new Vec3()
    out.x = this.m[M._10]
    out.y = this.m[M._11]
    out.z = this.m[M._12]
    return out
  }

  /**
   * Sets the up vector
   * @param vec - The vector to take values from
   */
  public setUp(vec: IVec3): this {
    this.m[M._10] = vec.x
    this.m[M._11] = vec.y
    this.m[M._12] = vec.z
    return this
  }

  /**
   * Gets the down direction as a new vector
   */
  public getDown(): Vec3
  /**
   * Gets the down direction into an existing vector
   */
  public getDown<T>(out?: T): T & IVec3
  public getDown(out?: Vec3): Vec3 {
    out = out || new Vec3()
    out.x = -this.m[M._10]
    out.y = -this.m[M._11]
    out.z = -this.m[M._12]
    return out
  }

  /**
   * Sets the down vector
   */
  public setDown(vec: IVec3): this {
    this.m[M._10] = -vec.x
    this.m[M._11] = -vec.y
    this.m[M._12] = -vec.z
    return this
  }

  /**
   * Gets the scale part as a new vector
   */
  public getScale(): Vec3
  /**
   * Gets the scale part into an existing vector
   */
  public getScale<T>(out?: T): T & IVec3
  public getScale(out?: Vec3): Vec3 {
    out = out || new Vec3()
    out.x = this.m[M._00]
    out.y = this.m[M._11]
    out.z = this.m[M._22]
    return out
  }

  /**
   * Sets the scale part
   */
  public setScale(x: number, y: number, z: number): this {
    this.m[M._00] = x
    this.m[M._11] = y
    this.m[M._22] = z
    return this
  }

  /**
   * Sets the scale part
   */
  public setScaleV(vec: IVec3): this {
    this.m[M._00] = vec.x
    this.m[M._11] = vec.y
    this.m[M._22] = vec.z
    return this
  }

  /**
   * Sets the x component of the scale part
   */
  public setScaleX(v: number): this {
    this.m[M._00] = v
    return this
  }

  /**
   * Sets the y component of the scale part
   */
  public setScaleY(v: number): this {
    this.m[M._11] = v
    return this
  }

  /**
   * Sets the z component of the scale part
   */
  public setScaleZ(v: number): this {
    this.m[M._22] = v
    return this
  }

  /**
   * Creates a matrix by reading the arguments in column major order
   */
  public static create(
    m00: number, m01: number, m02: number,
    m10: number, m11: number, m12: number,
    m20: number, m21: number, m22: number,
  ): Mat3 {
    const out = new Mat3()
    const m = out.m
    m[M._00] = m00
    m[M._01] = m01
    m[M._02] = m02

    m[M._10] = m10
    m[M._11] = m11
    m[M._12] = m12

    m[M._20] = m20
    m[M._21] = m21
    m[M._22] = m22
    return out
  }

  /**
   * Initializes the matrix by reading the arguments in column major order
   */
  public init(
    m00: number, m01: number, m02: number,
    m10: number, m11: number, m12: number,
    m20: number, m21: number, m22: number,
  ): this {
    const m = this.m
    m[M._00] = m00
    m[M._01] = m01
    m[M._02] = m02

    m[M._10] = m10
    m[M._11] = m11
    m[M._12] = m12

    m[M._20] = m20
    m[M._21] = m21
    m[M._22] = m22

    return this
  }

  /**
   * Creates a matrix by reading the arguments in row major order
   *
   * @remarks
   * The storage layout of the matrix does not change and keeps being
   * column major. Solely the given arguments are scanned in row major
   * order
   */
  public static createRowMajor(
    m00: number, m10: number, m20: number,
    m01: number, m11: number, m21: number,
    m02: number, m12: number, m22: number,
  ): Mat3 {
    const out = new Mat3()
    const m = out.m
    m[M._00] = m00
    m[M._01] = m01
    m[M._02] = m02

    m[M._10] = m10
    m[M._11] = m11
    m[M._12] = m12

    m[M._20] = m20
    m[M._21] = m21
    m[M._22] = m22

    return out
  }

  /**
   * Initializes the matrix by reading the arguments in row major order
   *
   * @remarks
   * The storage layout of the matrix does not change and keeps being
   * column major. Solely the given arguments are scanned in row major
   * order
   */
  public initRowMajor(
    m00: number, m10: number, m20: number,
    m01: number, m11: number, m21: number,
    m02: number, m12: number, m22: number,
  ): this {
    const m = this.m
    m[M._00] = m00
    m[M._01] = m01
    m[M._02] = m02

    m[M._10] = m10
    m[M._11] = m11
    m[M._12] = m12

    m[M._20] = m20
    m[M._21] = m21
    m[M._22] = m22

    return this
  }

  /**
   * Crates a matrix with all components initialized to given value
   *
   * @param number - The number to set all matrix components to.
   */
  public static createWith(value: number): Mat3 {
    return new Mat3().initWith(value)
  }

  /**
   * Initializes all components with given value
   *
   * @param number - The number to set all matrix components to.
   */
  public initWith(value: number): this {
    const m = this.m
    m[M._00] = value; m[M._10] = value; m[M._20] = value
    m[M._01] = value; m[M._11] = value; m[M._21] = value
    m[M._02] = value; m[M._12] = value; m[M._22] = value
    return this
  }

  /**
   * Creates a new matrix that is initialized to identity
   *
   * @returns a new matrix
   */
  public static createIdentity(): Mat3 {
    return new Mat3().initIdentity()
  }

  /**
   * Initializes the components of this matrix to the identity.
   */
  public initIdentity(): this {
    const m = this.m
    m[M._00] = 1; m[M._10] = 0; m[M._20] = 0
    m[M._01] = 0; m[M._11] = 1; m[M._21] = 0
    m[M._02] = 0; m[M._12] = 0; m[M._22] = 1
    return this
  }

  /**
   * Creates a new matrix with all components set to 0
   */
  public static createZero(): Mat3 {
    return new Mat3()
  }

  /**
   * Initializes the components of this matrix to 0.
   */
  public initZero(): this {
    const m = this.m
    m[M._00] = 0; m[M._10] = 0; m[M._20] = 0
    m[M._01] = 0; m[M._11] = 0; m[M._21] = 0
    m[M._02] = 0; m[M._12] = 0; m[M._22] = 0
    return this
  }

  /**
   * Creates a new matrix from another.
   */
  public static createFrom(other: Mat3): Mat3 {
    return new Mat3().initFrom(other)
  }

  /**
   * Initializes this matrix from another matrix.
   */
  public initFrom(other: Mat3): this {
    const a = this.m
    const b = other.m
    a[0] = b[0]
    a[1] = b[1]
    a[2] = b[2]
    a[3] = b[3]
    a[4] = b[4]
    a[5] = b[5]
    a[6] = b[6]
    a[7] = b[7]
    a[8] = b[8]
    return this
  }

  /**
   * Reads a array starting at given offset and initializes the elements of this matrix.
   */
  public static createFromArray(array: ArrayLike<number>, offset?: number): Mat3 {
    return new Mat3().initFromArray(array, offset)
  }

  /**
   * Reads a array starting at given offset and creates a new matrix.
   */
  public initFromArray(array: ArrayLike<number>, offset?: number): this {
    offset = offset || 0
    const a = this.m
    a[0] = array[offset]
    a[1] = array[offset + 1]
    a[2] = array[offset + 2]
    a[3] = array[offset + 3]
    a[4] = array[offset + 4]
    a[5] = array[offset + 5]
    a[6] = array[offset + 6]
    a[7] = array[offset + 7]
    a[8] = array[offset + 8]
    return this
  }

  /**
   * Creates a rotation matrix from an axis and angle
   *
   * @param axis - normalized rotation axis vector
   * @param angle - rotation angle in rad
   */
  public static createAxisAngleV(axis: IVec3, angle: number): Mat3 {
    return new Mat3().initAxisAngle(axis.x, axis.y, axis.z, angle)
  }

  /**
   * Initializes this matrix to a rotation matrix defined by given axis vector and angle.
   *
   * @param axis - normalized rotation axis vector
   * @param angle - rotation angle in rad
   */
  public initAxisAngleV(axis: IVec3, angle: number): this {
    return this.initAxisAngle(axis.x, axis.y, axis.z, angle)
  }

  /**
   * Applies a rotation around the given axis and angle
   *
   * @remarks
   * This affects only the 3x3 rotation part of the matrix.
   * Meaning that the matrix changes its facing direction
   * but keeps its position and shearing as is.
   *
   * @param axis - normalized rotation axis vector
   * @param angle - rotation angle in rad
   */
  public rotateAxisAngleV(axis: IVec3, angle: number): this {
    return this.rotateAxisAngle(axis.x, axis.y, axis.z, angle)
  }

  /**
   * Creates a rotation matrix from axis angle parameters
   *
   * @param x - x component of the normalized rotation axis
   * @param y - y component of the normalized rotation axis
   * @param z - z component of the normalized rotation axis
   * @param angle - rotation angle in rad
   */
  public static createAxisAngle(x: number, y: number, z: number, angle: number): Mat3 {
    return new Mat3().initAxisAngle(x, y, z, angle)
  }

  /**
   * Initializes this matrix to a rotation matrix defined by given axis and angle.
   *
   * @param x - x component of the normalized rotation axis
   * @param y - y component of the normalized rotation axis
   * @param z - z component of the normalized rotation axis
   * @param angle - rotation angle in rad
   */
  public initAxisAngle(x: number, y: number, z: number, angle: number): this {
    // create quaternion
    const halfAngle = angle * 0.5
    const scale = Math.sin(halfAngle)
    x *= scale
    y *= scale
    z *= scale
    const w = Math.cos(halfAngle)

    // matrix from quaternion
    const xx = x * x
    const xy = x * y
    const xz = z * x
    const xw = x * w

    const yy = y * y
    const yz = y * z
    const yw = y * w

    const zz = z * z
    const zw = z * w

    const m = this.m
    m[M._00] = 1 - 2 * (yy + zz)
    m[M._01] =     2 * (xy + zw)
    m[M._02] =     2 * (xz - yw)

    m[M._10] =     2 * (xy - zw)
    m[M._11] = 1 - 2 * (zz + xx)
    m[M._12] =     2 * (yz + xw)

    m[M._20] =     2 * (xz + yw)
    m[M._21] =     2 * (yz - xw)
    m[M._22] = 1 - 2 * (yy + xx)

    return this
  }

  /**
   * Applies a rotation around the given axis and angle
   *
   * @remarks
   * This affects only the 3x3 rotation part of the matrix.
   * Meaning that the matrix changes its facing direction
   * but keeps its position and shearing as is.
   *
   * @param x - x component of the normalized rotation axis
   * @param y - y component of the normalized rotation axis
   * @param z - z component of the normalized rotation axis
   * @param angle - rotation angle in rad
   */
  public rotateAxisAngle(x: number, y: number, z: number, angle: number): this {
    // create quaternion
    const halfAngle = angle * 0.5
    const scale = Math.sin(halfAngle)
    x *= scale
    y *= scale
    z *= scale
    const w = Math.cos(halfAngle)

    // matrix from quaternion
    const xx = x * x
    const yy = y * y
    const zz = z * z
    const xy = x * y
    const zw = z * w
    const zx = z * x
    const yw = y * w
    const yz = y * z
    const xw = x * w

    const r00 = 1 - 2 * (yy + zz)
    const r01 = 2 * (xy + zw)
    const r02 = 2 * (zx - yw)

    const r10 = 2 * (xy - zw)
    const r11 = 1 - 2 * (zz + xx)
    const r12 = 2 * (yz + xw)

    const r20 = 2 * (zx + yw)
    const r21 = 2 * (yz - xw)
    const r22 = 1 - 2 * (yy + xx)

    const m = this.m
    const m00 = m[M._00]
    const m01 = m[M._01]
    const m02 = m[M._02]
    const m10 = m[M._10]
    const m11 = m[M._11]
    const m12 = m[M._12]
    const m20 = m[M._20]
    const m21 = m[M._21]
    const m22 = m[M._22]

    m[M._00] = r00 * m00 + r01 * m10 + r02 * m20
    m[M._01] = r00 * m01 + r01 * m11 + r02 * m21
    m[M._02] = r00 * m02 + r01 * m12 + r02 * m22
    m[M._10] = r10 * m00 + r11 * m10 + r12 * m20
    m[M._11] = r10 * m01 + r11 * m11 + r12 * m21
    m[M._12] = r10 * m02 + r11 * m12 + r12 * m22
    m[M._20] = r20 * m00 + r21 * m10 + r22 * m20
    m[M._21] = r20 * m01 + r21 * m11 + r22 * m21
    m[M._22] = r20 * m02 + r21 * m12 + r22 * m22

    return this
  }

  /**
   * Creates a rotation matrix from yaw pitch roll angles
   *
   * @param yaw - angle in rad around the Y axis
   * @param pitch - angle in rad around the X axis
   * @param roll - angle in rad around the Z axis
   */
  public static createYawPitchRoll(yaw: number, pitch: number, roll: number): Mat3 {
    return new Mat3().initYawPitchRoll(yaw, pitch, roll)
  }

  /**
   * Initializes this to a rotation matrix from yaw pitch roll angles
   *
   * @param yaw - angle in rad around the Y axis
   * @param pitch - angle in rad around the X axis
   * @param roll - angle in rad around the Z axis
   */
  public initYawPitchRoll(yaw: number, pitch: number, roll: number): this {
    // create quaternion
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

    // matrix from quaternion
    const xx = x * x
    const xy = x * y
    const xz = z * x
    const xw = x * w

    const yy = y * y
    const yz = y * z
    const yw = y * w

    const zz = z * z
    const zw = z * w

    const m = this.m
    m[M._00] = 1 - 2 * (yy + zz)
    m[M._01] =     2 * (xy + zw)
    m[M._02] =     2 * (xz - yw)

    m[M._10] =     2 * (xy - zw)
    m[M._11] = 1 - 2 * (zz + xx)
    m[M._12] =     2 * (yz + xw)

    m[M._20] =     2 * (xz + yw)
    m[M._21] =     2 * (yz - xw)
    m[M._22] = 1 - 2 * (yy + xx)

    return this
  }

  /**
   * Applies a yaw pitch roll rotation to this matrix
   *
   * @remarks
   * Does not affect the translation. Translation is kept as is.
   * Only the matrix orientation will change.
   *
   * @param yaw - angle in rad around the Y axis
   * @param pitch - angle in rad around the X axis
   * @param roll - angle in rad around the Z axis
   */
  public rotateYawPitchRoll(yaw: number, pitch: number, roll: number): Mat3 {
    // create quaternion
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
    return this.rotateQuaternion(x, y, z, w)
  }

  /**
   * Creates a matrix from given quaternion.
   *
   * @param q - The quaternion
   */
  public static createFromQuat(q: IVec4): Mat3 {
    return new Mat3().initFromQuaternion(q.x, q.y, q.z, q.w)
  }

  /**
   * Initializes this matrix from given quaternion.
   *
   * @param q - The quaternion
   */
  public initFromQuat(q: IVec4): this {
    return this.initFromQuaternion(q.x, q.y, q.z, q.w)
  }

  /**
   * Rotates this matrix by a quaternion
   *
   * @param q - The rotation quaternion
   */
  public rotateQuat(q: IVec4): this {
    return this.rotateQuaternion(q.x, q.y, q.z, q.w)
  }

  /**
   * Creates a matrix from given quaternion parameters
   *
   * @param x - x component of the quaternion
   * @param y - y component of the quaternion
   * @param z - z component of the quaternion
   * @param w - w component of the quaternion
   */
  public static createFromQuaternion(x: number, y: number, z: number, w: number): Mat3 {
    return new Mat3().initFromQuaternion(x, y, z, w)
  }

  /**
   * Initializes this matrix from given quaternion parameters
   *
   * @param x - x component of the quaternion
   * @param y - y component of the quaternion
   * @param z - z component of the quaternion
   * @param w - w component of the quaternion
   */
  public initFromQuaternion(x: number, y: number, z: number, w: number): this {
    const xx = x * x
    const xy = x * y
    const xz = x * z
    const xw = x * w

    const yy = y * y
    const yz = y * z
    const yw = y * w

    const zz = z * z
    const zw = z * w

    const m = this.m
    m[M._00] = 1 - 2 * (yy + zz)
    m[M._01] =     2 * (xy + zw)
    m[M._02] =     2 * (xz - yw)

    m[M._10] =     2 * (xy - zw)
    m[M._11] = 1 - 2 * (zz + xx)
    m[M._12] =     2 * (yz + xw)

    m[M._20] =     2 * (xz + yw)
    m[M._21] =     2 * (yz - xw)
    m[M._22] = 1 - 2 * (yy + xx)

    return this
  }

  /**
   * Rotates this matrix by a quaternion
   *
   * @remarks
   * Does not affect the translation. Translation is kept as is.
   * Only the matrix orientation will change.
   *
   * @param x - x component of the quaternion
   * @param y - y component of the quaternion
   * @param z - z component of the quaternion
   * @param w - w component of the quaternion
   */
  public rotateQuaternion(x: number, y: number, z: number, w: number): this {
    // matrix from quaternion
    const xx = x * x
    const yy = y * y
    const zz = z * z
    const xy = x * y
    const zw = z * w
    const zx = z * x
    const yw = y * w
    const yz = y * z
    const xw = x * w

    const r00 = 1 - 2 * (yy + zz)
    const r01 = 2 * (xy + zw)
    const r02 = 2 * (zx - yw)

    const r10 = 2 * (xy - zw)
    const r11 = 1 - 2 * (zz + xx)
    const r12 = 2 * (yz + xw)

    const r20 = 2 * (zx + yw)
    const r21 = 2 * (yz - xw)
    const r22 = 1 - 2 * (yy + xx)

    const m = this.m
    const m00 = m[M._00]
    const m01 = m[M._01]
    const m02 = m[M._02]
    const m10 = m[M._10]
    const m11 = m[M._11]
    const m12 = m[M._12]
    const m20 = m[M._20]
    const m21 = m[M._21]
    const m22 = m[M._22]

    m[M._00] = r00 * m00 + r01 * m10 + r02 * m20
    m[M._01] = r00 * m01 + r01 * m11 + r02 * m21
    m[M._02] = r00 * m02 + r01 * m12 + r02 * m22
    m[M._10] = r10 * m00 + r11 * m10 + r12 * m20
    m[M._11] = r10 * m01 + r11 * m11 + r12 * m21
    m[M._12] = r10 * m02 + r11 * m12 + r12 * m22
    m[M._20] = r20 * m00 + r21 * m10 + r22 * m20
    m[M._21] = r20 * m01 + r21 * m11 + r22 * m21
    m[M._22] = r20 * m02 + r21 * m12 + r22 * m22

    return this
  }

  /**
   * Creates a new rotation matrix
   */
  public static createRotationX(rad: number): Mat3 {
    return new Mat3().initRotationX(rad)
  }

  /**
   * Initializes this matrix with a rotation around the X axis.
   *
   * @param angle - angle in rad
   */
  public initRotationX(angle: number): this {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const m = this.m
    m[M._00] = 1; m[M._10] = 0;   m[M._20] = 0
    m[M._01] = 0; m[M._11] = cos; m[M._21] = -sin
    m[M._02] = 0; m[M._12] = sin; m[M._22] =  cos
    return this
  }

  /**
   * Applies a rotation around X axis to this matrix
   *
   * @remarks
   * Does not affect the translation. Translation is kept as is.
   * Only the matrix orientation will change.
   *
   * @param angle - angle in rad
   */
  public rotateX(angle: number): this {
    const m = this.m
    const m10 = m[M._10]
    const m11 = m[M._11]
    const m12 = m[M._12]
    const m20 = m[M._20]
    const m21 = m[M._21]
    const m22 = m[M._22]
    const c = Math.cos(angle)
    const s = Math.sin(angle)

    m[M._10] = c * m10 + s * m20
    m[M._11] = c * m11 + s * m21
    m[M._12] = c * m12 + s * m22
    m[M._20] = c * m20 - s * m10
    m[M._21] = c * m21 - s * m11
    m[M._22] = c * m22 - s * m12

    return this
  }

  /**
   * Creates a new rotation matrix
   */
  public static createRotationY(rad: number): Mat3 {
    return new Mat3().initRotationY(rad)
  }

  /**
   * Initializes this matrix with a rotation around the Y axis.
   *
   * @param angle - angle in rad
   */
  public initRotationY(angle: number): this {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const m = this.m
    m[M._00] = cos;  m[M._10] = 0; m[M._20] = sin
    m[M._01] = 0;    m[M._11] = 1; m[M._21] = 0
    m[M._02] = -sin; m[M._12] = 0; m[M._22] = cos
    return this
  }

  /**
   * Applies a rotation around Y axis to this matrix
   *
   * @remarks
   * Does not affect the translation. Translation is kept as is.
   * Only the matrix orientation will change.
   *
   * @param angle - angle in rad
   */
  public rotateY(angle: number): this {
    const m = this.m
    const m00 = m[M._00]
    const m01 = m[M._01]
    const m02 = m[M._02]
    const m20 = m[M._20]
    const m21 = m[M._21]
    const m22 = m[M._22]
    const c = Math.cos(angle)
    const s = Math.sin(angle)

    m[M._00] = c * m00 - s * m20
    m[M._01] = c * m01 - s * m21
    m[M._02] = c * m02 - s * m22
    m[M._20] = c * m20 + s * m00
    m[M._21] = c * m21 + s * m01
    m[M._22] = c * m22 + s * m02

    return this
  }

  /**
   * Creates a new rotation matrix
   */
  public static createRotationZ(rad: number): Mat3 {
    return new Mat3().initRotationZ(rad)
  }

  /**
   * Initializes this matrix with a rotation around the Z axis.
   *
   * @param angle - angle in rad
   */
  public initRotationZ(angle: number): this {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const m = this.m
    m[M._00] = cos; m[M._10] = -sin; m[M._20] = 0
    m[M._01] = sin; m[M._11] =  cos; m[M._21] = 0
    m[M._02] = 0;   m[M._12] = 0;    m[M._22] = 1
    return this
  }

  /**
   * Applies a rotation around Z axis to this matrix
   *
   * @remarks
   * Does not affect the translation. Translation is kept as is.
   * Only the matrix orientation will change.
   *
   * @param angle - angle in rad
   */
  public rotateZ(angle: number): this {
    const m = this.m
    const m00 = m[M._00]
    const m01 = m[M._01]
    const m02 = m[M._02]
    const m10 = m[M._10]
    const m11 = m[M._11]
    const m12 = m[M._12]
    const c = Math.cos(angle)
    const s = Math.sin(angle)

    m[M._00] = c * m00 + s * m10
    m[M._01] = c * m01 + s * m11
    m[M._02] = c * m02 + s * m12
    m[M._10] = c * m10 - s * m00
    m[M._11] = c * m11 - s * m01
    m[M._12] = c * m12 - s * m02

    return this
  }

  /**
   * Creates a new matrix with a predefined scale
   */
  public static createScale(x: number, y: number, z: number): Mat3 {
    return new Mat3().initScale(x, y, z)
  }

  /**
   * Initializes a scale matrix
   *
   * @param x - x scale factor
   * @param y - y scale factor
   * @param z - z scale factor
   */
  public initScale(x: number, y: number, z: number): this {
    const m = this.m
    m[M._00] = x; m[M._10] = 0; m[M._20] = 0
    m[M._01] = 0; m[M._11] = y; m[M._21] = 0
    m[M._02] = 0; m[M._12] = 0; m[M._22] = z
    return this
  }

  /**
   * Applies a scale to this matrix
   *
   * @param x - x scale factor
   * @param y - y scale factor
   * @param z - z scale factor
   */
  public scale(x: number, y: number, z: number): this {
    const m = this.m
    m[M._00] *= x
    m[M._01] *= x
    m[M._02] *= x
    m[M._10] *= y
    m[M._11] *= y
    m[M._12] *= y
    m[M._20] *= z
    m[M._21] *= z
    m[M._22] *= z
    return this
  }

  /**
   * Creates a new matrix with a predefined scale
   */
  public static createScaleV(vec: IVec3): Mat3 {
    return new Mat3().initScale(vec.x, vec.y, vec.z)
  }

  /**
   * Initializes a scale matrix
   *
   * @param vec - The scale vector
   */
  public initScaleV(vec: IVec3): this {
    return this.initScale(vec.x, vec.y, vec.z)
  }

  /**
   * Applies a scale to this matrix
   *
   * @param scale - the scale vector
   */
  public scaleV(scale: IVec3): this {
    const x = scale.x
    const y = scale.y
    const z = scale.z
    const m = this.m
    m[M._00] *= x
    m[M._01] *= x
    m[M._02] *= x
    m[M._10] *= y
    m[M._11] *= y
    m[M._12] *= y
    m[M._20] *= z
    m[M._21] *= z
    m[M._22] *= z
    return this
  }

  /**
   * Creates a new matrix with a predefined scale
   */
  public static createScaleUniform(scale: number): Mat3 {
    return new Mat3().initScale(scale, scale, scale)
  }

  /**
   * Initializes a scale matrix
   *
   * @param scale - The uniform scale value
   */
  public initScaleUniform(scale: number): this {
    return this.initScale(scale, scale, scale)
  }

  /**
   * Applies a uniform scale to this matrix
   *
   * @param scale - the uniform scale factor
   */
  public scaleUniform(scale: number): this {
    const m = this.m
    m[0] *= scale
    m[1] *= scale
    m[2] *= scale
    m[3] *= scale
    m[4] *= scale
    m[5] *= scale
    m[6] *= scale
    m[7] *= scale
    m[8] *= scale
    m[9] *= scale
    m[10] *= scale
    m[11] *= scale
    return this
  }

  /**
   * Applies a scale to this matrix
   *
   * @param x - scale factor on x axis
   */
  public scaleX(x: number): this {
    const m = this.m
    m[M._00] *= x
    m[M._01] *= x
    m[M._02] *= x
    return this
  }

  /**
   * Applies a scale to this matrix
   *
   * @param y - scale factor on y axis
   */
  public scaleY(y: number): this {
    const m = this.m
    m[M._10] *= y
    m[M._11] *= y
    m[M._12] *= y
    return this
  }

  /**
   * Applies a scale to this matrix
   *
   * @param z - scale factor on z axis
   */
  public scaleZ(z: number): this {
    const m = this.m
    m[M._20] *= z
    m[M._21] *= z
    m[M._22] *= z
    return this
  }

  /**
   * Creates a rotation matrix by using direction vector
   */
  public static createOrientation(forward: IVec3, up: IVec3): Mat3 {
    return new Mat3().initOrientation(forward, up)
  }

  /**
   * Initializes a rotation matrix by using direction vector
   *
   * @param forward - The forward vector
   * @param up - The up vector of the viewer
   */
  public initOrientation(forward: IVec3, up: IVec3): Mat3 {
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

    return this.initRowMajor(
      rightX, x, backX,
      rightY, y, backY,
      rightZ, z, backZ,
    )
  }

  /**
   * Calculates the determinant of this matrix
   */
  public determinant(): number {
    const a = this.m

    const a11 = a[0]
    const a12 = a[3]
    const a13 = a[6]

    const a21 = a[1]
    const a22 = a[4]
    const a23 = a[7]

    const a31 = a[2]
    const a32 = a[5]
    const a33 = a[8]

    const d1 = a22 * a33 - a32 * a23
    const d2 = a21 * a33 - a31 * a23
    const d3 = a21 * a32 - a31 * a22

    return a11 * d1 - a12 * d2 + a13 * d3
  }

  /**
   * Transpose the given matrix
   * @param mat - The matrix to transpose
   * @param out - The matrix to write to
   * @returns The given `out` parameter or a new matrix
   */
  public static transpose(mat: Mat3, out?: Mat3): Mat3 {
    const d = mat.m
    return (out || new Mat3()).init(
      d[0], d[3], d[6],
      d[1], d[4], d[7],
      d[2], d[5], d[8],
    )
  }

  /**
   * Transposes this matrix
   * @returns Reference to `this` for chaining.
   */
  public transpose(): Mat3 {
    const m = this.m
    let t

    t = m[M._01]
    m[M._01] = m[M._10]
    m[M._10] = t

    t = m[M._02]
    m[M._02] = m[M._20]
    m[M._20] = t

    t = m[M._12]
    m[M._12] = m[M._21]
    m[M._21] = t

    return this
  }

  /**
   * Invert the given matrix
   * @param mat - The matrix to transpose
   * @param out - The matrix to write to
   * @returns The given `out` parameter or a new matrix
   */
  public static invert(mat: Mat3, out?: Mat3): Mat3 {
    out = out || new Mat3()
    const a = mat.m
    const b = out.m

    const a11 = a[0]
    const a12 = a[3]
    const a13 = a[6]

    const a21 = a[1]
    const a22 = a[4]
    const a23 = a[7]

    const a31 = a[2]
    const a32 = a[5]
    const a33 = a[8]

    const d1 = a22 * a33 - a32 * a23
    const d2 = a21 * a33 - a31 * a23
    const d3 = a21 * a32 - a31 * a22

    const detInv = 1 / (a11 * d1 - a12 * d2 + a13 * d3)

    b[0] = detInv * d1
    b[1] = -detInv * d2
    b[2] = detInv * d3
    b[3] = detInv * (a13 * a32 - a12 * a33)
    b[4] = detInv * (a11 * a33 - a13 * a31)
    b[5] = detInv * (a12 * a31 - a11 * a32)
    b[6] = detInv * (a12 * a23 - a13 * a22)
    b[7] = detInv * (a13 * a21 - a11 * a23)
    b[8] = detInv * (a11 * a22 - a12 * a21)

    return out
  }

  /**
   * Inverts this matrix
   * @returns Reference to `this` for chaining.
   */
  public invert(): Mat3 {
    const a = this.m
    const b = this.m

    const a11 = a[0]
    const a12 = a[3]
    const a13 = a[6]

    const a21 = a[1]
    const a22 = a[4]
    const a23 = a[7]

    const a31 = a[2]
    const a32 = a[5]
    const a33 = a[8]

    const d1 = a22 * a33 - a32 * a23
    const d2 = a21 * a33 - a31 * a23
    const d3 = a21 * a32 - a31 * a22

    const detInv = 1 / (a11 * d1 - a12 * d2 + a13 * d3)

    b[0] = detInv * d1
    b[1] = -detInv * d2
    b[2] = detInv * d3
    b[3] = detInv * (a13 * a32 - a12 * a33)
    b[4] = detInv * (a11 * a33 - a13 * a31)
    b[5] = detInv * (a12 * a31 - a11 * a32)
    b[6] = detInv * (a12 * a23 - a13 * a22)
    b[7] = detInv * (a13 * a21 - a11 * a23)
    b[8] = detInv * (a11 * a22 - a12 * a21)

    return this
  }

  /**
   * Negate the components of the given matrix
   * @param mat - The matrix to transpose
   * @param out - The matrix to write to
   * @returns The given `out` parameter or a new matrix
   */
  public static negate(mat: Mat3, out?: Mat3): Mat3 {
    out = out || new Mat3()
    const d = mat.m
    const o = out.m
    // tslint:disable
    o[ 0] = -d[ 0]; o[ 1] = -d[ 1]; o[ 2] = -d[ 2];
    o[ 3] = -d[ 3]; o[ 4] = -d[ 4]; o[ 5] = -d[ 5];
    o[ 6] = -d[ 6]; o[ 7] = -d[ 7]; o[ 8] = -d[ 8];
    // tslint:enable
    return out
  }

  /**
   * Negates all components of this matrix
   * @returns Reference to `this` for chaining.
   */
  public negate(): Mat3 {
    const a = this.m
    const b = this.m
    // tslint:disable
    a[ 0] = -b[ 0]; a[ 1] = -b[ 1]; a[ 2] = -b[ 2];
    a[ 3] = -b[ 3]; a[ 4] = -b[ 4]; a[ 5] = -b[ 5];
    a[ 6] = -b[ 6]; a[ 7] = -b[ 7]; a[ 8] = -b[ 8];
    // tslint:enable
    return this
  }

  /**
   * Adds a matrix to another
   * @param matA - The first matrix
   * @param matB - The second matrix
   * @param out - The matrix to write to
   * @returns The given `out` parameter or a new matrix
   */
  public static add(matA: Mat3, matB: Mat3, out?: Mat3): Mat3 {
    out = out || new Mat3()
    const a = matA.m
    const b = matB.m
    const c = out.m
    // tslint:disable
    c[ 0] = a[ 0] + b[ 0]; c[ 1] = a[ 1] + b[ 1]; c[ 2] = a[ 2] + b[ 2];
    c[ 3] = a[ 3] + b[ 3]; c[ 4] = a[ 4] + b[ 4]; c[ 5] = a[ 5] + b[ 5];
    c[ 6] = a[ 6] + b[ 6]; c[ 7] = a[ 7] + b[ 7]; c[ 8] = a[ 8] + b[ 8];
    // tslint:enable
    return out
  }

  /**
   * Adds the given matrix to `this`
   * @param other - The matrix to add
   * @returns Reference to `this` for chaining.
   */
  public add(other: Mat3): Mat3 {
    const a = this.m
    const b = other.m
    // tslint:disable
    a[ 0] += b[ 0]; a[ 1] += b[ 1]; a[ 2] += b[ 2];
    a[ 3] += b[ 3]; a[ 4] += b[ 4]; a[ 5] += b[ 5];
    a[ 6] += b[ 6]; a[ 7] += b[ 7]; a[ 8] += b[ 8];
    // tslint:enable
    return this
  }

  /**
   * Adds a scalar to each component of a matrix
   * @param mat - The matrix
   * @param scalar - The scalar to add
   * @param out - The matrix to write to
   * @returns The given `out` parameter or a new matrix
   */
  public static addScalar(mat: Mat3, scalar: number, out?: Mat3): Mat3 {
    out = out || new Mat3()
    const a = mat.m
    const c = out.m
    // tslint:disable
    c[ 0] = a[ 0] + scalar; c[ 1] = a[ 1] + scalar; c[ 2] = a[ 2] + scalar;
    c[ 3] = a[ 3] + scalar; c[ 4] = a[ 4] + scalar; c[ 5] = a[ 5] + scalar;
    c[ 6] = a[ 6] + scalar; c[ 7] = a[ 7] + scalar; c[ 8] = a[ 8] + scalar;
    // tslint:enable
    return out
  }

  /**
   * Adds the given scalar to each component of `this`
   * @param scalar - The scalar to add
   * @returns Reference to `this` for chaining.
   */
  public addScalar(s: number): Mat3 {
    const a = this.m
    // tslint:disable
    a[ 0] += s; a[ 1] += s; a[ 2] += s;
    a[ 3] += s; a[ 4] += s; a[ 5] += s;
    a[ 6] += s; a[ 7] += s; a[ 8] += s;
    // tslint:enable
    return this
  }

  /**
   * Subtracts the second matrix from the first
   * @param matA - The first matrix
   * @param matB - The second matrix
   * @param out - The matrix to write to
   * @returns The given `out` parameter or a new matrix
   */
  public static subtract(matA: Mat3, matB: Mat3, out?: Mat3): Mat3 {
    out = out || new Mat3()
    const a = matA.m
    const b = matB.m
    const c = out.m
    // tslint:disable
    c[ 0] = a[ 0] - b[ 0]; c[ 1] = a[ 1] - b[ 1]; c[ 2] = a[ 2] - b[ 2];
    c[ 3] = a[ 3] - b[ 3]; c[ 4] = a[ 4] - b[ 4]; c[ 5] = a[ 5] - b[ 5];
    c[ 6] = a[ 6] - b[ 6]; c[ 7] = a[ 7] - b[ 7]; c[ 8] = a[ 8] - b[ 8];
    // tslint:enable
    return out
  }

  /**
   * Subtracts the given matrix from `this`
   * @param other - The matrix to subtract
   * @returns Reference to `this` for chaining.
   */
  public subtract(other: Mat3): Mat3 {
    const a = this.m
    const b = other.m
    // tslint:disable
    a[ 0] -= b[ 0]; a[ 1] -= b[ 1]; a[ 2] -= b[ 2];
    a[ 3] -= b[ 3]; a[ 4] -= b[ 4]; a[ 5] -= b[ 5];
    a[ 6] -= b[ 6]; a[ 7] -= b[ 7]; a[ 8] -= b[ 8];
    // tslint:enable
    return this
  }

  /**
   * Subtracts a scalar from each component of a matrix
   * @param mat - The matrix to subtract from
   * @param scalar - The scalar to subtract
   * @param out - The matrix to write to
   * @returns The given `out` parameter or a new matrix
   */
  public static subtractScalar(mat: Mat3, scalar: number, out?: Mat3): Mat3 {
    out = out || new Mat3()
    const a = mat.m
    const c = out.m
    // tslint:disable
    c[ 0] = a[ 0] - scalar; c[ 1] = a[ 1] - scalar; c[ 2] = a[ 2] - scalar;
    c[ 3] = a[ 3] - scalar; c[ 4] = a[ 4] - scalar; c[ 5] = a[ 5] - scalar;
    c[ 6] = a[ 6] - scalar; c[ 7] = a[ 7] - scalar; c[ 8] = a[ 8] - scalar;
    // tslint:enable
    return out
  }

  /**
   * Subtracts the given scalar from each component of `this`
   * @param scalar - The scalar to subtract
   * @returns Reference to `this` for chaining.
   */
  public subtractScalar(s: number): Mat3 {
    const a = this.m
    // tslint:disable
    a[ 0] -= s; a[ 1] -= s; a[ 2] -= s;
    a[ 3] -= s; a[ 4] -= s; a[ 5] -= s;
    a[ 6] -= s; a[ 7] -= s; a[ 8] -= s;
    // tslint:enable
    return this
  }

  /**
   * Performs a matrix multiplication `matA * matB` meaning `matB` is post-multiplied on `matA`.
   *
   * @param matA - The main matrix
   * @param matB - The matrix to post-multiply
   * @param out - The matrix to write to
   *
   * @returns The given `out` parameter or a new matrix
   */
  public static multiply(matA: Mat3, matB: Mat3, out?: Mat3): Mat3 {
    out = out || new Mat3()
    const a = matA.m
    const b = matB.m
    const c = out.m
    // tslint:disable
    const a_0 = a[ 0], a_1 = a[ 1], a_2 = a[ 2],
          a_3 = a[ 3], a_4 = a[ 4], a_5 = a[ 5],
          a_6 = a[ 6], a_7 = a[ 7], a_8 = a[ 8];
    const b_0 = b[ 0], b_1 = b[ 1], b_2 = b[ 2],
          b_3 = b[ 3], b_4 = b[ 4], b_5 = b[ 5],
          b_6 = b[ 6], b_7 = b[ 7], b_8 = b[ 8];
    // tslint:enable
    c[0] = b_0 * a_0 + b_1 * a_3 + b_2 * a_6
    c[1] = b_0 * a_1 + b_1 * a_4 + b_2 * a_7
    c[2] = b_0 * a_2 + b_1 * a_5 + b_2 * a_8
    c[3] = b_3 * a_0 + b_4 * a_3 + b_5 * a_6
    c[4] = b_3 * a_1 + b_4 * a_4 + b_5 * a_7
    c[5] = b_3 * a_2 + b_4 * a_5 + b_5 * a_8
    c[6] = b_6 * a_0 + b_7 * a_3 + b_8 * a_6
    c[7] = b_6 * a_1 + b_7 * a_4 + b_8 * a_7
    c[8] = b_6 * a_2 + b_7 * a_5 + b_8 * a_8
    return out
  }

  /**
   * Performs a matrix multiplication `this = this * other` meaning `other` is post-multiplied t `this`.
   *
   * @param other - The matrix to post-multiply
   */
  public multiply(other: Mat3): Mat3 {
    const a = this.m
    const b = other.m
    const c = this.m
    // tslint:disable
    const a_0 = a[ 0], a_1 = a[ 1], a_2 = a[ 2],
          a_3 = a[ 3], a_4 = a[ 4], a_5 = a[ 5],
          a_6 = a[ 6], a_7 = a[ 7], a_8 = a[ 8];
    const b_0 = b[ 0], b_1 = b[ 1], b_2 = b[ 2],
          b_3 = b[ 3], b_4 = b[ 4], b_5 = b[ 5],
          b_6 = b[ 6], b_7 = b[ 7], b_8 = b[ 8];
    // tslint:enable
    c[0] = b_0 * a_0 + b_1 * a_3 + b_2 * a_6
    c[1] = b_0 * a_1 + b_1 * a_4 + b_2 * a_7
    c[2] = b_0 * a_2 + b_1 * a_5 + b_2 * a_8
    c[3] = b_3 * a_0 + b_4 * a_3 + b_5 * a_6
    c[4] = b_3 * a_1 + b_4 * a_4 + b_5 * a_7
    c[5] = b_3 * a_2 + b_4 * a_5 + b_5 * a_8
    c[6] = b_6 * a_0 + b_7 * a_3 + b_8 * a_6
    c[7] = b_6 * a_1 + b_7 * a_4 + b_8 * a_7
    c[8] = b_6 * a_2 + b_7 * a_5 + b_8 * a_8
    return this
  }

  /**
   * Performs a matrix multiplication `matB * matA` meaning `matB` is pre-multiplied on `matA`.
   *
   * @param matA - The main matrix
   * @param matB - The matrix to pre-multiply
   * @param out - The matrix to write to
   *
   * @returns The given `out` parameter or a new matrix
   */
  public static premultiply(matA: Mat3, matB: Mat3, out?: Mat3): Mat3 {
    out = out || new Mat3()
    const a = matB.m
    const b = matA.m
    const c = out.m
    // tslint:disable
    const a_0 = a[ 0], a_1 = a[ 1], a_2 = a[ 2],
          a_3 = a[ 3], a_4 = a[ 4], a_5 = a[ 5],
          a_6 = a[ 6], a_7 = a[ 7], a_8 = a[ 8];
    const b_0 = b[ 0], b_1 = b[ 1], b_2 = b[ 2],
          b_3 = b[ 3], b_4 = b[ 4], b_5 = b[ 5],
          b_6 = b[ 6], b_7 = b[ 7], b_8 = b[ 8];
    // tslint:enable
    c[0] = b_0 * a_0 + b_1 * a_3 + b_2 * a_6
    c[1] = b_0 * a_1 + b_1 * a_4 + b_2 * a_7
    c[2] = b_0 * a_2 + b_1 * a_5 + b_2 * a_8
    c[3] = b_3 * a_0 + b_4 * a_3 + b_5 * a_6
    c[4] = b_3 * a_1 + b_4 * a_4 + b_5 * a_7
    c[5] = b_3 * a_2 + b_4 * a_5 + b_5 * a_8
    c[6] = b_6 * a_0 + b_7 * a_3 + b_8 * a_6
    c[7] = b_6 * a_1 + b_7 * a_4 + b_8 * a_7
    c[8] = b_6 * a_2 + b_7 * a_5 + b_8 * a_8
    return out
  }

  // /**
  //  * Multiplies a chain of matrices
  //  * @returns The result of the multiplication
  //  */
  // public static concatChain(...rest: Mat3[]): Mat3 {
  //   // (a, (b, (c, (d, e))))
  //   const result = arguments[arguments.length - 1].clone()
  //   for (let i = arguments.length - 2; i >= 0; i--) {
  //     Mat3.concat(arguments[i], result, result)
  //   }
  //   return result
  // }

  // /**
  //  * Multiplies a chain of matrices
  //  * @returns The result of the multiplication
  //  */
  // public static multiplyChain(...rest: Mat3[]): Mat3 {
  //   // ((((a, b), c), d), e)
  //   const result = arguments[0].clone()
  //   for (let i = 1; i < arguments.length; i += 1) {
  //     Mat3.multiply(result, arguments[i], result)
  //   }
  //   return result
  // }

  /**
   * Performs a matrix multiplication `this = other * this` meaning `other` is pre-multiplied on `this`.
   *
   * @param other - The matrix to pre-multiply
   */
  public premultiply(other: Mat3): Mat3 {
    const a = other.m
    const b = this.m
    const c = this.m
    // tslint:disable
    const a_0 = a[ 0], a_1 = a[ 1], a_2 = a[ 2],
          a_3 = a[ 3], a_4 = a[ 4], a_5 = a[ 5],
          a_6 = a[ 6], a_7 = a[ 7], a_8 = a[ 8];
    const b_0 = b[ 0], b_1 = b[ 1], b_2 = b[ 2],
          b_3 = b[ 3], b_4 = b[ 4], b_5 = b[ 5],
          b_6 = b[ 6], b_7 = b[ 7], b_8 = b[ 8];
    // tslint:enable
    c[0] = b_0 * a_0 + b_1 * a_3 + b_2 * a_6
    c[1] = b_0 * a_1 + b_1 * a_4 + b_2 * a_7
    c[2] = b_0 * a_2 + b_1 * a_5 + b_2 * a_8
    c[3] = b_3 * a_0 + b_4 * a_3 + b_5 * a_6
    c[4] = b_3 * a_1 + b_4 * a_4 + b_5 * a_7
    c[5] = b_3 * a_2 + b_4 * a_5 + b_5 * a_8
    c[6] = b_6 * a_0 + b_7 * a_3 + b_8 * a_6
    c[7] = b_6 * a_1 + b_7 * a_4 + b_8 * a_7
    c[8] = b_6 * a_2 + b_7 * a_5 + b_8 * a_8
    return this
  }

  /**
   * Multiplies a matrix with a scalar value
   * @param matA - The matrix
   * @param scalar - The scalar to multiply
   * @param out - The matrix to write to
   * @returns The given `out` parameter or a new matrix
   */
  public static multiplyScalar(matA: Mat3, scalar: number, out?: Mat3): Mat3 {
    out = out || new Mat3()
    const a = matA.m
    const b = scalar
    const c = out.m
    // tslint:disable
    c[ 0] = a[ 0] * b; c[ 1] = a[ 1] * b; c[ 2] = a[ 2] * b;
    c[ 3] = a[ 3] * b; c[ 4] = a[ 4] * b; c[ 5] = a[ 5] * b;
    c[ 6] = a[ 6] * b; c[ 7] = a[ 7] * b; c[ 8] = a[ 8] * b;
    // tslint:enable
    return out
  }

  /**
   * Multiplies each component of `this` with given scalar
   * @param scalar - The scalar to multiply
   * @returns Reference to `this` for chaining.
   */
  public multiplyScalar(s: number): Mat3 {
    const a = this.m
    // tslint:disable
    a[ 0] *= s; a[ 1] *= s; a[ 2] *= s;
    a[ 3] *= s; a[ 4] *= s; a[ 5] *= s;
    a[ 6] *= s; a[ 7] *= s; a[ 8] *= s;
    // tslint:enable
    return this
  }

  /**
   * Divides the components of the first matrix by the components of the second matrix
   * @param matA - The first matrix
   * @param matB - The second matrix
   * @param out - The matrix to write to
   * @returns The given `out` parameter or a new matrix
   */
  public static divide(matA: Mat3, matB: Mat3, out?: Mat3): Mat3 {
    out = out || new Mat3()
    const a = matA.m
    const b = matB.m
    const c = out.m
    // tslint:disable
    c[ 0] = a[ 0] / b[ 0]; c[ 1] = a[ 1] / b[ 1]; c[ 2] = a[ 2] / b[ 2];
    c[ 3] = a[ 3] / b[ 3]; c[ 4] = a[ 4] / b[ 4]; c[ 5] = a[ 5] / b[ 5];
    c[ 6] = a[ 6] / b[ 6]; c[ 7] = a[ 7] / b[ 7]; c[ 8] = a[ 8] / b[ 8];
    // tslint:enable
    return out
  }

  /**
   * Divides each matching component pair
   * @param other - The matrix by which to divide
   * @returns Reference to `this` for chaining.
   */
  public divide(other: Mat3): Mat3 {
    const a = this.m
    const b = other.m
    // tslint:disable
    a[ 0] /= b[ 0]; a[ 1] /= b[ 1]; a[ 2] /= b[ 2];
    a[ 3] /= b[ 3]; a[ 4] /= b[ 4]; a[ 5] /= b[ 5];
    a[ 6] /= b[ 6]; a[ 7] /= b[ 7]; a[ 8] /= b[ 8];
    // tslint:enable
    return this
  }

  /**
   * Divides the components of a matrix by a scalar
   * @param matA - The matrix
   * @param scalar - The scalar by which to divide
   * @param out - The matrix to write to
   * @returns The given `out` parameter or a new matrix
   */
  public static divideScalar(matA: Mat3, scalar: number, out?: Mat3): Mat3 {
    out = out || new Mat3()
    const a = matA.m
    const b = 1 / scalar
    const c = out.m
    // tslint:disable
    c[ 0] = a[ 0] * b; c[ 1] = a[ 1] * b; c[ 2] = a[ 2] * b;
    c[ 3] = a[ 3] * b; c[ 4] = a[ 4] * b; c[ 5] = a[ 5] * b;
    c[ 6] = a[ 6] * b; c[ 7] = a[ 7] * b; c[ 8] = a[ 8] * b;
    // tslint:enable
    return out
  }

  /**
   * Divides each component of `this` by given scalar
   * @param scalar - The scalar by which to divide
   * @returns Reference to `this` for chaining.
   */
  public divideScalar(s: number): Mat3 {
    const a = this.m
    const b = 1.0 / s
    // tslint:disable
    a[ 0] *= b; a[ 1] *= b; a[ 2] *= b;
    a[ 3] *= b; a[ 4] *= b; a[ 5] *= b;
    a[ 6] *= b; a[ 7] *= b; a[ 8] *= b;
    // tslint:enable
    return this
  }

  /**
   * Transform the given vector with this matrix.
   *
   * @returns the given vector
   */
  public transform<T extends IVec2|IVec3>(vec: T): T {
    const x = vec.x || 0
    const y = vec.y || 0
    const z = (vec as IVec3).z || 0
    const d = this.m
    vec.x = x * d[0] + y * d[3] + z * d[6]
    vec.y = x * d[1] + y * d[4] + z * d[7]
    if ((vec as IVec3).z != null) {
      (vec as IVec3).z = x * d[2] + y * d[5] + z * d[8]
    }
    return vec
  }

  /**
   * Transforms the given array with `this` matrix.
   *
   */
  public transformV2Array(array: ArrayLike<number>, offset?: number, stride?: number, count?: number) {
    let x
    let y
    const d = this.m
    offset = offset || 0
    stride = stride == null ? 2 : stride
    count = count == null ? array.length / stride : count

    while (count > 0) {
      count--
      x = array[offset]
      y = array[offset + 1]
      array[offset    ] = x * d[0] + y * d[3] + d[6]
      array[offset + 1] = x * d[1] + y * d[4] + d[7]
      offset += stride
    }
  }

  /**
   * Transforms the given array with `this` matrix.
   *
   *
   *
   *
   */
  public transformV3Array(array: ArrayLike<number>, offset?: number, stride?: number, count?: number) {
    let x
    let y
    let z
    const d = this.m
    offset = offset || 0
    stride = stride == null ? 3 : stride
    count = count == null ? array.length / stride : count

    while (count > 0) {
      count--
      x = array[offset]
      y = array[offset + 1]
      z = array[offset + 2]
      array[offset    ] = x * d[0] + y * d[3] + z * d[6]
      array[offset + 1] = x * d[1] + y * d[4] + z * d[7]
      array[offset + 2] = x * d[2] + y * d[5] + z * d[8]
      offset += stride
    }
  }

  /**
   * Performs a linear interpolation between two matrices
   * @param matA - The first matrix
   * @param matB - The second matrix
   * @param t - The interpolation value. This is assumed to be in [0:1] range
   * @param out - The matrix to write to
   * @returns The given `out` parameter or a new matrix
   */
  public static lerp(matA: Mat3, matB: Mat3, t: number, out?: Mat3): Mat3 {
    out = out || new Mat3()
    const a = matA.m
    const b = matB.m
    const c = out.m
    c[0] = a[0] + (b[0] - a[0]) * t
    c[1] = a[1] + (b[1] - a[1]) * t
    c[2] = a[2] + (b[2] - a[2]) * t
    c[3] = a[3] + (b[3] - a[3]) * t
    c[4] = a[4] + (b[4] - a[4]) * t
    c[5] = a[5] + (b[5] - a[5]) * t
    c[6] = a[6] + (b[6] - a[6]) * t
    c[7] = a[7] + (b[7] - a[7]) * t
    c[8] = a[8] + (b[8] - a[8]) * t
    return out
  }

  /**
   * Performs a component wise smooth interpolation between the given two elements.
   *
   * @param a - The first matrix.
   * @param b - The second matrix.
   * @param t - The interpolation value. Assumed to be in range [0:1].
   * @param out - The matrix to write to. Leave it out or pass null to create a new matrix.
   * @returns The given `out` parameter or a new matrix.
   */
  public static smooth(matA: Mat3, matB: Mat3, t: number, out?: Mat3): Mat3 {
    t = ((t > 1) ? 1 : ((t < 0) ? 0 : t))
    t = t * t * (3 - 2 * t)
    return Mat3.lerp(matA, matB, t, out)
  }

  /**
   * Creates a copy of this matrix
   * @returns The cloned matrix.
   */
  public clone(out: Mat3 = new Mat3()): Mat3 {
    const d = this.m
    const o = out.m
    o[0] = d[0]
    o[1] = d[1]
    o[2] = d[2]
    o[3] = d[3]
    o[4] = d[4]
    o[5] = d[5]
    o[6] = d[6]
    o[7] = d[7]
    o[8] = d[8]
    return out
  }

  /**
   * Creates a copy of this matrix
   * @returns The cloned matrix.
   */
  public static clone(mat: Mat3, out: Mat3 = new Mat3()): Mat3 {
    const d = mat.m
    const o = out.m
    o[0] = d[0]
    o[1] = d[1]
    o[2] = d[2]
    o[3] = d[3]
    o[4] = d[4]
    o[5] = d[5]
    o[6] = d[6]
    o[7] = d[7]
    o[8] = d[8]
    return out
  }

  /**
   * Checks for component wise equality with given matrix
   *
   * @param other - The matrix to compare with
   */
  public equals(other: Mat3): boolean {
    const a = this.m
    const b = other.m
    return a[0] === b[0] &&
      a[1] === b[1] &&
      a[2] === b[2] &&
      a[3] === b[3] &&
      a[4] === b[4] &&
      a[5] === b[5] &&
      a[6] === b[6] &&
      a[7] === b[7] &&
      a[8] === b[8]
  }

  /**
   * Checks for component wise equality with given matrix
   *
   * @param other - The matrix to compare with
   */
  public static equals(m1: Mat3, m2: Mat3): boolean {
    const a = m1.m
    const b = m2.m
    return a[0] === b[0] &&
      a[1] === b[1] &&
      a[2] === b[2] &&
      a[3] === b[3] &&
      a[4] === b[4] &&
      a[5] === b[5] &&
      a[6] === b[6] &&
      a[7] === b[7] &&
      a[8] === b[8]
  }

  /**
   * Formats this into a readable string
   *
   * @remarks
   * Mainly meant for debugging. Do not use this for serialization.
   *
   * @param fractionDigits - Number of digits after decimal point
   */
  public format(fractionDigits: number = 5) {
    return Mat3.format(this, fractionDigits)
  }

  /**
   * Formats given matrix into a readable string
   *
   * @remarks
   * Mainly meant for debugging. Do not use this for serialization.
   *
   * @param mat - The matrix to format
   * @param fractionDigits - Number of digits after decimal point
   */
  public static format(mat: Mat3, fractionDigits: number = 5) {
    const m = mat.m
    return [
      [m[0].toFixed(fractionDigits), m[3].toFixed(fractionDigits), m[6].toFixed(fractionDigits)].join(','),
      [m[1].toFixed(fractionDigits), m[4].toFixed(fractionDigits), m[7].toFixed(fractionDigits)].join(','),
      [m[2].toFixed(fractionDigits), m[5].toFixed(fractionDigits), m[8].toFixed(fractionDigits)].join(','),
    ].join('\n')
  }

  /**
   * Returns a copy of this matrix as plain array
   */
  public toArray(): number[]
  /**
   * Copies this matrix into a given array starting at given offset
   *
   * @param array - The array to copy into
   * @param offset - Zero based index where to start writing in the array
   */
  public toArray<T>(array?: T, offset?: number): T
  public toArray(array?: number[], offset?: number): number[] {
    return Mat3.toArray(this, array, offset)
  }

  /**
   * Returns a copy of given matrix as plain array
   */
  public static toArray(mat: Mat3): number[]
  /**
   * Copies the given matrix into a given array starting at given offset
   *
   * @param array - The array to copy into
   * @param offset - Zero based index where to start writing in the array
   */
  public static toArray<T>(mat: Mat3, array: T, offset?: number): T
  public static toArray(mat: Mat3, array?: number[], offset?: number): number[] {
    array = array || []
    offset = offset || 0
    const d = mat.m
    array[offset] = d[0]
    array[offset + 1] = d[1]
    array[offset + 2] = d[2]
    array[offset + 3] = d[3]
    array[offset + 4] = d[4]
    array[offset + 5] = d[5]
    array[offset + 6] = d[6]
    array[offset + 7] = d[7]
    array[offset + 8] = d[8]
    return array
  }
}
