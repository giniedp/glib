import { IVec2 } from './Types'

const keys = ['x', 'y']
const keyLookup = {
  0: 'x', 1: 'y',
  x: 'x', y: 'y',
}

/**
 * Describes a vector with two components.
 */
export class Vec2 implements IVec2 {

  /**
   * The X component
   */
  public x: number

  /**
   * The Y component
   */
  public y: number

  /**
   * initializes a new vector
   * @param [x=0] value for the X component
   * @param [x=x] value for the Y component
   */
  constructor(x: number= 0, y: number= 0) {
    this.x = x
    this.y = y
  }

  /**
   * Sets the X component
   */
  public setX(v: number): Vec2 {
    this.x = v
    return this
  }
  /**
   * Sets the Y component
   */
  public setY(v: number): Vec2 {
    this.y = v
    return this
  }
  /**
   * Sets the component by using an index (or name)
   */
  public set(key: number|string, v: number): Vec2 {
    this[keyLookup[key]] = v
    return this
  }
  /**
   * Gets the component by using an index (or name)
   */
  public get(key: number|string): number {
    return this[keyLookup[key]]
  }
  /**
   * Initializes the components of this vector with given values.
   */
  public init(x: number, y: number): Vec2 {
    this.x = x
    this.y = y
    return this
  }

  /**
   * Creates a new vector.
   * @param [x] The x component
   * @param [y] The y component
   * @return {Vec2} A new vector.
   */
  public static create(x?: number, y?: number): Vec2 {
    return new Vec2(x || 0, y || 0)
  }

  /**
   * Creates a new vector with all components set to 0.
   * @return {Vec2} A new vector.
   */
  public initZero(): Vec2 {
    this.x = 0
    this.y = 0
    return this
  }

  /**
   * Creates a new vector with all components set to 0.
   * @return {Vec2} A new vector.
   */
  public static createZero(): Vec2 {
    return new Vec2(0, 0)
  }

  /**
   * Creates a new vector with all components set to 1.
   * @return {Vec2} A new vector.
   */
  public initOne(): Vec2 {
    this.x = 1
    this.y = 1
    return this
  }

  /**
   * Creates a new vector with all components set to 1.
   * @return {Vec2} A new vector.
   */
  public static createOne(): Vec2 {
    return new Vec2(1, 1)
  }

  /**
   * Initializes the components of this vector by taking the components from the given vector.
   */
  public initFrom(other: IVec2): Vec2 {
    this.x = other.x
    this.y = other.y
    return this
  }

  /**
   * Initializes the components of this vector by taking the components from the given vector.
   */
  public static createFrom(other: IVec2): Vec2 {
    return new Vec2(
      other.x,
      other.y,
    )
  }

  /**
   * Initializes the components of this vector by taking values from the given array in successive order.
   * @param buffer The array to read from
   * @param [offset=0] The zero based index at which start reading the values
   * @return {Vec2}
   */
  public initFromBuffer(buffer: {[key: number]: number}, offset: number= 0): Vec2 {
    this.x = buffer[offset]
    this.y = buffer[offset + 1]
    return this
  }

  /**
   * Initializes the components of this vector by taking values from the given array in successive order.
   * @param buffer The array to read from
   * @param [offset=0] The zero based index at which start reading the values
   * @return {Vec2}
   */
  public static createFromBuffer(buffer: {[key: number]: number}, offset: number= 0): Vec2 {
    return new Vec2(
      buffer[offset],
      buffer[offset + 1],
    )
  }

  /**
   * Creates a copy of this vector
   * @return The cloned vector
   */
  public clone<T extends IVec2 = Vec2>(out?: T|Vec2): T|Vec2 {
    out = out || new Vec2()
    out.x = this.x
    out.y = this.y
    return out
  }

  /**
   * Copies the source vector to the destination vector
   * @param src
   * @param dst
   * @return the destination vector.
   */
  public static clone<T extends IVec2 = IVec2>(src: IVec2, dst?: T|IVec2): T {
    dst = dst || new Vec2()
    dst.x = src.x
    dst.y = src.y
    return dst as T
  }

  /**
   * Copies the components successively into the given array.
   * @param buffer The array to copy into
   * @param [offset=0] Zero based index where to start writing in the array
   * @returns {NumbersArray}
   */
  public copy<T extends {[key: number]: number}>(buffer: T, offset: number= 0): T {
    buffer[offset] = this.x
    buffer[offset + 1] = this.y
    return buffer
  }

