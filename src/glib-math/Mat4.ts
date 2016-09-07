module Glib {

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
    right:Float32Array = this.data.subarray(0, 3)
    up:Float32Array = this.data.subarray(4, 7)
    backward:Float32Array = this.data.subarray(8, 11)
    translation:Float32Array = this.data.subarray(12, 15)

    constructor(public data:Float32Array = new Float32Array(16)) {}

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
    init(m0:number, m1:number, m2:number, m3:number, 
         m4:number, m5:number, m6:number, m7:number, 
         m8:number, m9:number, m10:number, m11:number, 
         m12:number, m13:number, m14:number, m15:number):Mat4 {
      var d = this.data
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
    initRowMajor(m0:number, m4:number, m8:number, m12:number, 
                 m1:number, m5:number, m9:number, m13:number, 
                 m2:number, m6:number, m10:number, m14:number, 
                 m3:number, m7:number, m11:number, m15:number):Mat4 {
      var d = this.data
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
    initWith(number:number):Mat4 {
      var d = this.data
      d[0] = d[1] = d[2] = d[3] = d[4] = d[5] = d[6] = d[7] = d[8] = d[9] = d[10] = d[11] = d[12] = d[13] = d[14] = d[15] = number
      return this
    }

    /**
     * Initializes the components of this matrix to the identity.
     * @return Reference to `this` for chaining.
     */
    initIdentity():Mat4 {
      var d = this.data
      d[0] = d[5] = d[10] = d[15] = 1
      d[1] = d[2] = d[3] = d[4] = d[6] = d[7] = d[8] = d[9] = d[11] = d[12] = d[13] = d[14] = 0
      return this
    }

    /**
     * Initializes this matrix from another matrix.
     * @param other
     * @return Reference to `this` for chaining.
     */
    initFrom(other:Mat4):Mat4 {
      var a = this.data
      var b = other.data
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
    initFromBuffer(buffer:ArrayLike<number>, offset?:number):Mat4 {
      offset = offset || 0
      var a = this.data
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
    initFromQuaternion(q:IVec4):Mat4 {
      var x = q.x
      var y = q.y
      var z = q.z
      var w = q.w
      var xx = x * x
      var yy = y * y
      var zz = z * z
      var xy = x * y
      var zw = z * w
      var zx = z * x
      var yw = y * w
      var yz = y * z
      var xw = x * w
      return this.initRowMajor(
        1 - 2 * (yy + zz), 2 * (xy - zw), 2 * (zx + yw), 0,
        2 * (xy + zw), 1 - 2 * (zz + xx), 2 * (yz - xw), 0,
        2 * (zx - yw), 2 * (yz + xw), 1 - 2 * (yy + xx), 0,
        0, 0, 0, 1
      )
    }

    /**
     * Initializes this matrix to a rotation matrix defined by given axis vector and angle.
     * @param axis The axis vector. This is expected to be normalized.
     * @param angle The angle in radians.
     * @return Reference to `this` for chaining.
     */
    initAxisAngle(axis:IVec3, angle:number):Mat4 {
      // create quaternion
      var halfAngle = angle * 0.5
      var scale = Math.sin(halfAngle)
      var x = axis.x * scale
      var y = axis.y * scale
      var z = axis.z * scale
      var w = Math.cos(halfAngle)

      // matrix from quaternion
      var xx = x * x
      var yy = y * y
      var zz = z * z
      var xy = x * y
      var zw = z * w
      var zx = z * x
      var yw = y * w
      var yz = y * z
      var xw = x * w

      return this.initRowMajor(
        1 - 2 * (yy + zz), 2 * (xy - zw), 2 * (zx + yw), 0,
        2 * (xy + zw), 1 - 2 * (zz + xx), 2 * (yz - xw), 0,
        2 * (zx - yw), 2 * (yz + xw), 1 - 2 * (yy + xx), 0,
        0, 0, 0, 1
      )
    }

    /**
     * Initializes this matrix to a rotation matrix defined by given yaw pitch and roll values.
     * @param yaw Angle in radians around the Y axis
     * @param pitch Angle in radians around the X axis
     * @param roll Angle in radians around the Z axis
     * @return Reference to `this` for chaining.
     */
    initYawPitchRoll(yaw:number, pitch:number, roll:number):Mat4 {
      // create quaternion
      var zHalf = roll * 0.5
      var zSin = Math.sin(zHalf)
      var zCos = Math.cos(zHalf)

      var xHalf = pitch * 0.5
      var xSin = Math.sin(xHalf)
      var xCos = Math.cos(xHalf)

      var yHalf = yaw * 0.5
      var ySin = Math.sin(yHalf)
      var yCos = Math.cos(yHalf)

      var x = yCos * xSin * zCos + ySin * xCos * zSin
      var y = ySin * xCos * zCos - yCos * xSin * zSin
      var z = yCos * xCos * zSin - ySin * xSin * zCos
      var w = yCos * xCos * zCos + ySin * xSin * zSin
      // matrix from quaternion
      var xx = x * x
      var yy = y * y
      var zz = z * z
      var xy = x * y
      var zw = z * w
      var zx = z * x
      var yw = y * w
      var yz = y * z
      var xw = x * w

      return this.initRowMajor(
        1 - 2 * (yy + zz), 2 * (xy - zw), 2 * (zx + yw), 0,
        2 * (xy + zw), 1 - 2 * (zz + xx), 2 * (yz - xw), 0,
        2 * (zx - yw), 2 * (yz + xw), 1 - 2 * (yy + xx), 0,
        0, 0, 0, 1
      )
    }

    /**
     * Initializes this matrix with a rotation around the X axis.
     * @param rad The angle in radians.
     * @return Reference to `this` for chaining.
     */
    initRotationX(rad:number):Mat4 {
      var cos = Math.cos(rad)
      var sin = Math.sin(rad)
      return this.initRowMajor(
        1, 0, 0, 0,
        0, cos, -sin, 0,
        0, sin, cos, 0,
        0, 0, 0, 1
      )
    }

    /**
     * Initializes this matrix with a rotation around the Y axis.
     * @param rad The angle in radians.
     * @return Reference to `this` for chaining.
     */
    initRotationY(rad:number):Mat4 {
      var cos = Math.cos(rad)
      var sin = Math.sin(rad)

      return this.initRowMajor(
        cos, 0, sin, 0,
        0, 1, 0, 0,
        -sin, 0, cos, 0,
        0, 0, 0, 1
      )
    }

    /**
     * Initializes this matrix with a rotation around the Z axis.
     * @param rad The angle in radians.
     * @return Reference to `this` for chaining.
     */
    initRotationZ(rad:number):Mat4 {
      var cos = Math.cos(rad)
      var sin = Math.sin(rad)
      return this.initRowMajor(
        cos, -sin, 0, 0,
        sin, cos, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
      )
    }


    /**
     * Initializes a translation matrix.
     * @param x Translation along the x-axis
     * @param y Translation along the y-axis
     * @param z Translation along the z-axis
     * @return Reference to `this` for chaining.
     */
    initTranslation(x:number, y:number, z:number):Mat4 {
      return this.initRowMajor(
        1, 0, 0, x,
        0, 1, 0, y,
        0, 0, 1, z,
        0, 0, 0, 1
      )
    }

    /**
     * Initializes a scale matrix.
     * @param x Scale along x-axis
     * @param y Scale along y-axis
     * @param z Scale along z-axis
     * @return Reference to `this` for chaining.
     */
    initScale(x:number, y:number, z:number):Mat4 {
      return this.initRowMajor(
        x, 0, 0, 0,
        0, y, 0, 0,
        0, 0, z, 0,
        0, 0, 0, 1
      )
    }

    /**
     * Initializes a rotation matrix by using a position and a lookat point.
     * @param pos The position where the viewer stands
     * @param lookAt The position where the viewer is looking to
     * @param up The up vector of the viewer
     * @return Reference to `this` for chaining.
     */
    initLookAt(pos:IVec3, lookAt:IVec3, up:IVec3):Mat4 {
      // back = position - lookAt
      var backX = pos.x - lookAt.x
      var backY = pos.y - lookAt.y
      var backZ = pos.z - lookAt.z

      // right = cross(up, back)
      var rightX = up.y * backZ - up.z * backY
      var rightY = up.z * backX - up.x * backZ
      var rightZ = up.x * backY - up.y * backX

      // back = normalize(back)
      var d = 1.0 / Math.sqrt(backX * backX + backY * backY + backZ * backZ)
      backX *= d
      backY *= d
      backZ *= d

      // right = normalize(right)
      d = 1.0 / Math.sqrt(rightX * rightX + rightY * rightY + rightZ * rightZ)
      rightX *= d
      rightY *= d
      rightZ *= d

      // up = cross(back, right)
      var upX = backY * rightZ - backZ * rightY
      var upY = backZ * rightX - backX * rightZ
      var upZ = backX * rightY - backY * rightX

      return this.initRowMajor(
        rightX, upX, backX, pos.x,
        rightY, upY, backY, pos.y,
        rightZ, upZ, backZ, pos.z,
        0, 0, 0, 1
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
    initWorld(position:IVec3, forward:IVec3, up:IVec3):Mat4 {
      // backward = negate(normalize(forward))
      var x = forward.x
      var y = forward.y
      var z = forward.z
      var d = 1.0 / Math.sqrt(x * x + y * y + z * z)

      var backX = -x * d
      var backY = -y * d
      var backZ = -z * d

      // right = normalize(cross(up, back))
      x = up.y * backZ - up.z * backY
      y = up.z * backX - up.x * backZ
      z = up.x * backY - up.y * backX
      d = 1.0 / Math.sqrt(x * x + y * y + z * z)

      var rightX = x * d
      var rightY = y * d
      var rightZ = z * d

      // up = cross(back, right)
      x = backY * rightZ - backZ * rightY
      y = backZ * rightX - backX * rightZ
      z = backX * rightY - backY * rightX

      return this.initRowMajor(
        rightX, x, backX, position.x,
        rightY, y, backY, position.y,
        rightZ, z, backZ, position.z,
        0, 0, 0, 1
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
    initPerspectiveFieldOfView(fov:number, aspect:number, near:number, far:number):Mat4 {
      var s = 1.0 / Math.tan(fov * 0.5)
      return this.initRowMajor(
        s / aspect, 0,                            0,                                0,
        0,          s,                            0,                                0,
        0,          0, -(far + near) / (far - near), -(2 * far * near) / (far - near),
        0,          0,                           -1,                                0
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
    initPerspective(width:number, height:number, near:number, far:number):Mat4 {
      return this.initRowMajor(
        near / width, 0, 0, 0,
        0, near / height, 0, 0,
        0, 0, -(far + near) / (far - near), -(2 * far * near) / (far - near),
        0, 0, -1, 0
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
    initPerspectiveOffCenter(left:number, right:number, bottom:number, top:number, near:number, far:number):Mat4 {
      return this.initRowMajor(
        2 * near / (right - left), 0, (right + left) / (right - left), 0,
        0, 2 * near / (top - bottom), (top + bottom) / (top - bottom), 0,
        0, 0, -(far + near) / (far - near), -(2 * far * near) / (far - near),
        0, 0, -1, 0
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
    initOrthographic(width:number, height:number, near:number, far:number):Mat4 {
      return this.initRowMajor(
        1 / width, 0, 0, 0,
        0, 1 / height, 0, 0,
        0, 0, -2 / (far - near), -(far + near) / (far - near),
        0, 0, 0, 1
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
    initOrthographicOffCenter(left:number, right:number, bottom:number, top:number, near:number, far:number):Mat4 {
      return this.initRowMajor(
        2 / (right - left), 0, 0, -(right + left) / (right - left),
        0, 2 / (top - bottom), 0, -(top + bottom) / (top - bottom),
        0, 0, -2 / (far - near), -(far + near) / (far - near),
        0, 0, 0, 1
      )
    }


    /**
     * Creates a copy of this matrix
     * @return The cloned matrix.
     */
    clone():Mat4 {
      var d = this.data
      return new Mat4().init(d[0], d[1], d[2], d[3], d[4], d[5], d[6], d[7], d[8], d[9], d[10], d[11], d[12], d[13], d[14], d[15])
    }

    /**
     * Copies the components successively into the given array.
     * @param buffer The array to copy into
     * @param [offset=0] Zero based index where to start writing in the array
     * @return the given buffer
     */
    copyTo<T extends ArrayLike<number>>(buffer:T, offset?:number):T {
      offset = offset || 0
      var d = this.data
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
    equals(other:Mat4):boolean {
      var a = this.data
      var b = other.data
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
    getForward<T extends IVec3>(out:T):T {
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
    getBackward<T extends IVec3>(out:T):T {
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
    getRight<T extends IVec3>(out:T):T {
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
    getLeft<T extends IVec3>(out:T):T {
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
    getUp<T extends IVec3>(out:T):T {
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
    getDown<T extends IVec3>(out:T):T {
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
    getTranslation<T extends IVec3>(out:T):T {
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
    getScale<T extends IVec3>(out:T):T {
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
    setForward(vec:IVec3):Mat4 {
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
    setBackward(vec:IVec3):Mat4 {
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
    setRight(vec:IVec3):Mat4 {
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
    setLeft(vec:IVec3):Mat4 {
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
    setUp(vec:IVec3):Mat4 {
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
    setDown(vec:IVec3):Mat4 {
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
    setTranslation(vec:IVec3):Mat4 {
      this.translation[0] = vec.x
      this.translation[1] = vec.y
      this.translation[2] = vec.z
      return this
    }

    setTranslationX(v:number):Mat4 {
      this.translation[0] = v
      return this
    }
    setTranslationY(v:number):Mat4 {
      this.translation[1] = v
      return this
    }
    setTranslationZ(v:number):Mat4 {
      this.translation[2] = v
      return this
    }
    setTranslationXYZ(x:number, y:number, z:number) {
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
    setScale(vec:IVec3):Mat4 {
      this.data[0] = vec.x
      this.data[5] = vec.y
      this.data[10] = vec.z
      return this
    }
    setScaleX(v:number):Mat4 {
      this.data[0] = v
      return this
    }
    setScaleY(v:number):Mat4 {
      this.data[5] = v
      return this
    }
    setScaleZ(v:number):Mat4 {
      this.data[10] = v
      return this
    }
    setScaleXYZ(x:number, y:number, z:number):Mat4 {
      this.data[0] = x
      this.data[5] = y
      this.data[10] = z
      return this
    }

    /**
     * Calculates the determinant of this matrix
     */
    determinant():number {
      var a = this.data

      var a11 = a[0]
      var a12 = a[4]
      var a13 = a[8]
      var a14 = a[12]

      var a21 = a[1]
      var a22 = a[5]
      var a23 = a[9]
      var a24 = a[13]

      var a31 = a[2]
      var a32 = a[6]
      var a33 = a[10]
      var a34 = a[14]

      var a41 = a[3]
      var a42 = a[7]
      var a43 = a[11]
      var a44 = a[15]

      // 2x2 determinants
      var d1 = a33 * a44 - a43 * a34
      var d2 = a23 * a44 - a43 * a24
      var d3 = a23 * a34 - a33 * a24
      var d4 = a13 * a44 - a43 * a14
      var d5 = a13 * a34 - a33 * a14
      var d6 = a13 * a24 - a23 * a14

      // 3x3 determinants
      var det1 = a22 * d1 - a32 * d2 + a42 * d3
      var det2 = a12 * d1 - a32 * d4 + a42 * d5
      var det3 = a12 * d2 - a22 * d4 + a42 * d6
      var det4 = a12 * d3 - a22 * d5 + a32 * d6

      return (a11 * det1 - a21 * det2 + a31 * det3 - a41 * det4)
    }

    /**
     * Transposes this matrix
     * @return Reference to `this` for chaining.
     */
    transpose():Mat4 {
      return Mat4.transpose(this, this)
    }
    transposeOut(out?:Mat4):Mat4 {
      return Mat4.transpose(this, out || new Mat4())
    }
    

    /**
     * Inverts this matrix
     * @return Reference to `this` for chaining.
     */
    invert():Mat4 {
      return Mat4.invert(this, this)
    }
    invertOut(out?:Mat4):Mat4 {
      return Mat4.invert(this, out || new Mat4())
    }

    /**
     * Negates all components of this matrix
     * @return Reference to `this` for chaining.
     */
    negate():Mat4 {
      return Mat4.negate(this, this)
    }
    negateOut(out?:Mat4):Mat4 {
      return Mat4.negate(this, out || new Mat4())
    }

    /**
     * Adds the given matrix to `this`
     * @param other The matrix to add
     * @return Reference to `this` for chaining.
     */
    add(other):Mat4 {
      var a = this.data;
      var b = other.data;
      a[ 0] += b[ 0]; a[ 1] += b[ 1]; a[ 2] += b[ 2]; a[ 3] += b[ 3];
      a[ 4] += b[ 4]; a[ 5] += b[ 5]; a[ 6] += b[ 6]; a[ 7] += b[ 7];
      a[ 8] += b[ 8]; a[ 9] += b[ 9]; a[10] += b[10]; a[11] += b[11];
      a[12] += b[12]; a[13] += b[13]; a[14] += b[14]; a[15] += b[15];
      return this;
    }
    addOut(other:Mat4, out?:Mat4):Mat4 {
      out = out || new Mat4()
      var a = this.data;
      var b = other.data;
      var c = out.data;
      c[ 0] = a[ 0] + b[ 0]; c[ 1] = a[ 1] + b[ 1]; c[ 2] = a[ 2] + b[ 2]; c[ 3] = a[ 3] + b[ 3];
      c[ 4] = a[ 4] + b[ 4]; c[ 5] = a[ 5] + b[ 5]; c[ 6] = a[ 6] + b[ 6]; c[ 7] = a[ 7] + b[ 7];
      c[ 8] = a[ 8] + b[ 8]; c[ 9] = a[ 9] + b[ 9]; c[10] = a[10] + b[10]; c[11] = a[11] + b[11];
      c[12] = a[12] + b[12]; c[13] = a[13] + b[13]; c[14] = a[14] + b[14]; c[15] = a[15] + b[15];
      return out;
    }

    /**
     * Adds the given scalar to each component of `this`
     * @param scalar The scalar to add
     * @return Reference to `this` for chaining.
     */
    addScalar(s:number):Mat4 {
      var a = this.data;
      a[ 0] += s; a[ 1] += s; a[ 2] += s; a[ 3] += s;
      a[ 4] += s; a[ 5] += s; a[ 6] += s; a[ 7] += s;
      a[ 8] += s; a[ 9] += s; a[10] += s; a[11] += s;
      a[12] += s; a[13] += s; a[14] += s; a[15] += s;
      return this;
    }
    addScalarOut(s:number, out?:Mat4):Mat4 {
      out = out || new Mat4()
      var a = out.data;
      var b = s;
      var c = out.data;
      c[ 0] = a[ 0] + b; c[ 1] = a[ 1] + b; c[ 2] = a[ 2] + b; c[ 3] = a[ 3] + b;
      c[ 4] = a[ 4] + b; c[ 5] = a[ 5] + b; c[ 6] = a[ 6] + b; c[ 7] = a[ 7] + b;
      c[ 8] = a[ 8] + b; c[ 9] = a[ 9] + b; c[10] = a[10] + b; c[11] = a[11] + b;
      c[12] = a[12] + b; c[13] = a[13] + b; c[14] = a[14] + b; c[15] = a[15] + b;
      return out;
    }

    /**
     * Subtracts the given matrix from `this`
     * @param other The matrix to subtract
     * @return Reference to `this` for chaining.
     */
    subtract(other):Mat4 {
      var a = this.data;
      var b = other.data;
      a[ 0] -= b[ 0]; a[ 1] -= b[ 1]; a[ 2] -= b[ 2]; a[ 3] -= b[ 3];
      a[ 4] -= b[ 4]; a[ 5] -= b[ 5]; a[ 6] -= b[ 6]; a[ 7] -= b[ 7];
      a[ 8] -= b[ 8]; a[ 9] -= b[ 9]; a[10] -= b[10]; a[11] -= b[11];
      a[12] -= b[12]; a[13] -= b[13]; a[14] -= b[14]; a[15] -= b[15];
      return this;
    }
    subtractOut(other:Mat4, out?:Mat4):Mat4 {
      out = out || new Mat4()
      var a = this.data;
      var b = other.data;
      var c = out.data;
      c[ 0] = a[ 0] - b[ 0]; c[ 1] = a[ 1] - b[ 1]; c[ 2] = a[ 2] - b[ 2]; c[ 3] = a[ 3] - b[ 3];
      c[ 4] = a[ 4] - b[ 4]; c[ 5] = a[ 5] - b[ 5]; c[ 6] = a[ 6] - b[ 6]; c[ 7] = a[ 7] - b[ 7];
      c[ 8] = a[ 8] - b[ 8]; c[ 9] = a[ 9] - b[ 9]; c[10] = a[10] - b[10]; c[11] = a[11] - b[11];
      c[12] = a[12] - b[12]; c[13] = a[13] - b[13]; c[14] = a[14] - b[14]; c[15] = a[15] - b[15];
      return out;
    }

    /**
     * Subtracts the given scalar from each component of `this`
     * @param scalar The scalar to subtract
     * @return Reference to `this` for chaining.
     */
    subtractScalar(s:number):Mat4 {
      var a = this.data;
      a[ 0] -= s; a[ 1] -= s; a[ 2] -= s; a[ 3] -= s;
      a[ 4] -= s; a[ 5] -= s; a[ 6] -= s; a[ 7] -= s;
      a[ 8] -= s; a[ 9] -= s; a[10] -= s; a[11] -= s;
      a[12] -= s; a[13] -= s; a[14] -= s; a[15] -= s;
      return this;
    }
    subtractScalarOut(s:number, out?:Mat4):Mat4 {
      out = out || new Mat4()
      var a = out.data;
      var b = s;
      var c = out.data;
      c[ 0] = a[ 0] - b; c[ 1] = a[ 1] - b; c[ 2] = a[ 2] - b; c[ 3] = a[ 3] - b;
      c[ 4] = a[ 4] - b; c[ 5] = a[ 5] - b; c[ 6] = a[ 6] - b; c[ 7] = a[ 7] - b;
      c[ 8] = a[ 8] - b; c[ 9] = a[ 9] - b; c[10] = a[10] - b; c[11] = a[11] - b;
      c[12] = a[12] - b; c[13] = a[13] - b; c[14] = a[14] - b; c[15] = a[15] - b;
      return out;
    }

    /**
     * Multiplies the given matrix with this
     * @param other The matrix to multiply
     * @return Reference to `this` for chaining.
     */
    multiply(other:Mat4):Mat4 {
      let a = other.data;
      let b = this.data;
      let c = this.data;
      let a_0 = a[ 0], a_1 = a[ 1], a_2 = a[ 2], a_3 = a[ 3],
          a_4 = a[ 4], a_5 = a[ 5], a_6 = a[ 6], a_7 = a[ 7],
          a_8 = a[ 8], a_9 = a[ 9], a10 = a[10], a11 = a[11],
          a12 = a[12], a13 = a[13], a14 = a[14], a15 = a[15];
      let b_0 = b[ 0], b_1 = a[ 1], b_2 = b[ 2], b_3 = b[ 3],
          b_4 = b[ 4], b_5 = a[ 5], b_6 = b[ 6], b_7 = b[ 7],
          b_8 = b[ 8], b_9 = a[ 9], b10 = b[10], b11 = b[11],
          b12 = b[12], b13 = a[13], b14 = b[14], b15 = b[15];
      c[0] = b_0 * a_0 + b_1 * a_4 + b_2 * a_8 + b_3 * a12;
      c[1] = b_0 * a_1 + b_1 * a_5 + b_2 * a_9 + b_3 * a13;
      c[2] = b_0 * a_2 + b_1 * a_6 + b_2 * a10 + b_3 * a14;
      c[3] = b_0 * a_3 + b_1 * a_7 + b_2 * a11 + b_3 * a15;
      c[4] = b_4 * a_0 + b_5 * a_4 + b_6 * a_8 + b_7 * a12;
      c[5] = b_4 * a_1 + b_5 * a_5 + b_6 * a_9 + b_7 * a13;
      c[6] = b_4 * a_2 + b_5 * a_6 + b_6 * a10 + b_7 * a14;
      c[7] = b_4 * a_3 + b_5 * a_7 + b_6 * a11 + b_7 * a15;
      c[8] = b_8 * a_0 + b_9 * a_4 + b10 * a_8 + b11 * a12;
      c[9] = b_8 * a_1 + b_9 * a_5 + b10 * a_9 + b11 * a13;
      c[10] = b_8 * a_2 + b_9 * a_6 + b10 * a10 + b11 * a14;
      c[11] = b_8 * a_3 + b_9 * a_7 + b10 * a11 + b11 * a15;
      c[12] = b12 * a_0 + b13 * a_4 + b14 * a_8 + b15 * a12;
      c[13] = b12 * a_1 + b13 * a_5 + b14 * a_9 + b15 * a13;
      c[14] = b12 * a_2 + b13 * a_6 + b14 * a10 + b15 * a14;
      c[15] = b12 * a_3 + b13 * a_7 + b14 * a11 + b15 * a15;
      return this;
    }
    multiplyOut(other:Mat4, out?:Mat4):Mat4 {
      out = out || new Mat4() as any
      let a = other.data;
      let b = out.data;
      let c = out.data;
      let a_0 = a[ 0], a_1 = a[ 1], a_2 = a[ 2], a_3 = a[ 3],
          a_4 = a[ 4], a_5 = a[ 5], a_6 = a[ 6], a_7 = a[ 7],
          a_8 = a[ 8], a_9 = a[ 9], a10 = a[10], a11 = a[11],
          a12 = a[12], a13 = a[13], a14 = a[14], a15 = a[15];
      let b_0 = b[ 0], b_1 = a[ 1], b_2 = b[ 2], b_3 = b[ 3],
          b_4 = b[ 4], b_5 = a[ 5], b_6 = b[ 6], b_7 = b[ 7],
          b_8 = b[ 8], b_9 = a[ 9], b10 = b[10], b11 = b[11],
          b12 = b[12], b13 = a[13], b14 = b[14], b15 = b[15];
      c[0] = b_0 * a_0 + b_1 * a_4 + b_2 * a_8 + b_3 * a12;
      c[1] = b_0 * a_1 + b_1 * a_5 + b_2 * a_9 + b_3 * a13;
      c[2] = b_0 * a_2 + b_1 * a_6 + b_2 * a10 + b_3 * a14;
      c[3] = b_0 * a_3 + b_1 * a_7 + b_2 * a11 + b_3 * a15;
      c[4] = b_4 * a_0 + b_5 * a_4 + b_6 * a_8 + b_7 * a12;
      c[5] = b_4 * a_1 + b_5 * a_5 + b_6 * a_9 + b_7 * a13;
      c[6] = b_4 * a_2 + b_5 * a_6 + b_6 * a10 + b_7 * a14;
      c[7] = b_4 * a_3 + b_5 * a_7 + b_6 * a11 + b_7 * a15;
      c[8] = b_8 * a_0 + b_9 * a_4 + b10 * a_8 + b11 * a12;
      c[9] = b_8 * a_1 + b_9 * a_5 + b10 * a_9 + b11 * a13;
      c[10] = b_8 * a_2 + b_9 * a_6 + b10 * a10 + b11 * a14;
      c[11] = b_8 * a_3 + b_9 * a_7 + b10 * a11 + b11 * a15;
      c[12] = b12 * a_0 + b13 * a_4 + b14 * a_8 + b15 * a12;
      c[13] = b12 * a_1 + b13 * a_5 + b14 * a_9 + b15 * a13;
      c[14] = b12 * a_2 + b13 * a_6 + b14 * a10 + b15 * a14;
      c[15] = b12 * a_3 + b13 * a_7 + b14 * a11 + b15 * a15;
      return out;
    }

    /**
     * Concatenates the given matrix to this
     * @param other The matrix to concatenate
     * @return Reference to `this` for chaining.
     */
    concat(other:Mat4):Mat4 {
      var a = this.data;
      var b = other.data;
      var c = this.data;
      let a_0 = a[ 0], a_1 = a[ 1], a_2 = a[ 2], a_3 = a[ 3],
          a_4 = a[ 4], a_5 = a[ 5], a_6 = a[ 6], a_7 = a[ 7],
          a_8 = a[ 8], a_9 = a[ 9], a10 = a[10], a11 = a[11],
          a12 = a[12], a13 = a[13], a14 = a[14], a15 = a[15];
      let b_0 = b[ 0], b_1 = a[ 1], b_2 = b[ 2], b_3 = b[ 3],
          b_4 = b[ 4], b_5 = a[ 5], b_6 = b[ 6], b_7 = b[ 7],
          b_8 = b[ 8], b_9 = a[ 9], b10 = b[10], b11 = b[11],
          b12 = b[12], b13 = a[13], b14 = b[14], b15 = b[15];
      c[0] = b_0 * a_0 + b_1 * a_4 + b_2 * a_8 + b_3 * a12;
      c[1] = b_0 * a_1 + b_1 * a_5 + b_2 * a_9 + b_3 * a13;
      c[2] = b_0 * a_2 + b_1 * a_6 + b_2 * a10 + b_3 * a14;
      c[3] = b_0 * a_3 + b_1 * a_7 + b_2 * a11 + b_3 * a15;
      c[4] = b_4 * a_0 + b_5 * a_4 + b_6 * a_8 + b_7 * a12;
      c[5] = b_4 * a_1 + b_5 * a_5 + b_6 * a_9 + b_7 * a13;
      c[6] = b_4 * a_2 + b_5 * a_6 + b_6 * a10 + b_7 * a14;
      c[7] = b_4 * a_3 + b_5 * a_7 + b_6 * a11 + b_7 * a15;
      c[8] = b_8 * a_0 + b_9 * a_4 + b10 * a_8 + b11 * a12;
      c[9] = b_8 * a_1 + b_9 * a_5 + b10 * a_9 + b11 * a13;
      c[10] = b_8 * a_2 + b_9 * a_6 + b10 * a10 + b11 * a14;
      c[11] = b_8 * a_3 + b_9 * a_7 + b10 * a11 + b11 * a15;
      c[12] = b12 * a_0 + b13 * a_4 + b14 * a_8 + b15 * a12;
      c[13] = b12 * a_1 + b13 * a_5 + b14 * a_9 + b15 * a13;
      c[14] = b12 * a_2 + b13 * a_6 + b14 * a10 + b15 * a14;
      c[15] = b12 * a_3 + b13 * a_7 + b14 * a11 + b15 * a15;
      return this;
    }
    concatOut(other:Mat4, out?:Mat4):Mat4 {
      out = out || new Mat4() as any
      var a = out.data;
      var b = other.data;
      var c = out.data;
      let a_0 = a[ 0], a_1 = a[ 1], a_2 = a[ 2], a_3 = a[ 3],
          a_4 = a[ 4], a_5 = a[ 5], a_6 = a[ 6], a_7 = a[ 7],
          a_8 = a[ 8], a_9 = a[ 9], a10 = a[10], a11 = a[11],
          a12 = a[12], a13 = a[13], a14 = a[14], a15 = a[15];
      let b_0 = b[ 0], b_1 = a[ 1], b_2 = b[ 2], b_3 = b[ 3],
          b_4 = b[ 4], b_5 = a[ 5], b_6 = b[ 6], b_7 = b[ 7],
          b_8 = b[ 8], b_9 = a[ 9], b10 = b[10], b11 = b[11],
          b12 = b[12], b13 = a[13], b14 = b[14], b15 = b[15];
      c[0] = b_0 * a_0 + b_1 * a_4 + b_2 * a_8 + b_3 * a12;
      c[1] = b_0 * a_1 + b_1 * a_5 + b_2 * a_9 + b_3 * a13;
      c[2] = b_0 * a_2 + b_1 * a_6 + b_2 * a10 + b_3 * a14;
      c[3] = b_0 * a_3 + b_1 * a_7 + b_2 * a11 + b_3 * a15;
      c[4] = b_4 * a_0 + b_5 * a_4 + b_6 * a_8 + b_7 * a12;
      c[5] = b_4 * a_1 + b_5 * a_5 + b_6 * a_9 + b_7 * a13;
      c[6] = b_4 * a_2 + b_5 * a_6 + b_6 * a10 + b_7 * a14;
      c[7] = b_4 * a_3 + b_5 * a_7 + b_6 * a11 + b_7 * a15;
      c[8] = b_8 * a_0 + b_9 * a_4 + b10 * a_8 + b11 * a12;
      c[9] = b_8 * a_1 + b_9 * a_5 + b10 * a_9 + b11 * a13;
      c[10] = b_8 * a_2 + b_9 * a_6 + b10 * a10 + b11 * a14;
      c[11] = b_8 * a_3 + b_9 * a_7 + b10 * a11 + b11 * a15;
      c[12] = b12 * a_0 + b13 * a_4 + b14 * a_8 + b15 * a12;
      c[13] = b12 * a_1 + b13 * a_5 + b14 * a_9 + b15 * a13;
      c[14] = b12 * a_2 + b13 * a_6 + b14 * a10 + b15 * a14;
      c[15] = b12 * a_3 + b13 * a_7 + b14 * a11 + b15 * a15;
      return out;
    }

    /**
     * Multiplies each component of `this` with given scalar
     * @param scalar The scalar to multiply
     * @return Reference to `this` for chaining.
     */
    multiplyScalar(s:number):Mat4 {
      var a = this.data;
      a[ 0] *= s; a[ 1] *= s; a[ 2] *= s; a[ 3] *= s;
      a[ 4] *= s; a[ 5] *= s; a[ 6] *= s; a[ 7] *= s;
      a[ 8] *= s; a[ 9] *= s; a[10] *= s; a[11] *= s;
      a[12] *= s; a[13] *= s; a[14] *= s; a[15] *= s;
      return this;
    }
    multiplyScalarOut(s:number, out?:Mat4):Mat4 {
      out = out || new Mat4()
      var a = out.data;
      var b = s;
      var c = out.data;
      c[ 0] = a[ 0] * b; c[ 1] = a[ 1] * b; c[ 2] = a[ 2] * b; c[ 3] = a[ 3] * b;
      c[ 4] = a[ 4] * b; c[ 5] = a[ 5] * b; c[ 6] = a[ 6] * b; c[ 7] = a[ 7] * b;
      c[ 8] = a[ 8] * b; c[ 9] = a[ 9] * b; c[10] = a[10] * b; c[11] = a[11] * b;
      c[12] = a[12] * b; c[13] = a[13] * b; c[14] = a[14] * b; c[15] = a[15] * b;
      return out;
    }

    /**
     * Divides each matching component pair
     * @param other The matrix by which to divide
     * @return Reference to `this` for chaining.
     */
    divide(other:Mat4):Mat4 {
      var a = this.data;
      var b = other.data;
      a[ 0] /= b[ 0]; a[ 1] /= b[ 1]; a[ 2] /= b[ 2]; a[ 3] /= b[ 3];
      a[ 4] /= b[ 4]; a[ 5] /= b[ 5]; a[ 6] /= b[ 6]; a[ 7] /= b[ 7];
      a[ 8] /= b[ 8]; a[ 9] /= b[ 9]; a[10] /= b[10]; a[11] /= b[11];
      a[12] /= b[12]; a[13] /= b[13]; a[14] /= b[14]; a[15] /= b[15];
      return this;
    }

    /**
     * Divides each component of `this` by given scalar
     * @param scalar The scalar by which to divide
     * @return Reference to `this` for chaining.
     */
    divideScalar(s:number):Mat4 {
      var a = this.data;
      var b = 1.0 / s;
      a[ 0] *= b; a[ 1] *= b; a[ 2] *= b; a[ 3] *= b;
      a[ 4] *= b; a[ 5] *= b; a[ 6] *= b; a[ 7] *= b;
      a[ 8] *= b; a[ 9] *= b; a[10] *= b; a[11] *= b;
      a[12] *= b; a[13] *= b; a[14] *= b; a[15] *= b;
      return this;
    }
    divideScalarOut(s:number, out?:Mat4):Mat4 {
      out = out || new Mat4()
      var a = out.data;
      var b = 1.0 / s;
      var c = out.data;
      c[ 0] = a[ 0] * b; c[ 1] = a[ 1] * b; c[ 2] = a[ 2] * b; c[ 3] = a[ 3] * b;
      c[ 4] = a[ 4] * b; c[ 5] = a[ 5] * b; c[ 6] = a[ 6] * b; c[ 7] = a[ 7] * b;
      c[ 8] = a[ 8] * b; c[ 9] = a[ 9] * b; c[10] = a[10] * b; c[11] = a[11] * b;
      c[12] = a[12] * b; c[13] = a[13] * b; c[14] = a[14] * b; c[15] = a[15] * b;
      return out;
    }
    /**
     * Transform the given vector with this matrix.
     * @param vec
     * @return the given vector
     */
    transform<T extends IVec2|IVec3|IVec4>(vec:T):T {
      var x = vec.x || 0;
      var y = vec.y || 0;
      var z = vec['z'] || 0;
      var w = vec['w'] != null ? vec['w'] : 1;
      var d = this.data;
      vec.x = x * d[0] + y * d[4] + z * d[8] + w * d[12];
      vec.y = x * d[1] + y * d[5] + z * d[9] + w * d[13];
      if (vec['z'] != null) {
        vec['z'] = x * d[2] + y * d[6] + z * d[10] + w * d[14];
        if (vec['w'] != null) {
          vec['w'] = x * d[3] + y * d[7] + z * d[11] + w * d[15];
        }
      }
      return vec;
    }


    /**
     * Rotates and scales the given vector with this matrix.
     * @param vec
     * @return the given vector
     */
    transformNormal<T extends IVec2|IVec3|IVec4>(vec:T):T {
      var x = vec.x || 0;
      var y = vec.y || 0;
      var z = vec['z'] || 0;
      var d = this.data;
      vec.x = x * d[0] + y * d[4] + z * d[8];
      vec.y = x * d[1] + y * d[5] + z * d[9];
      if (vec['z'] != null) {
        vec['z'] = x * d[2] + y * d[6] + z * d[10];
      }
      return vec;
    }

    /**
     * Transforms the given buffer with `this` matrix.
     * @param buffer
     * @param [offset=0]
     * @param [stride=2]
     * @param [count=buffer.length]
     */
    transformV2Buffer(buffer:ArrayLike<number>, offset?:number, stride?:number, count?:number) {
      var x, y, d = this.data;
      offset = offset || 0;
      stride = stride === undefined ? 2 : stride;
      count = count === undefined ? buffer.length / stride : count;

      while (count > 0) {
        count--;
        x = buffer[offset];
        y = buffer[offset + 1];
        buffer[offset] = x * d[0] + y * d[4] + d[8] + d[12];
        buffer[offset + 1] = x * d[1] + y * d[5] + d[9] + d[13];
        offset += stride;
      }
    }

    /**
     * Transforms the given buffer with `this` matrix.
     * @param buffer
     * @param [offset=0]
     * @param [stride=3]
     * @param [count=buffer.length]
     */
    transformV3Buffer(buffer:ArrayLike<number>, offset?:number, stride?:number, count?:number) {
      var x, y, z, d = this.data;
      offset = offset || 0;
      stride = stride === undefined ? 3 : stride;
      count = count === undefined ? buffer.length / stride : count;

      while (count > 0) {
        count--;
        x = buffer[offset];
        y = buffer[offset + 1];
        z = buffer[offset + 2];
        buffer[offset] = x * d[0] + y * d[4] + z * d[8] + d[12];
        buffer[offset + 1] = x * d[1] + y * d[5] + z * d[9] + d[13];
        buffer[offset + 2] = x * d[2] + y * d[6] + z * d[10] + d[14];
        offset += stride;
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
    transformV4Buffer(buffer:ArrayLike<number>, offset?:number, stride?:number, count?:number) {
      var x, y, z, w, d = this.data;
      offset = offset || 0;
      stride = stride === undefined ? 4 : stride;
      count = count === undefined ? buffer.length / stride : count;

      while (count > 0) {
        count--;
        x = buffer[offset];
        y = buffer[offset + 1];
        z = buffer[offset + 2];
        w = buffer[offset + 3];
        buffer[offset] = x * d[0] + y * d[4] + z * d[8] + w * d[12];
        buffer[offset + 1] = x * d[1] + y * d[5] + z * d[9] + w * d[13];
        buffer[offset + 2] = x * d[2] + y * d[6] + z * d[10] + w * d[14];
        buffer[offset + 3] = x * d[3] + y * d[7] + z * d[11] + w * d[15];
        offset += stride;
      }
    }

    /**
     * Transforms the given buffer with the rotation and scale part of `this` matrix.
     * @param buffer
     * @param [offset=0]
     * @param [stride=3]
     * @param [count=buffer.length]
     */
    transformNormalBuffer(buffer:ArrayLike<number>, offset?:number, stride?:number, count?:number) {
      var x, y, z, d = this.data;
      offset = offset || 0;
      stride = stride === undefined ? 3 : stride;
      count = count === undefined ? buffer.length / stride : count;

      while (count > 0) {
        count--;
        x = buffer[offset];
        y = buffer[offset + 1];
        z = buffer[offset + 2];
        buffer[offset] = x * d[0] + y * d[4] + z * d[8];
        buffer[offset + 1] = x * d[1] + y * d[5] + z * d[9];
        buffer[offset + 2] = x * d[2] + y * d[6] + z * d[10];
        offset += stride;
      }
    }

    /**
     * Transpose the given matrix
     * @param mat The matrix to transpose
     * @param [out] The matrix to write to
     * @return The given `out` parameter or a new matrix
     */
    static transpose(mat:Mat4, out?:Mat4):Mat4 {
      var d = mat.data;
      return (out || new Mat4()).init(
        d[0], d[4], d[8], d[12],
        d[1], d[5], d[9], d[13],
        d[2], d[6], d[10], d[14],
        d[3], d[7], d[11], d[15]
      );
    }

    /**
     * Invert the given matrix
     * @param mat The matrix to transpose
     * @param [out] The matrix to write to
     * @return The given `out` parameter or a new matrix
     */
    static invert(mat:Mat4, out?:Mat4):Mat4 {
      out = out || new Mat4();
      var a = mat.data;
      var b = out.data;

      var a11 = a[0];
      var a12 = a[4];
      var a13 = a[8];
      var a14 = a[12];

      var a21 = a[1];
      var a22 = a[5];
      var a23 = a[9];
      var a24 = a[13];

      var a31 = a[2];
      var a32 = a[6];
      var a33 = a[10];
      var a34 = a[14];

      var a41 = a[3];
      var a42 = a[7];
      var a43 = a[11];
      var a44 = a[15];

      // 2x2 determinants
      var d1 = a33 * a44 - a43 * a34;
      var d2 = a23 * a44 - a43 * a24;
      var d3 = a23 * a34 - a33 * a24;
      var d4 = a13 * a44 - a43 * a14;
      var d5 = a13 * a34 - a33 * a14;
      var d6 = a13 * a24 - a23 * a14;

      // 3x3 determinants
      var det1 = a22 * d1 - a32 * d2 + a42 * d3;
      var det2 = a12 * d1 - a32 * d4 + a42 * d5;
      var det3 = a12 * d2 - a22 * d4 + a42 * d6;
      var det4 = a12 * d3 - a22 * d5 + a32 * d6;

      var detInv = 1 / (a11 * det1 - a21 * det2 + a31 * det3 - a41 * det4);

      b[0] = det1 * detInv;
      b[4] = -det2 * detInv;
      b[8] = det3 * detInv;
      b[12] = -det4 * detInv;
      b[1] = -(a21 * d1 - a31 * d2 + a41 * d3) * detInv;
      b[5] = (a11 * d1 - a31 * d4 + a41 * d5) * detInv;
      b[9] = -(a11 * d2 - a21 * d4 + a41 * d6) * detInv;
      b[13] = (a11 * d3 - a21 * d5 + a31 * d6) * detInv;

      var v1 = a32 * a44 - a42 * a34;
      var v2 = a22 * a44 - a42 * a24;
      var v3 = a22 * a34 - a32 * a24;
      var v4 = a12 * a44 - a42 * a14;
      var v5 = a12 * a34 - a32 * a14;
      var v6 = a12 * a24 - a22 * a14;
      b[2] = (a21 * v1 - a31 * v2 + a41 * v3) * detInv;
      b[6] = -(a11 * v1 - a31 * v4 + a41 * v5) * detInv;
      b[10] = (a11 * v2 - a21 * v4 + a41 * v6) * detInv;
      b[14] = -(a11 * v3 - a21 * v5 + a31 * v6) * detInv;

      v1 = a32 * a43 - a42 * a33;
      v2 = a22 * a43 - a42 * a23;
      v3 = a22 * a33 - a32 * a23;
      v4 = a12 * a43 - a42 * a13;
      v5 = a12 * a33 - a32 * a13;
      v6 = a12 * a23 - a22 * a13;
      b[3] = -(a21 * v1 - a31 * v2 + a41 * v3) * detInv;
      b[7] = (a11 * v1 - a31 * v4 + a41 * v5) * detInv;
      b[11] = -(a11 * v2 - a21 * v4 + a41 * v6) * detInv;
      b[15] = (a11 * v3 - a21 * v5 + a31 * v6) * detInv;

      return out;
    }


    /**
     * Negate the components of the given matrix
     * @param mat The matrix to transpose
     * @param [out] The matrix to write to
     * @return The given `out` parameter or a new matrix
     */
    static negate(mat:Mat4, out?:Mat4):Mat4 {
      out = out || new Mat4();
      var d = mat.data;
      var o = out.data;
      o[ 0] = -d[ 0]; o[ 1] = -d[ 1]; o[ 2] = -d[ 2]; o[ 3] = -d[ 3];
      o[ 4] = -d[ 4]; o[ 5] = -d[ 5]; o[ 6] = -d[ 6]; o[ 7] = -d[ 7];
      o[ 8] = -d[ 8]; o[ 9] = -d[ 9]; o[10] = -d[10]; o[11] = -d[11];
      o[12] = -d[12]; o[13] = -d[13]; o[14] = -d[14]; o[15] = -d[15];
      return out;
    }


    /**
     * Adds a matrix to another
     * @param matA The first matrix
     * @param matB The second matrix
     * @param [out] The matrix to write to
     * @return The given `out` parameter or a new matrix
     */
    static add(matA:Mat4, matB:Mat4, out?:Mat4):Mat4 {
      out = out || new Mat4();
      var a = matA.data;
      var b = matB.data;
      var c = out.data;
      c[ 0] = a[ 0] + b[ 0]; c[ 1] = a[ 1] + b[ 1]; c[ 2] = a[ 2] + b[ 2]; c[ 3] = a[ 3] + b[ 3];
      c[ 4] = a[ 4] + b[ 4]; c[ 5] = a[ 5] + b[ 5]; c[ 6] = a[ 6] + b[ 6]; c[ 7] = a[ 7] + b[ 7];
      c[ 8] = a[ 8] + b[ 8]; c[ 9] = a[ 9] + b[ 9]; c[10] = a[10] + b[10]; c[11] = a[11] + b[11];
      c[12] = a[12] + b[12]; c[13] = a[13] + b[13]; c[14] = a[14] + b[14]; c[15] = a[15] + b[15];
      return out;
    }


    /**
     * Adds a scalar to each component of a matrix
     * @param mat The matrix
     * @param scalar The scalar to add
     * @param [out] The matrix to write to
     * @return The given `out` parameter or a new matrix
     */
    static addScalar(mat:Mat4, scalar:number, out?:Mat4):Mat4 {
      out = out || new Mat4();
      var a = mat.data;
      var c = out.data;
      c[ 0] = a[ 0] + scalar; c[ 1] = a[ 1] + scalar; c[ 2] = a[ 2] + scalar; c[ 3] = a[ 3] + scalar;
      c[ 4] = a[ 4] + scalar; c[ 5] = a[ 5] + scalar; c[ 6] = a[ 6] + scalar; c[ 7] = a[ 7] + scalar;
      c[ 8] = a[ 8] + scalar; c[ 9] = a[ 9] + scalar; c[10] = a[10] + scalar; c[11] = a[11] + scalar;
      c[12] = a[12] + scalar; c[13] = a[13] + scalar; c[14] = a[14] + scalar; c[15] = a[15] + scalar;
      return out;
    }


    /**
     * Subtracts the second matrix from the first
     * @param matA The first matrix
     * @param matB The second matrix
     * @param [out] The matrix to write to
     * @return The given `out` parameter or a new matrix
     */
    static subtract(matA:Mat4, matB:Mat4, out?:Mat4):Mat4 {
      out = out || new Mat4();
      var a = matA.data;
      var b = matB.data;
      var c = out.data;
      c[ 0] = a[ 0] - b[ 0]; c[ 1] = a[ 1] - b[ 1]; c[ 2] = a[ 2] - b[ 2]; c[ 3] = a[ 3] - b[ 3];
      c[ 4] = a[ 4] - b[ 4]; c[ 5] = a[ 5] - b[ 5]; c[ 6] = a[ 6] - b[ 6]; c[ 7] = a[ 7] - b[ 7];
      c[ 8] = a[ 8] - b[ 8]; c[ 9] = a[ 9] - b[ 9]; c[10] = a[10] - b[10]; c[11] = a[11] - b[11];
      c[12] = a[12] - b[12]; c[13] = a[13] - b[13]; c[14] = a[14] - b[14]; c[15] = a[15] - b[15];
      return out;
    }


    /**
     * Subtracts a scalar from each somponent of a matrix
     * @param mat The matrix to subtract from
     * @param scalar The scalar to subtract
     * @param [out] The matrix to write to
     * @return The given `out` parameter or a new matrix
     */
    static subtractScalar(mat:Mat4, scalar:number, out?:Mat4):Mat4 {
      out = out || new Mat4();
      var a = mat.data;
      var c = out.data;
      c[ 0] = a[ 0] - scalar; c[ 1] = a[ 1] - scalar; c[ 2] = a[ 2] - scalar; c[ 3] = a[ 3] - scalar;
      c[ 4] = a[ 4] - scalar; c[ 5] = a[ 5] - scalar; c[ 6] = a[ 6] - scalar; c[ 7] = a[ 7] - scalar;
      c[ 8] = a[ 8] - scalar; c[ 9] = a[ 9] - scalar; c[10] = a[10] - scalar; c[11] = a[11] - scalar;
      c[12] = a[12] - scalar; c[13] = a[13] - scalar; c[14] = a[14] - scalar; c[15] = a[15] - scalar;
      return out;
    }


    /**
     * Multiplies a matrix by another matrix
     * @param matA The first matrix
     * @param matB The second matrix
     * @param [out] The matrix to write to
     * @return The given `out` parameter or a new matrix
     */
    static multiply(matA:Mat4, matB:Mat4, out?:Mat4):Mat4 {
      out = out || new Mat4();
      var a = matB.data;
      var b = matA.data;
      var c = out.data;
      let a_0 = a[ 0], a_1 = a[ 1], a_2 = a[ 2], a_3 = a[ 3],
          a_4 = a[ 4], a_5 = a[ 5], a_6 = a[ 6], a_7 = a[ 7],
          a_8 = a[ 8], a_9 = a[ 9], a10 = a[10], a11 = a[11],
          a12 = a[12], a13 = a[13], a14 = a[14], a15 = a[15];
      let b_0 = b[ 0], b_1 = a[ 1], b_2 = b[ 2], b_3 = b[ 3],
          b_4 = b[ 4], b_5 = a[ 5], b_6 = b[ 6], b_7 = b[ 7],
          b_8 = b[ 8], b_9 = a[ 9], b10 = b[10], b11 = b[11],
          b12 = b[12], b13 = a[13], b14 = b[14], b15 = b[15];
      c[0 ] = b_0 * a_0 + b_1 * a_4 + b_2 * a_8 + b_3 * a12;
      c[1 ] = b_0 * a_1 + b_1 * a_5 + b_2 * a_9 + b_3 * a13;
      c[2 ] = b_0 * a_2 + b_1 * a_6 + b_2 * a10 + b_3 * a14;
      c[3 ] = b_0 * a_3 + b_1 * a_7 + b_2 * a11 + b_3 * a15;
      c[4 ] = b_4 * a_0 + b_5 * a_4 + b_6 * a_8 + b_7 * a12;
      c[5 ] = b_4 * a_1 + b_5 * a_5 + b_6 * a_9 + b_7 * a13;
      c[6 ] = b_4 * a_2 + b_5 * a_6 + b_6 * a10 + b_7 * a14;
      c[7 ] = b_4 * a_3 + b_5 * a_7 + b_6 * a11 + b_7 * a15;
      c[8 ] = b_8 * a_0 + b_9 * a_4 + b10 * a_8 + b11 * a12;
      c[9 ] = b_8 * a_1 + b_9 * a_5 + b10 * a_9 + b11 * a13;
      c[10] = b_8 * a_2 + b_9 * a_6 + b10 * a10 + b11 * a14;
      c[11] = b_8 * a_3 + b_9 * a_7 + b10 * a11 + b11 * a15;
      c[12] = b12 * a_0 + b13 * a_4 + b14 * a_8 + b15 * a12;
      c[13] = b12 * a_1 + b13 * a_5 + b14 * a_9 + b15 * a13;
      c[14] = b12 * a_2 + b13 * a_6 + b14 * a10 + b15 * a14;
      c[15] = b12 * a_3 + b13 * a_7 + b14 * a11 + b15 * a15;
      return out;
    }


    /**
     * Multiplies a matrix by another matrix
     * @param matA The first matrix
     * @param matB The second matrix
     * @param [out] The matrix to write to
     * @return The given `out` parameter or a new matrix
     */
    static concat(matA, matB, out) {
      out = out || new Mat4();
      var a = matA.data;
      var b = matB.data;
      var c = out.data;
      let a_0 = a[ 0], a_1 = a[ 1], a_2 = a[ 2], a_3 = a[ 3],
          a_4 = a[ 4], a_5 = a[ 5], a_6 = a[ 6], a_7 = a[ 7],
          a_8 = a[ 8], a_9 = a[ 9], a10 = a[10], a11 = a[11],
          a12 = a[12], a13 = a[13], a14 = a[14], a15 = a[15];
      let b_0 = b[ 0], b_1 = a[ 1], b_2 = b[ 2], b_3 = b[ 3],
          b_4 = b[ 4], b_5 = a[ 5], b_6 = b[ 6], b_7 = b[ 7],
          b_8 = b[ 8], b_9 = a[ 9], b10 = b[10], b11 = b[11],
          b12 = b[12], b13 = a[13], b14 = b[14], b15 = b[15];
      c[0 ] = b_0 * a_0 + b_1 * a_4 + b_2 * a_8 + b_3 * a12;
      c[1 ] = b_0 * a_1 + b_1 * a_5 + b_2 * a_9 + b_3 * a13;
      c[2 ] = b_0 * a_2 + b_1 * a_6 + b_2 * a10 + b_3 * a14;
      c[3 ] = b_0 * a_3 + b_1 * a_7 + b_2 * a11 + b_3 * a15;
      c[4 ] = b_4 * a_0 + b_5 * a_4 + b_6 * a_8 + b_7 * a12;
      c[5 ] = b_4 * a_1 + b_5 * a_5 + b_6 * a_9 + b_7 * a13;
      c[6 ] = b_4 * a_2 + b_5 * a_6 + b_6 * a10 + b_7 * a14;
      c[7 ] = b_4 * a_3 + b_5 * a_7 + b_6 * a11 + b_7 * a15;
      c[8 ] = b_8 * a_0 + b_9 * a_4 + b10 * a_8 + b11 * a12;
      c[9 ] = b_8 * a_1 + b_9 * a_5 + b10 * a_9 + b11 * a13;
      c[10] = b_8 * a_2 + b_9 * a_6 + b10 * a10 + b11 * a14;
      c[11] = b_8 * a_3 + b_9 * a_7 + b10 * a11 + b11 * a15;
      c[12] = b12 * a_0 + b13 * a_4 + b14 * a_8 + b15 * a12;
      c[13] = b12 * a_1 + b13 * a_5 + b14 * a_9 + b15 * a13;
      c[14] = b12 * a_2 + b13 * a_6 + b14 * a10 + b15 * a14;
      c[15] = b12 * a_3 + b13 * a_7 + b14 * a11 + b15 * a15;
      return this;
    }

    /**
     * Multiplies a chain of matrices
     * @method concatChain
     * @return The result of the multiplication
     */
    static concatChain(...rest:Mat4[]) {
      // (a, (b, (c, (d, e))))
      var i, result = arguments[arguments.length - 1].clone();
      for (i = arguments.length - 2; i >= 0; i--) {
        Mat4.concat(arguments[i], result, result);
      }
      return result;
    }

    /**
     * Multiplies a chain of matrices
     * @method multiplyChain
     * @return The result of the multiplication
     */
    static multiplyChain(...rest:Mat4[]) {
      // ((((a, b), c), d), e)
      var i, result = arguments[0].clone();
      for (i = 1; i < arguments.length; i += 1) {
        Mat4.multiply(result, arguments[i], result);
      }
      return result;
    }

    /**
     * Multiplies a matrix with a scalar value
     * @method multiplyScalar
     * @param matA The matrix
     * @param scalar The scalar to multiply
     * @param [out] The matrix to write to
     * @return The given `out` parameter or a new matrix
     */
    static multiplyScalar(matA:Mat4, scalar:number, out?:Mat4):Mat4 {
      out = out || new Mat4();
      var a = matA.data;
      var b = scalar;
      var c = out.data;
      c[ 0] = a[ 0] * b; c[ 1] = a[ 1] * b; c[ 2] = a[ 2] * b; c[ 3] = a[ 3] * b;
      c[ 4] = a[ 4] * b; c[ 5] = a[ 5] * b; c[ 6] = a[ 6] * b; c[ 7] = a[ 7] * b;
      c[ 8] = a[ 8] * b; c[ 9] = a[ 9] * b; c[10] = a[10] * b; c[11] = a[11] * b;
      c[12] = a[12] * b; c[13] = a[13] * b; c[14] = a[14] * b; c[15] = a[15] * b;
      return out;
    }


    /**
     * Divides the components of the first matrix by the components of the second matrix
     * @param matA The first matrix
     * @param matB The second matrix
     * @param [out] The matrix to write to
     * @return The given `out` parameter or a new matrix
     */
    static divide(matA:Mat4, matB:Mat4, out?:Mat4):Mat4 {
      out = out || new Mat4();
      var a = matA.data;
      var b = matB.data;
      var c = out.data;
      c[ 0] = a[ 0] / b[ 0]; c[ 1] = a[ 1] / b[ 1]; c[ 2] = a[ 2] / b[ 2]; c[ 3] = a[ 3] / b[ 3]; 
      c[ 4] = a[ 4] / b[ 4]; c[ 5] = a[ 5] / b[ 5]; c[ 6] = a[ 6] / b[ 6]; c[ 7] = a[ 7] / b[ 7]; 
      c[ 8] = a[ 8] / b[ 8]; c[ 9] = a[ 9] / b[ 9]; c[10] = a[10] / b[10]; c[11] = a[11] / b[11];
      c[12] = a[12] / b[12]; c[13] = a[13] / b[13]; c[14] = a[14] / b[14]; c[15] = a[15] / b[15];
      return out;
    }

    /**
     * Divides the components of a matrix by a scalar
     * @param matA The matrix
     * @param scalar The scalar by which to divide
     * @param [out] The matrix to write to
     * @return The given `out` parameter or a new matrix
     */
    static divideScalar(matA:Mat4, scalar:number, out?:Mat4):Mat4 {
      out = out || new Mat4();
      var a = matA.data;
      var b = 1 / scalar;
      var c = out.data;
      c[ 0] = a[ 0] * b; c[ 1] = a[ 1] * b; c[ 2] = a[ 2] * b; c[ 3] = a[ 3] * b;
      c[ 4] = a[ 4] * b; c[ 5] = a[ 5] * b; c[ 6] = a[ 6] * b; c[ 7] = a[ 7] * b;
      c[ 8] = a[ 8] * b; c[ 9] = a[ 9] * b; c[10] = a[10] * b; c[11] = a[11] * b;
      c[12] = a[12] * b; c[13] = a[13] * b; c[14] = a[14] * b; c[15] = a[15] * b;
      return out;
    }

    /**
     * Performs a linear interpolation between two matrices
     * @param matA The first matrix
     * @param matB The second matrix
     * @param t The interpolation value. This is assumed to be in [0:1] range
     * @param [out] The matrix to write to
     * @return The given `out` parameter or a new matrix
     */
    static lerp(matA:Mat4, matB:Mat4, t:number, out?:Mat4):Mat4 {
      out = out || new Mat4();
      var a = matA.data;
      var b = matB.data;
      var c = out.data;
      c[0] = a[0] + (b[0] - a[0]) * t;
      c[1] = a[1] + (b[1] - a[1]) * t;
      c[2] = a[2] + (b[2] - a[2]) * t;
      c[3] = a[3] + (b[3] - a[3]) * t;
      c[4] = a[4] + (b[4] - a[4]) * t;
      c[5] = a[5] + (b[5] - a[5]) * t;
      c[6] = a[6] + (b[6] - a[6]) * t;
      c[7] = a[7] + (b[7] - a[7]) * t;
      c[8] = a[8] + (b[8] - a[8]) * t;
      c[9] = a[9] + (b[9] - a[9]) * t;
      c[10] = a[10] + (b[10] - a[10]) * t;
      c[11] = a[11] + (b[11] - a[11]) * t;
      c[12] = a[12] + (b[12] - a[12]) * t;
      c[13] = a[13] + (b[13] - a[13]) * t;
      c[14] = a[14] + (b[14] - a[14]) * t;
      c[15] = a[15] + (b[15] - a[15]) * t;
      return out;
    }

    /**
     * Creates a new matrix with all components set to 0
     * @return a new matrix
     */
    static zero():Mat4 {
      return new Mat4();
    }

    /**
     * Creates a new matrix that is initialized to identity
     * @return a new matrix
     */
    static identity():Mat4 {
      return new Mat4().initIdentity();
    }

    /**
     * Creates a new matrix. This method should be called with 16 or 0 arguments. If less than 16 but more than 0 arguments
     * are given some components are going to be undefined. The arguments are expected to be in column major order.
     * @return a new matrix
     */
    static create(m0, m1, m2, m3, m4, m5, m6, m7, m8, m9, m10, m11, m12, m13, m14, m15):Mat4 {
      var out = new Mat4();
      var d = out.data;
      d[ 0] = m0;  d[ 1] = m1;  d[ 2] = m2;  d[ 3] = m3;
      d[ 4] = m4;  d[ 5] = m5;  d[ 6] = m6;  d[ 7] = m7;
      d[ 8] = m8;  d[ 9] = m9;  d[10] = m10; d[11] = m11;
      d[12] = m12; d[13] = m13; d[14] = m14; d[15] = m15;
      return out;
    }

    /**
     * Creates a new matrix. The arguments are expected to be in row major order.
     * @return a new matrix
     */
    static createRowMajor(m0, m4, m8, m12, m1, m5, m9, m13, m2, m6, m10, m14, m3, m7, m11, m15):Mat4 {
      var out = new Mat4();
      var d = out.data;
      d[ 0] = m0;  d[ 1] = m1;  d[ 2] = m2;  d[ 3] = m3;
      d[ 4] = m4;  d[ 5] = m5;  d[ 6] = m6;  d[ 7] = m7;
      d[ 8] = m8;  d[ 9] = m9;  d[10] = m10; d[11] = m11;
      d[12] = m12; d[13] = m13; d[14] = m14; d[15] = m15;
      return out;
    }

    /**
     * @return a new matrix
     */
    static createScale(x:number, y:number, z:number):Mat4 {
      return new Mat4().initScale(x, y, z);
    }

    /**
     * @return a new matrix
     */
    static createTranslation(x:number, y:number, z:number):Mat4 {
      return new Mat4().initTranslation(x, y, z);
    }

    /**
     * @return a new matrix
     */
    static createLookAt(pos:IVec3, lookAt:IVec3, up:IVec3):Mat4 {
      return new Mat4().initLookAt(pos, lookAt, up);
    }

    /**
     * @return a new matrix
     */
    static createWorld(position:IVec3, forward:IVec3, up:IVec3) {
      return new Mat4().initWorld(position, forward, up);
    }

    /**
     * @return a new matrix
     */
    static createPerspectiveFieldOfView(fov:number, aspec:number, near:number, far:number):Mat4 {
      return new Mat4().initPerspectiveFieldOfView(fov, aspec, near, far);
    }

    /**
     * @return a new matrix
     */
    static createPerspective(width:number, height:number, near:number, far:number):Mat4 {
      return new Mat4().initPerspective(width, height, near, far);
    }

    /**
     * @return a new matrix
     */
    static createPerspectiveOffCenter(left:number, right:number, bottom:number, top:number, near:number, far:number):Mat4 {
      return new Mat4().initPerspectiveOffCenter(left, right, bottom, top, near, far);
    }

    /**
     * @return a new matrix
     */
    static createOrthographic(width:number, height:number, near:number, far:number):Mat4 {
      return new Mat4().initOrthographic(width, height, near, far);
    }

    /**
     * @return a new matrix
     */
    static createOrthographicOffCenter(left:number, right:number, bottom:number, top:number, near:number, far:number):Mat4 {
      return new Mat4().initOrthographicOffCenter(left, right, bottom, top, near, far);
    }

    /**
     * @return a new matrix
     */
    static createRotationX(rad:number):Mat4 {
      return new Mat4().initRotationX(rad);
    }

    /**
     * @return a new matrix
     */
    static createRotationY(rad:number):Mat4 {
      return new Mat4().initRotationY(rad);
    }

    /**
     * @return a new matrix
     */
    static createRotationZ(rad:number):Mat4 {
      return new Mat4().initRotationZ(rad);
    }

    /**
     * @return a new matrix
     */
    static createAxisAngle(axis:IVec3, angle:number):Mat4 {
      return new Mat4().initAxisAngle(axis, angle);
    }

    /**
     * @return a new matrix
     */
    static createYawPitchRoll(yaw:number, pitch:number, roll:number):Mat4 {
      return new Mat4().initYawPitchRoll(yaw, pitch, roll);
    }

    /**
     * @returns {string}
     */
    static prettyString(mat) {
      var m = mat.data;
      var fixed = 5;
      return [
        [m[0].toFixed(fixed), m[4].toFixed(fixed), m[8].toFixed(fixed), m[12].toFixed(fixed)].join(', '),
        [m[1].toFixed(fixed), m[5].toFixed(fixed), m[9].toFixed(fixed), m[13].toFixed(fixed)].join(', '),
        [m[2].toFixed(fixed), m[6].toFixed(fixed), m[10].toFixed(fixed), m[14].toFixed(fixed)].join(', '),
        [m[3].toFixed(fixed), m[7].toFixed(fixed), m[11].toFixed(fixed), m[15].toFixed(fixed)].join(', ')
      ].join('\n');
    }

  }
}
