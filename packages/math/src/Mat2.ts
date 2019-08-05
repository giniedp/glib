import { ArrayLike, IVec2, IVec3, IVec4 } from './Types'
import { Vec2 } from './Vec2'

const enum M {
 _00 = 0, _10 = 2,
 _01 = 1, _11 = 3,
}

/**
 * A 2x2 matrix using column major layout
 *
 * @public
 * @remarks
 * The matrix stores its values in a typed `Float32Array` array.
 * The elements are laid out in column major order meaning that
 * elements of each base vector reside next to each other.
 */
export class Mat2 {

  /**
   * The matrix data array
   */
  public readonly m: Float32Array | Float64Array

  /**
   * Gets and sets value at column 0 row 0
   */
  public get m00() {
    return this.m[0]
  }
  public set m00(v: number) {
    this.m[0] = v
  }

  /**
   * Gets and sets value at column 0 row 1
   */
  public get m01() {
    return this.m[1]
  }
  public set m01(v: number) {
    this.m[1] = v
  }

  /**
   * Gets and sets value at column 1 row 0
   */
  public get m10() {
    return this.m[2]
  }
  public set m10(v: number) {
    this.m[2] = v
  }

  /**
   * Gets and sets value at column 1 row 1
   */
  public get m11() {
    return this.m[3]
  }
  public set m11(v: number) {
    this.m[3] = v
  }

  /**
   * Constructs a new instance of {@link Mat2}
   *
   * @param m - the data to initialize with
   */
  constructor(m?: number[] | Float32Array | Float64Array) {
    if (Array.isArray(m)) {
      this.m = new Float32Array(m)
    } else {
      this.m = m || new Float32Array(4)
    }
  }

  /**
   * Gets the scale part as a new vector
   */
  public getScale(): Vec2
  /**
   * Gets the scale part into an existing vector
   */
  public getScale<T>(out?: T): T & IVec2
  public getScale(out?: Vec2): Vec2 {
    out = out || new Vec2()
    out.x = this.m[M._00]
    out.y = this.m[M._11]
    return out
  }

  /**
   * Sets the scale part
   */
  public setScale(x: number, y: number): this {
    this.m[M._00] = x
    this.m[M._11] = y
    return this
  }