  /**
   * Copies the components successively into the given array.
   * @param buffer The array to copy into
   * @param [offset=0] Zero based index where to start writing in the array
   * @return the given buffer parameter
   */
  public static copy<T extends {[key: number]: number}>(src: IVec2, buffer: T, offset: number= 0): T {
    buffer[offset] = src.x
    buffer[offset + 1] = src.y
    return buffer
  }

  /**
   * Checks for component wise equality with given vector
   * @param other The vector to compare with
   * @return {Boolean} true if components are equal, false otherwise
   */
  public equals(other: IVec2): boolean {
    return ((this.x === other.x) && (this.y === other.y))
  }

  /**
   * Checks for component wise equality
   * @return true if components are equal, false otherwise
   */
  public static equals(a: IVec2, b: IVec2): boolean {
    return ((a.x === b.x) && (a.y === b.y))
  }

  /**
   * Calculates the length of this vector
   * @return The length.
   */
  public length(): number {
    const x = this.x
    const y = this.y
    return Math.sqrt(x * x + y * y)
  }

  /**
   * Calculates the length of this vector
   * @param vec
   * @return The length.
   */
  public static len(vec: IVec2): number {
    const x = vec.x
    const y = vec.y
    return Math.sqrt(x * x + y * y)
  }

  /**
   * Calculates the squared length of this vector
   * @return The squared length.
   */
  public lengthSquared(): number {
    const x = this.x
    const y = this.y
    return x * x + y * y
  }

  /**
   * Calculates the squared length of this vector
   * @param vec
   * @return The squared length.
   */
  public static lengthSquared(vec: IVec2): number {
    const x = vec.x
    const y = vec.y
    return x * x + y * y
  }

  /**
   * Calculates the distance to the given vector
   * @param other The distant vector
   * @return {Number} The distance between the vectors.
   */
  public distance(other: IVec2): number {
    const x = this.x - other.x
    const y = this.y - other.y
    return Math.sqrt(x * x + y * y)
  }

  /**
   * Calculates the distance to the given vector
   * @param a
   * @param b
   * @return The distance between the vectors.
   */
  public static distance(a: IVec2, b: IVec2): number {
    const x = a.x - b.x
    const y = a.y - b.y
    return Math.sqrt(x * x + y * y)
  }

  /**
   * Calculates the squared distance to the given vector
   * @param other The distant vector
   * @return {Number} The squared distance between the vectors.
   */
  public distanceSquared(other: IVec2): number {
    const x = this.x - other.x
    const y = this.y - other.y
    return x * x + y * y
  }

  /**
   * Calculates the squared distance to the given vector
   * @param a
   * @param b
   * @return The squared distance between the vectors.
   */
  public static distanceSquared(a: IVec2, b: IVec2): number {
    const x = a.x - b.x
    const y = a.y - b.y
    return x * x + y * y
  }

  /**
   * Calculates the dot product with the given vector
   * @param other
   * @return The dot product.
   */
  public dot(other: IVec2): number {
    return this.x * other.x + this.y * other.y
  }

  /**
   * Calculates the dot product with the given vector
   * @param a
   * @param b
   * @return The dot product.
   */
  public static dot(a: IVec2, b: IVec2): number {
    return a.x * b.x + a.y * b.y
  }

  /**
   * Normalizes this vector. Applies the result to this vector.
   * @return {Vec2} Reference to `this` for chaining.
   */
  public normalize(): Vec2 {
    const x = this.x
    const y = this.y
    const d = 1.0 / Math.sqrt(x * x + y * y)
    this.x *= d
    this.y *= d
    return this
  }

  /**
   * Normalizes the given vector.
   * @param vec The vector to normalize.
   * @param [out] The vector to write to.
   * @return {Vec2} The given `out` parameter or a new vector.
   */
  public static normalize<T extends IVec2 = Vec2>(vec: IVec2, out?: T|Vec2): T|Vec2 {
    const x = vec.x
    const y = vec.y
    const d = 1.0 / Math.sqrt(x * x + y * y)
    out = (out || new Vec2()) as any
    out.x = x * d
    out.y = y * d
    return out
  }

  /**
   * Inverts this vector.
   * @return {Vec2} Reference to `this` for chaining.
   */
  public invert(): Vec2 {
    this.x = 1.0 / this.x
    this.y = 1.0 / this.y
    return this
  }

