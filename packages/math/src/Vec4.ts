import { ArrayLike, IVec2, IVec3, IVec4 } from './Types'

const keys = ['x', 'y', 'z', 'w']
const keyLookup = {
  0: 'x', 1: 'y', 2: 'z', 3: 'w',
  x: 'x', y: 'y', z: 'z', w: 'w',
}

/**
 * Describes a vector with four components.
 */
export class Vec4 implements IVec2, IVec3, IVec4 {

  /**
   * Readonly vector with all components set to one
   */
  public static One = Object.freeze({ x: 1, y: 1, z: 1, w: 1})
  /**
   * Readonly vector with all components set to zero
   */
  public static Zero = Object.freeze({ x: 0, y: 0, z: 0, w: 0})
  /**
   * Readonly vector x component set to one
   */
  public static UnitX = Object.freeze({ x: 1, y: 0, z: 0, w: 0})
  /**
   * Readonly vector y component set to one
   */
  public static UnitY = Object.freeze({ x: 0, y: 1, z: 0, w: 0})
  /**
   * Readonly vector z component set to one
   */
  public static UnitZ = Object.freeze({ x: 0, y: 0, z: 1, w: 0})
  /**
   * Readonly vector w component set to one
   */
  public static UnitW = Object.freeze({ x: 0, y: 0, z: 0, w: 1})

  /**
   * The X component
   */
  public x: number
  /**
   * The Y component
   */
  public y: number
  /**
   * The Z component
   */
  public z: number
  /**
   * The W component
   */
  public w: number

  /**
   * Initializes a new instance
   * @param x Value for the X component
   * @param y Value for the Y component
   * @param z Value for the Z component
   * @param w Value for the W component
   */
  constructor(x?: number, y?: number, z?: number, w?: number) {
    this.x = x == null ? 0 : x
    this.y = y == null ? 0 : y
    this.z = z == null ? 0 : z
    this.w = w == null ? 0 : w
  }

  /**
   * Sets the X component
   */
  public setX(value: number): Vec4 {
    this.x = value
    return this
  }

  /**
   * Sets the Y component
   */
  public setY(value: number): Vec4 {
    this.y = value
    return this
  }

  /**
   * Sets the Z component
   */
  public setZ(value: number): Vec4 {
    this.z = value
    return this
  }

  /**
   * Sets the W component
   */
  public setW(value: number): Vec4 {
    this.w = value
    return this
  }

  /**
   * Sets the component by using an index (or name)
   */
  public set(key: number|string, value: number): Vec4 {
    this[keyLookup[key]] = value
    return this
  }
  /**
   * Gets the component by using an index (or name)
   */
  public get(key: number|string): number {
    return this[keyLookup[key]]
  }

  /**
   * Initializes the components of this value with given values.
   * @param x value for X component
   * @param y value for Y component
   * @param z value for Z component
   * @param w value for W component
   * @return `this` instance for chaining
   */
  public init(x: number, y: number, z: number, w: number): Vec4 {
    this.x = x
    this.y = y
    this.z = z
    this.w = w
    return this
  }

  /**
   * Creates a new instance.
   * @param [x] The x component
   * @param [y] The y component
   * @param [z] The z component
   * @param [w] The w component
   * @return A new instance.
   */
  public static create(x?: number, y?: number, z?: number, w?: number): Vec4 {
    return new Vec4(x, y, z, w)
  }

  /**
   * Resets all components to zero
   * @return `this` instance for chaining
   */
  public initZero(): Vec4 {
    this.x = 0
    this.y = 0
    this.z = 0
    this.w = 0
    return this
  }

  /**
   * Creates a new instance with all components set to 0.
   * @return A new instance.
   */
  public static createZero(): Vec4 {
    return new Vec4(0, 0, 0, 0)
  }

  /**
   * Resets all components to 1
   * @return `this` instance for chaining
   */
  public initOne(): Vec4 {
    this.x = 1
    this.y = 1
    this.z = 1
    this.w = 1
    return this
  }

  /**
   * Creates a new instance with all components set to 1.
   * @return A new instance.
   */
  public static createOne(): Vec4 {
    return new Vec4(1, 1, 1, 1)
  }

