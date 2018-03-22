import { ArrayLike, IVec2, IVec3, IVec4 } from './Types'
import { Vec3 } from './Vec3'

/**
 * Describes a 3x3 matrix.
 *
 * @public
 */
export class Mat3 {
  public right: Float32Array = this.data.subarray(0, 3)
  public up: Float32Array = this.data.subarray(3, 6)
  public backward: Float32Array = this.data.subarray(6, 9)

  constructor(public data: Float32Array = new Float32Array(9)) {}

  /**
   * Initializes the matrix with the given values in given order. The values are applied in column major order
   * @returns Reference to `this` for chaining.
   */
  public init(
    m0: number, m1: number, m2: number,
    m3: number, m4: number, m5: number,
    m6: number, m7: number, m8: number,
  ): Mat3 {
    const d = this.data
    // tslint:disable
    d[0] = m0; d[1] = m1; d[2] = m2;
    d[3] = m3; d[4] = m4; d[5] = m5;
    d[6] = m6; d[7] = m7; d[8] = m8;
    // tslint:enable
    return this
  }

  /**
   * Initializes the matrix with the given values. The values are read in row major order.
   * @returns Reference to `this` for chaining.
   */
  public initRowMajor(
    m0: number, m3: number, m6: number,
    m1: number, m4: number, m7: number,
    m2: number, m5: number, m8: number,
  ): Mat3 {
    const d = this.data
    // tslint:disable
    d[0] = m0; d[1] = m1; d[2] = m2;
    d[3] = m3; d[4] = m4; d[5] = m5;
    d[6] = m6; d[7] = m7; d[8] = m8;
    // tslint:enable
    return this
  }

  /**
   * Initializes all components of this matrix with the given number.
   * @param number - The number to set all matrix components to.
   * @returns Reference to `this` for chaining.
   */
  public initWith(value: number): Mat3 {
    const d = this.data
    // tslint:disable
    d[0] = value; d[1] = value; d[2] = value;
    d[3] = value; d[4] = value; d[5] = value;
    d[6] = value; d[7] = value; d[8] = value;
    // tslint:enable
    return this
  }

  /**
   * Initializes the components of this matrix to the identity.
   * @returns Reference to `this` for chaining.
   */
  public initIdentity(): Mat3 {
    const d = this.data
    // tslint:disable
    d[0] = 1; d[1] = 0; d[2] = 0;
    d[3] = 0; d[4] = 1; d[5] = 0;
    d[6] = 0; d[7] = 0; d[8] = 1;
    // tslint:enable
    return this
  }

  /**
   * Initializes this matrix from another matrix.
   *
   * @returns Reference to `this` for chaining.
   */
  public initFrom(other: Mat3): Mat3 {
    const a = this.data
    const b = other.data
    // tslint:disable
    a[0] = b[0]; a[1] = b[1]; a[2] = b[2];
    a[3] = b[3]; a[4] = b[4]; a[5] = b[5];
    a[6] = b[6]; a[7] = b[7]; a[8] = b[8];
    // tslint:enable
    return this
  }

  /**
   * Reads a buffer starting at given offset and initializes the elements of this matrix.
   * The given buffer must have at least 16 elements starting at given offset.
   * The elements are expected to be in column major layout.
   *
   *
   * @returns Reference to `this` for chaining.
   */
  public initFromBuffer(buffer: ArrayLike<number>, offset?: number): Mat3 {
    offset = offset || 0
    const a = this.data
    a[0] = buffer[offset]
    a[1] = buffer[offset + 1]
    a[2] = buffer[offset + 2]
    a[3] = buffer[offset + 3]
    a[4] = buffer[offset + 4]
    a[5] = buffer[offset + 5]
    a[6] = buffer[offset + 6]
    a[7] = buffer[offset + 7]
    a[8] = buffer[offset + 8]
    return this
  }