  /**
   * Inverts the given vector.
   * @param vec The vector to invert.
   * @param [out] The vector to write to.
   * @return {Vec2} The given `out` parameter or a new vector.
   */
  public static invert<T extends IVec2 = Vec2>(vec: IVec2, out?: T|Vec2): T|Vec2 {
    out = (out || new Vec2()) as any
    out.x = 1.0 / vec.x
    out.y = 1.0 / vec.y
    return out
  }

  /**
   * Negates the components of this vector.
   * @return Reference to `this` for chaining.
   */
  public negate(): Vec2 {
    this.x = -this.x
    this.y = -this.y
    return this
  }

  /**
   * Negates a vector. Applies the result to the second parameter or creates a new vector.
   * @param vec The vector to negate.
   * @param [out] The vector to write to.
   * @return The given `out` parameter or a new vector.
   */
  public static negate<T extends IVec2 = Vec2>(vec: IVec2, out?: T|Vec2): T|Vec2 {
    out = (out || new Vec2()) as any
    out.x = -vec.x
    out.y = -vec.y
    return out
  }

  /**
   * Performs the operation `this += other`
   * @param other The vector to add
   * @return Reference to `this` for chaining.
   */
  public add(other: IVec2): Vec2 {
    this.x += other.x
    this.y += other.y
    return this
  }

  /**
   * Performs the operation `out = vecA + vecB`
   * @param vecA The first vector.
   * @param vecB The second vector.
   * @param [out] The vector to write to.
   * @return The given `out` parameter or a new vector.
   */
  public static add<T extends IVec2 = Vec2>(vecA: IVec2, vecB: IVec2, out?: T|Vec2): T|Vec2 {
    out = (out || new Vec2()) as any
    out.x = vecA.x + vecB.x
    out.y = vecA.y + vecB.y
    return out
  }

  /**
   * Adds the given scalar to `this`
   * @param {Number} scalar The scalar to add.
   * @return {Vec2} Reference to `this` for chaining.
   */
  public addScalar(scalar: number): Vec2 {
    this.x += scalar
    this.y += scalar
    return this
  }

  /**
   * Adds a scalar to each component of a vector.
   * @param vec The first vector.
   * @param scalar The scalar to add.
   * @param [out] The vector to write to.
   * @return {Vec2} The given `out` parameter or a new vector.
   */
  public static addScalar<T extends IVec2 = Vec2>(vec: IVec2, scalar: number, out?: T|Vec2): T|Vec2 {
    out = out || new Vec2()
    out.x = vec.x + scalar
    out.y = vec.y + scalar
    return out
  }

  /**
   * Performs the calculation `this += other * scale`
   * @param other The vector to add
   * @return this vector for chaining
   */
  public addScaled(other: IVec2, scale: number): Vec2 {
    this.x += other.x * scale
    this.y += other.y * scale
    return this
  }

  /**
   * Subtracts the given from this vector from `this`.
   * @param {Vec2} other The vector to subtract.
   * @return {Vec2} Reference to `this` for chaining.
   */
  public subtract(other: IVec2): Vec2 {
    this.x -= other.x
    this.y -= other.y
    return this
  }

  /**
   * Subtracts the second vector from the first.
   * @param vecA The first vector.
   * @param vecB The second vector.
   * @param [out] The vector to write to.
   * @return {Vec2} The given `out` parameter or a new vector.
   */
  public static subtract<T extends IVec2 = Vec2>(vecA: IVec2, vecB: IVec2, out?: T|Vec2): T|Vec2 {
    out = out || new Vec2()
    out.x = vecA.x - vecB.x
    out.y = vecA.y - vecB.y
    return out
  }

  /**
   * Subtracts the given scalar from `this`.
   * @param scalar The scalar to subtract.
   * @return {Vec2} Reference to `this` for chaining.
   */
  public subtractScalar(scalar: number): Vec2 {
    this.x -= scalar
    this.y -= scalar
    return this
  }

  /**
   * Subtracts a scalar from each component of a vector.
   * @param vec The first vector.
   * @param scalar The scalar to add.
   * @param [out] The vector to write to.
   * @return {Vec2} The given `out` parameter or a new vector.
   */
  public static subtractScalar<T extends IVec2 = Vec2>(vec: IVec2, scalar: number, out?: T|Vec2): T|Vec2 {
    out = out || new Vec2()
    out.x = vec.x - scalar
    out.y = vec.y - scalar
    return out
  }

