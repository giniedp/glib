import { ArrayLike, IVec2, IVec3, IVec4 } from './Types'
import { Vec2 } from './Vec2'

/**
 * Describes a 4x4 matrix.
 */
export class Mat2 {

  constructor(public data: Float32Array = new Float32Array(4)) {}

  /**
   * Initializes the matrix with the given values in given order. The values are applied in column major order
   * @return Reference to `this` for chaining.
   */
  public init(
    m0: number, m1: number,
    m2: number, m3: number,
  ): Mat2 {
    const d = this.data
    d[0] = m0; d[1] = m1; // tslint:disable-line
    d[2] = m2; d[3] = m3; // tslint:disable-line
    return this
  }

  /**
   * Creates a new matrix. This method should be called with 16 or 0 arguments. If less than 16 but more than 0 arguments
   * are given some components are going to be undefined. The arguments are expected to be in column major order.
   * @return a new matrix
   */
  public static create(
    m0: number, m1: number, m2: number, m3: number,
  ): Mat2 {
    const out = new Mat2()
    const d = out.data
    d[ 0] = m0; d[ 1] = m1 // tslint:disable-line
    d[ 2] = m2; d[ 3] = m3 // tslint:disable-line
    return out
  }

  /**
   * Initializes the matrix with the given values. The values are read in row major order.
   * @return Reference to `this` for chaining.
   */
  public initRowMajor(
    m0: number, m2: number,
    m1: number, m3: number,
  ): Mat2 {
    const d = this.data
    d[0] = m0; d[1] = m1; // tslint:disable-line
    d[2] = m2; d[3] = m3; // tslint:disable-line
    return this
  }

  /**
   * Creates a new matrix. The arguments are expected to be in row major order.
   * @return a new matrix
   */
  public static createRowMajor(
    m0: number, m2: number,
    m1: number, m3: number,
  ): Mat2 {
    const out = new Mat2()
    const d = out.data
    d[ 0] = m0; d[ 1] = m1 // tslint:disable-line
    d[ 2] = m2; d[ 3] = m3 // tslint:disable-line
    return out
  }

  /**
   * Initializes all components of this matrix with the given number.
   * @param number The number to set all matrix components to.
   * @return Reference to `this` for chaining.
   */
  public initWith(value: number): Mat2 {
    const d = this.data
    d[0] = value; d[1] = value; // tslint:disable-line
    d[2] = value; d[3] = value; // tslint:disable-line
    return this
  }

  /**
   *
   */
  public initZero(): Mat2 {
    const d = this.data
    d[0] = 0
    d[1] = 0
    d[2] = 0
    d[3] = 0
    return this
  }

  /**
   * Creates a new matrix with all components set to 0
   * @return a new matrix
   */
  public static zero(): Mat2 {
    return new Mat2()
  }

  /**
   * Initializes the components of this matrix to the identity.
   * @return Reference to `this` for chaining.
   */
  public initIdentity(): Mat2 {
    const d = this.data
    d[0] = 1; d[1] = 0; // tslint:disable-line
    d[2] = 0; d[3] = 1; // tslint:disable-line
    return this
  }

  /**
   * Creates a new matrix that is initialized to identity
   * @return a new matrix
   */
  public static identity(): Mat2 {
    return new Mat2().initIdentity()
  }

  /**
   * Initializes this matrix from another matrix.
   * @param other
   * @return Reference to `this` for chaining.
   */
  public initFrom(other: Mat2): Mat2 {
    const a = this.data
    const b = other.data
    a[0] = b[0]; a[1] = b[1]; // tslint:disable-line
    a[2] = b[2]; a[3] = b[3]; // tslint:disable-line
    return this
  }

  /**
   * Reads a buffer starting at given offset and initializes the elements of this matrix.
   * The given buffer must have at least 16 elements starting at given offset.
   * The elements are expected to be in column major layout.
   * @chainable
   * @param buffer
   * @param [offset=0]
   * @return Reference to `this` for chaining.
   */
  public initFromBuffer(buffer: ArrayLike<number>, offset?: number): Mat2 {
    offset = offset || 0
    const a = this.data
    a[0] = buffer[offset]
    a[1] = buffer[offset + 1]
    a[2] = buffer[offset + 2]
    a[3] = buffer[offset + 3]
    return this
  }

