module Glib {

  let keys = ['x', 'y', 'z', 'w']
  let keyLookup = { 
    0: 'x', 1: 'y', 2: 'z', 3: 'w',
    'x': 'x', 'y': 'y', 'z': 'z', 'w': 'w' 
  }

  /**
   * Describes a vector with four components.
   */
  export class Vec4 implements IVec2, IVec3, IVec4 {
    /**
     * The X component
     */
    x:number
    /**
     * The Y component
     */
    y:number
    /**
     * The Z component
     */
    z:number
    /**
     * The W component
     */
    w:number

    /**
     * Initializes a new vector
     * @param x Value for the X component
     * @param y Value for the Y component
     * @param z Value for the Z component
     * @param w Value for the W component
     */
    constructor(x?:number, y?:number, z?:number, w?:number) {
      this.x = x == null ? 0 : x
      this.y = y == null ? 0 : y
      this.z = z == null ? 0 : z
      this.w = w == null ? 0 : w
    }

    /**
     * Sets the X component
     */
    setX(value:number):Vec4 {
      this.x = value
      return this
    }
    /**
     * Sets the Y component
     */
    setY(value:number):Vec4 {
      this.y = value
      return this
    }
    /**
     * Sets the Z component
     */
    setZ(value:number):Vec4 {
      this.z = value
      return this
    }
    /**
     * Sets the W component
     */
    setW(value:number):Vec4 {
      this.w = value
      return this
    }
    /**
     * Sets the component by using an index (or name)
     */
    set(key: number|string, value:number):Vec4 {
      this[keyLookup[key]] = value
      return this
    }
    /**
     * Gets the component by using an index (or name)
     */
    get(key: number|string):number {
      return this[keyLookup[key]]
    }

    /**
     * Initializes the components of this vector with given values.
     * @param x value for X component
     * @param y value for Y component
     * @param z value for Z component
     * @param w value for W component
     * @return this vector for chaining
     */
    init(x:number, y:number, z:number, w:number):Vec4 {
      this.x = x
      this.y = y
      this.z = z
      this.w = w
      return this
    }

    /**
     * Initializes the components of this vector by taking the components from the given vector.
     * @param other The vector to read from
     * @return this vector for chaining
     */
    initFrom(other:IVec4):Vec4 {
      this.x = other.x
      this.y = other.y
      this.z = other.z
      this.w = other.w
      return this
    }

    /**
     * Initializes the components of this vector by taking values from the given array in successive order.
     * @param buffer The array to read from
     * @param [offset=0] The zero based index at which start reading the values
     * @return this vector for chaining
     */
    initFromBuffer(buffer:ArrayLike<number>, offset:number=0):Vec4 {
      this.x = buffer[offset]
      this.y = buffer[offset + 1]
      this.z = buffer[offset + 2]
      this.w = buffer[offset + 3]
      return this
    }

    /**
     * Creates a copy of this vector
     * @return The cloned vector
     */
    clone<T extends IVec4>(out?:T):T {
      out = (out || new Vec4()) as any
      out.x = this.x
      out.y = this.y
      out.z = this.z
      out.w = this.w
      return out
    }
    
    /**
     * Copies the components successively into the given array.
     * @param buffer The array to copy into
     * @param [offset=0] Zero based index where to start writing in the array
     * @return the given buffer parameter
     */
    copyTo<T extends ArrayLike<number>>(buffer:T, offset:number=0):T {
      buffer[offset] = this.x
      buffer[offset + 1] = this.y
      buffer[offset + 2] = this.z
      buffer[offset + 3] = this.w
      return buffer
    }

    /**
     * Checks for component wise equality with given vector
     * @param other The vector to compare with
     * @return true if components are equal, false otherwise
     */
    equals(other:IVec4):boolean {
      return ((this.x === other.x) && (this.y === other.y) && (this.z === other.z) && (this.w === other.w))
    }

    /**
     * Calculates the length of this vector
     * @return The length.
     */
    length():number {
      var x = this.x
      var y = this.y
      var z = this.z
      var w = this.w
      return Math.sqrt(x * x + y * y + z * z + w * w)
    }

    /**
     * Calculates the squared length of this vector
     * @return The squared length.
     */
    lengthSquared():number {
      var x = this.x
      var y = this.y
      var z = this.z
      var w = this.w
      return x * x + y * y + z * z + w * w
    }