  /**
   * Performs the calculation `this -= other * scale`
   * @param other The vector to subtract
   * @param scale The value to multoply to `other`
   * @return this vector for chaining
   */
  public subtractScaled(other: IVec2, scale: number): Vec2 {
    this.x -= other.x * scale
    this.y -= other.y * scale
    return this
  }

  /**
   * Multiplies `this` with the given vector.
   * @param other The vector to multiply.
   * @return {Vec2} Reference to `this` for chaining.
   */
  public multiply(other: IVec2): Vec2 {
    this.x *= other.x
    this.y *= other.y
    return this
  }

  /**
   * Multiplies two vectors.
   * @param {Vec2} vecA The first vector.
   * @param {Vec2} vecB The second vector.
   * @param {Vec2} [out] The vector to write to.
   * @return {Vec2} The given `out` parameter or a new vector.
   */
  public static multiply<T extends IVec2 = Vec2>(vecA: IVec2, vecB: IVec2, out?: T|Vec2): T|Vec2 {
    out = out || new Vec2()
    out.x = vecA.x * vecB.x
    out.y = vecA.y * vecB.y
    return out
  }

  /**
   * Multiplies `this` with the given scalar.
   * @param scalar The scalar to multiply.
   * @return {Vec2} Reference to `this` for chaining.
   */
  public multiplyScalar(scalar: number): Vec2 {
    this.x *= scalar
    this.y *= scalar
    return this
  }

  /**
   * Multiplies a scalar to each component of a vector.
   * @param vec The first vector.
   * @param scalar The scalar to add.
   * @param [out] The vector to write to.
   * @return {Vec2} The given `out` parameter or a new vector.
   */
  public static multiplyScalar<T extends IVec2 = Vec2>(vec: IVec2, scalar: number, out?: T|Vec2): T|Vec2 {
    out = out || new Vec2()
    out.x = vec.x * scalar
    out.y = vec.y * scalar
    return out
  }

  /**
   * Multiplies `this` with the first vector and adds the second after.
   * @param mul The vector to multiply.
   * @param add The vector to add on top of the multiplication.
   * @return {Vec2} Reference to `this` for chaining.
   */
  public multiplyAdd(mul: IVec2, add: IVec2): Vec2 {
    this.x = this.x * mul.x + add.x
    this.y = this.y * mul.y + add.y
    return this
  }

  /**
   * Multiplies two vectors and adds the third vector.
   * @param vecA The vector to multiply.
   * @param vecB The vector to multiply.
   * @param add The vector to add on top of the multiplication.
   * @param [out] The vector to write to.
   * @return {Vec2} The given `out` parameter or a new vector.
   */
  public static multiplyAdd<T extends IVec2 = Vec2>(vecA: IVec2, vecB: IVec2, add: IVec2, out?: T|Vec2): T|Vec2 {
    out = out || new Vec2()
    out.x = vecA.x * vecB.x + add.x
    out.y = vecA.y * vecB.y + add.y
    return out
  }

  /**
   * Multiplies `this` with the first vector and adds the second scalar after.
   * @param mul The scalar to multiply.
   * @param add The vector to add on top of the multiplication.
   * @return {Vec2} Reference to `this` for chaining.
   */
  public multiplyScalarAdd(mul: number, add: IVec2): Vec2 {
    this.x = this.x * mul + add.x
    this.y = this.y * mul + add.y
    return this
  }

  /**
   * Multiplies a vector with a scalar and adds another vector.
   * @param vecA The vector to multiply.
   * @param mul The scalar to multiply.
   * @param add The vector to add on top of the multiplication.
   * @param [out] The vector to write to.
   * @return {Vec2} The given `out` parameter or a new vector.
   */
  public static multiplyScalarAdd<T extends IVec2 = Vec2>(vecA: IVec2, mul: number, add: IVec2, out?: T|Vec2): T|Vec2 {
    out = out || new Vec2()
    out.x = vecA.x * mul + add.x
    out.y = vecA.y * mul + add.y
    return out
  }

  /**
   * Divides `this` by the given vector.
   * @param other The vector to divide with.
   * @return {Vec2} Reference to `this` for chaining.
   */
  public divide(other: IVec2): Vec2 {
    this.x /= other.x
    this.y /= other.y
    return this
  }

