// https://www.opengl.org/archives/resources/faq/technical/transformations.htm
// http://duckmaestro.com/2013/08/17/matrices-are-not-transforms/

import { ArrayLike, IMat, IVec2, IVec3, IVec4, Mat4Data } from './Types'
import { Vec3 } from './Vec3'

const enum M {
 _00 = 0, _10 = 4, _20 = 8, _30 = 12,
 _01 = 1, _11 = 5, _21 = 9, _31 = 13,
 _02 = 2, _12 = 6, _22 = 10, _32 = 14,
 _03 = 3, _13 = 7, _23 = 11, _33 = 15,
}

/* missing function
  Decompose
  CreateReflection
  CreateShadow
  CreateBillboard
  CreateConstrainedBillboard
  */

/**
 * A 4x4 matrix using column major layout
 *
 * @public
 * @remarks
 * The matrix stores its values in a typed `Float32Array` array.
 * The elements are laid out in column major order meaning that
 * elements of each base vector reside next to each other.
 *
 * For example, having a translation matrix in standard notation
 * where `x`, `y` and `z` are elements of the translation vector
 *
 * ```txt
 * 1 0 0 x
 * 0 1 0 y
 * 0 0 1 z
 * 0 0 0 1
 * ```
 * the index layout would be
 * ```txt
 * 0 4 8  12
 * 1 5 9  13
 * 2 6 10 14
 * 3 7 11 15
 * ```
 */
