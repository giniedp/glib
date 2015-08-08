module Vlib {

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
   * @class Mat4
   * @constructor
   * @main Mat4
   * @param {Float32Array} [data] The data array that holds all matrix values. Assumed to have a length of 16.
   */
  export class Mat4 {
    data:Float32Array;
    right:Float32Array;
    up:Float32Array;
    backward:Float32Array;
    translation:Float32Array;

    constructor(data?:Float32Array) {
      /**
       * @attribute data
       * @type {Float32Array}
       */
      this.data = data || new Float32Array(16);
      /**
       * @attribute right
       * @type {Float32Array}
       * @description This is a subarray of the `data` attribute
       */
      this.right = this.data.subarray(0, 3);
      /**
       * @attribute up
       * @type {Float32Array}
       * @description This is a subarray of the `data` attribute
       */
      this.up = this.data.subarray(4, 7);
      /**
       * @attribute backward
       * @type {Float32Array}
       * @description This is a subarray of the `data` attribute
       */
      this.backward = this.data.subarray(8, 11);
      /**
       * @attribute translation
       * @type {Float32Array}
       * @description This is a subarray of the `data` attribute
       */
      this.translation = this.data.subarray(12, 15);
    }

    /**
     * Initializes the matrix with the given values in given order. The values are applied in column major order
     * @method init
     * @chainable
     * @param {Number} m0
     * @param {Number} m1
     * @param {Number} m2
     * @param {Number} m3
     * @param {Number} m4
     * @param {Number} m5
     * @param {Number} m6
     * @param {Number} m7
     * @param {Number} m8
     * @param {Number} m9
     * @param {Number} m10
     * @param {Number} m11
     * @param {Number} m12
     * @param {Number} m13
     * @param {Number} m14
     * @param {Number} m15
     * @return {Mat4} Reference to `this` for chaining.
     * @example
     *
     *     mat.init(
     *       0, 0, 0, 0,
     *       0, 0, 0, 0,
     *       0, 0, 0, 0,
     *       x, y, z, 0)
     */
    init(m0, m1, m2, m3, m4, m5, m6, m7, m8, m9, m10, m11, m12, m13, m14, m15) {
      var d = this.data;
      d[0] = m0;
      d[1] = m1;
      d[2] = m2;
      d[3] = m3;
      d[4] = m4;
      d[5] = m5;
      d[6] = m6;
      d[7] = m7;
      d[8] = m8;
      d[9] = m9;
      d[10] = m10;
      d[11] = m11;
      d[12] = m12;
      d[13] = m13;
      d[14] = m14;
      d[15] = m15;
      return this;
    }

    /**
     * Initializes the matrix with the given values. The values are read in row major order.
     * @method initRowMajor
     * @chainable
     * @param {Number} m0
     * @param {Number} m4
     * @param {Number} m8
     * @param {Number} m12
     * @param {Number} m1
     * @param {Number} m5
     * @param {Number} m9
     * @param {Number} m13
     * @param {Number} m2
     * @param {Number} m6
     * @param {Number} m10
     * @param {Number} m14
     * @param {Number} m3
     * @param {Number} m7
     * @param {Number} m11
     * @param {Number} m15
     * @return {Mat4} Reference to `this` for chaining.
     */
    initRowMajor(m0, m4, m8, m12, m1, m5, m9, m13, m2, m6, m10, m14, m3, m7, m11, m15) {
      var d = this.data;
      d[0] = m0;
      d[1] = m1;
      d[2] = m2;
      d[3] = m3;
      d[4] = m4;
      d[5] = m5;
      d[6] = m6;
      d[7] = m7;
      d[8] = m8;
      d[9] = m9;
      d[10] = m10;
      d[11] = m11;
      d[12] = m12;
      d[13] = m13;
      d[14] = m14;
      d[15] = m15;
      return this;
    }

    /**
     * Initializes all components of this matrix with the given number.
     * @method initWith
     * @chainable
     * @param {Number} number The number to set all matrix components to.
     * @return {Mat4} Reference to `this` for chaining.
     */
    initWith(number) {
      var d = this.data;
      d[0] = d[1] = d[2] = d[3] = d[4] = d[5] = d[6] = d[7] = d[8] = d[9] = d[10] = d[11] = d[12] = d[13] = d[14] = d[15] = number;
      return this;
    }

    /**
     * Initializes the components of this matrix to the identity.
     * @method initIdentity
     * @chainable
     * @return {Mat4} Reference to `this` for chaining.
     */
    initIdentity() {
      var d = this.data;
      d[0] = d[5] = d[10] = d[15] = 1;
      d[1] = d[2] = d[3] = d[4] = d[6] = d[7] = d[8] = d[9] = d[11] = d[12] = d[13] = d[14] = 0;
      return this;
    }

    /**
     * Initializes this matrix from another matrix.
     * @method initFrom
     * @chainable
     * @param {Mat4} other
     * @return {Mat4} Reference to `this` for chaining.
     */
    initFrom(other) {
      var a = this.data;
      var b = other.data;
      a[0] = b[0];
      a[1] = b[1];
      a[2] = b[2];
      a[3] = b[3];
      a[4] = b[4];
      a[5] = b[5];
      a[6] = b[6];
      a[7] = b[7];
      a[8] = b[8];
      a[9] = b[9];
      a[10] = b[10];
      a[11] = b[11];
      a[12] = b[12];
      a[13] = b[13];
      a[14] = b[14];
      a[15] = b[15];
      return this;
    }

    /**
     * Reads a buffer starting at given offset and initializes the elements of this matrix.
     * The given buffer must have at least 16 elements starting at given offset.
     * The elements are expected to be in column major layout.
     * @method initFromBuffer
     * @chainable
     * @param {Array|Float32Array} buffer
     * @param {Number} [offset]
     * @return {Mat4} Reference to `this` for chaining.
     */
    initFromBuffer(buffer, offset) {
      offset = offset || 0;
      var a = this.data;
      a[0] = buffer[offset];
      a[1] = buffer[offset + 1];
      a[2] = buffer[offset + 2];
      a[3] = buffer[offset + 3];
      a[4] = buffer[offset + 4];
      a[5] = buffer[offset + 5];
      a[6] = buffer[offset + 6];
      a[7] = buffer[offset + 7];
      a[8] = buffer[offset + 8];
      a[9] = buffer[offset + 9];
      a[10] = buffer[offset + 10];
      a[11] = buffer[offset + 11];
      a[12] = buffer[offset + 12];
      a[13] = buffer[offset + 13];
      a[14] = buffer[offset + 14];
      a[15] = buffer[offset + 15];
      return this;
    }

    /**
     * Initializes this matrix from given quaternion.
     * @method initFromQuaternion
     * @chainable
     * @param {Quat} q The quaternion
     * @return {Mat4} Reference to `this` for chaining.
     */
    initFromQuaternion(q) {
      var x = q.x;
      var y = q.y;
      var z = q.z;
      var w = q.w;
      var xx = x * x;
      var yy = y * y;
      var zz = z * z;
      var xy = x * y;
      var zw = z * w;
      var zx = z * x;
      var yw = y * w;
      var yz = y * z;
      var xw = x * w;
      return this.initRowMajor(
        1 - 2 * (yy + zz), 2 * (xy - zw), 2 * (zx + yw), 0,
        2 * (xy + zw), 1 - 2 * (zz + xx), 2 * (yz - xw), 0,
        2 * (zx - yw), 2 * (yz + xw), 1 - 2 * (yy + xx), 0,
        0, 0, 0, 1
      );
    }

    /**
     * Initializes this matrix to a rotation matrix defined by given axis vector and angle.
     * @method initAxisAngle
     * @chainable
     * @param {Vec3} axis The axis vector. This is expected to be normalized.
     * @param {Number} angle The angle in radians.
     * @return {Mat4} Reference to `this` for chaining.
     */
    initAxisAngle(axis, angle) {
      // create quaternion
      var halfAngle = angle * 0.5;
      var scale = Math.sin(halfAngle);
      var x = axis.x * scale;
      var y = axis.y * scale;
      var z = axis.z * scale;
      var w = Math.cos(halfAngle);

      // matrix from quaternion
      var xx = x * x;
      var yy = y * y;
      var zz = z * z;
      var xy = x * y;
      var zw = z * w;
      var zx = z * x;
      var yw = y * w;
      var yz = y * z;
      var xw = x * w;

      return this.initRowMajor(
        1 - 2 * (yy + zz), 2 * (xy - zw), 2 * (zx + yw), 0,
        2 * (xy + zw), 1 - 2 * (zz + xx), 2 * (yz - xw), 0,
        2 * (zx - yw), 2 * (yz + xw), 1 - 2 * (yy + xx), 0,
        0, 0, 0, 1
      );
    }

    /**
     * Initializes this matrix to a rotation matrix defined by given yaw pitch and roll values.
     * @method initYawPitchRoll
     * @chainable
     * @param {Number} yaw Angle in radians around the Y axis
     * @param {Number} pitch Angle in radians around the X axis
     * @param {Number} roll Angle in radians around the Z axis
     * @return {Mat4} Reference to `this` for chaining.
     */
    initYawPitchRoll(yaw, pitch, roll) {
      // create quaternion
      var zHalf = roll * 0.5;
      var zSin = Math.sin(zHalf);
      var zCos = Math.cos(zHalf);

      var xHalf = pitch * 0.5;
      var xSin = Math.sin(xHalf);
      var xCos = Math.cos(xHalf);

      var yHalf = yaw * 0.5;
      var ySin = Math.sin(yHalf);
      var yCos = Math.cos(yHalf);

      var x = yCos * xSin * zCos + ySin * xCos * zSin;
      var y = ySin * xCos * zCos - yCos * xSin * zSin;
      var z = yCos * xCos * zSin - ySin * xSin * zCos;
      var w = yCos * xCos * zCos + ySin * xSin * zSin;
      // matrix from quaternion
      var xx = x * x;
      var yy = y * y;
      var zz = z * z;
      var xy = x * y;
      var zw = z * w;
      var zx = z * x;
      var yw = y * w;
      var yz = y * z;
      var xw = x * w;

      return this.initRowMajor(
        1 - 2 * (yy + zz), 2 * (xy - zw), 2 * (zx + yw), 0,
        2 * (xy + zw), 1 - 2 * (zz + xx), 2 * (yz - xw), 0,
        2 * (zx - yw), 2 * (yz + xw), 1 - 2 * (yy + xx), 0,
        0, 0, 0, 1
      );
    }

    /**
     * Initializes this matrix with a rotation around the X axis.
     * @method initRotationX
     * @chainable
     * @param {Number} rad The angle in radians.
     * @return {Mat4} Reference to `this` for chaining.
     */
    initRotationX(rad) {
      var cos = Math.cos(rad);
      var sin = Math.sin(rad);
      return this.initRowMajor(
        1, 0, 0, 0,
        0, cos, -sin, 0,
        0, sin, cos, 0,
        0, 0, 0, 1
      );
    }

    /**
     * Initializes this matrix with a rotation around the Y axis.
     * @method initRotationY
     * @chainable
     * @param rad The angle in radians.
     * @return {Mat4} Reference to `this` for chaining.
     */
    initRotationY(rad) {
      var cos = Math.cos(rad);
      var sin = Math.sin(rad);

      return this.initRowMajor(
        cos, 0, sin, 0,
        0, 1, 0, 0,
        -sin, 0, cos, 0,
        0, 0, 0, 1
      );
    }

    /**
     * Initializes this matrix with a rotation around the Z axis.
     * @method initRotationZ
     * @chainable
     * @param rad The angle in radians.
     * @return {Mat4} Reference to `this` for chaining.
     */
    initRotationZ(rad) {
      var cos = Math.cos(rad);
      var sin = Math.sin(rad);
      return this.initRowMajor(
        cos, -sin, 0, 0,
        sin, cos, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
      );
    }


    /**
     * Initializes a translation matrix.
     * @method initTranslation
     * @chainable
     * @param {Number} x Translation along the x-axis
     * @param {Number} y Translation along the y-axis
     * @param {Number} z Translation along the z-axis
     * @return {Mat4} Reference to `this` for chaining.
     */
    initTranslation(x, y, z) {
      return this.initRowMajor(
        1, 0, 0, x,
        0, 1, 0, y,
        0, 0, 1, z,
        0, 0, 0, 1
      );
    }

    /**
     * Initializes a scale matrix.
     * @method initScale
     * @chainable
     * @param {Number} x Scale along x-axis
     * @param {Number} y Scale along y-axis
     * @param {Number} z Scale along z-axis
     * @return {Mat4} Reference to `this` for chaining.
     */
    initScale(x, y, z) {
      return this.initRowMajor(
        x, 0, 0, 0,
        0, y, 0, 0,
        0, 0, z, 0,
        0, 0, 0, 1
      );
    }

    /**
     * Initializes a rotation matrix by using a position and a lookat point.
     * @method initLookAt
     * @chainable
     * @param {Vec3|Vec4} pos The position where the viewer stands
     * @param {Vec3|Vec4} lookAt The position where the viewer is looking to
     * @param {Vec3|Vec4} up The up vector of the viewer
     * @return {Mat4} Reference to `this` for chaining.
     */
    initLookAt(pos, lookAt, up) {
      // back = position - lookAt
      var backX = pos.x - lookAt.x;
      var backY = pos.y - lookAt.y;
      var backZ = pos.z - lookAt.z;

      // right = cross(up, back)
      var rightX = up.y * backZ - up.z * backY;
      var rightY = up.z * backX - up.x * backZ;
      var rightZ = up.x * backY - up.y * backX;

      // back = normalize(back)
      var d = 1.0 / Math.sqrt(backX * backX + backY * backY + backZ * backZ);
      backX *= d;
      backY *= d;
      backZ *= d;

      // right = normalize(right)
      d = 1.0 / Math.sqrt(rightX * rightX + rightY * rightY + rightZ * rightZ);
      rightX *= d;
      rightY *= d;
      rightZ *= d;

      // up = cross(back, right)
      var upX = backY * rightZ - backZ * rightY;
      var upY = backZ * rightX - backX * rightZ;
      var upZ = backX * rightY - backY * rightX;

      return this.initRowMajor(
        rightX, upX, backX, pos.x,
        rightY, upY, backY, pos.y,
        rightZ, upZ, backZ, pos.z,
        0, 0, 0, 1
      );
    }

    /**
     * Initializes a matrix from a position point and a forward and up vectors
     * @method initWorld
     * @chainable
     * @param {Vec3|Vec4} position The translation part
     * @param {Vec3|Vec4} forward The facing direction
     * @param {Vec3|Vec4} up The up vector
     * @return {Mat4} Reference to `this` for chaining.
     */
    initWorld(position, forward, up) {
      // backward = negate(normalize(forward))
      var x = forward.x;
      var y = forward.y;
      var z = forward.z;
      var d = 1.0 / Math.sqrt(x * x + y * y + z * z);

      var backX = -x * d;
      var backY = -y * d;
      var backZ = -z * d;

      // right = normalize(cross(up, back))
      x = up.y * backZ - up.z * backY;
      y = up.z * backX - up.x * backZ;
      z = up.x * backY - up.y * backX;
      d = 1.0 / Math.sqrt(x * x + y * y + z * z);

      var rightX = x * d;
      var rightY = y * d;
      var rightZ = z * d;

      // up = cross(back, right)
      x = backY * rightZ - backZ * rightY;
      y = backZ * rightX - backX * rightZ;
      z = backX * rightY - backY * rightX;

      return this.initRowMajor(
        rightX, x, backX, position.x,
        rightY, y, backY, position.y,
        rightZ, z, backZ, position.z,
        0, 0, 0, 1
      );
    }

    /**
     * Initializes a perspective matrix with given field of view angle
     * @method initPerspectiveFieldOfView
     * @chainable
     * @param {Number} fov The field of view angle in radians
     * @param {Number} aspect The aspect ratio
     * @param {Number} near The near plane distance
     * @param {Number} far The far plane distance
     * @return {Mat4} Reference to `this` for chaining.
     */
    initPerspectiveFieldOfView(fov, aspect, near, far) {
      var s = 1.0 / Math.tan(fov * 0.5);

      return this.initRowMajor(
        s / aspect, 0, 0, 0,
        0, s, 0, 0,
        0, 0, -(far + near) / (far - near), -(2 * far * near) / (far - near),
        0, 0, -1, 0
      );
    }

    /**
     * Initializes a perspective matrix
     * @method initPerspective
     * @chainable
     * @param {Number} width
     * @param {Number} height
     * @param {Number} near The near plane distance
     * @param {Number} far The far plane distance
     * @return {Mat4} Reference to `this` for chaining.
     */
    initPerspective(width, height, near, far) {
      return this.initRowMajor(
        near / width, 0, 0, 0,
        0, near / height, 0, 0,
        0, 0, -(far + near) / (far - near), -(2 * far * near) / (far - near),
        0, 0, -1, 0
      );
    }

    /**
     * Initializes a perspective matrix
     * @method initPerspectiveOffCenter
     * @chainable
     * @param {Number} left
     * @param {Number} right
     * @param {Number} bottom
     * @param {Number} top
     * @param {Number} near The near plane distance
     * @param {Number} far The far plane distance
     * @return {Mat4} Reference to `this` for chaining.
     */
    initPerspectiveOffCenter(left, right, bottom, top, near, far) {
      return this.initRowMajor(
        2 * near / (right - left), 0, (right + left) / (right - left), 0,
        0, 2 * near / (top - bottom), (top + bottom) / (top - bottom), 0,
        0, 0, -(far + near) / (far - near), -(2 * far * near) / (far - near),
        0, 0, -1, 0
      );
    }

    /**
     * Initializes an orthographic matrix
     * @method initOrthographic
     * @chainable
     * @param width
     * @param height
     * @param {Number} near The near plane distance
     * @param {Number} far The far plane distance
     * @return {Mat4} Reference to `this` for chaining.
     */
    initOrthographic(width, height, near, far) {
      return this.initRowMajor(
        1 / width, 0, 0, 0,
        0, 1 / height, 0, 0,
        0, 0, -2 / (far - near), -(far + near) / (far - near),
        0, 0, 0, 1
      );
    }

    /**
     * Initializes an orthographic matrix
     * @method initOrthographicOffCenter
     * @chainable
     * @param left
     * @param right
     * @param bottom
     * @param top
     * @param {Number} near The near plane distance
     * @param {Number} far The far plane distance
     * @return {Mat4} Reference to `this` for chaining.
     */
    initOrthographicOffCenter(left, right, bottom, top, near, far) {
      return this.initRowMajor(
        2 / (right - left), 0, 0, -(right + left) / (right - left),
        0, 2 / (top - bottom), 0, -(top + bottom) / (top - bottom),
        0, 0, -2 / (far - near), -(far + near) / (far - near),
        0, 0, 0, 1
      );
    }


    /**
     * Creates a copy of this matrix
     * @method clone
     * @return {Mat4} The cloned matrix.
     */
    clone() {
      var d = this.data;
      return new Mat4().init(d[0], d[1], d[2], d[3], d[4], d[5], d[6], d[7], d[8], d[9], d[10], d[11], d[12], d[13], d[14], d[15]);
    }

    /**
     * Copies the components successively into the given array.
     * @chainable
     * @method copy
     * @param {Array|Float32Array} buffer The array to copy into
     * @param {Number} [offset=0] Zero based index where to start writing in the array
     * @return {Array|Float32Array}
     */
    copyTo(buffer:NumbersArray, offset?:number) {
      offset = offset || 0;
      var d = this.data;
      buffer[offset] = d[0];
      buffer[offset + 1] = d[1];
      buffer[offset + 2] = d[2];
      buffer[offset + 3] = d[3];
      buffer[offset + 4] = d[4];
      buffer[offset + 5] = d[5];
      buffer[offset + 6] = d[6];
      buffer[offset + 7] = d[7];
      buffer[offset + 8] = d[8];
      buffer[offset + 9] = d[9];
      buffer[offset + 10] = d[10];
      buffer[offset + 11] = d[11];
      buffer[offset + 12] = d[12];
      buffer[offset + 13] = d[13];
      buffer[offset + 14] = d[14];
      buffer[offset + 15] = d[15];
      return buffer;
    }

    /**
     * Returns an array filled with the values of the components of this vector
     * @method dump
     * @return {Array}
     */
    dump() {
      var result = [];
      this.copyTo(result);
      return result;
    }

    /**
     * Checks for component wise equality with given matrix
     * @method equals
     * @param {Mat4} other The matrix to compare with
     * @return {Boolean} true if components are equal, false otherwise
     */
    equals(other) {
      var a = this.data;
      var b = other.data;
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
        a[15] === b[15];
    }

    /**
     * Gets the forward vector
     * @method getForward
     * @param {Vec3|Vec4} [out] The vector to write to
     * @return {Vec3|Vec4} the given `out` parameter or a new vector
     */
    getForward(out) {
      return (out || new Vec3()).init(
        -this.backward[0],
        -this.backward[1],
        -this.backward[2]
      );
    }

    /**
     * Gets the backward vector
     * @method getBackward
     * @param {Vec3|Vec4} [out] The vector to write to
     * @return {Vec3|Vec4} the given `out` parameter or a new vector
     */
    getBackward(out) {
      return (out || new Vec3()).init(
        this.backward[0],
        this.backward[1],
        this.backward[2]
      );
    }

    /**
     * Gets the right vector
     * @method getRight
     * @param {Vec3|Vec4} [out] The vector to write to
     * @return {Vec3|Vec4} the given `out` parameter or a new vector
     */
    getRight(out) {
      return (out || new Vec3()).init(
        this.right[0],
        this.right[1],
        this.right[2]
      );
    }

    /**
     * Gets the left vector
     * @method getLeft
     * @param {Vec3|Vec4} [out] The vector to write to
     * @return {Vec3|Vec4} the given `out` parameter or a new vector
     */
    getLeft(out) {
      return (out || new Vec3()).init(
        -this.right[0],
        -this.right[1],
        -this.right[2]
      );
    }

    /**
     * Gets the up vector
     * @method getUp
     * @param {Vec3|Vec4} [out] The vector to write to
     * @return {Vec3|Vec4} the given `out` parameter or a new vector
     */
    getUp(out) {
      return (out || new Vec3()).init(
        this.up[0],
        this.up[1],
        this.up[2]);
    }

    /**
     * Gets the down vector
     * @method getDown
     * @param {Vec3|Vec4} [out] The vector to write to
     * @return {Vec3|Vec4} the given `out` parameter or a new vector
     */
    getDown(out) {
      return (out || new Vec3()).init(
        -this.up[0],
        -this.up[1],
        -this.up[2]
      );
    }

    /**
     * Gets the translation part as vector
     * @method getTranslation
     * @param {Vec3|Vec4} [out] The vector to write to
     * @return {Vec3|Vec4} the given `out` parameter or a new vector
     */
    getTranslation(out) {
      return (out || new Vec3()).init(
        this.translation[0],
        this.translation[1],
        this.translation[2]
      );
    }

    /**
     * Gets the scale part as vector
     * @method getScale
     * @param {Vec3|Vec4} [out] The vector to write to
     * @return {Vec3|Vec4} the given `out` parameter or a new vector
     */
    getScale(out) {
      return (out || new Vec3()).init(
        this.data[0],
        this.data[5],
        this.data[10]
      );
    }

    /**
     * Writes the values of the forward vector into an array
     * @method copyForward
     * @param {Array|Float32Array} buffer The array to write to
     * @return {Array|Float32Array} the given `buffer` parameter
     */
    copyForward(buffer) {
      buffer[0] = -this.backward[0];
      buffer[1] = -this.backward[1];
      buffer[2] = -this.backward[2];
      return buffer;
    }

    /**
     * Writes the values of the backward vector into an array
     * @method copyBackward
     * @param {Array|Float32Array} buffer The array to write to
     * @return {Array|Float32Array} the given `buffer` parameter
     */
    copyBackward(buffer) {
      buffer[0] = this.backward[0];
      buffer[1] = this.backward[1];
      buffer[2] = this.backward[2];
      return buffer;
    }

    /**
     * Writes the values of the right vector into an array
     * @method copyRight
     * @param {Array|Float32Array} buffer The array to write to
     * @return {Array|Float32Array} the given `buffer` parameter
     */
    copyRight(buffer) {
      buffer[0] = this.right[0];
      buffer[1] = this.right[1];
      buffer[2] = this.right[2];
      return buffer;
    }

    /**
     * Writes the values of the left vector into an array
     * @method copyLeft
     * @param {Array|Float32Array} buffer The array to write to
     * @return {Array|Float32Array} the given `buffer` parameter
     */
    copyLeft(buffer) {
      buffer[0] = -this.right[0];
      buffer[1] = -this.right[1];
      buffer[2] = -this.right[2];
      return buffer;
    }

    /**
     * Writes the values of the up vector into an array
     * @method copyUp
     * @param {Array|Float32Array} buffer The array to write to
     * @return {Array|Float32Array} the given `buffer` parameter
     */
    copyUp(buffer) {
      buffer[0] = this.up[0];
      buffer[1] = this.up[1];
      buffer[2] = this.up[2];
      return buffer;
    }

    /**
     * Writes the values of the down vector into an array
     * @method copyDown
     * @param {Array|Float32Array} buffer The array to write to
     * @return {Array|Float32Array} the given `buffer` parameter
     */
    copyDown(buffer) {
      buffer[0] = -this.up[0];
      buffer[1] = -this.up[1];
      buffer[2] = -this.up[2];
      return buffer;
    }

    /**
     * Writes the values of the translation part into an array
     * @method copyTranslation
     * @param {Array|Float32Array} buffer The array to write to
     * @return {Array|Float32Array} the given `buffer` parameter
     */
    copyTranslation(buffer) {
      buffer[0] = this.translation[0];
      buffer[1] = this.translation[1];
      buffer[2] = this.translation[2];
      return buffer;
    }

    /**
     * Writes the values of the scale vector into an array
     * @method copyScale
     * @param {Array|Float32Array} buffer The array to write to
     * @return {Array|Float32Array} the given `buffer` parameter
     */
    copyScale(buffer) {
      buffer[0] = this.data[0];
      buffer[1] = this.data[5];
      buffer[2] = this.data[10];
      return buffer;
    }

    /**
     * Sets the forward vector
     * @method setForward
     * @chainable
     * @param {Vec3|Vec4} vec The vector to take values from
     * @return {Mat4} Reference to `this` for chaining.
     */
    setForward(vec) {
      this.backward[0] = -vec.x;
      this.backward[1] = -vec.y;
      this.backward[2] = -vec.z;
      return this;
    }

    /**
     * Sets the backward vector
     * @method setBackward
     * @chainable
     * @param {Vec3|Vec4} vec The vector to take values from
     * @return {Mat4} Reference to `this` for chaining.
     */
    setBackward(vec) {
      this.backward[0] = vec.x;
      this.backward[1] = vec.y;
      this.backward[2] = vec.z;
      return this;
    }

    /**
     * Sets the right vector
     * @method setRight
     * @chainable
     * @param {Vec3|Vec4} vec The vector to take values from
     * @return {Mat4} Reference to `this` for chaining.
     */
    setRight(vec) {
      this.right[0] = vec.x;
      this.right[1] = vec.y;
      this.right[2] = vec.z;
      return this;
    }

    /**
     * Sets the left vector
     * @method setLeft
     * @chainable
     * @param {Vec3|Vec4} vec The vector to take values from
     * @return {Mat4} Reference to `this` for chaining.
     */
    setLeft(vec) {
      this.right[0] = -vec.x;
      this.right[1] = -vec.y;
      this.right[2] = -vec.z;
      return this;
    }

    /**
     * Sets the up vector
     * @method setUp
     * @chainable
     * @param {Vec3|Vec4} vec The vector to take values from
     * @return {Mat4} Reference to `this` for chaining.
     */
    setUp(vec) {
      this.up[0] = vec.x;
      this.up[1] = vec.y;
      this.up[2] = vec.z;
      return this;
    }

    /**
     * Sets the down vector
     * @method setDown
     * @chainable
     * @param {Vec3|Vec4} vec The vector to take values from
     * @return {Mat4} Reference to `this` for chaining.
     */
    setDown(vec) {
      this.up[0] = -vec.x;
      this.up[1] = -vec.y;
      this.up[2] = -vec.z;
      return this;
    }

    /**
     * Sets the translation part
     * @method setTranslation
     * @chainable
     * @param {Vec3|Vec4} vec The vector to take values from
     * @return {Mat4} Reference to `this` for chaining.
     */
    setTranslation(vec) {
      this.translation[0] = vec.x;
      this.translation[1] = vec.y;
      this.translation[2] = vec.z;
      return this;
    }

    /**
     * Sets the scale part
     * @method setScale
     * @chainable
     * @param {Vec3|Vec4} vec The vector to take values from
     * @return {Mat4} Reference to `this` for chaining.
     */
    setScale(vec) {
      this.data[0] = vec.x;
      this.data[5] = vec.y;
      this.data[10] = vec.z;
      return this;
    }

    /**
     * Calculates the determinant of this matrix
     * @method determinant
     * @return {Number}
     */
    determinant() {
      var a = this.data;

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

      return (a11 * det1 - a21 * det2 + a31 * det3 - a41 * det4);
    }

    /**
     * Transposes this matrix
     * @method selfTranspose
     * @chainable
     * @return {Mat4} Reference to `this` for chaining.
     */
    selfTranspose() {
      var d = this.data;
      var t = d[1];
      d[1] = d[4];
      d[4] = t;

      t = d[2];
      d[2] = d[8];
      d[8] = t;

      t = d[3];
      d[3] = d[12];
      d[12] = t;

      t = d[6];
      d[6] = d[9];
      d[9] = t;

      t = d[7];
      d[7] = d[13];
      d[13] = t;

      t = d[11];
      d[11] = d[14];
      d[14] = t;
      return this;
    }

    /**
     * Inverts this matrix
     * @method selfInvert
     * @chainable
     * @return {Mat4} Reference to `this` for chaining.
     */
    selfInvert() {
      var a = this.data;
      var b = this.data;

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
      return this;
    }

    /**
     * Negates all components of this matrix
     * @method selfNegate
     * @chainable
     * @return {Mat4} Reference to `this` for chaining.
     */
    selfNegate() {
      var d = this.data;
      d[0] = -d[0];
      d[1] = -d[1];
      d[2] = -d[2];
      d[3] = -d[3];
      d[4] = -d[4];
      d[5] = -d[5];
      d[6] = -d[6];
      d[7] = -d[7];
      d[8] = -d[8];
      d[9] = -d[9];
      d[10] = -d[10];
      d[11] = -d[11];
      d[12] = -d[12];
      d[13] = -d[13];
      d[14] = -d[14];
      d[15] = -d[15];
      return this;
    }

    /**
     * Adds the given matrix to `this`
     * @method selfAdd
     * @chainable
     * @param {Mat4} other The matrix to add
     * @return {Mat4} Reference to `this` for chaining.
     */
    selfAdd(other) {
      var a = this.data;
      var b = other.data;
      a[0] += b[0];
      a[1] += b[1];
      a[2] += b[2];
      a[3] += b[3];
      a[4] += b[4];
      a[5] += b[5];
      a[6] += b[6];
      a[7] += b[7];
      a[8] += b[8];
      a[9] += b[9];
      a[10] += b[10];
      a[11] += b[11];
      a[12] += b[12];
      a[13] += b[13];
      a[14] += b[14];
      a[15] += b[15];
      return this;
    }


    /**
     * Adds the given scalar to each component of `this`
     * @method selfAddScalar
     * @chainable
     * @param {Number} scalar The scalar to add
     * @return {Mat4} Reference to `this` for chaining.
     */
    selfAddScalar(scalar) {
      var a = this.data;
      a[0] += scalar;
      a[1] += scalar;
      a[2] += scalar;
      a[3] += scalar;
      a[4] += scalar;
      a[5] += scalar;
      a[6] += scalar;
      a[7] += scalar;
      a[8] += scalar;
      a[9] += scalar;
      a[10] += scalar;
      a[11] += scalar;
      a[12] += scalar;
      a[13] += scalar;
      a[14] += scalar;
      a[15] += scalar;
      return this;
    }

    /**
     * Subtracts the given matrix from `this`
     * @method selfSubtract
     * @chainable
     * @param {Mat4} other The matrix to subtract
     * @return {Mat4} Reference to `this` for chaining.
     */
    selfSubtract(other) {
      var a = this.data;
      var b = other.data;
      a[0] -= b[0];
      a[1] -= b[1];
      a[2] -= b[2];
      a[3] -= b[3];
      a[4] -= b[4];
      a[5] -= b[5];
      a[6] -= b[6];
      a[7] -= b[7];
      a[8] -= b[8];
      a[9] -= b[9];
      a[10] -= b[10];
      a[11] -= b[11];
      a[12] -= b[12];
      a[13] -= b[13];
      a[14] -= b[14];
      a[15] -= b[15];
      return this;
    }


    /**
     * Subtracts the given scalar from each component of `this`
     * @method selfSubtractScalar
     * @chainable
     * @param {Number} scalar The scalar to subtract
     * @return {Mat4} Reference to `this` for chaining.
     */
    selfSubtractScalar(scalar) {
      var a = this.data;
      a[0] -= scalar;
      a[1] -= scalar;
      a[2] -= scalar;
      a[3] -= scalar;
      a[4] -= scalar;
      a[5] -= scalar;
      a[6] -= scalar;
      a[7] -= scalar;
      a[8] -= scalar;
      a[9] -= scalar;
      a[10] -= scalar;
      a[11] -= scalar;
      a[12] -= scalar;
      a[13] -= scalar;
      a[14] -= scalar;
      a[15] -= scalar;
      return this;
    }


    /**
     * Multiplies the given matrix with this
     * @method selfMultiply
     * @chainable
     * @param {Mat4} other The matrix to multiply
     * @return {Mat4} Reference to `this` for chaining.
     */
    selfMultiply(other) {
      var a = other.data;
      var b = this.data;
      var c = this.data;

      var a_0 = a[0];
      var a_1 = a[1];
      var a_2 = a[2];
      var a_3 = a[3];
      var a_4 = a[4];
      var a_5 = a[5];
      var a_6 = a[6];
      var a_7 = a[7];
      var a_8 = a[8];
      var a_9 = a[9];
      var a10 = a[10];
      var a11 = a[11];
      var a12 = a[12];
      var a13 = a[13];
      var a14 = a[14];
      var a15 = a[15];

      var b_0 = b[0];
      var b_1 = b[1];
      var b_2 = b[2];
      var b_3 = b[3];
      var b_4 = b[4];
      var b_5 = b[5];
      var b_6 = b[6];
      var b_7 = b[7];
      var b_8 = b[8];
      var b_9 = b[9];
      var b10 = b[10];
      var b11 = b[11];
      var b12 = b[12];
      var b13 = b[13];
      var b14 = b[14];
      var b15 = b[15];

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


    /**
     * Concatenates the given matrix to this
     * @method selfConcat
     * @chainable
     * @param {Mat4} other The matrix to concatenate
     * @return {Mat4} Reference to `this` for chaining.
     */
    selfConcat(other) {
      var a = this.data;
      var b = other.data;
      var c = this.data;

      var a_0 = a[0];
      var a_1 = a[1];
      var a_2 = a[2];
      var a_3 = a[3];
      var a_4 = a[4];
      var a_5 = a[5];
      var a_6 = a[6];
      var a_7 = a[7];
      var a_8 = a[8];
      var a_9 = a[9];
      var a10 = a[10];
      var a11 = a[11];
      var a12 = a[12];
      var a13 = a[13];
      var a14 = a[14];
      var a15 = a[15];

      var b_0 = b[0];
      var b_1 = b[1];
      var b_2 = b[2];
      var b_3 = b[3];
      var b_4 = b[4];
      var b_5 = b[5];
      var b_6 = b[6];
      var b_7 = b[7];
      var b_8 = b[8];
      var b_9 = b[9];
      var b10 = b[10];
      var b11 = b[11];
      var b12 = b[12];
      var b13 = b[13];
      var b14 = b[14];
      var b15 = b[15];

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


    /**
     * Multiplies each component of `this` with given scalar
     * @method selfMultiplyScalar
     * @chainable
     * @param {Number} scalar The scalar to multiply
     * @return {Mat4} Reference to `this` for chaining.
     */
    selfMultiplyScalar(scalar) {
      var a = this.data;
      a[0] *= scalar;
      a[1] *= scalar;
      a[2] *= scalar;
      a[3] *= scalar;
      a[4] *= scalar;
      a[5] *= scalar;
      a[6] *= scalar;
      a[7] *= scalar;
      a[8] *= scalar;
      a[9] *= scalar;
      a[10] *= scalar;
      a[11] *= scalar;
      a[12] *= scalar;
      a[13] *= scalar;
      a[14] *= scalar;
      a[15] *= scalar;
      return this;
    }


    /**
     * Divides each matching component pair
     * @method selfDivide
     * @chainable
     * @param {Mat4} other The matrix by which to divide
     * @return {Mat4} Reference to `this` for chaining.
     */
    selfDivide(other) {
      var a = this.data;
      var b = other.data;
      a[0] /= b[0];
      a[1] /= b[1];
      a[2] /= b[2];
      a[3] /= b[3];
      a[4] /= b[4];
      a[5] /= b[5];
      a[6] /= b[6];
      a[7] /= b[7];
      a[8] /= b[8];
      a[9] /= b[9];
      a[10] /= b[10];
      a[11] /= b[11];
      a[12] /= b[12];
      a[13] /= b[13];
      a[14] /= b[14];
      a[15] /= b[15];
      return this;
    }

    /**
     * Divides each component of `this` by given scalar
     * @method selfDivideScalar
     * @chainable
     * @param {Number} scalar The scalar by which to divide
     * @return {Mat4} Reference to `this` for chaining.
     */
    selfDivideScalar(scalar) {
      scalar = 1.0 / scalar;
      var a = this.data;
      a[0] *= scalar;
      a[1] *= scalar;
      a[2] *= scalar;
      a[3] *= scalar;
      a[4] *= scalar;
      a[5] *= scalar;
      a[6] *= scalar;
      a[7] *= scalar;
      a[8] *= scalar;
      a[9] *= scalar;
      a[10] *= scalar;
      a[11] *= scalar;
      a[12] *= scalar;
      a[13] *= scalar;
      a[14] *= scalar;
      a[15] *= scalar;
      return this;
    }

    /**
     * Transform the given vector with this matrix.
     * @method transform
     * @param {Vec2|Vec3|Vec4} vec
     * @return {Vec2|Vec3|Vec4} the given vector
     */
    transform(vec) {
      var x = vec.x || 0;
      var y = vec.y || 0;
      var z = vec.z || 0;
      var w = vec.w != null ? vec.w : 1;
      var d = this.data;
      vec.x = x * d[0] + y * d[4] + z * d[8] + w * d[12];
      vec.y = x * d[1] + y * d[5] + z * d[9] + w * d[13];
      if (vec.z != null) {
        vec.z = x * d[2] + y * d[6] + z * d[10] + w * d[14];
        if (vec.w != null) {
          vec.w = x * d[3] + y * d[7] + z * d[11] + w * d[15];
        }
      }
      return vec;
    }


    /**
     * Rotates and scales the given vector with this matrix.
     * @method transformNormal
     * @param {Vec2|Vec3|Vec4} vec
     * @return {Vec2|Vec3|Vec4} the given vector
     */
    transformNormal(vec) {
      var x = vec.x || 0;
      var y = vec.y || 0;
      var z = vec.z || 0;
      var d = this.data;
      vec.x = x * d[0] + y * d[4] + z * d[8];
      vec.y = x * d[1] + y * d[5] + z * d[9];
      if (vec.z != null) {
        vec.z = x * d[2] + y * d[6] + z * d[10];
      }
      return vec;
    }

    /**
     * Transforms the given buffer with `this` matrix.
     * @method transformV2Buffer
     * @param {Array|Float32Array} buffer
     * @param {Number} [offset=0]
     * @param {Number} [stride=2]
     * @param {Number} [count=buffer.length]
     */
    transformV2Buffer(buffer, offset?:number, stride?:number, count?:number) {
      var x, y, d = this.data;
      offset = offset || 0;
      stride = stride === undefined ? 2 : stride;
      count = count === undefined ? buffer.length / stride : count;

      while (count > 0) {
        x = buffer[offset];
        y = buffer[offset + 1];
        buffer[offset] = x * d[0] + y * d[4] + d[8] + d[12];
        buffer[offset + 1] = x * d[1] + y * d[5] + d[9] + d[13];
        offset += stride;
      }
    }

    /**
     * Transforms the given buffer with `this` matrix.
     * @method transformV3Buffer
     * @param {Array|Float32Array} buffer
     * @param {Number} [offset=0]
     * @param {Number} [stride=3]
     * @param {Number} [count=buffer.length]
     */
    transformV3Buffer(buffer:NumbersArray, offset?:number, stride?:number, count?:number) {
      var x, y, z, d = this.data;
      offset = offset || 0;
      stride = stride === undefined ? 3 : stride;
      count = count === undefined ? buffer.length / stride : count;

      while (count > 0) {
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
     * @param {Array|Float32Array} buffer
     * @param {Number} [offset=0]
     * @param {Number} [stride=4]
     * @param {Number} [count=buffer.length]
     */
    transformV4Buffer(buffer:NumbersArray, offset?:number, stride?:number, count?:number) {
      var x, y, z, w, d = this.data;
      offset = offset || 0;
      stride = stride === undefined ? 4 : stride;
      count = count === undefined ? buffer.length / stride : count;

      while (count > 0) {
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
     * @method transformNormalBuffer
     * @param {Array|Float32Array} buffer
     * @param {Number} [offset=0]
     * @param {Number} [stride=3]
     * @param {Number} [count=buffer.length]
     */
    transformNormalBuffer(buffer:NumbersArray, offset?:number, stride?:number, count?:number) {
      var x, y, z, d = this.data;
      offset = offset || 0;
      stride = stride === undefined ? 3 : stride;
      count = count === undefined ? buffer.length / stride : count;

      while (count > 0) {
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
     * @static
     * @method transpose
     * @param {Mat4} mat The matrix to transpose
     * @param {Mat4} [out] The matrix to write to
     * @return {Mat4} The given `out` parameter or a new matrix
     */
    static transpose(mat, out) {
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
     * @static
     * @method invert
     * @param {Mat4} mat The matrix to transpose
     * @param {Mat4} [out] The matrix to write to
     * @return {Mat4} The given `out` parameter or a new matrix
     */
    static invert(mat, out) {
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
     * @static
     * @method negate
     * @param {Mat4} mat The matrix to transpose
     * @param {Mat4} [out] The matrix to write to
     * @return {Mat4} The given `out` parameter or a new matrix
     */
    static negate(mat, out) {
      out = out || new Mat4();
      var d = mat.data;
      var o = out.data;
      o[0] = -d[0];
      o[1] = -d[1];
      o[2] = -d[2];
      o[3] = -d[3];
      o[4] = -d[4];
      o[5] = -d[5];
      o[6] = -d[6];
      o[7] = -d[7];
      o[8] = -d[8];
      o[9] = -d[9];
      o[10] = -d[10];
      o[11] = -d[11];
      o[12] = -d[12];
      o[13] = -d[13];
      o[14] = -d[14];
      o[15] = -d[15];
      return out;
    }


    /**
     * Adds a matrix to another
     * @static
     * @method add
     * @param {Mat4} matA The first matrix
     * @param {Mat4} matB The second matrix
     * @param {Mat4} [out] The matrix to write to
     * @return {Mat4} The given `out` parameter or a new matrix
     */
    static add(matA, matB, out) {
      out = out || new Mat4();
      var a = matA.data;
      var b = matB.data;
      var c = out.data;
      c[0] = a[0] + b[0];
      c[1] = a[1] + b[1];
      c[2] = a[2] + b[2];
      c[3] = a[3] + b[3];
      c[4] = a[4] + b[4];
      c[5] = a[5] + b[5];
      c[6] = a[6] + b[6];
      c[7] = a[7] + b[7];
      c[8] = a[8] + b[8];
      c[9] = a[9] + b[9];
      c[10] = a[10] + b[10];
      c[11] = a[11] + b[11];
      c[12] = a[12] + b[12];
      c[13] = a[13] + b[13];
      c[14] = a[14] + b[14];
      c[15] = a[15] + b[15];
      return out;
    }


    /**
     * Adds a scalar to each component of a matrix
     * @static
     * @method addScalar
     * @param {Mat4} mat The matrix
     * @param {Number} scalar The scalar to add
     * @param {Mat4} [out] The matrix to write to
     * @return {Mat4} The given `out` parameter or a new matrix
     */
    static addScalar(mat, scalar, out) {
      out = out || new Mat4();
      var a = mat.data;
      var c = out.data;
      c[0] = a[0] + scalar;
      c[1] = a[1] + scalar;
      c[2] = a[2] + scalar;
      c[3] = a[3] + scalar;
      c[4] = a[4] + scalar;
      c[5] = a[5] + scalar;
      c[6] = a[6] + scalar;
      c[7] = a[7] + scalar;
      c[8] = a[8] + scalar;
      c[9] = a[9] + scalar;
      c[10] = a[10] + scalar;
      c[11] = a[11] + scalar;
      c[12] = a[12] + scalar;
      c[13] = a[13] + scalar;
      c[14] = a[14] + scalar;
      c[15] = a[15] + scalar;
      return out;
    }


    /**
     * Subtracts the second matrix from the first
     * @static
     * @method subtract
     * @param {Mat4} matA The first matrix
     * @param {Mat4} matB The second matrix
     * @param {Mat4} [out] The matrix to write to
     * @return {Mat4} The given `out` parameter or a new matrix
     */
    static subtract(matA, matB, out) {
      out = out || new Mat4();
      var a = matA.data;
      var b = matB.data;
      var c = out.data;
      c[0] = a[0] - b[0];
      c[1] = a[1] - b[1];
      c[2] = a[2] - b[2];
      c[3] = a[3] - b[3];
      c[4] = a[4] - b[4];
      c[5] = a[5] - b[5];
      c[6] = a[6] - b[6];
      c[7] = a[7] - b[7];
      c[8] = a[8] - b[8];
      c[9] = a[9] - b[9];
      c[10] = a[10] - b[10];
      c[11] = a[11] - b[11];
      c[12] = a[12] - b[12];
      c[13] = a[13] - b[13];
      c[14] = a[14] - b[14];
      c[15] = a[15] - b[15];
      return out;
    }


    /**
     * Subtracts a scalar from each somponent of a matrix
     * @static
     * @method subtractScalar
     * @param {Mat4} mat The matrix to subtract from
     * @param {Number} scalar The scalar to subtract
     * @param {Mat4} [out] The matrix to write to
     * @return {Mat4} The given `out` parameter or a new matrix
     */
    static subtractScalar(mat, scalar, out) {
      out = out || new Mat4();
      var a = mat.data;
      var c = out.data;
      c[0] = a[0] - scalar;
      c[1] = a[1] - scalar;
      c[2] = a[2] - scalar;
      c[3] = a[3] - scalar;
      c[4] = a[4] - scalar;
      c[5] = a[5] - scalar;
      c[6] = a[6] - scalar;
      c[7] = a[7] - scalar;
      c[8] = a[8] - scalar;
      c[9] = a[9] - scalar;
      c[10] = a[10] - scalar;
      c[11] = a[11] - scalar;
      c[12] = a[12] - scalar;
      c[13] = a[13] - scalar;
      c[14] = a[14] - scalar;
      c[15] = a[15] - scalar;
      return out;
    }


    /**
     * Multiplies a matrix by another matrix
     * @static
     * @method multiply
     * @param {Mat4} matA The first matrix
     * @param {Mat4} matB The second matrix
     * @param {Mat4} [out] The matrix to write to
     * @return {Mat4} The given `out` parameter or a new matrix
     */
    static multiply(matA, matB, out) {
      out = out || new Mat4();
      var a = matB.data;
      var b = matA.data;
      var c = out.data;

      var a_0 = a[0];
      var a_1 = a[1];
      var a_2 = a[2];
      var a_3 = a[3];
      var a_4 = a[4];
      var a_5 = a[5];
      var a_6 = a[6];
      var a_7 = a[7];
      var a_8 = a[8];
      var a_9 = a[9];
      var a10 = a[10];
      var a11 = a[11];
      var a12 = a[12];
      var a13 = a[13];
      var a14 = a[14];
      var a15 = a[15];

      var b_0 = b[0];
      var b_1 = b[1];
      var b_2 = b[2];
      var b_3 = b[3];
      var b_4 = b[4];
      var b_5 = b[5];
      var b_6 = b[6];
      var b_7 = b[7];
      var b_8 = b[8];
      var b_9 = b[9];
      var b10 = b[10];
      var b11 = b[11];
      var b12 = b[12];
      var b13 = b[13];
      var b14 = b[14];
      var b15 = b[15];

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
     * Multiplies a matrix by another matrix
     * @static
     * @method concat
     * @param {Mat4} matA The first matrix
     * @param {Mat4} matB The second matrix
     * @param {Mat4} [out] The matrix to write to
     * @return {Mat4} The given `out` parameter or a new matrix
     */
    static concat(matA, matB, out) {
      out = out || new Mat4();
      var a = matA.data;
      var b = matB.data;
      var c = out.data;

      var a_0 = a[0];
      var a_1 = a[1];
      var a_2 = a[2];
      var a_3 = a[3];
      var a_4 = a[4];
      var a_5 = a[5];
      var a_6 = a[6];
      var a_7 = a[7];
      var a_8 = a[8];
      var a_9 = a[9];
      var a10 = a[10];
      var a11 = a[11];
      var a12 = a[12];
      var a13 = a[13];
      var a14 = a[14];
      var a15 = a[15];

      var b_0 = b[0];
      var b_1 = b[1];
      var b_2 = b[2];
      var b_3 = b[3];
      var b_4 = b[4];
      var b_5 = b[5];
      var b_6 = b[6];
      var b_7 = b[7];
      var b_8 = b[8];
      var b_9 = b[9];
      var b10 = b[10];
      var b11 = b[11];
      var b12 = b[12];
      var b13 = b[13];
      var b14 = b[14];
      var b15 = b[15];

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

    /**
     * Multiplies a chain of matrices
     * @static
     * @method concatChain
     * @return {Mat4} The result of the multiplication
     */
    static concatChain() {
      var i, result = arguments[0].clone();
      for (i = 1; i < arguments.length; i += 1) {
        Mat4.concat(arguments[i], result, result);
      }
      return result;
    }

    /**
     * Multiplies a chain of matrices
     * @static
     * @method multiplyChain
     * @return {Mat4} The result of the multiplication
     */
    static multiplyChain() {
      var i, result = arguments[0].clone();
      for (i = 1; i < arguments.length; i += 1) {
        Mat4.multiply(arguments[i], result, result);
      }
      return result;
    }

    /**
     * Multiplies a matrix with a scalar value
     * @static
     * @method multiplyScalar
     * @param {Mat4} matA The matrix
     * @param {Number} scalar The scalar to multiply
     * @param {Mat4} [out] The matrix to write to
     * @return {Mat4} The given `out` parameter or a new matrix
     */
    static multiplyScalar(matA, scalar, out) {
      out = out || new Mat4();
      var a = matA.data;
      var c = out.data;
      c[0] = a[0] * scalar;
      c[1] = a[1] * scalar;
      c[2] = a[2] * scalar;
      c[3] = a[3] * scalar;
      c[4] = a[4] * scalar;
      c[5] = a[5] * scalar;
      c[6] = a[6] * scalar;
      c[7] = a[7] * scalar;
      c[8] = a[8] * scalar;
      c[9] = a[9] * scalar;
      c[10] = a[10] * scalar;
      c[11] = a[11] * scalar;
      c[12] = a[12] * scalar;
      c[13] = a[13] * scalar;
      c[14] = a[14] * scalar;
      c[15] = a[15] * scalar;
      return out;
    }


    /**
     * Divides the components of the first matrix by the components of the second matrix
     * @static
     * @method divide
     * @param {Mat4} matA The first matrix
     * @param {Mat4} matB The second matrix
     * @param {Mat4} [out] The matrix to write to
     * @return {Mat4} The given `out` parameter or a new matrix
     */
    static divide(matA, matB, out) {
      out = out || new Mat4();
      var a = matA.data;
      var b = matB.data;
      var c = out.data;
      c[0] = a[0] / b[0];
      c[1] = a[1] / b[1];
      c[2] = a[2] / b[2];
      c[3] = a[3] / b[3];
      c[4] = a[4] / b[4];
      c[5] = a[5] / b[5];
      c[6] = a[6] / b[6];
      c[7] = a[7] / b[7];
      c[8] = a[8] / b[8];
      c[9] = a[9] / b[9];
      c[10] = a[10] / b[10];
      c[11] = a[11] / b[11];
      c[12] = a[12] / b[12];
      c[13] = a[13] / b[13];
      c[14] = a[14] / b[14];
      c[15] = a[15] / b[15];
      return out;
    }

    /**
     * Divides the components of a matrix by a scalar
     * @static
     * @method divideScalar
     * @param {Mat4} matA The matrix
     * @param {Number} scalar The scalar by which to divide
     * @param {Mat4} [out] The matrix to write to
     * @return {Mat4} The given `out` parameter or a new matrix
     */
    static divideScalar(matA, scalar, out) {
      out = out || new Mat4();
      var a = matA.data;
      var c = out.data;
      scalar = 1 / scalar;
      c[0] = a[0] * scalar;
      c[1] = a[1] * scalar;
      c[2] = a[2] * scalar;
      c[3] = a[3] * scalar;
      c[4] = a[4] * scalar;
      c[5] = a[5] * scalar;
      c[6] = a[6] * scalar;
      c[7] = a[7] * scalar;
      c[8] = a[8] * scalar;
      c[9] = a[9] * scalar;
      c[10] = a[10] * scalar;
      c[11] = a[11] * scalar;
      c[12] = a[12] * scalar;
      c[13] = a[13] * scalar;
      c[14] = a[14] * scalar;
      c[15] = a[15] * scalar;
      return out;
    }

    /**
     * Performs a linear interpolation between two matrices
     * @static
     * @method lerp
     * @param {Mat4} matA The first matrix
     * @param {Mat4} matB The second matrix
     * @param {Number} t The interpolation value. This is assumed to be in [0:1] range
     * @param {Mat4} [out] The matrix to write to
     * @return {Mat4} The given `out` parameter or a new matrix
     */
    static lerp(matA, matB, t, out) {
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
     * @static
     * @method zero
     * @return {Mat4} a new matrix
     */
    static zero() {
      return new Mat4();
    }

    /**
     * Creates a new matrix that is initialized to identity
     * @static
     * @method identity
     * @return {Mat4} a new matrix
     */
    static identity() {
      var out = new Mat4();
      var d = out.data;
      d[0] = d[5] = d[10] = d[15] = 1;
      return out;
    }

    /**
     * Creates a new matrix. This method should be called with 16 or 0 arguments. If less than 16 but more than 0 arguments
     * are given some components are going to be undefined. The arguments are expected to be in column major order.
     * @static
     * @method create
     * @param [m0]
     * @param [m1]
     * @param [m2]
     * @param [m3]
     * @param [m4]
     * @param [m5]
     * @param [m6]
     * @param [m7]
     * @param [m8]
     * @param [m9]
     * @param [m10]
     * @param [m11]
     * @param [m12]
     * @param [m13]
     * @param [m14]
     * @param [m15]
     * @return {Mat4} a new matrix
     */
    static create(m0, m1, m2, m3, m4, m5, m6, m7, m8, m9, m10, m11, m12, m13, m14, m15) {
      var out = new Mat4();
      var d = out.data;
      if (m0 !== undefined) {
        d[0] = m0;
        d[1] = m1;
        d[2] = m2;
        d[3] = m3;
        d[4] = m4;
        d[5] = m5;
        d[6] = m6;
        d[7] = m7;
        d[8] = m8;
        d[9] = m9;
        d[10] = m10;
        d[11] = m11;
        d[12] = m12;
        d[13] = m13;
        d[14] = m14;
        d[15] = m15;
      }
      return out;
    }

    /**
     * Creates a new matrix. The arguments are expected to be in row major order.
     * @static
     * @method createRowMajor
     * @param m0
     * @param m4
     * @param m8
     * @param m12
     * @param m1
     * @param m5
     * @param m9
     * @param m13
     * @param m2
     * @param m6
     * @param m10
     * @param m14
     * @param m3
     * @param m7
     * @param m11
     * @param m15
     * @return {Mat4} a new matrix
     */
    static createRowMajor(m0, m4, m8, m12, m1, m5, m9, m13, m2, m6, m10, m14, m3, m7, m11, m15) {
      var out = new Mat4();
      var d = out.data;
      d[0] = m0;
      d[1] = m1;
      d[2] = m2;
      d[3] = m3;
      d[4] = m4;
      d[5] = m5;
      d[6] = m6;
      d[7] = m7;
      d[8] = m8;
      d[9] = m9;
      d[10] = m10;
      d[11] = m11;
      d[12] = m12;
      d[13] = m13;
      d[14] = m14;
      d[15] = m15;
      return out;
    }

    /**
     * @static
     * @method createScale
     * @param x
     * @param y
     * @param z
     * @return {Mat4} a new matrix
     */
    static createScale(x, y, z) {
      return new Mat4().initScale(x, y, z);
    }

    /**
     * @static
     * @method createTranslation
     * @param x
     * @param y
     * @param z
     * @return {Mat4} a new matrix
     */
    static createTranslation(x, y, z) {
      return new Mat4().initTranslation(x, y, z);
    }

    /**
     * @static
     * @method createLookAt
     * @param pos
     * @param lookAt
     * @param up
     * @return {Mat4} a new matrix
     */
    static createLookAt(pos, lookAt, up) {
      return new Mat4().initLookAt(pos, lookAt, up);
    }

    /**
     * @static
     * @method createWorld
     * @param position
     * @param forward
     * @param up
     * @return {Mat4} a new matrix
     */
    static createWorld(position, forward, up) {
      return new Mat4().initWorld(position, forward, up);
    }

    /**
     * @static
     * @method createPerspectiveFieldOfView
     * @param fov
     * @param aspec
     * @param near
     * @param far
     * @return {Mat4} a new matrix
     */
    static createPerspectiveFieldOfView(fov, aspec, near, far) {
      return new Mat4().initPerspectiveFieldOfView(fov, aspec, near, far);
    }

    /**
     * @static
     * @method createPerspective
     * @param width
     * @param height
     * @param near
     * @param far
     * @return {Mat4} a new matrix
     */
    static createPerspective(width, height, near, far) {
      return new Mat4().initPerspective(width, height, near, far);
    }

    /**
     * @static
     * @method createPerspectiveOffCenter
     * @param left
     * @param right
     * @param bottom
     * @param top
     * @param near
     * @param far
     * @return {Mat4} a new matrix
     */
    static createPerspectiveOffCenter(left, right, bottom, top, near, far) {
      return new Mat4().initPerspectiveOffCenter(left, right, bottom, top, near, far);
    }

    /**
     * @static
     * @method createOrthographic
     * @param width
     * @param height
     * @param near
     * @param far
     * @return {Mat4} a new matrix
     */
    static createOrthographic(width, height, near, far) {
      return new Mat4().initOrthographic(width, height, near, far);
    }

    /**
     * @static
     * @method createOrthographicOffCenter
     * @param left
     * @param right
     * @param bottom
     * @param top
     * @param near
     * @param far
     * @return {Mat4} a new matrix
     */
    static createOrthographicOffCenter(left, right, bottom, top, near, far) {
      return new Mat4().initOrthographicOffCenter(left, right, bottom, top, near, far);
    }

    /**
     * @static
     * @method createRotationX
     * @param rad
     * @return {Mat4} a new matrix
     */
    static createRotationX(rad) {
      return new Mat4().initRotationX(rad);
    }

    /**
     * @static
     * @method createRotationY
     * @param rad
     * @return {Mat4} a new matrix
     */
    static createRotationY(rad) {
      return new Mat4().initRotationY(rad);
    }

    /**
     * @static
     * @method createRotationZ
     * @param rad
     * @return {Mat4} a new matrix
     */
    static createRotationZ(rad) {
      return new Mat4().initRotationZ(rad);
    }

    /**
     * @static
     * @method createAxisAngle
     * @param axis
     * @param angle
     * @return {Mat4} a new matrix
     */
    static createAxisAngle(axis, angle) {
      return new Mat4().initAxisAngle(axis, angle);
    }

    /**
     * @static
     * @method createYawPitchRoll
     * @param yaw
     * @param pitch
     * @param roll
     * @return {Mat4} a new matrix
     */
    static createYawPitchRoll(yaw, pitch, roll) {
      return new Mat4().initYawPitchRoll(yaw, pitch, roll);
    }

    /**
     * @static
     * @method prettyString
     * @param mat
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
