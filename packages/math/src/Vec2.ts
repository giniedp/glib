import { IVec2 } from './Types'

const keyLookup = {
  0: 'x', 1: 'y',
  x: 'x', y: 'y',
}

/**
 * A vector with two components.
 *
 * @public
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
   * Constructs a new instance of {@link Vec2}
   *
   * @param x - value for the X component
   * @param y - value for the Y component
   */
  constructor(x: number= 0, y: number= 0) {
    this.x = x
    this.y = y
  }

  /**
   * Sets the X component
   */
  public setX(v: number): this {
    this.x = v
    return this
  }
  /**
   * Sets the Y component
   */
  public setY(v: number): this {
    this.y = v
    return this
  }
  /**
   * Sets the component by using an index (or name)
   */
  public set(key: 0 | 1 | 'x' | 'y', value: number): this {
    this[keyLookup[key]] = value
    return this
  }
  /**
   * Gets the component by using an index (or name)
   */
  public get(key: 0 | 1 | 'x' | 'y'): number {
    return this[keyLookup[key]]
  }

  /**
   * Creates a new vector.
   * @param x - The x component
   * @param y - The y component
   * @returns A new vector.
   */
  public static create(x?: number, y?: number): Vec2 {
    return new Vec2(x || 0, y || 0)
  }

  /**
   * Initializes the given vector
   *
   * @param out - the vector to initialize
   * @param x - The x component
   * @param y - The y component
   */
  public static init<T>(out: T, x: number, y: number, z: number): T & IVec2
  public static init(out: IVec2, x: number, y: number, z: number): IVec2 {
    out.x = x
    out.y = y
    return out
  }

  /**
   * Initializes the components of this vector with given values.
   */
  public init(x: number, y: number): this {
    this.x = x
    this.y = y
    return this
  }

  /**
   * Creates a new vector with random values in range [0..1]
   *
   * @returns A new vector.
   */
  public static createRandom(): Vec2 {
    return new Vec2(Math.random(), Math.random())
  }

  /**
   * Initializes the given vector with random values in range [0..1]
   *
   * @param out - the vector to initialize
   */
  public static initRandom<T>(out: T): T & IVec2
  public static initRandom(out: IVec2): IVec2 {
    out.x = Math.random()
    out.y = Math.random()
    return out
  }

  /**
   * Initializes the components of this vector with random values in range [0..1]
   */
  public initRandom(): this {
    this.x = Math.random()
    this.y = Math.random()
    return this
  }

  /**
   * Creates a new vector with random values in range [-1..1]
   *
   * @returns A new vector.
   */
  public static createRandomUnit(): Vec2 {
    return new Vec2(Math.random() * 2 - 1, Math.random() * 2 - 1)
  }

  /**
   * Initializes the given vector with random values in range [-1..1]
   *
   * @param out - the vector to initialize
   */
  public static initRandomUnit<T>(out: T): T & IVec2
  public static initRandomUnit(out: IVec2): IVec2 {
    out.x = Math.random() * 2 - 1
    out.y = Math.random() * 2 - 1
    return out
  }

  /**
   * Initializes the components of this vector with random values in range [-1..1]
   */
  public initRandomUnit(): this {
    this.x = Math.random() * 2 - 1
    this.y = Math.random() * 2 - 1
    return this
  }

  /**
   * Creates a new vector with all components set to 0.
   * @returns A new vector.
   */
  public static createZero(): Vec2 {
    return new Vec2(0, 0)
  }

  /**
   * Initializes all components of given vector to `0`
   *
   * @param out - the vector to initialize
   */
  public static initZero<T>(out: T): T & IVec2
  public static initZero(out: IVec2): IVec2 {
    out.x = 0
    out.y = 0
    return out
  }

  /**
   * Creates a new vector with all components set to 0.
   * @returns A new vector.
   */
  public initZero(): this {
    this.x = 0
    this.y = 0
    return this
  }

  /**
   * Creates a new vector with all components set to 1.
   * @returns A new vector.
   */
  public static createOne(): Vec2 {
    return new Vec2(1, 1)
  }

  /**
   * Initializes all components of given vector to `1`
   *
   * @param out - the vector to initialize
   */
  public static initOne<T>(out: T): T & IVec2
  public static initOne(out: IVec2): IVec2 {
    out.x = 1
    out.y = 1
    return out
  }

  /**
   * Creates a new vector with all components set to 1.
   * @returns A new vector.
   */
  public initOne(): this {
    this.x = 1
    this.y = 1
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
   * Initializes the components of this vector by taking the components from the given vector.
   */
  public initFrom(other: IVec2): this {
    this.x = other.x
    this.y = other.y
    return this
  }

  /**
   * Initializes the components of this vector by taking values from the given array in successive order.
   * @param buffer - The array to read from
   * @param offset - The zero based index at which start reading the values
   *
   */
  public static createFromArray(buffer: { [key: number]: number }, offset: number= 0): Vec2 {
    return new Vec2(
      buffer[offset],
      buffer[offset + 1],
    )
  }

  /**
   * Initializes the components of this vector by taking values from the given array in successive order.
   * @param buffer - The array to read from
   * @param offset - The zero based index at which start reading the values
   *
   */
  public initFromArray(buffer: { [key: number]: number }, offset: number= 0): this {
    this.x = buffer[offset]
    this.y = buffer[offset + 1]
    return this
  }

  /**
   * Copies the source vector to the destination vector
   *
   *
   * @returns the destination vector.
   */
  public static clone(src: IVec2): Vec2
  public static clone<T>(src: IVec2, dst: T): T & IVec2
  public static clone(src: IVec2, dst?: IVec2): IVec2 {
    dst = dst || new Vec2()
    dst.x = src.x
    dst.y = src.y
    return dst
  }

  /**
   * Creates a copy of this vector
   * @returns The cloned vector
   */
  public clone(): Vec2
  public clone<T>(out: T): T & IVec2
  public clone(out?: IVec2): IVec2 {
    out = out || new Vec2()
    out.x = this.x
    out.y = this.y
    return out
  }

  /**
   * Copies the components of `src` successively into the given array.
   *
   * @param vec - The vector to copy
   * @param array - The array to copy into
   * @param offset - Zero based index where to start writing in the array
   * @returns the given array parameter
   */
  public static toArray(vec: IVec2): number[]
  public static toArray<T>(vec: IVec2, array: T, offset?: number): T
  public static toArray(vec: IVec2, array: number[] = [], offset: number = 0): number[] {
    array[offset] = vec.x
    array[offset + 1] = vec.y
    return array
  }

  /**
   * Copies the components successively into the given array.
   * @param array - The array to copy into
   * @param offset - Zero based index where to start writing in the array
   * @returns the given array parameter
   */
  public toArray(): number[]
  public toArray<T>(array: T, offset?: number): T
  public toArray(array: number[] = [], offset: number= 0): number[] {
    array[offset] = this.x
    array[offset + 1] = this.y
    return array
  }

  /**
   * Checks for component wise equality
   * @returns true if components are equal, false otherwise
   */
  public static equals(a: IVec2, b: IVec2): boolean {
    return ((a.x === b.x) && (a.y === b.y))
  }

  /**
   * Checks for component wise equality with given vector
   * @param other - The vector to compare with
   * @returns true if components are equal, false otherwise
   */
  public equals(other: IVec2): boolean {
    return ((this.x === other.x) && (this.y === other.y))
  }

  /**
   * Calculates the length of this vector
   *
   * @returns The length.
   */
  public static len(vec: IVec2): number {
    const x = vec.x
    const y = vec.y
    return Math.sqrt(x * x + y * y)
  }

  /**
   * Calculates the length of this vector
   * @returns The length.
   */
  public length(): number {
    const x = this.x
    const y = this.y
    return Math.sqrt(x * x + y * y)
  }

  /**
   * Calculates the squared length of this vector
   *
   * @returns The squared length.
   */
  public static lengthSquared(vec: IVec2): number {
    const x = vec.x
    const y = vec.y
    return x * x + y * y
  }

  /**
   * Calculates the squared length of this vector
   * @returns The squared length.
   */
  public lengthSquared(): number {
    const x = this.x
    const y = this.y
    return x * x + y * y
  }

  /**
   * Calculates the distance to the given vector
   *
   *
   * @returns The distance between the vectors.
   */
  public static distance(a: IVec2, b: IVec2): number {
    const x = a.x - b.x
    const y = a.y - b.y
    return Math.sqrt(x * x + y * y)
  }

  /**
   * Calculates the distance to the given vector
   * @param other - The distant vector
   * @returns The distance between the vectors.
   */
  public distance(other: IVec2): number {
    const x = this.x - other.x
    const y = this.y - other.y
    return Math.sqrt(x * x + y * y)
  }

  /**
   * Calculates the squared distance to the given vector
   *
   *
   * @returns The squared distance between the vectors.
   */
  public static distanceSquared(a: IVec2, b: IVec2): number {
    const x = a.x - b.x
    const y = a.y - b.y
    return x * x + y * y
  }

  /**
   * Calculates the squared distance to the given vector
   * @param other - The distant vector
   * @returns The squared distance between the vectors.
   */
  public distanceSquared(other: IVec2): number {
    const x = this.x - other.x
    const y = this.y - other.y
    return x * x + y * y
  }

  /**
   * Calculates the dot product with the given vector
   *
   *
   * @returns The dot product.
   */
  public static dot(a: IVec2, b: IVec2): number {
    return a.x * b.x + a.y * b.y
  }

  /**
   * Calculates the dot product with the given vector
   *
   * @returns The dot product.
   */
  public dot(other: IVec2): number {
    return this.x * other.x + this.y * other.y
  }

  /**
   * Normalizes the given vector.
   * @param vec - The vector to normalize.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static normalize(vec: IVec2): Vec2
  public static normalize<T>(vec: IVec2, out: T): T & IVec2
  public static normalize(vec: IVec2, out?: IVec2): IVec2 {
    const x = vec.x
    const y = vec.y
    const d = 1.0 / Math.sqrt(x * x + y * y)
    out = (out || new Vec2())
    out.x = x * d
    out.y = y * d
    return out
  }

  /**
   * Normalizes this vector. Applies the result to this vector.
   * @returns Reference to `this` for chaining.
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
   * Inverts the given vector.
   * @param vec - The vector to invert.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static invert(vec: IVec2): Vec2
  public static invert<T>(vec: IVec2, out: T): T & IVec2
  public static invert(vec: IVec2, out?: IVec2): IVec2 {
    out = (out || new Vec2())
    out.x = 1.0 / vec.x
    out.y = 1.0 / vec.y
    return out
  }

  /**
   * Inverts this vector.
   * @returns Reference to `this` for chaining.
   */
  public invert(): this {
    this.x = 1.0 / this.x
    this.y = 1.0 / this.y
    return this
  }

  /**
   * Negates a vector. Applies the result to the second parameter or creates a new vector.
   * @param vec - The vector to negate.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static negate(vec: IVec2): Vec2
  public static negate<T>(vec: IVec2, out: T): T & IVec2
  public static negate(vec: IVec2, out?: IVec2): IVec2 {
    out = out || new Vec2()
    out.x = -vec.x
    out.y = -vec.y
    return out
  }

  /**
   * Negates the components of this vector.
   * @returns Reference to `this` for chaining.
   */
  public negate(): this {
    this.x = -this.x
    this.y = -this.y
    return this
  }

  /**
   * Performs the operation `out = vecA + vecB`
   * @param vecA - The first vector.
   * @param vecB - The second vector.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static add(vecA: IVec2, vecB: IVec2): Vec2
  public static add<T>(vecA: IVec2, vecB: IVec2, out: T): T & IVec2
  public static add(vecA: IVec2, vecB: IVec2, out?: IVec2): IVec2 {
    out = out || new Vec2()
    out.x = vecA.x + vecB.x
    out.y = vecA.y + vecB.y
    return out
  }

  /**
   * Performs the operation `this += other`
   * @param other - The vector to add
   * @returns Reference to `this` for chaining.
   */
  public add(other: IVec2): this {
    this.x += other.x
    this.y += other.y
    return this
  }

  /**
   * Adds a scalar to each component of a vector.
   * @param vec - The first vector.
   * @param scalar - The scalar to add.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static addScalar(vec: IVec2, scalar: number): Vec2
  public static addScalar<T>(vec: IVec2, scalar: number, out: T): T & IVec2
  public static addScalar(vec: IVec2, scalar: number, out?: IVec2): IVec2 {
    out = out || new Vec2()
    out.x = vec.x + scalar
    out.y = vec.y + scalar
    return out
  }

  /**
   * Adds the given scalar to `this`
   * @param scalar - The scalar to add.
   * @returns Reference to `this` for chaining.
   */
  public addScalar(scalar: number): this {
    this.x += scalar
    this.y += scalar
    return this
  }

  /**
   * Performs the calculation `this += other * scale`
   * @param other - The vector to add
   * @returns this vector for chaining
   */
  public addScaled(other: IVec2, scale: number): this {
    this.x += other.x * scale
    this.y += other.y * scale
    return this
  }

  /**
   * Subtracts the second vector from the first.
   * @param vecA - The first vector.
   * @param vecB - The second vector.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static subtract(vecA: IVec2, vecB: IVec2): Vec2
  public static subtract<T>(vecA: IVec2, vecB: IVec2, out: T): T & IVec2
  public static subtract(vecA: IVec2, vecB: IVec2, out?: IVec2): IVec2 {
    out = out || new Vec2()
    out.x = vecA.x - vecB.x
    out.y = vecA.y - vecB.y
    return out
  }

  /**
   * Subtracts the given from this vector from `this`.
   * @param other - The vector to subtract.
   * @returns Reference to `this` for chaining.
   */
  public subtract(other: IVec2): this {
    this.x -= other.x
    this.y -= other.y
    return this
  }

  /**
   * Subtracts a scalar from each component of a vector.
   * @param vec - The first vector.
   * @param scalar - The scalar to add.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static subtractScalar(vec: IVec2, scalar: number): Vec2
  public static subtractScalar<T>(vec: IVec2, scalar: number, out: T): T & IVec2
  public static subtractScalar(vec: IVec2, scalar: number, out?: IVec2): IVec2 {
    out = out || new Vec2()
    out.x = vec.x - scalar
    out.y = vec.y - scalar
    return out
  }

  /**
   * Subtracts the given scalar from `this`.
   * @param scalar - The scalar to subtract.
   * @returns Reference to `this` for chaining.
   */
  public subtractScalar(scalar: number): this {
    this.x -= scalar
    this.y -= scalar
    return this
  }

  /**
   * Performs the calculation `this -= other * scale`
   * @param other - The vector to subtract
   * @param scale - The value to multoply to `other`
   * @returns this vector for chaining
   */
  public subtractScaled(other: IVec2, scale: number): this {
    this.x -= other.x * scale
    this.y -= other.y * scale
    return this
  }

  /**
   * Multiplies two vectors.
   * @param vecA - The first vector.
   * @param vecB - The second vector.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static multiply(vecA: IVec2, vecB: IVec2): Vec2
  public static multiply<T>(vecA: IVec2, vecB: IVec2, out: T): T & IVec2
  public static multiply(vecA: IVec2, vecB: IVec2, out?: IVec2): IVec2 {
    out = out || new Vec2()
    out.x = vecA.x * vecB.x
    out.y = vecA.y * vecB.y
    return out
  }

  /**
   * Multiplies `this` with the given vector.
   * @param other - The vector to multiply.
   * @returns Reference to `this` for chaining.
   */
  public multiply(other: IVec2): this {
    this.x *= other.x
    this.y *= other.y
    return this
  }

  /**
   * Multiplies a scalar to each component of a vector.
   * @param vec - The first vector.
   * @param scalar - The scalar to add.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static multiplyScalar(vec: IVec2, scalar: number): Vec2
  public static multiplyScalar<T>(vec: IVec2, scalar: number, out: T): T & IVec2
  public static multiplyScalar(vec: IVec2, scalar: number, out?: IVec2): IVec2 {
    out = out || new Vec2()
    out.x = vec.x * scalar
    out.y = vec.y * scalar
    return out
  }

  /**
   * Multiplies `this` with the given scalar.
   * @param scalar - The scalar to multiply.
   * @returns Reference to `this` for chaining.
   */
  public multiplyScalar(scalar: number): this {
    this.x *= scalar
    this.y *= scalar
    return this
  }

  /**
   * Multiplies two vectors and adds the third vector.
   * @param vecA - The vector to multiply.
   * @param vecB - The vector to multiply.
   * @param add - The vector to add on top of the multiplication.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static multiplyAdd(vecA: IVec2, vecB: IVec2, add: IVec2): Vec2
  public static multiplyAdd<T>(vecA: IVec2, vecB: IVec2, add: IVec2, out: T): T & IVec2
  public static multiplyAdd(vecA: IVec2, vecB: IVec2, add: IVec2, out?: IVec2): IVec2 {
    out = out || new Vec2()
    out.x = vecA.x * vecB.x + add.x
    out.y = vecA.y * vecB.y + add.y
    return out
  }

  /**
   * Multiplies `this` with the first vector and adds the second after.
   * @param mul - The vector to multiply.
   * @param add - The vector to add on top of the multiplication.
   * @returns Reference to `this` for chaining.
   */
  public multiplyAdd(mul: IVec2, add: IVec2): this {
    this.x = this.x * mul.x + add.x
    this.y = this.y * mul.y + add.y
    return this
  }

  /**
   * Multiplies a vector with a scalar and adds another vector.
   * @param vecA - The vector to multiply.
   * @param mul - The scalar to multiply.
   * @param add - The vector to add on top of the multiplication.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static multiplyScalarAdd(vecA: IVec2, mul: number, add: IVec2): Vec2
  public static multiplyScalarAdd<T>(vecA: IVec2, mul: number, add: IVec2, out: T): T & IVec2
  public static multiplyScalarAdd(vecA: IVec2, mul: number, add: IVec2, out?: IVec2): IVec2 {
    out = out || new Vec2()
    out.x = vecA.x * mul + add.x
    out.y = vecA.y * mul + add.y
    return out
  }

  /**
   * Multiplies `this` with the first vector and adds the second scalar after.
   * @param mul - The scalar to multiply.
   * @param add - The vector to add on top of the multiplication.
   * @returns Reference to `this` for chaining.
   */
  public multiplyScalarAdd(mul: number, add: IVec2): this {
    this.x = this.x * mul + add.x
    this.y = this.y * mul + add.y
    return this
  }

  /**
   * Divides the components of the first vector by the components of the second vector.
   * @param vecA - The first vector.
   * @param vecB - The second vector.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static divide(vecA: IVec2, vecB: IVec2): Vec2
  public static divide<T>(vecA: IVec2, vecB: IVec2, out: T): T & IVec2
  public static divide(vecA: IVec2, vecB: IVec2, out?: IVec2): IVec2 {
    out = out || new Vec2()
    out.x = vecA.x / vecB.x
    out.y = vecA.y / vecB.y
    return out
  }

  /**
   * Divides `this` by the given vector.
   * @param other - The vector to divide with.
   * @returns Reference to `this` for chaining.
   */
  public divide(other: IVec2): this {
    this.x /= other.x
    this.y /= other.y
    return this
  }

  /**
   * Divides the components of the first vector by the scalar.
   * @param vec - The first vector.
   * @param scalar - The scalar to use for division.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static divideScalar(vec: IVec2, scalar: number): Vec2
  public static divideScalar<T>(vec: IVec2, scalar: number, out: T): T & IVec2
  public static divideScalar(vec: IVec2, scalar: number, out?: IVec2): IVec2 {
    scalar = 1 / scalar
    out = out || new Vec2()
    out.x = vec.x * scalar
    out.y = vec.y * scalar
    return out
  }

  /**
   * Divides `this` by the given scalar.
   * @param scalar - The scalar to divide with.
   * @returns Reference to `this` for chaining.
   */
  public divideScalar(scalar: number): this {
    scalar = 1 / scalar
    this.x *= scalar
    this.y *= scalar
    return this
  }

  /**
   * Transforms `this` with the given matrix.
   *
   * @returns Reference to `this` for chaining.
   */
  public transformByMat4(mat: { data: ArrayLike<number> }): this {
    const x = this.x
    const y = this.y
    const d = mat.data
    this.x = x * d[0] + y * d[4] + d[12]
    this.y = x * d[1] + y * d[5] + d[13]
    return this
  }

  /**
   * Transforms `this` with the given matrix.
   *
   * @returns Reference to `this` for chaining.
   */
  public transformByMat3(mat: { data: ArrayLike<number> }): this {
    const x = this.x
    const y = this.y
    const d = mat.data
    this.x = x * d[0] + y * d[3]
    this.y = x * d[1] + y * d[4]
    return this
  }

  /**
   * Transforms `this` with the given matrix.
   *
   * @returns Reference to `this` for chaining.
   */
  public transformByMat2(mat: { data: ArrayLike<number> }): this {
    const x = this.x
    const y = this.y
    const d = mat.data
    this.x = x * d[0] + y * d[2]
    this.y = x * d[1] + y * d[3]
    return this
  }

  /**
   * Performs a component wise clamp operation on the the given vector by using the given min and max vectors.
   * @param a - The vector to clamp.
   * @param min - Vector with the minimum component values.
   * @param max - Vector with the maximum component values.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static clamp(a: IVec2, min: IVec2, max: IVec2): Vec2
  public static clamp<T>(a: IVec2, min: IVec2, max: IVec2, out: T): T & IVec2
  public static clamp(a: IVec2, min: IVec2, max: IVec2, out?: IVec2): IVec2 {
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
   * @param a - The vector to clamp.
   * @param min - The minimum scalar value.
   * @param max - The maximum scalar value.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static clampScalar(a: IVec2, min: number, max: number): Vec2
  public static clampScalar<T>(a: IVec2, min: number, max: number, out?: T): T & IVec2
  public static clampScalar(a: IVec2, min: number, max: number, out?: IVec2): IVec2 {
    const x = a.x
    const y = a.y
    out = out || new Vec2()
    out.x = x < min ? min : (x > max ? max : x)
    out.y = y < min ? min : (y > max ? max : y)
    return out
  }

  /**
   * Performs a component wise min operation on the the given vectors.
   * @param a - The first vector.
   * @param b - The second vector.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static min(a: IVec2, b: IVec2): Vec2
  public static min<T>(a: IVec2, b: IVec2, out?: T): T & IVec2
  public static min(a: IVec2, b: IVec2, out?: IVec2): IVec2 {
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
   * @param a - The vector.
   * @param scalar - The scalar.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static minScalar(a: IVec2, scalar: number): Vec2
  public static minScalar<T>(a: IVec2, scalar: number, out?: T): T & IVec2
  public static minScalar(a: IVec2, scalar: number, out?: IVec2): IVec2 {
    const x = a.x
    const y = a.y
    out = out || new Vec2()
    out.x = x < scalar ? x : scalar
    out.y = y < scalar ? y : scalar
    return out
  }

  /**
   * Performs a component wise max operation on the the given vectors.
   * @param a - The first vector.
   * @param b - The second vector.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static max(a: IVec2, b: IVec2): Vec2
  public static max<T>(a: IVec2, b: IVec2, out?: T): T & IVec2
  public static max(a: IVec2, b: IVec2, out?: IVec2): IVec2 {
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
   * @param a - The vector.
   * @param scalar - The scalar.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static maxScalar(a: IVec2, scalar: number): Vec2
  public static maxScalar<T>(a: IVec2, scalar: number, out?: T): T & IVec2
  public static maxScalar(a: IVec2, scalar: number, out?: IVec2): IVec2 {
    const x = a.x
    const y = a.y
    out = out || new Vec2()
    out.x = x > scalar ? x : scalar
    out.y = y > scalar ? y : scalar
    return out
  }

  /**
   * Performs a component wise linear interpolation between the given two vectors.
   * @param a - The first vector.
   * @param b - The second vector.
   * @param t - The interpolation value. Assumed to be in range [0:1].
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static lerp(a: IVec2, b: IVec2, t: number): Vec2
  public static lerp<T>(a: IVec2, b: IVec2, t: number, out?: T): T & IVec2
  public static lerp(a: IVec2, b: IVec2, t: number, out?: IVec2): IVec2 {
    const x = a.x
    const y = a.y
    out = out || new Vec2()
    out.x = x + (b.x - x) * t
    out.y = y + (b.y - y) * t
    return out
  }

  /**
   * Performs a component wise barycentric interpolation of the given vectors.
   * @param a - The first vector.
   * @param b - The second vector.
   * @param c - The third vector.
   * @param t1 - The first interpolation value. Assumed to be in range [0:1].
   * @param t2 - The second interpolation value. Assumed to be in range [0:1].
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static barycentric(a: IVec2, b: IVec2, c: IVec2, t1: number, t2: number): Vec2
  public static barycentric<T>(a: IVec2, b: IVec2, c: IVec2, t1: number, t2: number, out?: T): T & IVec2
  public static barycentric(a: IVec2, b: IVec2, c: IVec2, t1: number, t2: number, out?: IVec2): IVec2 {
    const x = a.x
    const y = a.y
    out = out || new Vec2()
    out.x = x + t1 * (b.x - x) + t2 * (c.x - x)
    out.y = y + t1 * (b.y - y) + t2 * (c.y - y)
    return out
  }

  /**
   * Performs a component wise smooth interpolation between the given two vectors.
   * @param a - The first vector.
   * @param b - The second vector.
   * @param t - The interpolation value. Assumed to be in range [0:1].
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static smooth(a: IVec2, b: IVec2, t: number): Vec2
  public static smooth<T>(a: IVec2, b: IVec2, t: number, out?: T): T & IVec2
  public static smooth(a: IVec2, b: IVec2, t: number, out?: IVec2): IVec2 {
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
   *
   *
   */
  public static convert(data: any): Vec2 {
    if (Array.isArray(data)) {
      return new Vec2(data[0], data[1])
    } else if (typeof data === 'number') {
      return new Vec2(data, data)
    } else {
      return new Vec2(data.x, data.y)
    }
  }

  /**
   * Formats this into a readable string
   *
   * @remarks
   * Mainly meant for debugging. Do not use this for serialization.
   *
   * @param fractionDigits - Number of digits after decimal point
   */
  public format(fractionDigits?: number) {
    return Vec2.format(this, fractionDigits)
  }

  /**
   * Formats given value into a readable string
   *
   * @remarks
   * Mainly meant for debugging. Do not use this for serialization.
   *
   * @param vec - The value to format
   * @param fractionDigits - Number of digits after decimal point
   */
  public static format(vec: IVec2, fractionDigits: number = 5) {
    return vec.x.toFixed(fractionDigits) +
      ',' + vec.y.toFixed(fractionDigits)
  }
}