  /**
   * Initializes the components of this value by taking the components from the given value.
   * @param other The value to read from
   * @return `this` instance for chaining
   */
  public initFrom(other: IVec4): Vec4 {
    this.x = other.x
    this.y = other.y
    this.z = other.z
    this.w = other.w
    return this
  }

  /**
   * Creates a new instanceby taking the components from the given value.
   * @param other The value to read from
   * @return `this` instance for chaining
   */
  public static createFrom(other: IVec4): Vec4 {
    return new Vec4(
      other.x,
      other.y,
      other.z,
      other.w,
    )
  }

  /**
   * Initializes the components of this value by taking values from the given array in successive order.
   * @param buffer The array to read from
   * @param [offset=0] The zero based index at which start reading the values
   * @return `this` instance for chaining
   */
  public initFromBuffer(buffer: ArrayLike<number>, offset: number= 0): Vec4 {
    this.x = buffer[offset]
    this.y = buffer[offset + 1]
    this.z = buffer[offset + 2]
    this.w = buffer[offset + 3]
    return this
  }

  /**
   * Creates a new instance by taking values from the given array in successive order.
   * @param buffer The array to read from
   * @param [offset=0] The zero based index at which start reading the values
   * @return `this` instance for chaining
   */
  public static createFromBuffer(buffer: ArrayLike<number>, offset: number= 0): Vec4 {
    return new Vec4(
      buffer[offset],
      buffer[offset + 1],
      buffer[offset + 2],
      buffer[offset + 3],
    )
  }

  /**
   * Creates a copy of this value
   * @return The cloned vector
   */
  public clone<T extends IVec4 = Vec4>(out?: T|Vec4): T|Vec4 {
    out = out || new Vec4()
    out.x = this.x
    out.y = this.y
    out.z = this.z
    out.w = this.w
    return out
  }

  /**
   * Copies the `src` value to the `dst` value
   * @param src
   * @param dst
   * @return the `dst` value.
   */
  public static clone<T extends IVec4 = IVec4>(src: IVec4, dst?: T|IVec4): T|IVec4 {
    dst = dst || new Vec4()
    dst.x = src.x
    dst.y = src.y
    dst.z = src.z
    dst.w = src.w
    return dst
  }

  /**
   * Copies the components successively into the given array.
   * @param buffer The array to copy into
   * @param [offset=0] Zero based index where to start writing in the array
   * @return the given buffer parameter
   */
  public copy<T extends ArrayLike<number>>(buffer: T, offset: number= 0): T {
    buffer[offset] = this.x
    buffer[offset + 1] = this.y
    buffer[offset + 2] = this.z
    buffer[offset + 3] = this.w
    return buffer
  }

  /**
   * Copies the components of `src` successively into the given array.
   * @param buffer The array to copy into
   * @param [offset=0] Zero based index where to start writing in the array
   * @return the given buffer parameter
   */
  public static copy<T extends ArrayLike<number>>(src: IVec4, buffer: T, offset: number= 0): T {
    buffer[offset] = src.x
    buffer[offset + 1] = src.y
    buffer[offset + 2] = src.z
    buffer[offset + 3] = src.w
    return buffer
  }

  /**
   * Checks for component wise equality with given value
   * @return true if components are equal, false otherwise
   */
  public equals(other: IVec4): boolean {
    return ((this.x === other.x) && (this.y === other.y) && (this.z === other.z) && (this.w === other.w))
  }

  /**
   * Checks for component wise equality
   * @return true if components are equal, false otherwise
   */
  public static equals(a: IVec4, b: IVec4): boolean {
    return ((a.x === b.x) && (a.y === b.y) && (a.z === b.z) && (a.w === b.w))
  }

  /**
   * Calculates the length of this value
   * @return The length.
   */
  public length(): number {
    const x = this.x
    const y = this.y
    const z = this.z
    const w = this.w
    return Math.sqrt(x * x + y * y + z * z + w * w)
  }

  /**
   * Calculates the length of a value
   * @param vec
   * @return The length.
   */
  public static len(vec: IVec4): number {
    const x = vec.x
    const y = vec.y
    const z = vec.z
    const w = vec.w
    return Math.sqrt(x * x + y * y + z * z + w * w)
  }