    /**
     * Calculates the distance to the `other` vector
     * @param other The distant vector
     * @return The distance between the vectors.
     */
    distance(other:IVec4):number {
      var x = this.x - other.x
      var y = this.y - other.y
      var z = this.z - other.z
      var w = this.w - other.w
      return Math.sqrt(x * x + y * y + z * z + w * w)
    }

    /**
     * Calculates the squared distance to the `other` vector
     * @param other The distant vector
     * @return The squared distance between the vectors.
     */
    distanceSquared(other:IVec4):number {
      var x = this.x - other.x
      var y = this.y - other.y
      var z = this.z - other.z
      var w = this.w - other.w
      return x * x + y * y + z * z + w * w
    }

    /**
     * Calculates the dot product with the `other` vector
     * @param other
     * @return The dot product.
     */
    dot(other:IVec4):number {
      return this.x * other.x + this.y * other.y + this.z * other.z + this.w * other.w
    }

    /**
     * Normalizes `this` vector. Applies the result to `this` vector.
     * @return this vector for chaining
     */
    normalize():Vec4 {
      var x = this.x
      var y = this.y
      var z = this.z
      var w = this.w
      var d = 1.0 / Math.sqrt(x * x + y * y + z * z + w * w)
      this.x *= d
      this.y *= d
      this.z *= d
      this.w *= d
      return this
    }
    /**
     * Normalizes this vector. Applies the result to `out` vector.
     * @return the `out` parameter or new vector
     */
    normalizeOut<T extends IVec4>(out?:T):T {
      out = (out || new Vec4()) as any
      var x = this.x
      var y = this.y
      var z = this.z
      var w = this.w
      var d = 1.0 / Math.sqrt(x * x + y * y + z * z + w * w)
      out.x = this.x * d
      out.y = this.y * d
      out.z = this.z * d
      out.w = this.w * d
      return out
    }

    /**
     * Inverts this vector.
     * @return this vector for chaining
     */
    invert():Vec4 {
      this.x = 1.0 / this.x
      this.y = 1.0 / this.y
      this.z = 1.0 / this.z
      this.w = 1.0 / this.w
      return this
    }
    /**
     * Inverts this vector. Applies the result to `out` vector.
     * @return the `out` parameter or new vector
     */
    invertOut<T extends IVec4>(out?:T):T {
      out = (out || new Vec4()) as any
      out.x = 1.0 / this.x
      out.y = 1.0 / this.y
      out.z = 1.0 / this.z
      out.w = 1.0 / this.w
      return out
    }

    /**
     * Negates the components of `this` vector. Applies the result to `this`
     * @return this vector for chaining
     */
    negate():Vec4 {
      this.x = -this.x
      this.y = -this.y
      this.z = -this.z
      this.w = -this.w
      return this
    }
    /**
     * Negates the components of `this` vector. Applies the result to `out`
     * @return the `out` parameter or new vector
     */
    negateOut<T extends IVec4>(out?:T):T {
      out = (out || new Vec4()) as any
      out.x = -this.x
      out.y = -this.y
      out.z = -this.z
      out.w = -this.w
      return out
    }

    /**
     * Performs the calculation `this += other * scale`
     * @param other The vector to add
     * @return this vector for chaining
     */
    addScaled(other:IVec4, scale:number):Vec4 {
      this.x += other.x * scale
      this.y += other.y * scale
      this.z += other.z * scale
      this.w += other.w * scale
      return this
    }

    /**
     * Performs the calculation `this += other`
     * @param other The vector to add
     * @return this vector for chaining
     */
    add(other:IVec4):Vec4 {
      this.x += other.x
      this.y += other.y
      this.z += other.z
      this.w += other.w
      return this
    }
    /**
     * Performs the calculation `out = this + other`
     * @param other The vector to add
     * @return the `out` parameter or new vector
     */
    addOut<T extends IVec4>(other:IVec4, out?:T):T {
      out = (out || new Vec4()) as any
      out.x = this.x + other.x
      out.y = this.y + other.y
      out.z = this.z + other.z
      out.w = this.w + other.w
      return out
    }