  /**
   * Initializes this matrix from given quaternion.
   * @param q - The quaternion
   * @returns Reference to `this` for chaining.
   */
  public initFromQuaternion(q: IVec4): Mat3 {
    const x = q.x
    const y = q.y
    const z = q.z
    const w = q.w
    const xx = x * x
    const yy = y * y
    const zz = z * z
    const xy = x * y
    const zw = z * w
    const zx = z * x
    const yw = y * w
    const yz = y * z
    const xw = x * w
    return this.initRowMajor(
      1 - 2 * (yy + zz), 2 * (xy - zw), 2 * (zx + yw),
      2 * (xy + zw), 1 - 2 * (zz + xx), 2 * (yz - xw),
      2 * (zx - yw), 2 * (yz + xw), 1 - 2 * (yy + xx),
    )
  }

  /**
   * Initializes this matrix to a rotation matrix defined by given axis vector and angle.
   * @param axis - The axis vector. This is expected to be normalized.
   * @param angle - The angle in radians.
   * @returns Reference to `this` for chaining.
   */
  public initAxisAngle(axis: IVec3, angle: number): Mat3 {
    // create quaternion
    const halfAngle = angle * 0.5
    const scale = Math.sin(halfAngle)
    const x = axis.x * scale
    const y = axis.y * scale
    const z = axis.z * scale
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

    return this.initRowMajor(
      1 - 2 * (yy + zz), 2 * (xy - zw), 2 * (zx + yw),
      2 * (xy + zw), 1 - 2 * (zz + xx), 2 * (yz - xw),
      2 * (zx - yw), 2 * (yz + xw), 1 - 2 * (yy + xx),
    )
  }

  /**
   * Initializes this matrix to a rotation matrix defined by given yaw pitch and roll values.
   * @param yaw - Angle in radians around the Y axis
   * @param pitch - Angle in radians around the X axis
   * @param roll - Angle in radians around the Z axis
   * @returns Reference to `this` for chaining.
   */
  public initYawPitchRoll(yaw: number, pitch: number, roll: number): Mat3 {
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
    const yy = y * y
    const zz = z * z
    const xy = x * y
    const zw = z * w
    const zx = z * x
    const yw = y * w
    const yz = y * z
    const xw = x * w

    return this.initRowMajor(
      1 - 2 * (yy + zz), 2 * (xy - zw), 2 * (zx + yw),
      2 * (xy + zw), 1 - 2 * (zz + xx), 2 * (yz - xw),
      2 * (zx - yw), 2 * (yz + xw), 1 - 2 * (yy + xx),
    )
  }

  /**
   * Initializes this matrix with a rotation around the X axis.
   * @param rad - The angle in radians.
   * @returns Reference to `this` for chaining.
   */
  public initRotationX(rad: number): Mat3 {
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    return this.initRowMajor(
      1, 0, 0,
      0, cos, -sin,
      0, sin, cos,
    )
  }

  /**
   * Initializes this matrix with a rotation around the Y axis.
   * @param rad - The angle in radians.
   * @returns Reference to `this` for chaining.
   */
  public initRotationY(rad: number): Mat3 {
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)