  /**
   * Sets the scale part
   */
  public setScaleV(vec: IVec2): this {
    this.m[M._00] = vec.x
    this.m[M._11] = vec.y
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
   * Creates a matrix by reading the arguments in column major order
   */
  public static create(
    m0: number, m1: number, m2: number, m3: number,
  ): Mat2 {
    const out = new Mat2()
    const d = out.m
    d[ 0] = m0; d[ 1] = m1
    d[ 2] = m2; d[ 3] = m3
    return out
  }

  /**
   * Initializes the matrix by reading the arguments in column major order
   */
  public init(
    m0: number, m1: number,
    m2: number, m3: number,
  ): this {
    const d = this.m
    d[0] = m0
    d[1] = m1
    d[2] = m2
    d[3] = m3
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
    m0: number, m2: number,
    m1: number, m3: number,
  ): Mat2 {
    const out = new Mat2()
    const d = out.m
    d[ 0] = m0; d[ 1] = m1
    d[ 2] = m2; d[ 3] = m3
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
    m0: number, m2: number,
    m1: number, m3: number,
  ): this {
    const d = this.m
    d[0] = m0; d[1] = m1
    d[2] = m2; d[3] = m3
    return this
  }

  /**
   * Crates a matrix with all components initialized to given value
   *
   * @param number - The number to set all matrix components to.
   */
  public static createWith(value: number): Mat2 {
    return new Mat2().initWith(value)
  }

  /**
   * Initializes all components with given value
   *
   * @param number - The number to set all matrix components to.
   */
  public initWith(value: number): this {
    const d = this.m
    d[0] = value; d[1] = value
    d[2] = value; d[3] = value
    return this
  }

  /**
   * Creates a new matrix that is initialized to identity
   *
   * @returns a new matrix
   */
  public static createIdentity(): Mat2 {
    return new Mat2().initIdentity()
  }

  /**
   * Initializes the components of this matrix to the identity.
   */
  public initIdentity(): this {
    const d = this.m
    d[0] = 1; d[1] = 0
    d[2] = 0; d[3] = 1
    return this
  }

  /**
   * Creates a new matrix with all components set to 0
   */
  public static createZero(): Mat2 {
    return new Mat2()
  }

  /**
   * Initializes the components of this matrix to 0.
   */
  public initZero(): this {
    const d = this.m
    d[0] = 0
    d[1] = 0
    d[2] = 0
    d[3] = 0
    return this
  }

  /**
   * Creates a new matrix from another.
   */
  public static createFrom(other: Mat2): Mat2 {
    return new Mat2().initFrom(other)
  }

  /**
   * Initializes this matrix from another matrix.
   */
  public initFrom(other: Mat2): this {
    const a = this.m
    const b = other.m
    a[0] = b[0]
    a[1] = b[1]
    a[2] = b[2]
    a[3] = b[3]
    return this
  }

  /**
   * Reads a array starting at given offset and initializes the elements of this matrix.
   */
  public static createFromArray(array: ArrayLike<number>, offset?: number): Mat2 {
    return new Mat2().initFromArray(array, offset)
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
    return this
  }

  /**
   * Creates a matrix from given quaternion parameters
   *
   * @param x - x component of the quaternion
   * @param y - y component of the quaternion
   * @param z - z component of the quaternion
   * @param w - w component of the quaternion
   */
  public static createFromQuat(q: IVec4): Mat2 {
    return new Mat2().initFromQuaternion(q.x, q.y, q.z, q.w)
  }

  /**
   * Initializes this matrix from given quaternion.
   *
   * @param q - The quaternion
   */
  public initFromQuat(q: IVec4): Mat2 {
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
  public static createFromQuaternion(x: number, y: number, z: number, w: number): Mat2 {
    return new Mat2().initFromQuaternion(x, y, z, w)
  }

  /**
   * Initializes this matrix from given quaternion parameters
   *
   * @param x - x component of the quaternion
   * @param y - y component of the quaternion
   * @param z - z component of the quaternion
   * @param w - w component of the quaternion
   */
  public initFromQuaternion(x: number, y: number, z: number, w: number): Mat2 {
    const xx = x * x
    const yy = y * y
    const zz = z * z
    const xy = x * y
    const zw = z * w
    return this.initRowMajor(
      1 - 2 * (yy + zz), 2 * (xy - zw),
      2 * (xy + zw), 1 - 2 * (zz + xx),
    )
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

    const r00 = 1 - 2 * (yy + zz)
    const r01 = 2 * (xy + zw)

    const r10 = 2 * (xy - zw)
    const r11 = 1 - 2 * (zz + xx)

    const m = this.m
    const m00 = m[0]
    const m01 = m[1]
    const m10 = m[2]
    const m11 = m[3]

    m[0] = r00 * m00 + r01 * m10
    m[1] = r00 * m01 + r01 * m11
    m[2] = r10 * m00 + r11 * m10
    m[3] = r10 * m01 + r11 * m11

    return this
  }

  /**
   * Creates a rotation matrix from an axis and angle
   *
   * @param axis - normalized rotation axis vector
   * @param angle - rotation angle in rad
   */
  public static createAxisAngleV(axis: IVec2 | IVec3, angle: number): Mat2 {
    return new Mat2().initAxisAngle(axis.x, axis.y, (axis as any).z || 0, angle)
  }

  /**
   * Initializes this matrix to a rotation matrix defined by given axis vector and angle.
   *
   * @param axis - normalized rotation axis vector
   * @param angle - rotation angle in rad
   */
  public initAxisAngleV(axis: IVec2 | IVec3, angle: number): this {
    return this.initAxisAngle(axis.x, axis.y, (axis as any).z || 0, angle)
  }

  /**
   * Applies a rotation around the given axis and angle
   *
   * @param axis - normalized rotation axis vector
   * @param angle - rotation angle in rad
   */
  public rotateAxisAngleV(axis: IVec2 | IVec3, angle: number): this {
    return this.rotateAxisAngle(axis.x, axis.y, (axis as any).z, angle)
  }

  /**
   * Creates a rotation matrix from axis angle parameters
   *
   * @param x - x component of the normalized rotation axis
   * @param y - y component of the normalized rotation axis
   * @param z - z component of the normalized rotation axis
   * @param angle - rotation angle in rad
   */
  public static createAxisAngle(x: number, y: number, z: number, angle: number): Mat2 {
    return new Mat2().initAxisAngle(x, y, z, angle)
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
    const yy = y * y
    const zz = z * z
    const xy = x * y
    const zw = z * w

    return this.initRowMajor(
      1 - 2 * (yy + zz), 2 * (xy - zw),
      2 * (xy + zw), 1 - 2 * (zz + xx),
    )
  }

  /**
   * Applies a rotation around the given axis and angle
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

    const r00 = 1 - 2 * (yy + zz)
    const r01 = 2 * (xy + zw)

    const r10 = 2 * (xy - zw)
    const r11 = 1 - 2 * (zz + xx)

    const m = this.m
    const m00 = m[0]
    const m01 = m[1]
    const m10 = m[2]
    const m11 = m[3]

    m[0] = r00 * m00 + r01 * m10
    m[1] = r00 * m01 + r01 * m11
    m[2] = r10 * m00 + r11 * m10
    m[3] = r10 * m01 + r11 * m11

    return this
  }

  /**
   * Creates a new rotation matrix
   */
  public static createRotationX(rad: number): Mat2 {
    return new Mat2().initRotationX(rad)
  }

  /**
   * Initializes this matrix with a rotation around the X axis.
   *
   * @param angle - angle in rad
   */
  public initRotationX(angle: number): this {
    const m = this.m
    m[0] = 1; m[2] = 0
    m[1] = 0; m[3] = Math.cos(angle)
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
    const m10 = m[2]
    const m11 = m[3]
    const c = Math.cos(angle)

    m[2]  = c * m10
    m[3]  = c * m11

    return this
  }

  /**
   * Creates a new rotation matrix
   */
  public static createRotationY(rad: number): Mat2 {
    return new Mat2().initRotationY(rad)
  }

  /**
   * Initializes this matrix with a rotation around the Y axis.
   *
   * @param angle - angle in rad
   */
  public initRotationY(angle: number): this {
    const cos = Math.cos(angle)
    const m = this.m
    m[0] = cos;  m[2] = 0
    m[1] = 0;    m[3] = 1
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
    const m00 = m[0]
    const m01 = m[1]
    const c = Math.cos(angle)

    m[0] = c * m00
    m[1] = c * m01

    return this
  }

  /**
   * Creates a new rotation matrix
   */
  public static createRotationZ(rad: number): Mat2 {
    return new Mat2().initRotationZ(rad)
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
    m[0] = cos; m[2] = -sin
    m[1] = sin; m[3] =  cos
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

    return this
  }

  /**
   * Creates a new matrix with a predefined scale
   */
  public static createScale(x: number, y: number): Mat2 {
    return new Mat2().initScale(x, y)
  }

  /**
   * Initializes a scale matrix
   *
   * @param x - x scale factor
   * @param y - y scale factor
   * @param z - z scale factor
   */
  public initScale(x: number, y: number): this {
    const m = this.m
    m[0] = x; m[2] = 0
    m[1] = 0; m[3] = y
    return this
  }

  /**
   * Applies a scale to this matrix
   *
   * @param x - x scale factor
   * @param y - y scale factor
   */
  public scale(x: number, y: number): this {
    const m = this.m
    m[M._00] *= x
    m[M._01] *= x
    m[M._10] *= y
    m[M._11] *= y
    return this
  }

  /**
   * Creates a new matrix with a predefined scale
   */
  public static createScaleV(vec: IVec2): Mat2 {
    return new Mat2().initScale(vec.x, vec.y)
  }

  /**
   * Initializes a scale matrix
   *
   * @param vec - The scale vector
   */
  public initScaleV(vec: IVec2): this {
    const m = this.m
    m[0] = vec.x; m[2] = 0
    m[1] = 0; m[3] = vec.y
    return this
  }

  /**
   * Applies a scale to this matrix
   *
   * @param scale - the scale vector
   */
  public scaleV(scale: IVec2): this {
    const x = scale.x
    const y = scale.y
    const m = this.m
    m[M._00] *= x
    m[M._01] *= x
    m[M._10] *= y
    m[M._11] *= y
    return this
  }

  /**
   * Creates a new matrix with a predefined scale
   */
  public static createScaleUniform(scale: number): Mat2 {
    return new Mat2().initScale(scale, scale)
  }

  /**
   * Initializes a scale matrix
   *
   * @param scale - The uniform scale value
   */
  public initScaleUniform(scale: number): this {
    const m = this.m
    m[0] = scale; m[2] = 0
    m[1] = 0; m[3] = scale
    return this
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
    return this
  }

  /**
   * Creates a copy of this matrix
   * @returns The cloned matrix.
   */
  public clone(): Mat2 {
    const d = this.m
    return new Mat2().init(d[0], d[1], d[2], d[3])
  }

  /**
   * Calculates the determinant of a matrix
   */
  public static determinant(mat: Mat2): number {
    const a = mat.m

    const a11 = a[0]
    const a12 = a[1]

    const a21 = a[2]
    const a22 = a[3]

    return a11 * a22 - a12 * a21
  }

  /**
   * Calculates the determinant of this matrix
   */
  public determinant(): number {
    const a = this.m

    const a11 = a[0]
    const a12 = a[1]

    const a21 = a[2]
    const a22 = a[3]

    return a11 * a22 - a12 * a21
  }

  /**
   * Transpose the given matrix
   * @param mat - The matrix to transpose
   * @param out - The matrix to write to
   * @returns The given `out` parameter or a new matrix
   */
  public static transpose(mat: Mat2, out?: Mat2): Mat2 {
    const d = mat.m
    return (out || new Mat2()).init(
      d[0], d[2],
      d[1], d[3],
    )
  }

  /**
   * Transposes this matrix
   */
  public transpose(): this {
    const m = this.m
    let t
    t = m[1]
    m[1] = m[2]
    m[2] = t
    return this
  }

  /**
   * Invert the given matrix
   * @param mat - The matrix to transpose
   * @param out - The matrix to write to
   * @returns The given `out` parameter or a new matrix
   */
  public static invert(mat: Mat2, out?: Mat2): Mat2 {
    out = out || new Mat2()

    const a = mat.m
    const b = out.m

    const a11 = a[0]; const a12 = a[2]
    const a21 = a[1]; const a22 = a[3]

    const detInv = 1 / (a11 * a22 - a12 * a21)

    b[0] =  detInv * a22; b[2] = -detInv * a12
    b[1] = -detInv * a21; b[3] =  detInv * a11

    return out
  }

  /**
   * Inverts this matrix
   */
  public invert(): this {
    const a = this.m
    const b = this.m

    const a11 = a[0]; const a12 = a[2]
    const a21 = a[1]; const a22 = a[3]

    const detInv = 1 / (a11 * a22 - a12 * a21)

    b[0] =  detInv * a22; b[2] = -detInv * a12
    b[1] = -detInv * a21; b[3] =  detInv * a11

    return this
  }

  /**
   * Negate the components of the given matrix
   * @param mat - The matrix to transpose
   * @param out - The matrix to write to
   * @returns The given `out` parameter or a new matrix
   */
  public static negate(mat: Mat2, out?: Mat2): Mat2 {
    out = out || new Mat2()
    const d = mat.m
    const o = out.m
    o[ 0] = -d[ 0]; o[ 1] = -d[ 1]
    o[ 2] = -d[ 2]; o[ 3] = -d[ 3]
    return out
  }

  /**
   * Negates all components of this matrix
   */
  public negate(): this {
    const a = this.m
    const b = this.m
    a[ 0] = -b[ 0]; a[ 1] = -b[ 1]
    a[ 2] = -b[ 2]; a[ 3] = -b[ 3]
    return this
  }

  /**
   * Adds a matrix to another
   * @param matA - The first matrix
   * @param matB - The second matrix
   * @param out - The matrix to write to
   * @returns The given `out` parameter or a new matrix
   */
  public static add(matA: Mat2, matB: Mat2, out?: Mat2): Mat2 {
    out = out || new Mat2()
    const a = matA.m
    const b = matB.m
    const c = out.m
    c[ 0] = a[ 0] + b[ 0]; c[ 1] = a[ 1] + b[ 1]
    c[ 2] = a[ 2] + b[ 2]; c[ 3] = a[ 3] + b[ 3]
    return out
  }

  /**
   * Adds the given matrix to `this`
   * @param other - The matrix to add
   */
  public add(other: Mat2): this {
    const a = this.m
    const b = other.m
    a[ 0] += b[ 0]; a[ 1] += b[ 1]
    a[ 2] += b[ 2]; a[ 3] += b[ 3]
    return this
  }

  /**
   * Adds a scalar to each component of a matrix
   * @param mat - The matrix
   * @param scalar - The scalar to add
   * @param out - The matrix to write to
   * @returns The given `out` parameter or a new matrix
   */
  public static addScalar(mat: Mat2, scalar: number, out?: Mat2): Mat2 {
    out = out || new Mat2()
    const a = mat.m
    const c = out.m
    c[ 0] = a[ 0] + scalar; c[ 1] = a[ 1] + scalar
    c[ 2] = a[ 2] + scalar; c[ 3] = a[ 3] + scalar
    return out
  }

  /**
   * Adds the given scalar to each component of `this`
   * @param scalar - The scalar to add
   */
  public addScalar(s: number): this {
    const a = this.m
    a[ 0] += s; a[ 1] += s
    a[ 2] += s; a[ 3] += s
    return this
  }

  /**
   * Subtracts the second matrix from the first
   * @param matA - The first matrix
   * @param matB - The second matrix
   * @param out - The matrix to write to
   * @returns The given `out` parameter or a new matrix
   */
  public static subtract(matA: Mat2, matB: Mat2, out?: Mat2): Mat2 {
    out = out || new Mat2()
    const a = matA.m
    const b = matB.m
    const c = out.m
    c[ 0] = a[ 0] - b[ 0]; c[ 1] = a[ 1] - b[ 1]
    c[ 2] = a[ 2] - b[ 2]; c[ 3] = a[ 3] - b[ 3]
    return out
  }

  /**
   * Subtracts the given matrix from `this`
   * @param other - The matrix to subtract
   */
  public subtract(other: Mat2): this {
    const a = this.m
    const b = other.m
    a[ 0] -= b[ 0]; a[ 1] -= b[ 1]
    a[ 2] -= b[ 2]; a[ 3] -= b[ 3]
    return this
  }

  /**
   * Subtracts a scalar from each component of a matrix
   * @param mat - The matrix to subtract from
   * @param scalar - The scalar to subtract
   * @param out - The matrix to write to
   * @returns The given `out` parameter or a new matrix
   */
  public static subtractScalar(mat: Mat2, scalar: number, out?: Mat2): Mat2 {
    out = out || new Mat2()
    const a = mat.m
    const c = out.m
    c[ 0] = a[ 0] - scalar; c[ 1] = a[ 1] - scalar
    c[ 2] = a[ 2] - scalar; c[ 3] = a[ 3] - scalar
    return out
  }

  /**
   * Subtracts the given scalar from each component of `this`
   * @param scalar - The scalar to subtract
   */
  public subtractScalar(s: number): this {
    const a = this.m
    a[ 0] -= s; a[ 1] -= s
    a[ 2] -= s; a[ 3] -= s
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
  public static multiply(matA: Mat2, matB: Mat2, out?: Mat2): Mat2 {
    out = out || new Mat2()
    const a = matA.m
    const b = matB.m
    const c = out.m
    // tslint:disable
    const a_0 = a[ 0], a_1 = a[ 1],
          a_2 = a[ 2], a_3 = a[ 3]
    const b_0 = b[ 0], b_1 = b[ 1],
          b_2 = b[ 2], b_3 = b[ 3]
    // tslint:enable
    c[0] = b_0 * a_0 + b_1 * a_2
    c[1] = b_0 * a_1 + b_1 * a_3
    c[2] = b_2 * a_0 + b_3 * a_2
    c[3] = b_2 * a_1 + b_3 * a_3
    return out
  }

  /**
   * Performs a matrix multiplication `this = this * other` meaning `other` is post-multiplied t `this`.
   *
   * @param other - The matrix to post-multiply
   */
  public multiply(other: Mat2): this {
    const a = this.m
    const b = other.m
    const c = this.m
    // tslint:disable
    const a_0 = a[ 0], a_1 = a[ 1],
          a_2 = a[ 2], a_3 = a[ 3]
    const b_0 = b[ 0], b_1 = b[ 1],
          b_2 = b[ 2], b_3 = b[ 3]
    // tslint:enable
    c[0] = b_0 * a_0 + b_1 * a_2
    c[1] = b_0 * a_1 + b_1 * a_3
    c[2] = b_2 * a_0 + b_3 * a_2
    c[3] = b_2 * a_1 + b_3 * a_3
    return this
  }

  // /**
  //  * Multiplies a chain of matrices
  //  * @returns The result of the multiplication
  //  */
  // public static multiplyChain(...rest: Mat2[]) {
  //   // ((((a, b), c), d), e)
  //   const result = arguments[0].clone()
  //   for (let i = 1; i < arguments.length; i += 1) {
  //     Mat2.multiply(result, arguments[i], result)
  //   }
  //   return result
  // }

  /**
   * Performs a matrix multiplication `matB * matA` meaning `matB` is pre-multiplied on `matA`.
   *
   * @param matA - The main matrix
   * @param matB - The matrix to pre-multiply
   * @param out - The matrix to write to
   *
   * @returns The given `out` parameter or a new matrix
   */
  public static premultiply(matA: Mat2, matB: Mat2, out?: Mat2) {
    out = out || new Mat2()
    const a = matB.m
    const b = matA.m
    const c = out.m
    // tslint:disable
    const a_0 = a[ 0], a_1 = a[ 1],
          a_2 = a[ 2], a_3 = a[ 3]
    const b_0 = b[ 0], b_1 = b[ 1],
          b_2 = b[ 2], b_3 = b[ 3]
    // tslint:enable
    c[0] = b_0 * a_0 + b_1 * a_2
    c[1] = b_0 * a_1 + b_1 * a_3
    c[2] = b_2 * a_0 + b_3 * a_2
    c[3] = b_2 * a_1 + b_3 * a_3
    return out
  }

  /**
   * Performs a matrix multiplication `this = other * this` meaning `other` is pre-multiplied on `this`.
   *
   * @param other - The matrix to pre-multiply
   */
  public premultiply(other: Mat2): this {
    const a = other.m
    const b = this.m
    const c = this.m
    // tslint:disable
    const a_0 = a[ 0], a_1 = a[ 1],
          a_2 = a[ 2], a_3 = a[ 3]
    const b_0 = b[ 0], b_1 = b[ 1],
          b_2 = b[ 2], b_3 = b[ 3]
    // tslint:enable
    c[0] = b_0 * a_0 + b_1 * a_2
    c[1] = b_0 * a_1 + b_1 * a_3
    c[2] = b_2 * a_0 + b_3 * a_2
    c[3] = b_2 * a_1 + b_3 * a_3
    return this
  }

  // /**
  //  * Multiplies a chain of matrices
  //  * @returns The result of the multiplication
  //  */
  // public static concatChain(...rest: Mat2[]) {
  //   // (a, (b, (c, (d, e))))
  //   const result = arguments[arguments.length - 1].clone()
  //   for (let i = arguments.length - 2; i >= 0; i--) {
  //     Mat2.concat(arguments[i], result, result)
  //   }
  //   return result
  // }

  /**
   * Multiplies a matrix with a scalar value
   * @param matA - The matrix
   * @param scalar - The scalar to multiply
   * @param out - The matrix to write to
   * @returns The given `out` parameter or a new matrix
   */
  public static multiplyScalar(matA: Mat2, scalar: number, out?: Mat2): Mat2 {
    out = out || new Mat2()
    const a = matA.m
    const b = scalar
    const c = out.m
    c[ 0] = a[ 0] * b; c[ 1] = a[ 1] * b
    c[ 2] = a[ 2] * b; c[ 3] = a[ 3] * b
    return out
  }

  /**
   * Multiplies each component of `this` with given scalar
   * @param scalar - The scalar to multiply
   */
  public multiplyScalar(s: number): this {
    const a = this.m
    a[ 0] *= s; a[ 1] *= s
    a[ 2] *= s; a[ 3] *= s
    return this
  }

  /**
   * Divides the components of the first matrix by the components of the second matrix
   * @param matA - The first matrix
   * @param matB - The second matrix
   * @param out - The matrix to write to
   * @returns The given `out` parameter or a new matrix
   */
  public static divide(matA: Mat2, matB: Mat2, out?: Mat2): Mat2 {
    out = out || new Mat2()
    const a = matA.m
    const b = matB.m
    const c = out.m
    c[ 0] = a[ 0] / b[ 0]; c[ 1] = a[ 1] / b[ 1]
    c[ 2] = a[ 2] / b[ 2]; c[ 3] = a[ 3] / b[ 3]
    return out
  }

  /**
   * Divides each matching component pair
   * @param other - The matrix by which to divide
   */
  public divide(other: Mat2): this {
    const a = this.m
    const b = other.m
    a[ 0] /= b[ 0]; a[ 1] /= b[ 1]
    a[ 2] /= b[ 2]; a[ 3] /= b[ 3]
    return this
  }

  /**
   * Divides the components of a matrix by a scalar
   * @param matA - The matrix
   * @param scalar - The scalar by which to divide
   * @param out - The matrix to write to
   * @returns The given `out` parameter or a new matrix
   */
  public static divideScalar(matA: Mat2, scalar: number, out?: Mat2): Mat2 {
    out = out || new Mat2()
    const a = matA.m
    const b = 1 / scalar
    const c = out.m
    c[ 0] = a[ 0] * b; c[ 1] = a[ 1] * b
    c[ 2] = a[ 2] * b; c[ 3] = a[ 3] * b
    return out
  }

  /**
   * Divides each component of `this` by given scalar
   * @param scalar - The scalar by which to divide
   */
  public divideScalar(s: number): this {
    const a = this.m
    const b = 1.0 / s
    a[ 0] *= b; a[ 1] *= b
    a[ 2] *= b; a[ 3] *= b
    return this
  }

  /**
   * Transform the given vector with this matrix.
   *
   * @returns the given vector
   */
  public transform<T extends IVec2>(vec: T): T {
    const x = vec.x || 0
    const y = vec.y || 0
    const d = this.m
    vec.x = x * d[0] + y * d[2]
    vec.y = x * d[1] + y * d[3]
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
    const d = this.m
    offset = offset || 0
    stride = stride === undefined ? 3 : stride
    count = count === undefined ? array.length / stride : count

    while (count > 0) {
      count--
      x = array[offset]
      y = array[offset + 1]
      array[offset] = x * d[0] + y * d[2]
      array[offset + 1] = x * d[1] + y * d[3]
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
  public transformV4Array(array: ArrayLike<number>, offset?: number, stride?: number, count?: number) {
    let x
    let y
    const d = this.m
    offset = offset || 0
    stride = stride === undefined ? 4 : stride
    count = count === undefined ? array.length / stride : count

    while (count > 0) {
      count--
      x = array[offset]
      y = array[offset + 1]
      array[offset    ] = x * d[0] + y * d[2]
      array[offset + 1] = x * d[1] + y * d[3]
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
  public static lerp(matA: Mat2, matB: Mat2, t: number, out?: Mat2): Mat2 {
    out = out || new Mat2()
    const a = matA.m
    const b = matB.m
    const c = out.m
    c[0] = a[0] + (b[0] - a[0]) * t
    c[1] = a[1] + (b[1] - a[1]) * t
    c[2] = a[2] + (b[2] - a[2]) * t
    c[3] = a[3] + (b[3] - a[3]) * t
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
  public static smooth(matA: Mat2, matB: Mat2, t: number, out?: Mat2): Mat2 {
    t = ((t > 1) ? 1 : ((t < 0) ? 0 : t))
    t = t * t * (3 - 2 * t)
    return Mat2.lerp(matA, matB, t, out)
  }

  /**
   * Creates a copy of this matrix
   * @returns The cloned matrix.
   */
  public static clone(mat: Mat2, out: Mat2 = new Mat2()): Mat2 {
    const d = mat.m
    const o = out.m
    o[0] = d[0]
    o[1] = d[1]
    o[2] = d[2]
    o[3] = d[3]
    return out
  }

  /**
   * Checks for component wise equality with given matrix
   * @param other - The matrix to compare with
   * @returns true if components are equal, false otherwise
   */
  public equals(other: Mat2): boolean {
    const a = this.m
    const b = other.m
    return a[0] === b[0] &&
      a[1] === b[1] &&
      a[2] === b[2] &&
      a[3] === b[3]
  }

  /**
   * Checks for component wise equality with given matrix
   *
   * @param other - The matrix to compare with
   */
  public static equals(m1: Mat2, m2: Mat2): boolean {
    const a = m1.m
    const b = m2.m
    return a[0] === b[0] &&
      a[1] === b[1] &&
      a[2] === b[2] &&
      a[3] === b[3]
  }

  /**
   * Formats this into a readable string
   *
   * @remarks
   * Mainly meant for debugging. Do not use this for serialization.
   *
   * @param fractionDigits - Number of digits after decimal point
   */
  public format(fractionDigits: number = 5): string {
    return Mat2.format(this, fractionDigits)
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
  public static format(mat: Mat2, fractionDigits: number = 5): string {
    const m = mat.m
    return [
      [m[0].toFixed(fractionDigits), m[2].toFixed(fractionDigits)].join(','),
      [m[1].toFixed(fractionDigits), m[3].toFixed(fractionDigits)].join(','),
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
    array = array || []
    offset = offset || 0
    const d = this.m
    array[offset] = d[0]
    array[offset + 1] = d[1]
    array[offset + 2] = d[2]
    array[offset + 3] = d[3]
    return array
  }

  /**
   * Returns a copy of given matrix as plain array
   */
  public static toArray(mat: Mat2): number[]
  /**
   * Copies the given matrix into a given array starting at given offset
   *
   * @param array - The array to copy into
   * @param offset - Zero based index where to start writing in the array
   */
  public static toArray<T>(mat: Mat2, array: T, offset?: number): T
  public static toArray(mat: Mat2, array?: number[], offset?: number): number[] {
    array = array || []
    offset = offset || 0
    const d = mat.m
    array[offset] = d[0]
    array[offset + 1] = d[1]
    array[offset + 2] = d[2]
    array[offset + 3] = d[3]
    return array
  }
}
