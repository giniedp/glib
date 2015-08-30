module Glib {

  /**
   * Describes a vector with four components.
   *
   * @class Vec4
   * @constructor
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @param {Number} w
   */
  export class Vec4 implements IVec2, IVec3, IVec4 {
    constructor(public x?:number, public y?:number, public z?:number, public w?:number) {
    }

    /**
     * Initializes the components of this vector with given values.
     * @chainable
     * @method init
     * @param {Number} x value for X component
     * @param {Number} y value for Y component
     * @param {Number} z value for Z component
     * @param {Number} w value for W component
     * @return {Vec4} this vector for chaining
     */
    init(x:number, y:number, z:number, w:number):IVec4 {
      this.x = x;
      this.y = y;
      this.z = z;
      this.w = w;
      return this;
    }

    /**
     * Initializes the components of this vector by taking the components from the given vector.
     * @chainable
     * @method initFrom
     * @param {Vec4} other The vector to read from
     * @return {Vec4}
     */
    initFrom(other:IVec4):Vec4 {
      this.x = other.x;
      this.y = other.y;
      this.z = other.z;
      this.w = other.w;
      return this;
    }

    /**
     * Initializes the components of this vector by taking values from the given array in successive order.
     * @chainable
     * @method initFromBuffer
     * @param {Array} buffer The array to read from
     * @param {Number} [offset=0] The zero based index at which start reading the values
     * @return {Vec4}
     */
    initFromBuffer(buffer:NumbersArray, offset?:number):Vec4 {
      offset = offset || 0;
      this.x = buffer[offset];
      this.y = buffer[offset + 1];
      this.z = buffer[offset + 2];
      this.w = buffer[offset + 3];
      return this;
    }

    /**
     * Creates a copy of this vector
     * @method clone
     * @return {Vec4} The cloned vector
     */
    clone():Vec4 {
      return new Vec4(this.x, this.y, this.z, this.w);
    }

    /**
     * Copies the components successively into the given array.
     * @chainable
     * @method copy
     * @param {Array|Float32Array} buffer The array to copy into
     * @param {Number} [offset=0] Zero based index where to start writing in the array
     * @return {Array|Float32Array}
     */
    copyTo(buffer:NumbersArray, offset?:number):NumbersArray {
      offset = offset || 0;
      buffer[offset] = this.x;
      buffer[offset + 1] = this.y;
      buffer[offset + 2] = this.z;
      buffer[offset + 3] = this.w;
      return buffer;
    }

    /**
     * Returns an array filled with the values of the components of this vector
     * @method dump
     * @return {Array}
     */
    dump():number[] {
      return [this.x, this.y, this.z, this.w];
    }

    /**
     * Checks for component wise equality with given vector
     * @method equals
     * @param {Vec4} other The vector to compare with
     * @return {Boolean} true if components are equal, false otherwise
     */
    equals(other:IVec4):boolean {
      return ((this.x === other.x) && (this.y === other.y) && (this.z === other.z) && (this.w === other.w));
    }

    /**
     * Calculates the length of this vector
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
     * Calculates the squared length of this vector
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
     * Calculates the distance to the given vector
     * @method distance
     * @param {Vec4} other The distant vector
     * @return {Number} The distance between the vectors.
     */
    distance(other:IVec4):number {
      var x = this.x - other.x;
      var y = this.y - other.y;
      var z = this.z - other.z;
      var w = this.w - other.w;
      return Math.sqrt(x * x + y * y + z * z + w * w);
    }

    /**
     * Calculates the squared distance to the given vector
     * @method distanceSquared
     * @param {Vec4} other The distant vector
     * @return {Number} The squared distance between the vectors.
     */
    distanceSquared(other:IVec4):number {
      var x = this.x - other.x;
      var y = this.y - other.y;
      var z = this.z - other.z;
      var w = this.w - other.w;
      return x * x + y * y + z * z + w * w;
    }

    /**
     * Calculates the dot product with the given vector
     * @method dot
     * @param {Vec4} other
     * @return {Number} The dot product.
     */
    dot(other:IVec4):number {
      return this.x * other.x + this.y * other.y + this.z * other.z + this.w * other.w;
    }

    /**
     * Normalizes this vector. Applies the result to this vector.
     * @chainable
     * @method selfNormalize
     * @return {Vec4} Reference to `this` for chaining.
     */
    selfNormalize():Vec4 {
      var x = this.x;
      var y = this.y;
      var z = this.z;
      var w = this.w;
      var d = 1.0 / Math.sqrt(x * x + y * y + z * z + w * w);
      this.x *= d;
      this.y *= d;
      this.z *= d;
      this.w *= d;
      return this;
    }

    /**
     * Inverts this vector.
     * @chainable
     * @method selfInvert
     * @return {Vec4} Reference to `this` for chaining.
     */
    selfInvert():Vec4 {
      this.x = 1.0 / this.x;
      this.y = 1.0 / this.y;
      this.z = 1.0 / this.z;
      this.w = 1.0 / this.w;
      return this;
    }

    /**
     * Negates the components of this vector.
     * @chainable
     * @method selfNegate
     * @return {Vec4} Reference to `this` for chaining.
     */
    selfNegate():Vec4 {
      this.x = -this.x;
      this.y = -this.y;
      this.z = -this.z;
      this.w = -this.w;
      return this;
    }

    /**
     * Adds the given vector to `this`.
     * @chainable
     * @method selfAdd
     * @param {Vec4} other The vector to add
     * @return {Vec4} Reference to `this` for chaining.
     */
    selfAdd(other:IVec4):Vec4 {
      this.x += other.x;
      this.y += other.y;
      this.z += other.z;
      this.w += other.w;
      return this;
    }

    /**
     * Adds the given scalar to `this`
     * @chainable
     * @method selfAddScalar
     * @param {Number} scalar The scalar to add.
     * @return {Vec4} Reference to `this` for chaining.
     */
    selfAddScalar(scalar:number):Vec4 {
      this.x += scalar;
      this.y += scalar;
      this.z += scalar;
      this.w += scalar;
      return this;
    }

    /**
     * Subtracts the given from this vector from `this`.
     * @chainable
     * @method selfSubtract
     * @param {Vec4} other The vector to subtract.
     * @return {Vec4} Reference to `this` for chaining.
     */
    selfSubtract(other:IVec4):Vec4 {
      this.x -= other.x;
      this.y -= other.y;
      this.z -= other.z;
      this.w -= other.w;
      return this;
    }

    /**
     * Subtracts the given scalar from `this`.
     * @return {Vec4} Reference to `this` for chaining.
     * @method selfSubtractScalar
     * @param {Vec4} scalar The scalar to subtract.
     * @return {Vec4} Reference to `this` for chaining.
     */
    selfSubtractScalar(scalar:number):Vec4 {
      this.x -= scalar;
      this.y -= scalar;
      this.z -= scalar;
      this.w -= scalar;
      return this;
    }

    /**
     * Multiplies `this` with the given vector.
     * @chainable
     * @method selfMultiply
     * @param {Vec4} other The vector to multiply.
     * @return {Vec4} Reference to `this` for chaining.
     */
    selfMultiply(other:IVec4):Vec4 {
      this.x *= other.x;
      this.y *= other.y;
      this.z *= other.z;
      this.w *= other.w;
      return this;
    }

    /**
     * Multiplies `this` with the given scalar.
     * @chainable
     * @method selfMultiplyScalar
     * @param {Number} scalar The scalar to multiply.
     * @return {Vec4} Reference to `this` for chaining.
     */
    selfMultiplyScalar(scalar:number):Vec4 {
      this.x *= scalar;
      this.y *= scalar;
      this.z *= scalar;
      this.w *= scalar;
      return this;
    }

    /**
     * Divides `this` by the given vector.
     * @chainable
     * @method selfDivide
     * @param {Vec4} other The vector to divide with.
     * @return {Vec4} Reference to `this` for chaining.
     */
    selfDivide(other:IVec4):Vec4 {
      this.x /= other.x;
      this.y /= other.y;
      this.z /= other.z;
      this.w /= other.w;
      return this;
    }

    /**
     * Divides `this` by the given scalar.
     * @method selfDivideScalar
     * @param {Number} scalar The scalar to divide with.
     * @return {Vec4} Reference to `this` for chaining.
     */
    selfDivideScalar(scalar:number):Vec4 {
      scalar = 1.0 / scalar;
      this.x *= scalar;
      this.y *= scalar;
      this.z *= scalar;
      this.w *= scalar;
      return this;
    }

    /**
     * Multiplies `this` with the first vector and adds the second after.
     * @chainable
     * @method selfMultiplyAdd
     * @param {Vec4} mul The vector to multiply.
     * @param {Vec4} add The vector to add on top of the multiplication.
     * @return {Vec4} Reference to `this` for chaining.
     */
    selfMultiplyAdd(mul:IVec4, add:IVec4):Vec4 {
      this.x = this.x * mul.x + add.x;
      this.y = this.y * mul.y + add.y;
      this.z = this.z * mul.z + add.z;
      this.w = this.w * mul.w + add.w;
      return this;
    }

    /**
     * Multiplies `this` with the first vector and adds the second scalar after.
     * @chainable
     * @method selfMultiplyScalarAdd
     * @param {Number} mul The scalar to multiply.
     * @param {Vec4} add The vector to add on top of the multiplication.
     * @return {Vec4} Reference to `this` for chaining.
     */
    selfMultiplyScalarAdd(mul:number, add:IVec4):Vec4 {
      this.x = this.x * mul + add.x;
      this.y = this.y * mul + add.y;
      this.z = this.z * mul + add.z;
      this.w = this.w * mul + add.w;
      return this;
    }

    /**
     * Transforms `this` with the given quaternion. The `w` component of `this` keeps untouched.
     * @chainable
     * @method selfTransformQuat
     * @param {Quat} quat
     * @return {Vec4} Reference to `this` for chaining.
     */
    selfTransformQuat(quat:IVec4):Vec4 {
      var x = quat.x;
      var y = quat.y;
      var z = quat.z;
      var w = quat.w;

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

      var vx = this.x;
      var vy = this.y;
      var vz = this.z;

      this.x = vx * (1 - yy2 - zz2) + vy * (xy2 - wz2) + vz * (xz2 + wy2);
      this.y = vx * (xy2 + wz2) + vy * (1 - xx2 - zz2) + vz * (yz2 - wx2);
      this.z = vx * (xz2 - wy2) + vy * (yz2 + wx2) + vz * (1 - xx2 - yy2);
      return this;
    }

    /**
     * Transforms `this` with the given matrix.
     * @chainable
     * @method selfTransformMat4
     * @param {Mat4} mat
     * @return {Vec4} Reference to `this` for chaining.
     */
    selfTransformMat4(mat):Vec4 {
      var x = this.x;
      var y = this.y;
      var z = this.z;
      var w = this.w;
      var d = mat.data;
      this.x = x * d[0] + y * d[4] + z * d[8] + w * d[12];
      this.y = x * d[1] + y * d[5] + z * d[9] + w * d[13];
      this.z = x * d[2] + y * d[6] + z * d[10] + w * d[14];
      this.w = x * d[3] + y * d[7] + z * d[11] + w * d[15];
      return this;
    }

    /**
     * Transforms `this` with the given matrix. The `w` component of `this` keeps untouched.
     * @chainable
     * @method selfTransformMat3
     * @param {Mat3} mat
     * @return {Vec4} Reference to `this` for chaining.
     */
    selfTransformMat3(mat):Vec4 {
      var x = this.x;
      var y = this.y;
      var z = this.z;
      var d = mat.data;
      this.x = x * d[0] + y * d[3] + z * d[6];
      this.y = x * d[1] + y * d[4] + z * d[7];
      this.z = x * d[2] + y * d[5] + z * d[8];
      this.w = 1;
      return this;
    }

    /**
     * Transforms `this` with the given matrix. The `z` and `w` components of `this` keep untouched.
     * @chainable
     * @method selfTransformMat2
     * @param {Mat3} mat
     * @return {Vec4} Reference to `this` for chaining.
     */
    selfTransformMat2(mat):Vec4 {
      var x = this.x;
      var y = this.y;
      var d = mat.data;
      this.x = x * d[0] + y * d[2];
      this.y = x * d[1] + y * d[3];
      return this;
    }


    /**
     * Creates a new vector. The method should be called with four or no arguments. If less than four arguments are given
     * then some components of the resulting vector are going to be `undefined`.
     * @static
     * @method create
     * @param {Number} [x] The x component
     * @param {Number} [y] The y component
     * @param {Number} [z] The z component
     * @param {Number} [w] The w component
     * @return {Vec4} A new vector.
     */
    static create(x:number, y:number, z:number, w:number):Vec4 {
      if (x != null) {
        return new Vec4(x, y, z, w);
      }
      return new Vec4(0, 0, 0, 0);
    }

    /**
     * Creates a new vector with all components set to 0.
     * @static
     * @method zero
     * @return {Vec4} A new vector.
     */
    static zero():Vec4 {
      return new Vec4(0, 0, 0, 0);
    }

    /**
     * Creates a new vector with all components set to 1.
     * @static
     * @method one
     * @return {Vec4} A new vector.
     */
    static one():Vec4 {
      return new Vec4(1, 1, 1, 1);
    }

    /**
     * Normalizes the given vector.
     * @static
     * @method normalize
     * @param {Vec4} vec The vector to normalize.
     * @param {Vec4} [out] The vector to write to.
     * @return {Vec4} The given `out` parameter or a new vector.
     */
    static normalize(vec:IVec4, out?:IVec4):IVec4 {
      var x = vec.x;
      var y = vec.y;
      var z = vec.z;
      var w = vec.w;
      var d = 1.0 / Math.sqrt(x * x + y * y + z * z + w * w);
      out = out || new Vec4();
      out.x = x * d;
      out.y = y * d;
      out.z = z * d;
      out.w = w * d;
      return out;
    }

    /**
     * Inverts the given vector.
     * @static
     * @method invert
     * @param {Vec4} vec The vector to invert.
     * @param {Vec4} [out] The vector to write to.
     * @return {Vec4} The given `out` parameter or a new vector.
     */
    static invert(vec:IVec4, out?:IVec4):IVec4 {
      out = out || new Vec4();
      out.x = 1.0 / vec.x;
      out.y = 1.0 / vec.y;
      out.z = 1.0 / vec.z;
      out.w = 1.0 / vec.w;
      return out;
    }

    /**
     * Negates this vector.
     * @static
     * @method negate
     * @param {Vec4} vec The vector to negate.
     * @param {Vec4} [out] The vector to write to.
     * @return {Vec4} The given `out` parameter or a new vector.
     */
    static negate(vec:IVec4, out?:IVec4):IVec4 {
      out = out || new Vec4();
      out.x = -vec.x;
      out.y = -vec.y;
      out.z = -vec.z;
      out.w = -vec.w;
      return out;
    }

    /**
     * Adds two vectors.
     * @static
     * @method add
     * @param {Vec4} vecA The first vector.
     * @param {Vec4} vecB The second vector.
     * @param {Vec4} out The vector to write to.
     * @return {Vec4} The given `out` parameter or a new vector.
     */
    static add(vecA:IVec4, vecB:IVec4, out?:IVec4):IVec4 {
      out = out || new Vec4();
      out.x = vecA.x + vecB.x;
      out.y = vecA.y + vecB.y;
      out.z = vecA.z + vecB.z;
      out.w = vecA.w + vecB.w;
      return out;
    }

    /**
     * Adds a scalar to each component of a vector.
     * @static
     * @method addScalar
     * @param {Vec4} vec The first vector.
     * @param {Vec4} scalar The scalar to add.
     * @param {Vec4} [out] The vector to write to.
     * @return {Vec4} The given `out` parameter or a new vector.
     */
    static addScalar(vec:IVec4, scalar:number, out?:IVec4):IVec4 {
      out = out || new Vec4();
      out.x = vec.x + scalar;
      out.y = vec.y + scalar;
      out.z = vec.z + scalar;
      out.w = vec.w + scalar;
      return out;
    }

    /**
     * Subtracts the second vector from the first.
     * @static
     * @method subtract
     * @param {Vec4} vecA The first vector.
     * @param {Vec4} vecB The second vector.
     * @param {Vec4} [out] The vector to write to.
     * @return {Vec4} The given `out` parameter or a new vector.
     */
    static subtract(vecA:IVec4, vecB:IVec4, out?:IVec4):IVec4 {
      out = out || new Vec4();
      out.x = vecA.x - vecB.x;
      out.y = vecA.y - vecB.y;
      out.z = vecA.z - vecB.z;
      out.w = vecA.w - vecB.w;
      return out;
    }

    /**
     * Subtracts a scalar from each component of a vector.
     * @static
     * @method subtractScalar
     * @param {Vec4} vec The first vector.
     * @param {Vec4} scalar The scalar to add.
     * @param {Vec4} [out] The vector to write to.
     * @return {Vec4} The given `out` parameter or a new vector.
     */
    static subtractScalar(vec:IVec4, scalar:number, out?:IVec4):IVec4 {
      out = out || new Vec4();
      out.x = vec.x - scalar;
      out.y = vec.y - scalar;
      out.z = vec.z - scalar;
      out.w = vec.w - scalar;
      return out;
    }

    /**
     * Multiplies two vectors.
     * @static
     * @method multiply
     * @param {Vec4} vecA The first vector.
     * @param {Vec4} vecB The second vector.
     * @param {Vec4} [out] The vector to write to.
     * @return {Vec4} The given `out` parameter or a new vector.
     */
    static multiply(vecA:IVec4, vecB:IVec4, out?:IVec4):IVec4 {
      out = out || new Vec4();
      out.x = vecA.x * vecB.x;
      out.y = vecA.y * vecB.y;
      out.z = vecA.z * vecB.z;
      out.w = vecA.w * vecB.w;
      return out;
    }

    /**
     * Multiplies a scalar to each component of a vector.
     * @static
     * @method multiplyScalar
     * @param {Vec4} vec The first vector.
     * @param {Vec4} scalar The scalar to add.
     * @param {Vec4} [out] The vector to write to.
     * @return {Vec4} The given `out` parameter or a new vector.
     */
    static multiplyScalar(vec:IVec4, scalar:number, out?:IVec4):IVec4 {
      out = out || new Vec4();
      out.x = vec.x * scalar;
      out.y = vec.y * scalar;
      out.z = vec.z * scalar;
      out.w = vec.w * scalar;
      return out;
    }

    /**
     * Divides the components of the first vector by the components of the second vector.
     * @static
     * @method divide
     * @param {Vec4} vecA The first vector.
     * @param {Vec4} vecB The second vector.
     * @param {Vec4} [out] The vector to write to.
     * @return {Vec4} The given `out` parameter or a new vector.
     */
    static divide(vecA:IVec4, vecB:IVec4, out?:IVec4):IVec4 {
      out = out || new Vec4();
      out.x = vecA.x / vecB.x;
      out.y = vecA.y / vecB.y;
      out.z = vecA.z / vecB.z;
      out.w = vecA.w / vecB.w;
      return out;
    }

    /**
     * Divides the components of the first vector by the scalar.
     * @static
     * @method divideScalar
     * @param {Vec4} vec The first vector.
     * @param {Number} scalar The scalar to use for division.
     * @param {Vec4} out The vector to write to.
     * @return {Vec4} The given `out` parameter or a new vector.
     */
    static divideScalar(vec:IVec4, scalar:number, out?:IVec4):IVec4 {
      scalar = 1.0 / scalar;
      out = out || new Vec4();
      out.x = vec.x * scalar;
      out.y = vec.y * scalar;
      out.z = vec.z * scalar;
      out.w = vec.w * scalar;
      return out;
    }

    /**
     * Multiplies two vectors and adds the third vector.
     * @static
     * @method multiplyAdd
     * @param {Vec4} vecA The vector to multiply.
     * @param {Vec4} vecB The vector to multiply.
     * @param {Vec4} add The vector to add on top of the multiplication.
     * @param {Vec4} [out] The vector to write to.
     * @return {Vec4} The given `out` parameter or a new vector.
     */
    static multiplyAdd(vecA:IVec4, vecB:IVec4, add:IVec4, out?:IVec4):IVec4 {
      out = out || new Vec4();
      out.x = vecA.x * vecB.x + add.x;
      out.y = vecA.y * vecB.y + add.y;
      out.z = vecA.z * vecB.z + add.z;
      out.w = vecA.w * vecB.w + add.w;
      return out;
    }

    /**
     * Multiplies a vector with a scalar and adds another vector.
     * @static
     * @method multiplyAdd
     * @param {Vec4} vecA The vector to multiply.
     * @param {Number} mul The scalar to multiply.
     * @param {Vec4} add The vector to add on top of the multiplication.
     * @param {Vec4} [out] The vector to write to.
     * @return {Vec4} The given `out` parameter or a new vector.
     */
    static multiplyScalarAdd(vecA:IVec4, mul:number, add:IVec4, out?:IVec4):IVec4 {
      out = out || new Vec4();
      out.x = vecA.x * mul + add.x;
      out.y = vecA.y * mul + add.y;
      out.z = vecA.z * mul + add.z;
      out.w = vecA.w * mul + add.w;
      return out;
    }

    /**
     * Performs a component wise clamp operation on the the given vector by using the given min and max vectors.
     * @static
     * @method clamp
     * @param {Vec4} a The vector to clamp.
     * @param {Vec4} min Vector with the minimum component values.
     * @param {Vec4} max Vector with the maximum component values.
     * @param {Vec4} [out] The vector to write to.
     * @return {Vec4} The given `out` parameter or a new vector.
     */
    static clamp(a:IVec4, min:IVec4, max:IVec4, out?:IVec4):IVec4 {
      var x = a.x;
      var y = a.y;
      var z = a.z;
      var w = a.w;
      var minX = min.x;
      var minY = min.y;
      var minZ = min.z;
      var minW = min.w;
      var maxX = max.x;
      var maxY = max.y;
      var maxZ = max.z;
      var maxW = max.w;
      out = out || new Vec4();
      out.x = x < minX ? minX : (x > maxX ? maxX : x);
      out.y = y < minY ? minY : (y > maxY ? maxY : y);
      out.z = z < minZ ? minZ : (z > maxZ ? maxZ : z);
      out.w = w < minW ? minW : (w > maxW ? maxW : w);
      return out;
    }

    /**
     * Performs a component wise clamp operation on the the given vector by using the given min and max scalars.
     * @static
     * @method clampScalar
     * @param {Vec4} a The vector to clamp.
     * @param {Number} min The minimum scalar value.
     * @param {Number} max The maximum scalar value.
     * @param {Vec4} [out] The vector to write to.
     * @return {Vec4} The given `out` parameter or a new vector.
     */
    static clampScalar(a:IVec4, min:number, max:number, out?:IVec4):IVec4 {
      var x = a.x;
      var y = a.y;
      var z = a.z;
      var w = a.w;
      out = out || new Vec4();
      out.x = x < min ? min : (x > max ? max : x);
      out.y = y < min ? min : (y > max ? max : y);
      out.z = z < min ? min : (z > max ? max : z);
      out.w = w < min ? min : (w > max ? max : w);
      return out;
    }

    /**
     * Performs a component wise min operation on the the given vectors.
     * @static
     * @method min
     * @param {Vec4} a The first vector.
     * @param {Vec4} b The second vector.
     * @param {Vec4} [out] The vector to write to.
     * @return {Vec4} The given `out` parameter or a new vector.
     */
    static min(a:IVec4, b:IVec4, out?:IVec4):IVec4 {
      var aX = a.x;
      var aY = a.y;
      var aZ = a.z;
      var aW = a.w;
      var bX = b.x;
      var bY = b.y;
      var bZ = b.z;
      var bW = b.w;
      out = out || new Vec4();
      out.x = aX < bX ? aX : bX;
      out.y = aY < bY ? aY : bY;
      out.z = aZ < bZ ? aZ : bZ;
      out.w = aW < bW ? aW : bW;
      return out;
    }

    /**
     * Performs a component wise min operation on the the given vector and a scalar value.
     * @static
     * @method minScalar
     * @param {Vec4} a The vector.
     * @param {Number} scalar The scalar.
     * @param {Vec4} [out] The vector to write to.
     * @return {Vec4} The given `out` parameter or a new vector.
     */
    static minScalar(a:IVec4, scalar:number, out?:IVec4):IVec4 {
      var x = a.x;
      var y = a.y;
      var z = a.z;
      var w = a.w;
      out = out || new Vec4();
      out.x = x < scalar ? x : scalar;
      out.y = y < scalar ? y : scalar;
      out.z = z < scalar ? z : scalar;
      out.w = w < scalar ? w : scalar;
      return out;
    }

    /**
     * Performs a component wise max operation on the the given vectors.
     * @static
     * @method max
     * @param {Vec4} a The first vector.
     * @param {Vec4} b The second vector.
     * @param {Vec4} [out] The vector to write to.
     * @return {Vec4} The given `out` parameter or a new vector.
     */
    static max(a:IVec4, b:IVec4, out?:IVec4):IVec4 {
      var aX = a.x;
      var aY = a.y;
      var aZ = a.z;
      var aW = a.w;
      var bX = b.x;
      var bY = b.y;
      var bZ = b.z;
      var bW = b.w;
      out = out || new Vec4();
      out.x = aX > bX ? aX : bX;
      out.y = aY > bY ? aY : bY;
      out.z = aZ > bZ ? aZ : bZ;
      out.w = aW > bW ? aW : bW;
      return out;
    }

    /**
     * Performs a component wise max operation on the the given vector and a scalar value.
     * @static
     * @method maxScalar
     * @param {Vec4} a The vector.
     * @param {Number} scalar The scalar.
     * @param {Vec4} [out] The vector to write to.
     * @return {Vec4} The given `out` parameter or a new vector.
     */
    static maxScalar(a:IVec4, scalar:number, out?:IVec4):IVec4 {
      var x = a.x;
      var y = a.y;
      var z = a.z;
      var w = a.w;
      out = out || new Vec4();
      out.x = x > scalar ? x : scalar;
      out.y = y > scalar ? y : scalar;
      out.z = z > scalar ? z : scalar;
      out.w = w > scalar ? w : scalar;
      return out;
    }

    /**
     * Performs a component wise linear interpolation between the given two vectors.
     * @static
     * @method lerp
     * @param {Vec4} a The first vector.
     * @param {Vec4} b The second vector.
     * @param {Number} t The interpolation value. Assumed to be in range [0:1].
     * @param {Vec4} [out] The vector to write to.
     * @return {Vec4} The given `out` parameter or a new vector.
     */
    static lerp(a:IVec4, b:IVec4, t:number, out?:IVec4):IVec4 {
      var x = a.x;
      var y = a.y;
      var z = a.z;
      var w = a.w;
      out = out || new Vec4();
      out.x = x + (b.x - x) * t;
      out.y = y + (b.y - y) * t;
      out.z = z + (b.z - z) * t;
      out.w = w + (b.w - w) * t;
      return out;
    }

    /**
     * Performs a component wise barycentric interpolation of the given vectors.
     * @static
     * @method barycentric
     * @param {Vec4} a The first vector.
     * @param {Vec4} b The second vector.
     * @param {Vec4} c The third vector.
     * @param {Number} t1 The first interpolation value. Assumed to be in range [0:1].
     * @param {Number} t2 The second interpolation value. Assumed to be in range [0:1].
     * @param {Vec4} [out] The vector to write to.
     * @return {Vec4} The given `out` parameter or a new vector.
     */
    static barycentric(a:IVec4, b:IVec4, c:IVec4, t1:number, t2:number, out?:IVec4):IVec4 {
      var x = a.x;
      var y = a.y;
      var z = a.z;
      var w = a.w;
      out = out || new Vec4();
      out.x = x + t1 * (b.x - x) + t2 * (c.x - x);
      out.y = y + t1 * (b.y - y) + t2 * (c.y - y);
      out.z = z + t1 * (b.z - z) + t2 * (c.z - z);
      out.w = w + t1 * (b.w - w) + t2 * (c.w - w);
      return out;
    }

    /**
     * Performs a component wise smooth interpolation between the given two vectors.
     * @static
     * @method smooth
     * @param {Vec4} a The first vector.
     * @param {Vec4} b The second vector.
     * @param {Number} t The interpolation value. Assumed to be in range [0:1].
     * @param {Vec4} [out] The vector to write to.
     * @return {Vec4} The given `out` parameter or a new vector.
     */
    static smooth(a:IVec4, b:IVec4, t:number, out?:IVec4):IVec4 {
      t = ((t > 1) ? 1 : ((t < 0) ? 0 : t));
      t = t * t * (3 - 2 * t);
      var x = a.x;
      var y = a.y;
      var z = a.z;
      var w = a.w;
      out = out || new Vec4();
      out.x = x + (b.x - x) * t;
      out.y = y + (b.y - y) * t;
      out.z = z + (b.z - z) * t;
      out.w = w + (b.w - w) * t;
      return out;
    }

    /**
     * Tries to converts the given data to a vector
     * @static
     * @method convert
     * @param {Vec2|Vec3|Vec4|Quat|Array|number} data
     * @return {Vec4}
     */
    static convert(data:any):Vec4 {
      if (Array.isArray(data)) {
        return new Vec4(
          data[0] || 0,
          data[1] || 0,
          data[2] || 0,
          data[3] || 0
        );
      }
      if (typeof data === 'number') {
        return new Vec4(data, data, data, data);
      }
      return new Vec4(
        data.x || 0,
        data.y || 0,
        data.z || 0,
        data.w || 0
      );
    }

    static prettyString(vec) {
      return [vec.x.toFixed(5), vec.y.toFixed(5), vec.z.toFixed(5), vec.w.toFixed(5)].join(', ');
    }
  }
}