  /**
   * Calculates the squared length of this value
   * @return The squared length.
   */
  public lengthSquared(): number {
    const x = this.x
    const y = this.y
    const z = this.z
    const w = this.w
    return x * x + y * y + z * z + w * w
  }

  /**
   * Calculates the squared length of a value
   * @param vec
   * @return The squared length.
   */
  public static lengthSquared(vec: IVec4): number {
    const x = vec.x
    const y = vec.y
    const z = vec.z
    const w = vec.w
    return x * x + y * y + z * z + w * w
  }

  /**
   * Calculates the distance to the `other` value
   * @param other The distant vector
   * @return The distance between the vectors.
   */
  public distance(other: IVec4): number {
    const x = this.x - other.x
    const y = this.y - other.y
    const z = this.z - other.z
    const w = this.w - other.w
    return Math.sqrt(x * x + y * y + z * z + w * w)
  }

  /**
   * Calculates the distance between two values
   * @param a
   * @param b
   * @return The distance between the vectors.
   */
  public static distance(a: IVec4, b: IVec4): number {
    const x = a.x - b.x
    const y = a.y - b.y
    const z = a.z - b.z
    const w = a.w - b.w
    return Math.sqrt(x * x + y * y + z * z + w * w)
  }

  /**
   * Calculates the squared distance to the `other` value
   * @param other The distant vector
   * @return The squared distance between the vectors.
   */
  public distanceSquared(other: IVec4): number {
    const x = this.x - other.x
    const y = this.y - other.y
    const z = this.z - other.z
    const w = this.w - other.w
    return x * x + y * y + z * z + w * w
  }

  /**
   * Calculates the squared distance between two values
   * @param a
   * @param b
   * @return The squared distance between the vectors.
   */
  public static distanceSquared(a: IVec4, b: IVec4): number {
    const x = a.x - b.x
    const y = a.y - b.y
    const z = a.z - b.z
    const w = a.w - b.w
    return x * x + y * y + z * z + w * w
  }

  /**
   * Calculates the dot product with the `other` value
   * @param other
   * @return The dot product.
   */
  public dot(other: IVec4): number {
    return this.x * other.x + this.y * other.y + this.z * other.z + this.w * other.w
  }

  /**
   * Calculates the dot product with the given value
   * @param a
   * @param b
   * @return The dot product.
   */
  public static dot(a: IVec4, b: IVec4): number {
    return a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w
  }

  /**
   * Normalizes `this` value.
   * @return `this` instance for chaining
   */
  public normalize(): Vec4 {
    const x = this.x
    const y = this.y
    const z = this.z
    const w = this.w
    const d = 1.0 / Math.sqrt(x * x + y * y + z * z + w * w)
    this.x *= d
    this.y *= d
    this.z *= d
    this.w *= d
    return this
  }

  /**
   * Normalizes the given value.
   * @param vec The value to normalize.
   * @param [out] The value to write to.
   * @return The given `out` parameter or a new instance.
   */
  public static normalize<T extends IVec4 = Vec4>(vec: IVec4, out?: T|Vec4): T|Vec4 {
    out = out || new Vec4()
    const x = vec.x
    const y = vec.y
    const z = vec.z
    const w = vec.w
    const d = 1.0 / Math.sqrt(x * x + y * y + z * z + w * w)
    out.x = x * d
    out.y = y * d
    out.z = z * d
    out.w = w * d
    return out
  }

  /**
   * Inverts this value.
   * @return `this` instance for chaining
   */
  public invert(): Vec4 {
    this.x = 1.0 / this.x
    this.y = 1.0 / this.y
    this.z = 1.0 / this.z
    this.w = 1.0 / this.w
    return this
  }

  /**
   * Inverts the given value.
   * @param vec The value to invert.
   * @param [out] The value to write to.
   * @return The given `out` parameter or a new instance.
   */
  public static invert<T extends IVec4 = Vec4>(vec: IVec4, out?: T|Vec4): T|Vec4 {
    out = out || new Vec4()
    out.x = 1.0 / vec.x
    out.y = 1.0 / vec.y
    out.z = 1.0 / vec.z
    out.w = 1.0 / vec.w
    return out
  }

