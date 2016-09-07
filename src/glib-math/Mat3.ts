module Glib {

  /**
   * Describes a 4x4 matrix.
   */
  export class Mat3 {
    right:Float32Array = this.data.subarray(0, 3)
    up:Float32Array = this.data.subarray(3, 6)
    backward:Float32Array = this.data.subarray(6, 9)

    constructor(public data:Float32Array = new Float32Array(9)) {}

    /**
     * Initializes the matrix with the given values in given order. The values are applied in column major order
     * @return Reference to `this` for chaining.
     */
    init(m0:number, m1:number, m2:number, 
         m3:number, m4:number, m5:number, 
         m6:number, m7:number, m8:number):Mat3 {
      var d = this.data
      d[0] = m0; d[1] = m1; d[2] = m2;
      d[3] = m3; d[4] = m4; d[5] = m5;
      d[6] = m6; d[7] = m7; d[8] = m8;
      return this
    }

    /**
     * Initializes the matrix with the given values. The values are read in row major order.
     * @return Reference to `this` for chaining.
     */
    initRowMajor(m0:number, m3:number, m6:number , 
                 m1:number, m4:number, m7:number , 
                 m2:number, m5:number, m8:number):Mat3 {
      var d = this.data
      d[0] = m0; d[1] = m1; d[2] = m2;
      d[3] = m3; d[4] = m4; d[5] = m5;
      d[6] = m6; d[7] = m7; d[8] = m8;
      return this
    }

    /**
     * Initializes all components of this matrix with the given number.
     * @param number The number to set all matrix components to.
     * @return Reference to `this` for chaining.
     */
    initWith(number:number):Mat3 {
      var d = this.data
      d[0] = number; d[1] = number; d[2] = number;
      d[3] = number; d[4] = number; d[5] = number;
      d[6] = number; d[7] = number; d[8] = number;
      return this
    }

    /**
     * Initializes the components of this matrix to the identity.
     * @return Reference to `this` for chaining.
     */
    initIdentity():Mat3 {
      var d = this.data
      d[0] = 1; d[1] = 0; d[2] = 0;
      d[3] = 0; d[4] = 1; d[5] = 0;
      d[6] = 0; d[7] = 0; d[8] = 1;
      return this
    }

    /**
     * Initializes this matrix from another matrix.
     * @param other
     * @return Reference to `this` for chaining.
     */
    initFrom(other:Mat3):Mat3 {
      var a = this.data
      var b = other.data
      a[0] = b[0]; a[1] = b[1]; a[2] = b[2];
      a[3] = b[3]; a[4] = b[4]; a[5] = b[5];
      a[6] = b[6]; a[7] = b[7]; a[8] = b[8];
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
    initFromBuffer(buffer:ArrayLike<number>, offset?:number):Mat3 {
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
      return this
    }

    /**
     * Initializes this matrix from given quaternion.
     * @param q The quaternion
     * @return Reference to `this` for chaining.
     */
    initFromQuaternion(q:IVec4):Mat3 {
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
        1 - 2 * (yy + zz), 2 * (xy - zw), 2 * (zx + yw),
        2 * (xy + zw), 1 - 2 * (zz + xx), 2 * (yz - xw),
        2 * (zx - yw), 2 * (yz + xw), 1 - 2 * (yy + xx)
      )
    }

    /**
     * Initializes this matrix to a rotation matrix defined by given axis vector and angle.
     * @param axis The axis vector. This is expected to be normalized.
     * @param angle The angle in radians.
     * @return Reference to `this` for chaining.
     */
    initAxisAngle(axis:IVec3, angle:number):Mat3 {
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
        1 - 2 * (yy + zz), 2 * (xy - zw), 2 * (zx + yw),
        2 * (xy + zw), 1 - 2 * (zz + xx), 2 * (yz - xw),
        2 * (zx - yw), 2 * (yz + xw), 1 - 2 * (yy + xx)
      )
    }

    /**
     * Initializes this matrix to a rotation matrix defined by given yaw pitch and roll values.
     * @param yaw Angle in radians around the Y axis
     * @param pitch Angle in radians around the X axis
     * @param roll Angle in radians around the Z axis
     * @return Reference to `this` for chaining.
     */
    initYawPitchRoll(yaw:number, pitch:number, roll:number):Mat3 {
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
        1 - 2 * (yy + zz), 2 * (xy - zw), 2 * (zx + yw),
        2 * (xy + zw), 1 - 2 * (zz + xx), 2 * (yz - xw),
        2 * (zx - yw), 2 * (yz + xw), 1 - 2 * (yy + xx)
      )
    }

    /**
     * Initializes this matrix with a rotation around the X axis.
     * @param rad The angle in radians.
     * @return Reference to `this` for chaining.
     */
    initRotationX(rad:number):Mat3 {
      var cos = Math.cos(rad)
      var sin = Math.sin(rad)
      return this.initRowMajor(
        1, 0, 0,
        0, cos, -sin,
        0, sin, cos
      )
    }

    /**
     * Initializes this matrix with a rotation around the Y axis.
     * @param rad The angle in radians.
     * @return Reference to `this` for chaining.
     */
    initRotationY(rad:number):Mat3 {
      var cos = Math.cos(rad)
      var sin = Math.sin(rad)

      return this.initRowMajor(
        cos, 0, sin,
        0, 1, 0,
        -sin, 0, cos
      )
    }

    /**
     * Initializes this matrix with a rotation around the Z axis.
     * @param rad The angle in radians.
     * @return Reference to `this` for chaining.
     */
    initRotationZ(rad:number):Mat3 {
      var cos = Math.cos(rad)
      var sin = Math.sin(rad)
      return this.initRowMajor(
        cos, -sin, 0,
        sin, cos, 0,
        0, 0, 1
      )
    }

    /**
     * Initializes a scale matrix.
     * @param x Scale along x-axis
     * @param y Scale along y-axis
     * @param z Scale along z-axis
     * @return Reference to `this` for chaining.
     */
    initScale(x:number, y:number, z:number):Mat3 {
      return this.initRowMajor(
        x, 0, 0,
        0, y, 0,
        0, 0, z
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
    initOrientation(forward:IVec3, up:IVec3):Mat3 {
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
        rightX, x, backX,
        rightY, y, backY,
        rightZ, z, backZ
      )
    }

    /**
     * Creates a copy of this matrix
     * @return The cloned matrix.
     */
    clone():Mat3 {
      var d = this.data
      return new Mat3().init(d[0], d[1], d[2], d[3], d[4], d[5], d[6], d[7], d[8])
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
      return buffer
    }

    /**
     * Checks for component wise equality with given matrix
     * @method equals
     * @param other The matrix to compare with
     * @return {Boolean} true if components are equal, false otherwise
     */
    equals(other:Mat3):boolean {
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
        a[8] === b[8]
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
     * Gets the scale part as vector
     * @param [out] The vector to write to
     * @return the given `out` parameter or a new vector
     */
    getScale<T extends IVec3>(out:T):T {
      out = (out || new Vec3()) as any
      out.x = this.data[0]
      out.y = this.data[4]
      out.z = this.data[8]
      return out
    }

    /**
     * Sets the forward vector
     * @param vec The vector to take values from
     * @return Reference to `this` for chaining.
     */
    setForward(vec:IVec3):Mat3 {
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
    setBackward(vec:IVec3):Mat3 {
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
    setRight(vec:IVec3):Mat3 {
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
    setLeft(vec:IVec3):Mat3 {
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
    setUp(vec:IVec3):Mat3 {
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
    setDown(vec:IVec3):Mat3 {
      this.up[0] = -vec.x
      this.up[1] = -vec.y
      this.up[2] = -vec.z
      return this
    }

    /**
     * Sets the scale part
     * @param vec The vector to take values from
     * @return Reference to `this` for chaining.
     */
    setScale(vec:IVec3):Mat3 {
      this.data[0] = vec.x
      this.data[4] = vec.y
      this.data[8] = vec.z
      return this
    }
    setScaleX(v:number):Mat3 {
      this.data[0] = v
      return this
    }
    setScaleY(v:number):Mat3 {
      this.data[4] = v
      return this
    }
    setScaleZ(v:number):Mat3 {
      this.data[8] = v
      return this
    }
    setScaleXYZ(x:number, y:number, z:number):Mat3 {
      this.data[0] = x
      this.data[4] = y
      this.data[8] = z
      return this
    }

    /**
     * Calculates the determinant of this matrix
     */
    determinant():number {
      var a = this.data

      var a11 = a[0]
      var a12 = a[3]
      var a13 = a[6]

      var a21 = a[1]
      var a22 = a[4]
      var a23 = a[7]

      var a31 = a[2]
      var a32 = a[5]
      var a33 = a[8]

      var d1 = a22 * a33 - a32 * a23
      var d2 = a21 * a33 - a31 * a23
      var d3 = a21 * a32 - a31 * a22

      return a11 * d1 - a12 * d2 + a13 * d3
    }

    /**
     * Transposes this matrix
     * @return Reference to `this` for chaining.
     */
    transpose():Mat3 {
      var d = this.data;
      return this.init(
        d[0], d[3], d[6],
        d[1], d[4], d[7],
        d[2], d[5], d[8]
      )
    }
    transposeOut(out?:Mat3):Mat3 {
      var d = this.data;
      return (out || new Mat3()).init(
        d[0], d[3], d[6],
        d[1], d[4], d[7],
        d[2], d[5], d[8]
      )
    }

    /**
     * Inverts this matrix
     * @return Reference to `this` for chaining.
     */
    invert():Mat3 {
      var a = this.data
      var b = this.data

      var a11 = a[0]
      var a12 = a[3]
      var a13 = a[6]

      var a21 = a[1]
      var a22 = a[4]
      var a23 = a[7]

      var a31 = a[2]
      var a32 = a[5]
      var a33 = a[8]

      var d1 = a22 * a33 - a32 * a23
      var d2 = a21 * a33 - a31 * a23
      var d3 = a21 * a32 - a31 * a22

      var detInv = 1 / (a11 * d1 - a12 * d2 + a13 * d3)

      b[0] = detInv * d1;
      b[1] = -detInv * d2;
      b[2] = detInv * d3;
      b[3] = detInv * (a13 * a32 - a12 * a33);
      b[4] = detInv * (a11 * a33 - a13 * a31);
      b[5] = detInv * (a12 * a31 - a11 * a32);
      b[6] = detInv * (a12 * a23 - a13 * a22);
      b[7] = detInv * (a13 * a21 - a11 * a23);
      b[8] = detInv * (a11 * a22 - a12 * a21);

      return this
    }
    invertOut(out?:Mat3):Mat3 {
      out = out || new Mat3()

      var a = this.data
      var b = out.data

      var a11 = a[0]
      var a12 = a[3]
      var a13 = a[6]

      var a21 = a[1]
      var a22 = a[4]
      var a23 = a[7]

      var a31 = a[2]
      var a32 = a[5]
      var a33 = a[8]

      var d1 = a22 * a33 - a32 * a23
      var d2 = a21 * a33 - a31 * a23
      var d3 = a21 * a32 - a31 * a22

      var detInv = 1 / (a11 * d1 - a12 * d2 + a13 * d3)

      b[0] = detInv * d1;
      b[1] = -detInv * d2;
      b[2] = detInv * d3;
      b[3] = detInv * (a13 * a32 - a12 * a33);
      b[4] = detInv * (a11 * a33 - a13 * a31);
      b[5] = detInv * (a12 * a31 - a11 * a32);
      b[6] = detInv * (a12 * a23 - a13 * a22);
      b[7] = detInv * (a13 * a21 - a11 * a23);
      b[8] = detInv * (a11 * a22 - a12 * a21);
      
      return out
    }

    /**
     * Negates all components of this matrix
     * @return Reference to `this` for chaining.
     */
    negate():Mat3 {
      var a = this.data;
      var b = this.data;
      a[ 0] = -b[ 0]; a[ 1] = -b[ 1]; a[ 2] = -b[ 2]; 
      a[ 3] = -b[ 3]; a[ 4] = -b[ 4]; a[ 5] = -b[ 5]; 
      a[ 6] = -b[ 6]; a[ 7] = -b[ 7]; a[ 8] = -b[ 8];
      return this;
    }
    negateOut(out?:Mat3):Mat3 {
      out = out || new Mat3()
      var a = out.data
      var b = this.data
      a[ 0] = -b[ 0]; a[ 1] = -b[ 1]; a[ 2] = -b[ 2]; 
      a[ 3] = -b[ 3]; a[ 4] = -b[ 4]; a[ 5] = -b[ 5]; 
      a[ 6] = -b[ 6]; a[ 7] = -b[ 7]; a[ 8] = -b[ 8];
      return out
    }

    /**
     * Adds the given matrix to `this`
     * @param other The matrix to add
     * @return Reference to `this` for chaining.
     */
    add(other):Mat3 {
      var a = this.data;
      var b = other.data;
      a[ 0] += b[ 0]; a[ 1] += b[ 1]; a[ 2] += b[ 2]; 
      a[ 3] += b[ 3]; a[ 4] += b[ 4]; a[ 5] += b[ 5]; 
      a[ 6] += b[ 6]; a[ 7] += b[ 7]; a[ 8] += b[ 8];
      return this;
    }
    addOut(other:Mat3, out?:Mat3):Mat3 {
      out = out || new Mat3()
      var a = this.data;
      var b = other.data;
      var c = out.data;
      c[ 0] = a[ 0] + b[ 0]; c[ 1] = a[ 1] + b[ 1]; c[ 2] = a[ 2] + b[ 2]; 
      c[ 3] = a[ 3] + b[ 3]; c[ 4] = a[ 4] + b[ 4]; c[ 5] = a[ 5] + b[ 5]; 
      c[ 6] = a[ 6] + b[ 6]; c[ 7] = a[ 7] + b[ 7]; c[ 8] = a[ 8] + b[ 8];
      return out;
    }

    /**
     * Adds the given scalar to each component of `this`
     * @param scalar The scalar to add
     * @return Reference to `this` for chaining.
     */
    addScalar(s:number):Mat3 {
      var a = this.data;
      a[ 0] += s; a[ 1] += s; a[ 2] += s; 
      a[ 3] += s; a[ 4] += s; a[ 5] += s; 
      a[ 6] += s; a[ 7] += s; a[ 8] += s;
      return this;
    }
    addScalarOut(s:number, out?:Mat3):Mat3 {
      out = out || new Mat3()
      var a = out.data;
      var b = s;
      var c = out.data;
      c[ 0] = a[ 0] + b; c[ 1] = a[ 1] + b; c[ 2] = a[ 2] + b; 
      c[ 3] = a[ 3] + b; c[ 4] = a[ 4] + b; c[ 5] = a[ 5] + b; 
      c[ 6] = a[ 6] + b; c[ 7] = a[ 7] + b; c[ 8] = a[ 8] + b;
      return out;
    }

    /**
     * Subtracts the given matrix from `this`
     * @param other The matrix to subtract
     * @return Reference to `this` for chaining.
     */
    subtract(other):Mat3 {
      var a = this.data;
      var b = other.data;
      a[ 0] -= b[ 0]; a[ 1] -= b[ 1]; a[ 2] -= b[ 2]; 
      a[ 3] -= b[ 3]; a[ 4] -= b[ 4]; a[ 5] -= b[ 5]; 
      a[ 6] -= b[ 6]; a[ 7] -= b[ 7]; a[ 8] -= b[ 8];
      return this;
    }
    subtractOut(other:Mat3, out?:Mat3):Mat3 {
      out = out || new Mat3()
      var a = this.data;
      var b = other.data;
      var c = out.data;
      c[ 0] = a[ 0] - b[ 0]; c[ 1] = a[ 1] - b[ 1]; c[ 2] = a[ 2] - b[ 2]; 
      c[ 3] = a[ 3] - b[ 3]; c[ 4] = a[ 4] - b[ 4]; c[ 5] = a[ 5] - b[ 5]; 
      c[ 6] = a[ 6] - b[ 6]; c[ 7] = a[ 7] - b[ 7]; c[ 8] = a[ 8] - b[ 8];
      return out;
    }

    /**
     * Subtracts the given scalar from each component of `this`
     * @param scalar The scalar to subtract
     * @return Reference to `this` for chaining.
     */
    subtractScalar(s:number):Mat3 {
      var a = this.data;
      a[ 0] -= s; a[ 1] -= s; a[ 2] -= s; 
      a[ 3] -= s; a[ 4] -= s; a[ 5] -= s; 
      a[ 6] -= s; a[ 7] -= s; a[ 8] -= s;
      return this;
    }
    subtractScalarOut(s:number, out?:Mat3):Mat3 {
      out = out || new Mat3()
      var a = out.data;
      var b = s;
      var c = out.data;
      c[ 0] = a[ 0] - b; c[ 1] = a[ 1] - b; c[ 2] = a[ 2] - b; 
      c[ 3] = a[ 3] - b; c[ 4] = a[ 4] - b; c[ 5] = a[ 5] - b; 
      c[ 6] = a[ 6] - b; c[ 7] = a[ 7] - b; c[ 8] = a[ 8] - b;
      return out;
    }

    /**
     * Multiplies the given matrix with this
     * @param other The matrix to multiply
     * @return Reference to `this` for chaining.
     */
    multiply(other:Mat3):Mat3 {
      let a = other.data;
      let b = this.data;
      let c = this.data;
      let a_0 = a[ 0], a_1 = a[ 1], a_2 = a[ 2], 
          a_3 = a[ 3], a_4 = a[ 4], a_5 = a[ 5], 
          a_6 = a[ 6], a_7 = a[ 7], a_8 = a[ 8];
      let b_0 = b[ 0], b_1 = a[ 1], b_2 = b[ 2], 
          b_3 = b[ 3], b_4 = b[ 4], b_5 = a[ 5], 
          b_6 = b[ 6], b_7 = b[ 7], b_8 = b[ 8];
      c[0] = b_0 * a_0 + b_1 * a_3 + b_2 * a_6;
      c[1] = b_0 * a_1 + b_1 * a_4 + b_2 * a_7;
      c[2] = b_0 * a_2 + b_1 * a_5 + b_2 * a_8;
      c[3] = b_3 * a_0 + b_4 * a_3 + b_5 * a_6;
      c[4] = b_3 * a_1 + b_4 * a_4 + b_5 * a_7;
      c[5] = b_3 * a_2 + b_4 * a_5 + b_5 * a_8;
      c[6] = b_6 * a_0 + b_7 * a_3 + b_8 * a_6;
      c[7] = b_6 * a_1 + b_7 * a_4 + b_8 * a_7;
      c[8] = b_6 * a_2 + b_7 * a_5 + b_8 * a_8;
      return this;
    }
    multiplyOut(other:Mat3, out?:Mat3):Mat3 {
      out = out || new Mat3() as any
      let a = other.data;
      let b = out.data;
      let c = out.data;
      let a_0 = a[ 0], a_1 = a[ 1], a_2 = a[ 2], 
          a_3 = a[ 3], a_4 = a[ 4], a_5 = a[ 5], 
          a_6 = a[ 6], a_7 = a[ 7], a_8 = a[ 8];
      let b_0 = b[ 0], b_1 = a[ 1], b_2 = b[ 2], 
          b_3 = b[ 3], b_4 = b[ 4], b_5 = a[ 5], 
          b_6 = b[ 6], b_7 = b[ 7], b_8 = b[ 8];
      c[0] = b_0 * a_0 + b_1 * a_3 + b_2 * a_6;
      c[1] = b_0 * a_1 + b_1 * a_4 + b_2 * a_7;
      c[2] = b_0 * a_2 + b_1 * a_5 + b_2 * a_8;
      c[3] = b_3 * a_0 + b_4 * a_3 + b_5 * a_6;
      c[4] = b_3 * a_1 + b_4 * a_4 + b_5 * a_7;
      c[5] = b_3 * a_2 + b_4 * a_5 + b_5 * a_8;
      c[6] = b_6 * a_0 + b_7 * a_3 + b_8 * a_6;
      c[7] = b_6 * a_1 + b_7 * a_4 + b_8 * a_7;
      c[8] = b_6 * a_2 + b_7 * a_5 + b_8 * a_8;
      return out;
    }

    /**
     * Concatenates the given matrix to this
     * @param other The matrix to concatenate
     * @return Reference to `this` for chaining.
     */
    concat(other:Mat3):Mat3 {
      var a = this.data;
      var b = other.data;
      var c = this.data;
      let a_0 = a[ 0], a_1 = a[ 1], a_2 = a[ 2], 
          a_3 = a[ 3], a_4 = a[ 4], a_5 = a[ 5], 
          a_6 = a[ 6], a_7 = a[ 7], a_8 = a[ 8];
      let b_0 = b[ 0], b_1 = a[ 1], b_2 = b[ 2], 
          b_3 = b[ 3], b_4 = b[ 4], b_5 = a[ 5], 
          b_6 = b[ 6], b_7 = b[ 7], b_8 = b[ 8];
      c[0] = b_0 * a_0 + b_1 * a_3 + b_2 * a_6;
      c[1] = b_0 * a_1 + b_1 * a_4 + b_2 * a_7;
      c[2] = b_0 * a_2 + b_1 * a_5 + b_2 * a_8;
      c[3] = b_3 * a_0 + b_4 * a_3 + b_5 * a_6;
      c[4] = b_3 * a_1 + b_4 * a_4 + b_5 * a_7;
      c[5] = b_3 * a_2 + b_4 * a_5 + b_5 * a_8;
      c[6] = b_6 * a_0 + b_7 * a_3 + b_8 * a_6;
      c[7] = b_6 * a_1 + b_7 * a_4 + b_8 * a_7;
      c[8] = b_6 * a_2 + b_7 * a_5 + b_8 * a_8;
      return this;
    }
    concatOut(other:Mat3, out?:Mat3):Mat3 {
      out = out || new Mat3() as any
      var a = out.data;
      var b = other.data;
      var c = out.data;
      let a_0 = a[ 0], a_1 = a[ 1], a_2 = a[ 2], 
          a_3 = a[ 3], a_4 = a[ 4], a_5 = a[ 5], 
          a_6 = a[ 6], a_7 = a[ 7], a_8 = a[ 8];
      let b_0 = b[ 0], b_1 = a[ 1], b_2 = b[ 2], 
          b_3 = b[ 3], b_4 = b[ 4], b_5 = a[ 5], 
          b_6 = b[ 6], b_7 = b[ 7], b_8 = b[ 8];
      c[0] = b_0 * a_0 + b_1 * a_3 + b_2 * a_6;
      c[1] = b_0 * a_1 + b_1 * a_4 + b_2 * a_7;
      c[2] = b_0 * a_2 + b_1 * a_5 + b_2 * a_8;
      c[3] = b_3 * a_0 + b_4 * a_3 + b_5 * a_6;
      c[4] = b_3 * a_1 + b_4 * a_4 + b_5 * a_7;
      c[5] = b_3 * a_2 + b_4 * a_5 + b_5 * a_8;
      c[6] = b_6 * a_0 + b_7 * a_3 + b_8 * a_6;
      c[7] = b_6 * a_1 + b_7 * a_4 + b_8 * a_7;
      c[8] = b_6 * a_2 + b_7 * a_5 + b_8 * a_8;
      return out;
    }

    /**
     * Multiplies each component of `this` with given scalar
     * @param scalar The scalar to multiply
     * @return Reference to `this` for chaining.
     */
    multiplyScalar(s:number):Mat3 {
      var a = this.data;
      a[ 0] *= s; a[ 1] *= s; a[ 2] *= s; 
      a[ 3] *= s; a[ 4] *= s; a[ 5] *= s; 
      a[ 6] *= s; a[ 7] *= s; a[ 8] *= s;
      return this;
    }
    multiplyScalarOut(s:number, out?:Mat3):Mat3 {
      out = out || new Mat3()
      var a = out.data;
      var b = s;
      var c = out.data;
      c[ 0] = a[ 0] * b; c[ 1] = a[ 1] * b; c[ 2] = a[ 2] * b; 
      c[ 3] = a[ 3] * b; c[ 4] = a[ 4] * b; c[ 5] = a[ 5] * b; 
      c[ 6] = a[ 6] * b; c[ 7] = a[ 7] * b; c[ 8] = a[ 8] * b;
      return out;
    }

    /**
     * Divides each matching component pair
     * @param other The matrix by which to divide
     * @return Reference to `this` for chaining.
     */
    divide(other:Mat3):Mat3 {
      var a = this.data;
      var b = other.data;
      a[ 0] /= b[ 0]; a[ 1] /= b[ 1]; a[ 2] /= b[ 2]; 
      a[ 3] /= b[ 3]; a[ 4] /= b[ 4]; a[ 5] /= b[ 5]; 
      a[ 6] /= b[ 6]; a[ 7] /= b[ 7]; a[ 8] /= b[ 8];
      return this;
    }

    /**
     * Divides each component of `this` by given scalar
     * @param scalar The scalar by which to divide
     * @return Reference to `this` for chaining.
     */
    divideScalar(s:number):Mat3 {
      var a = this.data;
      var b = 1.0 / s;
      a[ 0] *= b; a[ 1] *= b; a[ 2] *= b; 
      a[ 3] *= b; a[ 4] *= b; a[ 5] *= b; 
      a[ 6] *= b; a[ 7] *= b; a[ 8] *= b;
      return this;
    }
    divideScalarOut(s:number, out?:Mat3):Mat3 {
      out = out || new Mat3()
      var a = out.data;
      var b = 1.0 / s;
      var c = out.data;
      c[ 0] = a[ 0] * b; c[ 1] = a[ 1] * b; c[ 2] = a[ 2] * b; 
      c[ 3] = a[ 3] * b; c[ 4] = a[ 4] * b; c[ 5] = a[ 5] * b; 
      c[ 6] = a[ 6] * b; c[ 7] = a[ 7] * b; c[ 8] = a[ 8] * b;
      return out;
    }
    /**
     * Transform the given vector with this matrix.
     * @param vec
     * @return the given vector
     */
    transform<T extends IVec2|IVec3>(vec:T):T {
      var x = vec.x || 0;
      var y = vec.y || 0;
      var z = vec['z'] || 0;
      var d = this.data;
      vec.x = x * d[0] + y * d[3] + z * d[6];
      vec.y = x * d[1] + y * d[4] + z * d[7];
      if (vec['z'] != null) {
        vec['z'] = x * d[2] + y * d[5] + z * d[8];
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
        buffer[offset] = x * d[0] + y * d[3] + d[6];
        buffer[offset + 1] = x * d[1] + y * d[4] + d[7];
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
    static transpose(mat:Mat3, out?:Mat3):Mat3 {
      var d = mat.data;
      return (out || new Mat3()).init(
        d[0], d[3], d[6],
        d[1], d[4], d[7],
        d[2], d[5], d[8]
      );
    }

    /**
     * Invert the given matrix
     * @param mat The matrix to transpose
     * @param [out] The matrix to write to
     * @return The given `out` parameter or a new matrix
     */
    static invert(mat:Mat3, out?:Mat3):Mat3 {
      out = out || new Mat3();
      var a = mat.data;
      var b = out.data;

      var a11 = a[0]
      var a12 = a[3]
      var a13 = a[6]

      var a21 = a[1]
      var a22 = a[4]
      var a23 = a[7]

      var a31 = a[2]
      var a32 = a[5]
      var a33 = a[8]

      var d1 = a22 * a33 - a32 * a23
      var d2 = a21 * a33 - a31 * a23
      var d3 = a21 * a32 - a31 * a22

      var detInv = 1 / (a11 * d1 - a12 * d2 + a13 * d3)

      b[0] = detInv * d1;
      b[1] = -detInv * d2;
      b[2] = detInv * d3;
      b[3] = detInv * (a13 * a32 - a12 * a33);
      b[4] = detInv * (a11 * a33 - a13 * a31);
      b[5] = detInv * (a12 * a31 - a11 * a32);
      b[6] = detInv * (a12 * a23 - a13 * a22);
      b[7] = detInv * (a13 * a21 - a11 * a23);
      b[8] = detInv * (a11 * a22 - a12 * a21);

      return out;
    }


    /**
     * Negate the components of the given matrix
     * @param mat The matrix to transpose
     * @param [out] The matrix to write to
     * @return The given `out` parameter or a new matrix
     */
    static negate(mat:Mat3, out?:Mat3):Mat3 {
      out = out || new Mat3();
      var d = mat.data;
      var o = out.data;
      o[ 0] = -d[ 0]; o[ 1] = -d[ 1]; o[ 2] = -d[ 2]; 
      o[ 3] = -d[ 3]; o[ 4] = -d[ 4]; o[ 5] = -d[ 5]; 
      o[ 6] = -d[ 6]; o[ 7] = -d[ 7]; o[ 8] = -d[ 8];
      return out;
    }


    /**
     * Adds a matrix to another
     * @param matA The first matrix
     * @param matB The second matrix
     * @param [out] The matrix to write to
     * @return The given `out` parameter or a new matrix
     */
    static add(matA:Mat3, matB:Mat3, out?:Mat3):Mat3 {
      out = out || new Mat3();
      var a = matA.data;
      var b = matB.data;
      var c = out.data;
      c[ 0] = a[ 0] + b[ 0]; c[ 1] = a[ 1] + b[ 1]; c[ 2] = a[ 2] + b[ 2]; 
      c[ 3] = a[ 3] + b[ 3]; c[ 4] = a[ 4] + b[ 4]; c[ 5] = a[ 5] + b[ 5]; 
      c[ 6] = a[ 6] + b[ 6]; c[ 7] = a[ 7] + b[ 7]; c[ 8] = a[ 8] + b[ 8];
      return out;
    }


    /**
     * Adds a scalar to each component of a matrix
     * @param mat The matrix
     * @param scalar The scalar to add
     * @param [out] The matrix to write to
     * @return The given `out` parameter or a new matrix
     */
    static addScalar(mat:Mat3, scalar:number, out?:Mat3):Mat3 {
      out = out || new Mat3();
      var a = mat.data;
      var c = out.data;
      c[ 0] = a[ 0] + scalar; c[ 1] = a[ 1] + scalar; c[ 2] = a[ 2] + scalar; 
      c[ 3] = a[ 3] + scalar; c[ 4] = a[ 4] + scalar; c[ 5] = a[ 5] + scalar; 
      c[ 6] = a[ 6] + scalar; c[ 7] = a[ 7] + scalar; c[ 8] = a[ 8] + scalar;
      return out;
    }


    /**
     * Subtracts the second matrix from the first
     * @param matA The first matrix
     * @param matB The second matrix
     * @param [out] The matrix to write to
     * @return The given `out` parameter or a new matrix
     */
    static subtract(matA:Mat3, matB:Mat3, out?:Mat3):Mat3 {
      out = out || new Mat3();
      var a = matA.data;
      var b = matB.data;
      var c = out.data;
      c[ 0] = a[ 0] - b[ 0]; c[ 1] = a[ 1] - b[ 1]; c[ 2] = a[ 2] - b[ 2]; 
      c[ 3] = a[ 3] - b[ 3]; c[ 4] = a[ 4] - b[ 4]; c[ 5] = a[ 5] - b[ 5]; 
      c[ 6] = a[ 6] - b[ 6]; c[ 7] = a[ 7] - b[ 7]; c[ 8] = a[ 8] - b[ 8];
      return out;
    }


    /**
     * Subtracts a scalar from each somponent of a matrix
     * @param mat The matrix to subtract from
     * @param scalar The scalar to subtract
     * @param [out] The matrix to write to
     * @return The given `out` parameter or a new matrix
     */
    static subtractScalar(mat:Mat3, scalar:number, out?:Mat3):Mat3 {
      out = out || new Mat3();
      var a = mat.data;
      var c = out.data;
      c[ 0] = a[ 0] - scalar; c[ 1] = a[ 1] - scalar; c[ 2] = a[ 2] - scalar; 
      c[ 3] = a[ 3] - scalar; c[ 4] = a[ 4] - scalar; c[ 5] = a[ 5] - scalar; 
      c[ 6] = a[ 6] - scalar; c[ 7] = a[ 7] - scalar; c[ 8] = a[ 8] - scalar;
      return out;
    }


    /**
     * Multiplies a matrix by another matrix
     * @param matA The first matrix
     * @param matB The second matrix
     * @param [out] The matrix to write to
     * @return The given `out` parameter or a new matrix
     */
    static multiply(matA:Mat3, matB:Mat3, out?:Mat3):Mat3 {
      out = out || new Mat3();
      var a = matB.data;
      var b = matA.data;
      var c = out.data;
      let a_0 = a[ 0], a_1 = a[ 1], a_2 = a[ 2], 
          a_3 = a[ 3], a_4 = a[ 4], a_5 = a[ 5], 
          a_6 = a[ 6], a_7 = a[ 7], a_8 = a[ 8];
      let b_0 = b[ 0], b_1 = a[ 1], b_2 = b[ 2], 
          b_3 = b[ 3], b_4 = b[ 4], b_5 = a[ 5], 
          b_6 = b[ 6], b_7 = b[ 7], b_8 = b[ 8];
      c[0] = b_0 * a_0 + b_1 * a_3 + b_2 * a_6;
      c[1] = b_0 * a_1 + b_1 * a_4 + b_2 * a_7;
      c[2] = b_0 * a_2 + b_1 * a_5 + b_2 * a_8;
      c[3] = b_3 * a_0 + b_4 * a_3 + b_5 * a_6;
      c[4] = b_3 * a_1 + b_4 * a_4 + b_5 * a_7;
      c[5] = b_3 * a_2 + b_4 * a_5 + b_5 * a_8;
      c[6] = b_6 * a_0 + b_7 * a_3 + b_8 * a_6;
      c[7] = b_6 * a_1 + b_7 * a_4 + b_8 * a_7;
      c[8] = b_6 * a_2 + b_7 * a_5 + b_8 * a_8;
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
      out = out || new Mat3();
      var a = matA.data;
      var b = matB.data;
      var c = out.data;
      let a_0 = a[ 0], a_1 = a[ 1], a_2 = a[ 2], 
          a_3 = a[ 3], a_4 = a[ 4], a_5 = a[ 5], 
          a_6 = a[ 6], a_7 = a[ 7], a_8 = a[ 8];
      let b_0 = b[ 0], b_1 = a[ 1], b_2 = b[ 2], 
          b_3 = b[ 3], b_4 = b[ 4], b_5 = a[ 5], 
          b_6 = b[ 6], b_7 = b[ 7], b_8 = b[ 8];
      c[0] = b_0 * a_0 + b_1 * a_3 + b_2 * a_6;
      c[1] = b_0 * a_1 + b_1 * a_4 + b_2 * a_7;
      c[2] = b_0 * a_2 + b_1 * a_5 + b_2 * a_8;
      c[3] = b_3 * a_0 + b_4 * a_3 + b_5 * a_6;
      c[4] = b_3 * a_1 + b_4 * a_4 + b_5 * a_7;
      c[5] = b_3 * a_2 + b_4 * a_5 + b_5 * a_8;
      c[6] = b_6 * a_0 + b_7 * a_3 + b_8 * a_6;
      c[7] = b_6 * a_1 + b_7 * a_4 + b_8 * a_7;
      c[8] = b_6 * a_2 + b_7 * a_5 + b_8 * a_8;
      return this;
    }

    /**
     * Multiplies a chain of matrices
     * @method concatChain
     * @return The result of the multiplication
     */
    static concatChain(...rest:Mat3[]) {
      // (a, (b, (c, (d, e))))
      var i, result = arguments[arguments.length - 1].clone();
      for (i = arguments.length - 2; i >= 0; i--) {
        Mat3.concat(arguments[i], result, result);
      }
      return result;
    }

    /**
     * Multiplies a chain of matrices
     * @method multiplyChain
     * @return The result of the multiplication
     */
    static multiplyChain(...rest:Mat3[]) {
      // ((((a, b), c), d), e)
      var i, result = arguments[0].clone();
      for (i = 1; i < arguments.length; i += 1) {
        Mat3.multiply(result, arguments[i], result);
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
    static multiplyScalar(matA:Mat3, scalar:number, out?:Mat3):Mat3 {
      out = out || new Mat3();
      var a = matA.data;
      var b = scalar;
      var c = out.data;
      c[ 0] = a[ 0] * b; c[ 1] = a[ 1] * b; c[ 2] = a[ 2] * b; 
      c[ 3] = a[ 3] * b; c[ 4] = a[ 4] * b; c[ 5] = a[ 5] * b; 
      c[ 6] = a[ 6] * b; c[ 7] = a[ 7] * b; c[ 8] = a[ 8] * b;
      return out;
    }


    /**
     * Divides the components of the first matrix by the components of the second matrix
     * @param matA The first matrix
     * @param matB The second matrix
     * @param [out] The matrix to write to
     * @return The given `out` parameter or a new matrix
     */
    static divide(matA:Mat3, matB:Mat3, out?:Mat3):Mat3 {
      out = out || new Mat3();
      var a = matA.data;
      var b = matB.data;
      var c = out.data;
      c[ 0] = a[ 0] / b[ 0]; c[ 1] = a[ 1] / b[ 1]; c[ 2] = a[ 2] / b[ 2]; 
      c[ 3] = a[ 3] / b[ 3]; c[ 4] = a[ 4] / b[ 4]; c[ 5] = a[ 5] / b[ 5]; 
      c[ 6] = a[ 6] / b[ 6]; c[ 7] = a[ 7] / b[ 7]; c[ 8] = a[ 8] / b[ 8];
      return out;
    }

    /**
     * Divides the components of a matrix by a scalar
     * @param matA The matrix
     * @param scalar The scalar by which to divide
     * @param [out] The matrix to write to
     * @return The given `out` parameter or a new matrix
     */
    static divideScalar(matA:Mat3, scalar:number, out?:Mat3):Mat3 {
      out = out || new Mat3();
      var a = matA.data;
      var b = 1 / scalar;
      var c = out.data;
      c[ 0] = a[ 0] * b; c[ 1] = a[ 1] * b; c[ 2] = a[ 2] * b; 
      c[ 3] = a[ 3] * b; c[ 4] = a[ 4] * b; c[ 5] = a[ 5] * b; 
      c[ 6] = a[ 6] * b; c[ 7] = a[ 7] * b; c[ 8] = a[ 8] * b;
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
    static lerp(matA:Mat3, matB:Mat3, t:number, out?:Mat3):Mat3 {
      out = out || new Mat3();
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
      return out;
    }

    /**
     * Creates a new matrix with all components set to 0
     * @return a new matrix
     */
    static zero():Mat3 {
      return new Mat3();
    }

    /**
     * Creates a new matrix that is initialized to identity
     * @return a new matrix
     */
    static identity():Mat3 {
      return new Mat3().initIdentity();
    }

    /**
     * Creates a new matrix. This method should be called with 16 or 0 arguments. If less than 16 but more than 0 arguments
     * are given some components are going to be undefined. The arguments are expected to be in column major order.
     * @return a new matrix
     */
    static create(m0, m1, m2, 
                  m3, m4, m5, 
                  m6, m7, m8):Mat3 {
      var out = new Mat3();
      var d = out.data;
      d[ 0] = m0;  d[ 1] = m1;  d[ 2] = m2;  
      d[ 3] = m3;  d[ 4] = m4;  d[ 5] = m5;  
      d[ 6] = m6;  d[ 7] = m7;  d[ 8] = m8;
      return out;
    }

    /**
     * Creates a new matrix. The arguments are expected to be in row major order.
     * @return a new matrix
     */
    static createRowMajor(m0, m3, m6, 
                          m1, m4, m7, 
                          m2, m5, m8):Mat3 {
      var out = new Mat3();
      var d = out.data;
      d[ 0] = m0;  d[ 1] = m1;  d[ 2] = m2;  
      d[ 3] = m3;  d[ 4] = m4;  d[ 5] = m5;  
      d[ 6] = m6;  d[ 7] = m7;  d[ 8] = m8;
      return out;
    }

    /**
     * @return a new matrix
     */
    static createScale(x:number, y:number, z:number):Mat3 {
      return new Mat3().initScale(x, y, z);
    }

    /**
     * @return a new matrix
     */
    static createOrientation(forward:IVec3, up:IVec3) {
      return new Mat3().initOrientation(forward, up);
    }

    /**
     * @return a new matrix
     */
    static createRotationX(rad:number):Mat3 {
      return new Mat3().initRotationX(rad);
    }

    /**
     * @return a new matrix
     */
    static createRotationY(rad:number):Mat3 {
      return new Mat3().initRotationY(rad);
    }

    /**
     * @return a new matrix
     */
    static createRotationZ(rad:number):Mat3 {
      return new Mat3().initRotationZ(rad);
    }

    /**
     * @return a new matrix
     */
    static createAxisAngle(axis:IVec3, angle:number):Mat3 {
      return new Mat3().initAxisAngle(axis, angle);
    }

    /**
     * @return a new matrix
     */
    static createYawPitchRoll(yaw:number, pitch:number, roll:number):Mat3 {
      return new Mat3().initYawPitchRoll(yaw, pitch, roll);
    }

    /**
     * @returns {string}
     */
    static prettyString(mat) {
      var m = mat.data;
      var fixed = 5;
      return [
        [m[0].toFixed(fixed), m[3].toFixed(fixed), m[6].toFixed(fixed)].join(', '),
        [m[1].toFixed(fixed), m[4].toFixed(fixed), m[7].toFixed(fixed)].join(', '),
        [m[2].toFixed(fixed), m[5].toFixed(fixed), m[8].toFixed(fixed)].join(', ')
      ].join('\n');
    }

  }
}