    /**
     * Performs the calculation `this += scalar`
     * @param scalar The value to add
     * @return this vector for chaining
     */
    addScalar(scalar:number):Vec4 {
      this.x += scalar
      this.y += scalar
      this.z += scalar
      this.w += scalar
      return this
    }
    /**
     * Performs the calculation `out = this + scalar`
     * @param scalar The value to add
     * @return the `out` parameter or new vector
     */
    addScalarOut<T extends IVec4>(scalar:number, out?:T):T {
      out = (out || new Vec4()) as any
      out.x = this.x + scalar
      out.y = this.y + scalar
      out.z = this.z + scalar
      out.w = this.w + scalar
      return out
    }


    /**
     * Performs the calculation `this -= other * scale`
     * @param other The vector to subtract
     * @param scale The value to multoply to `other`
     * @return this vector for chaining
     */
    subtractScaled(other:IVec4, scale:number):Vec4 {
      this.x -= other.x * scale
      this.y -= other.y * scale
      this.z -= other.z * scale
      this.w -= other.w * scale
      return this
    }
    /**
     * Performs the calculation `this -= other`
     * @param other The vector to subtract
     * @return this vector for chaining
     */
    subtract(other:IVec4):Vec4 {
      this.x -= other.x
      this.y -= other.y
      this.z -= other.z
      this.w -= other.w
      return this
    }
    /**
     * Performs the calculation `out = this - other`
     * @param other The vector to subtract
     * @return the `out` parameter or new vector
     */
    subtractOut<T extends IVec4>(other:IVec4, out?:T):T {
      out = (out || new Vec4()) as any
      out.x = this.x - other.x
      out.y = this.y - other.y
      out.z = this.z - other.z
      out.w = this.w - other.w
      return out
    }

    /**
     * Performs the calculation `this -= scalar`
     * @param scalar The value to subtract
     * @return this vector for chaining
     */
    subtractScalar(scalar:number):Vec4 {
      this.x -= scalar
      this.y -= scalar
      this.z -= scalar
      this.w -= scalar
      return this
    }
    /**
     * Performs the calculation `out = this - scalar`
     * @param scalar The value to subtract
     * @return the `out` parameter or new vector
     */
    subtractScalarOut<T extends IVec4>(scalar:number, out?:T):T {
      out = (out || new Vec4()) as any
      out.x = this.x - scalar
      out.y = this.y - scalar
      out.z = this.z - scalar
      out.w = this.w - scalar
      return out
    }

    /**
     * Performs the calculation `this *= other`
     * @param other The vector to multiply
     * @return this vector for chaining
     */
    multiply(other:IVec4):Vec4 {
      this.x *= other.x
      this.y *= other.y
      this.z *= other.z
      this.w *= other.w
      return this
    }
    /**
     * Performs the calculation `out = this * other`
     * @param other The vector to multiply
     * @return the `out` parameter or new vector
     */
    multiplyOut<T extends IVec4>(other:IVec4, out?:T):T {
      out = (out || new Vec4()) as any
      out.x = this.x * other.x
      out.y = this.y * other.y
      out.z = this.z * other.z
      out.w = this.w * other.w
      return out
    }

    /**
     * Performs the calculation `this *= scalar`
     * @param scalar The value to multiply
     * @return this vector for chaining
     */
    multiplyScalar(scalar:number):Vec4 {
      this.x *= scalar
      this.y *= scalar
      this.z *= scalar
      this.w *= scalar
      return this
    }
    /**
     * Performs the calculation `out = this * scalar`
     * @param scalar The value to multiply
     * @return the `out` parameter or new vector
     */
    multiplyScalarOut<T extends IVec4>(scalar:number, out?:T):T {
      out = (out || new Vec4()) as any
      out.x = this.x * scalar
      out.y = this.y * scalar
      out.z = this.z * scalar
      out.w = this.w * scalar
      return out
    }

    /**
     * Performs the calculation `this /= other`
     * @param other The vector to divide
     * @return this vector for chaining
     */
    divide(other:IVec4):Vec4 {
      this.x /= other.x
      this.y /= other.y
      this.z /= other.z
      this.w /= other.w
      return this
    }
    /**
     * Performs the calculation `out = this / other`
     * @param other The vector to divide
     * @return the `out` parameter or new vector
     */
    divideOut<T extends IVec4>(other:IVec4, out?:T):T {
      out = (out || new Vec4()) as any
      out.x = this.x / other.x
      out.y = this.y / other.y
      out.z = this.z / other.z
      out.w = this.w / other.w
      return out
    }