  /**
   * Negates the components of `this` vector. Applies the result to `this`
   * @return `this` instance for chaining
   */
  public negate(): Vec4 {
    this.x = -this.x
    this.y = -this.y
    this.z = -this.z
    this.w = -this.w
    return this
  }

  /**
   * Negates this value.
   * @param vec The value to negate.
   * @param [out] The value to write to.
   * @return The given `out` parameter or a new instance.
   */
  public static negate<T extends IVec4 = Vec4>(vec: IVec4, out?: T|Vec4): T|Vec4 {
    out = out || new Vec4()
    out.x = -vec.x
    out.y = -vec.y
    out.z = -vec.z
    out.w = -vec.w
    return out
  }

  /**
   * Performs the calculation `this += other`
   * @param other The value to add
   * @return `this` instance for chaining
   */
  public add(other: IVec4): Vec4 {
    this.x += other.x
    this.y += other.y
    this.z += other.z
    this.w += other.w
    return this
  }

  /**
   * Adds two vectors.
   * @param vecA The first vector.
   * @param vecB The second vector.
   * @param out The value to write to.
   * @return The given `out` parameter or a new instance.
   */
  public static add<T extends IVec4 = Vec4>(vecA: IVec4, vecB: IVec4, out?: T|Vec4): T|Vec4 {
    out = out || new Vec4()
    out.x = vecA.x + vecB.x
    out.y = vecA.y + vecB.y
    out.z = vecA.z + vecB.z
    out.w = vecA.w + vecB.w
    return out
  }

  /**
   * Performs the calculation `this += scalar`
   * @param scalar The value to add
   * @return `this` instance for chaining
   */
  public addScalar(scalar: number): Vec4 {
    this.x += scalar
    this.y += scalar
    this.z += scalar
    this.w += scalar
    return this
  }

  /**
   * Adds a scalar to each component of a vector.
   * @param vec The first vector.
   * @param scalar The scalar to add.
   * @param [out] The value to write to.
   * @return The given `out` parameter or a new instance.
   */
  public static addScalar<T extends IVec4 = Vec4>(vec: IVec4, scalar: number, out?: T|Vec4): T|Vec4 {
    out = out || new Vec4()
    out.x = vec.x + scalar
    out.y = vec.y + scalar
    out.z = vec.z + scalar
    out.w = vec.w + scalar
    return out
  }

  /**
   * Performs the calculation `this += other * scale`
   * @param other The value to add
   * @return `this` instance for chaining
   */
  public addScaled(other: IVec4, scale: number): Vec4 {
    this.x += other.x * scale
    this.y += other.y * scale
    this.z += other.z * scale
    this.w += other.w * scale
    return this
  }

  /**
   * Performs the calculation `this -= other`
   * @param other The value to subtract
   * @return `this` instance for chaining
   */
  public subtract(other: IVec4): Vec4 {
    this.x -= other.x
    this.y -= other.y
    this.z -= other.z
    this.w -= other.w
    return this
  }

  /**
   * Subtracts the second vector from the first.
   * @param vecA The first vector.
   * @param vecB The second vector.
   * @param [out] The value to write to.
   * @return The given `out` parameter or a new instance.
   */
  public static subtract<T extends IVec4 = Vec4>(vecA: IVec4, vecB: IVec4, out?: T|Vec4): T|Vec4 {
    out = out || new Vec4()
    out.x = vecA.x - vecB.x
    out.y = vecA.y - vecB.y
    out.z = vecA.z - vecB.z
    out.w = vecA.w - vecB.w
    return out
  }

  /**
   * Performs the calculation `this -= scalar`
   * @param scalar The value to subtract
   * @return `this` instance for chaining
   */
  public subtractScalar(scalar: number): Vec4 {
    this.x -= scalar
    this.y -= scalar
    this.z -= scalar
    this.w -= scalar
    return this
  }

