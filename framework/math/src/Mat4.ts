import { ArrayLike, IVec2, IVec3, IVec4 } from './Types'
import { Vec3 } from './Vec3'

// column major matrix layout

// translation matrix
// 1 0 0 x
// 0 1 0 y
// 0 0 1 z
// 0 0 0 1

// index layout
// 0 4 8  12
// 1 5 9  13
// 2 6 10 14
// 3 7 11 15

/* missing function
  Decompose
  CreateReflection
  CreateShadow
  CreateBillboard
  CreateConstrainedBillboard
  */

/**
 * Describes a 4x4 matrix.
 */
export class Mat4 {
  public right: Float32Array = this.data.subarray(0, 3)
  public up: Float32Array = this.data.subarray(4, 7)
  public backward: Float32Array = this.data.subarray(8, 11)
  public translation: Float32Array = this.data.subarray(12, 15)

  constructor(public data: Float32Array = new Float32Array(16)) {}

  /**
   * Initializes the matrix with the given values in given order. The values are applied in column major order
   * @return Reference to `this` for chaining.
   * @example
   *     mat.init(
   *       0, 0, 0, 0,
   *       0, 0, 0, 0,
   *       0, 0, 0, 0,
   *       x, y, z, 0)
   */
  public init(
    m0: number, m1: number, m2: number, m3: number,
    m4: number, m5: number, m6: number, m7: number,
    m8: number, m9: number, m10: number, m11: number,
    m12: number, m13: number, m14: number, m15: number,
  ): Mat4 {
    const d = this.data
    d[0] = m0
    d[1] = m1
    d[2] = m2
    d[3] = m3
    d[4] = m4
    d[5] = m5
    d[6] = m6
    d[7] = m7
    d[8] = m8
    d[9] = m9
    d[10] = m10
    d[11] = m11
    d[12] = m12
    d[13] = m13
    d[14] = m14
    d[15] = m15
    return this
  }

  /**
   * Initializes the matrix with the given values. The values are read in row major order.
   * @return Reference to `this` for chaining.
   */
  public initRowMajor(
    m0: number, m4: number, m8: number, m12: number,
    m1: number, m5: number, m9: number, m13: number,
    m2: number, m6: number, m10: number, m14: number,
    m3: number, m7: number, m11: number, m15: number,
  ): Mat4 {
    const d = this.data
    d[0] = m0
    d[1] = m1
    d[2] = m2
    d[3] = m3
    d[4] = m4
    d[5] = m5
    d[6] = m6
    d[7] = m7
    d[8] = m8
    d[9] = m9
    d[10] = m10
    d[11] = m11
    d[12] = m12
    d[13] = m13
    d[14] = m14
    d[15] = m15
    return this
  }

  /**
   * Initializes all components of this matrix with the given number.
   * @param number The number to set all matrix components to.
   * @return Reference to `this` for chaining.
   */
  public initWith(value: number): Mat4 {
    const d = this.data
    d[0] = d[1] = d[2] = d[3] = d[4] = d[5] = d[6] = d[7] = d[8] = d[9] = d[10] = d[11] = d[12] = d[13] = d[14] = d[15] = value
    return this
  }

  /**
   * Initializes the components of this matrix to the identity.
   * @return Reference to `this` for chaining.
   */
  public initIdentity(): Mat4 {
    const d = this.data
    d[0] = d[5] = d[10] = d[15] = 1
    d[1] = d[2] = d[3] = d[4] = d[6] = d[7] = d[8] = d[9] = d[11] = d[12] = d[13] = d[14] = 0
    return this
  }

  /**
   * Initializes this matrix from another matrix.
   * @param other
   * @return Reference to `this` for chaining.
   */
  public initFrom(other: Mat4): Mat4 {
    const a = this.data
    const b = other.data
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
   * Reads a buffer starting at given offset and initializes the elements of this matrix.
   * The given buffer must have at least 16 elements starting at given offset.
   * The elements are expected to be in column major layout.
   * @chainable
   * @param buffer
   * @param [offset=0]
   * @return Reference to `this` for chaining.
   */
  public initFromBuffer(buffer: ArrayLike<number>, offset?: number): Mat4 {
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
    a[9] = buffer[offset + 9]
    a[10] = buffer[offset + 10]
    a[11] = buffer[offset + 11]
    a[12] = buffer[offset + 12]
    a[13] = buffer[offset + 13]
    a[14] = buffer[offset + 14]
    a[15] = buffer[offset + 15]
    return this
  }

  /**
   * Initializes this matrix from given quaternion.
   * @param q The quaternion
   * @return Reference to `this` for chaining.
   */
  public initFromQuaternion(q: IVec4): Mat4 {
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
      1 - 2 * (yy + zz), 2 * (xy - zw), 2 * (zx + yw), 0,
      2 * (xy + zw), 1 - 2 * (zz + xx), 2 * (yz - xw), 0,
      2 * (zx - yw), 2 * (yz + xw), 1 - 2 * (yy + xx), 0,
      0, 0, 0, 1,
    )
  }