    /**
     * Performs the calculation `this *= (1 / scalar)`
     * @param scalar The value to divide
     * @return this vector for chaining
     */
    divideScalar(scalar:number):Vec4 {
      scalar = 1.0 / scalar
      this.x *= scalar
      this.y *= scalar
      this.z *= scalar
      this.w *= scalar
      return this
    }
    /**
     * Performs the calculation `out = this * (1 / scalar)`
     * @param scalar The value to divide
     * @return the `out` parameter or new vector
     */
    divideScalarOut<T extends IVec4>(scalar:number, out?:T):T {
      out = (out || new Vec4()) as any
      scalar = 1.0 / scalar
      out.x = this.x * scalar
      out.y = this.y * scalar
      out.z = this.z * scalar
      out.w = this.w * scalar
      return out
    }

    /**
     * Performs the calculation `this = this * a + b`
     * @param a The vector to multiply.
     * @param b The vector to add on top of the multiplication.
     * @return this vector for chaining
     */
    multiplyAdd(a:IVec4, b:IVec4):Vec4 {
      this.x = this.x * a.x + b.x
      this.y = this.y * a.y + b.y
      this.z = this.z * a.z + b.z
      this.w = this.w * a.w + b.w
      return this
    }

    /**
     * Transforms `this` with the given quaternion. The `w` component of `this` keeps untouched.
     * @param quat
     * @return this vector for chaining
     */
    transformQuat(quat:IVec4):Vec4 {
      var x = quat.x
      var y = quat.y
      var z = quat.z
      var w = quat.w

      var x2 = x + x
      var y2 = y + y
      var z2 = z + z

      var wx2 = w * x2
      var wy2 = w * y2
      var wz2 = w * z2

      var xx2 = x * x2
      var xy2 = x * y2
      var xz2 = x * z2

      var yy2 = y * y2
      var yz2 = y * z2
      var zz2 = y * z2

      var vx = this.x
      var vy = this.y
      var vz = this.z

      this.x = vx * (1 - yy2 - zz2) + vy * (xy2 - wz2) + vz * (xz2 + wy2)
      this.y = vx * (xy2 + wz2) + vy * (1 - xx2 - zz2) + vz * (yz2 - wx2)
      this.z = vx * (xz2 - wy2) + vy * (yz2 + wx2) + vz * (1 - xx2 - yy2)
      return this
    }

    /**
     * Transforms `this` with the given matrix.
     * @param mat
     * @return this vector for chaining
     */
    transformMat4(mat):Vec4 {
      var x = this.x
      var y = this.y
      var z = this.z
      var w = this.w
      var d = mat.data
      this.x = x * d[0] + y * d[4] + z * d[8] + w * d[12]
      this.y = x * d[1] + y * d[5] + z * d[9] + w * d[13]
      this.z = x * d[2] + y * d[6] + z * d[10] + w * d[14]
      this.w = x * d[3] + y * d[7] + z * d[11] + w * d[15]
      return this
    }

    /**
     * Transforms `this` with the given matrix. The `w` component of `this` is set to 1.
     * @param mat
     * @return this vector for chaining
     */
    transformMat3(mat):Vec4 {
      var x = this.x
      var y = this.y
      var z = this.z
      var d = mat.data
      this.x = x * d[0] + y * d[3] + z * d[6]
      this.y = x * d[1] + y * d[4] + z * d[7]
      this.z = x * d[2] + y * d[5] + z * d[8]
      this.w = 1
      return this
    }

    /**
     * Transforms `this` with the given matrix. The `z` and `w` components of `this` keep untouched.
     * @param mat
     * @return this vector for chaining
     */
    transformMat2(mat):Vec4 {
      var x = this.x
      var y = this.y
      var d = mat.data
      this.x = x * d[0] + y * d[2]
      this.y = x * d[1] + y * d[3]
      return this
    }

    /**
     * Readonly vector with all components set to one
     */
    static One = Object.freeze(new Vec4(1, 1, 1, 1))
    /**
     * Readonly vector with all components set to zero
     */
    static Zero = Object.freeze(new Vec4(0, 0, 0, 0))
    /**
     * Readonly vector x component set to one
     */
    static UnitX = Object.freeze(new Vec4(1, 0, 0, 0))
    /**
     * Readonly vector y component set to one
     */
    static UnitY = Object.freeze(new Vec4(0, 1, 0, 0))
    /**
     * Readonly vector z component set to one
     */
    static UnitZ = Object.freeze(new Vec4(0, 0, 1, 0))
    /**
     * Readonly vector w component set to one
     */
    static UnitW = Object.freeze(new Vec4(0, 0, 0, 1))