export class Mat4 {

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
   * Gets and sets value at column 0 row 3
   */
  public get m03() {
    return this.m[M._03]
  }
  public set m03(v: number) {
    this.m[M._03] = v
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
   * Gets and sets value at column 1 row 3
   */
  public get m13() {
    return this.m[M._13]
  }
  public set m13(v: number) {
    this.m[M._13] = v
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
   * Gets and sets value at column 2 row 3
   */
  public get m23() {
    return this.m[M._23]
  }
  public set m23(v: number) {
    this.m[M._23] = v
  }

  /**
   * Gets and sets value at column 3 row 0
   */
  public get m30() {
    return this.m[M._30]
  }
  public set m30(v: number) {
    this.m[M._30] = v
  }

  /**
   * Gets and sets value at column 3 row 1
   */
  public get m31() {
    return this.m[M._31]
  }
  public set m31(v: number) {
    this.m[M._31] = v
  }

  /**
   * Gets and sets value at column 3 row 2
   */
  public get m32() {
    return this.m[M._32]
  }
  public set m32(v: number) {
    this.m[M._32] = v
  }

  /**
   * Gets and sets value at column 3 row 3
   */
  public get m33() {
    return this.m[M._33]
  }
  public set m33(v: number) {
    this.m[M._33] = v
  }

  /**
   * Constructs a new instance of {@link Mat4}
   *
   * @param m - the data to initialize with
   */
  constructor(m?: Mat4Data) {
    if (Array.isArray(m)) {
      this.m = new Float32Array(m)
    } else {
      this.m = m || new Float32Array(16)
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
  public setScale(vec: IVec3): this {
    this.m[M._00] = vec.x
    this.m[M._11] = vec.y
    this.m[M._22] = vec.z
    return this
  }

  /**
   * Gets the translation direction as a new vector
   */
  public getTranslation(): Vec3
  /**
   * Gets the translation direction into an existing vector
   */
  public getTranslation<T>(out?: T): T & IVec3
  public getTranslation(out?: Vec3): Vec3 {
    out = out || new Vec3()
    out.x = this.m[M._30]
    out.y = this.m[M._31]
    out.z = this.m[M._32]
    return out
  }

  /**
   * Sets the translation part
   */
  public setTranslation(x: number, y: number, z: number): this {
    this.m[M._30] = x
    this.m[M._31] = y
    this.m[M._32] = z
    return this
  }

  /**
   * Sets the translation part from vector
   */
  public setTranslationV(vec: IVec3): this {
    this.m[M._30] = vec.x
    this.m[M._31] = vec.y
    this.m[M._32] = vec.z
    return this
  }

  /**
   * Sets the x component of the translation part
   */
  public setTranslationX(value: number): this {
    this.m[M._30] = value
    return this
  }

  /**
   * Sets the y component of the translation part
   */
  public setTranslationY(value: number): this {
    this.m[M._31] = value
    return this
  }

  /**
   * Sets the z component of the translation part
   */
  public setTranslationZ(value: number): this {
    this.m[M._32] = value
    return this
  }

  /**
   * Creates a matrix by reading the arguments in column major order
   */
  public static create(
    m00: number, m01: number, m02: number, m03: number,
    m10: number, m11: number, m12: number, m13: number,
    m20: number, m21: number, m22: number, m23: number,
    m30: number, m31: number, m32: number, m33: number,
  ): Mat4 {
    const out = new Mat4()
    const m = out.m
    m[M._00] = m00
    m[M._01] = m01
    m[M._02] = m02
    m[M._03] = m03

    m[M._10] = m10
    m[M._11] = m11
    m[M._12] = m12
    m[M._13] = m13

    m[M._20] = m20
    m[M._21] = m21
    m[M._22] = m22
    m[M._23] = m23

    m[M._30] = m30
    m[M._31] = m31
    m[M._32] = m32
    m[M._33] = m33
    return out
  }

  /**
   * Initializes the matrix by reading the arguments in column major order
   */
  public init(
    m00: number, m01: number, m02: number, m03: number,
    m10: number, m11: number, m12: number, m13: number,
    m20: number, m21: number, m22: number, m23: number,
    m30: number, m31: number, m32: number, m33: number,
  ): this {
    const m = this.m
    m[M._00] = m00
    m[M._01] = m01
    m[M._02] = m02
    m[M._03] = m03

    m[M._10] = m10
    m[M._11] = m11
    m[M._12] = m12
    m[M._13] = m13

    m[M._20] = m20
    m[M._21] = m21
    m[M._22] = m22
    m[M._23] = m23

    m[M._30] = m30
    m[M._31] = m31
    m[M._32] = m32
    m[M._33] = m33
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
    m00: number, m10: number, m20: number, m30: number,
    m01: number, m11: number, m21: number, m31: number,
    m02: number, m12: number, m22: number, m32: number,
    m03: number, m13: number, m23: number, m33: number,
  ): Mat4 {
    const out = new Mat4()
    const m = out.m
    m[M._00] = m00
    m[M._01] = m01
    m[M._02] = m02
    m[M._03] = m03

    m[M._10] = m10
    m[M._11] = m11
    m[M._12] = m12
    m[M._13] = m13

    m[M._20] = m20
    m[M._21] = m21
    m[M._22] = m22
    m[M._23] = m23

    m[M._30] = m30
    m[M._31] = m31
    m[M._32] = m32
    m[M._33] = m33
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
    m00: number, m10: number, m20: number, m30: number,
    m01: number, m11: number, m21: number, m31: number,
    m02: number, m12: number, m22: number, m32: number,
    m03: number, m13: number, m23: number, m33: number,
  ): this {
    const m = this.m
    m[M._00] = m00
    m[M._01] = m01
    m[M._02] = m02
    m[M._03] = m03

    m[M._10] = m10
    m[M._11] = m11
    m[M._12] = m12
    m[M._13] = m13

    m[M._20] = m20
    m[M._21] = m21
    m[M._22] = m22
    m[M._23] = m23

    m[M._30] = m30
    m[M._31] = m31
    m[M._32] = m32
    m[M._33] = m33
    return this
  }

  /**
   * Crates a matrix with all components initialized to given value
   *
   * @param number - The number to set all matrix components to.
   */
  public static createWith(value: number): Mat4 {
    return new Mat4().initWith(value)
  }

  /**
   * Initializes all components with given value
   *
   * @param number - The number to set all matrix components to.
   */
  public initWith(value: number): this {
    const m = this.m
    m[M._00] = value; m[M._10] = value; m[M._20] = value; m[M._30] = value
    m[M._01] = value; m[M._11] = value; m[M._21] = value; m[M._31] = value
    m[M._02] = value; m[M._12] = value; m[M._22] = value; m[M._32] = value
    m[M._03] = value; m[M._13] = value; m[M._23] = value; m[M._33] = value
    return this
  }

  /**
   * Creates a new matrix that is initialized to identity
   *
   * @returns a new matrix
   */
  public static createIdentity(): Mat4 {
    return new Mat4().initIdentity()
  }

  /**
   * Initializes the components of this matrix to the identity.
   *
   * @remarks
   * Sets the following values
   * ```
   * 1 0 0 0
   * 0 1 0 0
   * 0 0 1 0
   * 0 0 0 1
   * ```
   */
  public initIdentity(): this {
    const m = this.m
    m[M._00] = 1; m[M._10] = 0; m[M._20] = 0; m[M._30] = 0
    m[M._01] = 0; m[M._11] = 1; m[M._21] = 0; m[M._31] = 0
    m[M._02] = 0; m[M._12] = 0; m[M._22] = 1; m[M._32] = 0
    m[M._03] = 0; m[M._13] = 0; m[M._23] = 0; m[M._33] = 1
    return this
  }

  /**
   * Creates a new matrix with all components set to 0
   *
   * @remarks
   * Sets the following values
   * ```
   * 0 0 0 0
   * 0 0 0 0
   * 0 0 0 0
   * 0 0 0 0
   * ```
   */
  public static createZero(): Mat4 {
    return new Mat4()
  }

  /**
   * Initializes the components of this matrix to 0.
   *
   * @remarks
   * Sets the following values
   * ```
   * 0 0 0 0
   * 0 0 0 0
   * 0 0 0 0
   * 0 0 0 0
   * ```
   */
  public initZero(): this {
    const m = this.m
    m[M._00] = 0; m[M._10] = 0; m[M._20] = 0; m[M._30] = 0
    m[M._01] = 0; m[M._11] = 0; m[M._21] = 0; m[M._31] = 0
    m[M._02] = 0; m[M._12] = 0; m[M._22] = 0; m[M._32] = 0
    m[M._03] = 0; m[M._13] = 0; m[M._23] = 0; m[M._33] = 0
    return this
  }

  /**
   * Creates a new matrix from another.
   */
  public static createFrom(other: Mat4): Mat4 {
    return new Mat4().initFrom(other)
  }

  /**
   * Initializes this matrix from another matrix.
   */
  public initFrom(other: Mat4): this {
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
    a[9] = b[9]
    a[10] = b[10]
    a[11] = b[11]
    a[12] = b[12]
    a[13] = b[13]
    a[14] = b[14]
    a[15] = b[15]
    return this
  }

  /**
   * Reads an array starting at given offset and initializes the elements of this matrix.
   */
  public static createFromArray(array: ArrayLike<number>, offset?: number): Mat4 {
    return new Mat4().initFromArray(array, offset)
  }

  /**
   * Reads an array starting at given offset and creates a new matrix.
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
    a[9] = array[offset + 9]
    a[10] = array[offset + 10]
    a[11] = array[offset + 11]
    a[12] = array[offset + 12]
    a[13] = array[offset + 13]
    a[14] = array[offset + 14]
    a[15] = array[offset + 15]
    return this
  }

  /**
   * Creates a matrix from given quaternion.
   *
   * @param q - The quaternion
   */
  public static createFromQuat(q: IVec4): Mat4 {
    return new Mat4().initFromQuaternion(q.x, q.y, q.z, q.w)
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
   * Creates a matrix from given quaternion parameters
   *
   * @param x - x component of the quaternion
   * @param y - y component of the quaternion
   * @param z - z component of the quaternion
   * @param w - w component of the quaternion
   */
  public static createFromQuaternion(x: number, y: number, z: number, w: number): Mat4 {
    return new Mat4().initFromQuaternion(x, y, z, w)
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
    m[M._03] = 0

    m[M._10] =     2 * (xy - zw)
    m[M._11] = 1 - 2 * (zz + xx)
    m[M._12] =     2 * (yz + xw)
    m[M._13] = 0

    m[M._20] =     2 * (xz + yw)
    m[M._21] =     2 * (yz - xw)
    m[M._22] = 1 - 2 * (yy + xx)
    m[M._23] = 0

    m[M._30] = 0
    m[M._31] = 0
    m[M._32] = 0
    m[M._33] = 1
    return this
  }

  /**
   * Creates a rotation matrix from quaternion and post-multiplies it to `this`
   *
   * @remarks
   * This post-multiplies the rotation so the rotation happens in local space
   * so the translation vector is not affected.
   *
   * @param q - The rotation quaternion
   */
  public rotateQuat(q: IVec4): this {
    return this.rotateQuaternion(q.x, q.y, q.z, q.w)
  }

  /**
   * Creates a rotation matrix from quaternion and pre-multiplies it to `this`
   *
   * @remarks
   * This pre-multiplies the rotation so the rotation happens in global space.
   *
   * @param q - The rotation quaternion
   */
  public preRotateQuat(q: IVec4): this {
    return this.preRotateQuaternion(q.x, q.y, q.z, q.w)
  }

  /**
   * Creates a rotation matrix from quaternion parameters and post-multiplies it to `this`
   *
   * @remarks
   * This post-multiplies the rotation so the rotation happens in local space
   * so the translation vector is not affected.
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
    const m03 = m[M._03]
    const m10 = m[M._10]
    const m11 = m[M._11]
    const m12 = m[M._12]
    const m13 = m[M._13]
    const m20 = m[M._20]
    const m21 = m[M._21]
    const m22 = m[M._22]
    const m23 = m[M._23]

    m[M._00] = r00 * m00 + r01 * m10 + r02 * m20
    m[M._01] = r00 * m01 + r01 * m11 + r02 * m21
    m[M._02] = r00 * m02 + r01 * m12 + r02 * m22
    m[M._03] = r00 * m03 + r01 * m13 + r02 * m23
    m[M._10] = r10 * m00 + r11 * m10 + r12 * m20
    m[M._11] = r10 * m01 + r11 * m11 + r12 * m21
    m[M._12] = r10 * m02 + r11 * m12 + r12 * m22
    m[M._13] = r10 * m03 + r11 * m13 + r12 * m23
    m[M._20] = r20 * m00 + r21 * m10 + r22 * m20
    m[M._21] = r20 * m01 + r21 * m11 + r22 * m21
    m[M._22] = r20 * m02 + r21 * m12 + r22 * m22
    m[M._23] = r20 * m03 + r21 * m13 + r22 * m23

    return this
  }

  /**
   * Creates a rotation matrix from quaternion parameters and pre-multiplies it to `this`
   *
   * @remarks
   * This pre-multiplies the rotation so the rotation happens in global space.
   *
   * @param x - x component of the quaternion
   * @param y - y component of the quaternion
   * @param z - z component of the quaternion
   * @param w - w component of the quaternion
   */
  public preRotateQuaternion(x: number, y: number, z: number, w: number): this {
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
    const m10 = m[M._10]
    const m20 = m[M._20]
    const m30 = m[M._30]
    const m01 = m[M._01]
    const m11 = m[M._11]
    const m21 = m[M._21]
    const m31 = m[M._31]
    const m02 = m[M._02]
    const m12 = m[M._12]
    const m22 = m[M._22]
    const m32 = m[M._32]

    m[M._00] = r00 * m00 + r01 * m01 + r02 * m02
    m[M._10] = r00 * m10 + r01 * m11 + r02 * m12
    m[M._20] = r00 * m20 + r01 * m21 + r02 * m22
    m[M._30] = r00 * m30 + r01 * m31 + r02 * m32
    m[M._01] = r10 * m00 + r11 * m01 + r12 * m02
    m[M._11] = r10 * m10 + r11 * m11 + r12 * m12
    m[M._21] = r10 * m20 + r11 * m21 + r12 * m22
    m[M._31] = r10 * m30 + r11 * m31 + r12 * m32
    m[M._02] = r20 * m00 + r21 * m01 + r22 * m02
    m[M._12] = r20 * m10 + r21 * m11 + r22 * m12
    m[M._22] = r20 * m20 + r21 * m21 + r22 * m22
    m[M._32] = r20 * m30 + r21 * m31 + r22 * m32

    return this
  }

  /**
   * Creates a rotation matrix from an axis and angle
   *
   * @param axis - normalized rotation axis vector
   * @param angle - rotation angle in rad
   */
  public static createAxisAngleV(axis: IVec3, angle: number): Mat4 {
    return new Mat4().initAxisAngle(axis.x, axis.y, axis.z, angle)
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
   * This post-multiplies the rotation so the rotation happens in local space
   * so the translation vector is not affected.
   *
   * @param axis - normalized rotation axis vector
   * @param angle - rotation angle in rad
   */
  public rotateAxisAngleV(axis: IVec3, angle: number): this {
    return this.rotateAxisAngle(axis.x, axis.y, axis.z, angle)
  }

  /**
   * Applies a rotation around the given axis and angle
   *
   * @remarks
   * This pre-multiplies the rotation so the rotation happens in global space.
   *
   * @param axis - normalized rotation axis vector
   * @param angle - rotation angle in rad
   */
  public preRotateAxisAngleV(axis: IVec3, angle: number): this {
    return this.preRotateAxisAngle(axis.x, axis.y, axis.z, angle)
  }

  /**
   * Creates a rotation matrix from axis angle parameters
   *
   * @param x - x component of the normalized rotation axis
   * @param y - y component of the normalized rotation axis
   * @param z - z component of the normalized rotation axis
   * @param angle - rotation angle in rad
   */
  public static createAxisAngle(x: number, y: number, z: number, angle: number): Mat4 {
    return new Mat4().initAxisAngle(x, y, z, angle)
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
    m[M._03] = 0

    m[M._10] =     2 * (xy - zw)
    m[M._11] = 1 - 2 * (zz + xx)
    m[M._12] =     2 * (yz + xw)
    m[M._13] = 0

    m[M._20] =     2 * (xz + yw)
    m[M._21] =     2 * (yz - xw)
    m[M._22] = 1 - 2 * (yy + xx)
    m[M._23] = 0

    m[M._30] = 0
    m[M._31] = 0
    m[M._32] = 0
    m[M._33] = 1
    return this
  }

  /**
   * Applies a rotation around the given axis and angle
   *
   * @remarks
   * This post-multiplies the rotation so the rotation happens in local space
   * so the translation vector is not affected.
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
    this.rotateQuaternion(x, y, z, w)
    return this
  }

  /**
   * Applies a rotation around the given axis and angle
   *
   * @remarks
   * This pre-multiplies the rotation so the rotation happens in global space.
   *
   * @param x - x component of the normalized rotation axis
   * @param y - y component of the normalized rotation axis
   * @param z - z component of the normalized rotation axis
   * @param angle - rotation angle in rad
   */
  public preRotateAxisAngle(x: number, y: number, z: number, angle: number): this {
    // create quaternion
    const halfAngle = angle * 0.5
    const scale = Math.sin(halfAngle)
    x *= scale
    y *= scale
    z *= scale
    const w = Math.cos(halfAngle)
    this.preRotateQuaternion(x, y, z, w)
    return this
  }

  /**
   * Creates a rotation matrix from yaw pitch roll angles
   *
   * @param yaw - angle in rad around the Y axis
   * @param pitch - angle in rad around the X axis
   * @param roll - angle in rad around the Z axis
   */
  public static createYawPitchRoll(yaw: number, pitch: number, roll: number): Mat4 {
    return new Mat4().initYawPitchRoll(yaw, pitch, roll)
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
    m[M._03] = 0

    m[M._10] =     2 * (xy - zw)
    m[M._11] = 1 - 2 * (zz + xx)
    m[M._12] =     2 * (yz + xw)
    m[M._13] = 0

    m[M._20] =     2 * (xz + yw)
    m[M._21] =     2 * (yz - xw)
    m[M._22] = 1 - 2 * (yy + xx)
    m[M._23] = 0

    m[M._30] = 0
    m[M._31] = 0
    m[M._32] = 0
    m[M._33] = 1
    return this
  }

  /**
   * Applies a yaw pitch roll rotation to this matrix
   *
   * @remarks
   * This post-multiplies the rotation so the rotation happens in local space
   * so the translation vector is not affected.
   *
   * @param yaw - angle in rad around the Y axis
   * @param pitch - angle in rad around the X axis
   * @param roll - angle in rad around the Z axis
   */
  public rotateYawPitchRoll(yaw: number, pitch: number, roll: number): Mat4 {
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
   * Applies a yaw pitch roll rotation to this matrix
   *
   * @remarks
   * This pre-multiplies the rotation so the rotation happens in global space.
   *
   * @param yaw - angle in rad around the Y axis
   * @param pitch - angle in rad around the X axis
   * @param roll - angle in rad around the Z axis
   */
  public preRotateYawPitchRoll(yaw: number, pitch: number, roll: number): this {
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

    return this.preRotateQuaternion(x, y, z, w)
  }

  /**
   * Creates a new rotation matrix
   *
   * @remarks
   * Sets the following values
   * ```
   * 1 0  0 0
   * 0 c -s 0
   * 0 s  c 0
   * 0 0  0 1
   * ```
   * where `c = cos(angle)` and `s = sin(angle)`
   */
  public static createRotationX(rad: number): Mat4 {
    return new Mat4().initRotationX(rad)
  }

  /**
   * Initializes this matrix with a rotation around the X axis.
   *
   * @remarks
   * Sets the following values
   * ```
   * 1 0  0 0
   * 0 c -s 0
   * 0 s  c 0
   * 0 0  0 1
   * ```
   * where `c = cos(angle)` and `s = sin(angle)`
   *
   * @param angle - angle in rad
   */
  public initRotationX(angle: number): this {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const m = this.m
    m[M._00] = 1; m[M._10] = 0;   m[M._20] = 0;    m[M._30] = 0
    m[M._01] = 0; m[M._11] = cos; m[M._21] = -sin; m[M._31] = 0
    m[M._02] = 0; m[M._12] = sin; m[M._22] =  cos; m[M._32] = 0
    m[M._03] = 0; m[M._13] = 0;   m[M._23] = 0;    m[M._33] = 1
    return this
  }

  /**
   * Applies a post-rotation around X axis to this matrix
   *
   * @remarks
   * This post-multiplies the rotation so the rotation happens in local space
   * so the translation vector is not affected.
   *
   * @param angle - angle in rad
   */
  public rotateX(angle: number): this {
    const m = this.m
    const m10 = m[M._10]
    const m11 = m[M._11]
    const m12 = m[M._12]
    const m13 = m[M._13]
    const m20 = m[M._20]
    const m21 = m[M._21]
    const m22 = m[M._22]
    const m23 = m[M._23]
    const c = Math.cos(angle)
    const s = Math.sin(angle)

    m[M._10] = c * m10 + s * m20
    m[M._11] = c * m11 + s * m21
    m[M._12] = c * m12 + s * m22
    m[M._13] = c * m13 + s * m23
    m[M._20] = c * m20 - s * m10
    m[M._21] = c * m21 - s * m11
    m[M._22] = c * m22 - s * m12
    m[M._23] = c * m23 - s * m13

    return this
  }

  /**
   * Applies a pre-rotation around X axis to this matrix in world space
   *
   * @remarks
   * This pre-multiplies the rotation so the rotation happens in global space.
   *
   * @param angle - angle in rad
   */
  public preRotateX(angle: number): this {
    const m = this.m
    const m01 = m[M._01]
    const m11 = m[M._11]
    const m21 = m[M._21]
    const m31 = m[M._31]
    const m02 = m[M._02]
    const m12 = m[M._12]
    const m22 = m[M._22]
    const m32 = m[M._32]
    const c = Math.cos(angle)
    const s = Math.sin(angle)

    m[M._01] = c * m01 - s * m02
    m[M._11] = c * m11 - s * m12
    m[M._21] = c * m21 - s * m22
    m[M._31] = c * m31 - s * m32
    m[M._02] = c * m02 + s * m01
    m[M._12] = c * m12 + s * m11
    m[M._22] = c * m22 + s * m21
    m[M._32] = c * m32 + s * m31

    return this
  }

  /**
   * Creates a new rotation matrix
   */
  public static createRotationY(rad: number): Mat4 {
    return new Mat4().initRotationY(rad)
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
    m[M._00] = cos;  m[M._10] = 0; m[M._20] = sin; m[M._30] = 0
    m[M._01] = 0;    m[M._11] = 1; m[M._21] = 0;   m[M._31] = 0
    m[M._02] = -sin; m[M._12] = 0; m[M._22] = cos; m[M._32] = 0
    m[M._03] = 0;    m[M._13] = 0; m[M._23] = 0;   m[M._33] = 1
    return this
  }

  /**
   * Applies a rotation around Y axis to this matrix
   *
   * @remarks
   * This post-multiplies the rotation so the rotation happens in local space
   * so the translation vector is not affected.
   *
   * @param angle - angle in rad
   */
  public rotateY(angle: number): this {
    const m = this.m
    const m00 = m[M._00]
    const m01 = m[M._01]
    const m02 = m[M._02]
    const m03 = m[M._03]
    const m20 = m[M._20]
    const m21 = m[M._21]
    const m22 = m[M._22]
    const m23 = m[M._23]
    const c = Math.cos(angle)
    const s = Math.sin(angle)

    m[M._00] = c * m00 - s * m20
    m[M._01] = c * m01 - s * m21
    m[M._02] = c * m02 - s * m22
    m[M._03] = c * m03 - s * m23
    m[M._20] = c * m20 + s * m00
    m[M._21] = c * m21 + s * m01
    m[M._22] = c * m22 + s * m02
    m[M._23] = c * m23 + s * m03

    return this
  }

  /**
   * Applies a rotation around Y axis to this matrix
   *
   * @remarks
   * This pre-multiplies the rotation so the rotation happens in global space.
   *
   * @param angle - angle in rad
   */
  public preRotateY(angle: number): this {
    const m = this.m
    const m00 = m[M._00]
    const m10 = m[M._10]
    const m20 = m[M._20]
    const m30 = m[M._30]
    const m02 = m[M._02]
    const m12 = m[M._12]
    const m22 = m[M._22]
    const m32 = m[M._32]
    const c = Math.cos(angle)
    const s = Math.sin(angle)

    m[M._00] = c * m00 + s * m02
    m[M._10] = c * m10 + s * m12
    m[M._20] = c * m20 + s * m22
    m[M._30] = c * m30 + s * m32
    m[M._02] = c * m02 - s * m00
    m[M._12] = c * m12 - s * m10
    m[M._22] = c * m22 - s * m20
    m[M._32] = c * m32 - s * m30

    return this
  }
  /**
   * Creates a new rotation matrix
   */
  public static createRotationZ(rad: number): Mat4 {
    return new Mat4().initRotationZ(rad)
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
    m[M._00] = cos; m[M._10] = -sin; m[M._20] = 0; m[M._30] = 0
    m[M._01] = sin; m[M._11] =  cos; m[M._21] = 0; m[M._31] = 0
    m[M._02] = 0;   m[M._12] = 0;    m[M._22] = 1; m[M._32] = 0
    m[M._03] = 0;   m[M._13] = 0;    m[M._23] = 0; m[M._33] = 1
    return this
  }

  /**
   * Applies a rotation around Z axis to this matrix
   *
   * @remarks
   * This post-multiplies the rotation so the rotation happens in local space
   * so the translation vector is not affected.
   *
   * @param angle - angle in rad
   */
  public rotateZ(angle: number): this {
    const m = this.m
    const m00 = m[M._00]
    const m01 = m[M._01]
    const m02 = m[M._02]
    const m03 = m[M._03]
    const m10 = m[M._10]
    const m11 = m[M._11]
    const m12 = m[M._12]
    const m13 = m[M._13]
    const c = Math.cos(angle)
    const s = Math.sin(angle)

    m[M._00] = c * m00 + s * m10
    m[M._01] = c * m01 + s * m11
    m[M._02] = c * m02 + s * m12
    m[M._03] = c * m03 + s * m13
    m[M._10] = c * m10 - s * m00
    m[M._11] = c * m11 - s * m01
    m[M._12] = c * m12 - s * m02
    m[M._13] = c * m13 - s * m03

    return this
  }

  /**
   * Applies a rotation around Z axis to this matrix
   *
   * @remarks
   * This pre-multiplies the rotation so the rotation happens in global space.
   *
   * @param angle - angle in rad
   */
  public preRotateZ(angle: number): this {
    const m = this.m
    const m00 = m[M._00]
    const m10 = m[M._10]
    const m20 = m[M._20]
    const m30 = m[M._30]
    const m01 = m[M._01]
    const m11 = m[M._11]
    const m21 = m[M._21]
    const m31 = m[M._31]
    const c = Math.cos(angle)
    const s = Math.sin(angle)

    m[M._00] = c * m00 - s * m01
    m[M._10] = c * m10 - s * m11
    m[M._20] = c * m20 - s * m21
    m[M._30] = c * m30 - s * m31
    m[M._01] = c * m01 + s * m00
    m[M._11] = c * m11 + s * m10
    m[M._21] = c * m21 + s * m20
    m[M._31] = c * m31 + s * m30

    return this
  }

  /**
   * Creates a new matrix with a predefined scale
   */
  public static createScale(x: number, y: number, z: number): Mat4 {
    return new Mat4().initScale(x, y, z)
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
    m[M._00] = x; m[M._10] = 0; m[M._20] = 0; m[M._30] = 0
    m[M._01] = 0; m[M._11] = y; m[M._21] = 0; m[M._31] = 0
    m[M._02] = 0; m[M._12] = 0; m[M._22] = z; m[M._32] = 0
    m[M._03] = 0; m[M._13] = 0; m[M._23] = 0; m[M._33] = 1
    return this
  }

  /**
   * Post-multiplies the scale so it happens in local space.
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
    m[M._03] *= x
    m[M._10] *= y
    m[M._11] *= y
    m[M._12] *= y
    m[M._13] *= y
    m[M._20] *= z
    m[M._21] *= z
    m[M._22] *= z
    m[M._23] *= z
    return this
  }

  /**
   * Pre-multiplies the scale so it happens in global space.
   *
   * @param x - x scale factor
   * @param y - y scale factor
   * @param z - z scale factor
   */
  public preScale(x: number, y: number, z: number): this {
    const m = this.m
    m[M._00] *= x
    m[M._10] *= x
    m[M._20] *= x
    m[M._30] *= x
    m[M._01] *= y
    m[M._11] *= y
    m[M._21] *= y
    m[M._31] *= y
    m[M._02] *= z
    m[M._12] *= z
    m[M._22] *= z
    m[M._32] *= z
    return this
  }

  /**
   * Creates a new matrix with a predefined scale
   */
  public static createScaleV(vec: IVec3): Mat4 {
    return new Mat4().initScale(vec.x, vec.y, vec.z)
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
   * Post-multiplies the scale so it happens in local space.
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
    m[M._03] *= x
    m[M._10] *= y
    m[M._11] *= y
    m[M._12] *= y
    m[M._13] *= y
    m[M._20] *= z
    m[M._21] *= z
    m[M._22] *= z
    m[M._23] *= z
    return this
  }

  /**
   * Pre-multiplies the scale so it happens in global space.
   *
   * @param scale - the scale vector
   */
  public preScaleV(scale: IVec3): this {
    const x = scale.x
    const y = scale.y
    const z = scale.z
    const m = this.m
    m[M._00] *= x
    m[M._10] *= x
    m[M._20] *= x
    m[M._30] *= x
    m[M._01] *= y
    m[M._11] *= y
    m[M._21] *= y
    m[M._31] *= y
    m[M._02] *= z
    m[M._12] *= z
    m[M._22] *= z
    m[M._32] *= z
    return this
  }

  /**
   * Creates a new matrix with a predefined scale
   */
  public static createScaleUniform(scale: number): Mat4 {
    return new Mat4().initScale(scale, scale, scale)
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
   * Post-multiplies the scale so it happens in local space (does not affect translation)
   *
   * @param scale - the uniform scale factor
   */
  public scaleUniform(scale: number): this {
    const m = this.m
    m[M._00] *= scale
    m[M._01] *= scale
    m[M._02] *= scale
    m[M._03] *= scale
    m[M._10] *= scale
    m[M._11] *= scale
    m[M._12] *= scale
    m[M._13] *= scale
    m[M._20] *= scale
    m[M._21] *= scale
    m[M._22] *= scale
    m[M._23] *= scale
    return this
  }

  /**
   * Pre-multiplies the scale so it happens in global space (does affect translation)
   *
   * @param scale - the uniform scale factor
   */
  public preScaleUniform(scale: number): this {
    const m = this.m
    m[M._00] *= scale
    m[M._10] *= scale
    m[M._20] *= scale
    m[M._30] *= scale
    m[M._01] *= scale
    m[M._11] *= scale
    m[M._21] *= scale
    m[M._31] *= scale
    m[M._02] *= scale
    m[M._12] *= scale
    m[M._22] *= scale
    m[M._32] *= scale
    return this
  }

  /**
   * Post-multiplies the scale so it happens in local space (does not affect translation)
   *
   * @param x - scale factor on x axis
   */
  public scaleX(x: number): this {
    const m = this.m
    m[M._00] *= x
    m[M._01] *= x
    m[M._02] *= x
    m[M._03] *= x
    return this
  }

  /**
   * Pre-multiplies the scale so it happens in global space (does affect translation)
   *
   * @param x - scale factor on x axis
   */
  public preScaleX(x: number): this {
    const m = this.m
    m[M._00] *= x
    m[M._10] *= x
    m[M._20] *= x
    m[M._30] *= x
    return this
  }

  /**
   * Post-multiplies the scale so it happens in local space (does not affect translation)
   *
   * @param y - scale factor on y axis
   */
  public scaleY(y: number): this {
    const m = this.m
    m[M._10] *= y
    m[M._11] *= y
    m[M._12] *= y
    m[M._13] *= y
    return this
  }

  /**
   * Pre-multiplies the scale so it happens in global space (does affect translation)
   *
   * @param y - scale factor on y axis
   */
  public preScaleY(y: number): this {
    const m = this.m
    m[M._01] *= y
    m[M._11] *= y
    m[M._21] *= y
    m[M._31] *= y
    return this
  }

  /**
   * Post-multiplies the scale so it happens in local space (does not affect translation)
   *
   * @param z - scale factor on z axis
   */
  public scaleZ(z: number): this {
    const m = this.m
    m[M._20] *= z
    m[M._21] *= z
    m[M._22] *= z
    m[M._23] *= z
    return this
  }

  /**
   * Pre-multiplies the scale so it happens in global space (does affect translation)
   *
   * @param z - scale factor on z axis
   */
  public preScaleZ(z: number): this {
    const m = this.m
    m[M._02] *= z
    m[M._12] *= z
    m[M._22] *= z
    m[M._32] *= z
    return this
  }

  /**
   * Creates a new translation matrix
   *
   * @remarks
   * Sets the following values
   * ```
   * 1 0 0 x
   * 0 1 0 y
   * 0 0 1 z
   * 0 0 0 1
   * ```
   */
  public static createTranslation(x: number, y: number, z: number): Mat4 {
    return new Mat4().initTranslation(x, y, z)
  }

  /**
   * Initializes a translation matrix.
   *
   * @remarks
   * Sets the following values
   * ```
   * 1 0 0 x
   * 0 1 0 y
   * 0 0 1 z
   * 0 0 0 1
   * ```
   *
   * @param x - x component of the translation vector
   * @param y - y component of the translation vector
   * @param z - z component of the translation vector
   */
  public initTranslation(x: number, y: number, z: number): this {
    const m = this.m
    m[M._00] = 1; m[M._10] = 0; m[M._20] = 0; m[M._30] = x
    m[M._01] = 0; m[M._11] = 1; m[M._21] = 0; m[M._31] = y
    m[M._02] = 0; m[M._12] = 0; m[M._22] = 1; m[M._32] = z
    m[M._03] = 0; m[M._13] = 0; m[M._23] = 0; m[M._33] = 1
    return this
  }

  /**
   * Post-multiplies the translation so it happens in local space
   *
   * @remarks
   * This performs an optimized post-multiplication with a translation matrix.
   *
   * `this = this * T` where `T` is a translation matrix
   * ```
   * 1 0 0 x
   * 0 1 0 y
   * 0 0 1 z
   * 0 0 0 1
   * ```
   *
   * @param x - translation in x direction
   * @param y - translation in y direction
   * @param z - translation in z direction
   */
  public translate(x: number, y: number, z: number): this {
    const m = this.m
    m[12] = m[0] * x + m[4] * y + m[8] * z + m[12]
    m[13] = m[1] * x + m[5] * y + m[9] * z + m[13]
    m[14] = m[2] * x + m[6] * y + m[10] * z + m[14]
    m[15] = m[3] * x + m[7] * y + m[11] * z + m[15]
    return this
  }

  /**
   * Pre-multiplies the translation so it happens in global space
   *
   * @remarks
   * This performs an optimized pre-multiplication with a translation matrix.
   *
   * `this = T * this` where `T` is a translation matrix
   * ```
   * 1 0 0 x
   * 0 1 0 y
   * 0 0 1 z
   * 0 0 0 1
   * ```
   *
   * @param x - translation in x direction
   * @param y - translation in y direction
   * @param z - translation in z direction
   */
  public preTranslate(x: number, y: number, z: number): this {
    const m = this.m
    m[M._30] += x
    m[M._31] += y
    m[M._32] += z
    return this
  }

  /**
   * Creates a new translation matrix
   *
   * @remarks
   * Sets the following values
   * ```
   * 1 0 0 v.x
   * 0 1 0 v.y
   * 0 0 1 v.z
   * 0 0 0 1
   * ```
   *
   * @param v - the translation vector
   */
  public static createTranslationV(v: IVec3): Mat4 {
    return new Mat4().initTranslationV(v)
  }

  /**
   * Initializes a translation matrix.
   *
   * @remarks
   * Sets the following values
   * ```
   * 1 0 0 v.x
   * 0 1 0 v.y
   * 0 0 1 v.z
   * 0 0 0 1
   * ```
   *
   * @param v - the translation vector
   */
  public initTranslationV(v: IVec3): this {
    const m = this.m
    m[M._00] = 1; m[M._10] = 0; m[M._20] = 0; m[M._30] = v.x
    m[M._01] = 0; m[M._11] = 1; m[M._21] = 0; m[M._31] = v.y
    m[M._02] = 0; m[M._12] = 0; m[M._22] = 1; m[M._32] = v.z
    m[M._03] = 0; m[M._13] = 0; m[M._23] = 0; m[M._33] = 1
    return this
  }

  /**
   * Post-multiplies the translation so it happens in local space
   *
   * @remarks
   * This performs an optimized post-multiplication with a translation matrix.
   *
   * `this = this * T` where `T` is a translation matrix
   * ```
   * 1 0 0 x
   * 0 1 0 y
   * 0 0 1 z
   * 0 0 0 1
   * ```
   *
   * @param v - the translation vector
   */
  public translateV(v: IVec3): this {
    const x = v.x
    const y = v.y
    const z = v.z
    const m = this.m
    m[12] = m[0] * x + m[4] * y + m[8] * z + m[12]
    m[13] = m[1] * x + m[5] * y + m[9] * z + m[13]
    m[14] = m[2] * x + m[6] * y + m[10] * z + m[14]
    m[15] = m[3] * x + m[7] * y + m[11] * z + m[15]
    return this
  }

  /**
   * Pre-multiplies the translation so it happens in global space
   *
   * @remarks
   * This performs an optimized pre-multiplication with a translation matrix.
   *
   * `this = T * this` where `T` is a translation matrix
   * ```
   * 1 0 0 x
   * 0 1 0 y
   * 0 0 1 z
   * 0 0 0 1
   * ```
   *
   * @param v - the translation vector
   */
  public preTranslateV(v: IVec3): this {
    const m = this.m
    m[M._30] += v.x
    m[M._31] += v.y
    m[M._32] += v.z
    return this
  }

  /**
   * Post-multiplies the translation so it happens in local space
   *
   * @remarks
   * This performs an optimized post-multiplication with a translation matrix.
   *
   * `this = this * T` where `T` is a translation matrix
   * ```
   * 1 0 0 x
   * 0 1 0 0
   * 0 0 1 0
   * 0 0 0 1
   * ```
   *
   * @param x - translation in x direction
   */
  public translateX(x: number): this {
    const m = this.m
    m[M._30] = m[M._00] * x + m[M._30]
    m[M._31] = m[M._01] * x + m[M._31]
    m[M._32] = m[M._02] * x + m[M._32]
    m[M._33] = m[M._03] * x + m[M._33]
    return this
  }

  /**
   * Post-multiplies the translation so it happens in local space
   *
   * @remarks
   * This performs an optimized post-multiplication with a translation matrix.
   *
   * `this = this * T` where `T` is a translation matrix
   * ```
   * 1 0 0 0
   * 0 1 0 y
   * 0 0 1 0
   * 0 0 0 1
   * ```
   *
   * @param y - translation in y direction
   */
  public translateY(y: number): this {
    const m = this.m
    m[M._30] = m[M._10] * y + m[M._30]
    m[M._31] = m[M._11] * y + m[M._31]
    m[M._32] = m[M._12] * y + m[M._32]
    m[M._33] = m[M._13] * y + m[M._33]
    return this
  }

  /**
   * Post-multiplies the translation so it happens in local space
   *
   * @remarks
   * This performs an optimized post-multiplication with a translation matrix.
   *
   * `this = this * T` where `T` is a translation matrix
   * ```
   * 1 0 0 0
   * 0 1 0 0
   * 0 0 1 z
   * 0 0 0 1
   * ```
   *
   * @param z - translation in z direction
   */
  public translateZ(z: number): this {
    const m = this.m
    m[M._30] = m[M._20] * z + m[M._30]
    m[M._31] = m[M._21] * z + m[M._31]
    m[M._32] = m[M._22] * z + m[M._32]
    m[M._33] = m[M._23] * z + m[M._33]
    return this
  }

  /**
   * Pre-multiplies the translation so it happens in global space
   *
   * @remarks
   * Simply adds the translation value to the translation part of the matrix
   *
   * @param x - translation in x direction
   */
  public preTranslateX(x: number): this {
    this.m[M._30] += x
    return this
  }

  /**
   * Pre-multiplies the translation so it happens in global space
   *
   * @remarks
   * Simply adds the translation value to the translation part of the matrix
   *
   * @param y - translation in y direction
   */
  public preTranslateY(y: number): this {
    this.m[M._31] += y
    return this
  }

  /**
   * Pre-multiplies the translation so it happens in global space
   *
   * @remarks
   * Simply adds the translation value to the translation part of the matrix
   *
   * @param z - translation in z direction
   */
  public preTranslateZ(z: number): this {
    this.m[M._32] += z
    return this
  }

  /**
   * Creates a rotation matrix by using direction vector
   */
  public static createOrientation(forward: IVec3, up: IVec3): Mat4 {
    return new Mat4().initOrientation(forward, up)
  }

  /**
   * Initializes a rotation matrix by using direction vector
   *
   * @param forward - The forward vector
   * @param up - The up vector of the viewer
   */
  public initOrientation(forward: IVec3, up: IVec3): this {
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

    const m = this.m
    m[M._00] = rightX; m[M._10] = x; m[M._20] = backX
    m[M._01] = rightY; m[M._11] = y; m[M._21] = backY
    m[M._02] = rightZ; m[M._12] = z; m[M._22] = backZ
    return this
  }

  /**
   * Creates a new look at matrix
   */
  public static createLookAt(pos: IVec3, lookAt: IVec3, up: IVec3): Mat4 {
    return new Mat4().initLookAt(pos, lookAt, up)
  }

  /**
   * Initializes a rotation matrix by using a position and a lookat point.
   *
   * @param pos - The position where the viewer stands
   * @param lookAt - The position where the viewer is looking to
   * @param up - The up vector of the viewer
   */
  public initLookAt(pos: IVec3, lookAt: IVec3, up: IVec3): this {
    // back = position - lookAt
    let backX = pos.x - lookAt.x
    let backY = pos.y - lookAt.y
    let backZ = pos.z - lookAt.z

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

    const m = this.m
    m[M._00] = rightX; m[M._10] = upX; m[M._20] = backX; m[M._30] = pos.x
    m[M._01] = rightY; m[M._11] = upY; m[M._21] = backY; m[M._31] = pos.y
    m[M._02] = rightZ; m[M._12] = upZ; m[M._22] = backZ; m[M._32] = pos.z
    m[M._03] = 0;      m[M._13] = 0;   m[M._23] = 0;     m[M._33] = 1
    return this
  }

  /**
   * Creates a new matrix with a position and facing direction
   */
  public static createWorld(position: IVec3, forward: IVec3, up: IVec3) {
    return new Mat4().initWorld(position, forward, up)
  }

  /**
   * Initializes a matrix from a position point and a forward and up vectors
   *
   * @param position - The translation part
   * @param forward - The facing direction
   * @param up - The up vector
   */
  public initWorld(position: IVec3, forward: IVec3, up: IVec3): this {
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

    const m = this.m
    m[M._00] = rightX; m[M._10] = x; m[M._20] = backX; m[M._30] = position.x
    m[M._01] = rightY; m[M._11] = y; m[M._21] = backY; m[M._31] = position.y
    m[M._02] = rightZ; m[M._12] = z; m[M._22] = backZ; m[M._32] = position.z
    m[M._03] = 0;      m[M._13] = 0; m[M._23] = 0;     m[M._33] = 1
    return this
  }

  /**
   * Creates a new perspective matrix
   */
  public static createPerspective(width: number, height: number, near: number, far: number): Mat4 {
    return new Mat4().initPerspective(width, height, near, far)
  }

  /**
   * Initializes a perspective matrix
   */
  public initPerspective(width: number, height: number, near: number, far: number): this {
    const m = this.m
    const d = (far - near)
    m[M._00] = near / width; m[M._10] = 0;             m[M._20] = 0;                 m[M._30] = 0
    m[M._01] = 0;            m[M._11] = near / height; m[M._21] = 0;                 m[M._31] = 0
    m[M._02] = 0;            m[M._12] = 0;             m[M._22] = -(far + near) / d; m[M._32] = -(2 * far * near) / d
    m[M._03] = 0;            m[M._13] = 0;             m[M._23] = -1;                m[M._33] = 1
    return this
  }

  /**
   * Creates a new perspective matrix with given field of view angle
   *
   * @param fov - The field of view angle in radians
   * @param aspect - The aspect ratio
   * @param near - The near plane distance
   * @param far - The far plane distance
   */
  public static createPerspectiveFieldOfView(fov: number, aspect: number, near: number, far: number): Mat4 {
    return new Mat4().initPerspectiveFieldOfView(fov, aspect, near, far)
  }

  /**
   * Initializes a perspective matrix with given field of view angle
   *
   * @param fov - The field of view angle in radians
   * @param aspect - The aspect ratio
   * @param near - The near plane distance
   * @param far - The far plane distance
   */
  public initPerspectiveFieldOfView(fov: number, aspect: number, near: number, far: number): this {
    const s = 1.0 / Math.tan(fov * 0.5)
    const d = (far - near)
    const m = this.m
    m[M._00] = s / aspect; m[M._10] = 0; m[M._20] = 0;                 m[M._30] = 0
    m[M._01] = 0;          m[M._11] = s; m[M._21] = 0;                 m[M._31] = 0
    m[M._02] = 0;          m[M._12] = 0; m[M._22] = -(far + near) / d; m[M._32] = -(2 * far * near) / d
    m[M._03] = 0;          m[M._13] = 0; m[M._23] = -1;                m[M._33] = 0
    return this
  }

  /**
   * Creates a new perspective matrix
   */
  public static createPerspectiveOffCenter(left: number, right: number, bottom: number, top: number, near: number, far: number): Mat4 {
    return new Mat4().initPerspectiveOffCenter(left, right, bottom, top, near, far)
  }

  /**
   * Initializes a perspective matrix
   */
  public initPerspectiveOffCenter(left: number, right: number, bottom: number, top: number, near: number, far: number): this {
    const w = right - left
    const h = top - bottom
    const d = far - near
    const m = this.m
    m[M._00] = 2 * near / w; m[M._10] = 0;            m[M._20] = (right + left) / w; m[M._30] = 0
    m[M._01] = 0;            m[M._11] = 2 * near / h; m[M._21] = (top + bottom) / h; m[M._31] = 0
    m[M._02] = 0;            m[M._12] = 0;            m[M._22] = -(far + near) / d;  m[M._32] = -(2 * far * near) / d
    m[M._03] = 0;            m[M._13] = 0;            m[M._23] = -1;                 m[M._33] = 0
    return this
  }

  /**
   * Creates a new perspective matrix
   */
  public static createOrthographic(width: number, height: number, near: number, far: number): Mat4 {
    return new Mat4().initOrthographic(width, height, near, far)
  }

  /**
   * Initializes an orthographic matrix
   */
  public initOrthographic(width: number, height: number, near: number, far: number): this {
    const d = far - near
    const m = this.m
    m[M._00] = 1 / width; m[M._10] = 0;          m[M._20] = 0;                 m[M._30] = 0
    m[M._01] = 0;         m[M._11] = 1 / height; m[M._21] = 0;                 m[M._31] = 0
    m[M._02] = 0;         m[M._12] = 0;          m[M._22] = -2 / (far - near); m[M._32] = -(far + near) / d
    m[M._03] = 0;         m[M._13] = 0;          m[M._23] = 0;                 m[M._33] = 1
    return this
  }

  /**
   * creates a new orthographic matrix
   */
  public static createOrthographicOffCenter(left: number, right: number, bottom: number, top: number, near: number, far: number): Mat4 {
    return new Mat4().initOrthographicOffCenter(left, right, bottom, top, near, far)
  }

  /**
   * Initializes an orthographic matrix
   */
  public initOrthographicOffCenter(left: number, right: number, bottom: number, top: number, near: number, far: number): this {
    const w = right - left
    const h = top - bottom
    const d = far - near
    const m = this.m
    m[M._00] = 2 / w; m[M._10] = 0;     m[M._20] = 0;      m[M._30] = -(right + left) / w
    m[M._01] = 0;     m[M._11] = 2 / h; m[M._21] = 0;      m[M._31] = -(top + bottom) / h
    m[M._02] = 0;     m[M._12] = 0;     m[M._22] = -2 / d; m[M._32] = -(far + near) / d
    m[M._03] = 0;     m[M._13] = 0;     m[M._23] = 0;      m[M._33] = 1
    return this
  }

  /**
   * Calculates the determinant of this matrix
   */
  public determinant(): number {
    const a = this.m

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

    return (a11 * det1 - a21 * det2 + a31 * det3 - a41 * det4)
  }

  /**
   * Transpose the given matrix
   * @param mat - The matrix to transpose
   * @param out - The matrix to write to. Leave it out or pass null to create a new matrix.
   * @returns The given `out` parameter or a new matrix
   */
  public static transpose(mat: IMat, out?: Mat4): Mat4 {
    const d = mat.m
    return (out || new Mat4()).init(
      d[0], d[4], d[8], d[12],
      d[1], d[5], d[9], d[13],
      d[2], d[6], d[10], d[14],
      d[3], d[7], d[11], d[15],
    )
  }

  /**
   * Transposes this matrix
   */
  public transpose(): this {
    const m = this.m
    let t

    t = m[1]
    m[1] = m[4]
    m[4] = t

    t = m[2]
    m[2] = m[8]
    m[8] = t

    t = m[3]
    m[3] = m[12]
    m[12] = t

    t = m[6]
    m[6] = m[9]
    m[9] = t

    t = m[7]
    m[7] = m[13]
    m[13] = t

    t = m[11]
    m[11] = m[14]
    m[14] = t

    return this
  }

  /**
   * Invert the given matrix
   * @param mat - The matrix to transpose
   * @param out - The matrix to write to. Leave it out or pass null to create a new matrix.
   * @returns The given `out` parameter or a new matrix
   */
  public static invert(mat: IMat, out?: Mat4): Mat4 {
    out = out || new Mat4()
    const a = mat.m
    const b = out.m

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
   * Inverts this matrix
   */
  public invert(): Mat4 {
    return Mat4.invert(this, this)
  }

  /**
   * Negate each component of given matrix
   *
   * @param mat - The matrix to negate
   * @param out - The matrix to write to. Leave it out or pass null to create a new matrix.
   * @returns The given `out` parameter or a new matrix
   */
  public static negate(mat: Mat4, out?: Mat4): Mat4 {
    out = out || new Mat4()
    const d = mat.m
    const o = out.m
    o[ 0] = -d[ 0]; o[ 1] = -d[ 1]; o[ 2] = -d[ 2]; o[ 3] = -d[ 3]
    o[ 4] = -d[ 4]; o[ 5] = -d[ 5]; o[ 6] = -d[ 6]; o[ 7] = -d[ 7]
    o[ 8] = -d[ 8]; o[ 9] = -d[ 9]; o[10] = -d[10]; o[11] = -d[11]
    o[12] = -d[12]; o[13] = -d[13]; o[14] = -d[14]; o[15] = -d[15]
    return out
  }

  /**
   * Negates all components of this matrix
   */
  public negate(): Mat4 {
    return Mat4.negate(this, this)
  }
  /**
   * Performs component wise addition of two matrices
   *
   * @param matA - The first matrix
   * @param matB - The second matrix
   * @param out - The matrix to write to. Leave it out or pass null to create a new matrix.
   * @returns The given `out` parameter or a new matrix
   */
  public static add(matA: Mat4, matB: Mat4, out?: Mat4): Mat4 {
    out = out || new Mat4()
    const a = matA.m
    const b = matB.m
    const c = out.m
    c[ 0] = a[ 0] + b[ 0]; c[ 1] = a[ 1] + b[ 1]; c[ 2] = a[ 2] + b[ 2]; c[ 3] = a[ 3] + b[ 3]
    c[ 4] = a[ 4] + b[ 4]; c[ 5] = a[ 5] + b[ 5]; c[ 6] = a[ 6] + b[ 6]; c[ 7] = a[ 7] + b[ 7]
    c[ 8] = a[ 8] + b[ 8]; c[ 9] = a[ 9] + b[ 9]; c[10] = a[10] + b[10]; c[11] = a[11] + b[11]
    c[12] = a[12] + b[12]; c[13] = a[13] + b[13]; c[14] = a[14] + b[14]; c[15] = a[15] + b[15]
    return out
  }

  /**
   * Performs component wise addition with another matrix.
   *
   * @param other - The matrix to add
   */
  public add(other: Mat4): this {
    const a = this.m
    const b = other.m
    a[ 0] += b[ 0]; a[ 1] += b[ 1]; a[ 2] += b[ 2]; a[ 3] += b[ 3]
    a[ 4] += b[ 4]; a[ 5] += b[ 5]; a[ 6] += b[ 6]; a[ 7] += b[ 7]
    a[ 8] += b[ 8]; a[ 9] += b[ 9]; a[10] += b[10]; a[11] += b[11]
    a[12] += b[12]; a[13] += b[13]; a[14] += b[14]; a[15] += b[15]
    return this
  }

  /**
   * Adds a scalar to each component of a matrix
   *
   * @param mat - The matrix
   * @param scalar - The scalar to add
   * @param out - The matrix to write to. Leave it out or pass null to create a new matrix.
   * @returns The given `out` parameter or a new matrix
   */
  public static addScalar(mat: Mat4, scalar: number, out?: Mat4): Mat4 {
    out = out || new Mat4()
    const a = mat.m
    const c = out.m
    c[ 0] = a[ 0] + scalar; c[ 1] = a[ 1] + scalar; c[ 2] = a[ 2] + scalar; c[ 3] = a[ 3] + scalar
    c[ 4] = a[ 4] + scalar; c[ 5] = a[ 5] + scalar; c[ 6] = a[ 6] + scalar; c[ 7] = a[ 7] + scalar
    c[ 8] = a[ 8] + scalar; c[ 9] = a[ 9] + scalar; c[10] = a[10] + scalar; c[11] = a[11] + scalar
    c[12] = a[12] + scalar; c[13] = a[13] + scalar; c[14] = a[14] + scalar; c[15] = a[15] + scalar
    return out
  }

  /**
   * Adds the given scalar to each component of `this`
   *
   * @param scalar - The scalar to add
   */
  public addScalar(s: number): this {
    const a = this.m
    a[ 0] += s; a[ 1] += s; a[ 2] += s; a[ 3] += s
    a[ 4] += s; a[ 5] += s; a[ 6] += s; a[ 7] += s
    a[ 8] += s; a[ 9] += s; a[10] += s; a[11] += s
    a[12] += s; a[13] += s; a[14] += s; a[15] += s
    return this
  }

  /**
   * Performs component wise subtraction between two matrices
   *
   * @param matA - The first matrix
   * @param matB - The second matrix
   * @param out - The matrix to write to. Leave it out or pass null to create a new matrix.
   * @returns The given `out` parameter or a new matrix
   */
  public static subtract(matA: Mat4, matB: Mat4, out?: Mat4): Mat4 {
    out = out || new Mat4()
    const a = matA.m
    const b = matB.m
    const c = out.m
    c[ 0] = a[ 0] - b[ 0]; c[ 1] = a[ 1] - b[ 1]; c[ 2] = a[ 2] - b[ 2]; c[ 3] = a[ 3] - b[ 3]
    c[ 4] = a[ 4] - b[ 4]; c[ 5] = a[ 5] - b[ 5]; c[ 6] = a[ 6] - b[ 6]; c[ 7] = a[ 7] - b[ 7]
    c[ 8] = a[ 8] - b[ 8]; c[ 9] = a[ 9] - b[ 9]; c[10] = a[10] - b[10]; c[11] = a[11] - b[11]
    c[12] = a[12] - b[12]; c[13] = a[13] - b[13]; c[14] = a[14] - b[14]; c[15] = a[15] - b[15]
    return out
  }

  /**
   * Performs component wise subtraction of given matrix from `this`
   *
   * @param other - The matrix to subtract
   */
  public subtract(other: Mat4): this {
    const a = this.m
    const b = other.m
    a[ 0] -= b[ 0]; a[ 1] -= b[ 1]; a[ 2] -= b[ 2]; a[ 3] -= b[ 3]
    a[ 4] -= b[ 4]; a[ 5] -= b[ 5]; a[ 6] -= b[ 6]; a[ 7] -= b[ 7]
    a[ 8] -= b[ 8]; a[ 9] -= b[ 9]; a[10] -= b[10]; a[11] -= b[11]
    a[12] -= b[12]; a[13] -= b[13]; a[14] -= b[14]; a[15] -= b[15]
    return this
  }

  /**
   * Subtracts a scalar from each component of a matrix
   *
   * @param mat - The matrix to subtract from
   * @param scalar - The scalar to subtract
   * @param out - The matrix to write to. Leave it out or pass null to create a new matrix.
   * @returns The given `out` parameter or a new matrix
   */
  public static subtractScalar(mat: Mat4, scalar: number, out?: Mat4): Mat4 {
    out = out || new Mat4()
    const a = mat.m
    const c = out.m
    c[ 0] = a[ 0] - scalar; c[ 1] = a[ 1] - scalar; c[ 2] = a[ 2] - scalar; c[ 3] = a[ 3] - scalar
    c[ 4] = a[ 4] - scalar; c[ 5] = a[ 5] - scalar; c[ 6] = a[ 6] - scalar; c[ 7] = a[ 7] - scalar
    c[ 8] = a[ 8] - scalar; c[ 9] = a[ 9] - scalar; c[10] = a[10] - scalar; c[11] = a[11] - scalar
    c[12] = a[12] - scalar; c[13] = a[13] - scalar; c[14] = a[14] - scalar; c[15] = a[15] - scalar
    return out
  }

  /**
   * Subtracts the given scalar from each component of `this`
   *
   * @param scalar - The scalar to subtract
   */
  public subtractScalar(s: number): this {
    const a = this.m
    a[ 0] -= s; a[ 1] -= s; a[ 2] -= s; a[ 3] -= s
    a[ 4] -= s; a[ 5] -= s; a[ 6] -= s; a[ 7] -= s
    a[ 8] -= s; a[ 9] -= s; a[10] -= s; a[11] -= s
    a[12] -= s; a[13] -= s; a[14] -= s; a[15] -= s
    return this
  }

  /**
   * Performs a matrix multiplication `matA * matB` meaning `matB` is post-multiplied on `matA`.
   *
   * @param matA - The main matrix
   * @param matB - The matrix to post-multiply
   * @param out - The matrix to write to
   * @returns The given `out` parameter or a new matrix
   */
  public static multiply(matA: Mat4, matB: Mat4, out?: Mat4): Mat4 {
    out = out || new Mat4()
    const a = matA.m
    const b = matB.m
    const c = out.m

    const a00 = a[M._00]
    const a01 = a[M._01]
    const a02 = a[M._02]
    const a03 = a[M._03]
    const a10 = a[M._10]
    const a11 = a[M._11]
    const a12 = a[M._12]
    const a13 = a[M._13]
    const a20 = a[M._20]
    const a21 = a[M._21]
    const a22 = a[M._22]
    const a23 = a[M._23]
    const a30 = a[M._30]
    const a31 = a[M._31]
    const a32 = a[M._32]
    const a33 = a[M._33]

    const b00 = b[M._00]
    const b01 = b[M._01]
    const b02 = b[M._02]
    const b03 = b[M._03]
    const b10 = b[M._10]
    const b11 = b[M._11]
    const b12 = b[M._12]
    const b13 = b[M._13]
    const b20 = b[M._20]
    const b21 = b[M._21]
    const b22 = b[M._22]
    const b23 = b[M._23]
    const b30 = b[M._30]
    const b31 = b[M._31]
    const b32 = b[M._32]
    const b33 = b[M._33]

    c[M._00] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30
    c[M._01] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31
    c[M._02] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32
    c[M._03] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33
    c[M._10] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30
    c[M._11] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31
    c[M._12] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32
    c[M._13] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33
    c[M._20] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30
    c[M._21] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31
    c[M._22] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32
    c[M._23] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33
    c[M._30] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30
    c[M._31] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31
    c[M._32] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32
    c[M._33] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33
    return out
  }

  /**
   * Performs a matrix multiplication `this = this * other` meaning `other` is post-multiplied t `this`.
   *
   * @param other - The matrix to post-multiply
   */
  public multiply(other: Mat4): this {
    const a = this.m
    const b = other.m
    const c = this.m

    const a00 = a[M._00]
    const a01 = a[M._01]
    const a02 = a[M._02]
    const a03 = a[M._03]
    const a10 = a[M._10]
    const a11 = a[M._11]
    const a12 = a[M._12]
    const a13 = a[M._13]
    const a20 = a[M._20]
    const a21 = a[M._21]
    const a22 = a[M._22]
    const a23 = a[M._23]
    const a30 = a[M._30]
    const a31 = a[M._31]
    const a32 = a[M._32]
    const a33 = a[M._33]

    const b00 = b[M._00]
    const b01 = b[M._01]
    const b02 = b[M._02]
    const b03 = b[M._03]
    const b10 = b[M._10]
    const b11 = b[M._11]
    const b12 = b[M._12]
    const b13 = b[M._13]
    const b20 = b[M._20]
    const b21 = b[M._21]
    const b22 = b[M._22]
    const b23 = b[M._23]
    const b30 = b[M._30]
    const b31 = b[M._31]
    const b32 = b[M._32]
    const b33 = b[M._33]

    c[M._00] = a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03
    c[M._01] = a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03
    c[M._02] = a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03
    c[M._03] = a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03
    c[M._10] = a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13
    c[M._11] = a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13
    c[M._12] = a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13
    c[M._13] = a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13
    c[M._20] = a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23
    c[M._21] = a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23
    c[M._22] = a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23
    c[M._23] = a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23
    c[M._30] = a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33
    c[M._31] = a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33
    c[M._32] = a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33
    c[M._33] = a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33
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
  public static premultiply(matA: Mat4, matB: Mat4, out?: Mat4): Mat4 {
    out = out || new Mat4()
    const a = matB.m
    const b = matA.m
    const c = out.m

    const a00 = a[M._00]
    const a01 = a[M._01]
    const a02 = a[M._02]
    const a03 = a[M._03]
    const a10 = a[M._10]
    const a11 = a[M._11]
    const a12 = a[M._12]
    const a13 = a[M._13]
    const a20 = a[M._20]
    const a21 = a[M._21]
    const a22 = a[M._22]
    const a23 = a[M._23]
    const a30 = a[M._30]
    const a31 = a[M._31]
    const a32 = a[M._32]
    const a33 = a[M._33]

    const b00 = b[M._00]
    const b01 = b[M._01]
    const b02 = b[M._02]
    const b03 = b[M._03]
    const b10 = b[M._10]
    const b11 = b[M._11]
    const b12 = b[M._12]
    const b13 = b[M._13]
    const b20 = b[M._20]
    const b21 = b[M._21]
    const b22 = b[M._22]
    const b23 = b[M._23]
    const b30 = b[M._30]
    const b31 = b[M._31]
    const b32 = b[M._32]
    const b33 = b[M._33]

    c[M._00] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30
    c[M._01] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31
    c[M._02] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32
    c[M._03] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33
    c[M._10] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30
    c[M._11] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31
    c[M._12] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32
    c[M._13] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33
    c[M._20] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30
    c[M._21] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31
    c[M._22] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32
    c[M._23] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33
    c[M._30] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30
    c[M._31] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31
    c[M._32] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32
    c[M._33] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33
    return out
  }

  /**
   * Performs a matrix multiplication `this = other * this` meaning `other` is pre-multiplied on `this`.
   *
   * @param other - The matrix to pre-multiply
   */
  public premultiply(other: Mat4): this {
    const a = other.m
    const b = this.m
    const c = this.m

    const a00 = a[M._00]
    const a01 = a[M._01]
    const a02 = a[M._02]
    const a03 = a[M._03]
    const a10 = a[M._10]
    const a11 = a[M._11]
    const a12 = a[M._12]
    const a13 = a[M._13]
    const a20 = a[M._20]
    const a21 = a[M._21]
    const a22 = a[M._22]
    const a23 = a[M._23]
    const a30 = a[M._30]
    const a31 = a[M._31]
    const a32 = a[M._32]
    const a33 = a[M._33]

    const b00 = b[M._00]
    const b01 = b[M._01]
    const b02 = b[M._02]
    const b03 = b[M._03]
    const b10 = b[M._10]
    const b11 = b[M._11]
    const b12 = b[M._12]
    const b13 = b[M._13]
    const b20 = b[M._20]
    const b21 = b[M._21]
    const b22 = b[M._22]
    const b23 = b[M._23]
    const b30 = b[M._30]
    const b31 = b[M._31]
    const b32 = b[M._32]
    const b33 = b[M._33]

    c[M._00] = a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03
    c[M._01] = a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03
    c[M._02] = a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03
    c[M._03] = a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03
    c[M._10] = a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13
    c[M._11] = a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13
    c[M._12] = a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13
    c[M._13] = a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13
    c[M._20] = a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23
    c[M._21] = a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23
    c[M._22] = a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23
    c[M._23] = a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23
    c[M._30] = a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33
    c[M._31] = a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33
    c[M._32] = a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33
    c[M._33] = a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33
    return this
  }

  // /**
  //  * Solves a multiplication chain of patrices
  //  *
  //  * @returns The result of the multiplication
  //  */
  // public static multiplyChain(...rest: Mat4[]): Mat4
  // public static multiplyChain() {
  //   // (a, (b, (c, (d, e))))
  //   const result: Mat4 = arguments[arguments.length - 1].clone()
  //   for (let i = arguments.length - 2; i >= 0; i--) {
  //     Mat4.multiply(arguments[i], result, result)
  //   }
  //   return result
  // }

  // /**
  //  * Solves a multiplication chain of patrices where each matrix is
  //  *
  //  * @returns The result of the multiplication
  //  */
  // public static premultiplyChain(...rest: Mat4[]): Mat4
  // public static premultiplyChain() {
  //   // ((((a, b), c), d), e)
  //   const result: Mat4 = arguments[0].clone()
  //   for (let i = 1; i < arguments.length; i += 1) {
  //     Mat4.premultiply(result, arguments[i], result)
  //   }
  //   return result
  // }

  /**
   * Multiplies a scalar with each component of a matrix
   *
   * @param matA - The matrix
   * @param scalar - The scalar to multiply with
   * @param out - The matrix to write to. Leave it out or pass null to create a new matrix.
   * @returns The given `out` parameter or a new matrix
   */
  public static multiplyScalar(matA: Mat4, scalar: number, out?: Mat4): Mat4 {
    out = out || new Mat4()
    const a = matA.m
    const b = scalar
    const c = out.m
    c[ 0] = a[ 0] * b; c[ 1] = a[ 1] * b; c[ 2] = a[ 2] * b; c[ 3] = a[ 3] * b
    c[ 4] = a[ 4] * b; c[ 5] = a[ 5] * b; c[ 6] = a[ 6] * b; c[ 7] = a[ 7] * b
    c[ 8] = a[ 8] * b; c[ 9] = a[ 9] * b; c[10] = a[10] * b; c[11] = a[11] * b
    c[12] = a[12] * b; c[13] = a[13] * b; c[14] = a[14] * b; c[15] = a[15] * b
    return out
  }

  /**
   * Multiplies each component of `this` with given scalar
   *
   * @param s - The scalar to multiply
   */
  public multiplyScalar(s: number): this {
    const a = this.m
    a[ 0] *= s; a[ 1] *= s; a[ 2] *= s; a[ 3] *= s
    a[ 4] *= s; a[ 5] *= s; a[ 6] *= s; a[ 7] *= s
    a[ 8] *= s; a[ 9] *= s; a[10] *= s; a[11] *= s
    a[12] *= s; a[13] *= s; a[14] *= s; a[15] *= s
    return this
  }

  /**
   * Divides each component of one matrix by according component of another
   *
   * @param matA - The first matrix
   * @param matB - The second matrix
   * @param out - The matrix to write to. Leave it out or pass null to create a new matrix.
   * @returns The given `out` parameter or a new matrix
   */
  public static divide(matA: Mat4, matB: Mat4, out?: Mat4): Mat4 {
    out = out || new Mat4()
    const a = matA.m
    const b = matB.m
    const c = out.m
    c[ 0] = a[ 0] / b[ 0]; c[ 1] = a[ 1] / b[ 1]; c[ 2] = a[ 2] / b[ 2]; c[ 3] = a[ 3] / b[ 3]
    c[ 4] = a[ 4] / b[ 4]; c[ 5] = a[ 5] / b[ 5]; c[ 6] = a[ 6] / b[ 6]; c[ 7] = a[ 7] / b[ 7]
    c[ 8] = a[ 8] / b[ 8]; c[ 9] = a[ 9] / b[ 9]; c[10] = a[10] / b[10]; c[11] = a[11] / b[11]
    c[12] = a[12] / b[12]; c[13] = a[13] / b[13]; c[14] = a[14] / b[14]; c[15] = a[15] / b[15]
    return out
  }

  /**
   * Divides each component of `this` matrix by its according component of the `other`
   *
   * @param other - The matrix by which to divide
   */
  public divide(other: Mat4): this {
    const a = this.m
    const b = other.m
    a[ 0] /= b[ 0]; a[ 1] /= b[ 1]; a[ 2] /= b[ 2]; a[ 3] /= b[ 3]
    a[ 4] /= b[ 4]; a[ 5] /= b[ 5]; a[ 6] /= b[ 6]; a[ 7] /= b[ 7]
    a[ 8] /= b[ 8]; a[ 9] /= b[ 9]; a[10] /= b[10]; a[11] /= b[11]
    a[12] /= b[12]; a[13] /= b[13]; a[14] /= b[14]; a[15] /= b[15]
    return this
  }

  /**
   * Divides each component of a matrix by a scalar
   *
   * @param matA - The matrix
   * @param scalar - The scalar by which to divide
   * @param out - The matrix to write to. Leave it out or pass null to create a new matrix.
   * @returns The given `out` parameter or a new matrix
   */
  public static divideScalar(matA: Mat4, scalar: number, out?: Mat4): Mat4 {
    out = out || new Mat4()
    const a = matA.m
    const b = 1 / scalar
    const c = out.m
    c[ 0] = a[ 0] * b; c[ 1] = a[ 1] * b; c[ 2] = a[ 2] * b; c[ 3] = a[ 3] * b
    c[ 4] = a[ 4] * b; c[ 5] = a[ 5] * b; c[ 6] = a[ 6] * b; c[ 7] = a[ 7] * b
    c[ 8] = a[ 8] * b; c[ 9] = a[ 9] * b; c[10] = a[10] * b; c[11] = a[11] * b
    c[12] = a[12] * b; c[13] = a[13] * b; c[14] = a[14] * b; c[15] = a[15] * b
    return out
  }

  /**
   * Divides each component of `this` matrix by a scalar
   *
   * @param s - The scalar by which to divide
   */
  public divideScalar(s: number): this {
    const a = this.m
    const b = 1.0 / s
    a[ 0] *= b; a[ 1] *= b; a[ 2] *= b; a[ 3] *= b
    a[ 4] *= b; a[ 5] *= b; a[ 6] *= b; a[ 7] *= b
    a[ 8] *= b; a[ 9] *= b; a[10] *= b; a[11] *= b
    a[12] *= b; a[13] *= b; a[14] *= b; a[15] *= b
    return this
  }

  /**
   * Transform the given point with projective division.
   *
   * @remarks
   * The given point is interpreted as a homogeneous column `(x, y, 0, 1)`
   * and is multiplied with this matrix. Finally a division by `w`
   * is performed if necessary to convert back to nonhomogeneous
   * representation
   */
  public transformP2<T extends IVec2>(vec: T): T
  /**
   * Transform the given point with projective division but writes the result into `out`
   *
   * @remarks
   * The given point is interpreted as a homogeneous column `(x, y, 0, 1)`
   * and is multiplied with this matrix. Finally a division by `w`
   * is performed if necessary to convert back to nonhomogeneous
   * representation
   *
   * @returns the given `out` parameter or a new vector
   */
  public transformP2<T extends IVec2, O>(vec: T, out: O): O & IVec2
  public transformP2(vec: IVec2, out?: IVec2): IVec2 {
    const x = vec.x
    const y = vec.y
    const w = 1
    const d = this.m
    out = out || vec
    out.x = x * d[0] + y * d[4] + w * d[12]
    out.y = x * d[1] + y * d[5] + w * d[13]
    let wp = x * d[3] + y * d[7] + w * d[15]
    if (wp !== 1) {
      out.x /= wp
      out.y /= wp
    }
    return vec
  }

  /**
   * Transform the given point with projective division.
   *
   * @remarks
   * The given point is interpreted as a homogeneous column `(x, y, z, 1)`
   * and is multiplied with this matrix. Finally a division by `w`
   * is performed if necessary to convert back to nonhomogeneous
   * representation
   */
  public transformP3<T extends IVec3>(vec: T): T
  /**
   * Transform the given point with projective division but writes the result into `out`
   *
   * @remarks
   * The given point is interpreted as a homogeneous column `(x, y, z, 1)`
   * and is multiplied with this matrix. Finally a division by `w`
   * is performed if necessary to convert back to nonhomogeneous
   * representation
   *
   * @returns the given `out` parameter or a new vector
   */
  public transformP3<T extends IVec3, O>(vec: T, out: O): O & IVec3
  public transformP3(vec: IVec3, out?: IVec3): IVec3 {
    const x = vec.x
    const y = vec.y
    const z = vec.z
    const w = 1
    const d = this.m
    out = out || vec
    out.x = x * d[M._00] + y * d[M._10] + z * d[M._20] + w * d[M._30]
    out.y = x * d[M._01] + y * d[M._11] + z * d[M._21] + w * d[M._31]
    out.z = x * d[M._02] + y * d[M._12] + z * d[M._22] + w * d[M._32]
    let wp = x * d[M._03] + y * d[M._13] + z * d[M._23] + w * d[M._33]
    if (wp !== 1) {
      out.x /= wp
      out.y /= wp
      out.z /= wp
    }
    return vec
  }

  /**
   * Transform the given vector skipping projective division.
   *
   * @remarks
   * The given point is interpreted as a homogeneous column `(x, y, 0, 1)`
   * and is multiplied with this matrix. Division by `w` is entirely skipped.
   */
  public transformV2<T extends IVec2>(vec: T): T
  /**
   * Transform the given vector skipping projective division and writes the result into `out`
   *
   * @remarks
   * The given point is interpreted as a homogeneous column `(x, y, 0, 1)`
   * and is multiplied with this matrix. Division by `w` is entirely skipped.
   */
  public transformV2<T extends IVec2, O>(vec: T, out: O): O & IVec2
  public transformV2(vec: IVec2, out?: IVec2): IVec2 {
    const x = vec.x
    const y = vec.y
    const w = 1
    const d = this.m
    out = out || vec
    out.x = x * d[0] + y * d[4] + w * d[12]
    out.y = x * d[1] + y * d[5] + w * d[13]
    return vec
  }

  /**
   * Transform the given vector skipping projective division.
   *
   * @remarks
   * The given point is interpreted as a homogeneous column `(x, y, z, 1)`
   * and is multiplied with this matrix. Division by `w` is entirely skipped.
   */
  public transformV3<T extends IVec3>(vec: T): T
  /**
   * Transform the given vector skipping projective division and writes the result into `out`
   *
   * @remarks
   * The given point is interpreted as a homogeneous column `(x, y, z, 1)`
   * and is multiplied with this matrix. Division by `w` is entirely skipped.
   */
  public transformV3<T extends IVec3, O>(vec: T, out: O): O & IVec3
  public transformV3(vec: IVec3, out?: IVec3): IVec3 {
    const x = vec.x
    const y = vec.y
    const z = vec.z
    const w = 1
    const d = this.m
    out = out || vec
    out.x = x * d[M._00] + y * d[M._10] + z * d[M._20] + w * d[M._30]
    out.y = x * d[M._01] + y * d[M._11] + z * d[M._21] + w * d[M._31]
    out.z = x * d[M._02] + y * d[M._12] + z * d[M._22] + w * d[M._32]
    return vec
  }

  /**
   * Transform the given vector skipping projective division.
   */
  public transformV4<T extends IVec4>(vec: T): T
  /**
   * Transform the given vector but writes the result into another
   */
  public transformV4<T extends IVec4, O>(vec: T, out: O): O & IVec4
  public transformV4(vec: IVec4, out?: IVec4): IVec4 {
    const x = vec.x
    const y = vec.y
    const z = vec.z
    const w = vec.w
    const d = this.m
    out = out || vec
    out.x = x * d[M._00] + y * d[M._10] + z * d[M._20] + w * d[M._30]
    out.y = x * d[M._01] + y * d[M._11] + z * d[M._21] + w * d[M._31]
    out.z = x * d[M._02] + y * d[M._12] + z * d[M._22] + w * d[M._32]
    out.w = x * d[M._03] + y * d[M._13] + z * d[M._23] + w * d[M._33]
    return vec
  }

  /**
   * Transforms the given vector ignoring the translation
   */
  public transformV2Normal<T extends IVec2>(vec: T): T
  /**
   * Transforms the given vector ignoring the translation. Writes the result to `out` parameter
   */
  public transformV2Normal<T extends IVec2, O>(vec: T, out: O): O & IVec2
  public transformV2Normal<T extends IVec2>(vec: T, out?: IVec2): T {
    const x = vec.x || 0
    const y = vec.y || 0
    const d = this.m
    out = out || vec
    out.x = x * d[M._00] + y * d[M._10]
    out.y = x * d[M._01] + y * d[M._11]
    return vec
  }

  /**
   * Transforms the given vector ignoring the translation
   */
  public transformV3Normal<T extends IVec3>(vec: T): T
  /**
   * Transforms the given vector ignoring the translation. Writes the result to `out` parameter
   */
  public transformV3Normal<T extends IVec3, O>(vec: T, out: O): O & IVec3
  public transformV3Normal<T extends IVec3>(vec: T, out?: IVec3): T {
    const x = vec.x || 0
    const y = vec.y || 0
    const z = vec.z || 0
    const d = this.m
    out = out || vec
    out.x = x * d[M._00] + y * d[M._10] + z * d[M._20]
    out.y = x * d[M._01] + y * d[M._11] + z * d[M._21]
    out.z = x * d[M._02] + y * d[M._12] + z * d[M._22]
    return vec
  }

  /**
   * Walks through the array and transforms 2 component vectors
   *
   * @param array - The array to transform
   * @param offset - Offset in array where to start
   * @param stride - Number of components to step with each iteration
   * @param count - Number of vector elements to transform
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
      array[offset] = x * d[0] + y * d[4] + d[8] + d[12]
      array[offset + 1] = x * d[1] + y * d[5] + d[9] + d[13]
      offset += stride
    }
  }

  /**
   * Walks through the array and transforms 3 component vectors
   *
   * @param array - The array to transform
   * @param offset - Offset in array where to start
   * @param stride - Number of components to step with each iteration
   * @param count - Number of vector elements to transform
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
      array[offset] = x * d[0] + y * d[4] + z * d[8] + d[12]
      array[offset + 1] = x * d[1] + y * d[5] + z * d[9] + d[13]
      array[offset + 2] = x * d[2] + y * d[6] + z * d[10] + d[14]
      offset += stride
    }
  }

  /**
   * Walks through the array and transforms 4 component vectors
   *
   * @param array - The array to transform
   * @param offset - Offset in array where to start
   * @param stride - Number of components to step with each iteration
   * @param count - Number of vector elements to transform
   */
  public transformV4Array(array: ArrayLike<number>, offset?: number, stride?: number, count?: number) {
    let x
    let y
    let z
    let w
    const d = this.m
    offset = offset || 0
    stride = stride == null ? 4 : stride
    count = count == null ? array.length / stride : count

    while (count > 0) {
      count--
      x = array[offset]
      y = array[offset + 1]
      z = array[offset + 2]
      w = array[offset + 3]
      array[offset] = x * d[0] + y * d[4] + z * d[8] + w * d[12]
      array[offset + 1] = x * d[1] + y * d[5] + z * d[9] + w * d[13]
      array[offset + 2] = x * d[2] + y * d[6] + z * d[10] + w * d[14]
      array[offset + 3] = x * d[3] + y * d[7] + z * d[11] + w * d[15]
      offset += stride
    }
  }

  /**
   * Walks through the array and transforms 3 component normals
   *
   * @param array - The array to transform
   * @param offset - Offset in array where to start
   * @param stride - Number of components to step with each iteration
   * @param count - Number of vector elements to transform
   */
  public transformV2NormalArray(array: ArrayLike<number>, offset?: number, stride?: number, count?: number) {
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
      array[offset] = x * d[0] + y * d[4]
      array[offset + 1] = x * d[1] + y * d[5]
      offset += stride
    }
  }

  /**
   * Walks through the array and transforms 3 component normals
   *
   * @param array - The array to transform
   * @param offset - Offset in array where to start
   * @param stride - Number of components to step with each iteration
   * @param count - Number of vector elements to transform
   */
  public transformV3NormalArray(array: ArrayLike<number>, offset?: number, stride?: number, count?: number) {
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
      array[offset] = x * d[0] + y * d[4] + z * d[8]
      array[offset + 1] = x * d[1] + y * d[5] + z * d[9]
      array[offset + 2] = x * d[2] + y * d[6] + z * d[10]
      offset += stride
    }
  }

  /**
   * Performs a linear interpolation between two matrices
   *
   * @param matA - The first matrix
   * @param matB - The second matrix
   * @param t - The interpolation value. This is assumed to be in [0:1] range
   * @param out - The matrix to write to. Leave it out or pass null to create a new matrix.
   * @returns The given `out` parameter or a new matrix
   */
  public static lerp(matA: Mat4, matB: Mat4, t: number, out?: Mat4): Mat4 {
    out = out || new Mat4()
    const a = matA.m
    const b = matB.m
    const c = out.m
    const t1 = 1 - t
    c[M._00] = t1 * a[M._00] + t * b[M._00]
    c[M._01] = t1 * a[M._01] + t * b[M._01]
    c[M._02] = t1 * a[M._02] + t * b[M._02]
    c[M._03] = t1 * a[M._03] + t * b[M._03]
    c[M._10] = t1 * a[M._10] + t * b[M._10]
    c[M._11] = t1 * a[M._11] + t * b[M._11]
    c[M._12] = t1 * a[M._12] + t * b[M._12]
    c[M._13] = t1 * a[M._13] + t * b[M._13]
    c[M._20] = t1 * a[M._20] + t * b[M._20]
    c[M._21] = t1 * a[M._21] + t * b[M._21]
    c[M._22] = t1 * a[M._22] + t * b[M._22]
    c[M._23] = t1 * a[M._23] + t * b[M._23]
    c[M._30] = t1 * a[M._30] + t * b[M._30]
    c[M._31] = t1 * a[M._31] + t * b[M._31]
    c[M._32] = t1 * a[M._32] + t * b[M._32]
    c[M._33] = t1 * a[M._33] + t * b[M._33]
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
  public static smooth(matA: Mat4, matB: Mat4, t: number, out?: Mat4): Mat4 {
    t = ((t > 1) ? 1 : ((t < 0) ? 0 : t))
    t = t * t * (3 - 2 * t)
    return Mat4.lerp(matA, matB, t, out)
  }

  /**
   * Creates a copy of this matrix
   * @returns The cloned matrix.
   */
  public static clone(mat: Mat4, out: Mat4 = new Mat4()): Mat4 {
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
    o[9] = d[9]
    o[10] = d[10]
    o[11] = d[11]
    o[12] = d[12]
    o[13] = d[13]
    o[14] = d[14]
    o[15] = d[15]
    return out
  }

  /**
   * Creates a copy of this matrix
   * @returns The cloned matrix.
   */
  public clone(out: Mat4 = new Mat4()): Mat4 {
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
    o[9] = d[9]
    o[10] = d[10]
    o[11] = d[11]
    o[12] = d[12]
    o[13] = d[13]
    o[14] = d[14]
    o[15] = d[15]
    return out
  }

  /**
   * Checks for component wise equality with given matrix
   *
   * @param other - The matrix to compare with
   */
  public static equals(m1: Mat4, m2: Mat4): boolean {
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
      a[8] === b[8] &&
      a[9] === b[9] &&
      a[10] === b[10] &&
      a[11] === b[11] &&
      a[12] === b[12] &&
      a[13] === b[13] &&
      a[14] === b[14] &&
      a[15] === b[15]
  }

  /**
   * Checks for component wise equality with given matrix
   *
   * @param other - The matrix to compare with
   */
  public equals(other: Mat4): boolean {
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
      a[8] === b[8] &&
      a[9] === b[9] &&
      a[10] === b[10] &&
      a[11] === b[11] &&
      a[12] === b[12] &&
      a[13] === b[13] &&
      a[14] === b[14] &&
      a[15] === b[15]
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
    return Mat4.format(this, fractionDigits)
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
  public static format(mat: Mat4, fractionDigits: number = 5) {
    const m = mat.m
    return [
      [m[0].toFixed(fractionDigits), m[4].toFixed(fractionDigits), m[8].toFixed(fractionDigits), m[12].toFixed(fractionDigits)].join(','),
      [m[1].toFixed(fractionDigits), m[5].toFixed(fractionDigits), m[9].toFixed(fractionDigits), m[13].toFixed(fractionDigits)].join(','),
      [m[2].toFixed(fractionDigits), m[6].toFixed(fractionDigits), m[10].toFixed(fractionDigits), m[14].toFixed(fractionDigits)].join(','),
      [m[3].toFixed(fractionDigits), m[7].toFixed(fractionDigits), m[11].toFixed(fractionDigits), m[15].toFixed(fractionDigits)].join(','),
    ].join(',\n')
  }

  /**
   * Returns a copy of given matrix as plain array
   */
  public static toArray(mat: Mat4): number[]
  /**
   * Copies the given matrix into a given array starting at given offset
   *
   * @param array - The array to copy into
   * @param offset - Zero based index where to start writing in the array
   */
  public static toArray<T>(mat: Mat4, array: T, offset?: number): T
  public static toArray(mat: Mat4, array?: number[], offset?: number): number[] {
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
    array[offset + 9] = d[9]
    array[offset + 10] = d[10]
    array[offset + 11] = d[11]
    array[offset + 12] = d[12]
    array[offset + 13] = d[13]
    array[offset + 14] = d[14]
    array[offset + 15] = d[15]
    return array
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
    return Mat4.toArray(this, array, offset)
  }
}