  /**
   * Subtracts a scalar from each component of a vector.
   * @param vec The first vector.
   * @param scalar The scalar to add.
   * @param [out] The value to write to.
   * @return The given `out` parameter or a new instance.
   */
  public static subtractScalar<T extends IVec4 = Vec4>(vec: IVec4, scalar: number, out?: T|Vec4): T|Vec4 {
    out = out || new Vec4()
    out.x = vec.x - scalar
    out.y = vec.y - scalar
    out.z = vec.z - scalar
    out.w = vec.w - scalar
    return out
  }

  /**
   * Performs the calculation `this -= other * scale`
   * @param other The value to subtract
   * @param scale The value to multoply to `other`
   * @return `this` instance for chaining
   */
  public subtractScaled(other: IVec4, scale: number): Vec4 {
    this.x -= other.x * scale
    this.y -= other.y * scale
    this.z -= other.z * scale
    this.w -= other.w * scale
    return this
  }

  /**
   * Performs the calculation `this *= other`
   * @param other The value to multiply
   * @return `this` instance for chaining
   */
  public multiply(other: IVec4): Vec4 {
    this.x *= other.x
    this.y *= other.y
    this.z *= other.z
    this.w *= other.w
    return this
  }

  /**
   * Multiplies two vectors.
   * @param vecA The first vector.
   * @param vecB The second vector.
   * @param [out] The value to write to.
   * @return The given `out` parameter or a new instance.
   */
  public static multiply<T extends IVec4 = Vec4>(vecA: IVec4, vecB: IVec4, out?: T|Vec4): T|Vec4 {
    out = out || new Vec4()
    out.x = vecA.x * vecB.x
    out.y = vecA.y * vecB.y
    out.z = vecA.z * vecB.z
    out.w = vecA.w * vecB.w
    return out
  }

  /**
   * Performs the calculation `this *= scalar`
   * @param scalar The value to multiply
   * @return `this` instance for chaining
   */
  public multiplyScalar(scalar: number): Vec4 {
    this.x *= scalar
    this.y *= scalar
    this.z *= scalar
    this.w *= scalar
    return this
  }

  /**
   * Multiplies a scalar to each component of a vector.
   * @param vec The first vector.
   * @param scalar The scalar to add.
   * @param [out] The value to write to.
   * @return The given `out` parameter or a new instance.
   */
  public static multiplyScalar<T extends IVec4 = Vec4>(vec: IVec4, scalar: number, out?: T|Vec4): T|Vec4 {
    out = out || new Vec4()
    out.x = vec.x * scalar
    out.y = vec.y * scalar
    out.z = vec.z * scalar
    out.w = vec.w * scalar
    return out
  }

  /**
   * Performs the calculation `this /= other`
   * @param other The value to divide
   * @return `this` instance for chaining
   */
  public divide(other: IVec4): Vec4 {
    this.x /= other.x
    this.y /= other.y
    this.z /= other.z
    this.w /= other.w
    return this
  }

  /**
   * Divides the components of the first vector by the components of the second vector.
   * @param vecA The first vector.
   * @param vecB The second vector.
   * @param [out] The value to write to.
   * @return The given `out` parameter or a new instance.
   */
  public static divide<T extends IVec4 = Vec4>(vecA: IVec4, vecB: IVec4, out?: T|Vec4): T|Vec4 {
    out = out || new Vec4()
    out.x = vecA.x / vecB.x
    out.y = vecA.y / vecB.y
    out.z = vecA.z / vecB.z
    out.w = vecA.w / vecB.w
    return out
  }

  /**
   * Performs the calculation `this *= (1 / scalar)`
   * @param scalar The value to divide
   * @return `this` instance for chaining
   */
  public divideScalar(scalar: number): Vec4 {
    scalar = 1.0 / scalar
    this.x *= scalar
    this.y *= scalar
    this.z *= scalar
    this.w *= scalar
    return this
  }

  /**
   * Divides the components of the first vector by the scalar.
   * @param vec The first vector.
   * @param scalar The scalar to use for division.
   * @param out The value to write to.
   * @return The given `out` parameter or a new instance.
   */
  public static divideScalar<T extends IVec4 = Vec4>(vec: IVec4, scalar: number, out?: T|Vec4): T|Vec4 {
    out = out || new Vec4()
    scalar = 1.0 / scalar
    out.x = vec.x * scalar
    out.y = vec.y * scalar
    out.z = vec.z * scalar
    out.w = vec.w * scalar
    return out
  }

