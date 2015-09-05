module Glib {

  /**
   * Describes a quaternion.
   */
  export class Quat implements IVec2, IVec3, IVec4 {

    /**
     * @constructor
     * @param {number} x value for X component
     * @param {number} y value for Y component
     * @param {number} z value for Z component
     * @param {number} w value for W component
     */
    constructor(public x?:number, public y?:number, public z?:number, public w?:number) {

    }

    /**
     * Initializes components of the quaternion with given values.
     * @param {number} x value for X component
     * @param {number} y value for Y component
     * @param {number} z value for Z component
     * @param {number} w value for W component
     * @return {Quat} Reference to `this` for chaining.
     */
    init(x:number, y:number, z:number, w:number):Quat {
      this.x = x;
      this.y = y;
      this.z = z;
      this.w = w;
      return this;
    }

    /**
     * Initializes the quaternion with `x`, `y` and `z` components set to `0` and `w` component set to `1`.
     * @method initIdentity
     * @return {Quat} Reference to `this` for chaining.
     */
    initIdentity():Quat {
      this.x = 0;
      this.y = 0;
      this.z = 0;
      this.w = 1;
      return this;
    }

    /**
     * Initializes the quaternion with all components set to `0`.
     * @method initZero
     * @return {Quat} Reference to `this` for chaining.
     */
    initZero():Quat {
      this.x = 0;
      this.y = 0;
      this.z = 0;
      this.w = 0;
      return this;
    }

    /**
     * Initializes the components of this quaternion by taking the components from the given quaternion or vector.
     * @method initFrom
     * @param {Quat|Vec4} other
     * @return {Quat} Reference to `this` for chaining.
     */
    initFrom(other:IVec4):Quat {
      this.x = other.x;
      this.y = other.y;
      this.z = other.z;
      this.w = other.w;
      return this;
    }

    /**
     * Initializes the components of this quaternion by taking values from the given array in successive order.
     * @chainable
     * @method initFromBuffer
     * @param {Array} buffer The array to read from
     * @param {Number} [offset=0] The zero based index at which start reading the values
     * @return {Quat} Reference to `this` for chaining.
     */
    initFromBuffer(buffer:NumbersArray, offset?:number):Quat {
      offset = offset || 0;
      this.x = buffer[offset];
      this.y = buffer[offset + 1];
      this.z = buffer[offset + 2];
      this.w = buffer[offset + 3];
      return this;
    }

    /**
     * Initializes the quaternion from axis and an angle.
     * @method initAxisAngle
     * @param {Vec3} axis The axis as vector
     * @param {number} angle The angle in degrees
     * @return {Quat} Reference to `this` for chaining.
     */
    initAxisAngle(axis:IVec3, angle:number):Quat {
      var halfAngle = angle * 0.5;
      var scale = Math.sin(halfAngle);
      this.x = axis.x * scale;
      this.y = axis.y * scale;
      this.z = axis.z * scale;
      this.w = Math.cos(halfAngle);
      return this;
    }

    /**
     * Initializes the quaternion from yaw pitch and roll angles.
     * @method initYawPitchRoll
     * @param {number} yaw The yaw angle in radians
     * @param {number} pitch The pitch angle in radians
     * @param {number} roll The roll angle in radians
     * @return {Quat} Reference to `this` for chaining.
     */
    initYawPitchRoll(yaw:number, pitch:number, roll:number):Quat {
      var xHalf = pitch * 0.5;
      var xSin = Math.sin(xHalf);
      var xCos = Math.cos(xHalf);

      var yHalf = yaw * 0.5;
      var ySin = Math.sin(yHalf);
      var yCos = Math.cos(yHalf);

      var zHalf = roll * 0.5;
      var zSin = Math.sin(zHalf);
      var zCos = Math.cos(zHalf);

      this.x = yCos * xSin * zCos + ySin * xCos * zSin;
      this.y = ySin * xCos * zCos - yCos * xSin * zSin;
      this.z = yCos * xCos * zSin - ySin * xSin * zCos;
      this.w = yCos * xCos * zCos + ySin * xSin * zSin;
      return this;
    }

    /**
     * Creates a copy of this quaternion
     * @method clone
     * @return {Quat} The cloned quaternion
     */
    clone():Quat {
      return new Quat(this.x, this.y, this.z, this.w);
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
      buffer[offset] = this.x;
      buffer[offset + 1] = this.y;
      buffer[offset + 2] = this.z;
      buffer[offset + 3] = this.w;
    }

    /**
     * Returns an array filled with the values of the components of this quaternion
     * @method dump
     * @return {Array}
     */
    dump():number[] {
      return [this.x, this.y, this.z, this.w];
    }

    /**
     * Checks for component wise equality with given quaternion
     * @method equals
     * @param {Quat|Vec4} other The quaternion to compare with
     * @return {Boolean} true if components are equal, false otherwise
     */
    equals(other:IVec4):boolean {
      return ((this.x === other.x) && (this.y === other.y) && (this.z === other.z) && (this.w === other.w));
    }

    /**
     * Calculates the length of this quaternion
     * @method length
     * @return {Number} The length.
     */
    length():number {
      var x = this.x;
      var y = this.y;
      var z = this.z;
      var w = this.w;
      return Math.sqrt(x * x + y * y + z * z + w * w);
    }

    /**
     * Calculates the squared length of this quaternion
     * @method lengthSquared
     * @return {Number} The squared length.
     */
    lengthSquared():number {
      var x = this.x;
      var y = this.y;
      var z = this.z;
      var w = this.w;
      return x * x + y * y + z * z + w * w;
    }

    /**
     * Calculates the dot product with the given quaternion
     * @method dot
     * @param {Quat} other
     * @return {Number} The dot product.
     */
    dot(other:IVec4):number {
      return this.x * other.x + this.y * other.y + this.z * other.z + this.w * other.w;
    }

    /**
     * Negates the components of `this`
     * @method selfNegate
     * @return {Quat} Reference to `this` for chaining.
     */
    selfNegate():Quat {
      this.x = -this.x;
      this.y = -this.y;
      this.z = -this.z;
      this.w = -this.w;
      return this;
    }

    /**
     * Negates the `x`, `y` and `z` components of `this`
     * @method selfConjugate
     * @return {Quat} Reference to `this` for chaining.
     */
    selfConjugate():Quat {
      this.x = -this.x;
      this.y = -this.y;
      this.z = -this.z;
      return this;
    }

    /**
     * Normalizes `this` so that `length` should be `1`
     * @method selfNormalize
     * @return {Quat} Reference to `this` for chaining.
     */
    selfNormalize():Quat {
      var x = this.x;
      var y = this.y;
      var z = this.z;
      var w = this.w;
      var d = 1.0 / Math.sqrt(x * x + y * y + z * z + w * w);
      this.x = x * d;
      this.y = y * d;
      this.z = z * d;
      this.w = w * d;
      return this;
    }

    /**
     * Inverts `this` so that multiplication with the original would return the identity quaternion.
     * @method selfInvert
     * @return {Quat} Reference to `this` for chaining.
     */
    selfInvert():Quat {
      var x = this.x;
      var y = this.y;
      var z = this.z;
      var w = this.w;
      var d = 1.0 / Math.sqrt(x * x + y * y + z * z + w * w);
      this.x = -x * d;
      this.y = -y * d;
      this.z = -z * d;
      this.w = w * d;
      return this;
    }

    /**
     * Performs a component wise addition with `other`
     * @method selfAdd
     * @param {Quat|Vec4} other
     * @return {Quat} Reference to `this` for chaining.
     */
    selfAdd(other:IVec4):Quat {
      this.x += other.x;
      this.y += other.y;
      this.z += other.z;
      this.w += other.w;
      return this;
    }

    /**
     * Performs a component wise subtraction with `other`
     * @method selfSubtract
     * @param {Quat|Vec4} other
     * @return {Quat} Reference to `this` for chaining.
     */
    selfSubtract(other:IVec4):Quat {
      this.x -= other.x;
      this.y -= other.y;
      this.z -= other.z;
      this.w -= other.w;
      return this;
    }

    /**
     * Performs a quaternion multiplication with `other`
     * @method selfMultiply
     * @param {Quat|Vec4} other
     * @return {Quat} Reference to `this` for chaining.
     */
    selfMultiply(other:IVec4):Quat {
      var x1 = this.x;
      var y1 = this.y;
      var z1 = this.z;
      var w1 = this.w;

      var x2 = other.x;
      var y2 = other.y;
      var z2 = other.z;
      var w2 = other.w;

      this.x = x1 * w2 + x2 * w1 + y1 * z2 - z1 * y2;
      this.y = y1 * w2 + y2 * w1 + z1 * x2 - x1 * z2;
      this.z = z1 * w2 + z2 * w1 + x1 * y2 - y1 * x2;
      this.w = w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2;
      return this;
    }

    /**
     * Performs a quaternion concatenation with `other`
     * @method selfConcat
     * @param {Quat} other
     * @return {Quat} Reference to `this` for chaining.
     */
    selfConcat(other:IVec4):Quat {
      var x1 = other.x;
      var y1 = other.y;
      var z1 = other.z;
      var w1 = other.w;

      var x2 = this.x;
      var y2 = this.y;
      var z2 = this.z;
      var w2 = this.w;

      this.x = x1 * w2 + x2 * w1 + y1 * z2 - z1 * y2;
      this.y = y1 * w2 + y2 * w1 + z1 * x2 - x1 * z2;
      this.z = z1 * w2 + z2 * w1 + x1 * y2 - y1 * x2;
      this.w = w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2;
      return this;
    }

    /**
     * Performs a division with `other`
     * @method selfDivide
     * @param {Quat} other
     * @return {Quat} Reference to `this` for chaining.
     */
    selfDivide(other:IVec4):Quat {
      var x1 = this.x;
      var y1 = this.y;
      var z1 = this.z;
      var w1 = this.w;

      var x2 = other.x;
      var y2 = other.y;
      var z2 = other.z;
      var w2 = other.w;

      // invert
      var s = 1.0 / (x2 * x2 + y2 * y2 + z2 * z2 + w2 * w2);
      x2 = -x2 * s;
      y2 = -y2 * s;
      z2 = -z2 * s;
      w2 = w2 * s;
      // multiply
      this.x = x1 * w2 + x2 * w1 + y1 * z2 - z1 * y2;
      this.y = y1 * w2 + y2 * w1 + z1 * x2 - x1 * z2;
      this.z = z1 * w2 + z2 * w1 + x1 * y2 - y1 * x2;
      this.w = w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2;
      return this;
    }

    /**
     * Rotates the given point or vector with `this`
     * @method transform
     * @param vec
     * @return {Vec3|Vec4}
     */
    transform<T extends IVec3>(vec:T):T {
      var x = this.x;
      var y = this.y;
      var z = this.z;
      var w = this.w;

      var x2 = x + x;
      var y2 = y + y;
      var z2 = z + z;

      var wx2 = w * x2;
      var wy2 = w * y2;
      var wz2 = w * z2;

      var xx2 = x * x2;
      var xy2 = x * y2;
      var xz2 = x * z2;

      var yy2 = y * y2;
      var yz2 = y * z2;
      var zz2 = y * z2;

      var vx = vec.x;
      var vy = vec.y;
      var vz = vec.z;

      vec.x = vx * (1 - yy2 - zz2) + vy * (xy2 - wz2) + vz * (xz2 + wy2);
      vec.y = vx * (xy2 + wz2) + vy * (1 - xx2 - zz2) + vz * (yz2 - wx2);
      vec.z = vx * (xz2 - wy2) + vy * (yz2 + wx2) + vz * (1 - xx2 - yy2);
      return vec;
    }

    /**
     * Creates a new quaternion. The method should be called with four or no arguments. If less than four arguments are given
     * then some components of the resulting quaternion are going to be `undefined`.
     * @static
     * @method create
     * @param {Number} [x] The x component
     * @param {Number} [y] The y component
     * @param {Number} [z] The z component
     * @param {Number} [w] The w component
     * @return {Quat}
     */
    static create(x:number, y:number, z:number, w:number):Quat {
      if (x !== undefined) {
        return new Quat(x, y, z, w);
      }
      return new Quat(0, 0, 0, 0);
    }

    /**
     * Creates a new vector with all components set to 0.
     * @static
     * @method zero
     * @return {Quat} A new quaternion
     */
    static zero():Quat {
      return new Quat(0, 0, 0, 0);
    }

    /**
     * Creates a new vector with `x`, `y` and `z` components set to `0` and `w` component set to `1`.
     * @static
     * @method identity
     * @return {Quat} A new quaternion
     */
    static identity():Quat {
      return new Quat(0, 0, 0, 1);
    }

    /**
     * Creates a new quaternion from given axis vector and an angle
     * @static
     * @method fromAxisAngle
     * @param {Vec3} axis The axis vector
     * @param {number} angle The angle in degree
     * @return {Quat} A new quaternion
     */
    static fromAxisAngle(axis:IVec3, angle:number):Quat {
      return Quat.identity().initAxisAngle(axis, angle);
    }

    /**
     * Creates a new quaternion from given `yaw` `pitch` and `roll` angles
     * @static
     * @method fromYawPitchRoll
     * @param {number} yaw The yaw angle in radians
     * @param {number} pitch The pitch angle in radians
     * @param {number} roll The roll angle in radians
     * @return {Quat}
     */
    static fromYawPitchRoll(yaw:number, pitch:number, roll:number):Quat {
      return Quat.identity().initYawPitchRoll(yaw, pitch, roll);
    }

    /**
     * Negates the given quaternion.
     * @static
     * @method negate
     * @param {Quat} quat The quaternion to negate.
     * @param {Quat} [out] The quaternion to write to.
     * @return {Quat} The given `out` parameter or a new quaternion.
     */
    static negate(quat:IVec4, out?:IVec4):IVec4 {
      out = out || new Quat();
      out.x = -quat.x;
      out.y = -quat.y;
      out.z = -quat.z;
      out.w = -quat.w;
      return out;
    }

    /**
     * Conjugates the given quaternion.
     * @static
     * @method conjugate
     * @param {Quat} quat The quaternion to conjugate.
     * @param {Quat} [out] The quaternion to write to.
     * @return {Quat} The given `out` parameter or a new quaternion.
     */
    static conjugate(quat:IVec4, out?:IVec4):IVec4 {
      out = out || new Quat();
      out.x = -quat.x;
      out.y = -quat.y;
      out.z = -quat.z;
      out.w = quat.w;
      return out;
    }

    /**
     * Normalizes the given quaternion
     * @static
     * @method normalize
     * @param {Quat} quat The quaternion to normalize.
     * @param {Quat} [out] The quaternion to write to.
     * @return {Quat} The given `out` parameter or a new quaternion.
     */
    static normalize(quat:IVec4, out?:IVec4):IVec4 {
      var x = quat.x;
      var y = quat.y;
      var z = quat.z;
      var w = quat.w;
      var d = 1.0 / Math.sqrt(x * x + y * y + z * z + w * w);
      out = out || new Quat();
      out.x = x * d;
      out.y = y * d;
      out.z = z * d;
      out.w = w * d;
      return out;
    }

    /**
     * Inverts the given quaternion
     * @static
     * @method invert
     * @param {Quat} quat The quaternion to invert.
     * @param {Quat} [out] The quaternion to write to.
     * @return {Quat} The given `out` parameter or a new quaternion.
     */
    static invert(quat:IVec4, out?:IVec4):IVec4  {
      var x = quat.x;
      var y = quat.y;
      var z = quat.z;
      var w = quat.w;
      var d = 1.0 / Math.sqrt(x * x + y * y + z * z + w * w);
      out = out || new Quat();
      out.x = -x * d;
      out.y = -y * d;
      out.z = -z * d;
      out.w = w * d;
      return out;
    }

    /**
     * Adds two quaternions
     * @static
     * @method add
     * @param {Quat} quatA The first quaternion
     * @param {Quat} quatB The second quaternion
     * @param {Quat} [out] The quaternion to write to.
     * @return {Quat} The given `out` parameter or a new quaternion.
     */
    static add(quatA:IVec4, quatB:IVec4, out?:IVec4):IVec4 {
      out = out || new Quat();
      out.x = quatA.x + quatB.x;
      out.y = quatA.y + quatB.y;
      out.z = quatA.z + quatB.z;
      out.w = quatA.w + quatB.w;
      return out;
    }

    /**
     * Subtracts the second quaternion from the first.
     * @static
     * @method subtract
     * @param {Quat} quatA The first quaternion
     * @param {Quat} quatB The second quaternion
     * @param {Quat} [out] The quaternion to write to.
     * @return {Quat} The given `out` parameter or a new quaternion.
     */
    static subtract(quatA:IVec4, quatB:IVec4, out?:IVec4):IVec4 {
      out = out || new Quat();
      out.x = quatA.x - quatB.x;
      out.y = quatA.y - quatB.y;
      out.z = quatA.z - quatB.z;
      out.w = quatA.w - quatB.w;
      return out;
    }

    /**
     * Multiplies two quaternions
     * @static
     * @method multiply
     * @param {Quat} quatA The first quaternion
     * @param {Quat} quatB The second quaternion
     * @param {Quat} [out] The quaternion to write to.
     * @return {Quat} The given `out` parameter or a new quaternion.
     */
    static multiply(quatA:IVec4, quatB:IVec4, out?:IVec4):IVec4 {
      var x1 = quatA.x;
      var y1 = quatA.y;
      var z1 = quatA.z;
      var w1 = quatA.w;

      var x2 = quatB.x;
      var y2 = quatB.y;
      var z2 = quatB.z;
      var w2 = quatB.w;

      out = out || new Quat();
      out.x = x1 * w2 + x2 * w1 + y1 * z2 - z1 * y2;
      out.y = y1 * w2 + y2 * w1 + z1 * x2 - x1 * z2;
      out.z = z1 * w2 + z2 * w1 + x1 * y2 - y1 * x2;
      out.w = w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2;
      return out;
    }


    /**
     * Concatenates two quaternions
     * @static
     * @method concat
     * @param {Quat} quatA The first quaternion
     * @param {Quat} quatB The second quaternion
     * @param {Quat} [out] The quaternion to write to.
     * @return {Quat} The given `out` parameter or a new quaternion.
     */
    static concat(quatA:IVec4, quatB:IVec4, out?:IVec4):IVec4 {
      var x1 = quatB.x;
      var y1 = quatB.y;
      var z1 = quatB.z;
      var w1 = quatB.w;

      var x2 = quatA.x;
      var y2 = quatA.y;
      var z2 = quatA.z;
      var w2 = quatA.w;

      out = out || new Quat();
      out.x = x1 * w2 + x2 * w1 + y1 * z2 - z1 * y2;
      out.y = y1 * w2 + y2 * w1 + z1 * x2 - x1 * z2;
      out.z = z1 * w2 + z2 * w1 + x1 * y2 - y1 * x2;
      out.w = w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2;
      return out;
    }

    /**
     * Divides the first quaternion by the second
     * @static
     * @method divide
     * @param {Quat} quatA The first quaternion
     * @param {Quat} quatB The second quaternion
     * @param {Quat} [out] The quaternion to write to.
     * @return {Quat} The given `out` parameter or a new quaternion.
     */
    static divide(quatA:IVec4, quatB:IVec4, out?:IVec4):IVec4 {
      var x1 = quatA.x;
      var y1 = quatA.y;
      var z1 = quatA.z;
      var w1 = quatA.w;

      var x2 = quatB.x;
      var y2 = quatB.y;
      var z2 = quatB.z;
      var w2 = quatB.w;

      // invert
      var s = 1.0 / (x2 * x2 + y2 * y2 + z2 * z2 + w2 * w2);
      x2 = -x2 * s;
      y2 = -y2 * s;
      z2 = -z2 * s;
      w2 = w2 * s;

      // multiply
      out = out || new Quat();
      out.x = x1 * w2 + x2 * w1 + y1 * z2 - z1 * y2;
      out.y = y1 * w2 + y2 * w1 + z1 * x2 - x1 * z2;
      out.z = z1 * w2 + z2 * w1 + x1 * y2 - y1 * x2;
      out.w = w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2;
      return out;
    }

    /**
     * Tries to convert the given `data` into a quaternion
     * @static
     * @method create
     * @param {Array|Quat|Vec4} data
     * @return {Quat} The created quaternion.
     */
    static convert(data:any):Quat {
      if (Array.isArray(data)) {
        return new Quat(
          data[0] || 0,
          data[1] || 0,
          data[2] || 0,
          data[3] || 0
        );
      }
      if (typeof data === 'number') {
        return new Quat(data, data, data, data);
      }
      return new Quat(
        data.x || 0,
        data.y || 0,
        data.z || 0,
        data.w || 0
      );
    }

    /**
     * Rotates a point or vector with given quaternion
     * @static
     * @method transform
     * @param {Quat} q The rotation quaternion
     * @param {Vec3|Vec4} v The point or vector to rotate
     * @param {Vec3|Vec4} [out] The vector to write to
     * @return {Vec3|Vec4} The given `out` parameter or a new vector.
     */
    static transform(q:IVec4, v:IVec3, out?:IVec3):IVec3 {
      var x = q.x;
      var y = q.y;
      var z = q.z;
      var w = q.w;

      var x2 = x + x;
      var y2 = y + y;
      var z2 = z + z;

      var wx2 = w * x2;
      var wy2 = w * y2;
      var wz2 = w * z2;

      var xx2 = x * x2;
      var xy2 = x * y2;
      var xz2 = x * z2;

      var yy2 = y * y2;
      var yz2 = y * z2;
      var zz2 = y * z2;

      var vx = v.x;
      var vy = v.y;
      var vz = v.z;

      out = out || new Vec3();
      out.x = vx * (1 - yy2 - zz2) + vy * (xy2 - wz2) + vz * (xz2 + wy2);
      out.y = vx * (xy2 + wz2) + vy * (1 - xx2 - zz2) + vz * (yz2 - wx2);
      out.z = vx * (xz2 - wy2) + vy * (yz2 + wx2) + vz * (1 - xx2 - yy2);

      return out;
    }
  }
}