    /**
     * Creates a new vector.
     * @param [x] The x component
     * @param [y] The y component
     * @param [z] The z component
     * @param [w] The w component
     * @return A new vector.
     */
    static create(x?:number, y?:number, z?:number, w?:number):Vec4 {
      return new Vec4(x, y, z, w)
    }

    /**
     * Creates a new vector with all components set to 0.
     * @return A new vector.
     */
    static zero():Vec4 {
      return new Vec4(0, 0, 0, 0);
    }

    /**
     * Creates a new vector with all components set to 1.
     * @return A new vector.
     */
    static one():Vec4 {
      return new Vec4(1, 1, 1, 1);
    }
    
    /**
     * Copies the source vector to the destination vector
     * @param src
     * @param dst
     * @return the destination vector.
     */
    static copy(src:IVec4, dst:IVec4):IVec4 {
      dst.x = src.x
      dst.y = src.y
      dst.z = src.z
      dst.w = src.w
      return dst  
    } 
    
    /**
     * Calculates the length of this vector
     * @param vec
     * @return The length.
     */
    static length(vec:IVec4):number {
      var x = vec.x
      var y = vec.y
      var z = vec.z
      var w = vec.w
      return Math.sqrt(x * x + y * y + z * z + w * w)
    }

    /**
     * Calculates the squared length of this vector
     * @param vec
     * @return The squared length.
     */
    static lengthSquared(vec:IVec4):number {
      var x = vec.x
      var y = vec.y
      var z = vec.z
      var w = vec.w
      return x * x + y * y + z * z + w * w
    }

    /**
     * Calculates the distance to the given vector
     * @param a
     * @param b
     * @return The distance between the vectors.
     */
    static distance(a:IVec4, b:IVec4):number {
      var x = a.x - b.x
      var y = a.y - b.y
      var z = a.z - b.z
      var w = a.w - b.w
      return Math.sqrt(x * x + y * y + z * z + w * w)
    }

    /**
     * Calculates the squared distance to the given vector
     * @param a
     * @param b
     * @return The squared distance between the vectors.
     */
    static distanceSquared(a:IVec4, b:IVec4):number {
      var x = a.x - b.x
      var y = a.y - b.y
      var z = a.z - b.z
      var w = a.w - b.w
      return x * x + y * y + z * z + w * w
    }

    /**
     * Calculates the dot product with the given vector
     * @param a
     * @param b
     * @return The dot product.
     */
    static dot(a:IVec4, b:IVec4):number {
      return a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w
    }

    /**
     * Normalizes the given vector.
     * @param vec The vector to normalize.
     * @param [out] The vector to write to.
     * @return The given `out` parameter or a new vector.
     */
    static normalize<T extends IVec4>(vec:IVec4, out?:T):T {
      out = (out || new Vec4()) as any
      var x = vec.x
      var y = vec.y
      var z = vec.z
      var w = vec.w
      var d = 1.0 / Math.sqrt(x * x + y * y + z * z + w * w)
      out.x = x * d
      out.y = y * d
      out.z = z * d
      out.w = w * d
      return out
    }

    /**
     * Inverts the given vector.
     * @param vec The vector to invert.
     * @param [out] The vector to write to.
     * @return The given `out` parameter or a new vector.
     */
    static invert<T extends IVec4>(vec:IVec4, out?:T):T {
      out = (out || new Vec4()) as any
      out.x = 1.0 / vec.x
      out.y = 1.0 / vec.y
      out.z = 1.0 / vec.z
      out.w = 1.0 / vec.w
      return out
    }

    /**
     * Negates this vector.
     * @param vec The vector to negate.
     * @param [out] The vector to write to.
     * @return The given `out` parameter or a new vector.
     */
    static negate<T extends IVec4>(vec:IVec4, out?:T):T {
      out = (out || new Vec4()) as any
      out.x = -vec.x
      out.y = -vec.y
      out.z = -vec.z
      out.w = -vec.w
      return out
    }

