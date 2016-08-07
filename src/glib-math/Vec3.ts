module Glib {

  /**
   * Describes a vector with three components.
   */
  export class Vec3 implements IVec2, IVec3 {
    /**
     * The X component
     */
    x:number;
    /**
     * The Y component
     */
    y:number;
    /**
     * The Z component
     */
    z:number;

    /**
     * Initializes a new vector
     * @param x Value for the X component
     * @param y Value for the Y component
     * @param z Value for the Z component
     */
    constructor(x:number=0, y:number=0, z:number=0) {
      this.x = x;
      this.y = y;
      this.z = z;
    }

    /**
     * Initializes the components of this vector with given values.
     * @param x value for X component
     * @param y value for Y component
     * @param z value for Z component
     * @return {Vec3} this vector for chaining
     */
    init(x:number, y:number, z:number):Vec3 {
      this.x = x;
      this.y = y;
      this.z = z;
      return this;
    }

    /**
     * Initializes the components of this vector by taking the components from the given vector.
     * @param other The vector to read from
     * @return {Vec3}
     */
    initFrom(other:IVec3):Vec3 {
      this.x = other.x;
      this.y = other.y;
      this.z = other.z;
      return this;
    }

    /**
     * Initializes the components of this vector by taking values from the given array in successive order.
     * @param buffer The array to read from
     * @param [offset=0] The zero based index at which start reading the values
     * @return {Vec3}
     */
    initFromBuffer(buffer:NumbersArray, offset:number=0):Vec3 {
      this.x = buffer[offset];
      this.y = buffer[offset + 1];
      this.z = buffer[offset + 2];
      return this;
    }

    /**
     * Creates a copy of this vector
     * @return {Vec3} The cloned vector
     */
    clone():Vec3 {
      return new Vec3(this.x, this.y, this.z);
    }

    /**
     * Copies the components successively into the given array.
     * @param buffer The array to copy into
     * @param offset Zero based index where to start writing in the array
     * @return {Array|Float32Array}
     */
    copyTo(buffer:NumbersArray, offset:number=0):NumbersArray {
      buffer[offset] = this.x;
      buffer[offset + 1] = this.y;
      buffer[offset + 2] = this.z;
      return buffer;
    }

    /**
     * Returns an array filled with the values of the components of this vector
     * @method dump
     */
    dump():number[] {
      return [this.x, this.y, this.z];
    }

    /**
     * Checks for component wise equality with given vector
     * @param other The vector to compare with
     * @return {Boolean} true if components are equal, false otherwise
     */
    equals(other:IVec3):boolean {
      return ((this.x === other.x) && (this.y === other.y) && (this.z === other.z));
    }

    /**
     * Calculates the length of this vector
     * @return {Number} The length.
     */
    length():number {
      var x = this.x;
      var y = this.y;
      var z = this.z;
      return Math.sqrt(x * x + y * y + z * z);
    }

    /**
     * Calculates the squared length of this vector
     * @return {Number} The squared length.
     */
    lengthSquared():number {
      var x = this.x;
      var y = this.y;
      var z = this.z;
      return x * x + y * y + z * z;
    }

    /**
     * Calculates the distance to the given vector
     * @param other The distant vector
     * @return {Number} The distance between the vectors.
     */
    distance(other:IVec3):number {
      var x = this.x - other.x;
      var y = this.y - other.y;
      var z = this.z - other.z;
      return Math.sqrt(x * x + y * y + z * z);
    }

    /**
     * Calculates the squared distance to the given vector
     * @param other The distant vector
     * @return {Number} The squared distance between the vectors.
     */
    distanceSquared(other:IVec3):number {
      var x = this.x - other.x;
      var y = this.y - other.y;
      var z = this.z - other.z;
      return x * x + y * y + z * z;
    }

    /**
     * Calculates the dot product with the given vector
     * @param other
     * @return {Number} The dot product.
     */
    dot(other:IVec3):number {
      return this.x * other.x + this.y * other.y + this.z * other.z;
    }

    /**
     * Calculates the cross product with another vector.
     * @param other The second vector.
     * @return {Vec3} A new vector.
     */
    selfCross(other:IVec3):Vec3 {
      var x = this.y * other.z - this.z * other.y;
      var y = this.z * other.x - this.x * other.z;
      var z = this.x * other.y - this.y * other.x;
      this.x = x;
      this.y = y;
      this.z = z;
      return this;
    }

    /**
     * Normalizes this vector. Applies the result to this vector.
     * @return {Vec3} Reference to `this` for chaining.
     */
    selfNormalize():Vec3 {
      var x = this.x;
      var y = this.y;
      var z = this.z;
      var d = 1.0 / Math.sqrt(x * x + y * y + z * z);
      this.x *= d;
      this.y *= d;
      this.z *= d;
      return this;
    }

    /**
     * Inverts this vector.
     * @return {Vec3} Reference to `this` for chaining.
     */
    selfInvert():Vec3 {
      this.x = 1.0 / this.x;
      this.y = 1.0 / this.y;
      this.z = 1.0 / this.z;
      return this;
    }

    /**
     * Negates the components of this vector.
     * @return {Vec3} Reference to `this` for chaining.
     */
    selfNegate():Vec3 {
      this.x = -this.x;
      this.y = -this.y;
      this.z = -this.z;
      return this;
    }

    /**
     * Adds the given vector to `this`.
     * @param other The vector to add
     * @return {Vec3} Reference to `this` for chaining.
     */
    selfAdd(other:IVec3):Vec3 {
      this.x += other.x;
      this.y += other.y;
      this.z += other.z;
      return this;
    }

    /**
     * Adds the given scalar to `this`
     * @param scalar The scalar to add.
     * @return {Vec3} Reference to `this` for chaining.
     */
    selfAddScalar(scalar:number):Vec3 {
      this.x += scalar;
      this.y += scalar;
      this.z += scalar;
      return this;
    }

    /**
     * Subtracts the given from this vector from `this`.
     * @param other The vector to subtract.
     * @return {Vec3} Reference to `this` for chaining.
     */
    selfSubtract(other:IVec3):Vec3 {
      this.x -= other.x;
      this.y -= other.y;
      this.z -= other.z;
      return this;
    }

    /**
     * Subtracts the given scalar from `this`.
     * @param scalar The scalar to subtract.
     * @return {Vec3} Reference to `this` for chaining.
     */
    selfSubtractScalar(scalar:number):Vec3 {
      this.x -= scalar;
      this.y -= scalar;
      this.z -= scalar;
      return this;
    }

    /**
     * Multiplies `this` with the given vector.
     * @param other The vector to multiply.
     * @return {Vec3} Reference to `this` for chaining.
     */
    selfMultiply(other:IVec3):Vec3 {
      this.x *= other.x;
      this.y *= other.y;
      this.z *= other.z;
      return this;
    }

    /**
     * Multiplies `this` with the given scalar.
     * @param scalar The scalar to multiply.
     * @return {Vec3} Reference to `this` for chaining.
     */
    selfMultiplyScalar(scalar:number):Vec3 {
      this.x *= scalar;
      this.y *= scalar;
      this.z *= scalar;
      return this;
    }

    /**
     * Divides `this` by the given vector.
     * @param other The vector to divide with.
     * @return {Vec3} Reference to `this` for chaining.
     */
    selfDivide(other:IVec3):Vec3 {
      this.x /= other.x;
      this.y /= other.y;
      this.z /= other.z;
      return this;
    }

    /**
     * Divides `this` by the given scalar.
     * @param scalar The scalar to divide with.
     * @return {Vec3} Reference to `this` for chaining.
     */
    selfDivideScalar(scalar:number):Vec3 {
      scalar = 1 / scalar;
      this.x *= scalar;
      this.y *= scalar;
      this.z *= scalar;
      return this;
    }

    /**
     * Multiplies `this` with the first vector and adds the second after.
     * @param mul The vector to multiply.
     * @param add The vector to add on top of the multiplication.
     * @return {Vec3} Reference to `this` for chaining.
     */
    selfMultiplyAdd(mul:IVec3, add:IVec3):Vec3 {
      this.x = this.x * mul.x + add.x;
      this.y = this.y * mul.y + add.y;
      this.z = this.z * mul.z + add.z;
      return this;
    }

    /**
     * Multiplies `this` with the first vector and adds the second scalar after.
     * @param mul The scalar to multiply.
     * @param add The vector to add on top of the multiplication.
     * @return {Vec3} Reference to `this` for chaining.
     */
    selfMultiplyScalarAdd(mul:number, add:IVec3):Vec3 {
      this.x = this.x * mul + add.x;
      this.y = this.y * mul + add.y;
      this.z = this.z * mul + add.z;
      return this;
    }

    /**
     * Transforms `this` with the given quaternion.
     * @param quat
     * @return {Vec3} Reference to `this` for chaining.
     */
    selfTransformQuat(quat:IVec4):Vec3 {
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
     * @param mat
     * @return {Vec3} Reference to `this` for chaining.
     */
    selfTransformMat4(mat):Vec3 {
      var x = this.x;
      var y = this.y;
      var z = this.z;
      var w = 1;
      var d = mat.data;
      this.x = x * d[0] + y * d[4] + z * d[8] + w * d[12];
      this.y = x * d[1] + y * d[5] + z * d[9] + w * d[13];
      this.z = x * d[2] + y * d[6] + z * d[10] + w * d[14];
      return this;
    }

    /**
     * Transforms `this` with the given matrix.
     * @param mat
     * @return {Vec3} Reference to `this` for chaining.
     */
    selfTransformMat3(mat):Vec3 {
      var x = this.x;
      var y = this.y;
      var z = this.z;
      var d = mat.data;
      this.x = x * d[0] + y * d[3] + z * d[6];
      this.y = x * d[1] + y * d[4] + z * d[7];
      this.z = x * d[2] + y * d[5] + z * d[8];
      return this;
    }

    /**
     * Transforms `this` with the given matrix. The `z` component of `this` keeps untouched.
     * @param mat
     * @return {Vec3} Reference to `this` for chaining.
     */
    selfTransformMat2(mat):Vec3 {
      var x = this.x;
      var y = this.y;
      var d = mat.data;
      this.x = x * d[0] + y * d[2];
      this.y = x * d[1] + y * d[3];
      return this;
    }

    /**
     * Copies the source vector to the destination vector
     * @param src
     * @param dst
     * @return {Vec3} the destination vector.
     */
    static copy(src:IVec3, dst:IVec3):IVec3 {
      dst.x = src.x;
      dst.y = src.y;
      dst.z = src.z;
      return dst;  
    } 
    
    /**
     * Calculates the length of this vector
     * @param vec
     * @return {Number} The length.
     */
    static length(vec:IVec3):number {
      var x = vec.x;
      var y = vec.y;
      var z = vec.z;
      return Math.sqrt(x * x + y * y + z * z);
    }

    /**
     * Calculates the squared length of this vector
     * @param vec
     * @return {Number} The squared length.
     */
    static lengthSquared(vec:IVec3):number {
      var x = vec.x;
      var y = vec.y;
      var z = vec.z;
      return x * x + y * y + z * z;
    }

    /**
     * Calculates the distance to the given vector
     * @param a
     * @param b
     * @return {Number} The distance between the vectors.
     */
    static distance(a:IVec3, b:IVec3):number {
      var x = a.x - b.x;
      var y = a.y - b.y;
      var z = a.z - b.z;
      return Math.sqrt(x * x + y * y + z * z);
    }

    /**
     * Calculates the squared distance to the given vector
     * @param a
     * @param b
     * @return {Number} The squared distance between the vectors.
     */
    static distanceSquared(a:IVec3, b:IVec3):number {
      var x = a.x - b.x;
      var y = a.y - b.y;
      var z = a.z - b.z;
      return x * x + y * y + z * z;
    }

    /**
     * Calculates the dot product with the given vector
     * @param a
     * @param b
     * @return {Number} The dot product.
     */
    static dot(a:IVec3, b:IVec3):number {
      return a.x * b.x + a.y * b.y + a.z * b.z;
    }

    /**
     * Creates a new vector. The method should be called with three or no arguments. If less than three arguments are given
     * then some components of the resulting vector are going to be `undefined`.
     * @param [x] The x component
     * @param [y] The y component
     * @param [z] The z component
     * @return {Vec3} A new vector.
     */
    static create = function (x:number, y:number, z:number):Vec3 {
      if (x != null) {
        return new Vec3(x, y, z);
      }
      return new Vec3(0, 0, 0);
    };

    /**
     * Creates a new vector with all components set to 0.
     * @return {Vec3} A new vector.
     */
    static zero = function ():Vec3 {
      return new Vec3(0, 0, 0);
    };

    /**
     * Creates a new vector with all components set to 1.
     * @return {Vec3} A new vector.
     */
    static one = function ():Vec3 {
      return new Vec3(1, 1, 1);
    };

    /**
     * Normalizes the given vector.
     * @param vec The vector to normalize.
     * @param [out] The vector to write to.
     * @return {Vec3} The given `out` parameter or a new vector.
     */
    static normalize<T extends IVec3>(vec:IVec3, out?:T|Vec3):T|Vec3 {
      var x = vec.x;
      var y = vec.y;
      var z = vec.z;
      var d = 1.0 / Math.sqrt(x * x + y * y + z * z);
      out = out || new Vec3();
      out.x = x * d;
      out.y = y * d;
      out.z = z * d;
      return out;
    }

    /**
     * Calculates the cross product between two vectors.
     * @param vecA The first vector.
     * @param vecB The second vector.
     * @param [out] The vector to write to.
     * @return {Vec3} The given `out` argument or a new vector.
     */
    static cross<T extends IVec3>(vecA:IVec3, vecB:IVec3, out?:T|Vec3):T|Vec3 {
      var x = vecA.y * vecB.z - vecA.z * vecB.y;
      var y = vecA.z * vecB.x - vecA.x * vecB.z;
      var z = vecA.x * vecB.y - vecA.y * vecB.x;
      out = out || new Vec3();
      out.x = x;
      out.y = y;
      out.z = z;
      return out;
    }

    /**
     * Inverts the given vector.
     * @param vec The vector to invert.
     * @param [out] The vector to write to.
     * @return {Vec3} The given `out` parameter or a new vector.
     */
    static invert<T extends IVec3>(vec:IVec3, out?:T|Vec3):T|Vec3 {
      out = out || new Vec3();
      out.x = 1.0 / vec.x;
      out.y = 1.0 / vec.y;
      out.z = 1.0 / vec.z;
      return out;
    }

    /**
     * Negates this vector.
     * @param vec The vector to negate.
     * @param [out] The vector to write to.
     * @return {Vec3} The given `out` parameter or a new vector.
     */
    static negate<T extends IVec3>(vec:IVec3, out?:T|Vec3):T|Vec3 {
      out = out || new Vec3();
      out.x = -vec.x;
      out.y = -vec.y;
      out.z = -vec.z;
      return out;
    }

    /**
     * Adds two vectors.
     * @param vecA The first vector.
     * @param vecB The second vector.
     * @param out The vector to write to.
     * @return {Vec3} The given `out` parameter or a new vector.
     */
    static add<T extends IVec3>(vecA:IVec3, vecB:IVec3, out?:T|Vec3):T|Vec3 {
      out = out || new Vec3();
      out.x = vecA.x + vecB.x;
      out.y = vecA.y + vecB.y;
      out.z = vecA.z + vecB.z;
      return out;
    }

    /**
     * Adds a scalar to each component of a vector.
     * @param vec The first vector.
     * @param scalar The scalar to add.
     * @param [out] The vector to write to.
     * @return {Vec3} The given `out` parameter or a new vector.
     */
    static addScalar<T extends IVec3>(vec:IVec3, scalar:number, out?:T|Vec3):T|Vec3 {
      out = out || new Vec3();
      out.x = vec.x + scalar;
      out.y = vec.y + scalar;
      out.z = vec.z + scalar;
      return out;
    }

    /**
     * Subtracts the second vector from the first.
     * @param vecA The first vector.
     * @param vecB The second vector.
     * @param [out] The vector to write to.
     * @return {Vec3} The given `out` parameter or a new vector.
     */
    static subtract<T extends IVec3>(vecA:IVec3, vecB:IVec3, out?:T|Vec3):T|Vec3 {
      out = out || new Vec3();
      out.x = vecA.x - vecB.x;
      out.y = vecA.y - vecB.y;
      out.z = vecA.z - vecB.z;
      return out;
    }

    /**
     * Subtracts a scalar from each component of a vector.
     * @param vec The first vector.
     * @param scalar The scalar to add.
     * @param [out] The vector to write to.
     * @return {Vec3} The given `out` parameter or a new vector.
     */
    static subtractScalar<T extends IVec3>(vec:IVec3, scalar:number, out?:T|Vec3):T|Vec3 {
      out = out || new Vec3();
      out.x = vec.x - scalar;
      out.y = vec.y - scalar;
      out.z = vec.z - scalar;
      return out;
    }

    /**
     * Multiplies two vectors.
     * @param vecA The first vector.
     * @param vecB The second vector.
     * @param [out] The vector to write to.
     * @return {Vec3} The given `out` parameter or a new vector.
     */
    static multiply<T extends IVec3>(vecA:IVec3, vecB:IVec3, out?:T|Vec3):T|Vec3 {
      out = out || new Vec3();
      out.x = vecA.x * vecB.x;
      out.y = vecA.y * vecB.y;
      out.z = vecA.z * vecB.z;
      return out;
    }

    /**
     * Multiplies a scalar to each component of a vector.
     * @param vec The first vector.
     * @param scalar The scalar to add.
     * @param [out] The vector to write to.
     * @return {Vec3} The given `out` parameter or a new vector.
     */
    static multiplyScalar<T extends IVec3>(vec:IVec3, scalar:number, out?:T|Vec3):T|Vec3 {
      out = out || new Vec3();
      out.x = vec.x * scalar;
      out.y = vec.y * scalar;
      out.z = vec.z * scalar;
      return out;
    }

    /**
     * Divides the components of the first vector by the components of the second vector.
     * @param vecA The first vector.
     * @param vecB The second vector.
     * @param [out] The vector to write to.
     * @return {Vec3} The given `out` parameter or a new vector.
     */
    static divide<T extends IVec3>(vecA:IVec3, vecB:IVec3, out?:T|Vec3):T|Vec3 {
      out = out || new Vec3();
      out.x = vecA.x / vecB.x;
      out.y = vecA.y / vecB.y;
      out.z = vecA.z / vecB.z;
      return out;
    }

    /**
     * Divides the components of the first vector by the scalar.
     * @param vec The first vector.
     * @param scalar The scalar to use for division.
     * @param out The vector to write to.
     * @return {Vec3} The given `out` parameter or a new vector.
     */
    static divideScalar<T extends IVec3>(vec:IVec3, scalar:number, out?:T|Vec3):T|Vec3 {
      scalar = 1 / scalar;
      out = out || new Vec3();
      out.x = vec.x * scalar;
      out.y = vec.y * scalar;
      out.z = vec.z * scalar;
      return out;
    }

    /**
     * Multiplies two vectors and adds the third vector.
     * @param vecA The vector to multiply.
     * @param vecB The vector to multiply.
     * @param add The vector to add on top of the multiplication.
     * @param [out] The vector to write to.
     * @return {Vec3} The given `out` parameter or a new vector.
     */
    static multiplyAdd<T extends IVec3>(vecA:IVec3, vecB:IVec3, add:IVec3, out?:T|Vec3):T|Vec3 {
      out = out || new Vec3();
      out.x = vecA.x * vecB.x + add.x;
      out.y = vecA.y * vecB.y + add.y;
      out.z = vecA.z * vecB.z + add.z;
      return out;
    }

    /**
     * Multiplies a vector with a scalar and adds another vector.
     * @param vecA The vector to multiply.
     * @param mul The scalar to multiply.
     * @param add The vector to add on top of the multiplication.
     * @param [out] The vector to write to.
     * @return {Vec3} The given `out` parameter or a new vector.
     */
    static multiplyScalarAdd<T extends IVec3>(vecA:IVec3, mul:number, add:IVec3, out?:T|Vec3):T|Vec3 {
      out = out || new Vec3();
      out.x = vecA.x * mul + add.x;
      out.y = vecA.y * mul + add.y;
      out.z = vecA.z * mul + add.z;
      return out;
    }

    /**
     * Performs a component wise clamp operation on the the given vector by using the given min and max vectors.
     * @param a The vector to clamp.
     * @param min Vector with the minimum component values.
     * @param max Vector with the maximum component values.
     * @param [out] The vector to write to.
     * @return {Vec3} The given `out` parameter or a new vector.
     */
    static clamp<T extends IVec3>(a:IVec3, min:IVec3, max:IVec3, out?:T|Vec3):T|Vec3 {
      var x = a.x;
      var y = a.y;
      var z = a.z;
      var minX = min.x;
      var minY = min.y;
      var minZ = min.z;
      var maxX = max.x;
      var maxY = max.y;
      var maxZ = max.z;
      out = out || new Vec3();
      out.x = x < minX ? minX : (x > maxX ? maxX : x);
      out.y = y < minY ? minY : (y > maxY ? maxY : y);
      out.z = z < minZ ? minZ : (z > maxZ ? maxZ : z);
      return out;
    }

    /**
     * Performs a component wise clamp operation on the the given vector by using the given min and max scalars.
     * @param a The vector to clamp.
     * @param min The minimum scalar value.
     * @param max The maximum scalar value.
     * @param [out] The vector to write to.
     * @return {Vec3} The given `out` parameter or a new vector.
     */
    static clampScalar<T extends IVec3>(a:IVec3, min:number, max:number, out?:T|Vec3):T|Vec3 {
      var x = a.x;
      var y = a.y;
      var z = a.z;
      out = out || new Vec3();
      out.x = x < min ? min : (x > max ? max : x);
      out.y = y < min ? min : (y > max ? max : y);
      out.z = z < min ? min : (z > max ? max : z);
      return out;
    }

    /**
     * Performs a component wise min operation on the the given vectors.
     * @param a The first vector.
     * @param b The second vector.
     * @param [out] The vector to write to.
     * @return {Vec3} The given `out` parameter or a new vector.
     */
    static min<T extends IVec3>(a:IVec3, b:IVec3, out?:T|Vec3):T|Vec3 {
      var aX = a.x;
      var aY = a.y;
      var aZ = a.z;
      var bX = b.x;
      var bY = b.y;
      var bZ = b.z;
      out = out || new Vec3();
      out.x = aX < bX ? aX : bX;
      out.y = aY < bY ? aY : bY;
      out.z = aZ < bZ ? aZ : bZ;
      return out;
    }

    /**
     * Performs a component wise min operation on the the given vector and a scalar value.
     * @param a The vector.
     * @param scalar The scalar.
     * @param [out] The vector to write to.
     * @return {Vec3} The given `out` parameter or a new vector.
     */
    static minScalar<T extends IVec3>(a:IVec3, scalar:number, out?:T|Vec3):T|Vec3 {
      var x = a.x;
      var y = a.y;
      var z = a.z;
      out = out || new Vec3();
      out.x = x < scalar ? x : scalar;
      out.y = y < scalar ? y : scalar;
      out.z = z < scalar ? z : scalar;
      return out;
    }

    /**
     * Performs a component wise max operation on the the given vectors.
     * @param a The first vector.
     * @param b The second vector.
     * @param [out] The vector to write to.
     * @return {Vec3} The given `out` parameter or a new vector.
     */
    static max<T extends IVec3>(a:IVec3, b:IVec3, out?:T|Vec3):T|Vec3 {
      var aX = a.x;
      var aY = a.y;
      var aZ = a.z;
      var bX = b.x;
      var bY = b.y;
      var bZ = b.z;
      out = out || new Vec3();
      out.x = aX > bX ? aX : bX;
      out.y = aY > bY ? aY : bY;
      out.z = aZ > bZ ? aZ : bZ;
      return out;
    }

    /**
     * Performs a component wise max operation on the the given vector and a scalar value.
     * @param a The vector.
     * @param scalar The scalar.
     * @param [out] The vector to write to.
     * @return {Vec3} The given `out` parameter or a new vector.
     */
    static maxScalar<T extends IVec3>(a:IVec3, scalar:number, out?:T|Vec3):T|Vec3 {
      var x = a.x;
      var y = a.y;
      var z = a.z;
      out = out || new Vec3();
      out.x = x > scalar ? x : scalar;
      out.y = y > scalar ? y : scalar;
      out.z = z > scalar ? z : scalar;
      return out;
    }

    /**
     * Performs a component wise linear interpolation between the given two vectors.
     * @param a The first vector.
     * @param b The second vector.
     * @param t The interpolation value. Assumed to be in range [0:1].
     * @param [out] The vector to write to.
     * @return {Vec3} The given `out` parameter or a new vector.
     */
    static lerp<T extends IVec3>(a:IVec3, b:IVec3, t:number, out?:T|Vec3):T|Vec3 {
      var x = a.x;
      var y = a.y;
      var z = a.z;
      out = out || new Vec3();
      out.x = x + (b.x - x) * t;
      out.y = y + (b.y - y) * t;
      out.z = z + (b.z - z) * t;
      return out;
    }

    /**
     * Performs a component wise barycentric interpolation of the given vectors.
     * @param a The first vector.
     * @param b The second vector.
     * @param c The third vector.
     * @param t1 The first interpolation value. Assumed to be in range [0:1].
     * @param t2 The second interpolation value. Assumed to be in range [0:1].
     * @param [out] The vector to write to.
     * @return {Vec3} The given `out` parameter or a new vector.
     */
    static barycentric<T extends IVec3>(a:IVec3, b:IVec3, c:IVec3, t1:number, t2:number, out?:T|Vec3):T|Vec3 {
      var x = a.x;
      var y = a.y;
      var z = a.z;
      out = out || new Vec3();
      out.x = x + t1 * (b.x - x) + t2 * (c.x - x);
      out.y = y + t1 * (b.y - y) + t2 * (c.y - y);
      out.z = z + t1 * (b.z - z) + t2 * (c.z - z);
      return out;
    }

    /**
     * Performs a component wise smooth interpolation between the given two vectors.
     * @param a The first vector.
     * @param b The second vector.
     * @param t The interpolation value. Assumed to be in range [0:1].
     * @param [out] The vector to write to.
     * @return {Vec3} The given `out` parameter or a new vector.
     */
    static smooth<T extends IVec3>(a:IVec3, b:IVec3, t:number, out?:T|Vec3):T|Vec3 {
      t = ((t > 1) ? 1 : ((t < 0) ? 0 : t));
      t = t * t * (3 - 2 * t);
      var x = a.x;
      var y = a.y;
      var z = a.z;
      out = out || new Vec3();
      out.x = x + (b.x - x) * t;
      out.y = y + (b.y - y) * t;
      out.z = z + (b.z - z) * t;
      return out;
    }

    /**
     * Tries to converts the given data to a vector
     * @param {Vec2|Vec3|Vec4|Quat|Array|number} data
     * @return {Vec3}
     */
    static convert(data:any):Vec3 {

      if (Array.isArray(data)) {
        return new Vec3(
          data[0] || 0,
          data[1] || 0,
          data[2] || 0
        );
      }
      if (typeof data === 'number') {
        return new Vec3(data, data, data);
      }
      return new Vec3(
        data.x || 0,
        data.y || 0,
        data.z || 0
      );
    }

    static prettyString(vec) {
      return [vec.x.toFixed(5), vec.y.toFixed(5), vec.z.toFixed(5)].join(', ');
    }
  }
}