  /**
   * Divides the components of the first vector by the components of the second vector.
   * @param vecA The first vector.
   * @param vecB The second vector.
   * @param [out] The vector to write to.
   * @return {Vec2} The given `out` parameter or a new vector.
   */
  public static divide<T extends IVec2 = Vec2>(vecA: IVec2, vecB: IVec2, out?: T|Vec2): T|Vec2 {
    out = out || new Vec2()
    out.x = vecA.x / vecB.x
    out.y = vecA.y / vecB.y
    return out
  }

  /**
   * Divides `this` by the given scalar.
   * @param scalar The scalar to divide with.
   * @return {Vec2} Reference to `this` for chaining.
   */
  public divideScalar(scalar: number): Vec2 {
    scalar = 1 / scalar
    this.x *= scalar
    this.y *= scalar
    return this
  }

  /**
   * Divides the components of the first vector by the scalar.
   * @param vec The first vector.
   * @param scalar The scalar to use for division.
   * @param out The vector to write to.
   * @return {Vec2} The given `out` parameter or a new vector.
   */
  public static divideScalar<T extends IVec2 = Vec2>(vec: IVec2, scalar: number, out?: T|Vec2): T|Vec2 {
    scalar = 1 / scalar
    out = out || new Vec2()
    out.x = vec.x * scalar
    out.y = vec.y * scalar
    return out
  }

  /**
   * Transforms `this` with the given matrix.
   * @param mat
   * @return {Vec2} Reference to `this` for chaining.
   */
  public transformByMat4(mat: { data: number[]|Float32Array }): IVec2 {
    const x = this.x
    const y = this.y
    const d = mat.data
    this.x = x * d[0] + y * d[4] + d[12]
    this.y = x * d[1] + y * d[5] + d[13]
    return this
  }

  /**
   * Transforms `this` with the given matrix.
   * @param mat
   * @return {Vec2} Reference to `this` for chaining.
   */
  public transformByMat3(mat: { data: number[]|Float32Array }): IVec2 {
    const x = this.x
    const y = this.y
    const d = mat.data
    this.x = x * d[0] + y * d[3]
    this.y = x * d[1] + y * d[4]
    return this
  }

  /**
   * Transforms `this` with the given matrix.
   * @param mat
   * @return {Vec2} Reference to `this` for chaining.
   */
  public transformByMat2(mat: { data: number[]|Float32Array }): IVec2 {
    const x = this.x
    const y = this.y
    const d = mat.data
    this.x = x * d[0] + y * d[2]
    this.y = x * d[1] + y * d[3]
    return this
  }

  /**
   * Performs a component wise clamp operation on the the given vector by using the given min and max vectors.
   * @param a The vector to clamp.
   * @param min Vector with the minimum component values.
   * @param max Vector with the maximum component values.
   * @param [out] The vector to write to.
   * @return {Vec2} The given `out` parameter or a new vector.
   */
  public static clamp<T extends IVec2 = Vec2>(a: IVec2, min: IVec2, max: IVec2, out?: T|Vec2): T|Vec2 {
    const x = a.x
    const y = a.y
    const minX = min.x
    const minY = min.y
    const maxX = max.x
    const maxY = max.y
    out = out || new Vec2()
    out.x = x < minX ? minX : (x > maxX ? maxX : x)
    out.y = y < minY ? minY : (y > maxY ? maxY : y)
    return out
  }

  /**
   * Performs a component wise clamp operation on the the given vector by using the given min and max scalars.
   * @param a The vector to clamp.
   * @param min The minimum scalar value.
   * @param max The maximum scalar value.
   * @param [out] The vector to write to.
   * @return {Vec2} The given `out` parameter or a new vector.
   */
  public static clampScalar<T extends IVec2 = Vec2>(a: IVec2, min: number, max: number, out?: T|Vec2): T|Vec2 {
    const x = a.x
    const y = a.y
    out = out || new Vec2()
    out.x = x < min ? min : (x > max ? max : x)
    out.y = y < min ? min : (y > max ? max : y)
    return out
  }

  /**
   * Performs a component wise min operation on the the given vectors.
   * @param a The first vector.
   * @param b The second vector.
   * @param [out] The vector to write to.
   * @return {Vec2} The given `out` parameter or a new vector.
   */
  public static min<T extends IVec2 = Vec2>(a: IVec2, b: IVec2, out?: T|Vec2): T|Vec2 {
    const aX = a.x
    const aY = a.y
    const bX = b.x
    const bY = b.y
    out = out || new Vec2()
    out.x = aX < bX ? aX : bX
    out.y = aY < bY ? aY : bY
    return out
  }