    /**
     * Adds two vectors.
     * @param vecA The first vector.
     * @param vecB The second vector.
     * @param out The vector to write to.
     * @return The given `out` parameter or a new vector.
     */
    static add<T extends IVec4>(vecA:IVec4, vecB:IVec4, out?:T):T {
      out = (out || new Vec4()) as any
      out.x = vecA.x + vecB.x
      out.y = vecA.y + vecB.y
      out.z = vecA.z + vecB.z
      out.w = vecA.w + vecB.w
      return out
    }

    /**
     * Adds a scalar to each component of a vector.
     * @param vec The first vector.
     * @param scalar The scalar to add.
     * @param [out] The vector to write to.
     * @return The given `out` parameter or a new vector.
     */
    static addScalar<T extends IVec4>(vec:IVec4, scalar:number, out?:T):T {
      out = (out || new Vec4()) as any
      out.x = vec.x + scalar
      out.y = vec.y + scalar
      out.z = vec.z + scalar
      out.w = vec.w + scalar
      return out
    }

    /**
     * Subtracts the second vector from the first.
     * @param vecA The first vector.
     * @param vecB The second vector.
     * @param [out] The vector to write to.
     * @return The given `out` parameter or a new vector.
     */
    static subtract<T extends IVec4>(vecA:IVec4, vecB:IVec4, out?:T):T {
      out = (out || new Vec4()) as any
      out.x = vecA.x - vecB.x
      out.y = vecA.y - vecB.y
      out.z = vecA.z - vecB.z
      out.w = vecA.w - vecB.w
      return out
    }

    /**
     * Subtracts a scalar from each component of a vector.
     * @param vec The first vector.
     * @param scalar The scalar to add.
     * @param [out] The vector to write to.
     * @return The given `out` parameter or a new vector.
     */
    static subtractScalar<T extends IVec4>(vec:IVec4, scalar:number, out?:T):T {
      out = (out || new Vec4()) as any
      out.x = vec.x - scalar
      out.y = vec.y - scalar
      out.z = vec.z - scalar
      out.w = vec.w - scalar
      return out
    }

    /**
     * Multiplies two vectors.
     * @param vecA The first vector.
     * @param vecB The second vector.
     * @param [out] The vector to write to.
     * @return The given `out` parameter or a new vector.
     */
    static multiply<T extends IVec4>(vecA:IVec4, vecB:IVec4, out?:T):T {
      out = (out || new Vec4()) as any
      out.x = vecA.x * vecB.x
      out.y = vecA.y * vecB.y
      out.z = vecA.z * vecB.z
      out.w = vecA.w * vecB.w
      return out
    }

    /**
     * Multiplies a scalar to each component of a vector.
     * @param vec The first vector.
     * @param scalar The scalar to add.
     * @param [out] The vector to write to.
     * @return The given `out` parameter or a new vector.
     */
    static multiplyScalar<T extends IVec4>(vec:IVec4, scalar:number, out?:T):T {
      out = (out || new Vec4()) as any
      out.x = vec.x * scalar
      out.y = vec.y * scalar
      out.z = vec.z * scalar
      out.w = vec.w * scalar
      return out
    }

    /**
     * Divides the components of the first vector by the components of the second vector.
     * @param vecA The first vector.
     * @param vecB The second vector.
     * @param [out] The vector to write to.
     * @return The given `out` parameter or a new vector.
     */
    static divide<T extends IVec4>(vecA:IVec4, vecB:IVec4, out?:T):T {
      out = (out || new Vec4()) as any
      out.x = vecA.x / vecB.x
      out.y = vecA.y / vecB.y
      out.z = vecA.z / vecB.z
      out.w = vecA.w / vecB.w
      return out
    }

    /**
     * Divides the components of the first vector by the scalar.
     * @param vec The first vector.
     * @param scalar The scalar to use for division.
     * @param out The vector to write to.
     * @return The given `out` parameter or a new vector.
     */
    static divideScalar<T extends IVec4>(vec:IVec4, scalar:number, out?:T):T {
      out = (out || new Vec4()) as any
      scalar = 1.0 / scalar
      out.x = vec.x * scalar
      out.y = vec.y * scalar
      out.z = vec.z * scalar
      out.w = vec.w * scalar
      return out
    }

