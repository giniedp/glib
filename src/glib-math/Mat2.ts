module Glib {

  /**
   * Describes a 4x4 matrix.
   */
  export class Mat2 {

    constructor(public data:Float32Array = new Float32Array(9)) {}

    /**
     * Initializes the matrix with the given values in given order. The values are applied in column major order
     * @return Reference to `this` for chaining.
     */
    init(m0:number, m1:number, 
         m2:number, m3:number):Mat2 {
      var d = this.data
      d[0] = m0; d[1] = m1; 
      d[2] = m2; d[3] = m3;
      return this
    }

    /**
     * Initializes the matrix with the given values. The values are read in row major order.
     * @return Reference to `this` for chaining.
     */
    initRowMajor(m0:number, m2:number, 
                 m1:number, m3:number):Mat2 {
      var d = this.data
      d[0] = m0; d[1] = m1; 
      d[2] = m2; d[3] = m3;
      return this
    }

    /**
     * Initializes all components of this matrix with the given number.
     * @param number The number to set all matrix components to.
     * @return Reference to `this` for chaining.
     */
    initWith(number:number):Mat2 {
      var d = this.data
      d[0] = number; d[1] = number; 
      d[2] = number; d[3] = number;
      return this
    }

    /**
     * Initializes the components of this matrix to the identity.
     * @return Reference to `this` for chaining.
     */
    initIdentity():Mat2 {
      var d = this.data
      d[0] = 1; d[1] = 0; 
      d[2] = 0; d[3] = 1;
      return this
    }

    /**
     * Initializes this matrix from another matrix.
     * @param other
     * @return Reference to `this` for chaining.
     */
    initFrom(other:Mat2):Mat2 {
      var a = this.data
      var b = other.data
      a[0] = b[0]; a[1] = b[1]; 
      a[2] = b[2]; a[3] = b[3];
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
    initFromBuffer(buffer:ArrayLike<number>, offset?:number):Mat2 {
      offset = offset || 0
      var a = this.data
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
    initFromQuaternion(q:IVec4):Mat2 {
      var x = q.x
      var y = q.y
      var z = q.z
      var w = q.w
      var xx = x * x
      var yy = y * y
      var zz = z * z
      var xy = x * y
      var zw = z * w
      return this.initRowMajor(
        1 - 2 * (yy + zz), 2 * (xy - zw),
        2 * (xy + zw), 1 - 2 * (zz + xx)
      )
    }

    /**
     * Initializes this matrix to a rotation matrix defined by given axis vector and angle.
     * @param axis The axis vector. This is expected to be normalized.
     * @param angle The angle in radians.
     * @return Reference to `this` for chaining.
     */
    initAxisAngle(axis:IVec2|IVec2, angle:number):Mat2 {
      // create quaternion
      var halfAngle = angle * 0.5
      var scale = Math.sin(halfAngle)
      var x = axis.x * scale
      var y = axis.y * scale
      var z = (axis['z'] || 0) * scale
      var w = Math.cos(halfAngle)

      // matrix from quaternion
      var xx = x * x
      var yy = y * y
      var zz = z * z
      var xy = x * y
      var zw = z * w

      return this.initRowMajor(
        1 - 2 * (yy + zz), 2 * (xy - zw),
        2 * (xy + zw), 1 - 2 * (zz + xx)
      )
    }

    /**
     * Initializes this matrix to a rotation matrix defined by given yaw pitch and roll values.
     * @param yaw Angle in radians around the Y axis
     * @param pitch Angle in radians around the X axis
     * @param roll Angle in radians around the Z axis
     * @return Reference to `this` for chaining.
     */
    initYawPitchRoll(yaw:number, pitch:number, roll:number):Mat2 {
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

      return this.initRowMajor(
        1 - 2 * (yy + zz), 2 * (xy - zw),
        2 * (xy + zw), 1 - 2 * (zz + xx)
      )
    }

    /**
     * Initializes this matrix with a rotation around the X axis.
     * @param rad The angle in radians.
     * @return Reference to `this` for chaining.
     */
    initRotationX(rad:number):Mat2 {
      return this.initRowMajor(
        1, 0,
        0, Math.cos(rad)
      )
    }

    /**
     * Initializes this matrix with a rotation around the Y axis.
     * @param rad The angle in radians.
     * @return Reference to `this` for chaining.
     */
    initRotationY(rad:number):Mat2 {
      return this.initRowMajor(
        Math.cos(rad), 0,
        0, 1
      )
    }

    /**
     * Initializes this matrix with a rotation around the Z axis.
     * @param rad The angle in radians.
     * @return Reference to `this` for chaining.
     */
    initRotationZ(rad:number):Mat2 {
      var cos = Math.cos(rad)
      var sin = Math.sin(rad)
      return this.initRowMajor(
        cos, -sin,
        sin, cos
      )
    }
    initRotation(rad:number):Mat2 {
      var cos = Math.cos(rad)
      var sin = Math.sin(rad)
      return this.initRowMajor(
        cos, -sin,
        sin, cos
      )
    }

    /**
     * Initializes a scale matrix.
     * @param x Scale along x-axis
     * @param y Scale along y-axis
     * @return Reference to `this` for chaining.
     */
    initScale(x:number, y:number):Mat2 {
      return this.initRowMajor(
        x, 0,
        0, y
      )
    }

    /**
     * Creates a copy of this matrix
     * @return The cloned matrix.
     */
    clone():Mat2 {
      var d = this.data
      return new Mat2().init(d[0], d[1], d[2], d[3])
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
      return buffer
    }

    /**
     * Checks for component wise equality with given matrix
     * @method equals
     * @param other The matrix to compare with
     * @return {Boolean} true if components are equal, false otherwise
     */
    equals(other:Mat2):boolean {
      var a = this.data
      var b = other.data
      return a[0] === b[0] &&
        a[1] === b[1] &&
        a[2] === b[2] &&
        a[3] === b[3]
    }

    /**
     * Sets the scale part
     * @param vec The vector to take values from
     * @return Reference to `this` for chaining.
     */
    setScale(vec:IVec2):Mat2 {
      this.data[0] = vec.x
      this.data[3] = vec.y
      return this
    }
    setScaleX(v:number):Mat2 {
      this.data[0] = v
      return this
    }
    setScaleY(v:number):Mat2 {
      this.data[3] = v
      return this
    }
    setScaleXY(x:number, y:number):Mat2 {
      this.data[0] = x
      this.data[3] = y
      return this
    }

    /**
     * Calculates the determinant of this matrix
     */
    determinant():number {
      var a = this.data

      var a11 = a[0]
      var a12 = a[2]

      var a21 = a[1]
      var a22 = a[2]

      return a11 * a22 - a12 * a21
    }

    /**
     * Transposes this matrix
     * @return Reference to `this` for chaining.
     */
    transpose():Mat2 {
      var d = this.data;
      return this.init(
        d[0], d[2],
        d[1], d[3]
      )
    }
    transposeOut(out?:Mat2):Mat2 {
      var d = this.data;
      return (out || new Mat2()).init(
        d[0], d[2],
        d[1], d[3]
      )
    }

    /**
     * Inverts this matrix
     * @return Reference to `this` for chaining.
     */
    invert():Mat2 {
      var a = this.data
      var b = this.data

      var a11 = a[0]
      var a12 = a[2]

      var a21 = a[1]
      var a22 = a[2]

      var detInv = 1 / (a11 * a22 - a12 * a21)

      b[0] = detInv * a22;
      b[1] = -detInv * a21;
      b[2] = detInv * a12;
      b[3] = -detInv * a22;

      return this
    }
    invertOut(out?:Mat2):Mat2 {
      out = out || new Mat2()

      var a = this.data
      var b = out.data

      var a11 = a[0]
      var a12 = a[2]

      var a21 = a[1]
      var a22 = a[2]

      var detInv = 1 / (a11 * a22 - a12 * a21)

      b[0] = detInv * a22;
      b[1] = -detInv * a21;
      b[2] = detInv * a12;
      b[3] = -detInv * a22;

      
      return out
    }

    /**
     * Negates all components of this matrix
     * @return Reference to `this` for chaining.
     */
    negate():Mat2 {
      var a = this.data;
      var b = this.data;
      a[ 0] = -b[ 0]; a[ 1] = -b[ 1]; 
      a[ 2] = -b[ 2]; a[ 3] = -b[ 3];
      return this;
    }
    negateOut(out?:Mat2):Mat2 {
      out = out || new Mat2()
      var a = out.data
      var b = this.data
      a[ 0] = -b[ 0]; a[ 1] = -b[ 1]; 
      a[ 2] = -b[ 2]; a[ 3] = -b[ 3];
      return out
    }

    /**
     * Adds the given matrix to `this`
     * @param other The matrix to add
     * @return Reference to `this` for chaining.
     */
    add(other):Mat2 {
      var a = this.data;
      var b = other.data;
      a[ 0] += b[ 0]; a[ 1] += b[ 1]; 
      a[ 2] += b[ 2]; a[ 3] += b[ 3];
      return this;
    }
    addOut(other:Mat2, out?:Mat2):Mat2 {
      out = out || new Mat2()
      var a = this.data;
      var b = other.data;
      var c = out.data;
      c[ 0] = a[ 0] + b[ 0]; c[ 1] = a[ 1] + b[ 1]; 
      c[ 2] = a[ 2] + b[ 2]; c[ 3] = a[ 3] + b[ 3];
      return out;
    }

    /**
     * Adds the given scalar to each component of `this`
     * @param scalar The scalar to add
     * @return Reference to `this` for chaining.
     */
    addScalar(s:number):Mat2 {
      var a = this.data;
      a[ 0] += s; a[ 1] += s; 
      a[ 2] += s; a[ 3] += s;
      return this;
    }
    addScalarOut(s:number, out?:Mat2):Mat2 {
      out = out || new Mat2()
      var a = out.data;
      var b = s;
      var c = out.data;
      c[ 0] = a[ 0] + b; c[ 1] = a[ 1] + b; 
      c[ 2] = a[ 2] + b; c[ 3] = a[ 3] + b;
      return out;
    }

    /**
     * Subtracts the given matrix from `this`
     * @param other The matrix to subtract
     * @return Reference to `this` for chaining.
     */
    subtract(other):Mat2 {
      var a = this.data;
      var b = other.data;
      a[ 0] -= b[ 0]; a[ 1] -= b[ 1]; 
      a[ 2] -= b[ 2]; a[ 3] -= b[ 3];
      return this;
    }
    subtractOut(other:Mat2, out?:Mat2):Mat2 {
      out = out || new Mat2()
      var a = this.data;
      var b = other.data;
      var c = out.data;
      c[ 0] = a[ 0] - b[ 0]; c[ 1] = a[ 1] - b[ 1]; 
      c[ 2] = a[ 2] - b[ 2]; c[ 3] = a[ 3] - b[ 3];
      return out;
    }

    /**
     * Subtracts the given scalar from each component of `this`
     * @param scalar The scalar to subtract
     * @return Reference to `this` for chaining.
     */
    subtractScalar(s:number):Mat2 {
      var a = this.data;
      a[ 0] -= s; a[ 1] -= s; 
      a[ 2] -= s; a[ 3] -= s;
      return this;
    }
    subtractScalarOut(s:number, out?:Mat2):Mat2 {
      out = out || new Mat2()
      var a = out.data;
      var b = s;
      var c = out.data;
      c[ 0] = a[ 0] - b; c[ 1] = a[ 1] - b; 
      c[ 2] = a[ 2] - b; c[ 3] = a[ 3] - b;
      return out;
    }

    /**
     * Multiplies the given matrix with this
     * @param other The matrix to multiply
     * @return Reference to `this` for chaining.
     */
    multiply(other:Mat2):Mat2 {
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
    multiplyOut(other:Mat2, out?:Mat2):Mat2 {
      out = out || new Mat2() as any
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
    concat(other:Mat2):Mat2 {
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
    concatOut(other:Mat2, out?:Mat2):Mat2 {
      out = out || new Mat2() as any
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
    multiplyScalar(s:number):Mat2 {
      var a = this.data;
      a[ 0] *= s; a[ 1] *= s; 
      a[ 2] *= s; a[ 3] *= s;
      return this;
    }
    multiplyScalarOut(s:number, out?:Mat2):Mat2 {
      out = out || new Mat2()
      var a = out.data;
      var b = s;
      var c = out.data;
      c[ 0] = a[ 0] * b; c[ 1] = a[ 1] * b; 
      c[ 2] = a[ 2] * b; c[ 3] = a[ 3] * b;
      return out;
    }

    /**
     * Divides each matching component pair
     * @param other The matrix by which to divide
     * @return Reference to `this` for chaining.
     */
    divide(other:Mat2):Mat2 {
      var a = this.data;
      var b = other.data;
      a[ 0] /= b[ 0]; a[ 1] /= b[ 1]; 
      a[ 2] /= b[ 2]; a[ 3] /= b[ 3];
      return this;
    }

    /**
     * Divides each component of `this` by given scalar
     * @param scalar The scalar by which to divide
     * @return Reference to `this` for chaining.
     */
    divideScalar(s:number):Mat2 {
      var a = this.data;
      var b = 1.0 / s;
      a[ 0] *= b; a[ 1] *= b; 
      a[ 2] *= b; a[ 3] *= b;
      return this;
    }
    divideScalarOut(s:number, out?:Mat2):Mat2 {
      out = out || new Mat2()
      var a = out.data;
      var b = 1.0 / s;
      var c = out.data;
      c[ 0] = a[ 0] * b; c[ 1] = a[ 1] * b; 
      c[ 2] = a[ 2] * b; c[ 3] = a[ 3] * b;
      return out;
    }
    /**
     * Transform the given vector with this matrix.
     * @param vec
     * @return the given vector
     */
    transform<T extends IVec2>(vec:T):T {
      var x = vec.x || 0;
      var y = vec.y || 0;
      var d = this.data;
      vec.x = x * d[0] + y * d[2];
      vec.y = x * d[1] + y * d[3];
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
        buffer[offset] = x * d[0] + y * d[2];
        buffer[offset + 1] = x * d[1] + y * d[3];
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
        buffer[offset] = x * d[0] + y * d[2];
        buffer[offset + 1] = x * d[1] + y * d[3];
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
        buffer[offset    ] = x * d[0] + y * d[2];
        buffer[offset + 1] = x * d[1] + y * d[3];
        offset += stride;
      }
    }

    /**
     * Transpose the given matrix
     * @param mat The matrix to transpose
     * @param [out] The matrix to write to
     * @return The given `out` parameter or a new matrix
     */
    static transpose(mat:Mat2, out?:Mat2):Mat2 {
      var d = mat.data;
      return (out || new Mat2()).init(
        d[0], d[2],
        d[1], d[3]
      );
    }

    /**
     * Invert the given matrix
     * @param mat The matrix to transpose
     * @param [out] The matrix to write to
     * @return The given `out` parameter or a new matrix
     */
    static invert(mat:Mat2, out?:Mat2):Mat2 {
      out = out || new Mat2();
      var a = mat.data;
      var b = out.data;

      var a11 = a[0]
      var a12 = a[2]

      var a21 = a[1]
      var a22 = a[2]

      var detInv = 1 / (a11 * a22 - a12 * a21)

      b[0] = detInv * a22;
      b[1] = -detInv * a21;
      b[2] = detInv * a12;
      b[3] = -detInv * a22;

      return out;
    }


    /**
     * Negate the components of the given matrix
     * @param mat The matrix to transpose
     * @param [out] The matrix to write to
     * @return The given `out` parameter or a new matrix
     */
    static negate(mat:Mat2, out?:Mat2):Mat2 {
      out = out || new Mat2();
      var d = mat.data;
      var o = out.data;
      o[ 0] = -d[ 0]; o[ 1] = -d[ 1]; 
      o[ 2] = -d[ 2]; o[ 3] = -d[ 3];
      return out;
    }


    /**
     * Adds a matrix to another
     * @param matA The first matrix
     * @param matB The second matrix
     * @param [out] The matrix to write to
     * @return The given `out` parameter or a new matrix
     */
    static add(matA:Mat2, matB:Mat2, out?:Mat2):Mat2 {
      out = out || new Mat2();
      var a = matA.data;
      var b = matB.data;
      var c = out.data;
      c[ 0] = a[ 0] + b[ 0]; c[ 1] = a[ 1] + b[ 1]; 
      c[ 2] = a[ 2] + b[ 2]; c[ 3] = a[ 3] + b[ 3];
      return out;
    }


    /**
     * Adds a scalar to each component of a matrix
     * @param mat The matrix
     * @param scalar The scalar to add
     * @param [out] The matrix to write to
     * @return The given `out` parameter or a new matrix
     */
    static addScalar(mat:Mat2, scalar:number, out?:Mat2):Mat2 {
      out = out || new Mat2();
      var a = mat.data;
      var c = out.data;
      c[ 0] = a[ 0] + scalar; c[ 1] = a[ 1] + scalar; 
      c[ 2] = a[ 2] + scalar; c[ 3] = a[ 3] + scalar;
      return out;
    }


    /**
     * Subtracts the second matrix from the first
     * @param matA The first matrix
     * @param matB The second matrix
     * @param [out] The matrix to write to
     * @return The given `out` parameter or a new matrix
     */
    static subtract(matA:Mat2, matB:Mat2, out?:Mat2):Mat2 {
      out = out || new Mat2();
      var a = matA.data;
      var b = matB.data;
      var c = out.data;
      c[ 0] = a[ 0] - b[ 0]; c[ 1] = a[ 1] - b[ 1]; 
      c[ 2] = a[ 2] - b[ 2]; c[ 3] = a[ 3] - b[ 3];
      return out;
    }


    /**
     * Subtracts a scalar from each somponent of a matrix
     * @param mat The matrix to subtract from
     * @param scalar The scalar to subtract
     * @param [out] The matrix to write to
     * @return The given `out` parameter or a new matrix
     */
    static subtractScalar(mat:Mat2, scalar:number, out?:Mat2):Mat2 {
      out = out || new Mat2();
      var a = mat.data;
      var c = out.data;
      c[ 0] = a[ 0] - scalar; c[ 1] = a[ 1] - scalar; 
      c[ 2] = a[ 2] - scalar; c[ 3] = a[ 3] - scalar;
      return out;
    }


    /**
     * Multiplies a matrix by another matrix
     * @param matA The first matrix
     * @param matB The second matrix
     * @param [out] The matrix to write to
     * @return The given `out` parameter or a new matrix
     */
    static multiply(matA:Mat2, matB:Mat2, out?:Mat2):Mat2 {
      out = out || new Mat2();
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
      out = out || new Mat2();
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
    static concatChain(...rest:Mat2[]) {
      // (a, (b, (c, (d, e))))
      var i, result = arguments[arguments.length - 1].clone();
      for (i = arguments.length - 2; i >= 0; i--) {
        Mat2.concat(arguments[i], result, result);
      }
      return result;
    }

    /**
     * Multiplies a chain of matrices
     * @method multiplyChain
     * @return The result of the multiplication
     */
    static multiplyChain(...rest:Mat2[]) {
      // ((((a, b), c), d), e)
      var i, result = arguments[0].clone();
      for (i = 1; i < arguments.length; i += 1) {
        Mat2.multiply(result, arguments[i], result);
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
    static multiplyScalar(matA:Mat2, scalar:number, out?:Mat2):Mat2 {
      out = out || new Mat2();
      var a = matA.data;
      var b = scalar;
      var c = out.data;
      c[ 0] = a[ 0] * b; c[ 1] = a[ 1] * b; 
      c[ 2] = a[ 2] * b; c[ 3] = a[ 3] * b;
      return out;
    }


    /**
     * Divides the components of the first matrix by the components of the second matrix
     * @param matA The first matrix
     * @param matB The second matrix
     * @param [out] The matrix to write to
     * @return The given `out` parameter or a new matrix
     */
    static divide(matA:Mat2, matB:Mat2, out?:Mat2):Mat2 {
      out = out || new Mat2();
      var a = matA.data;
      var b = matB.data;
      var c = out.data;
      c[ 0] = a[ 0] / b[ 0]; c[ 1] = a[ 1] / b[ 1]; 
      c[ 2] = a[ 2] / b[ 2]; c[ 3] = a[ 3] / b[ 3];
      return out;
    }

    /**
     * Divides the components of a matrix by a scalar
     * @param matA The matrix
     * @param scalar The scalar by which to divide
     * @param [out] The matrix to write to
     * @return The given `out` parameter or a new matrix
     */
    static divideScalar(matA:Mat2, scalar:number, out?:Mat2):Mat2 {
      out = out || new Mat2();
      var a = matA.data;
      var b = 1 / scalar;
      var c = out.data;
      c[ 0] = a[ 0] * b; c[ 1] = a[ 1] * b; 
      c[ 2] = a[ 2] * b; c[ 3] = a[ 3] * b;
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
    static lerp(matA:Mat2, matB:Mat2, t:number, out?:Mat2):Mat2 {
      out = out || new Mat2();
      var a = matA.data;
      var b = matB.data;
      var c = out.data;
      c[0] = a[0] + (b[0] - a[0]) * t;
      c[1] = a[1] + (b[1] - a[1]) * t;
      c[2] = a[2] + (b[2] - a[2]) * t;
      c[3] = a[3] + (b[3] - a[3]) * t;
      return out;
    }

    /**
     * Creates a new matrix with all components set to 0
     * @return a new matrix
     */
    static zero():Mat2 {
      return new Mat2();
    }

    /**
     * Creates a new matrix that is initialized to identity
     * @return a new matrix
     */
    static identity():Mat2 {
      return new Mat2().initIdentity();
    }

    /**
     * Creates a new matrix. This method should be called with 16 or 0 arguments. If less than 16 but more than 0 arguments
     * are given some components are going to be undefined. The arguments are expected to be in column major order.
     * @return a new matrix
     */
    static create(m0, m1, m2, 
                  m3, m4, m5, 
                  m6, m7, m8):Mat2 {
      var out = new Mat2();
      var d = out.data;
      d[ 0] = m0;  d[ 1] = m1;  
      d[ 2] = m2;  d[ 3] = m3;
      return out;
    }

    /**
     * Creates a new matrix. The arguments are expected to be in row major order.
     * @return a new matrix
     */
    static createRowMajor(m0, m3, m6, 
                          m1, m4, m7, 
                          m2, m5, m8):Mat2 {
      var out = new Mat2();
      var d = out.data;
      d[ 0] = m0;  d[ 1] = m1;  
      d[ 2] = m2;  d[ 3] = m3;
      return out;
    }

    /**
     * @return a new matrix
     */
    static createScale(x:number, y:number):Mat2 {
      return new Mat2().initScale(x, y);
    }

    /**
     * @return a new matrix
     */
    static createRotationX(rad:number):Mat2 {
      return new Mat2().initRotationX(rad);
    }

    /**
     * @return a new matrix
     */
    static createRotationY(rad:number):Mat2 {
      return new Mat2().initRotationY(rad);
    }

    /**
     * @return a new matrix
     */
    static createRotationZ(rad:number):Mat2 {
      return new Mat2().initRotationZ(rad);
    }
    /**
     * @return a new matrix
     */
    static createRotation(rad:number):Mat2 {
      return new Mat2().initRotation(rad);
    }

    /**
     * @return a new matrix
     */
    static createAxisAngle(axis:IVec3, angle:number):Mat2 {
      return new Mat2().initAxisAngle(axis, angle);
    }

    /**
     * @return a new matrix
     */
    static createYawPitchRoll(yaw:number, pitch:number, roll:number):Mat2 {
      return new Mat2().initYawPitchRoll(yaw, pitch, roll);
    }

    /**
     * @returns {string}
     */
    static prettyString(mat) {
      var m = mat.data;
      var fixed = 5;
      return [
        [m[0].toFixed(fixed), m[2].toFixed(fixed)].join(', '),
        [m[1].toFixed(fixed), m[3].toFixed(fixed)].join(', ')
      ].join('\n');
    }

  }
}