  /**
   * Performs the calculation `this = this * a + b`
   * @param a The value to multiply.
   * @param b The value to add on top of the multiplication.
   * @return `this` instance for chaining
   */
  public multiplyAdd(a: IVec4, b: IVec4): Vec4 {
    this.x = this.x * a.x + b.x
    this.y = this.y * a.y + b.y
    this.z = this.z * a.z + b.z
    this.w = this.w * a.w + b.w
    return this
  }

  /**
   * Multiplies two vectors and adds the third vector.
   * @param vecA The value to multiply.
   * @param vecB The value to multiply.
   * @param add The value to add on top of the multiplication.
   * @param [out] The value to write to.
   * @return The given `out` parameter or a new instance.
   */
  public static multiplyAdd<T extends IVec4 = Vec4>(vecA: IVec4, vecB: IVec4, add: IVec4, out?: T|Vec4): T|Vec4 {
    out = out || new Vec4()
    out.x = vecA.x * vecB.x + add.x
    out.y = vecA.y * vecB.y + add.y
    out.z = vecA.z * vecB.z + add.z
    out.w = vecA.w * vecB.w + add.w
    return out
  }

  /**
   * Multiplies this value with a scalar and adds another vector.
   * @param mul The scalar to multiply.
   * @param add The value to add on top of the multiplication.
   * @param [out] The value to write to.
   * @return The given `out` parameter or a new instance.
   */
  public multiplyScalarAdd<T extends IVec4 = Vec4>(mul: number, add: IVec4): T|Vec4 {
    this.x = this.x * mul + add.x
    this.y = this.y * mul + add.y
    this.z = this.z * mul + add.z
    this.w = this.w * mul + add.w
    return this
  }

  /**
   * Multiplies a vector with a scalar and adds another vector.
   * @param vecA The value to multiply.
   * @param mul The scalar to multiply.
   * @param add The value to add on top of the multiplication.
   * @param [out] The value to write to.
   * @return The given `out` parameter or a new instance.
   */
  public static multiplyScalarAdd<T extends IVec4 = Vec4>(vecA: IVec4, mul: number, add: IVec4, out?: T|Vec4): T|Vec4 {
    out = out || new Vec4()
    out.x = vecA.x * mul + add.x
    out.y = vecA.y * mul + add.y
    out.z = vecA.z * mul + add.z
    out.w = vecA.w * mul + add.w
    return out
  }

  /**
   * Transforms `this` with the given quaternion. The `w` component of `this` keeps untouched.
   * @param quat
   * @return `this` instance for chaining
   */
  public transformByQuat(quat: IVec4): Vec4 {
    const x = quat.x
    const y = quat.y
    const z = quat.z
    const w = quat.w

    const x2 = x + x
    const y2 = y + y
    const z2 = z + z

    const wx2 = w * x2
    const wy2 = w * y2
    const wz2 = w * z2

    const xx2 = x * x2
    const xy2 = x * y2
    const xz2 = x * z2

    const yy2 = y * y2
    const yz2 = y * z2
    const zz2 = z * z2

    const vx = this.x
    const vy = this.y
    const vz = this.z

    this.x = vx * (1 - yy2 - zz2) + vy * (xy2 - wz2) + vz * (xz2 + wy2)
    this.y = vx * (xy2 + wz2) + vy * (1 - xx2 - zz2) + vz * (yz2 - wx2)
    this.z = vx * (xz2 - wy2) + vy * (yz2 + wx2) + vz * (1 - xx2 - yy2)
    return this
  }

  /**
   * Transforms `this` with the given matrix.
   * @param mat
   * @return `this` instance for chaining
   */
  public transformByMat4(mat: { data: number[]|Float64Array|Float32Array }): Vec4 {
    const x = this.x
    const y = this.y
    const z = this.z
    const w = this.w
    const d = mat.data
    this.x = x * d[0] + y * d[4] + z * d[8] + w * d[12]
    this.y = x * d[1] + y * d[5] + z * d[9] + w * d[13]
    this.z = x * d[2] + y * d[6] + z * d[10] + w * d[14]
    this.w = x * d[3] + y * d[7] + z * d[11] + w * d[15]
    return this
  }