    /**
     * Multiplies two vectors and adds the third vector.
     * @param vecA The vector to multiply.
     * @param vecB The vector to multiply.
     * @param add The vector to add on top of the multiplication.
     * @param [out] The vector to write to.
     * @return The given `out` parameter or a new vector.
     */
    static multiplyAdd<T extends IVec4>(vecA:IVec4, vecB:IVec4, add:IVec4, out?:T):T {
      out = (out || new Vec4()) as any
      out.x = vecA.x * vecB.x + add.x
      out.y = vecA.y * vecB.y + add.y
      out.z = vecA.z * vecB.z + add.z
      out.w = vecA.w * vecB.w + add.w
      return out
    }

    /**
     * Multiplies a vector with a scalar and adds another vector.
     * @param vecA The vector to multiply.
     * @param mul The scalar to multiply.
     * @param add The vector to add on top of the multiplication.
     * @param [out] The vector to write to.
     * @return The given `out` parameter or a new vector.
     */
    static multiplyScalarAdd<T extends IVec4>(vecA:IVec4, mul:number, add:IVec4, out?:T):T {
      out = (out || new Vec4()) as any
      out.x = vecA.x * mul + add.x
      out.y = vecA.y * mul + add.y
      out.z = vecA.z * mul + add.z
      out.w = vecA.w * mul + add.w
      return out
    }

    /**
     * Performs a component wise clamp operation on the the given vector by using the given min and max vectors.
     * @param a The vector to clamp.
     * @param min Vector with the minimum component values.
     * @param max Vector with the maximum component values.
     * @param [out] The vector to write to.
     * @return The given `out` parameter or a new vector.
     */
    static clamp<T extends IVec4>(a:IVec4, min:IVec4, max:IVec4, out?:T):T {
      out = (out || new Vec4()) as any
      var x = a.x
      var y = a.y
      var z = a.z
      var w = a.w
      var minX = min.x
      var minY = min.y
      var minZ = min.z
      var minW = min.w
      var maxX = max.x
      var maxY = max.y
      var maxZ = max.z
      var maxW = max.w
      out.x = x < minX ? minX : (x > maxX ? maxX : x)
      out.y = y < minY ? minY : (y > maxY ? maxY : y)
      out.z = z < minZ ? minZ : (z > maxZ ? maxZ : z)
      out.w = w < minW ? minW : (w > maxW ? maxW : w)
      return out
    }

    /**
     * Performs a component wise clamp operation on the the given vector by using the given min and max scalars.
     * @param a The vector to clamp.
     * @param min The minimum scalar value.
     * @param max The maximum scalar value.
     * @param [out] The vector to write to.
     * @return The given `out` parameter or a new vector.
     */
    static clampScalar<T extends IVec4>(a:IVec4, min:number, max:number, out?:T):T {
      out = (out || new Vec4()) as any
      var x = a.x
      var y = a.y
      var z = a.z
      var w = a.w
      out.x = x < min ? min : (x > max ? max : x)
      out.y = y < min ? min : (y > max ? max : y)
      out.z = z < min ? min : (z > max ? max : z)
      out.w = w < min ? min : (w > max ? max : w)
      return out
    }

    /**
     * Performs a component wise min operation on the the given vectors.
     * @param a The first vector.
     * @param b The second vector.
     * @param [out] The vector to write to.
     * @return The given `out` parameter or a new vector.
     */
    static min<T extends IVec4>(a:IVec4, b:IVec4, out?:T):T {
      out = (out || new Vec4()) as any
      var aX = a.x
      var aY = a.y
      var aZ = a.z
      var aW = a.w
      var bX = b.x
      var bY = b.y
      var bZ = b.z
      var bW = b.w
      out.x = aX < bX ? aX : bX
      out.y = aY < bY ? aY : bY
      out.z = aZ < bZ ? aZ : bZ
      out.w = aW < bW ? aW : bW
      return out
    }

    /**
     * Performs a component wise min operation on the the given vector and a scalar value.
     * @param a The vector.
     * @param scalar The scalar.
     * @param [out] The vector to write to.
     * @return The given `out` parameter or a new vector.
     */
    static minScalar<T extends IVec4>(a:IVec4, scalar:number, out?:T):T {
      out = (out || new Vec4()) as any
      var x = a.x
      var y = a.y
      var z = a.z
      var w = a.w
      out.x = x < scalar ? x : scalar
      out.y = y < scalar ? y : scalar
      out.z = z < scalar ? z : scalar
      out.w = w < scalar ? w : scalar
      return out
    }

