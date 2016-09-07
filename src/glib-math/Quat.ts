module Glib {

  /**
   * Describes a quaternion.
   */
  export class Quat implements IVec2, IVec3, IVec4 {
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
     * Initializes a new quaternion
     * @param x Value for the X component
     * @param y Value for the Y component
     * @param z Value for the Z component
     * @param w Value for the W component
     */
    constructor(x?:number, y?:number, z?:number, w?:number) {
      this.x = x || 0
      this.y = y || 0
      this.z = z || 0
      this.w = w || 0
    }

    /**
     * Initializes components of the quaternion with given values.
     * @param x value for X component
     * @param y value for Y component
     * @param z value for Z component
     * @param w value for W component
     * @return Reference to `this` for chaining.
     */
    init(x:number, y:number, z:number, w:number):Quat {
      this.x = x
      this.y = y
      this.z = z
      this.w = w
      return this
    }

    /**
     * Initializes the quaternion with `x`, `y` and `z` components set to `0` and `w` component set to `1`.
     * @return Reference to `this` for chaining.
     */
    initIdentity():Quat {
      this.y = 0
      this.x = 0
      this.z = 0
      this.w = 1
      return this
    }

    /**
     * Initializes the quaternion with all components set to `0`.
     * @return Reference to `this` for chaining.
     */
    initZero():Quat {
      this.x = 0
      this.y = 0
      this.z = 0
      this.w = 0
      return this
    }

    /**
     * Initializes the components of this quaternion by taking the components from the given quaternion or vector.
     * @param other
     * @return Reference to `this` for chaining.
     */
    initFrom(other:IVec4):Quat {
      this.x = other.x
      this.y = other.y
      this.z = other.z
      this.w = other.w
      return this
    }

    /**
     * Initializes the components of this quaternion by taking values from the given array in successive order.
     * @param buffer The array to read from
     * @param [offset=0] The zero based index at which start reading the values
     * @return Reference to `this` for chaining.
     */
    initFromBuffer(buffer:ArrayLike<number>, offset:number=0):Quat {
      this.x = buffer[offset]
      this.y = buffer[offset + 1]
      this.z = buffer[offset + 2]
      this.w = buffer[offset + 3]
      return this
    }

    /**
     * Initializes the quaternion from axis and an angle.
     * @param axis The axis as vector
     * @param angle The angle in degrees
     * @return Reference to `this` for chaining.
     */
    initAxisAngle(axis:IVec3, angle:number):Quat {
      var halfAngle = angle * 0.5
      var scale = Math.sin(halfAngle)
      this.x = axis.x * scale
      this.y = axis.y * scale
      this.z = axis.z * scale
      this.w = Math.cos(halfAngle)
      return this
    }

    /**
     * Initializes the quaternion from yaw pitch and roll angles.
     * @param yaw The yaw angle in radians
     * @param pitch The pitch angle in radians
     * @param roll The roll angle in radians
     * @return Reference to `this` for chaining.
     */
    initYawPitchRoll(yaw:number, pitch:number, roll:number):Quat {
      var xHalf = pitch * 0.5
      var xSin = Math.sin(xHalf)
      var xCos = Math.cos(xHalf)

      var yHalf = yaw * 0.5
      var ySin = Math.sin(yHalf)
      var yCos = Math.cos(yHalf)

      var zHalf = roll * 0.5
      var zSin = Math.sin(zHalf)
      var zCos = Math.cos(zHalf)

      this.x = yCos * xSin * zCos + ySin * xCos * zSin
      this.y = ySin * xCos * zCos - yCos * xSin * zSin
      this.z = yCos * xCos * zSin - ySin * xSin * zCos
      this.w = yCos * xCos * zCos + ySin * xSin * zSin
      return this
    }

    /**
     * Creates a copy of this quaternion
     * @return The cloned quaternion
     */
    clone():Quat {
      return new Quat(this.x, this.y, this.z, this.w)
    }

    /**
     * Copies the components successively into the given array.
     * @param buffer The array to copy into
     * @param [offset=0] Zero based index where to start writing in the array
     * @return Reference to `this` for chaining.
     */
    copyTo(buffer:ArrayLike<number>, offset?:number) {
      offset = offset || 0
      buffer[offset] = this.x
      buffer[offset + 1] = this.y
      buffer[offset + 2] = this.z
      buffer[offset + 3] = this.w
      return this
    }

    /**
     * Checks for component wise equality with given quaternion
     * @param other The quaternion to compare with
     * @return {Boolean} true if components are equal, false otherwise
     */
    equals(other:IVec4):boolean {
      return ((this.x === other.x) && (this.y === other.y) && (this.z === other.z) && (this.w === other.w))
    }

    /**
     * Calculates the length of this quaternion
     * @return {Number} The length.
     */
    length():number {
      var x = this.x
      var y = this.y
      var z = this.z
      var w = this.w
      return Math.sqrt(x * x + y * y + z * z + w * w)
    }

    /**
     * Calculates the squared length of this quaternion
     * @return {Number} The squared length.
     */
    lengthSquared():number {
      var x = this.x
      var y = this.y
      var z = this.z
      var w = this.w
      return x * x + y * y + z * z + w * w
    }

    /**
     * Calculates the dot product with the given quaternion
     * @return {Number} The dot product.
     */
    dot(other:IVec4):number {
      return this.x * other.x + this.y * other.y + this.z * other.z + this.w * other.w
    }

    /**
     * Negates the components of `this`
     * @return Reference to `this` for chaining.
     */
    negate():Quat {
      this.x = -this.x
      this.y = -this.y
      this.z = -this.z
      this.w = -this.w
      return this
    }

    negateOut<T extends IVec4>(out?:T):T {
      out = out || new Quat() as any
      out.x = -this.x
      out.y = -this.y
      out.z = -this.z
      out.w = -this.w
      return out
    }

    /**
     * Negates the `x`, `y` and `z` components of `this`
     * @return Reference to `this` for chaining.
     */
    conjugate():Quat {
      this.x = -this.x
      this.y = -this.y
      this.z = -this.z
      return this
    }

    conjugateOut<T extends IVec4>(out?:T):T {
      out = out || new Quat() as any
      out.x = -this.x
      out.y = -this.y
      out.z = -this.z
      return out
    }

    /**
     * Normalizes `this` so that `length` should be `1`
     * @return Reference to `this` for chaining.
     */
    normalize():Quat {
      var x = this.x
      var y = this.y
      var z = this.z
      var w = this.w
      var d = 1.0 / Math.sqrt(x * x + y * y + z * z + w * w)
      this.x = x * d
      this.y = y * d
      this.z = z * d
      this.w = w * d
      return this
    }

    normalizeOut<T extends IVec4>(out?:T):T {
      out = out || new Quat() as any
      var x = this.x
      var y = this.y
      var z = this.z
      var w = this.w
      var d = 1.0 / Math.sqrt(x * x + y * y + z * z + w * w)
      out.x = x * d
      out.y = y * d
      out.z = z * d
      out.w = w * d
      return out
    }

    /**
     * Inverts `this` so that multiplication with the original would return the identity quaternion.
     * @return Reference to `this` for chaining.
     */
    invert():Quat {
      var x = this.x
      var y = this.y
      var z = this.z
      var w = this.w
      var d = 1.0 / Math.sqrt(x * x + y * y + z * z + w * w)
      this.x = -x * d
      this.y = -y * d
      this.z = -z * d
      this.w = w * d
      return this
    }

    invertOut<T extends IVec4>(out?:T):T {
      out = out || new Quat() as any
      var x = this.x
      var y = this.y
      var z = this.z
      var w = this.w
      var d = 1.0 / Math.sqrt(x * x + y * y + z * z + w * w)
      out.x = -x * d
      out.y = -y * d
      out.z = -z * d
      out.w = w * d
      return out
    }

    /**
     * Performs a component wise addition with `other`
     * @param other
     * @return Reference to `this` for chaining.
     */
    add(other:IVec4):Quat {
      this.x += other.x
      this.y += other.y
      this.z += other.z
      this.w += other.w
      return this
    }
    addOut<T extends IVec4>(other:IVec4, out?:T):T {
      out = out || new Quat() as any
      out.x = this.x + other.x
      out.y = this.y + other.y
      out.z = this.z + other.z
      out.w = this.w + other.w
      return out
    }

    /**
     * Performs a component wise subtraction with `other`
     * @param other
     * @return Reference to `this` for chaining.
     */
    subtract(other:IVec4):Quat {
      this.x -= other.x
      this.y -= other.y
      this.z -= other.z
      this.w -= other.w
      return this
    }
    subtractOut<T extends IVec4>(other:IVec4, out?:T):T {
      out = out || new Quat() as any
      out.x = this.x - other.x
      out.y = this.y - other.y
      out.z = this.z - other.z
      out.w = this.w - other.w
      return out
    }

    /**
     * Performs a quaternion multiplication with `other`
     * @param other
     * @return Reference to `this` for chaining.
     */
    multiply(other:IVec4):Quat {
      var x1 = this.x
      var y1 = this.y
      var z1 = this.z
      var w1 = this.w

      var x2 = other.x
      var y2 = other.y
      var z2 = other.z
      var w2 = other.w

      this.x = x1 * w2 + x2 * w1 + y1 * z2 - z1 * y2
      this.y = y1 * w2 + y2 * w1 + z1 * x2 - x1 * z2
      this.z = z1 * w2 + z2 * w1 + x1 * y2 - y1 * x2
      this.w = w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2
      return this;
    }
    multiplyOut<T extends IVec4>(other:IVec4, out?:T):T {
      out = out || new Quat() as any
      var x1 = this.x
      var y1 = this.y
      var z1 = this.z
      var w1 = this.w

      var x2 = other.x
      var y2 = other.y
      var z2 = other.z
      var w2 = other.w

      out.x = x1 * w2 + x2 * w1 + y1 * z2 - z1 * y2
      out.y = y1 * w2 + y2 * w1 + z1 * x2 - x1 * z2
      out.z = z1 * w2 + z2 * w1 + x1 * y2 - y1 * x2
      out.w = w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2
      return out;
    }

    /**
     * Performs a quaternion concatenation with `other`
     * @param other
     * @return Reference to `this` for chaining.
     */
    concat(other:IVec4):Quat {
      var x1 = other.x
      var y1 = other.y
      var z1 = other.z
      var w1 = other.w

      var x2 = this.x
      var y2 = this.y
      var z2 = this.z
      var w2 = this.w

      this.x = x1 * w2 + x2 * w1 + y1 * z2 - z1 * y2
      this.y = y1 * w2 + y2 * w1 + z1 * x2 - x1 * z2
      this.z = z1 * w2 + z2 * w1 + x1 * y2 - y1 * x2
      this.w = w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2
      return this;
    }
    concatOut<T extends IVec4>(other:IVec4, out?:T):T {
      out = out || new Quat() as any
      var x1 = other.x
      var y1 = other.y
      var z1 = other.z
      var w1 = other.w

      var x2 = this.x
      var y2 = this.y
      var z2 = this.z
      var w2 = this.w

      out.x = x1 * w2 + x2 * w1 + y1 * z2 - z1 * y2
      out.y = y1 * w2 + y2 * w1 + z1 * x2 - x1 * z2
      out.z = z1 * w2 + z2 * w1 + x1 * y2 - y1 * x2
      out.w = w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2
      return out;
    }
    /**
     * Performs a division with `other`
     * @param other
     * @return Reference to `this` for chaining.
     */
    divide(other:IVec4):Quat {
      var x1 = this.x
      var y1 = this.y
      var z1 = this.z
      var w1 = this.w

      var x2 = other.x
      var y2 = other.y
      var z2 = other.z
      var w2 = other.w

      // invert
      var s = 1.0 / (x2 * x2 + y2 * y2 + z2 * z2 + w2 * w2)
      x2 = -x2 * s
      y2 = -y2 * s
      z2 = -z2 * s
      w2 = w2 * s
      // multiply
      this.x = x1 * w2 + x2 * w1 + y1 * z2 - z1 * y2
      this.y = y1 * w2 + y2 * w1 + z1 * x2 - x1 * z2
      this.z = z1 * w2 + z2 * w1 + x1 * y2 - y1 * x2
      this.w = w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2
      return this
    }
    divideOut<T extends IVec4>(other:IVec4, out?:T):T {
      out = out || new Quat() as any
      var x1 = this.x
      var y1 = this.y
      var z1 = this.z
      var w1 = this.w

      var x2 = other.x
      var y2 = other.y
      var z2 = other.z
      var w2 = other.w

      // invert
      var s = 1.0 / (x2 * x2 + y2 * y2 + z2 * z2 + w2 * w2)
      x2 = -x2 * s
      y2 = -y2 * s
      z2 = -z2 * s
      w2 = w2 * s
      // multiply
      out.x = x1 * w2 + x2 * w1 + y1 * z2 - z1 * y2
      out.y = y1 * w2 + y2 * w1 + z1 * x2 - x1 * z2
      out.z = z1 * w2 + z2 * w1 + x1 * y2 - y1 * x2
      out.w = w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2
      return out
    }
    /**
     * Rotates the given point or vector with `this`
     * @param vec
     * @return {Vec3|Vec4}
     */
    transform<T extends IVec3>(vec:T):T {
      var x = this.x
      var y = this.y
      var z = this.z
      var w = this.w

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

      var vx = vec.x
      var vy = vec.y
      var vz = vec.z

      vec.x = vx * (1 - yy2 - zz2) + vy * (xy2 - wz2) + vz * (xz2 + wy2)
      vec.y = vx * (xy2 + wz2) + vy * (1 - xx2 - zz2) + vz * (yz2 - wx2)
      vec.z = vx * (xz2 - wy2) + vy * (yz2 + wx2) + vz * (1 - xx2 - yy2)
      return vec
    }

    /**
     * Creates a new quaternion. The method should be called with four or no arguments. If less than four arguments are given
     * then some components of the resulting quaternion are going to be `undefined`.
     * @param [x] The x component
     * @param [y] The y component
     * @param [z] The z component
     * @param [w] The w component
     * @return
     */
    static create(x?:number, y?:number, z?:number, w?:number):Quat {
      return new Quat(x, y, z, w);
    }

    /**
     * Creates a new vector with all components set to 0.
     * @return A new quaternion
     */
    static zero():Quat {
      return new Quat(0, 0, 0, 0);
    }

    /**
     * Creates a new vector with `x`, `y` and `z` components set to `0` and `w` component set to `1`.
     * @return A new quaternion
     */
    static identity():Quat {
      return new Quat(0, 0, 0, 1);
    }

    /**
     * Creates a new quaternion from given axis vector and an angle
     * @param axis The axis vector
     * @param angle The angle in degree
     * @return A new quaternion
     */
    static fromAxisAngle(axis:IVec3, angle:number):Quat {
      return Quat.identity().initAxisAngle(axis, angle)
    }

    /**
     * Creates a new quaternion from given `yaw` `pitch` and `roll` angles
     * @param yaw The yaw angle in radians
     * @param pitch The pitch angle in radians
     * @param roll The roll angle in radians
     * @return
     */
    static fromYawPitchRoll(yaw:number, pitch:number, roll:number):Quat {
      return Quat.identity().initYawPitchRoll(yaw, pitch, roll)
    }

    /**
     * Negates the given quaternion.
     * @param quat The quaternion to negate.
     * @param [out] The quaternion to write to.
     * @return The given `out` parameter or a new quaternion.
     */
    static negate<T extends IVec4>(quat:IVec4, out?:T):T {
      out = out || new Quat() as any
      out.x = -quat.x
      out.y = -quat.y
      out.z = -quat.z
      out.w = -quat.w
      return out
    }

    /**
     * Conjugates the given quaternion.
     * @param quat The quaternion to conjugate.
     * @param [out] The quaternion to write to.
     * @return The given `out` parameter or a new quaternion.
     */
    static conjugate<T extends IVec4>(quat:IVec4, out?:T):T {
      out = out || new Quat() as any
      out.x = -quat.x
      out.y = -quat.y
      out.z = -quat.z
      out.w = quat.w
      return out
    }

    /**
     * Normalizes the given quaternion
     * @param quat The quaternion to normalize.
     * @param [out] The quaternion to write to.
     * @return The given `out` parameter or a new quaternion.
     */
    static normalize<T extends IVec4>(quat:IVec4, out?:T):T {
      out = out || new Quat() as any
      var x = quat.x
      var y = quat.y
      var z = quat.z
      var w = quat.w
      var d = 1.0 / Math.sqrt(x * x + y * y + z * z + w * w)
      out.x = x * d
      out.y = y * d
      out.z = z * d
      out.w = w * d
      return out
    }

    /**
     * Inverts the given quaternion
     * @param quat The quaternion to invert.
     * @param [out] The quaternion to write to.
     * @return The given `out` parameter or a new quaternion.
     */
    static invert<T extends IVec4>(quat:IVec4, out?:T):T {
      out = out || new Quat() as any
      var x = quat.x
      var y = quat.y
      var z = quat.z
      var w = quat.w
      var d = 1.0 / Math.sqrt(x * x + y * y + z * z + w * w)
      out.x = -x * d
      out.y = -y * d
      out.z = -z * d
      out.w = w * d
      return out
    }

    /**
     * Adds two quaternions
     * @param quatA The first quaternion
     * @param quatB The second quaternion
     * @param [out] The quaternion to write to.
     * @return The given `out` parameter or a new quaternion.
     */
    static add<T extends IVec4>(quatA:IVec4, quatB:IVec4, out?:T):T {
      out = out || new Quat() as any
      out.x = quatA.x + quatB.x
      out.y = quatA.y + quatB.y
      out.z = quatA.z + quatB.z
      out.w = quatA.w + quatB.w
      return out
    }

    /**
     * Subtracts the second quaternion from the first.
     * @param quatA The first quaternion
     * @param quatB The second quaternion
     * @param [out] The quaternion to write to.
     * @return The given `out` parameter or a new quaternion.
     */
    static subtract<T extends IVec4>(quatA:IVec4, quatB:IVec4, out?:T):T {
      out = out || new Quat() as any
      out.x = quatA.x - quatB.x
      out.y = quatA.y - quatB.y
      out.z = quatA.z - quatB.z
      out.w = quatA.w - quatB.w
      return out
    }

    /**
     * Multiplies two quaternions
     * @param quatA The first quaternion
     * @param quatB The second quaternion
     * @param [out] The quaternion to write to.
     * @return The given `out` parameter or a new quaternion.
     */
    static multiply<T extends IVec4>(quatA:IVec4, quatB:IVec4, out?:T):T {
      out = out || new Quat() as any
      var x1 = quatA.x
      var y1 = quatA.y
      var z1 = quatA.z
      var w1 = quatA.w

      var x2 = quatB.x
      var y2 = quatB.y
      var z2 = quatB.z
      var w2 = quatB.w

      out.x = x1 * w2 + x2 * w1 + y1 * z2 - z1 * y2
      out.y = y1 * w2 + y2 * w1 + z1 * x2 - x1 * z2
      out.z = z1 * w2 + z2 * w1 + x1 * y2 - y1 * x2
      out.w = w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2
      return out
    }


    /**
     * Concatenates two quaternions
     * @param quatA The first quaternion
     * @param quatB The second quaternion
     * @param [out] The quaternion to write to.
     * @return The given `out` parameter or a new quaternion.
     */
    static concat<T extends IVec4>(quatA:IVec4, quatB:IVec4, out?:T):T {
      out = out || new Quat() as any
      var x1 = quatB.x
      var y1 = quatB.y
      var z1 = quatB.z
      var w1 = quatB.w

      var x2 = quatA.x
      var y2 = quatA.y
      var z2 = quatA.z
      var w2 = quatA.w

      out.x = x1 * w2 + x2 * w1 + y1 * z2 - z1 * y2
      out.y = y1 * w2 + y2 * w1 + z1 * x2 - x1 * z2
      out.z = z1 * w2 + z2 * w1 + x1 * y2 - y1 * x2
      out.w = w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2
      return out
    }

    /**
     * Divides the first quaternion by the second
     * @param quatA The first quaternion
     * @param quatB The second quaternion
     * @param [out] The quaternion to write to.
     * @return The given `out` parameter or a new quaternion.
     */
    static divide<T extends IVec4>(quatA:IVec4, quatB:IVec4, out?:T):T {
      out = out || new Quat() as any
      var x1 = quatA.x
      var y1 = quatA.y
      var z1 = quatA.z
      var w1 = quatA.w

      var x2 = quatB.x
      var y2 = quatB.y
      var z2 = quatB.z
      var w2 = quatB.w

      // invert
      var s = 1.0 / (x2 * x2 + y2 * y2 + z2 * z2 + w2 * w2)
      x2 = -x2 * s
      y2 = -y2 * s
      z2 = -z2 * s
      w2 = w2 * s

      // multiply
      out.x = x1 * w2 + x2 * w1 + y1 * z2 - z1 * y2
      out.y = y1 * w2 + y2 * w1 + z1 * x2 - x1 * z2
      out.z = z1 * w2 + z2 * w1 + x1 * y2 - y1 * x2
      out.w = w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2
      return out
    }

    /**
     * Tries to convert the given `data` into a quaternion
     * @param {Array|Quat|Vec4} data
     * @return The created quaternion.
     */
    static convert(data:any):Quat {
      if (Array.isArray(data)) {
        return new Quat(data[0],data[1],data[2],data[3]);
      }
      if (typeof data === 'number') {
        return new Quat(data, data, data, data);
      }
      return new Quat(data.x,data.y,data.z,data.w)
    }

    /**
     * Rotates a point or vector with given quaternion
     * @param q The rotation quaternion
     * @param v The point or vector to rotate
     * @param [out] The vector to write to
     * @return The given `out` parameter or a new vector.
     */
    static transform<T extends IVec3>(q:IVec4, v:IVec3, out?:T):T {
      var x = q.x
      var y = q.y
      var z = q.z
      var w = q.w

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

      var vx = v.x
      var vy = v.y
      var vz = v.z

      out = out || new Vec3() as any
      out.x = vx * (1 - yy2 - zz2) + vy * (xy2 - wz2) + vz * (xz2 + wy2)
      out.y = vx * (xy2 + wz2) + vy * (1 - xx2 - zz2) + vz * (yz2 - wx2)
      out.z = vx * (xz2 - wy2) + vy * (yz2 + wx2) + vz * (1 - xx2 - yy2)

      return out
    }
  }
}