  /**
   * Transforms `this` with the given matrix. The `w` component of `this` is set to 1.
   * @param mat
   * @return `this` instance for chaining
   */
  public transformByMat3(mat: { data: number[]|Float64Array|Float32Array }): Vec4 {
    const x = this.x
    const y = this.y
    const z = this.z
    const d = mat.data
    this.x = x * d[0] + y * d[3] + z * d[6]
    this.y = x * d[1] + y * d[4] + z * d[7]
    this.z = x * d[2] + y * d[5] + z * d[8]
    this.w = 1
    return this
  }

  /**
   * Transforms `this` with the given matrix. The `z` and `w` components of `this` keep untouched.
   * @param mat
   * @return `this` instance for chaining
   */
  public transformByMat2(mat: { data: number[]|Float64Array|Float32Array }): Vec4 {
    const x = this.x
    const y = this.y
    const d = mat.data
    this.x = x * d[0] + y * d[2]
    this.y = x * d[1] + y * d[3]
    return this
  }

  /**
   * Performs a component wise clamp operation on the the given value by using the given min and max vectors.
   * @param a The value to clamp.
   * @param min Vector with the minimum component values.
   * @param max Vector with the maximum component values.
   * @param [out] The value to write to.
   * @return The given `out` parameter or a new instance.
   */
  public static clamp<T extends IVec4 = Vec4>(a: IVec4, min: IVec4, max: IVec4, out?: T|Vec4): T|Vec4 {
    out = out || new Vec4()
    const x = a.x
    const y = a.y
    const z = a.z
    const w = a.w
    const minX = min.x
    const minY = min.y
    const minZ = min.z
    const minW = min.w
    const maxX = max.x
    const maxY = max.y
    const maxZ = max.z
    const maxW = max.w
    out.x = x < minX ? minX : (x > maxX ? maxX : x)
    out.y = y < minY ? minY : (y > maxY ? maxY : y)
    out.z = z < minZ ? minZ : (z > maxZ ? maxZ : z)
    out.w = w < minW ? minW : (w > maxW ? maxW : w)
    return out
  }

  /**
   * Performs a component wise clamp operation on the the given value by using the given min and max scalars.
   * @param a The value to clamp.
   * @param min The minimum scalar value.
   * @param max The maximum scalar value.
   * @param [out] The value to write to.
   * @return The given `out` parameter or a new instance.
   */
  public static clampScalar<T extends IVec4 = Vec4>(a: IVec4, min: number, max: number, out?: T|Vec4): T|Vec4 {
    out = out || new Vec4()
    const x = a.x
    const y = a.y
    const z = a.z
    const w = a.w
    out.x = x < min ? min : (x > max ? max : x)
    out.y = y < min ? min : (y > max ? max : y)
    out.z = z < min ? min : (z > max ? max : z)
    out.w = w < min ? min : (w > max ? max : w)
    return out
  }

  /**
   * Performs a component wise min operation on the the given values.
   * @param a The first vector.
   * @param b The second vector.
   * @param [out] The value to write to.
   * @return The given `out` parameter or a new instance.
   */
  public static min<T extends IVec4 = Vec4>(a: IVec4, b: IVec4, out?: T|Vec4): T|Vec4 {
    out = out || new Vec4()
    const aX = a.x
    const aY = a.y
    const aZ = a.z
    const aW = a.w
    const bX = b.x
    const bY = b.y
    const bZ = b.z
    const bW = b.w
    out.x = aX < bX ? aX : bX
    out.y = aY < bY ? aY : bY
    out.z = aZ < bZ ? aZ : bZ
    out.w = aW < bW ? aW : bW
    return out
  }