    return this.initRowMajor(
      cos, 0, sin,
      0, 1, 0,
      -sin, 0, cos,
    )
  }

  /**
   * Initializes this matrix with a rotation around the Z axis.
   * @param rad - The angle in radians.
   * @returns Reference to `this` for chaining.
   */
  public initRotationZ(rad: number): Mat3 {
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    return this.initRowMajor(
      cos, -sin, 0,
      sin, cos, 0,
      0, 0, 1,
    )
  }

  /**
   * Initializes a scale matrix.
   * @param x - Scale along x-axis
   * @param y - Scale along y-axis
   * @param z - Scale along z-axis
   * @returns Reference to `this` for chaining.
   */
  public initScale(x: number, y: number, z: number): Mat3 {
    return this.initRowMajor(
      x, 0, 0,
      0, y, 0,
      0, 0, z,
    )
  }

  /**
   * Initializes a matrix from a position point and a forward and up vectors
   * @param position - The translation part
   * @param forward - The facing direction
   * @param up - The up vector
   * @returns Reference to `this` for chaining.
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
   * Creates a copy of this matrix
   * @returns The cloned matrix.
   */
  public clone(): Mat3 {
    const d = this.data
    return new Mat3().init(d[0], d[1], d[2], d[3], d[4], d[5], d[6], d[7], d[8])
  }

  /**
   * Copies the components successively into the given array.
   * @param buffer - The array to copy into
   * @param offset - Zero based index where to start writing in the array
   * @returns the given buffer
   */
  public copyTo<T extends ArrayLike<number>>(buffer: T, offset?: number): T {
    offset = offset || 0
    const d = this.data
    buffer[offset] = d[0]
    buffer[offset + 1] = d[1]
    buffer[offset + 2] = d[2]
    buffer[offset + 3] = d[3]
    buffer[offset + 4] = d[4]
    buffer[offset + 5] = d[5]
    buffer[offset + 6] = d[6]
    buffer[offset + 7] = d[7]
    buffer[offset + 8] = d[8]
    return buffer
  }

  /**
   * Checks for component wise equality with given matrix
   * @param other - The matrix to compare with
   * @returns true if components are equal, false otherwise
   */
  public equals(other: Mat3): boolean {
    const a = this.data
    const b = other.data
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
   * Gets the forward vector
   * @param out - The vector to write to
   * @returns the given `out` parameter or a new vector
   */
  public getForward<T extends IVec3 = Vec3>(out?: T|Vec3): T|Vec3 {
    out = out || new Vec3()
    out.x = -this.backward[0]
    out.y = -this.backward[1]
    out.z = -this.backward[2]
    return out
  }

  /**
   * Gets the backward vector
   * @param out - The vector to write to
   * @returns the given `out` parameter or a new vector
   */
  public getBackward<T extends IVec3 = Vec3>(out?: T|Vec3): T|Vec3 {
    out = out || new Vec3()
    out.x = this.backward[0]
    out.y = this.backward[1]
    out.z = this.backward[2]
    return out
  }

  /**
   * Gets the right vector
   * @param out - The vector to write to
   * @returns the given `out` parameter or a new vector
   */
  public getRight<T extends IVec3 = Vec3>(out?: T|Vec3): T|Vec3 {
    out = out || new Vec3()
    out.x = this.right[0]
    out.y = this.right[1]
    out.z = this.right[2]
    return out
  }

  /**
   * Gets the left vector
   * @param out - The vector to write to
   * @returns the given `out` parameter or a new vector
   */
  public getLeft<T extends IVec3 = Vec3>(out?: T|Vec3): T|Vec3 {
    out = out || new Vec3()
    out.x = -this.right[0]
    out.y = -this.right[1]
    out.z = -this.right[2]
    return out
  }

  /**
   * Gets the up vector
   * @param out - The vector to write to
   * @returns the given `out` parameter or a new vector
   */
  public getUp<T extends IVec3 = Vec3>(out?: T|Vec3): T|Vec3 {
    out = out || new Vec3()
    out.x = this.up[0]
    out.y = this.up[1]
    out.z = this.up[2]
    return out
  }

  /**
   * Gets the down vector
   * @param out - The vector to write to
   * @returns the given `out` parameter or a new vector
   */
  public getDown<T extends IVec3 = Vec3>(out?: T|Vec3): T|Vec3 {
    out = out || new Vec3()
    out.x = -this.up[0]
    out.y = -this.up[1]
    out.z = -this.up[2]
    return out
  }

  /**
   * Gets the scale part as vector
   * @param out - The vector to write to
   * @returns the given `out` parameter or a new vector
   */
  public getScale<T extends IVec3 = Vec3>(out?: T|Vec3): T|Vec3 {
    out = out || new Vec3()
    out.x = this.data[0]
    out.y = this.data[4]
    out.z = this.data[8]
    return out
  }

  /**
   * Sets the forward vector
   * @param vec - The vector to take values from
   * @returns Reference to `this` for chaining.
   */
  public setForward(vec: IVec3): Mat3 {
    this.backward[0] = -vec.x
    this.backward[1] = -vec.y
    this.backward[2] = -vec.z
    return this
  }

  /**
   * Sets the backward vector
   * @param vec - The vector to take values from
   * @returns Reference to `this` for chaining.
   */
  public setBackward(vec: IVec3): Mat3 {
    this.backward[0] = vec.x
    this.backward[1] = vec.y
    this.backward[2] = vec.z
    return this
  }

  /**
   * Sets the right vector
   * @param vec - The vector to take values from
   * @returns Reference to `this` for chaining.
   */
  public setRight(vec: IVec3): Mat3 {
    this.right[0] = vec.x
    this.right[1] = vec.y
    this.right[2] = vec.z
    return this
  }

  /**
   * Sets the left vector
   * @param vec - The vector to take values from
   * @returns Reference to `this` for chaining.
   */
  public setLeft(vec: IVec3): Mat3 {
    this.right[0] = -vec.x
    this.right[1] = -vec.y
    this.right[2] = -vec.z
    return this
  }

  /**
   * Sets the up vector
   * @param vec - The vector to take values from
   * @returns Reference to `this` for chaining.
   */
  public setUp(vec: IVec3): Mat3 {
    this.up[0] = vec.x
    this.up[1] = vec.y
    this.up[2] = vec.z
    return this
  }

  /**
   * Sets the down vector
   * @param vec - The vector to take values from
   * @returns Reference to `this` for chaining.
   */
  public setDown(vec: IVec3): Mat3 {
    this.up[0] = -vec.x
    this.up[1] = -vec.y
    this.up[2] = -vec.z
    return this
  }

  /**
   * Sets the scale part
   * @param vec - The vector to take values from
   * @returns Reference to `this` for chaining.
   */
  public setScale(vec: IVec3): Mat3 {
    this.data[0] = vec.x
    this.data[4] = vec.y
    this.data[8] = vec.z
    return this
  }
  public setScaleX(v: number): Mat3 {
    this.data[0] = v
    return this
  }
  public setScaleY(v: number): Mat3 {
    this.data[4] = v
    return this
  }
  public setScaleZ(v: number): Mat3 {
    this.data[8] = v
    return this
  }
  public setScaleXYZ(x: number, y: number, z: number): Mat3 {
    this.data[0] = x
    this.data[4] = y
    this.data[8] = z
    return this
  }

  /**
   * Calculates the determinant of this matrix
   */
  public determinant(): number {
    const a = this.data

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
   * Transposes this matrix
   * @returns Reference to `this` for chaining.
   */
  public transpose(): Mat3 {
    const d = this.data
    return this.init(
      d[0], d[3], d[6],
      d[1], d[4], d[7],
      d[2], d[5], d[8],
    )
  }

  /**
   * Inverts this matrix
   * @returns Reference to `this` for chaining.
   */
  public invert(): Mat3 {
    const a = this.data
    const b = this.data

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
   * Negates all components of this matrix
   * @returns Reference to `this` for chaining.
   */
  public negate(): Mat3 {
    const a = this.data
    const b = this.data
    // tslint:disable
    a[ 0] = -b[ 0]; a[ 1] = -b[ 1]; a[ 2] = -b[ 2];
    a[ 3] = -b[ 3]; a[ 4] = -b[ 4]; a[ 5] = -b[ 5];
    a[ 6] = -b[ 6]; a[ 7] = -b[ 7]; a[ 8] = -b[ 8];
    // tslint:enable
    return this
  }

  /**
   * Adds the given matrix to `this`
   * @param other - The matrix to add
   * @returns Reference to `this` for chaining.
   */
  public add(other: Mat3): Mat3 {
    const a = this.data
    const b = other.data
    // tslint:disable
    a[ 0] += b[ 0]; a[ 1] += b[ 1]; a[ 2] += b[ 2];
    a[ 3] += b[ 3]; a[ 4] += b[ 4]; a[ 5] += b[ 5];
    a[ 6] += b[ 6]; a[ 7] += b[ 7]; a[ 8] += b[ 8];
    // tslint:enable
    return this
  }

  /**
   * Adds the given scalar to each component of `this`
   * @param scalar - The scalar to add
   * @returns Reference to `this` for chaining.
   */
  public addScalar(s: number): Mat3 {
    const a = this.data
    // tslint:disable
    a[ 0] += s; a[ 1] += s; a[ 2] += s;
    a[ 3] += s; a[ 4] += s; a[ 5] += s;
    a[ 6] += s; a[ 7] += s; a[ 8] += s;
    // tslint:enable
    return this
  }

  /**
   * Subtracts the given matrix from `this`
   * @param other - The matrix to subtract
   * @returns Reference to `this` for chaining.
   */
  public subtract(other: Mat3): Mat3 {
    const a = this.data
    const b = other.data
    // tslint:disable
    a[ 0] -= b[ 0]; a[ 1] -= b[ 1]; a[ 2] -= b[ 2];
    a[ 3] -= b[ 3]; a[ 4] -= b[ 4]; a[ 5] -= b[ 5];
    a[ 6] -= b[ 6]; a[ 7] -= b[ 7]; a[ 8] -= b[ 8];
    // tslint:enable
    return this
  }

  /**
   * Subtracts the given scalar from each component of `this`
   * @param scalar - The scalar to subtract
   * @returns Reference to `this` for chaining.
   */
  public subtractScalar(s: number): Mat3 {
    const a = this.data
    // tslint:disable
    a[ 0] -= s; a[ 1] -= s; a[ 2] -= s;
    a[ 3] -= s; a[ 4] -= s; a[ 5] -= s;
    a[ 6] -= s; a[ 7] -= s; a[ 8] -= s;
    // tslint:enable
    return this
  }

  /**
   * Multiplies the given matrix with this
   * @param other - The matrix to multiply
   * @returns Reference to `this` for chaining.
   */
  public multiply(other: Mat3): Mat3 {
    const a = other.data
    const b = this.data
    const c = this.data
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
   * Concatenates the given matrix to this
   * @param other - The matrix to concatenate
   * @returns Reference to `this` for chaining.
   */
  public concat(other: Mat3): Mat3 {
    const a = this.data
    const b = other.data
    const c = this.data
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
   * Multiplies each component of `this` with given scalar
   * @param scalar - The scalar to multiply
   * @returns Reference to `this` for chaining.
   */
  public multiplyScalar(s: number): Mat3 {
    const a = this.data
    // tslint:disable
    a[ 0] *= s; a[ 1] *= s; a[ 2] *= s;
    a[ 3] *= s; a[ 4] *= s; a[ 5] *= s;
    a[ 6] *= s; a[ 7] *= s; a[ 8] *= s;
    // tslint:enable
    return this
  }

  /**
   * Divides each matching component pair
   * @param other - The matrix by which to divide
   * @returns Reference to `this` for chaining.
   */
  public divide(other: Mat3): Mat3 {
    const a = this.data
    const b = other.data
    // tslint:disable
    a[ 0] /= b[ 0]; a[ 1] /= b[ 1]; a[ 2] /= b[ 2];
    a[ 3] /= b[ 3]; a[ 4] /= b[ 4]; a[ 5] /= b[ 5];
    a[ 6] /= b[ 6]; a[ 7] /= b[ 7]; a[ 8] /= b[ 8];
    // tslint:enable
    return this
  }

  /**
   * Divides each component of `this` by given scalar
   * @param scalar - The scalar by which to divide
   * @returns Reference to `this` for chaining.
   */
  public divideScalar(s: number): Mat3 {
    const a = this.data
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
    const d = this.data
    vec.x = x * d[0] + y * d[3] + z * d[6]
    vec.y = x * d[1] + y * d[4] + z * d[7]
    if ((vec as IVec3).z != null) {
      (vec as IVec3).z = x * d[2] + y * d[5] + z * d[8]
    }
    return vec
  }

  /**
   * Transforms the given buffer with `this` matrix.
   *
   *
   *
   *
   */
  public transformV2Buffer(buffer: ArrayLike<number>, offset?: number, stride?: number, count?: number) {
    let x
    let y
    const d = this.data
    offset = offset || 0
    stride = stride == null ? 2 : stride
    count = count == null ? buffer.length / stride : count

    while (count > 0) {
      count--
      x = buffer[offset]
      y = buffer[offset + 1]
      buffer[offset    ] = x * d[0] + y * d[3] + d[6]
      buffer[offset + 1] = x * d[1] + y * d[4] + d[7]
      offset += stride
    }
  }

  /**
   * Transforms the given buffer with `this` matrix.
   *
   *
   *
   *
   */
  public transformV3Buffer(buffer: ArrayLike<number>, offset?: number, stride?: number, count?: number) {
    let x
    let y
    let z
    const d = this.data
    offset = offset || 0
    stride = stride == null ? 3 : stride
    count = count == null ? buffer.length / stride : count

    while (count > 0) {
      count--
      x = buffer[offset]
      y = buffer[offset + 1]
      z = buffer[offset + 2]
      buffer[offset    ] = x * d[0] + y * d[3] + z * d[6]
      buffer[offset + 1] = x * d[1] + y * d[4] + z * d[7]
      buffer[offset + 2] = x * d[2] + y * d[5] + z * d[8]
      offset += stride
    }
  }

  /**
   * Transforms the given buffer with `this` matrix.
   *
   *
   *
   *
   */
  public transformV4Buffer(buffer: ArrayLike<number>, offset?: number, stride?: number, count?: number) {
    let x
    let y
    let z
    const d = this.data
    offset = offset || 0
    stride = stride == null ? 4 : stride
    count = count == null ? buffer.length / stride : count

    while (count > 0) {
      count--
      x = buffer[offset]
      y = buffer[offset + 1]
      z = buffer[offset + 2]
      buffer[offset    ] = x * d[0] + y * d[3] + z * d[6]
      buffer[offset + 1] = x * d[1] + y * d[4] + z * d[7]
      buffer[offset + 2] = x * d[2] + y * d[5] + z * d[8]
      offset += stride
    }
  }

  /**
   * Transpose the given matrix
   * @param mat - The matrix to transpose
   * @param out - The matrix to write to
   * @returns The given `out` parameter or a new matrix
   */
  public static transpose(mat: Mat3, out?: Mat3): Mat3 {
    const d = mat.data
    return (out || new Mat3()).init(
      d[0], d[3], d[6],
      d[1], d[4], d[7],
      d[2], d[5], d[8],
    )
  }

  /**
   * Invert the given matrix
   * @param mat - The matrix to transpose
   * @param out - The matrix to write to
   * @returns The given `out` parameter or a new matrix
   */
  public static invert(mat: Mat3, out?: Mat3): Mat3 {
    out = out || new Mat3()
    const a = mat.data
    const b = out.data

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
   * Negate the components of the given matrix
   * @param mat - The matrix to transpose
   * @param out - The matrix to write to
   * @returns The given `out` parameter or a new matrix
   */
  public static negate(mat: Mat3, out?: Mat3): Mat3 {
    out = out || new Mat3()
    const d = mat.data
    const o = out.data
    // tslint:disable
    o[ 0] = -d[ 0]; o[ 1] = -d[ 1]; o[ 2] = -d[ 2];
    o[ 3] = -d[ 3]; o[ 4] = -d[ 4]; o[ 5] = -d[ 5];
    o[ 6] = -d[ 6]; o[ 7] = -d[ 7]; o[ 8] = -d[ 8];
    // tslint:enable
    return out
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
    const a = matA.data
    const b = matB.data
    const c = out.data
    // tslint:disable
    c[ 0] = a[ 0] + b[ 0]; c[ 1] = a[ 1] + b[ 1]; c[ 2] = a[ 2] + b[ 2];
    c[ 3] = a[ 3] + b[ 3]; c[ 4] = a[ 4] + b[ 4]; c[ 5] = a[ 5] + b[ 5];
    c[ 6] = a[ 6] + b[ 6]; c[ 7] = a[ 7] + b[ 7]; c[ 8] = a[ 8] + b[ 8];
    // tslint:enable
    return out
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
    const a = mat.data
    const c = out.data
    // tslint:disable
    c[ 0] = a[ 0] + scalar; c[ 1] = a[ 1] + scalar; c[ 2] = a[ 2] + scalar;
    c[ 3] = a[ 3] + scalar; c[ 4] = a[ 4] + scalar; c[ 5] = a[ 5] + scalar;
    c[ 6] = a[ 6] + scalar; c[ 7] = a[ 7] + scalar; c[ 8] = a[ 8] + scalar;
    // tslint:enable
    return out
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
    const a = matA.data
    const b = matB.data
    const c = out.data
    // tslint:disable
    c[ 0] = a[ 0] - b[ 0]; c[ 1] = a[ 1] - b[ 1]; c[ 2] = a[ 2] - b[ 2];
    c[ 3] = a[ 3] - b[ 3]; c[ 4] = a[ 4] - b[ 4]; c[ 5] = a[ 5] - b[ 5];
    c[ 6] = a[ 6] - b[ 6]; c[ 7] = a[ 7] - b[ 7]; c[ 8] = a[ 8] - b[ 8];
    // tslint:enable
    return out
  }

  /**
   * Subtracts a scalar from each somponent of a matrix
   * @param mat - The matrix to subtract from
   * @param scalar - The scalar to subtract
   * @param out - The matrix to write to
   * @returns The given `out` parameter or a new matrix
   */
  public static subtractScalar(mat: Mat3, scalar: number, out?: Mat3): Mat3 {
    out = out || new Mat3()
    const a = mat.data
    const c = out.data
    // tslint:disable
    c[ 0] = a[ 0] - scalar; c[ 1] = a[ 1] - scalar; c[ 2] = a[ 2] - scalar;
    c[ 3] = a[ 3] - scalar; c[ 4] = a[ 4] - scalar; c[ 5] = a[ 5] - scalar;
    c[ 6] = a[ 6] - scalar; c[ 7] = a[ 7] - scalar; c[ 8] = a[ 8] - scalar;
    // tslint:enable
    return out
  }

  /**
   * Multiplies a matrix by another matrix
   * @param matA - The first matrix
   * @param matB - The second matrix
   * @param out - The matrix to write to
   * @returns The given `out` parameter or a new matrix
   */
  public static multiply(matA: Mat3, matB: Mat3, out?: Mat3): Mat3 {
    out = out || new Mat3()
    const a = matB.data
    const b = matA.data
    const c = out.data
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
   * Multiplies a matrix by another matrix
   * @param matA - The first matrix
   * @param matB - The second matrix
   * @param out - The matrix to write to
   * @returns The given `out` parameter or a new matrix
   */
  public static concat(matA: Mat3, matB: Mat3, out?: Mat3): Mat3 {
    out = out || new Mat3()
    const a = matA.data
    const b = matB.data
    const c = out.data
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
   * Multiplies a chain of matrices
   * @returns The result of the multiplication
   */
  public static concatChain(...rest: Mat3[]): Mat3 {
    // (a, (b, (c, (d, e))))
    const result = arguments[arguments.length - 1].clone()
    for (let i = arguments.length - 2; i >= 0; i--) {
      Mat3.concat(arguments[i], result, result)
    }
    return result
  }

  /**
   * Multiplies a chain of matrices
   * @returns The result of the multiplication
   */
  public static multiplyChain(...rest: Mat3[]): Mat3 {
    // ((((a, b), c), d), e)
    const result = arguments[0].clone()
    for (let i = 1; i < arguments.length; i += 1) {
      Mat3.multiply(result, arguments[i], result)
    }
    return result
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
    const a = matA.data
    const b = scalar
    const c = out.data
    // tslint:disable
    c[ 0] = a[ 0] * b; c[ 1] = a[ 1] * b; c[ 2] = a[ 2] * b;
    c[ 3] = a[ 3] * b; c[ 4] = a[ 4] * b; c[ 5] = a[ 5] * b;
    c[ 6] = a[ 6] * b; c[ 7] = a[ 7] * b; c[ 8] = a[ 8] * b;
    // tslint:enable
    return out
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
    const a = matA.data
    const b = matB.data
    const c = out.data
    // tslint:disable
    c[ 0] = a[ 0] / b[ 0]; c[ 1] = a[ 1] / b[ 1]; c[ 2] = a[ 2] / b[ 2];
    c[ 3] = a[ 3] / b[ 3]; c[ 4] = a[ 4] / b[ 4]; c[ 5] = a[ 5] / b[ 5];
    c[ 6] = a[ 6] / b[ 6]; c[ 7] = a[ 7] / b[ 7]; c[ 8] = a[ 8] / b[ 8];
    // tslint:enable
    return out
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
    const a = matA.data
    const b = 1 / scalar
    const c = out.data
    // tslint:disable
    c[ 0] = a[ 0] * b; c[ 1] = a[ 1] * b; c[ 2] = a[ 2] * b;
    c[ 3] = a[ 3] * b; c[ 4] = a[ 4] * b; c[ 5] = a[ 5] * b;
    c[ 6] = a[ 6] * b; c[ 7] = a[ 7] * b; c[ 8] = a[ 8] * b;
    // tslint:enable
    return out
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
    const a = matA.data
    const b = matB.data
    const c = out.data
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
   * Creates a new matrix with all components set to 0
   * @returns a new matrix
   */
  public static zero(): Mat3 {
    return new Mat3()
  }

  /**
   * Creates a new matrix that is initialized to identity
   * @returns a new matrix
   */
  public static identity(): Mat3 {
    return new Mat3().initIdentity()
  }

  /**
   * Creates a new matrix. This method should be called with 16 or 0 arguments. If less than 16 but more than 0 arguments
   * are given some components are going to be undefined. The arguments are expected to be in column major order.
   * @returns a new matrix
   */
  public static create(
    m0: number, m1: number, m2: number,
    m3: number, m4: number, m5: number,
    m6: number, m7: number, m8: number,
  ): Mat3 {
    const out = new Mat3()
    const d = out.data
    // tslint:disable
    d[ 0] = m0;  d[ 1] = m1;  d[ 2] = m2;
    d[ 3] = m3;  d[ 4] = m4;  d[ 5] = m5;
    d[ 6] = m6;  d[ 7] = m7;  d[ 8] = m8;
    // tslint:enable
    return out
  }

  /**
   * Creates a new matrix. The arguments are expected to be in row major order.
   * @returns a new matrix
   */
  public static createRowMajor(
    m0: number, m3: number, m6: number,
    m1: number, m4: number, m7: number,
    m2: number, m5: number, m8: number,
  ): Mat3 {
    const out = new Mat3()
    const d = out.data
    // tslint:disable
    d[ 0] = m0;  d[ 1] = m1;  d[ 2] = m2;
    d[ 3] = m3;  d[ 4] = m4;  d[ 5] = m5;
    d[ 6] = m6;  d[ 7] = m7;  d[ 8] = m8;
    // tslint:enable
    return out
  }

  /**
   * @returns a new matrix
   */
  public static createScale(x: number, y: number, z: number): Mat3 {
    return new Mat3().initScale(x, y, z)
  }

  /**
   * @returns a new matrix
   */
  public static createOrientation(forward: IVec3, up: IVec3): Mat3 {
    return new Mat3().initOrientation(forward, up)
  }

  /**
   * @returns a new matrix
   */
  public static createRotationX(rad: number): Mat3 {
    return new Mat3().initRotationX(rad)
  }

  /**
   * @returns a new matrix
   */
  public static createRotationY(rad: number): Mat3 {
    return new Mat3().initRotationY(rad)
  }

  /**
   * @returns a new matrix
   */
  public static createRotationZ(rad: number): Mat3 {
    return new Mat3().initRotationZ(rad)
  }

  /**
   * @returns a new matrix
   */
  public static createAxisAngle(axis: IVec3, angle: number): Mat3 {
    return new Mat3().initAxisAngle(axis, angle)
  }

  /**
   * @returns a new matrix
   */
  public static createYawPitchRoll(yaw: number, pitch: number, roll: number): Mat3 {
    return new Mat3().initYawPitchRoll(yaw, pitch, roll)
  }

  /**
   *
   */
  public format(): string {
    return Mat3.format(this)
  }

  /**
   *
   */
  public static format(mat: Mat3): string {
    const m = mat.data
    const fixed = 5
    return [
      [m[0].toFixed(fixed), m[3].toFixed(fixed), m[6].toFixed(fixed)].join(','),
      [m[1].toFixed(fixed), m[4].toFixed(fixed), m[7].toFixed(fixed)].join(','),
      [m[2].toFixed(fixed), m[5].toFixed(fixed), m[8].toFixed(fixed)].join(','),
    ].join('\n')
  }
}