    /**
     * Performs a component wise max operation on the the given vectors.
     * @param a The first vector.
     * @param b The second vector.
     * @param [out] The vector to write to.
     * @return The given `out` parameter or a new vector.
     */
    static max<T extends IVec4>(a:IVec4, b:IVec4, out?:T):T {
      out = (out || new Vec4()) as any
      var aX = a.x
      var aY = a.y
      var aZ = a.z
      var aW = a.w
      var bX = b.x
      var bY = b.y
      var bZ = b.z
      var bW = b.w
      out.x = aX > bX ? aX : bX
      out.y = aY > bY ? aY : bY
      out.z = aZ > bZ ? aZ : bZ
      out.w = aW > bW ? aW : bW
      return out
    }

    /**
     * Performs a component wise max operation on the the given vector and a scalar value.
     * @param a The vector.
     * @param scalar The scalar.
     * @param [out] The vector to write to.
     * @return The given `out` parameter or a new vector.
     */
    static maxScalar<T extends IVec4>(a:IVec4, scalar:number, out?:T):T {
      out = (out || new Vec4()) as any
      var x = a.x
      var y = a.y
      var z = a.z
      var w = a.w
      out.x = x > scalar ? x : scalar
      out.y = y > scalar ? y : scalar
      out.z = z > scalar ? z : scalar
      out.w = w > scalar ? w : scalar
      return out
    }

    /**
     * Performs a component wise linear interpolation between the given two vectors.
     * @param a The first vector.
     * @param b The second vector.
     * @param t The interpolation value. Assumed to be in range [0:1].
     * @param [out] The vector to write to.
     * @return The given `out` parameter or a new vector.
     */
    static lerp<T extends IVec4>(a:IVec4, b:IVec4, t:number, out?:T):T {
      out = (out || new Vec4()) as any
      var x = a.x
      var y = a.y
      var z = a.z
      var w = a.w
      out.x = x + (b.x - x) * t
      out.y = y + (b.y - y) * t
      out.z = z + (b.z - z) * t
      out.w = w + (b.w - w) * t
      return out
    }

    /**
     * Performs a component wise barycentric interpolation of the given vectors.
     * @param a The first vector.
     * @param b The second vector.
     * @param c The third vector.
     * @param t1 The first interpolation value. Assumed to be in range [0:1].
     * @param t2 The second interpolation value. Assumed to be in range [0:1].
     * @param [out] The vector to write to.
     * @return The given `out` parameter or a new vector.
     */
    static barycentric<T extends IVec4>(a:IVec4, b:IVec4, c:IVec4, t1:number, t2:number, out?:T):T {
      out = (out || new Vec4()) as any
      var x = a.x
      var y = a.y
      var z = a.z
      var w = a.w
      out.x = x + t1 * (b.x - x) + t2 * (c.x - x)
      out.y = y + t1 * (b.y - y) + t2 * (c.y - y)
      out.z = z + t1 * (b.z - z) + t2 * (c.z - z)
      out.w = w + t1 * (b.w - w) + t2 * (c.w - w)
      return out
    }

    /**
     * Performs a component wise smooth interpolation between the given two vectors.
     * @param a The first vector.
     * @param b The second vector.
     * @param t The interpolation value. Assumed to be in range [0:1].
     * @param [out] The vector to write to.
     * @return The given `out` parameter or a new vector.
     */
    static smooth<T extends IVec4>(a:IVec4, b:IVec4, t:number, out?:T):T {
      out = (out || new Vec4()) as any
      t = ((t > 1) ? 1 : ((t < 0) ? 0 : t))
      t = t * t * (3 - 2 * t)
      var x = a.x
      var y = a.y
      var z = a.z
      var w = a.w
      out.x = x + (b.x - x) * t
      out.y = y + (b.y - y) * t
      out.z = z + (b.z - z) * t
      out.w = w + (b.w - w) * t
      return out
    }

    /**
     * Tries to converts the given data to a vector
     * @param {Vec2|Vec3|Vec4|Quat|Array|number} data
     * @return
     */
    static convert(data:any):Vec4 {
      if (typeof data === 'number') {
        return new Vec4(data, data, data, data);
      }
      if (Array.isArray(data)) {
        return new Vec4(
          data[0] || 0,
          data[1] || 0,
          data[2] || 0,
          data[3] || 0
        );
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