  /**
   * Performs a component wise min operation on the the given vector and a scalar value.
   * @param a The vector.
   * @param scalar The scalar.
   * @param [out] The vector to write to.
   * @return {Vec2} The given `out` parameter or a new vector.
   */
  public static minScalar<T extends IVec2 = Vec2>(a: IVec2, scalar: number, out?: T|Vec2): T|Vec2 {
    const x = a.x
    const y = a.y
    out = out || new Vec2()
    out.x = x < scalar ? x : scalar
    out.y = y < scalar ? y : scalar
    return out
  }

  /**
   * Performs a component wise max operation on the the given vectors.
   * @param a The first vector.
   * @param b The second vector.
   * @param [out] The vector to write to.
   * @return {Vec2} The given `out` parameter or a new vector.
   */
  public static max<T extends IVec2 = Vec2>(a: IVec2, b: IVec2, out?: T|Vec2): T|Vec2 {
    const aX = a.x
    const aY = a.y
    const bX = b.x
    const bY = b.y
    out = out || new Vec2()
    out.x = aX > bX ? aX : bX
    out.y = aY > bY ? aY : bY
    return out
  }

  /**
   * Performs a component wise max operation on the the given vector and a scalar value.
   * @param a The vector.
   * @param scalar The scalar.
   * @param [out] The vector to write to.
   * @return {Vec2} The given `out` parameter or a new vector.
   */
  public static maxScalar<T extends IVec2 = Vec2>(a: IVec2, scalar: number, out?: T|Vec2): T|Vec2 {
    const x = a.x
    const y = a.y
    out = out || new Vec2()
    out.x = x > scalar ? x : scalar
    out.y = y > scalar ? y : scalar
    return out
  }

  /**
   * Performs a component wise linear interpolation between the given two vectors.
   * @param a The first vector.
   * @param b The second vector.
   * @param t The interpolation value. Assumed to be in range [0:1].
   * @param [out] The vector to write to.
   * @return {Vec2} The given `out` parameter or a new vector.
   */
  public static lerp<T extends IVec2 = Vec2>(a: IVec2, b: IVec2, t: number, out?: T|Vec2): T|Vec2 {
    const x = a.x
    const y = a.y
    out = out || new Vec2()
    out.x = x + (b.x - x) * t
    out.y = y + (b.y - y) * t
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
   * @return {Vec2} The given `out` parameter or a new vector.
   */
  public static barycentric<T extends IVec2 = Vec2>(a: IVec2, b: IVec2, c: IVec2, t1: number, t2: number, out?: T|Vec2): T|Vec2 {
    const x = a.x
    const y = a.y
    out = out || new Vec2()
    out.x = x + t1 * (b.x - x) + t2 * (c.x - x)
    out.y = y + t1 * (b.y - y) + t2 * (c.y - y)
    return out
  }

  /**
   * Performs a component wise smooth interpolation between the given two vectors.
   * @param a The first vector.
   * @param b The second vector.
   * @param t The interpolation value. Assumed to be in range [0:1].
   * @param [out] The vector to write to.
   * @return {Vec2} The given `out` parameter or a new vector.
   */
  public static smooth<T extends IVec2 = Vec2>(a: IVec2, b: IVec2, t: number, out?: T|Vec2): T|Vec2 {
    t = ((t > 1) ? 1 : ((t < 0) ? 0 : t))
    t = t * t * (3 - 2 * t)
    const x = a.x
    const y = a.y
    out = out || new Vec2()
    out.x = x + (b.x - x) * t
    out.y = y + (b.y - y) * t
    return out
  }

  /**
   * Tries to converts the given data to a vector
   * @param {IVec2|number[]|number} data
   * @return {Vec2}
   */
  public static convert(data: any): Vec2 {
    if (Array.isArray(data)) {
      return new Vec2(
        data[0] || 0,
        data[1] || 0,
      )
    } else if (typeof data === 'number') {
      return new Vec2(data, data)
    } else {
      return new Vec2(
        data.x || 0,
        data.y || 0,
      )
    }
  }

  public format(fractionDigits?: number) {
    return Vec2.format(this, fractionDigits)
  }

  public static format(vec: IVec2, fractionDigits: number = 5) {
    return [vec.x.toFixed(fractionDigits), vec.y.toFixed(5)].join(', ')
  }
}