  /**
   * Initializes this matrix to a rotation matrix defined by given axis vector and angle.
   * @param axis The axis vector. This is expected to be normalized.
   * @param angle The angle in radians.
   * @return Reference to `this` for chaining.
   */
  public initAxisAngle(axis: IVec3, angle: number): Mat4 {
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
      1 - 2 * (yy + zz), 2 * (xy - zw), 2 * (zx + yw), 0,
      2 * (xy + zw), 1 - 2 * (zz + xx), 2 * (yz - xw), 0,
      2 * (zx - yw), 2 * (yz + xw), 1 - 2 * (yy + xx), 0,
      0, 0, 0, 1,
    )
  }

  /**
   * Initializes this matrix to a rotation matrix defined by given yaw pitch and roll values.
   * @param yaw Angle in radians around the Y axis
   * @param pitch Angle in radians around the X axis
   * @param roll Angle in radians around the Z axis
   * @return Reference to `this` for chaining.
   */
  public initYawPitchRoll(yaw: number, pitch: number, roll: number): Mat4 {
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
      1 - 2 * (yy + zz), 2 * (xy - zw), 2 * (zx + yw), 0,
      2 * (xy + zw), 1 - 2 * (zz + xx), 2 * (yz - xw), 0,
      2 * (zx - yw), 2 * (yz + xw), 1 - 2 * (yy + xx), 0,
      0, 0, 0, 1,
    )
  }

  /**
   * Initializes this matrix with a rotation around the X axis.
   * @param rad The angle in radians.
   * @return Reference to `this` for chaining.
   */
  public initRotationX(rad: number): Mat4 {
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    return this.initRowMajor(
      1, 0, 0, 0,
      0, cos, -sin, 0,
      0, sin, cos, 0,
      0, 0, 0, 1,
    )
  }

  /**
   * Initializes this matrix with a rotation around the Y axis.
   * @param rad The angle in radians.
   * @return Reference to `this` for chaining.
   */
  public initRotationY(rad: number): Mat4 {
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)

    return this.initRowMajor(
      cos, 0, sin, 0,
      0, 1, 0, 0,
      -sin, 0, cos, 0,
      0, 0, 0, 1,
    )
  }

  /**
   * Initializes this matrix with a rotation around the Z axis.
   * @param rad The angle in radians.
   * @return Reference to `this` for chaining.
   */
  public initRotationZ(rad: number): Mat4 {
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    return this.initRowMajor(
      cos, -sin, 0, 0,
      sin, cos, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    )
  }

  /**
   * Initializes a translation matrix.
   * @param x Translation along the x-axis
   * @param y Translation along the y-axis
   * @param z Translation along the z-axis
   * @return Reference to `this` for chaining.
   */
  public initTranslation(x: number, y: number, z: number): Mat4 {
    return this.initRowMajor(
      1, 0, 0, x,
      0, 1, 0, y,
      0, 0, 1, z,
      0, 0, 0, 1,
    )
  }

  /**
   * Initializes a scale matrix.
   * @param x Scale along x-axis
   * @param y Scale along y-axis
   * @param z Scale along z-axis
   * @return Reference to `this` for chaining.
   */
  public initScale(x: number, y: number, z: number): Mat4 {
    return this.initRowMajor(
      x, 0, 0, 0,
      0, y, 0, 0,
      0, 0, z, 0,
      0, 0, 0, 1,
    )
  }

  /**
   * Initializes a rotation matrix by using a position and a lookat point.
   * @param pos The position where the viewer stands
   * @param lookAt The position where the viewer is looking to
   * @param up The up vector of the viewer
   * @return Reference to `this` for chaining.
   */
  public initLookAt(pos: IVec3, lookAt: IVec3, up: IVec3): Mat4 {
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

    return this.initRowMajor(
      rightX, upX, backX, pos.x,
      rightY, upY, backY, pos.y,
      rightZ, upZ, backZ, pos.z,
      0, 0, 0, 1,
    )
  }

  /**
   * Initializes a matrix from a position point and a forward and up vectors
   * @method initWorld
   * @chainable
   * @param position The translation part
   * @param forward The facing direction
   * @param up The up vector
   * @return Reference to `this` for chaining.
   */
  public initWorld(position: IVec3, forward: IVec3, up: IVec3): Mat4 {
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
      rightX, x, backX, position.x,
      rightY, y, backY, position.y,
      rightZ, z, backZ, position.z,
      0, 0, 0, 1,
    )
  }

  /**
   * Initializes a perspective matrix with given field of view angle
   * @param fov The field of view angle in radians
   * @param aspect The aspect ratio
   * @param near The near plane distance
   * @param far The far plane distance
   * @return Reference to `this` for chaining.
   */
  public initPerspectiveFieldOfView(fov: number, aspect: number, near: number, far: number): Mat4 {
    const s = 1.0 / Math.tan(fov * 0.5)
    return this.initRowMajor(
      s / aspect, 0,                            0,                                0,
      0,          s,                            0,                                0,
      0,          0, -(far + near) / (far - near), -(2 * far * near) / (far - near),
      0,          0,                           -1,                                0,
    )
  }

  /**
   * Initializes a perspective matrix
   * @param width
   * @param height
   * @param near The near plane distance
   * @param far The far plane distance
   * @return Reference to `this` for chaining.
   */
  public initPerspective(width: number, height: number, near: number, far: number): Mat4 {
    return this.initRowMajor(
      near / width, 0, 0, 0,
      0, near / height, 0, 0,
      0, 0, -(far + near) / (far - near), -(2 * far * near) / (far - near),
      0, 0, -1, 0,
    )
  }

  /**
   * Initializes a perspective matrix
   * @param left
   * @param right
   * @param bottom
   * @param top
   * @param near The near plane distance
   * @param far The far plane distance
   * @return Reference to `this` for chaining.
   */
  public initPerspectiveOffCenter(left: number, right: number, bottom: number, top: number, near: number, far: number): Mat4 {
    return this.initRowMajor(
      2 * near / (right - left), 0, (right + left) / (right - left), 0,
      0, 2 * near / (top - bottom), (top + bottom) / (top - bottom), 0,
      0, 0, -(far + near) / (far - near), -(2 * far * near) / (far - near),
      0, 0, -1, 0,
    )
  }

  /**
   * Initializes an orthographic matrix
   * @param width
   * @param height
   * @param near The near plane distance
   * @param far The far plane distance
   * @return Reference to `this` for chaining.
   */
  public initOrthographic(width: number, height: number, near: number, far: number): Mat4 {
    return this.initRowMajor(
      1 / width, 0, 0, 0,
      0, 1 / height, 0, 0,
      0, 0, -2 / (far - near), -(far + near) / (far - near),
      0, 0, 0, 1,
    )
  }

  /**
   * Initializes an orthographic matrix
   * @param left
   * @param right
   * @param bottom
   * @param top
   * @param near The near plane distance
   * @param far The far plane distance
   * @return Reference to `this` for chaining.
   */
  public initOrthographicOffCenter(left: number, right: number, bottom: number, top: number, near: number, far: number): Mat4 {
    return this.initRowMajor(
      2 / (right - left), 0, 0, -(right + left) / (right - left),
      0, 2 / (top - bottom), 0, -(top + bottom) / (top - bottom),
      0, 0, -2 / (far - near), -(far + near) / (far - near),
      0, 0, 0, 1,
    )
  }

  /**
   * Creates a copy of this matrix
   * @return The cloned matrix.
   */
  public clone(): Mat4 {
    const d = this.data
    return new Mat4().init(d[0], d[1], d[2], d[3], d[4], d[5], d[6], d[7], d[8], d[9], d[10], d[11], d[12], d[13], d[14], d[15])
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
    buffer[offset + 4] = d[4]
    buffer[offset + 5] = d[5]
    buffer[offset + 6] = d[6]
    buffer[offset + 7] = d[7]
    buffer[offset + 8] = d[8]
    buffer[offset + 9] = d[9]
    buffer[offset + 10] = d[10]
    buffer[offset + 11] = d[11]
    buffer[offset + 12] = d[12]
    buffer[offset + 13] = d[13]
    buffer[offset + 14] = d[14]
    buffer[offset + 15] = d[15]
    return buffer
  }

  /**
   * Checks for component wise equality with given matrix
   * @method equals
   * @param other The matrix to compare with
   * @return {Boolean} true if components are equal, false otherwise
   */
  public equals(other: Mat4): boolean {
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
   * Gets the forward vector
   * @param [out] The vector to write to
   * @return the given `out` parameter or a new vector
   */
  public getForward<T extends IVec3>(out: T): T {
    out = (out || new Vec3()) as any
    out.x = -this.backward[0]
    out.y = -this.backward[1]
    out.z = -this.backward[2]
    return out
  }

  /**
   * Gets the backward vector
   * @param [out] The vector to write to
   * @return the given `out` parameter or a new vector
   */
  public getBackward<T extends IVec3>(out: T): T {
    out = (out || new Vec3()) as any
    out.x = this.backward[0]
    out.y = this.backward[1]
    out.z = this.backward[2]
    return out
  }

  /**
   * Gets the right vector
   * @param [out] The vector to write to
   * @return the given `out` parameter or a new vector
   */
  public getRight<T extends IVec3>(out: T): T {
    out = (out || new Vec3()) as any
    out.x = this.right[0]
    out.y = this.right[1]
    out.z = this.right[2]
    return out
  }

  /**
   * Gets the left vector
   * @param [out] The vector to write to
   * @return the given `out` parameter or a new vector
   */
  public getLeft<T extends IVec3>(out: T): T {
    out = (out || new Vec3()) as any
    out.x = -this.right[0]
    out.y = -this.right[1]
    out.z = -this.right[2]
    return out
  }

  /**
   * Gets the up vector
   * @param [out] The vector to write to
   * @return the given `out` parameter or a new vector
   */
  public getUp<T extends IVec3>(out: T): T {
    out = (out || new Vec3()) as any
    out.x = this.up[0]
    out.y = this.up[1]
    out.z = this.up[2]
    return out
  }

  /**
   * Gets the down vector
   * @param [out] The vector to write to
   * @return the given `out` parameter or a new vector
   */
  public getDown<T extends IVec3>(out: T): T {
    out = (out || new Vec3()) as any
    out.x = -this.up[0]
    out.y = -this.up[1]
    out.z = -this.up[2]
    return out
  }

  /**
   * Gets the translation part as vector
   * @param [out] The vector to write to
   * @return the given `out` parameter or a new vector
   */
  public getTranslation<T extends IVec3>(out: T): T {
    out = (out || new Vec3()) as any
    out.x = this.translation[0]
    out.y = this.translation[1]
    out.z = this.translation[2]
    return out
  }

  /**
   * Gets the scale part as vector
   * @param [out] The vector to write to
   * @return the given `out` parameter or a new vector
   */
  public getScale<T extends IVec3>(out: T): T {
    out = (out || new Vec3()) as any
    out.x = this.translation[0]
    out.y = this.translation[5]
    out.z = this.translation[10]
    return out
  }

  /**
   * Sets the forward vector
   * @param vec The vector to take values from
   * @return Reference to `this` for chaining.
   */
  public setForward(vec: IVec3): Mat4 {
    this.backward[0] = -vec.x
    this.backward[1] = -vec.y
    this.backward[2] = -vec.z
    return this
  }

  /**
   * Sets the backward vector
   * @param vec The vector to take values from
   * @return Reference to `this` for chaining.
   */
  public setBackward(vec: IVec3): Mat4 {
    this.backward[0] = vec.x
    this.backward[1] = vec.y
    this.backward[2] = vec.z
    return this
  }

  /**
   * Sets the right vector
   * @param vec The vector to take values from
   * @return Reference to `this` for chaining.
   */
  public setRight(vec: IVec3): Mat4 {
    this.right[0] = vec.x
    this.right[1] = vec.y
    this.right[2] = vec.z
    return this
  }

  /**
   * Sets the left vector
   * @param vec The vector to take values from
   * @return Reference to `this` for chaining.
   */
  public setLeft(vec: IVec3): Mat4 {
    this.right[0] = -vec.x
    this.right[1] = -vec.y
    this.right[2] = -vec.z
    return this
  }

  /**
   * Sets the up vector
   * @param vec The vector to take values from
   * @return Reference to `this` for chaining.
   */
  public setUp(vec: IVec3): Mat4 {
    this.up[0] = vec.x
    this.up[1] = vec.y
    this.up[2] = vec.z
    return this
  }

  /**
   * Sets the down vector
   * @param vec The vector to take values from
   * @return Reference to `this` for chaining.
   */
  public setDown(vec: IVec3): Mat4 {
    this.up[0] = -vec.x
    this.up[1] = -vec.y
    this.up[2] = -vec.z
    return this
  }

  /**
   * Sets the translation part
   * @param vec The vector to take values from
   * @return Reference to `this` for chaining.
   */
  public setTranslation(vec: IVec3): Mat4 {
    this.translation[0] = vec.x
    this.translation[1] = vec.y
    this.translation[2] = vec.z
    return this
  }

  public setTranslationX(v: number): Mat4 {
    this.translation[0] = v
    return this
  }
  public setTranslationY(v: number): Mat4 {
    this.translation[1] = v
    return this
  }
  public setTranslationZ(v: number): Mat4 {
    this.translation[2] = v
    return this
  }
  public setTranslationXYZ(x: number, y: number, z: number) {
    this.translation[0] = x
    this.translation[1] = y
    this.translation[2] = z
    return this
  }

  /**
   * Sets the scale part
   * @param vec The vector to take values from
   * @return Reference to `this` for chaining.
   */
  public setScale(vec: IVec3): Mat4 {
    this.data[0] = vec.x
    this.data[5] = vec.y
    this.data[10] = vec.z
    return this
  }
  public setScaleX(v: number): Mat4 {
    this.data[0] = v
    return this
  }
  public setScaleY(v: number): Mat4 {
    this.data[5] = v
    return this
  }
  public setScaleZ(v: number): Mat4 {
    this.data[10] = v
    return this
  }
  public setScaleXYZ(x: number, y: number, z: number): Mat4 {
    this.data[0] = x
    this.data[5] = y
    this.data[10] = z
    return this
  }

  /**
   * Calculates the determinant of this matrix
   */
  public determinant(): number {
    const a = this.data

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
   * Transposes this matrix
   * @return Reference to `this` for chaining.
   */
  public transpose(): Mat4 {
    return Mat4.transpose(this, this)
  }
  public transposeOut(out?: Mat4): Mat4 {
    return Mat4.transpose(this, out || new Mat4())
  }

  /**
   * Inverts this matrix
   * @return Reference to `this` for chaining.
   */
  public invert(): Mat4 {
    return Mat4.invert(this, this)
  }
  public invertOut(out?: Mat4): Mat4 {
    return Mat4.invert(this, out || new Mat4())
  }

  /**
   * Negates all components of this matrix
   * @return Reference to `this` for chaining.
   */
  public negate(): Mat4 {
    return Mat4.negate(this, this)
  }
  public negateOut(out?: Mat4): Mat4 {
    return Mat4.negate(this, out || new Mat4())
  }

  /**
   * Adds the given matrix to `this`
   * @param other The matrix to add
   * @return Reference to `this` for chaining.
   */
  public add(other: Mat4): Mat4 {
    const a = this.data
    const b = other.data
    // tslint:disable
    a[ 0] += b[ 0]; a[ 1] += b[ 1]; a[ 2] += b[ 2]; a[ 3] += b[ 3];
    a[ 4] += b[ 4]; a[ 5] += b[ 5]; a[ 6] += b[ 6]; a[ 7] += b[ 7];
    a[ 8] += b[ 8]; a[ 9] += b[ 9]; a[10] += b[10]; a[11] += b[11];
    a[12] += b[12]; a[13] += b[13]; a[14] += b[14]; a[15] += b[15];
    // tslint:enable
    return this
  }
  public addOut(other: Mat4, out?: Mat4): Mat4 {
    out = out || new Mat4()
    const a = this.data
    const b = other.data
    const c = out.data
    // tslint:disable
    c[ 0] = a[ 0] + b[ 0]; c[ 1] = a[ 1] + b[ 1]; c[ 2] = a[ 2] + b[ 2]; c[ 3] = a[ 3] + b[ 3];
    c[ 4] = a[ 4] + b[ 4]; c[ 5] = a[ 5] + b[ 5]; c[ 6] = a[ 6] + b[ 6]; c[ 7] = a[ 7] + b[ 7];
    c[ 8] = a[ 8] + b[ 8]; c[ 9] = a[ 9] + b[ 9]; c[10] = a[10] + b[10]; c[11] = a[11] + b[11];
    c[12] = a[12] + b[12]; c[13] = a[13] + b[13]; c[14] = a[14] + b[14]; c[15] = a[15] + b[15];
    // tslint:enable
    return out
  }

  /**
   * Adds the given scalar to each component of `this`
   * @param scalar The scalar to add
   * @return Reference to `this` for chaining.
   */
  public addScalar(s: number): Mat4 {
    const a = this.data
    // tslint:disable
    a[ 0] += s; a[ 1] += s; a[ 2] += s; a[ 3] += s;
    a[ 4] += s; a[ 5] += s; a[ 6] += s; a[ 7] += s;
    a[ 8] += s; a[ 9] += s; a[10] += s; a[11] += s;
    a[12] += s; a[13] += s; a[14] += s; a[15] += s;
    // tslint:enable
    return this
  }
  public addScalarOut(s: number, out?: Mat4): Mat4 {
    out = out || new Mat4()
    const a = out.data
    const b = s
    const c = out.data
    // tslint:disable
    c[ 0] = a[ 0] + b; c[ 1] = a[ 1] + b; c[ 2] = a[ 2] + b; c[ 3] = a[ 3] + b;
    c[ 4] = a[ 4] + b; c[ 5] = a[ 5] + b; c[ 6] = a[ 6] + b; c[ 7] = a[ 7] + b;
    c[ 8] = a[ 8] + b; c[ 9] = a[ 9] + b; c[10] = a[10] + b; c[11] = a[11] + b;
    c[12] = a[12] + b; c[13] = a[13] + b; c[14] = a[14] + b; c[15] = a[15] + b;
    // tslint:enable
    return out
  }

  /**
   * Subtracts the given matrix from `this`
   * @param other The matrix to subtract
   * @return Reference to `this` for chaining.
   */
  public subtract(other: Mat4): Mat4 {
    const a = this.data
    const b = other.data
    // tslint:disable
    a[ 0] -= b[ 0]; a[ 1] -= b[ 1]; a[ 2] -= b[ 2]; a[ 3] -= b[ 3];
    a[ 4] -= b[ 4]; a[ 5] -= b[ 5]; a[ 6] -= b[ 6]; a[ 7] -= b[ 7];
    a[ 8] -= b[ 8]; a[ 9] -= b[ 9]; a[10] -= b[10]; a[11] -= b[11];
    a[12] -= b[12]; a[13] -= b[13]; a[14] -= b[14]; a[15] -= b[15];
    // tslint:enable
    return this
  }
  public subtractOut(other: Mat4, out?: Mat4): Mat4 {
    out = out || new Mat4()
    const a = this.data
    const b = other.data
    const c = out.data
    // tslint:disable
    c[ 0] = a[ 0] - b[ 0]; c[ 1] = a[ 1] - b[ 1]; c[ 2] = a[ 2] - b[ 2]; c[ 3] = a[ 3] - b[ 3];
    c[ 4] = a[ 4] - b[ 4]; c[ 5] = a[ 5] - b[ 5]; c[ 6] = a[ 6] - b[ 6]; c[ 7] = a[ 7] - b[ 7];
    c[ 8] = a[ 8] - b[ 8]; c[ 9] = a[ 9] - b[ 9]; c[10] = a[10] - b[10]; c[11] = a[11] - b[11];
    c[12] = a[12] - b[12]; c[13] = a[13] - b[13]; c[14] = a[14] - b[14]; c[15] = a[15] - b[15];
    // tslint:enable
    return out
  }

  /**
   * Subtracts the given scalar from each component of `this`
   * @param scalar The scalar to subtract
   * @return Reference to `this` for chaining.
   */
  public subtractScalar(s: number): Mat4 {
    const a = this.data
    // tslint:disable
    a[ 0] -= s; a[ 1] -= s; a[ 2] -= s; a[ 3] -= s;
    a[ 4] -= s; a[ 5] -= s; a[ 6] -= s; a[ 7] -= s;
    a[ 8] -= s; a[ 9] -= s; a[10] -= s; a[11] -= s;
    a[12] -= s; a[13] -= s; a[14] -= s; a[15] -= s;
    // tslint:enable
    return this
  }
  public subtractScalarOut(s: number, out?: Mat4): Mat4 {
    out = out || new Mat4()
    const a = out.data
    const b = s
    const c = out.data
    // tslint:disable
    c[ 0] = a[ 0] - b; c[ 1] = a[ 1] - b; c[ 2] = a[ 2] - b; c[ 3] = a[ 3] - b;
    c[ 4] = a[ 4] - b; c[ 5] = a[ 5] - b; c[ 6] = a[ 6] - b; c[ 7] = a[ 7] - b;
    c[ 8] = a[ 8] - b; c[ 9] = a[ 9] - b; c[10] = a[10] - b; c[11] = a[11] - b;
    c[12] = a[12] - b; c[13] = a[13] - b; c[14] = a[14] - b; c[15] = a[15] - b;
    // tslint:enable
    return out
  }

  /**
   * Multiplies the given matrix with this
   * @param other The matrix to multiply
   * @return Reference to `this` for chaining.
   */
  public multiply(other: Mat4): Mat4 {
    const a = other.data
    const b = this.data
    const c = this.data

    // tslint:disable
    let a_0 = a[ 0], a_1 = a[ 1], a_2 = a[ 2], a_3 = a[ 3],
        a_4 = a[ 4], a_5 = a[ 5], a_6 = a[ 6], a_7 = a[ 7],
        a_8 = a[ 8], a_9 = a[ 9], a10 = a[10], a11 = a[11],
        a12 = a[12], a13 = a[13], a14 = a[14], a15 = a[15];
    let b_0 = b[ 0], b_1 = a[ 1], b_2 = b[ 2], b_3 = b[ 3],
        b_4 = b[ 4], b_5 = a[ 5], b_6 = b[ 6], b_7 = b[ 7],
        b_8 = b[ 8], b_9 = a[ 9], b10 = b[10], b11 = b[11],
        b12 = b[12], b13 = a[13], b14 = b[14], b15 = b[15];
    // tslint:enable

    c[0] = b_0 * a_0 + b_1 * a_4 + b_2 * a_8 + b_3 * a12
    c[1] = b_0 * a_1 + b_1 * a_5 + b_2 * a_9 + b_3 * a13
    c[2] = b_0 * a_2 + b_1 * a_6 + b_2 * a10 + b_3 * a14
    c[3] = b_0 * a_3 + b_1 * a_7 + b_2 * a11 + b_3 * a15
    c[4] = b_4 * a_0 + b_5 * a_4 + b_6 * a_8 + b_7 * a12
    c[5] = b_4 * a_1 + b_5 * a_5 + b_6 * a_9 + b_7 * a13
    c[6] = b_4 * a_2 + b_5 * a_6 + b_6 * a10 + b_7 * a14
    c[7] = b_4 * a_3 + b_5 * a_7 + b_6 * a11 + b_7 * a15
    c[8] = b_8 * a_0 + b_9 * a_4 + b10 * a_8 + b11 * a12
    c[9] = b_8 * a_1 + b_9 * a_5 + b10 * a_9 + b11 * a13
    c[10] = b_8 * a_2 + b_9 * a_6 + b10 * a10 + b11 * a14
    c[11] = b_8 * a_3 + b_9 * a_7 + b10 * a11 + b11 * a15
    c[12] = b12 * a_0 + b13 * a_4 + b14 * a_8 + b15 * a12
    c[13] = b12 * a_1 + b13 * a_5 + b14 * a_9 + b15 * a13
    c[14] = b12 * a_2 + b13 * a_6 + b14 * a10 + b15 * a14
    c[15] = b12 * a_3 + b13 * a_7 + b14 * a11 + b15 * a15
    return this
  }
  public multiplyOut(other: Mat4, out?: Mat4): Mat4 {
    out = out || new Mat4() as any
    const a = other.data
    const b = out.data
    const c = out.data

    // tslint:disable
    let a_0 = a[ 0], a_1 = a[ 1], a_2 = a[ 2], a_3 = a[ 3],
        a_4 = a[ 4], a_5 = a[ 5], a_6 = a[ 6], a_7 = a[ 7],
        a_8 = a[ 8], a_9 = a[ 9], a10 = a[10], a11 = a[11],
        a12 = a[12], a13 = a[13], a14 = a[14], a15 = a[15]
    let b_0 = b[ 0], b_1 = a[ 1], b_2 = b[ 2], b_3 = b[ 3],
        b_4 = b[ 4], b_5 = a[ 5], b_6 = b[ 6], b_7 = b[ 7],
        b_8 = b[ 8], b_9 = a[ 9], b10 = b[10], b11 = b[11],
        b12 = b[12], b13 = a[13], b14 = b[14], b15 = b[15]
    // tslint:enable

    c[0] = b_0 * a_0 + b_1 * a_4 + b_2 * a_8 + b_3 * a12
    c[1] = b_0 * a_1 + b_1 * a_5 + b_2 * a_9 + b_3 * a13
    c[2] = b_0 * a_2 + b_1 * a_6 + b_2 * a10 + b_3 * a14
    c[3] = b_0 * a_3 + b_1 * a_7 + b_2 * a11 + b_3 * a15
    c[4] = b_4 * a_0 + b_5 * a_4 + b_6 * a_8 + b_7 * a12
    c[5] = b_4 * a_1 + b_5 * a_5 + b_6 * a_9 + b_7 * a13
    c[6] = b_4 * a_2 + b_5 * a_6 + b_6 * a10 + b_7 * a14
    c[7] = b_4 * a_3 + b_5 * a_7 + b_6 * a11 + b_7 * a15
    c[8] = b_8 * a_0 + b_9 * a_4 + b10 * a_8 + b11 * a12
    c[9] = b_8 * a_1 + b_9 * a_5 + b10 * a_9 + b11 * a13
    c[10] = b_8 * a_2 + b_9 * a_6 + b10 * a10 + b11 * a14
    c[11] = b_8 * a_3 + b_9 * a_7 + b10 * a11 + b11 * a15
    c[12] = b12 * a_0 + b13 * a_4 + b14 * a_8 + b15 * a12
    c[13] = b12 * a_1 + b13 * a_5 + b14 * a_9 + b15 * a13
    c[14] = b12 * a_2 + b13 * a_6 + b14 * a10 + b15 * a14
    c[15] = b12 * a_3 + b13 * a_7 + b14 * a11 + b15 * a15
    return out
  }

  /**
   * Concatenates the given matrix to this
   * @param other The matrix to concatenate
   * @return Reference to `this` for chaining.
   */
  public concat(other: Mat4): Mat4 {
    const a = this.data
    const b = other.data
    const c = this.data
    // tslint:disable
    let a_0 = a[ 0], a_1 = a[ 1], a_2 = a[ 2], a_3 = a[ 3],
        a_4 = a[ 4], a_5 = a[ 5], a_6 = a[ 6], a_7 = a[ 7],
        a_8 = a[ 8], a_9 = a[ 9], a10 = a[10], a11 = a[11],
        a12 = a[12], a13 = a[13], a14 = a[14], a15 = a[15];
    let b_0 = b[ 0], b_1 = a[ 1], b_2 = b[ 2], b_3 = b[ 3],
        b_4 = b[ 4], b_5 = a[ 5], b_6 = b[ 6], b_7 = b[ 7],
        b_8 = b[ 8], b_9 = a[ 9], b10 = b[10], b11 = b[11],
        b12 = b[12], b13 = a[13], b14 = b[14], b15 = b[15]
    // tslint:enable
    c[0] = b_0 * a_0 + b_1 * a_4 + b_2 * a_8 + b_3 * a12
    c[1] = b_0 * a_1 + b_1 * a_5 + b_2 * a_9 + b_3 * a13
    c[2] = b_0 * a_2 + b_1 * a_6 + b_2 * a10 + b_3 * a14
    c[3] = b_0 * a_3 + b_1 * a_7 + b_2 * a11 + b_3 * a15
    c[4] = b_4 * a_0 + b_5 * a_4 + b_6 * a_8 + b_7 * a12
    c[5] = b_4 * a_1 + b_5 * a_5 + b_6 * a_9 + b_7 * a13
    c[6] = b_4 * a_2 + b_5 * a_6 + b_6 * a10 + b_7 * a14
    c[7] = b_4 * a_3 + b_5 * a_7 + b_6 * a11 + b_7 * a15
    c[8] = b_8 * a_0 + b_9 * a_4 + b10 * a_8 + b11 * a12
    c[9] = b_8 * a_1 + b_9 * a_5 + b10 * a_9 + b11 * a13
    c[10] = b_8 * a_2 + b_9 * a_6 + b10 * a10 + b11 * a14
    c[11] = b_8 * a_3 + b_9 * a_7 + b10 * a11 + b11 * a15
    c[12] = b12 * a_0 + b13 * a_4 + b14 * a_8 + b15 * a12
    c[13] = b12 * a_1 + b13 * a_5 + b14 * a_9 + b15 * a13
    c[14] = b12 * a_2 + b13 * a_6 + b14 * a10 + b15 * a14
    c[15] = b12 * a_3 + b13 * a_7 + b14 * a11 + b15 * a15
    return this
  }
  public concatOut(other: Mat4, out?: Mat4): Mat4 {
    out = out || new Mat4() as any
    const a = out.data
    const b = other.data
    const c = out.data
    // tslint:disable
    let a_0 = a[ 0], a_1 = a[ 1], a_2 = a[ 2], a_3 = a[ 3],
        a_4 = a[ 4], a_5 = a[ 5], a_6 = a[ 6], a_7 = a[ 7],
        a_8 = a[ 8], a_9 = a[ 9], a10 = a[10], a11 = a[11],
        a12 = a[12], a13 = a[13], a14 = a[14], a15 = a[15]
    let b_0 = b[ 0], b_1 = a[ 1], b_2 = b[ 2], b_3 = b[ 3],
        b_4 = b[ 4], b_5 = a[ 5], b_6 = b[ 6], b_7 = b[ 7],
        b_8 = b[ 8], b_9 = a[ 9], b10 = b[10], b11 = b[11],
        b12 = b[12], b13 = a[13], b14 = b[14], b15 = b[15]
    // tslint:enable
    c[0] = b_0 * a_0 + b_1 * a_4 + b_2 * a_8 + b_3 * a12
    c[1] = b_0 * a_1 + b_1 * a_5 + b_2 * a_9 + b_3 * a13
    c[2] = b_0 * a_2 + b_1 * a_6 + b_2 * a10 + b_3 * a14
    c[3] = b_0 * a_3 + b_1 * a_7 + b_2 * a11 + b_3 * a15
    c[4] = b_4 * a_0 + b_5 * a_4 + b_6 * a_8 + b_7 * a12
    c[5] = b_4 * a_1 + b_5 * a_5 + b_6 * a_9 + b_7 * a13
    c[6] = b_4 * a_2 + b_5 * a_6 + b_6 * a10 + b_7 * a14
    c[7] = b_4 * a_3 + b_5 * a_7 + b_6 * a11 + b_7 * a15
    c[8] = b_8 * a_0 + b_9 * a_4 + b10 * a_8 + b11 * a12
    c[9] = b_8 * a_1 + b_9 * a_5 + b10 * a_9 + b11 * a13
    c[10] = b_8 * a_2 + b_9 * a_6 + b10 * a10 + b11 * a14
    c[11] = b_8 * a_3 + b_9 * a_7 + b10 * a11 + b11 * a15
    c[12] = b12 * a_0 + b13 * a_4 + b14 * a_8 + b15 * a12
    c[13] = b12 * a_1 + b13 * a_5 + b14 * a_9 + b15 * a13
    c[14] = b12 * a_2 + b13 * a_6 + b14 * a10 + b15 * a14
    c[15] = b12 * a_3 + b13 * a_7 + b14 * a11 + b15 * a15
    return out
  }

  /**
   * Multiplies each component of `this` with given scalar
   * @param scalar The scalar to multiply
   * @return Reference to `this` for chaining.
   */
  public multiplyScalar(s: number): Mat4 {
    const a = this.data
    // tslint:disable
    a[ 0] *= s; a[ 1] *= s; a[ 2] *= s; a[ 3] *= s;
    a[ 4] *= s; a[ 5] *= s; a[ 6] *= s; a[ 7] *= s;
    a[ 8] *= s; a[ 9] *= s; a[10] *= s; a[11] *= s;
    a[12] *= s; a[13] *= s; a[14] *= s; a[15] *= s;
    // tslint:enable
    return this
  }
  public multiplyScalarOut(s: number, out?: Mat4): Mat4 {
    out = out || new Mat4()
    const a = out.data
    const b = s
    const c = out.data
    // tslint:disable
    c[ 0] = a[ 0] * b; c[ 1] = a[ 1] * b; c[ 2] = a[ 2] * b; c[ 3] = a[ 3] * b;
    c[ 4] = a[ 4] * b; c[ 5] = a[ 5] * b; c[ 6] = a[ 6] * b; c[ 7] = a[ 7] * b;
    c[ 8] = a[ 8] * b; c[ 9] = a[ 9] * b; c[10] = a[10] * b; c[11] = a[11] * b;
    c[12] = a[12] * b; c[13] = a[13] * b; c[14] = a[14] * b; c[15] = a[15] * b;
    // tslint:enable
    return out
  }

  /**
   * Divides each matching component pair
   * @param other The matrix by which to divide
   * @return Reference to `this` for chaining.
   */
  public divide(other: Mat4): Mat4 {
    const a = this.data
    const b = other.data
    // tslint:disable
    a[ 0] /= b[ 0]; a[ 1] /= b[ 1]; a[ 2] /= b[ 2]; a[ 3] /= b[ 3];
    a[ 4] /= b[ 4]; a[ 5] /= b[ 5]; a[ 6] /= b[ 6]; a[ 7] /= b[ 7];
    a[ 8] /= b[ 8]; a[ 9] /= b[ 9]; a[10] /= b[10]; a[11] /= b[11];
    a[12] /= b[12]; a[13] /= b[13]; a[14] /= b[14]; a[15] /= b[15];
    // tslint:enable
    return this
  }

  /**
   * Divides each component of `this` by given scalar
   * @param scalar The scalar by which to divide
   * @return Reference to `this` for chaining.
   */
  public divideScalar(s: number): Mat4 {
    const a = this.data
    const b = 1.0 / s
    // tslint:disable
    a[ 0] *= b; a[ 1] *= b; a[ 2] *= b; a[ 3] *= b;
    a[ 4] *= b; a[ 5] *= b; a[ 6] *= b; a[ 7] *= b;
    a[ 8] *= b; a[ 9] *= b; a[10] *= b; a[11] *= b;
    a[12] *= b; a[13] *= b; a[14] *= b; a[15] *= b;
    // tslint:enable
    return this
  }

  public divideScalarOut(s: number, out?: Mat4): Mat4 {
    out = out || new Mat4()
    const a = out.data
    const b = 1.0 / s
    const c = out.data
    // tslint:disable
    c[ 0] = a[ 0] * b; c[ 1] = a[ 1] * b; c[ 2] = a[ 2] * b; c[ 3] = a[ 3] * b;
    c[ 4] = a[ 4] * b; c[ 5] = a[ 5] * b; c[ 6] = a[ 6] * b; c[ 7] = a[ 7] * b;
    c[ 8] = a[ 8] * b; c[ 9] = a[ 9] * b; c[10] = a[10] * b; c[11] = a[11] * b;
    c[12] = a[12] * b; c[13] = a[13] * b; c[14] = a[14] * b; c[15] = a[15] * b;
    // tslint:enable
    return out
  }

  /**
   * Transform the given vector with this matrix.
   * @param vec
   * @return the given vector
   */
  public transform<T extends IVec2|IVec3|IVec4>(vec: T): T {
    const x = vec.x || 0
    const y = vec.y || 0
    const z = (vec as IVec3).z || 0
    const w = (vec as IVec4).w != null ? (vec as IVec4).w : 1
    const d = this.data
    vec.x = x * d[0] + y * d[4] + z * d[8] + w * d[12]
    vec.y = x * d[1] + y * d[5] + z * d[9] + w * d[13]
    if ((vec as IVec3).z != null) {
      (vec as IVec3).z = x * d[2] + y * d[6] + z * d[10] + w * d[14]
      if ((vec as IVec4).w != null) {
        (vec as IVec4).w = x * d[3] + y * d[7] + z * d[11] + w * d[15]
      }
    }
    return vec
  }

  /**
   * Rotates and scales the given vector with this matrix.
   * @param vec
   * @return the given vector
   */
  public transformNormal<T extends IVec2|IVec3|IVec4>(vec: T): T {
    const x = vec.x || 0
    const y = vec.y || 0
    const z = (vec as IVec3).z || 0
    const d = this.data
    vec.x = x * d[0] + y * d[4] + z * d[8]
    vec.y = x * d[1] + y * d[5] + z * d[9]
    if ((vec as IVec3).z != null) {
      (vec as IVec3).z = x * d[2] + y * d[6] + z * d[10]
    }
    return vec
  }

  /**
   * Transforms the given buffer with `this` matrix.
   * @param buffer
   * @param [offset=0]
   * @param [stride=2]
   * @param [count=buffer.length]
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
      buffer[offset] = x * d[0] + y * d[4] + d[8] + d[12]
      buffer[offset + 1] = x * d[1] + y * d[5] + d[9] + d[13]
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
    let z
    const d = this.data
    offset = offset || 0
    stride = stride === undefined ? 3 : stride
    count = count === undefined ? buffer.length / stride : count

    while (count > 0) {
      count--
      x = buffer[offset]
      y = buffer[offset + 1]
      z = buffer[offset + 2]
      buffer[offset] = x * d[0] + y * d[4] + z * d[8] + d[12]
      buffer[offset + 1] = x * d[1] + y * d[5] + z * d[9] + d[13]
      buffer[offset + 2] = x * d[2] + y * d[6] + z * d[10] + d[14]
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
    let z
    let w
    const d = this.data
    offset = offset || 0
    stride = stride === undefined ? 4 : stride
    count = count === undefined ? buffer.length / stride : count

    while (count > 0) {
      count--
      x = buffer[offset]
      y = buffer[offset + 1]
      z = buffer[offset + 2]
      w = buffer[offset + 3]
      buffer[offset] = x * d[0] + y * d[4] + z * d[8] + w * d[12]
      buffer[offset + 1] = x * d[1] + y * d[5] + z * d[9] + w * d[13]
      buffer[offset + 2] = x * d[2] + y * d[6] + z * d[10] + w * d[14]
      buffer[offset + 3] = x * d[3] + y * d[7] + z * d[11] + w * d[15]
      offset += stride
    }
  }

  /**
   * Transforms the given buffer with the rotation and scale part of `this` matrix.
   * @param buffer
   * @param [offset=0]
   * @param [stride=3]
   * @param [count=buffer.length]
   */
  public transformNormalBuffer(buffer: ArrayLike<number>, offset?: number, stride?: number, count?: number) {
    let x
    let y
    let z
    const d = this.data
    offset = offset || 0
    stride = stride === undefined ? 3 : stride
    count = count === undefined ? buffer.length / stride : count

    while (count > 0) {
      count--
      x = buffer[offset]
      y = buffer[offset + 1]
      z = buffer[offset + 2]
      buffer[offset] = x * d[0] + y * d[4] + z * d[8]
      buffer[offset + 1] = x * d[1] + y * d[5] + z * d[9]
      buffer[offset + 2] = x * d[2] + y * d[6] + z * d[10]
      offset += stride
    }
  }

  /**
   * Transpose the given matrix
   * @param mat The matrix to transpose
   * @param [out] The matrix to write to
   * @return The given `out` parameter or a new matrix
   */
  public static transpose(mat: Mat4, out?: Mat4): Mat4 {
    const d = mat.data
    return (out || new Mat4()).init(
      d[0], d[4], d[8], d[12],
      d[1], d[5], d[9], d[13],
      d[2], d[6], d[10], d[14],
      d[3], d[7], d[11], d[15],
    )
  }

  /**
   * Invert the given matrix
   * @param mat The matrix to transpose
   * @param [out] The matrix to write to
   * @return The given `out` parameter or a new matrix
   */
  public static invert(mat: Mat4, out?: Mat4): Mat4 {
    out = out || new Mat4()
    const a = mat.data
    const b = out.data

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
   * Negate the components of the given matrix
   * @param mat The matrix to transpose
   * @param [out] The matrix to write to
   * @return The given `out` parameter or a new matrix
   */
  public static negate(mat: Mat4, out?: Mat4): Mat4 {
    out = out || new Mat4()
    const d = mat.data
    const o = out.data
    // tslint:disable
    o[ 0] = -d[ 0]; o[ 1] = -d[ 1]; o[ 2] = -d[ 2]; o[ 3] = -d[ 3];
    o[ 4] = -d[ 4]; o[ 5] = -d[ 5]; o[ 6] = -d[ 6]; o[ 7] = -d[ 7];
    o[ 8] = -d[ 8]; o[ 9] = -d[ 9]; o[10] = -d[10]; o[11] = -d[11];
    o[12] = -d[12]; o[13] = -d[13]; o[14] = -d[14]; o[15] = -d[15];
    // tslint:enable
    return out
  }

  /**
   * Adds a matrix to another
   * @param matA The first matrix
   * @param matB The second matrix
   * @param [out] The matrix to write to
   * @return The given `out` parameter or a new matrix
   */
  public static add(matA: Mat4, matB: Mat4, out?: Mat4): Mat4 {
    out = out || new Mat4()
    const a = matA.data
    const b = matB.data
    const c = out.data
    // tslint:disable
    c[ 0] = a[ 0] + b[ 0]; c[ 1] = a[ 1] + b[ 1]; c[ 2] = a[ 2] + b[ 2]; c[ 3] = a[ 3] + b[ 3];
    c[ 4] = a[ 4] + b[ 4]; c[ 5] = a[ 5] + b[ 5]; c[ 6] = a[ 6] + b[ 6]; c[ 7] = a[ 7] + b[ 7];
    c[ 8] = a[ 8] + b[ 8]; c[ 9] = a[ 9] + b[ 9]; c[10] = a[10] + b[10]; c[11] = a[11] + b[11];
    c[12] = a[12] + b[12]; c[13] = a[13] + b[13]; c[14] = a[14] + b[14]; c[15] = a[15] + b[15];
    // tslint:enable
    return out
  }

  /**
   * Adds a scalar to each component of a matrix
   * @param mat The matrix
   * @param scalar The scalar to add
   * @param [out] The matrix to write to
   * @return The given `out` parameter or a new matrix
   */
  public static addScalar(mat: Mat4, scalar: number, out?: Mat4): Mat4 {
    out = out || new Mat4()
    const a = mat.data
    const c = out.data
    // tslint:disable
    c[ 0] = a[ 0] + scalar; c[ 1] = a[ 1] + scalar; c[ 2] = a[ 2] + scalar; c[ 3] = a[ 3] + scalar;
    c[ 4] = a[ 4] + scalar; c[ 5] = a[ 5] + scalar; c[ 6] = a[ 6] + scalar; c[ 7] = a[ 7] + scalar;
    c[ 8] = a[ 8] + scalar; c[ 9] = a[ 9] + scalar; c[10] = a[10] + scalar; c[11] = a[11] + scalar;
    c[12] = a[12] + scalar; c[13] = a[13] + scalar; c[14] = a[14] + scalar; c[15] = a[15] + scalar;
    // tslint:enable
    return out
  }

  /**
   * Subtracts the second matrix from the first
   * @param matA The first matrix
   * @param matB The second matrix
   * @param [out] The matrix to write to
   * @return The given `out` parameter or a new matrix
   */
  public static subtract(matA: Mat4, matB: Mat4, out?: Mat4): Mat4 {
    out = out || new Mat4()
    const a = matA.data
    const b = matB.data
    const c = out.data
    // tslint:disable
    c[ 0] = a[ 0] - b[ 0]; c[ 1] = a[ 1] - b[ 1]; c[ 2] = a[ 2] - b[ 2]; c[ 3] = a[ 3] - b[ 3];
    c[ 4] = a[ 4] - b[ 4]; c[ 5] = a[ 5] - b[ 5]; c[ 6] = a[ 6] - b[ 6]; c[ 7] = a[ 7] - b[ 7];
    c[ 8] = a[ 8] - b[ 8]; c[ 9] = a[ 9] - b[ 9]; c[10] = a[10] - b[10]; c[11] = a[11] - b[11];
    c[12] = a[12] - b[12]; c[13] = a[13] - b[13]; c[14] = a[14] - b[14]; c[15] = a[15] - b[15];
    // tslint:enable
    return out
  }

  /**
   * Subtracts a scalar from each somponent of a matrix
   * @param mat The matrix to subtract from
   * @param scalar The scalar to subtract
   * @param [out] The matrix to write to
   * @return The given `out` parameter or a new matrix
   */
  public static subtractScalar(mat: Mat4, scalar: number, out?: Mat4): Mat4 {
    out = out || new Mat4()
    const a = mat.data
    const c = out.data
    // tslint:disable
    c[ 0] = a[ 0] - scalar; c[ 1] = a[ 1] - scalar; c[ 2] = a[ 2] - scalar; c[ 3] = a[ 3] - scalar;
    c[ 4] = a[ 4] - scalar; c[ 5] = a[ 5] - scalar; c[ 6] = a[ 6] - scalar; c[ 7] = a[ 7] - scalar;
    c[ 8] = a[ 8] - scalar; c[ 9] = a[ 9] - scalar; c[10] = a[10] - scalar; c[11] = a[11] - scalar;
    c[12] = a[12] - scalar; c[13] = a[13] - scalar; c[14] = a[14] - scalar; c[15] = a[15] - scalar;
    // tslint:enable
    return out
  }

  /**
   * Multiplies a matrix by another matrix
   * @param matA The first matrix
   * @param matB The second matrix
   * @param [out] The matrix to write to
   * @return The given `out` parameter or a new matrix
   */
  public static multiply(matA: Mat4, matB: Mat4, out?: Mat4): Mat4 {
    out = out || new Mat4()
    const a = matB.data
    const b = matA.data
    const c = out.data
    // tslint:disable
    let a_0 = a[ 0], a_1 = a[ 1], a_2 = a[ 2], a_3 = a[ 3],
        a_4 = a[ 4], a_5 = a[ 5], a_6 = a[ 6], a_7 = a[ 7],
        a_8 = a[ 8], a_9 = a[ 9], a10 = a[10], a11 = a[11],
        a12 = a[12], a13 = a[13], a14 = a[14], a15 = a[15];
    let b_0 = b[ 0], b_1 = a[ 1], b_2 = b[ 2], b_3 = b[ 3],
        b_4 = b[ 4], b_5 = a[ 5], b_6 = b[ 6], b_7 = b[ 7],
        b_8 = b[ 8], b_9 = a[ 9], b10 = b[10], b11 = b[11],
        b12 = b[12], b13 = a[13], b14 = b[14], b15 = b[15];
    // tslint:enable
    c[0 ] = b_0 * a_0 + b_1 * a_4 + b_2 * a_8 + b_3 * a12
    c[1 ] = b_0 * a_1 + b_1 * a_5 + b_2 * a_9 + b_3 * a13
    c[2 ] = b_0 * a_2 + b_1 * a_6 + b_2 * a10 + b_3 * a14
    c[3 ] = b_0 * a_3 + b_1 * a_7 + b_2 * a11 + b_3 * a15
    c[4 ] = b_4 * a_0 + b_5 * a_4 + b_6 * a_8 + b_7 * a12
    c[5 ] = b_4 * a_1 + b_5 * a_5 + b_6 * a_9 + b_7 * a13
    c[6 ] = b_4 * a_2 + b_5 * a_6 + b_6 * a10 + b_7 * a14
    c[7 ] = b_4 * a_3 + b_5 * a_7 + b_6 * a11 + b_7 * a15
    c[8 ] = b_8 * a_0 + b_9 * a_4 + b10 * a_8 + b11 * a12
    c[9 ] = b_8 * a_1 + b_9 * a_5 + b10 * a_9 + b11 * a13
    c[10] = b_8 * a_2 + b_9 * a_6 + b10 * a10 + b11 * a14
    c[11] = b_8 * a_3 + b_9 * a_7 + b10 * a11 + b11 * a15
    c[12] = b12 * a_0 + b13 * a_4 + b14 * a_8 + b15 * a12
    c[13] = b12 * a_1 + b13 * a_5 + b14 * a_9 + b15 * a13
    c[14] = b12 * a_2 + b13 * a_6 + b14 * a10 + b15 * a14
    c[15] = b12 * a_3 + b13 * a_7 + b14 * a11 + b15 * a15
    return out
  }

  /**
   * Multiplies a matrix by another matrix
   * @param matA The first matrix
   * @param matB The second matrix
   * @param [out] The matrix to write to
   * @return The given `out` parameter or a new matrix
   */
  public static concat(matA: Mat4, matB: Mat4, out: Mat4) {
    out = out || new Mat4()
    const a = matA.data
    const b = matB.data
    const c = out.data
    // tslint:disable
    let a_0 = a[ 0], a_1 = a[ 1], a_2 = a[ 2], a_3 = a[ 3],
        a_4 = a[ 4], a_5 = a[ 5], a_6 = a[ 6], a_7 = a[ 7],
        a_8 = a[ 8], a_9 = a[ 9], a10 = a[10], a11 = a[11],
        a12 = a[12], a13 = a[13], a14 = a[14], a15 = a[15];
    let b_0 = b[ 0], b_1 = a[ 1], b_2 = b[ 2], b_3 = b[ 3],
        b_4 = b[ 4], b_5 = a[ 5], b_6 = b[ 6], b_7 = b[ 7],
        b_8 = b[ 8], b_9 = a[ 9], b10 = b[10], b11 = b[11],
        b12 = b[12], b13 = a[13], b14 = b[14], b15 = b[15];
    // tslint:enable
    c[0 ] = b_0 * a_0 + b_1 * a_4 + b_2 * a_8 + b_3 * a12
    c[1 ] = b_0 * a_1 + b_1 * a_5 + b_2 * a_9 + b_3 * a13
    c[2 ] = b_0 * a_2 + b_1 * a_6 + b_2 * a10 + b_3 * a14
    c[3 ] = b_0 * a_3 + b_1 * a_7 + b_2 * a11 + b_3 * a15
    c[4 ] = b_4 * a_0 + b_5 * a_4 + b_6 * a_8 + b_7 * a12
    c[5 ] = b_4 * a_1 + b_5 * a_5 + b_6 * a_9 + b_7 * a13
    c[6 ] = b_4 * a_2 + b_5 * a_6 + b_6 * a10 + b_7 * a14
    c[7 ] = b_4 * a_3 + b_5 * a_7 + b_6 * a11 + b_7 * a15
    c[8 ] = b_8 * a_0 + b_9 * a_4 + b10 * a_8 + b11 * a12
    c[9 ] = b_8 * a_1 + b_9 * a_5 + b10 * a_9 + b11 * a13
    c[10] = b_8 * a_2 + b_9 * a_6 + b10 * a10 + b11 * a14
    c[11] = b_8 * a_3 + b_9 * a_7 + b10 * a11 + b11 * a15
    c[12] = b12 * a_0 + b13 * a_4 + b14 * a_8 + b15 * a12
    c[13] = b12 * a_1 + b13 * a_5 + b14 * a_9 + b15 * a13
    c[14] = b12 * a_2 + b13 * a_6 + b14 * a10 + b15 * a14
    c[15] = b12 * a_3 + b13 * a_7 + b14 * a11 + b15 * a15
    return this
  }

  /**
   * Multiplies a chain of matrices
   * @method concatChain
   * @return The result of the multiplication
   */
  public static concatChain(...rest: Mat4[]) {
    // (a, (b, (c, (d, e))))
    const result = arguments[arguments.length - 1].clone()
    for (let i = arguments.length - 2; i >= 0; i--) {
      Mat4.concat(arguments[i], result, result)
    }
    return result
  }

  /**
   * Multiplies a chain of matrices
   * @method multiplyChain
   * @return The result of the multiplication
   */
  public static multiplyChain(...rest: Mat4[]) {
    // ((((a, b), c), d), e)
    const result = arguments[0].clone()
    for (let i = 1; i < arguments.length; i += 1) {
      Mat4.multiply(result, arguments[i], result)
    }
    return result
  }

  /**
   * Multiplies a matrix with a scalar value
   * @method multiplyScalar
   * @param matA The matrix
   * @param scalar The scalar to multiply
   * @param [out] The matrix to write to
   * @return The given `out` parameter or a new matrix
   */
  public static multiplyScalar(matA: Mat4, scalar: number, out?: Mat4): Mat4 {
    out = out || new Mat4()
    const a = matA.data
    const b = scalar
    const c = out.data
    // tslint:disable
    c[ 0] = a[ 0] * b; c[ 1] = a[ 1] * b; c[ 2] = a[ 2] * b; c[ 3] = a[ 3] * b;
    c[ 4] = a[ 4] * b; c[ 5] = a[ 5] * b; c[ 6] = a[ 6] * b; c[ 7] = a[ 7] * b;
    c[ 8] = a[ 8] * b; c[ 9] = a[ 9] * b; c[10] = a[10] * b; c[11] = a[11] * b;
    c[12] = a[12] * b; c[13] = a[13] * b; c[14] = a[14] * b; c[15] = a[15] * b;
    // tslint:enable
    return out
  }

  /**
   * Divides the components of the first matrix by the components of the second matrix
   * @param matA The first matrix
   * @param matB The second matrix
   * @param [out] The matrix to write to
   * @return The given `out` parameter or a new matrix
   */
  public static divide(matA: Mat4, matB: Mat4, out?: Mat4): Mat4 {
    out = out || new Mat4()
    const a = matA.data
    const b = matB.data
    const c = out.data
    // tslint:disable
    c[ 0] = a[ 0] / b[ 0]; c[ 1] = a[ 1] / b[ 1]; c[ 2] = a[ 2] / b[ 2]; c[ 3] = a[ 3] / b[ 3];
    c[ 4] = a[ 4] / b[ 4]; c[ 5] = a[ 5] / b[ 5]; c[ 6] = a[ 6] / b[ 6]; c[ 7] = a[ 7] / b[ 7];
    c[ 8] = a[ 8] / b[ 8]; c[ 9] = a[ 9] / b[ 9]; c[10] = a[10] / b[10]; c[11] = a[11] / b[11];
    c[12] = a[12] / b[12]; c[13] = a[13] / b[13]; c[14] = a[14] / b[14]; c[15] = a[15] / b[15];
    // tslint:enable
    return out
  }

  /**
   * Divides the components of a matrix by a scalar
   * @param matA The matrix
   * @param scalar The scalar by which to divide
   * @param [out] The matrix to write to
   * @return The given `out` parameter or a new matrix
   */
  public static divideScalar(matA: Mat4, scalar: number, out?: Mat4): Mat4 {
    out = out || new Mat4()
    const a = matA.data
    const b = 1 / scalar
    const c = out.data
    // tslint:disable
    c[ 0] = a[ 0] * b; c[ 1] = a[ 1] * b; c[ 2] = a[ 2] * b; c[ 3] = a[ 3] * b;
    c[ 4] = a[ 4] * b; c[ 5] = a[ 5] * b; c[ 6] = a[ 6] * b; c[ 7] = a[ 7] * b;
    c[ 8] = a[ 8] * b; c[ 9] = a[ 9] * b; c[10] = a[10] * b; c[11] = a[11] * b;
    c[12] = a[12] * b; c[13] = a[13] * b; c[14] = a[14] * b; c[15] = a[15] * b;
    // tslint:enable
    return out
  }

  /**
   * Performs a linear interpolation between two matrices
   * @param matA The first matrix
   * @param matB The second matrix
   * @param t The interpolation value. This is assumed to be in [0:1] range
   * @param [out] The matrix to write to
   * @return The given `out` parameter or a new matrix
   */
  public static lerp(matA: Mat4, matB: Mat4, t: number, out?: Mat4): Mat4 {
    out = out || new Mat4()
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
    c[9] = a[9] + (b[9] - a[9]) * t
    c[10] = a[10] + (b[10] - a[10]) * t
    c[11] = a[11] + (b[11] - a[11]) * t
    c[12] = a[12] + (b[12] - a[12]) * t
    c[13] = a[13] + (b[13] - a[13]) * t
    c[14] = a[14] + (b[14] - a[14]) * t
    c[15] = a[15] + (b[15] - a[15]) * t
    return out
  }

  /**
   * Creates a new matrix with all components set to 0
   * @return a new matrix
   */
  public static zero(): Mat4 {
    return new Mat4()
  }

  /**
   * Creates a new matrix that is initialized to identity
   * @return a new matrix
   */
  public static identity(): Mat4 {
    return new Mat4().initIdentity()
  }

  /**
   * Creates a new matrix. This method should be called with 16 or 0 arguments. If less than 16 but more than 0 arguments
   * are given some components are going to be undefined. The arguments are expected to be in column major order.
   * @return a new matrix
   */
  public static create(
    m0: number, m1: number, m2: number, m3: number,
    m4: number, m5: number, m6: number, m7: number,
    m8: number, m9: number, m10: number, m11: number,
    m12: number, m13: number, m14: number, m15: number,
  ): Mat4 {
    const out = new Mat4()
    const d = out.data
    // tslint:disable
    d[ 0] = m0;  d[ 1] = m1;  d[ 2] = m2;  d[ 3] = m3;
    d[ 4] = m4;  d[ 5] = m5;  d[ 6] = m6;  d[ 7] = m7;
    d[ 8] = m8;  d[ 9] = m9;  d[10] = m10; d[11] = m11;
    d[12] = m12; d[13] = m13; d[14] = m14; d[15] = m15;
    // tslint:enable
    return out
  }

  /**
   * Creates a new matrix. The arguments are expected to be in row major order.
   * @return a new matrix
   */
  public static createRowMajor(
    m0: number, m4: number, m8: number, m12: number,
    m1: number, m5: number, m9: number, m13: number,
    m2: number, m6: number, m10: number, m14: number,
    m3: number, m7: number, m11: number, m15: number,
  ): Mat4 {
    const out = new Mat4()
    const d = out.data
    // tslint:disable
    d[ 0] = m0;  d[ 1] = m1;  d[ 2] = m2;  d[ 3] = m3;
    d[ 4] = m4;  d[ 5] = m5;  d[ 6] = m6;  d[ 7] = m7;
    d[ 8] = m8;  d[ 9] = m9;  d[10] = m10; d[11] = m11;
    d[12] = m12; d[13] = m13; d[14] = m14; d[15] = m15;
    // tslint:enable
    return out
  }

  /**
   * @return a new matrix
   */
  public static createScale(x: number, y: number, z: number): Mat4 {
    return new Mat4().initScale(x, y, z)
  }

  /**
   * @return a new matrix
   */
  public static createTranslation(x: number, y: number, z: number): Mat4 {
    return new Mat4().initTranslation(x, y, z)
  }

  /**
   * @return a new matrix
   */
  public static createLookAt(pos: IVec3, lookAt: IVec3, up: IVec3): Mat4 {
    return new Mat4().initLookAt(pos, lookAt, up)
  }

  /**
   * @return a new matrix
   */
  public static createWorld(position: IVec3, forward: IVec3, up: IVec3) {
    return new Mat4().initWorld(position, forward, up)
  }

  /**
   * @return a new matrix
   */
  public static createPerspectiveFieldOfView(fov: number, aspec: number, near: number, far: number): Mat4 {
    return new Mat4().initPerspectiveFieldOfView(fov, aspec, near, far)
  }

  /**
   * @return a new matrix
   */
  public static createPerspective(width: number, height: number, near: number, far: number): Mat4 {
    return new Mat4().initPerspective(width, height, near, far)
  }

  /**
   * @return a new matrix
   */
  public static createPerspectiveOffCenter(left: number, right: number, bottom: number, top: number, near: number, far: number): Mat4 {
    return new Mat4().initPerspectiveOffCenter(left, right, bottom, top, near, far)
  }

  /**
   * @return a new matrix
   */
  public static createOrthographic(width: number, height: number, near: number, far: number): Mat4 {
    return new Mat4().initOrthographic(width, height, near, far)
  }

  /**
   * @return a new matrix
   */
  public static createOrthographicOffCenter(left: number, right: number, bottom: number, top: number, near: number, far: number): Mat4 {
    return new Mat4().initOrthographicOffCenter(left, right, bottom, top, near, far)
  }

  /**
   * @return a new matrix
   */
  public static createRotationX(rad: number): Mat4 {
    return new Mat4().initRotationX(rad)
  }

  /**
   * @return a new matrix
   */
  public static createRotationY(rad: number): Mat4 {
    return new Mat4().initRotationY(rad)
  }

  /**
   * @return a new matrix
   */
  public static createRotationZ(rad: number): Mat4 {
    return new Mat4().initRotationZ(rad)
  }

  /**
   * @return a new matrix
   */
  public static createAxisAngle(axis: IVec3, angle: number): Mat4 {
    return new Mat4().initAxisAngle(axis, angle)
  }

  /**
   * @return a new matrix
   */
  public static createYawPitchRoll(yaw: number, pitch: number, roll: number): Mat4 {
    return new Mat4().initYawPitchRoll(yaw, pitch, roll)
  }

  /**
   * @returns {string}
   */
  public static prettyString(mat: Mat4) {
    const m = mat.data
    const fixed = 5
    return [
      [m[0].toFixed(fixed), m[4].toFixed(fixed), m[8].toFixed(fixed), m[12].toFixed(fixed)].join(', '),
      [m[1].toFixed(fixed), m[5].toFixed(fixed), m[9].toFixed(fixed), m[13].toFixed(fixed)].join(', '),
      [m[2].toFixed(fixed), m[6].toFixed(fixed), m[10].toFixed(fixed), m[14].toFixed(fixed)].join(', '),
      [m[3].toFixed(fixed), m[7].toFixed(fixed), m[11].toFixed(fixed), m[15].toFixed(fixed)].join(', ')
    ].join('\n')
  }

}
