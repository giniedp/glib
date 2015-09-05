module Glib {

  /**
   * Describes a vector with two components.
   *
   * @class Vec2
   * @constructor
   */
  export class Vec2 implements IVec2 {
    constructor(public x?:number, public y?:number) {

    }

    /**
     * Initializes the components of this vector with given values.
     * @chainable
     * @method init
     * @param {Number} x value for X component
     * @param {Number} y value for Y component
     * @return {Vec2} this vector for chaining
     */
    init(x:number, y:number) {
      /**
       * @attribute x
       * @type {Number}
       */
      this.x = x;
      /**
       * @attribute y
       * @type {Number}
       */
      this.y = y;
      return this;
    }

    /**
     * Initializes the components of this vector by taking the components from the given vector.
     * @chainable
     * @method initFrom
     * @param {Vec2} other The vector to read from
     * @return {Vec2}
     */
    initFrom(other:IVec2):Vec2 {
      this.x = other.x;
      this.y = other.y;
      return this;
    }

    /**
     * Initializes the components of this vector by taking values from the given array in successive order.
     * @chainable
     * @method initFromBuffer
     * @param {Array} buffer The array to read from
     * @param {Number} [offset=0] The zero based index at which start reading the values
     * @return {Vec2}
     */
    initFromBuffer(buffer:NumbersArray, offset?:number):Vec2 {
      offset = offset || 0;
      this.x = buffer[offset];
      this.y = buffer[offset + 1];
      return this;
    }

    /**
     * Creates a copy of this vector
     * @method clone
     * @return {Vec2} The cloned vector
     */
    clone():Vec2{
      return new Vec2(this.x, this.y);
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
      return buffer;
    }

    /**
     * Returns an array filled with the values of the components of this vector
     * @method dump
     * @return {Array}
     */
    dump():number[] {
      return [this.x, this.y];
    }

    /**
     * Checks for component wise equality with given vector
     * @method equals
     * @param {Vec2} other The vector to compare with
     * @return {Boolean} true if components are equal, false otherwise
     */
    equals(other:IVec2):boolean {
      return ((this.x === other.x) && (this.y === other.y));
    }

    /**
     * Calculates the length of this vector
     * @method length
     * @return {Number} The length.
     */
    length():number {
      var x = this.x;
      var y = this.y;
      return Math.sqrt(x * x + y * y);
    }

    /**
     * Calculates the squared length of this vector
     * @method lengthSquared
     * @return {Number} The squared length.
     */
    lengthSquared():number {
      var x = this.x;
      var y = this.y;
      return x * x + y * y;
    }

    /**
     * Calculates the distance to the given vector
     * @method distance
     * @param {Vec2} other The distant vector
     * @return {Number} The distance between the vectors.
     */
    distance(other:IVec2):number {
      var x = this.x - other.x;
      var y = this.y - other.y;
      return Math.sqrt(x * x + y * y);
    }

    /**
     * Calculates the squared distance to the given vector
     * @method distanceSquared
     * @param {Vec2} other The distant vector
     * @return {Number} The squared distance between the vectors.
     */
    distanceSquared(other:IVec2):number {
      var x = this.x - other.x;
      var y = this.y - other.y;
      return x * x + y * y;
    }

    /**
     * Calculates the dot product with the given vector
     * @method dot
     * @param {Vec2} other
     * @return {Number} The dot product.
     */
    dot(other:IVec2):number {
      return this.x * other.x + this.y * other.y;
    }

    /**
     * Normalizes this vector. Applies the result to this vector.
     * @chainable
     * @method selfNormalize
     * @return {Vec2} Reference to `this` for chaining.
     */
    selfNormalize():Vec2 {
      var x = this.x;
      var y = this.y;
      var d = 1.0 / Math.sqrt(x * x + y * y);
      this.x *= d;
      this.y *= d;
      return this;
    }

    /**
     * Inverts this vector.
     * @chainable
     * @method selfInvert
     * @return {Vec2} Reference to `this` for chaining.
     */
    selfInvert():Vec2 {
      this.x = 1.0 / this.x;
      this.y = 1.0 / this.y;
      return this;
    }

    /**
     * Negates the components of this vector.
     * @chainable
     * @method selfNegate
     * @return {Vec2} Reference to `this` for chaining.
     */
    selfNegate():Vec2 {
      this.x = -this.x;
      this.y = -this.y;
      return this;
    }

    /**
     * Adds the given vector to `this`.
     * @chainable
     * @method selfAdd
     * @param {Vec2} other The vector to add
     * @return {Vec2} Reference to `this` for chaining.
     */
    selfAdd(other:IVec2):Vec2 {
      this.x += other.x;
      this.y += other.y;
      return this;
    }

    /**
     * Adds the given scalar to `this`
     * @chainable
     * @method selfAddScalar
     * @param {Number} scalar The scalar to add.
     * @return {Vec2} Reference to `this` for chaining.
     */
    selfAddScalar(scalar:number):IVec2 {
      this.x += scalar;
      this.y += scalar;
      return this;
    }

    /**
     * Subtracts the given from this vector from `this`.
     * @chainable
     * @method selfSubtract
     * @param {Vec2} other The vector to subtract.
     * @return {Vec2} Reference to `this` for chaining.
     */
    selfSubtract(other:IVec2):Vec2 {
      this.x -= other.x;
      this.y -= other.y;
      return this;
    }

    /**
     * Subtracts the given scalar from `this`.
     * @return {Vec2} Reference to `this` for chaining.
     * @method selfSubtractScalar
     * @param {Vec2} scalar The scalar to subtract.
     * @return {Vec2} Reference to `this` for chaining.
     */
    selfSubtractScalar(scalar:number):IVec2 {
      this.x -= scalar;
      this.y -= scalar;
      return this;
    }

    /**
     * Multiplies `this` with the given vector.
     * @chainable
     * @method selfMultiply
     * @param {Vec2} other The vector to multiply.
     * @return {Vec2} Reference to `this` for chaining.
     */
    selfMultiply(other:IVec2):Vec2 {
      this.x *= other.x;
      this.y *= other.y;
      return this;
    }

    /**
     * Multiplies `this` with the given scalar.
     * @chainable
     * @method selfMultiplyScalar
     * @param {Number} scalar The scalar to multiply.
     * @return {Vec2} Reference to `this` for chaining.
     */
    selfMultiplyScalar(scalar:number):Vec2 {
      this.x *= scalar;
      this.y *= scalar;
      return this;
    }

    /**
     * Divides `this` by the given vector.
     * @chainable
     * @method selfDivide
     * @param {Vec2} other The vector to divide with.
     * @return {Vec2} Reference to `this` for chaining.
     */
    selfDivide(other:IVec2):Vec2 {
      this.x /= other.x;
      this.y /= other.y;
      return this;
    }

    /**
     * Divides `this` by the given scalar.
     * @method selfDivideScalar
     * @param {Number} scalar The scalar to divide with.
     * @return {Vec2} Reference to `this` for chaining.
     */
    selfDivideScalar(scalar:number):Vec2 {
      scalar = 1 / scalar;
      this.x *= scalar;
      this.y *= scalar;
      return this;
    }

    /**
     * Multiplies `this` with the first vector and adds the second after.
     * @chainable
     * @method selfMultiplyAdd
     * @param {Vec2} mul The vector to multiply.
     * @param {Vec2} add The vector to add on top of the multiplication.
     * @return {Vec2} Reference to `this` for chaining.
     */
    selfMultiplyAdd(mul:IVec2, add:IVec2):Vec2 {
      this.x = this.x * mul.x + add.x;
      this.y = this.y * mul.y + add.y;
      return this;
    }

    /**
     * Multiplies `this` with the first vector and adds the second scalar after.
     * @chainable
     * @method selfMultiplyScalarAdd
     * @param {Number} mul The scalar to multiply.
     * @param {Vec2} add The vector to add on top of the multiplication.
     * @return {Vec2} Reference to `this` for chaining.
     */
    selfMultiplyScalarAdd(mul:number, add:IVec2):Vec2 {
      this.x = this.x * mul + add.x;
      this.y = this.y * mul + add.y;
      return this;
    }

    /**
     * Transforms `this` with the given matrix.
     * @chainable
     * @method selfTransformMat4
     * @param {Mat4} mat
     * @return {Vec2} Reference to `this` for chaining.
     */
    selfTransformMat4(mat):IVec2 {
      var x = this.x;
      var y = this.y;
      var d = mat.data;
      this.x = x * d[0] + y * d[4] + d[12];
      this.y = x * d[1] + y * d[5] + d[13];
      return this;
    }

    /**
     * Transforms `this` with the given matrix.
     * @chainable
     * @method selfTransformMat3
     * @param {Mat3} mat
     * @return {Vec2} Reference to `this` for chaining.
     */
    selfTransformMat3(mat):IVec2 {
      var x = this.x;
      var y = this.y;
      var d = mat.data;
      this.x = x * d[0] + y * d[3];
      this.y = x * d[1] + y * d[4];
      return this;
    }

    /**
     * Transforms `this` with the given matrix.
     * @chainable
     * @method selfTransformMat2
     * @param {Mat3} mat
     * @return {Vec2} Reference to `this` for chaining.
     */
    selfTransformMat2(mat):IVec2 {
      var x = this.x;
      var y = this.y;
      var d = mat.data;
      this.x = x * d[0] + y * d[2];
      this.y = x * d[1] + y * d[3];
      return this;
    }


    /**
     * Creates a new vector. The method should be called with three or no arguments. If less than three arguments are given
     * then some components of the resulting vector are going to be `undefined`.
     * @static
     * @method create
     * @param {Number} [x] The x component
     * @param {Number} [y] The y component
     * @return {Vec2} A new vector.
     */
    static create(x:number, y:number):Vec2 {
      if (x != null) {
        return new Vec2(x, y);
      }
      return new Vec2(0, 0);
    }

    /**
     * Creates a new vector with all components set to 0.
     * @static
     * @method zero
     * @return {Vec2} A new vector.
     */
    static zero():Vec2 {
      return new Vec2(0, 0);
    }

    /**
     * Creates a new vector with all components set to 1.
     * @static
     * @method one
     * @return {Vec2} A new vector.
     */
    static one():Vec2 {
      return new Vec2(1, 1);
    }

    /**
     * Normalizes the given vector.
     * @static
     * @method normalize
     * @param {Vec2} vec The vector to normalize.
     * @param {Vec2} [out] The vector to write to.
     * @return {Vec2} The given `out` parameter or a new vector.
     */
    static normalize(vec:IVec2, out?:IVec2):IVec2 {
      var x = vec.x;
      var y = vec.y;
      var d = 1.0 / Math.sqrt(x * x + y * y);
      out = out || new Vec2();
      out.x = x * d;
      out.y = y * d;
      return out;
    }

    /**
     * Inverts the given vector.
     * @static
     * @method invert
     * @param {Vec2} vec The vector to invert.
     * @param {Vec2} [out] The vector to write to.
     * @return {Vec2} The given `out` parameter or a new vector.
     */
    static invert(vec:IVec2, out?:IVec2):IVec2 {
      out = out || new Vec2();
      out.x = 1.0 / vec.x;
      out.y = 1.0 / vec.y;
      return out;
    }

    /**
     * Negates this vector.
     * @static
     * @method negate
     * @param {Vec2} vec The vector to negate.
     * @param {Vec2} [out] The vector to write to.
     * @return {Vec2} The given `out` parameter or a new vector.
     */
    static negate(vec:IVec2, out?:IVec2):IVec2 {
      out = out || new Vec2();
      out.x = -vec.x;
      out.y = -vec.y;
      return out;
    }

    /**
     * Adds two vectors.
     * @static
     * @method add
     * @param {Vec2} vecA The first vector.
     * @param {Vec2} vecB The second vector.
     * @param {Vec2} out The vector to write to.
     * @return {Vec2} The given `out` parameter or a new vector.
     */
    static add(vecA:IVec2, vecB:IVec2, out?:IVec2):IVec2 {
      out = out || new Vec2();
      out.x = vecA.x + vecB.x;
      out.y = vecA.y + vecB.y;
      return out;
    }

    /**
     * Adds a scalar to each component of a vector.
     * @static
     * @method addScalar
     * @param {Vec2} vec The first vector.
     * @param {Vec2} scalar The scalar to add.
     * @param {Vec2} [out] The vector to write to.
     * @return {Vec2} The given `out` parameter or a new vector.
     */
    static addScalar(vec:IVec2, scalar:number, out?:IVec2):IVec2 {
      out = out || new Vec2();
      out.x = vec.x + scalar;
      out.y = vec.y + scalar;
      return out;
    }

    /**
     * Subtracts the second vector from the first.
     * @static
     * @method subtract
     * @param {Vec2} vecA The first vector.
     * @param {Vec2} vecB The second vector.
     * @param {Vec2} [out] The vector to write to.
     * @return {Vec2} The given `out` parameter or a new vector.
     */
    static subtract(vecA:IVec2, vecB:IVec2, out?:IVec2):IVec2 {
      out = out || new Vec2();
      out.x = vecA.x - vecB.x;
      out.y = vecA.y - vecB.y;
      return out;
    }

    /**
     * Subtracts a scalar from each component of a vector.
     * @static
     * @method subtractScalar
     * @param {Vec2} vec The first vector.
     * @param {Vec2} scalar The scalar to add.
     * @param {Vec2} [out] The vector to write to.
     * @return {Vec2} The given `out` parameter or a new vector.
     */
    static subtractScalar(vec:IVec2, scalar:number, out?:IVec2):IVec2 {
      out = out || new Vec2();
      out.x = vec.x - scalar;
      out.y = vec.y - scalar;
      return out;
    }

    /**
     * Multiplies two vectors.
     * @static
     * @method multiply
     * @param {Vec2} vecA The first vector.
     * @param {Vec2} vecB The second vector.
     * @param {Vec2} [out] The vector to write to.
     * @return {Vec2} The given `out` parameter or a new vector.
     */
    static multiply(vecA:IVec2, vecB:IVec2, out?:IVec2):IVec2 {
      out = out || new Vec2();
      out.x = vecA.x * vecB.x;
      out.y = vecA.y * vecB.y;
      return out;
    }

    /**
     * Multiplies a scalar to each component of a vector.
     * @static
     * @method multiplyScalar
     * @param {Vec2} vec The first vector.
     * @param {Vec2} scalar The scalar to add.
     * @param {Vec2} [out] The vector to write to.
     * @return {Vec2} The given `out` parameter or a new vector.
     */
    static multiplyScalar(vec:IVec2, scalar:number, out?:IVec2):IVec2 {
      out = out || new Vec2();
      out.x = vec.x * scalar;
      out.y = vec.y * scalar;
      return out;
    }

    /**
     * Divides the components of the first vector by the components of the second vector.
     * @static
     * @method divide
     * @param {Vec2} vecA The first vector.
     * @param {Vec2} vecB The second vector.
     * @param {Vec2} [out] The vector to write to.
     * @return {Vec2} The given `out` parameter or a new vector.
     */
    static divide(vecA:IVec2, vecB:IVec2, out?:IVec2):IVec2 {
      out = out || new Vec2();
      out.x = vecA.x / vecB.x;
      out.y = vecA.y / vecB.y;
      return out;
    }

    /**
     * Divides the components of the first vector by the scalar.
     * @static
     * @method divideScalar
     * @param {Vec2} vec The first vector.
     * @param {Number} scalar The scalar to use for division.
     * @param {Vec2} out The vector to write to.
     * @return {Vec2} The given `out` parameter or a new vector.
     */
    static divideScalar(vec:IVec2, scalar:number, out?:IVec2):IVec2 {
      scalar = 1 / scalar;
      out = out || new Vec2();
      out.x = vec.x * scalar;
      out.y = vec.y * scalar;
      return out;
    }

    /**
     * Multiplies two vectors and adds the third vector.
     * @static
     * @method multiplyAdd
     * @param {Vec2} vecA The vector to multiply.
     * @param {Vec2} vecB The vector to multiply.
     * @param {Vec2} add The vector to add on top of the multiplication.
     * @param {Vec2} [out] The vector to write to.
     * @return {Vec2} The given `out` parameter or a new vector.
     */
    static multiplyAdd(vecA:IVec2, vecB:IVec2, add:IVec2, out?:IVec2):IVec2 {
      out = out || new Vec2();
      out.x = vecA.x * vecB.x + add.x;
      out.y = vecA.y * vecB.y + add.y;
      return out;
    }

    /**
     * Multiplies a vector with a scalar and adds another vector.
     * @static
     * @method multiplyAdd
     * @param {Vec2} vecA The vector to multiply.
     * @param {Number} mul The scalar to multiply.
     * @param {Vec2} add The vector to add on top of the multiplication.
     * @param {Vec2} [out] The vector to write to.
     * @return {Vec2} The given `out` parameter or a new vector.
     */
    static multiplyScalarAdd(vecA:IVec2, mul:number, add:IVec2, out?:IVec2):IVec2 {
      out = out || new Vec2();
      out.x = vecA.x * mul + add.x;
      out.y = vecA.y * mul + add.y;
      return out;
    }

    /**
     * Performs a component wise clamp operation on the the given vector by using the given min and max vectors.
     * @static
     * @method clamp
     * @param {Vec2} a The vector to clamp.
     * @param {Vec2} min Vector with the minimum component values.
     * @param {Vec2} max Vector with the maximum component values.
     * @param {Vec2} [out] The vector to write to.
     * @return {Vec2} The given `out` parameter or a new vector.
     */
    static clamp(a:IVec2, min:IVec2, max:IVec2, out?:IVec2):IVec2 {
      var x = a.x;
      var y = a.y;
      var minX = min.x;
      var minY = min.y;
      var maxX = max.x;
      var maxY = max.y;
      out = out || new Vec2();
      out.x = x < minX ? minX : (x > maxX ? maxX : x);
      out.y = y < minY ? minY : (y > maxY ? maxY : y);
      return out;
    }

    /**
     * Performs a component wise clamp operation on the the given vector by using the given min and max scalars.
     * @static
     * @method clampScalar
     * @param {Vec2} a The vector to clamp.
     * @param {Number} min The minimum scalar value.
     * @param {Number} max The maximum scalar value.
     * @param {Vec2} [out] The vector to write to.
     * @return {Vec2} The given `out` parameter or a new vector.
     */
    static clampScalar(a:IVec2, min:number, max:number, out?:IVec2):IVec2 {
      var x = a.x;
      var y = a.y;
      out = out || new Vec2();
      out.x = x < min ? min : (x > max ? max : x);
      out.y = y < min ? min : (y > max ? max : y);
      return out;
    }

    /**
     * Performs a component wise min operation on the the given vectors.
     * @static
     * @method min
     * @param {Vec2} a The first vector.
     * @param {Vec2} b The second vector.
     * @param {Vec2} [out] The vector to write to.
     * @return {Vec2} The given `out` parameter or a new vector.
     */
    static min(a:IVec2, b:IVec2, out?:IVec2):IVec2 {
      var aX = a.x;
      var aY = a.y;
      var bX = b.x;
      var bY = b.y;
      out = out || new Vec2();
      out.x = aX < bX ? aX : bX;
      out.y = aY < bY ? aY : bY;
      return out;
    }

    /**
     * Performs a component wise min operation on the the given vector and a scalar value.
     * @static
     * @method minScalar
     * @param {Vec2} a The vector.
     * @param {Number} scalar The scalar.
     * @param {Vec2} [out] The vector to write to.
     * @return {Vec2} The given `out` parameter or a new vector.
     */
    static minScalar(a:IVec2, scalar:number, out?:IVec2):IVec2 {
      var x = a.x;
      var y = a.y;
      out = out || new Vec2();
      out.x = x < scalar ? x : scalar;
      out.y = y < scalar ? y : scalar;
      return out;
    }

    /**
     * Performs a component wise max operation on the the given vectors.
     * @static
     * @method max
     * @param {Vec2} a The first vector.
     * @param {Vec2} b The second vector.
     * @param {Vec2} [out] The vector to write to.
     * @return {Vec2} The given `out` parameter or a new vector.
     */
    static max(a:IVec2, b:IVec2, out?:IVec2):IVec2 {
      var aX = a.x;
      var aY = a.y;
      var bX = b.x;
      var bY = b.y;
      out = out || new Vec2();
      out.x = aX > bX ? aX : bX;
      out.y = aY > bY ? aY : bY;
      return out;
    }

    /**
     * Performs a component wise max operation on the the given vector and a scalar value.
     * @static
     * @method maxScalar
     * @param {Vec2} a The vector.
     * @param {Number} scalar The scalar.
     * @param {Vec2} [out] The vector to write to.
     * @return {Vec2} The given `out` parameter or a new vector.
     */
    static maxScalar(a:IVec2, scalar:number, out?:IVec2):IVec2 {
      var x = a.x;
      var y = a.y;
      out = out || new Vec2();
      out.x = x > scalar ? x : scalar;
      out.y = y > scalar ? y : scalar;
      return out;
    }

    /**
     * Performs a component wise linear interpolation between the given two vectors.
     * @static
     * @method lerp
     * @param {Vec2} a The first vector.
     * @param {Vec2} b The second vector.
     * @param {Number} t The interpolation value. Assumed to be in range [0:1].
     * @param {Vec2} [out] The vector to write to.
     * @return {Vec2} The given `out` parameter or a new vector.
     */
    static lerp(a:IVec2, b:IVec2, t:number, out?:IVec2):IVec2 {
      var x = a.x;
      var y = a.y;
      out = out || new Vec2();
      out.x = x + (b.x - x) * t;
      out.y = y + (b.y - y) * t;
      return out;
    }

    /**
     * Performs a component wise barycentric interpolation of the given vectors.
     * @static
     * @method barycentric
     * @param {Vec2} a The first vector.
     * @param {Vec2} b The second vector.
     * @param {Vec2} c The third vector.
     * @param {Number} t1 The first interpolation value. Assumed to be in range [0:1].
     * @param {Number} t2 The second interpolation value. Assumed to be in range [0:1].
     * @param {Vec2} [out] The vector to write to.
     * @return {Vec2} The given `out` parameter or a new vector.
     */
    static barycentric(a:IVec2, b:IVec2, c:IVec2, t1:number, t2:number, out?:IVec2):IVec2 {
      var x = a.x;
      var y = a.y;
      out = out || new Vec2();
      out.x = x + t1 * (b.x - x) + t2 * (c.x - x);
      out.y = y + t1 * (b.y - y) + t2 * (c.y - y);
      return out;
    }

    /**
     * Performs a component wise smooth interpolation between the given two vectors.
     * @static
     * @method smooth
     * @param {Vec2} a The first vector.
     * @param {Vec2} b The second vector.
     * @param {Number} t The interpolation value. Assumed to be in range [0:1].
     * @param {Vec2} [out] The vector to write to.
     * @return {Vec2} The given `out` parameter or a new vector.
     */
    static smooth(a:IVec2, b:IVec2, t:number, out?:IVec2):IVec2 {
      t = ((t > 1) ? 1 : ((t < 0) ? 0 : t));
      t = t * t * (3 - 2 * t);
      var x = a.x;
      var y = a.y;
      out = out || new Vec2();
      out.x = x + (b.x - x) * t;
      out.y = y + (b.y - y) * t;
      return out;
    }

    /**
     * Tries to converts the given data to a vector
     * @static
     * @method convert
     * @param {Vec2|Vec3|Vec4|Quat|Array|number} data
     * @return {Vec2}
     */
    static convert(data:any):Vec2 {
      if (Array.isArray(data)) {
        return new Vec2(
          data[0] || 0,
          data[1] || 0
        );
      }
      if (typeof data === 'number') {
        return new Vec2(data, data);
      }
      return new Vec2(
        data.x || 0,
        data.y || 0
      );
    }

    static prettyString(vec) {
      return [vec.x.toFixed(5), vec.y.toFixed(5)].join(', ');
    }
  }
}