  /**
   * Initializes this matrix from given quaternion.
   * @param q The quaternion
   * @return Reference to `this` for chaining.
   */
  public initFromQuaternion(q: IVec4): Mat2 {
    const x = q.x
    const y = q.y
    const z = q.z
    const w = q.w
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
   * Initializes this matrix to a rotation matrix defined by given axis vector and angle.
   * @param axis The axis vector. This is expected to be normalized.
   * @param angle The angle in radians.
   * @return Reference to `this` for chaining.
   */
  public initAxisAngle(axis: IVec2|IVec3, angle: number): Mat2 {
    // create quaternion
    const halfAngle = angle * 0.5
    const scale = Math.sin(halfAngle)
    const x = axis.x * scale
    const y = axis.y * scale
    const z = ((axis as IVec3).z || 0) * scale
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
   * @return a new matrix
   */
  public static createAxisAngle(axis: IVec3, angle: number): Mat2 {
    return new Mat2().initAxisAngle(axis, angle)
  }

  /**
   * Initializes this matrix with a rotation around the X axis.
   * @param rad The angle in radians.
   * @return Reference to `this` for chaining.
   */
  public initRotationX(rad: number): Mat2 {
    return this.initRowMajor(
      1, 0,
      0, Math.cos(rad),
    )
  }

  /**
   * @return a new matrix
   */
  public static createRotationX(rad: number): Mat2 {
    return new Mat2().initRotationX(rad)
  }

  /**
   * Initializes this matrix with a rotation around the Y axis.
   * @param rad The angle in radians.
   * @return Reference to `this` for chaining.
   */
  public initRotationY(rad: number): Mat2 {
    return this.initRowMajor(
      Math.cos(rad), 0,
      0, 1,
    )
  }

  /**
   * @return a new matrix
   */
  public static createRotationY(rad: number): Mat2 {
    return new Mat2().initRotationY(rad)
  }

  /**
   * Initializes this matrix with a rotation around the Z axis.
   * @param rad The angle in radians.
   * @return Reference to `this` for chaining.
   */
  public initRotationZ(rad: number): Mat2 {
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    return this.initRowMajor(
      cos, -sin,
      sin, cos,
    )
  }

  /**
   * @return a new matrix
   */
  public static createRotationZ(rad: number): Mat2 {
    return new Mat2().initRotationZ(rad)
  }

  public initRotation(rad: number): Mat2 {
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    return this.initRowMajor(
      cos, -sin,
      sin, cos,
    )
  }

  /**
   * @return a new matrix
   */
  public static createRotation(rad: number): Mat2 {
    return new Mat2().initRotation(rad)
  }

  /**
   * Initializes a scale matrix.
   * @param x Scale along x-axis
   * @param y Scale along y-axis
   * @return Reference to `this` for chaining.
   */
  public initScale(x: number, y: number): Mat2 {
    return this.initRowMajor(
      x, 0,
      0, y,
    )
  }

  /**
   * @return a new matrix
   */
  public static createScale(x: number, y: number): Mat2 {
    return new Mat2().initScale(x, y)
  }

  /**
   * Creates a copy of this matrix
   * @return The cloned matrix.
   */
  public clone(): Mat2 {
    const d = this.data
    return new Mat2().init(d[0], d[1], d[2], d[3])
  }

  /**
   * Copies the components successively into the given array.
   * @param buffer The array to copy into
   * @param [offset=0] Zero based index where to start writing in the array
   * @return the given buffer
   */
  public copyTo<T extends ArrayLike<number>>(buffer: T, offset?: number): T {
    offset = offset || 0
    const d = this.data
    buffer[offset] = d[0]
    buffer[offset + 1] = d[1]
    buffer[offset + 2] = d[2]
    buffer[offset + 3] = d[3]
    return buffer
  }

  /**
   * Checks for component wise equality with given matrix
   * @method equals
   * @param other The matrix to compare with
   * @return {Boolean} true if components are equal, false otherwise
   */
  public equals(other: Mat2): boolean {
    const a = this.data
    const b = other.data
    return a[0] === b[0] &&
      a[1] === b[1] &&
      a[2] === b[2] &&
      a[3] === b[3]
  }

  /**
   * Gets the scale part as vector
   * @param [out] The vector to write to
   * @return the given `out` parameter or a new vector
   */
  public getScale<T extends IVec2 = Vec2>(out?: T|Vec2): T|Vec2 {
    out = out || new Vec2()
    out.x = this.data[0]
    out.y = this.data[3]
    return out
  }

  /**
   * Sets the scale part
   * @param vec The vector to take values from
   * @return Reference to `this` for chaining.
   */
  public setScale(vec: IVec2): Mat2 {
    this.data[0] = vec.x
    this.data[3] = vec.y
    return this
  }
  public setScaleX(v: number): Mat2 {
    this.data[0] = v
    return this
  }
  public setScaleY(v: number): Mat2 {
    this.data[3] = v
    return this
  }
  public setScaleXY(x: number, y: number): Mat2 {
    this.data[0] = x
    this.data[3] = y
    return this
  }

  /**
   * Calculates the determinant of this matrix
   */
  public determinant(): number {
    const a = this.data

    const a11 = a[0]
    const a12 = a[1]

    const a21 = a[2]
    const a22 = a[3]

    return a11 * a22 - a12 * a21
  }

  /**
   * Calculates the determinant of a matrix
   */
  public static determinant(mat: Mat2): number {
    const a = mat.data

    const a11 = a[0]
    const a12 = a[1]

    const a21 = a[2]
    const a22 = a[3]

    return a11 * a22 - a12 * a21
  }

  /**
   * Transposes this matrix
   * @return Reference to `this` for chaining.
   */
  public transpose(): Mat2 {
    const d = this.data
    return this.init(
      d[0], d[2],
      d[1], d[3],
    )
  }

  /**
   * Transpose the given matrix
   * @param mat The matrix to transpose
   * @param [out] The matrix to write to
   * @return The given `out` parameter or a new matrix
   */
  public static transpose(mat: Mat2, out?: Mat2): Mat2 {
    const d = mat.data
    return (out || new Mat2()).init(
      d[0], d[2],
      d[1], d[3],
    )
  }

  /**
   * Inverts this matrix
   * @return Reference to `this` for chaining.
   */
  public invert(): Mat2 {
    const a = this.data
    const b = this.data

    const a11 = a[0]; const a12 = a[2]
    const a21 = a[1]; const a22 = a[3]

    const detInv = 1 / (a11 * a22 - a12 * a21)

    b[0] =  detInv * a22; b[2] = -detInv * a12
    b[1] = -detInv * a21; b[3] =  detInv * a11

    return this
  }

  /**
   * Invert the given matrix
   * @param mat The matrix to transpose
   * @param [out] The matrix to write to
   * @return The given `out` parameter or a new matrix
   */
  public static invert(mat: Mat2, out?: Mat2): Mat2 {
    out = out || new Mat2()

    const a = mat.data
    const b = out.data

    const a11 = a[0]; const a12 = a[2]
    const a21 = a[1]; const a22 = a[3]

    const detInv = 1 / (a11 * a22 - a12 * a21)

    b[0] =  detInv * a22; b[2] = -detInv * a12
    b[1] = -detInv * a21; b[3] =  detInv * a11

    return out
  }

  /**
   * Negates all components of this matrix
   * @return Reference to `this` for chaining.
   */
  public negate(): Mat2 {
    const a = this.data
    const b = this.data
    a[ 0] = -b[ 0]; a[ 1] = -b[ 1]; // tslint:disable-line
    a[ 2] = -b[ 2]; a[ 3] = -b[ 3]; // tslint:disable-line
    return this
  }

  /**
   * Negate the components of the given matrix
   * @param mat The matrix to transpose
   * @param [out] The matrix to write to
   * @return The given `out` parameter or a new matrix
   */
  public static negate(mat: Mat2, out?: Mat2): Mat2 {
    out = out || new Mat2()
    const d = mat.data
    const o = out.data
    o[ 0] = -d[ 0]; o[ 1] = -d[ 1] // tslint:disable-line
    o[ 2] = -d[ 2]; o[ 3] = -d[ 3] // tslint:disable-line
    return out
  }

  /**
   * Adds the given matrix to `this`
   * @param other The matrix to add
   * @return Reference to `this` for chaining.
   */
  public add(other: Mat2): Mat2 {
    const a = this.data
    const b = other.data
    a[ 0] += b[ 0]; a[ 1] += b[ 1]; // tslint:disable-line
    a[ 2] += b[ 2]; a[ 3] += b[ 3]; // tslint:disable-line
    return this
  }

  /**
   * Adds a matrix to another
   * @param matA The first matrix
   * @param matB The second matrix
   * @param [out] The matrix to write to
   * @return The given `out` parameter or a new matrix
   */
  public static add(matA: Mat2, matB: Mat2, out?: Mat2): Mat2 {
    out = out || new Mat2()
    const a = matA.data
    const b = matB.data
    const c = out.data
    c[ 0] = a[ 0] + b[ 0]; c[ 1] = a[ 1] + b[ 1] // tslint:disable-line
    c[ 2] = a[ 2] + b[ 2]; c[ 3] = a[ 3] + b[ 3] // tslint:disable-line
    return out
  }

  /**
   * Adds the given scalar to each component of `this`
   * @param scalar The scalar to add
   * @return Reference to `this` for chaining.
   */
  public addScalar(s: number): Mat2 {
    const a = this.data
    a[ 0] += s; a[ 1] += s; // tslint:disable-line
    a[ 2] += s; a[ 3] += s; // tslint:disable-line
    return this
  }

  /**
   * Adds a scalar to each component of a matrix
   * @param mat The matrix
   * @param scalar The scalar to add
   * @param [out] The matrix to write to
   * @return The given `out` parameter or a new matrix
   */
  public static addScalar(mat: Mat2, scalar: number, out?: Mat2): Mat2 {
    out = out || new Mat2()
    const a = mat.data
    const c = out.data
    c[ 0] = a[ 0] + scalar; c[ 1] = a[ 1] + scalar // tslint:disable-line
    c[ 2] = a[ 2] + scalar; c[ 3] = a[ 3] + scalar // tslint:disable-line
    return out
  }

  /**
   * Subtracts the given matrix from `this`
   * @param other The matrix to subtract
   * @return Reference to `this` for chaining.
   */
  public subtract(other: Mat2): Mat2 {
    const a = this.data
    const b = other.data
    a[ 0] -= b[ 0]; a[ 1] -= b[ 1]; // tslint:disable-line
    a[ 2] -= b[ 2]; a[ 3] -= b[ 3]; // tslint:disable-line
    return this
  }

  /**
   * Subtracts the second matrix from the first
   * @param matA The first matrix
   * @param matB The second matrix
   * @param [out] The matrix to write to
   * @return The given `out` parameter or a new matrix
   */
  public static subtract(matA: Mat2, matB: Mat2, out?: Mat2): Mat2 {
    out = out || new Mat2()
    const a = matA.data
    const b = matB.data
    const c = out.data
    c[ 0] = a[ 0] - b[ 0]; c[ 1] = a[ 1] - b[ 1] // tslint:disable-line
    c[ 2] = a[ 2] - b[ 2]; c[ 3] = a[ 3] - b[ 3] // tslint:disable-line
    return out
  }

  /**
   * Subtracts the given scalar from each component of `this`
   * @param scalar The scalar to subtract
   * @return Reference to `this` for chaining.
   */
  public subtractScalar(s: number): Mat2 {
    const a = this.data
    a[ 0] -= s; a[ 1] -= s; // tslint:disable-line
    a[ 2] -= s; a[ 3] -= s; // tslint:disable-line
    return this
  }

  /**
   * Subtracts a scalar from each somponent of a matrix
   * @param mat The matrix to subtract from
   * @param scalar The scalar to subtract
   * @param [out] The matrix to write to
   * @return The given `out` parameter or a new matrix
   */
  public static subtractScalar(mat: Mat2, scalar: number, out?: Mat2): Mat2 {
    out = out || new Mat2()
    const a = mat.data
    const c = out.data
    c[ 0] = a[ 0] - scalar; c[ 1] = a[ 1] - scalar // tslint:disable-line
    c[ 2] = a[ 2] - scalar; c[ 3] = a[ 3] - scalar // tslint:disable-line
    return out
  }

  /**
   * Concatenates the given matrix to this
   * @param other The matrix to concatenate
   * @return Reference to `this` for chaining.
   */
  public multiply(other: Mat2): Mat2 {
    const a = other.data
    const b = this.data
    const c = this.data
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

  /**
   * Multiplies a matrix by another matrix
   * @param matA The first matrix
   * @param matB The second matrix
   * @param [out] The matrix to write to
   * @return The given `out` parameter or a new matrix
   */
  public static multiply(matA: Mat2, matB: Mat2, out?: Mat2): Mat2 {
    out = out || new Mat2()
    const a = matB.data
    const b = matA.data
    const c = out.data
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
   * Multiplies a chain of matrices
   * @method multiplyChain
   * @return The result of the multiplication
   */
  public static multiplyChain(...rest: Mat2[]) {
    // ((((a, b), c), d), e)
    const result = arguments[0].clone()
    for (let i = 1; i < arguments.length; i += 1) {
      Mat2.multiply(result, arguments[i], result)
    }
    return result
  }

  /**
   * Concatenates the given matrix to this
   * @param other The matrix to concatenate
   * @return Reference to `this` for chaining.
   */
  public concat(other: Mat2): Mat2 {
    const a = this.data
    const b = other.data
    const c = this.data
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

  /**
   * Multiplies a matrix by another matrix
   * @param matA The first matrix
   * @param matB The second matrix
   * @param [out] The matrix to write to
   * @return The given `out` parameter or a new matrix
   */
  public static concat(matA: Mat2, matB: Mat2, out?: Mat2) {
    out = out || new Mat2()
    const a = matA.data
    const b = matB.data
    const c = out.data
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
   * Multiplies a chain of matrices
   * @method concatChain
   * @return The result of the multiplication
   */
  public static concatChain(...rest: Mat2[]) {
    // (a, (b, (c, (d, e))))
    const result = arguments[arguments.length - 1].clone()
    for (let i = arguments.length - 2; i >= 0; i--) {
      Mat2.concat(arguments[i], result, result)
    }
    return result
  }

  /**
   * Multiplies each component of `this` with given scalar
   * @param scalar The scalar to multiply
   * @return Reference to `this` for chaining.
   */
  public multiplyScalar(s: number): Mat2 {
    const a = this.data
    a[ 0] *= s; a[ 1] *= s; // tslint:disable-line
    a[ 2] *= s; a[ 3] *= s; // tslint:disable-line
    return this
  }

  /**
   * Multiplies a matrix with a scalar value
   * @method multiplyScalar
   * @param matA The matrix
   * @param scalar The scalar to multiply
   * @param [out] The matrix to write to
   * @return The given `out` parameter or a new matrix
   */
  public static multiplyScalar(matA: Mat2, scalar: number, out?: Mat2): Mat2 {
    out = out || new Mat2()
    const a = matA.data
    const b = scalar
    const c = out.data
    c[ 0] = a[ 0] * b; c[ 1] = a[ 1] * b // tslint:disable-line
    c[ 2] = a[ 2] * b; c[ 3] = a[ 3] * b // tslint:disable-line
    return out
  }

  /**
   * Divides each matching component pair
   * @param other The matrix by which to divide
   * @return Reference to `this` for chaining.
   */
  public divide(other: Mat2): Mat2 {
    const a = this.data
    const b = other.data
    a[ 0] /= b[ 0]; a[ 1] /= b[ 1]; // tslint:disable-line
    a[ 2] /= b[ 2]; a[ 3] /= b[ 3]; // tslint:disable-line
    return this
  }

  /**
   * Divides the components of the first matrix by the components of the second matrix
   * @param matA The first matrix
   * @param matB The second matrix
   * @param [out] The matrix to write to
   * @return The given `out` parameter or a new matrix
   */
  public static divide(matA: Mat2, matB: Mat2, out?: Mat2): Mat2 {
    out = out || new Mat2()
    const a = matA.data
    const b = matB.data
    const c = out.data
    c[ 0] = a[ 0] / b[ 0]; c[ 1] = a[ 1] / b[ 1] // tslint:disable-line
    c[ 2] = a[ 2] / b[ 2]; c[ 3] = a[ 3] / b[ 3] // tslint:disable-line
    return out
  }

  /**
   * Divides each component of `this` by given scalar
   * @param scalar The scalar by which to divide
   * @return Reference to `this` for chaining.
   */
  public divideScalar(s: number): Mat2 {
    const a = this.data
    const b = 1.0 / s
    a[ 0] *= b; a[ 1] *= b; // tslint:disable-line
    a[ 2] *= b; a[ 3] *= b; // tslint:disable-line
    return this
  }

  /**
   * Divides the components of a matrix by a scalar
   * @param matA The matrix
   * @param scalar The scalar by which to divide
   * @param [out] The matrix to write to
   * @return The given `out` parameter or a new matrix
   */
  public static divideScalar(matA: Mat2, scalar: number, out?: Mat2): Mat2 {
    out = out || new Mat2()
    const a = matA.data
    const b = 1 / scalar
    const c = out.data
    c[ 0] = a[ 0] * b; c[ 1] = a[ 1] * b // tslint:disable-line
    c[ 2] = a[ 2] * b; c[ 3] = a[ 3] * b // tslint:disable-line
    return out
  }

  /**
   * Transform the given vector with this matrix.
   * @param vec
   * @return the given vector
   */
  public transform<T extends IVec2>(vec: T): T {
    const x = vec.x || 0
    const y = vec.y || 0
    const d = this.data
    vec.x = x * d[0] + y * d[2]; // tslint:disable-line
    vec.y = x * d[1] + y * d[3]; // tslint:disable-line
    return vec
  }

  /**
   * Transforms the given buffer with `this` matrix.
   * @param buffer
   * @param [offset=0]
   * @param [stride=2]
   * @param [count=buffer.length/stride]
   */
  public transformV2Buffer(buffer: ArrayLike<number>, offset?: number, stride?: number, count?: number) {
    let x
    let y
    const d = this.data
    offset = offset || 0
    stride = stride === undefined ? 2 : stride
    count = count === undefined ? buffer.length / stride : count

    while (count > 0) {
      count--
      x = buffer[offset]
      y = buffer[offset + 1]
      buffer[offset] = x * d[0] + y * d[2]
      buffer[offset + 1] = x * d[1] + y * d[3]
      offset += stride
    }
  }

  /**
   * Transforms the given buffer with `this` matrix.
   * @param buffer
   * @param [offset=0]
   * @param [stride=3]
   * @param [count=buffer.length]
   */
  public transformV3Buffer(buffer: ArrayLike<number>, offset?: number, stride?: number, count?: number) {
    let x
    let y
    const d = this.data
    offset = offset || 0
    stride = stride === undefined ? 3 : stride
    count = count === undefined ? buffer.length / stride : count

    while (count > 0) {
      count--
      x = buffer[offset]
      y = buffer[offset + 1]
      buffer[offset] = x * d[0] + y * d[2]
      buffer[offset + 1] = x * d[1] + y * d[3]
      offset += stride
    }
  }

  /**
   * Transforms the given buffer with `this` matrix.
   * @method transformV4Buffer
   * @param buffer
   * @param [offset=0]
   * @param [stride=4]
   * @param [count=buffer.length]
   */
  public transformV4Buffer(buffer: ArrayLike<number>, offset?: number, stride?: number, count?: number) {
    let x
    let y
    const d = this.data
    offset = offset || 0
    stride = stride === undefined ? 4 : stride
    count = count === undefined ? buffer.length / stride : count

    while (count > 0) {
      count--
      x = buffer[offset]
      y = buffer[offset + 1]
      buffer[offset    ] = x * d[0] + y * d[2]
      buffer[offset + 1] = x * d[1] + y * d[3]
      offset += stride
    }
  }

  /**
   * Performs a linear interpolation between two matrices
   * @param matA The first matrix
   * @param matB The second matrix
   * @param t The interpolation value. This is assumed to be in [0:1] range
   * @param [out] The matrix to write to
   * @return The given `out` parameter or a new matrix
   */
  public static lerp(matA: Mat2, matB: Mat2, t: number, out?: Mat2): Mat2 {
    out = out || new Mat2()
    const a = matA.data
    const b = matB.data
    const c = out.data
    c[0] = a[0] + (b[0] - a[0]) * t
    c[1] = a[1] + (b[1] - a[1]) * t
    c[2] = a[2] + (b[2] - a[2]) * t
    c[3] = a[3] + (b[3] - a[3]) * t
    return out
  }

  /**
   * @returns {string}
   */
  public format(): string {
    return Mat2.format(this)
  }

  /**
   * @returns {string}
   */
  public static format(mat: Mat2) {
    const m = mat.data
    const fixed = 5
    return [
      [m[0].toFixed(fixed), m[2].toFixed(fixed)].join(','),
      [m[1].toFixed(fixed), m[3].toFixed(fixed)].join(','),
    ].join('\n')
  }
}