  /**
   * Performs a component wise min operation on the the given value and a scalar value.
   * @param a The vector.
   * @param scalar The scalar.
   * @param [out] The value to write to.
   * @return The given `out` parameter or a new instance.
   */
  public static minScalar<T extends IVec4 = Vec4>(a: IVec4, scalar: number, out?: T|Vec4): T|Vec4 {
    out = out || new Vec4()
    const x = a.x
    const y = a.y
    const z = a.z
    const w = a.w
    out.x = x < scalar ? x : scalar
    out.y = y < scalar ? y : scalar
    out.z = z < scalar ? z : scalar
    out.w = w < scalar ? w : scalar
    return out
  }

  /**
   * Performs a component wise max operation on the the given values.
   * @param a The first vector.
   * @param b The second vector.
   * @param [out] The value to write to.
   * @return The given `out` parameter or a new instance.
   */
  public static max<T extends IVec4 = Vec4>(a: IVec4, b: IVec4, out?: T|Vec4): T|Vec4 {
    out = out || new Vec4()
    const aX = a.x
    const aY = a.y
    const aZ = a.z
    const aW = a.w
    const bX = b.x
    const bY = b.y
    const bZ = b.z
    const bW = b.w
    out.x = aX > bX ? aX : bX
    out.y = aY > bY ? aY : bY
    out.z = aZ > bZ ? aZ : bZ
    out.w = aW > bW ? aW : bW
    return out
  }

  /**
   * Performs a component wise max operation on the the given value and a scalar value.
   * @param a The vector.
   * @param scalar The scalar.
   * @param [out] The value to write to.
   * @return The given `out` parameter or a new instance.
   */
  public static maxScalar<T extends IVec4 = Vec4>(a: IVec4, scalar: number, out?: T|Vec4): T|Vec4 {
    out = out || new Vec4()
    const x = a.x
    const y = a.y
    const z = a.z
    const w = a.w
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
   * @param [out] The value to write to.
   * @return The given `out` parameter or a new instance.
   */
  public static lerp<T extends IVec4 = Vec4>(a: IVec4, b: IVec4, t: number, out?: T|Vec4): T|Vec4 {
    out = out || new Vec4()
    const x = a.x
    const y = a.y
    const z = a.z
    const w = a.w
    out.x = x + (b.x - x) * t
    out.y = y + (b.y - y) * t
    out.z = z + (b.z - z) * t
    out.w = w + (b.w - w) * t
    return out
  }

  /**
   * Performs a component wise barycentric interpolation of the given values.
   * @param a The first vector.
   * @param b The second vector.
   * @param c The third vector.
   * @param t1 The first interpolation value. Assumed to be in range [0:1].
   * @param t2 The second interpolation value. Assumed to be in range [0:1].
   * @param [out] The value to write to.
   * @return The given `out` parameter or a new instance.
   */
  public static barycentric<T extends IVec4 = Vec4>(a: IVec4, b: IVec4, c: IVec4, t1: number, t2: number, out?: T|Vec4): T|Vec4 {
    out = out || new Vec4()
    const x = a.x
    const y = a.y
    const z = a.z
    const w = a.w
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
   * @param [out] The value to write to.
   * @return The given `out` parameter or a new instance.
   */
  public static smooth<T extends IVec4 = Vec4>(a: IVec4, b: IVec4, t: number, out?: T|Vec4): T|Vec4 {
    out = out || new Vec4()
    t = ((t > 1) ? 1 : ((t < 0) ? 0 : t))
    t = t * t * (3 - 2 * t)
    const x = a.x
    const y = a.y
    const z = a.z
    const w = a.w
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
  public static convert(data: number | number[] | IVec4): Vec4 {
    if (typeof data === 'number') {
      return new Vec4(data, data, data, data)
    }
    if (Array.isArray(data)) {
      return new Vec4(
        data[0] || 0,
        data[1] || 0,
        data[2] || 0,
        data[3] || 0,
      )
    }
    return new Vec4(
      data.x || 0,
      data.y || 0,
      data.z || 0,
      data.w || 0,
    )
  }

  public format(fractionDigits: number = 5): string {
    return Vec4.format(this, fractionDigits)
  }

  public static format(vec: IVec4, fractionDigits: number = 5): string {
    return [
      vec.x.toFixed(fractionDigits),
      vec.y.toFixed(fractionDigits),
      vec.z.toFixed(fractionDigits),
      vec.w.toFixed(fractionDigits),
    ].join(',')
  }
}