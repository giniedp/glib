import type { IMat, IVec2, IVec3, IVec4 } from './Types'
import { clamp, hermite, lerp } from './utils/common'

const keyLookup = {
  0: 'x',
  1: 'y',
  2: 'z',
  x: 'x',
  y: 'y',
  z: 'z',
} as Record<number | string, 'x' | 'y' | 'z'>

export function vec3(): IVec3
export function vec3(xyz: number | IVec2 | IVec3 | IVec4 | number[] | null): IVec3
export function vec3(xy: number | IVec2 | IVec3 | IVec4 | number[] | null, z: number): IVec3
export function vec3(x: number | IVec2 | IVec3 | IVec4 | number[] | null, y: number, z: number): IVec3
export function vec3(a?: number | IVec2 | IVec3 | IVec4 | number[] | null, b?: number, c?: number): IVec3 {
  let x = 0
  let y = 0
  let z = 0

  if (a != null) {
    if (typeof a === 'number') {
      x = y = z = a
    } else if (Array.isArray(a)) {
      x = a[0] || 0
      y = a[1] || 0
      z = a[2] || 0
    } else {
      x = a.x || 0
      y = a.y || 0
      z = (a as IVec3).z || 0
    }
  }

  // trailing explicit args always take precedence over whatever `a` provided
  if (c !== undefined) {
    // vec3(x, y, z)
    y = b as number
    z = c as number
  } else if (b !== undefined) {
    // vec3(xy, z)
    z = b as number
  }

  return { x, y, z }
}

/**
 * A vector with three components.
 *
 * @public
 */
export class Vec3 implements IVec2, IVec3 {
  /**
   * Readonly vector with all components set to zero
   */
  public static Zero: Readonly<IVec3> = Object.freeze<IVec3>({ x: 0, y: 0, z: 0 })
  /**
   * Readonly vector with all components set to one
   */
  public static One: Readonly<IVec3> = Object.freeze<IVec3>({ x: 1, y: 1, z: 1 })
  /**
   * Readonly vector x component set to minus one
   */
  public static NegativeUnitX: Readonly<IVec3> = Object.freeze<IVec3>({ x: -1, y: 0, z: 0 })
  /**
   * Readonly vector y component set to minus one
   */
  public static NegativeUnitY: Readonly<IVec3> = Object.freeze<IVec3>({ x: 0, y: -1, z: 0 })
  /**
   * Readonly vector z component set to minus one
   */
  public static NegativeUnitZ: Readonly<IVec3> = Object.freeze<IVec3>({ x: 0, y: 0, z: -1 })
  /**
   * Readonly vector x component set to one
   */
  public static UnitX: Readonly<IVec3> = Object.freeze<IVec3>({ x: 1, y: 0, z: 0 })
  /**
   * Readonly vector y component set to one
   */
  public static UnitY: Readonly<IVec3> = Object.freeze<IVec3>({ x: 0, y: 1, z: 0 })
  /**
   * Readonly vector z component set to one
   */
  public static UnitZ: Readonly<IVec3> = Object.freeze<IVec3>({ x: 0, y: 0, z: 1 })

  /**
   * Temporary variable for short lived calculations. Do not store references to this variable.
   */
  public static readonly $0 = Vec3.create()
  /**
   * Temporary variable for short lived calculations. Do not store references to this variable.
   */
  public static readonly $1 = Vec3.create()
  /**
   * Temporary variable for short lived calculations. Do not store references to this variable.
   */
  public static readonly $2 = Vec3.create()

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
   * Constructs a new instance of {@link Vec3}
   *
   * @param x - Value for the X component
   * @param y - Value for the Y component
   * @param z - Value for the Z component
   */
  constructor(x?: number, y?: number, z?: number) {
    this.x = x == null ? 0 : x
    this.y = y == null ? 0 : y
    this.z = z == null ? 0 : z
  }

  /**
   * Sets the X component
   */
  public setX(value: number): this {
    this.x = value
    return this
  }
  /**
   * Sets the Y component
   */
  public setY(value: number): this {
    this.y = value
    return this
  }
  /**
   * Sets the Z component
   */
  public setZ(value: number): this {
    this.z = value
    return this
  }
  /**
   * Sets the component by using an index (or name)
   */
  public set(key: number | string, value: number): this {
    this[keyLookup[key]] = value
    return this
  }
  /**
   * Gets the component by using an index (or name)
   */
  public get(key: number | string): number {
    return this[keyLookup[key]]
  }

  /**
   * Creates a new vector.
   *
   * @param x - The x component
   * @param y - The y component
   * @param z - The z component
   * @returns A new vector.
   */
  public static create(x?: number, y?: number, z?: number): Vec3 {
    return new Vec3(x ?? 0, y ?? 0, z ?? 0)
  }

  /**
   * Initializes the given vector
   *
   * @param out - the vector to initialize
   * @param x - The x component
   * @param y - The y component
   * @param z - The z component
   */
  public static init<T>(out: T, x: number, y: number, z: number): T & IVec3
  public static init(out: IVec3, x: number, y: number, z: number): IVec3 {
    out.x = x
    out.y = y
    out.z = z
    return out
  }

  /**
   * Initializes the components of this vector with given values.
   *
   * @param x - value for X component
   * @param y - value for Y component
   * @param z - value for Z component
   */
  public init(x: number, y: number, z: number): this {
    this.x = x
    this.y = y
    this.z = z
    return this
  }

  /**
   * Creates a new vector.
   * @param value - The x and y component
   * @returns A new vector.
   */
  public static createAll(value: number): Vec3 {
    return new Vec3(value, value, value)
  }

  /**
   * Initializes the given vector
   *
   * @param out - the vector to initialize
   * @param value - The x and y component
   */
  public static initAll<T>(out: T, value: number): T & IVec3
  public static initAll(out: IVec3, value: number): IVec3 {
    out.x = value
    out.y = value
    out.z = value
    return out
  }

  /**
   * Initializes the components of this vector with given values.
   */
  public initAll(value: number): this {
    this.x = value
    this.y = value
    this.z = value
    return this
  }

  /**
   * Creates a new vector with random values in range [0..1]
   *
   * @returns A new vector.
   */
  public static createRandom(min: number = 0, max: number = 1): Vec3 {
    // prettier-ignore
    return new Vec3(
      lerp(min, max, Math.random()),
      lerp(min, max, Math.random()),
      lerp(min, max, Math.random())
    )
  }

  /**
   * Initializes the given vector with random values in range [0..1]
   *
   * @param out - the vector to initialize
   */
  public static initRandom<T>(out: T, min: number, max: number): T & IVec3
  public static initRandom(out: IVec3, min: number = 0, max: number = 1): IVec3 {
    out.x = lerp(min, max, Math.random())
    out.y = lerp(min, max, Math.random())
    out.z = lerp(min, max, Math.random())
    return out
  }

  /**
   * Initializes the components of this vector with random values in range [0..1]
   */
  public initRandom(min: number = 0, max: number = 1): this {
    this.x = lerp(min, max, Math.random())
    this.y = lerp(min, max, Math.random())
    this.z = lerp(min, max, Math.random())
    return this
  }

  /**
   * Initializes the components of this vector by taking the components from the given vector.
   * @param other - The vector to read from
   *
   */
  public static createFrom(other: IVec3): Vec3 {
    return new Vec3(other.x, other.y, other.z)
  }

  /**
   * Initializes the given vector
   *
   * @param out - the vector to initialize
   * @param other - The vector to read from
   */
  public static initFrom<T>(out: T, other: IVec3): T & IVec3
  public static initFrom(out: IVec3, other: IVec3): IVec3 {
    out.x = other.x
    out.y = other.y
    out.z = other.z
    return out
  }

  /**
   * Initializes the components of this vector by taking the components from the given vector.
   * @param other - The vector to read from
   *
   */
  public initFrom(other: IVec3 | IVec2): this {
    this.x = other.x
    this.y = other.y
    this.z = (other as IVec3).z ?? 0
    return this
  }

  /**
   * Initializes the components of this vector by taking values from the given array in successive order.
   * @param array - The array to read from
   * @param offset - The zero based index at which start reading the values
   *
   */
  public static createFromArray(array: ArrayLike<number>, offset: number = 0): Vec3 {
    return new Vec3(array[offset], array[offset + 1], array[offset + 2])
  }

  /**
   * Initializes the components of this vector by taking values from the given array in successive order.
   * @param array - The array to read from
   * @param offset - The zero based index at which start reading the values
   *
   */
  public initFromArray(array: ArrayLike<number>, offset: number = 0): this {
    this.x = array[offset]
    this.y = array[offset + 1]
    this.z = array[offset + 2]
    return this
  }

  /**
   * Creates a vector from spherical coorinates
   *
   * @param theta - theta angle
   * @param phi - phi angle
   * @param scale - radius
   */
  public static createSpherical(theta: number, phi: number, radius: number = 1): Vec3 {
    return new Vec3(
      radius * Math.sin(theta) * Math.sin(phi),
      radius * Math.cos(theta),
      radius * Math.sin(theta) * Math.cos(phi),
    )
  }

  /**
   * Initializes the components from spherical coorinates
   *
   * @param theta - theta angle
   * @param phi - phi angle
   * @param scale - radius
   */
  public initSpherical(theta: number, phi: number, radius: number = 1): this {
    this.x = radius * Math.sin(theta) * Math.sin(phi)
    this.y = radius * Math.cos(theta)
    this.z = radius * Math.sin(theta) * Math.cos(phi)
    return this
  }

  /**
   * Copies the source vector to the destination vector
   *
   *
   * @returns the destination vector.
   */
  public static copy(src: IVec3): Vec3
  public static copy<T>(src: IVec3, dst: T): T & IVec3
  public static copy(src: IVec3, dst?: IVec3): IVec3 {
    dst = dst || new Vec3()
    dst.x = src.x
    dst.y = src.y
    dst.z = src.z
    return dst
  }

  /**
   * Creates a copy of this vector
   * @returns The cloned vector
   */
  public copy(): Vec3
  public copy<T>(out: T): T & IVec3
  public copy(out?: IVec3): IVec3 {
    out = out || new Vec3()
    out.x = this.x
    out.y = this.y
    out.z = this.z
    return out
  }

  /**
   * Copies the components successively into the given array.
   *
   * @param vec - The vector to copy
   * @param array - The array to copy into
   * @param offset - Zero based index where to start writing in the array
   *
   */
  public static toArray(vec: IVec3): number[]
  public static toArray<T>(vec: IVec3, array: T, offset?: number): T
  public static toArray(vec: IVec3, array: number[] = [], offset: number = 0): number[] {
    array[offset] = vec.x
    array[offset + 1] = vec.y
    array[offset + 2] = vec.z
    return array
  }

  /**
   * Copies the components successively into the given array.
   *
   * @param array - The array to copy into
   * @param offset - Zero based index where to start writing in the array
   *
   */
  public toArray(): number[]
  public toArray<T>(array: T, offset?: number): T
  public toArray(array: number[] = [], offset: number = 0): number[] {
    array[offset] = this.x
    array[offset + 1] = this.y
    array[offset + 2] = this.z
    return array
  }

  /**
   * Checks for component wise equality with given vector
   * @param other - The vector to compare with
   * @returns true if components are equal, false otherwise
   */
  public static equals(v1: IVec3, v2: IVec3): boolean {
    return v1.x === v2.x && v1.y === v2.y && v1.z === v2.z
  }

  /**
   * Checks for component wise equality with given vector
   * @param other - The vector to compare with
   * @returns true if components are equal, false otherwise
   */
  public equals(other: IVec3): boolean {
    return this.x === other.x && this.y === other.y && this.z === other.z
  }

  /**
   * Calculates the length of this vector
   *
   * @returns The length.
   */
  public static magnitude(vec: IVec3): number {
    const x = vec.x
    const y = vec.y
    const z = vec.z
    return Math.sqrt(x * x + y * y + z * z)
  }

  /**
   * Calculates the length of this vector
   * @returns The length.
   */
  public length(): number {
    const x = this.x
    const y = this.y
    const z = this.z
    return Math.sqrt(x * x + y * y + z * z)
  }

  /**
   * Calculates the squared length of this vector
   *
   * @returns The squared length.
   */
  public static lengthSquared(vec: IVec3): number {
    const x = vec.x
    const y = vec.y
    const z = vec.z
    return x * x + y * y + z * z
  }

  /**
   * Calculates the squared length of this vector
   * @returns The squared length.
   */
  public lengthSquared(): number {
    const x = this.x
    const y = this.y
    const z = this.z
    return x * x + y * y + z * z
  }

  /**
   * Calculates the distance to the given vector
   *
   *
   * @returns The distance between the vectors.
   */
  public static distance(a: IVec3, b: IVec3): number {
    const x = a.x - b.x
    const y = a.y - b.y
    const z = a.z - b.z
    return Math.sqrt(x * x + y * y + z * z)
  }

  /**
   * Calculates the distance to the given vector
   * @param other - The distant vector
   * @returns The distance between the vectors.
   */
  public distance(other: IVec3): number {
    const x = this.x - other.x
    const y = this.y - other.y
    const z = this.z - other.z
    return Math.sqrt(x * x + y * y + z * z)
  }

  /**
   * Calculates the squared distance to the given vector
   *
   *
   * @returns The squared distance between the vectors.
   */
  public static distanceSquared(a: IVec3, b: IVec3): number {
    const x = a.x - b.x
    const y = a.y - b.y
    const z = a.z - b.z
    return x * x + y * y + z * z
  }

  /**
   * Calculates the squared distance to the given vector
   * @param other - The distant vector
   * @returns The squared distance between the vectors.
   */
  public distanceSquared(other: IVec3): number {
    const x = this.x - other.x
    const y = this.y - other.y
    const z = this.z - other.z
    return x * x + y * y + z * z
  }

  /**
   * Calculates the dot product with the given vector
   *
   *
   * @returns The dot product.
   */
  public static dot(a: IVec3, b: IVec3): number {
    return a.x * b.x + a.y * b.y + a.z * b.z
  }

  /**
   * Calculates the dot product with the given vector
   *
   * @returns The dot product.
   */
  public dot(other: IVec3): number {
    return this.x * other.x + this.y * other.y + this.z * other.z
  }

  /**
   * Calculates the cross product between two vectors.
   * @param vecA - The first vector.
   * @param vecB - The second vector.
   * @param out - The vector to write to.
   * @returns The given `out` argument or a new vector.
   */
  public static cross(vecA: IVec3, vecB: IVec3): Vec3
  public static cross<T>(vecA: IVec3, vecB: IVec3, out: T): T & IVec3
  public static cross(vecA: IVec3, vecB: IVec3, out?: IVec3): IVec3 {
    out = out || new Vec3()
    const x = vecA.y * vecB.z - vecA.z * vecB.y
    const y = vecA.z * vecB.x - vecA.x * vecB.z
    const z = vecA.x * vecB.y - vecA.y * vecB.x
    out.x = x
    out.y = y
    out.z = z
    return out
  }

  /**
   * Calculates the cross product with another vector.
   * @param other - The second vector.
   * @returns A new vector.
   */
  public cross(other: IVec3): this {
    const x = this.x
    const y = this.y
    const z = this.z
    this.x = y * other.z - z * other.y
    this.y = z * other.x - x * other.z
    this.z = x * other.y - y * other.x
    return this
  }

  /**
   * Normalizes the given vector.
   * @param vec - The vector to normalize.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static normalize(vec: IVec3): Vec3
  public static normalize<T>(vec: IVec3, out: T): T & IVec3
  public static normalize(vec: IVec3, out?: IVec3): IVec3 {
    out = out || new Vec3()
    const x = vec.x
    const y = vec.y
    const z = vec.z
    const d = 1.0 / Math.sqrt(x * x + y * y + z * z)
    out.x = x * d
    out.y = y * d
    out.z = z * d
    return out
  }

  /**
   * Normalizes `this` vector. Applies the result to `this` vector.
   */
  public normalize(): this {
    const x = this.x
    const y = this.y
    const z = this.z
    const d = 1.0 / Math.sqrt(x * x + y * y + z * z)
    this.x *= d
    this.y *= d
    this.z *= d
    return this
  }

  /**
   * Inverts the given vector.
   * @param vec - The vector to invert.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static invert(vec: IVec3): Vec3
  public static invert<T>(vec: IVec3, out: T): T & IVec3
  public static invert(vec: IVec3, out?: IVec3): IVec3 {
    out = out || new Vec3()
    out.x = 1.0 / vec.x
    out.y = 1.0 / vec.y
    out.z = 1.0 / vec.z
    return out
  }

  /**
   * Inverts this vector.
   */
  public invert(): this {
    this.x = 1.0 / this.x
    this.y = 1.0 / this.y
    this.z = 1.0 / this.z
    return this
  }

  /**
   * Negates this vector.
   * @param vec - The vector to negate.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static negate(vec: IVec3): Vec3
  public static negate<T>(vec: IVec3, out: T): T & IVec3
  public static negate(vec: IVec3, out?: IVec3): IVec3 {
    out = out || new Vec3()
    out.x = -vec.x
    out.y = -vec.y
    out.z = -vec.z
    return out
  }

  /**
   * Negates the components of `this` vector. Applies the result to `this`
   */
  public negate(): this {
    this.x = -this.x
    this.y = -this.y
    this.z = -this.z
    return this
  }

  /**
   * Adds two vectors.
   * @param vecA - The first vector.
   * @param vecB - The second vector.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static add(vecA: IVec3, vecB: IVec3): Vec3
  public static add<T>(vecA: IVec3, vecB: IVec3, out: T): T & IVec3
  public static add(vecA: IVec3, vecB: IVec3, out?: IVec3): IVec3 {
    out = out || new Vec3()
    out.x = vecA.x + vecB.x
    out.y = vecA.y + vecB.y
    out.z = vecA.z + vecB.z
    return out
  }

  /**
   * Performs the calculation `this += other`
   * @param other - The vector to add
   */
  public add(other: IVec3): this {
    this.x += other.x
    this.y += other.y
    this.z += other.z
    return this
  }

  /**
   * Adds a scalar to each component of a vector.
   * @param vec - The first vector.
   * @param scalar - The scalar to add.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static addScalar(vec: IVec3, scalar: number): Vec3
  public static addScalar<T>(vec: IVec3, scalar: number, out: T): T & IVec3
  public static addScalar(vec: IVec3, scalar: number, out?: IVec3): IVec3 {
    out = out || new Vec3()
    out.x = vec.x + scalar
    out.y = vec.y + scalar
    out.z = vec.z + scalar
    return out
  }

  /**
   * Performs the calculation `this += scalar`
   * @param scalar - The value to add
   */
  public addScalar(scalar: number): this {
    this.x += scalar
    this.y += scalar
    this.z += scalar
    return this
  }

  public static addXYZ(vec: IVec3, x: number, y: number, z: number): Vec3
  public static addXYZ<T>(vec: IVec3, x: number, y: number, z: number, out: T): T & IVec3
  public static addXYZ(vec: IVec3, x: number, y: number, z: number, out?: IVec3): IVec3 {
    out = out || new Vec3()
    out.x = vec.x + x
    out.y = vec.y + y
    out.z = vec.z + z
    return out
  }

  public addXYZ(x: number, y: number, z: number): this {
    this.x += x
    this.y += y
    this.z += z
    return this
  }

  /**
   * Performs the calculation `v1 + v2 * scale`
   * @returns The given `out` parameter or a new instance.
   */
  public static addScaled(v1: IVec3, v2: IVec3, scale: number): Vec3
  public static addScaled<T>(v1: IVec3, v2: IVec3, scale: number, out: T): T & IVec3
  public static addScaled(v1: IVec3, v2: IVec3, scale: number, out?: IVec3): IVec3 {
    out = out || new Vec3()
    out.x = v1.x + v2.x * scale
    out.y = v1.y + v2.y * scale
    out.z = v1.z + v2.z * scale
    return out
  }

  /**
   * Performs the calculation `this += other * scale`
   * @param other - The vector to add
   */
  public addScaled(other: IVec3, scale: number): this {
    this.x += other.x * scale
    this.y += other.y * scale
    this.z += other.z * scale
    return this
  }

  /**
   * Subtracts the second vector from the first.
   * @param vecA - The first vector.
   * @param vecB - The second vector.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static subtract(vecA: IVec3, vecB: IVec3): Vec3
  public static subtract<T>(vecA: IVec3, vecB: IVec3, out: T): T & IVec3
  public static subtract(vecA: IVec3, vecB: IVec3, out?: IVec3): IVec3 {
    out = out || new Vec3()
    out.x = vecA.x - vecB.x
    out.y = vecA.y - vecB.y
    out.z = vecA.z - vecB.z
    return out
  }

  /**
   * Performs the calculation `this -= other`
   * @param other - The vector to subtract
   */
  public subtract(other: IVec3): this {
    this.x -= other.x
    this.y -= other.y
    this.z -= other.z
    return this
  }

  /**
   * Subtracts a scalar from each component of a vector.
   * @param vec - The first vector.
   * @param scalar - The scalar to add.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static subtractScalar(vec: IVec3, scalar: number): Vec3
  public static subtractScalar<T>(vec: IVec3, scalar: number, out: T): T & IVec3
  public static subtractScalar(vec: IVec3, scalar: number, out?: IVec3): IVec3 {
    out = out || new Vec3()
    out.x = vec.x - scalar
    out.y = vec.y - scalar
    out.z = vec.z - scalar
    return out
  }

  /**
   * Performs the calculation `this -= scalar`
   * @param scalar - The value to subtract
   */
  public subtractScalar(scalar: number): this {
    this.x -= scalar
    this.y -= scalar
    this.z -= scalar
    return this
  }

  /**
   * Performs the calculation `v1 - v2 * scale`
   * @param other - The vector to add
   * @returns The given `out` parameter or a new vector.
   */
  public static subtractScaled(v1: IVec3, v2: IVec3, scale: number): Vec3
  public static subtractScaled<T>(v1: IVec3, v2: IVec3, scale: number, out: T): T & IVec3
  public static subtractScaled(v1: IVec3, v2: IVec3, scale: number, out?: IVec3): IVec3 {
    out = out || new Vec3()
    out.x = v1.x - v2.x * scale
    out.y = v1.y - v2.y * scale
    out.z = v1.z - v2.z * scale
    return out
  }

  /**
   * Performs the calculation `this -= other * scale`
   * @param other - The vector to subtract
   * @param scale - The value to multoply to `other`
   */
  public subtractScaled(other: IVec3, scale: number): this {
    this.x -= other.x * scale
    this.y -= other.y * scale
    this.z -= other.z * scale
    return this
  }

  /**
   * Performs the calculation `this *= other`
   * @param other - The vector to multiply
   */
  public multiply(other: IVec3): this {
    this.x *= other.x
    this.y *= other.y
    this.z *= other.z
    return this
  }

  /**
   * Multiplies two vectors.
   * @param vecA - The first vector.
   * @param vecB - The second vector.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static multiply(vecA: IVec3, vecB: IVec3): Vec3
  public static multiply<T>(vecA: IVec3, vecB: IVec3, out: T): T & IVec3
  public static multiply(vecA: IVec3, vecB: IVec3, out?: IVec3): IVec3 {
    out = out || new Vec3()
    out.x = vecA.x * vecB.x
    out.y = vecA.y * vecB.y
    out.z = vecA.z * vecB.z
    return out
  }

  /**
   * Multiplies a scalar to each component of a vector.
   * @param vec - The first vector.
   * @param scalar - The scalar to add.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static multiplyScalar(vec: IVec3, scalar: number): Vec3
  public static multiplyScalar<T>(vec: IVec3, scalar: number, out: T): T & IVec3
  public static multiplyScalar(vec: IVec3, scalar: number, out?: IVec3): IVec3 {
    out = out || new Vec3()
    out.x = vec.x * scalar
    out.y = vec.y * scalar
    out.z = vec.z * scalar
    return out
  }

  /**
   * Performs the calculation `this *= scalar`
   * @param scalar - The value to multiply
   */
  public multiplyScalar(scalar: number): this {
    this.x *= scalar
    this.y *= scalar
    this.z *= scalar
    return this
  }

  /**
   * Divides the components of the first vector by the components of the second vector.
   * @param vecA - The first vector.
   * @param vecB - The second vector.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static divide(vecA: IVec3, vecB: IVec3): Vec3
  public static divide<T>(vecA: IVec3, vecB: IVec3, out: T): T & IVec3
  public static divide(vecA: IVec3, vecB: IVec3, out?: IVec3): IVec3 {
    out = out || new Vec3()
    out.x = vecA.x / vecB.x
    out.y = vecA.y / vecB.y
    out.z = vecA.z / vecB.z
    return out
  }

  /**
   * Performs the calculation `this /= other`
   * @param other - The vector to divide
   */
  public divide(other: IVec3): this {
    this.x /= other.x
    this.y /= other.y
    this.z /= other.z
    return this
  }

  /**
   * Divides the components of the first vector by the scalar.
   * @param vec - The first vector.
   * @param scalar - The scalar to use for division.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static divideScalar(vec: IVec3, scalar: number): Vec3
  public static divideScalar<T>(vec: IVec3, scalar: number, out: T): T & IVec3
  public static divideScalar(vec: IVec3, scalar: number, out?: IVec3): IVec3 {
    out = out || new Vec3()
    scalar = 1.0 / scalar
    out.x = vec.x * scalar
    out.y = vec.y * scalar
    out.z = vec.z * scalar
    return out
  }

  /**
   * Performs the calculation `this *= (1 / scalar)`
   * @param scalar - The value to divide
   */
  public divideScalar(scalar: number): this {
    scalar = 1.0 / scalar
    this.x *= scalar
    this.y *= scalar
    this.z *= scalar
    return this
  }

  /**
   * Reflects this vector along the given `normal`
   *
   * @param normal - the normal used for reflection
   */
  public reflect(normal: IVec3): this {
    const dot = this.x * normal.x + this.y * normal.y + this.z * normal.z
    this.x = this.x - 2.0 * dot * normal.x
    this.y = this.y - 2.0 * dot * normal.y
    this.z = this.z - 2.0 * dot * normal.z
    return this
  }

  /**
   * Creates a new vector that is the reflected of `vec`
   *
   * @param vec - the vector to reflect
   * @param normal - the normal
   */
  public static reflect(vec: IVec3, normal: IVec3): Vec3
  /**
   * Reflects the `vec` and writes the result to `out`
   *
   * @param vec - the vector to reflect
   * @param normal - the normal
   * @param out - The vector to write to
   */
  public static reflect<T>(vec: IVec3, normal: IVec3, out: T): T & IVec3
  public static reflect(vec: IVec3, normal: IVec3, out?: IVec3): IVec3 {
    out = out || new Vec3()
    const dot = vec.x * normal.x + vec.y * normal.y + vec.z * normal.z
    out.x = vec.x - 2.0 * dot * normal.x
    out.y = vec.y - 2.0 * dot * normal.y
    out.z = vec.z - 2.0 * dot * normal.z
    return out
  }

  /**
   * Refracts this vector
   *
   * @param normal - a normal vector
   * @param eta - refraction index
   */
  public refract(normal: IVec3, eta: number): this {
    const dot = this.x * normal.x + this.y * normal.y + this.z * normal.z
    const k = 1.0 - eta * eta * (1.0 - dot * dot)
    if (k < 0) {
      this.x = 0
      this.y = 0
      this.z = 0
    } else {
      const sqrt = Math.sqrt(k)
      this.x = eta * this.x - (eta * dot + sqrt) * normal.x
      this.y = eta * this.y - (eta * dot + sqrt) * normal.y
      this.z = eta * this.z - (eta * dot + sqrt) * normal.z
    }
    return this
  }

  /**
   * Creates a new vector that is the refracted of `vec`
   *
   * @param vec - the vector to refract
   * @param normal - the normal
   * @param eta - refraction index
   */
  public static refract(vec: IVec3, normal: IVec3, eta: number): Vec3
  /**
   * Refreacts the `vec` but writes the result to `out`
   *
   * @param vec - the vector to refract
   * @param normal - the normal
   * @param eta - refraction index
   * @param out - The vector to write to
   */
  public static refract<T>(vec: IVec3, normal: IVec3, eta: number, out?: T): T & IVec3
  public static refract(vec: IVec3, normal: IVec3, eta: number, out?: IVec3): IVec3 {
    out = out || new Vec3()
    const dot = vec.x * normal.x + vec.y * normal.y + vec.z * normal.z
    const k = 1.0 - eta * eta * (1.0 - dot * dot)
    if (k < 0) {
      out.x = 0
      out.y = 0
      out.z = 0
    } else {
      const sqrt = Math.sqrt(k)
      out.x = eta * vec.x - (eta * dot + sqrt) * normal.x
      out.y = eta * vec.y - (eta * dot + sqrt) * normal.y
      out.z = eta * vec.z - (eta * dot + sqrt) * normal.z
    }
    return out
  }

  /**
   * Transforms `this` with the given quaternion.
   *
   */
  public transformByQuat(quat: IVec4): this {
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
   *
   */
  public transformByMat4(mat: IMat): this {
    const x = this.x
    const y = this.y
    const z = this.z
    const w = 1
    const d = mat
    this.x = x * d[0] + y * d[4] + z * d[8] + w * d[12]
    this.y = x * d[1] + y * d[5] + z * d[9] + w * d[13]
    this.z = x * d[2] + y * d[6] + z * d[10] + w * d[14]
    return this
  }

  /**
   * Transforms `this` with the given matrix.
   *
   */
  public transformByMat3(mat: IMat): this {
    const x = this.x
    const y = this.y
    const z = this.z
    const d = mat
    this.x = x * d[0] + y * d[3] + z * d[6]
    this.y = x * d[1] + y * d[4] + z * d[7]
    this.z = x * d[2] + y * d[5] + z * d[8]
    return this
  }

  /**
   * Transforms `this` with the given matrix. The `z` component of `this` keeps untouched.
   *
   */
  public transformByMat2(mat: IMat): this {
    const x = this.x
    const y = this.y
    const d = mat
    this.x = x * d[0] + y * d[2]
    this.y = x * d[1] + y * d[3]
    return this
  }

  /**
   * Performs a component wise clamp operation on the the given vector between 0 and 1.
   * @param a - The vector to clamp.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static saturate(a: IVec3): Vec3
  public static saturate<T>(a: IVec3, out: T): T & IVec3
  public static saturate(a: IVec3, out?: IVec3): IVec3 {
    out = out || new Vec3()
    out.x = a.x < 0 ? 0 : a.x > 1 ? 1 : a.x
    out.y = a.y < 0 ? 0 : a.y > 1 ? 1 : a.y
    out.z = a.z < 0 ? 0 : a.z > 1 ? 1 : a.z
    return out
  }

  /**
   * Performs a component wise clamp operation on the the given vector by using the given min and max vectors.
   * @param a - The vector to clamp.
   * @param min - Vector with the minimum component values.
   * @param max - Vector with the maximum component values.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static clamp<T extends IVec3 = Vec3>(a: IVec3, min: IVec3, max: IVec3, out?: T | Vec3): T | Vec3 {
    out = out || new Vec3()
    const x = clamp(a.x, min.x, max.x)
    const y = clamp(a.y, min.y, max.y)
    const z = clamp(a.z, min.z, max.z)
    out.x = x
    out.y = y
    out.z = z
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
  public static clampScalar(a: IVec3, min: number, max: number): Vec3
  public static clampScalar<T>(a: IVec3, min: number, max: number, out?: T): T & IVec3
  public static clampScalar(a: IVec3, min: number, max: number, out?: IVec3): IVec3 {
    out = out || new Vec3()
    const x = clamp(a.x, min, max)
    const y = clamp(a.y, min, max)
    const z = clamp(a.z, min, max)
    out.x = x
    out.y = y
    out.z = z
    return out
  }

  /**
   * Performs a component wise min operation on the the given vectors.
   * @param a - The first vector.
   * @param b - The second vector.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static min(a: IVec3, b: IVec3): Vec3
  public static min<T>(a: IVec3, b: IVec3, out?: T): T & IVec3
  public static min(a: IVec3, b: IVec3, out?: IVec3): IVec3 {
    out = out || new Vec3()
    out.x = a.x < b.x ? a.x : b.x
    out.y = a.y < b.y ? a.y : b.y
    out.z = a.z < b.z ? a.z : b.z
    return out
  }

  /**
   * Performs a component wise min operation on the the given vector and a scalar value.
   * @param a - The vector.
   * @param scalar - The scalar.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static minScalar(a: IVec3, scalar: number): Vec3
  public static minScalar<T>(a: IVec3, scalar: number, out?: T): T & IVec3
  public static minScalar(a: IVec3, scalar: number, out?: IVec3): IVec3 {
    out = out || new Vec3()
    out.x = a.x < scalar ? a.x : scalar
    out.y = a.y < scalar ? a.y : scalar
    out.z = a.z < scalar ? a.z : scalar
    return out
  }

  /**
   * Performs a component wise max operation on the the given vectors.
   * @param a - The first vector.
   * @param b - The second vector.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static max(a: IVec3, b: IVec3): Vec3
  public static max<T>(a: IVec3, b: IVec3, out?: T): T & IVec3
  public static max(a: IVec3, b: IVec3, out?: IVec3): IVec3 {
    out = out || new Vec3()
    out.x = a.x > b.x ? a.x : b.x
    out.y = a.y > b.y ? a.y : b.y
    out.z = a.z > b.z ? a.z : b.z
    return out
  }

  /**
   * Performs a component wise max operation on the the given vector and a scalar value.
   * @param a - The vector.
   * @param scalar - The scalar.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static maxScalar(a: IVec3, scalar: number): Vec3
  public static maxScalar<T>(a: IVec3, scalar: number, out?: T): T & IVec3
  public static maxScalar(a: IVec3, scalar: number, out?: IVec3): IVec3 {
    out = out || new Vec3()
    out.x = a.x > scalar ? a.x : scalar
    out.y = a.y > scalar ? a.y : scalar
    out.z = a.z > scalar ? a.z : scalar
    return out
  }

  /**
   * Performs a component wise linear interpolation between the given two vectors.
   *
   * @param a - The first vector.
   * @param b - The second vector.
   * @param t - The interpolation value. Assumed to be in range [0:1].
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static lerp(a: IVec3, b: IVec3, t: number): Vec3
  public static lerp<T>(a: IVec3, b: IVec3, t: number, out?: T): T & IVec3
  public static lerp(a: IVec3, b: IVec3, t: number, out?: IVec3): IVec3 {
    out = out || new Vec3()
    const x = a.x
    const y = a.y
    const z = a.z
    out.x = x + (b.x - x) * t
    out.y = y + (b.y - y) * t
    out.z = z + (b.z - z) * t
    return out
  }

  /**
   * Performs a component wise hermite interpolation between the given two vectors.
   *
   * @param a - The first vector.
   * @param b - The second vector.
   * @param t - The interpolation value. Assumed to be in range [0:1].
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static hermite(a: IVec3, ta: IVec3, b: IVec3, tb: IVec3, t: number): Vec3
  public static hermite<T>(a: IVec3, ta: IVec3, b: IVec3, tb: IVec3, t: number, out?: T): T & IVec3
  public static hermite(a: IVec3, ta: IVec3, b: IVec3, tb: IVec3, t: number, out?: IVec3): IVec3 {
    out = out || new Vec3()
    out.x = hermite(a.x, ta.x, b.x, tb.x, t)
    out.y = hermite(a.y, ta.y, b.y, tb.y, t)
    out.z = hermite(a.z, ta.z, b.z, tb.z, t)
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
  public static barycentric(a: IVec3, b: IVec3, c: IVec3, t1: number, t2: number): Vec3
  public static barycentric<T>(a: IVec3, b: IVec3, c: IVec3, t1: number, t2: number, out?: T): T & IVec3
  public static barycentric(a: IVec3, b: IVec3, c: IVec3, t1: number, t2: number, out?: IVec3): IVec3 {
    out = out || new Vec3()
    const x = a.x
    const y = a.y
    const z = a.z
    out.x = x + t1 * (b.x - x) + t2 * (c.x - x)
    out.y = y + t1 * (b.y - y) + t2 * (c.y - y)
    out.z = z + t1 * (b.z - z) + t2 * (c.z - z)
    return out
  }

  /**
   * Tries to converts the given data to a vector
   */
  public static convert(data: number | IVec3 | number[]): Vec3 {
    if (typeof data === 'number') {
      return new Vec3(data, data, data)
    }
    if (Array.isArray(data)) {
      return new Vec3(data[0], data[1], data[2])
    }
    return new Vec3(data.x, data.y, data.z)
  }

  /**
   * Formats this into a readable string
   *
   * @remarks
   * Mainly meant for debugging. Do not use this for serialization.
   *
   * @param fractionDigits - Number of digits after decimal point
   */
  public format(fractionDigits?: number): string {
    return Vec3.format(this, fractionDigits)
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
  public static format(vec: IVec3, fractionDigits: number = 5): string {
    return 'x: '.concat(
      vec.x.toFixed(fractionDigits),
      ', y: ',
      vec.y.toFixed(fractionDigits),
      ', z: ',
      vec.z.toFixed(fractionDigits),
    )
  }
}

/**
 * Temporary variable for short lived calculations. Do not store references to this variable.
 */
vec3.$0 = { x: 0, y: 0, z: 0 }

/**
 * Temporary variable for short lived calculations. Do not store references to this variable.
 */
vec3.$1 = { x: 0, y: 0, z: 0 }

/**
 * Temporary variable for short lived calculations. Do not store references to this variable.
 */
vec3.$2 = { x: 0, y: 0, z: 0 }

/**
 * Readonly vector with all components set to zero
 */
vec3.Zero = Object.freeze<IVec3>({ x: 0, y: 0, z: 0 })
/**
 * Readonly vector with all components set to one
 */
vec3.One = Object.freeze<IVec3>({ x: 1, y: 1, z: 1 })
/**
 * Readonly vector x component set to minus one
 */
vec3.NegativeUnitX = Object.freeze<IVec3>({ x: -1, y: 0, z: 0 })
/**
 * Readonly vector y component set to minus one
 */
vec3.NegativeUnitY = Object.freeze<IVec3>({ x: 0, y: -1, z: 0 })
/**
 * Readonly vector z component set to minus one
 */
vec3.NegativeUnitZ = Object.freeze<IVec3>({ x: 0, y: 0, z: -1 })
/**
 * Readonly vector x component set to one
 */
vec3.UnitX = Object.freeze<IVec3>({ x: 1, y: 0, z: 0 })
/**
 * Readonly vector y component set to one
 */
vec3.UnitY = Object.freeze<IVec3>({ x: 0, y: 1, z: 0 })
/**
 * Readonly vector z component set to one
 */
vec3.UnitZ = Object.freeze<IVec3>({ x: 0, y: 0, z: 1 })

/**
 * Initializes the given vector
 *
 * @param out - the vector to initialize
 * @param x - The x component
 * @param y - The y component
 * @param z - The z component
 */
export function vec3$init(out: IVec3, x: number, y: number, z: number): IVec3 {
  out.x = x
  out.y = y
  out.z = z
  return out
}

/**
 * Initializes the given vector from another
 *
 * @param out - the vector to initialize
 * @param from - the vector to copy from
 */
export function vec3$initFrom(out: IVec3, from: IVec3): IVec3 {
  out.x = from.x
  out.y = from.y
  out.z = from.z
  return out
}

/**
 * Initializes the vector from array
 *
 * @param out the vector to initialize
 * @param array the array to read from
 * @param offset the offset into the array
 */
export function vec3$initFromArray(out: IVec3, array: ArrayLike<number>, offset: number = 0): IVec3 {
  out.x = array[offset]
  out.y = array[offset + 1]
  out.z = array[offset + 2]
  return out
}

/**
 * Initializes the given vector
 *
 * @param out - the vector to initialize
 * @param value - The x, y and z component
 */
export function vec3$initFill(out: IVec3, value: number): IVec3 {
  out.x = value
  out.y = value
  out.z = value
  return out
}

/**
 * Initializes the given vector with random values in range [0..1]
 *
 * @param out - the vector to initialize
 */
export function vec3$initRandom(out: IVec3, min: number = 0, max: number = 1): IVec3 {
  out.x = lerp(min, max, Math.random())
  out.y = lerp(min, max, Math.random())
  out.z = lerp(min, max, Math.random())
  return out
}

/**
 * Initializes the given vector from spherical coorinates
 *
 * @param out - the vector to initialize
 * @param theta - theta angle
 * @param phi - phi angle
 * @param radius - radius
 */
export function vec3$initSpherical(out: IVec3, theta: number, phi: number, radius: number = 1): IVec3 {
  out.x = radius * Math.sin(theta) * Math.sin(phi)
  out.y = radius * Math.cos(theta)
  out.z = radius * Math.sin(theta) * Math.cos(phi)
  return out
}

/**
 * Creates a copy of a vector
 *
 * @param vec
 * @param out
 */
export function vec3Copy(vec: IVec3, out?: IVec3): IVec3 {
  out ||= { x: 0, y: 0, z: 0 }
  out.x = vec.x
  out.y = vec.y
  out.z = vec.z
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
export function vec3ToArray(vec: IVec3): [number, number, number]
export function vec3ToArray<T extends ArrayLike<number>>(vec: IVec3, array: T, offset?: number): T
export function vec3ToArray(vec: IVec3, array: number[] = [], offset: number = 0): number[] {
  array[offset] = vec.x
  array[offset + 1] = vec.y
  array[offset + 2] = vec.z
  return array
}

/**
 * Checks for component wise equality
 */
export function vec3Equals(a: IVec3, b: IVec3): boolean {
  return a.x === b.x && a.y === b.y && a.z === b.z
}

/**
 * Calculates the length of this vector
 */
export function vec3Length(vec: IVec3): number {
  const x = vec.x
  const y = vec.y
  const z = vec.z
  return Math.sqrt(x * x + y * y + z * z)
}

/**
 * Calculates the squared length of this vector
 */
export function vec3LengthSquared(vec: IVec3): number {
  const x = vec.x
  const y = vec.y
  const z = vec.z
  return x * x + y * y + z * z
}

/**
 * Calculates the distance between two vectors
 */
export function vec3Distance(a: IVec3, b: IVec3): number {
  const x = a.x - b.x
  const y = a.y - b.y
  const z = a.z - b.z
  return Math.sqrt(x * x + y * y + z * z)
}

/**
 * Calculates the squared distance between two vectors
 */
export function vec3DistanceSquared(a: IVec3, b: IVec3): number {
  const x = a.x - b.x
  const y = a.y - b.y
  const z = a.z - b.z
  return x * x + y * y + z * z
}

/**
 * Calculates the dot product of two vectors
 */
export function vec3Dot(a: IVec3, b: IVec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z
}

/**
 * Calculates the cross product of two vectors
 *
 * @param out The first vector
 * @param b The second vector
 * @returns
 */
export function vec3$cross(out: IVec3, b: IVec3): IVec3 {
  const x = out.x
  const y = out.y
  const z = out.z
  out.x = y * b.z - z * b.y
  out.y = z * b.x - x * b.z
  out.z = x * b.y - y * b.x
  return out
}

/**
 * Calculates the cross product of two vectors
 *
 * @param a - The first vector
 * @param b - The second vector
 * @param out - The vector to write to
 */
export function vec3Cross(a: IVec3, b: IVec3, out?: IVec3): IVec3 {
  out ||= { x: 0, y: 0, z: 0 }
  const x = a.x
  const y = a.y
  const z = a.z
  out.x = y * b.z - z * b.y
  out.y = z * b.x - x * b.z
  out.z = x * b.y - y * b.x
  return out
}

/**
 * Normalizes a vector.
 */
export function vec3$normalize(out: IVec3): IVec3 {
  const x = out.x
  const y = out.y
  const z = out.z
  const d = 1.0 / Math.sqrt(x * x + y * y + z * z)
  out.x = x * d
  out.y = y * d
  out.z = z * d
  return out
}

/**
 * Normalizes a vector.
 */
export function vec3Normalize(vec: IVec3, out?: IVec3): IVec3 {
  const x = vec.x
  const y = vec.y
  const z = vec.z
  const d = 1.0 / Math.sqrt(x * x + y * y + z * z)
  out ||= { x: 0, y: 0, z: 0 }
  out.x = x * d
  out.y = y * d
  out.z = z * d
  return out
}

/**
 * Inverts a vector.
 */
export function vec3$invert(out: IVec3): IVec3 {
  out.x = 1.0 / out.x
  out.y = 1.0 / out.y
  out.z = 1.0 / out.z
  return out
}

/**
 * Inverts a vector.
 */
export function vec3Invert(vec: IVec3, out?: IVec3): IVec3 {
  out ||= { x: 0, y: 0, z: 0 }
  out.x = 1.0 / vec.x
  out.y = 1.0 / vec.y
  out.z = 1.0 / vec.z
  return out
}

/**
 * Negates the components of a vector.
 */
export function vec3$negate(out: IVec3): IVec3 {
  out.x = -out.x
  out.y = -out.y
  out.z = -out.z
  return out
}

/**
 * Negates the components of a vector.
 */
export function vec3Negate(vec: IVec3, out?: IVec3): IVec3 {
  out ||= { x: 0, y: 0, z: 0 }
  out.x = -vec.x
  out.y = -vec.y
  out.z = -vec.z
  return out
}

/**
 * Adds components of two vectors
 *
 * @param out - The vector to add to
 * @param other - The vector to add
 */
export function vec3$add(out: IVec3, other: IVec3): IVec3 {
  out.x += other.x
  out.y += other.y
  out.z += other.z
  return out
}

/**
 * Adds components of two vectors
 *
 * @param a - The first vector
 * @param b - The second vector
 * @param out - The vector to write to
 */
export function vec3Add(a: IVec3, b: IVec3, out?: IVec3): IVec3 {
  out ||= { x: 0, y: 0, z: 0 }
  out.x = a.x + b.x
  out.y = a.y + b.y
  out.z = a.z + b.z
  return out
}

/**
 * Adds a value to all components
 *
 * @param out - The vector to add to
 * @param value - The value to add
 */
export function vec3$addScalar(out: IVec3, value: number): IVec3 {
  out.x += value
  out.y += value
  out.z += value
  return out
}

/**
 * Adds a value to all components
 *
 * @param vec - The vector
 * @param value - The value
 * @param out - The vector to write to
 */
export function vec3AddScalar(vec: IVec3, value: number, out?: IVec3): IVec3 {
  out ||= { x: 0, y: 0, z: 0 }
  out.x = vec.x + value
  out.y = vec.y + value
  out.z = vec.z + value
  return out
}

/**
 * Adds the given values to the components
 *
 * @param out - The vector to add to
 * @param x - The value to add to the x component
 * @param y - The value to add to the y component
 * @param z - The value to add to the z component
 */
export function vec3$addScalars(out: IVec3, x: number, y: number, z: number): IVec3 {
  out.x += x
  out.y += y
  out.z += z
  return out
}

/**
 * Adds the given values to the components
 *
 * @param vec - The vector
 * @param x - The value to add to the x component
 * @param y - The value to add to the y component
 * @param z - The value to add to the z component
 * @param out - The vector to write to
 */
export function vec3AddScalars(vec: IVec3, x: number, y: number, z: number, out?: IVec3): IVec3 {
  out ||= { x: 0, y: 0, z: 0 }
  out.x = vec.x + x
  out.y = vec.y + y
  out.z = vec.z + z
  return out
}

/**
 * Adds components of two vectors
 *
 * @param out - The vector to add to
 * @param other - The vector to add
 * @param scale - The value to scale with
 */
export function vec3$addScaled(out: IVec3, other: IVec3, scale: number): IVec3 {
  out.x += other.x * scale
  out.y += other.y * scale
  out.z += other.z * scale
  return out
}

/**
 * Adds components of two vectors
 *
 * @param a - The first vector
 * @param b - The second vector
 * @param scale - The value to scale `b` with
 * @param out - The vector to write to
 */
export function vec3AddScaled(a: IVec3, b: IVec3, scale: number, out?: IVec3): IVec3 {
  out ||= { x: 0, y: 0, z: 0 }
  out.x = a.x + b.x * scale
  out.y = a.y + b.y * scale
  out.z = a.z + b.z * scale
  return out
}

/**
 * Subtracts components of two vectors
 *
 * @param out - The vector to subtract from
 * @param other - The vector to subtract
 */
export function vec3$subtract(out: IVec3, other: IVec3): IVec3 {
  out.x -= other.x
  out.y -= other.y
  out.z -= other.z
  return out
}

/**
 * Subtracts components of two vectors
 *
 * @param a - The first vector
 * @param b - The second vector
 * @param out - The vector to write to
 */
export function vec3Subtract(a: IVec3, b: IVec3, out?: IVec3): IVec3 {
  out ||= { x: 0, y: 0, z: 0 }
  out.x = a.x - b.x
  out.y = a.y - b.y
  out.z = a.z - b.z
  return out
}

/**
 * Subtracts a value from all components
 *
 * @param out - The vector to subtract from
 * @param value - The value to subtract
 */
export function vec3$subtractScalar(out: IVec3, value: number): IVec3 {
  out.x -= value
  out.y -= value
  out.z -= value
  return out
}

/**
 * Subtracts a value from all components
 *
 * @param vec - The vector
 * @param value - The value
 * @param out - The vector to write to
 */
export function vec3SubtractScalar(vec: IVec3, value: number, out?: IVec3): IVec3 {
  out ||= { x: 0, y: 0, z: 0 }
  out.x = vec.x - value
  out.y = vec.y - value
  out.z = vec.z - value
  return out
}

/**
 * Subtracts components of two vectors
 *
 * @param out - The vector to subtract from
 * @param other - The vector to subtract
 * @param scale - The value to scale with
 */
export function vec3$subtractScaled(out: IVec3, other: IVec3, scale: number): IVec3 {
  out.x -= other.x * scale
  out.y -= other.y * scale
  out.z -= other.z * scale
  return out
}

/**
 * Subtracts components of two vectors
 *
 * @param a - The first vector
 * @param b - The second vector
 * @param scale - The value to scale `b` with
 * @param out - The vector to write to
 */
export function vec3SubtractScaled(a: IVec3, b: IVec3, scale: number, out?: IVec3): IVec3 {
  out ||= { x: 0, y: 0, z: 0 }
  out.x = a.x - b.x * scale
  out.y = a.y - b.y * scale
  out.z = a.z - b.z * scale
  return out
}

/**
 * Multiplies components of two vectors
 *
 * @param out - The vector to multiply
 * @param other - The vector to multiply with
 */
export function vec3$multiply(out: IVec3, other: IVec3): IVec3 {
  out.x *= other.x
  out.y *= other.y
  out.z *= other.z
  return out
}

/**
 * Multiplies components of two vectors
 *
 * @param a - The first vector
 * @param b - The second vector
 * @param out - The vector to write to
 */
export function vec3Multiply(a: IVec3, b: IVec3, out?: IVec3): IVec3 {
  out ||= { x: 0, y: 0, z: 0 }
  out.x = a.x * b.x
  out.y = a.y * b.y
  out.z = a.z * b.z
  return out
}

/**
 * Multiplies all components with a value
 *
 * @param out - The vector to multiply
 * @param value - The value to multiply with
 */
export function vec3$multiplyScalar(out: IVec3, value: number): IVec3 {
  out.x *= value
  out.y *= value
  out.z *= value
  return out
}

/**
 * Multiplies all components with a value
 *
 * @param vec - The vector
 * @param value - The value
 * @param out - The vector to write to
 */
export function vec3MultiplyScalar(vec: IVec3, value: number, out?: IVec3): IVec3 {
  out ||= { x: 0, y: 0, z: 0 }
  out.x = vec.x * value
  out.y = vec.y * value
  out.z = vec.z * value
  return out
}

/**
 * Divides components of two vectors
 *
 * @param out - The vector to divide
 * @param other - The vector to divide by
 */
export function vec3$divide(out: IVec3, other: IVec3): IVec3 {
  out.x /= other.x
  out.y /= other.y
  out.z /= other.z
  return out
}

/**
 * Divides components of two vectors
 *
 * @param a - The first vector
 * @param b - The second vector
 * @param out - The vector to write to
 */
export function vec3Divide(a: IVec3, b: IVec3, out?: IVec3): IVec3 {
  out ||= { x: 0, y: 0, z: 0 }
  out.x = a.x / b.x
  out.y = a.y / b.y
  out.z = a.z / b.z
  return out
}

/**
 * Divides all components by a value
 *
 * @param out - The vector to divide
 * @param value - The value to divide by
 */
export function vec3$divideScalar(out: IVec3, value: number): IVec3 {
  value = 1 / value
  out.x *= value
  out.y *= value
  out.z *= value
  return out
}

/**
 * Divides all components by a value
 *
 * @param vec - The vector
 * @param value - The value
 * @param out - The vector to write to
 */
export function vec3DivideScalar(vec: IVec3, value: number, out?: IVec3): IVec3 {
  value = 1 / value
  out ||= { x: 0, y: 0, z: 0 }
  out.x = vec.x * value
  out.y = vec.y * value
  out.z = vec.z * value
  return out
}

/**
 * Reflects a vector along the given normal
 *
 * @param out - The vector to reflect
 * @param normal - The normal used for reflection
 */
export function vec3$reflect(out: IVec3, normal: IVec3): IVec3 {
  const dot = out.x * normal.x + out.y * normal.y + out.z * normal.z
  out.x = out.x - 2.0 * dot * normal.x
  out.y = out.y - 2.0 * dot * normal.y
  out.z = out.z - 2.0 * dot * normal.z
  return out
}

/**
 * Reflects a vector along the given normal
 *
 * @param vec - The vector to reflect
 * @param normal - The normal used for reflection
 * @param out - The vector to write to
 */
export function vec3Reflect(vec: IVec3, normal: IVec3, out?: IVec3): IVec3 {
  const dot = vec.x * normal.x + vec.y * normal.y + vec.z * normal.z
  out ||= { x: 0, y: 0, z: 0 }
  out.x = vec.x - 2.0 * dot * normal.x
  out.y = vec.y - 2.0 * dot * normal.y
  out.z = vec.z - 2.0 * dot * normal.z
  return out
}

/**
 * Refracts a vector
 *
 * @param out - The vector to refract
 * @param normal - The normal
 * @param eta - The refraction index
 */
export function vec3$refract(out: IVec3, normal: IVec3, eta: number): IVec3 {
  return vec3Refract(out, normal, eta, out)
}

/**
 * Refracts a vector
 *
 * @param vec - The vector to refract
 * @param normal - The normal
 * @param eta - The refraction index
 * @param out - The vector to write to
 */
export function vec3Refract(vec: IVec3, normal: IVec3, eta: number, out?: IVec3): IVec3 {
  const dot = vec.x * normal.x + vec.y * normal.y + vec.z * normal.z
  const k = 1.0 - eta * eta * (1.0 - dot * dot)
  out ||= { x: 0, y: 0, z: 0 }
  if (k < 0) {
    out.x = 0
    out.y = 0
    out.z = 0
  } else {
    const s = eta * dot + Math.sqrt(k)
    out.x = eta * vec.x - s * normal.x
    out.y = eta * vec.y - s * normal.y
    out.z = eta * vec.z - s * normal.z
  }
  return out
}

/**
 * Transforms a vector with the given quaternion
 *
 * @param out - The vector to transform
 * @param quat - The quaternion
 */
export function vec3$applyQuat(out: IVec3, quat: IVec4): IVec3 {
  return vec3ApplyQuat(out, quat, out)
}

/**
 * Transforms a vector with the given quaternion
 *
 * @param vec - The vector to transform
 * @param quat - The quaternion
 * @param out - The vector to write to
 */
export function vec3ApplyQuat(vec: IVec3, quat: IVec4, out?: IVec3): IVec3 {
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

  const vx = vec.x
  const vy = vec.y
  const vz = vec.z

  out ||= { x: 0, y: 0, z: 0 }
  out.x = vx * (1 - yy2 - zz2) + vy * (xy2 - wz2) + vz * (xz2 + wy2)
  out.y = vx * (xy2 + wz2) + vy * (1 - xx2 - zz2) + vz * (yz2 - wx2)
  out.z = vx * (xz2 - wy2) + vy * (yz2 + wx2) + vz * (1 - xx2 - yy2)
  return out
}

/**
 * Transforms a vector with the given 4x4 matrix without projective division
 *
 * @param out - The vector to transform
 * @param mat - The matrix
 */
export function vec3$applyMat4(out: IVec3, mat: IMat): IVec3 {
  return vec3ApplyMat4(out, mat, out)
}

/**
 * Transforms a vector with the given 4x4 matrix without projective division
 *
 * @param vec - The vector to transform
 * @param mat - The matrix
 * @param out - The vector to write to
 */
export function vec3ApplyMat4(vec: IVec3, mat: IMat, out?: IVec3): IVec3 {
  const x = vec.x
  const y = vec.y
  const z = vec.z
  const d = mat
  out ||= { x: 0, y: 0, z: 0 }
  out.x = x * d[0] + y * d[4] + z * d[8] + d[12]
  out.y = x * d[1] + y * d[5] + z * d[9] + d[13]
  out.z = x * d[2] + y * d[6] + z * d[10] + d[14]
  return out
}

/**
 * Transforms a vector with the given 4x4 matrix with projective division
 *
 * @param out - The vector to transform
 * @param mat - The matrix
 */
export function vec3$projectMat4(out: IVec3, mat: IMat): IVec3 {
  return vec3ProjectMat4(out, mat, out)
}

/**
 * Transforms a vector with the given 4x4 matrix with projective division
 *
 * @param vec - The vector to transform
 * @param mat - The matrix
 * @param out - The vector to write to
 */
export function vec3ProjectMat4(vec: IVec3, mat: IMat, out?: IVec3): IVec3 {
  const x = vec.x
  const y = vec.y
  const z = vec.z
  const m = mat
  out ||= { x: 0, y: 0, z: 0 }
  out.x = x * m[0] + y * m[4] + z * m[8] + m[12]
  out.y = x * m[1] + y * m[5] + z * m[9] + m[13]
  out.z = x * m[2] + y * m[6] + z * m[10] + m[14]
  let w = x * m[3] + y * m[7] + z * m[11] + m[15]
  if (w !== 1) {
    out.x /= w
    out.y /= w
    out.z /= w
  }
  return out
}

/**
 * Transforms a vector with the 3x3 rotation part of the 4x4 matrix. No translation, no projective division.
 *
 * @param out - The vector to transform
 * @param mat - The matrix
 */
export function vec3$applyMat4Rotation(out: IVec3, mat: IMat): IVec3 {
  return vec3ApplyMat4Rotation(out, mat, out)
}

/**
 * Transforms a vector with the 3x3 rotation part of the 4x4 matrix. No translation, no projective division.
 *
 * @param vec - The vector to transform
 * @param mat - The matrix
 * @param out - The vector to write to
 */
export function vec3ApplyMat4Rotation(vec: IVec3, mat: IMat, out?: IVec3): IVec3 {
  const x = vec.x
  const y = vec.y
  const z = vec.z
  const m = mat
  out ||= { x: 0, y: 0, z: 0 }
  out.x = x * m[0] + y * m[4] + z * m[8]
  out.y = x * m[1] + y * m[5] + z * m[9]
  out.z = x * m[2] + y * m[6] + z * m[10]
  return out
}

/**
 * Transforms a vector with the given 3x3 matrix
 *
 * @param out - The vector to transform
 * @param mat - The matrix
 */
export function vec3$applyMat3(out: IVec3, mat: IMat): IVec3 {
  return vec3ApplyMat3(out, mat, out)
}

/**
 * Transforms a vector with the given 3x3 matrix
 *
 * @param vec - The vector to transform
 * @param mat - The matrix
 * @param out - The vector to write to
 */
export function vec3ApplyMat3(vec: IVec3, mat: IMat, out?: IVec3): IVec3 {
  const x = vec.x
  const y = vec.y
  const z = vec.z
  const d = mat
  out ||= { x: 0, y: 0, z: 0 }
  out.x = x * d[0] + y * d[3] + z * d[6]
  out.y = x * d[1] + y * d[4] + z * d[7]
  out.z = x * d[2] + y * d[5] + z * d[8]
  return out
}

/**
 * Transforms a vector with the given 2x2 matrix. The z component is kept untouched.
 *
 * @param out - The vector to transform
 * @param mat - The matrix
 */
export function vec3$applyMat2(out: IVec3, mat: IMat): IVec3 {
  return vec3ApplyMat2(out, mat, out)
}

/**
 * Transforms a vector with the given 2x2 matrix. The z component is copied untouched.
 *
 * @param vec - The vector to transform
 * @param mat - The matrix
 * @param out - The vector to write to
 */
export function vec3ApplyMat2(vec: IVec3, mat: IMat, out?: IVec3): IVec3 {
  const x = vec.x
  const y = vec.y
  const d = mat
  out ||= { x: 0, y: 0, z: 0 }
  out.x = x * d[0] + y * d[2]
  out.y = x * d[1] + y * d[3]
  out.z = vec.z
  return out
}

/**
 * Clamps all components between 0 and 1
 *
 * @param out - The vector to clamp
 */
export function vec3$saturate(out: IVec3): IVec3 {
  out.x = out.x < 0 ? 0 : out.x > 1 ? 1 : out.x
  out.y = out.y < 0 ? 0 : out.y > 1 ? 1 : out.y
  out.z = out.z < 0 ? 0 : out.z > 1 ? 1 : out.z
  return out
}

/**
 * Clamps all components between 0 and 1
 *
 * @param vec - The vector to clamp
 * @param out - The vector to write to
 */
export function vec3Saturate(vec: IVec3, out?: IVec3): IVec3 {
  out ||= { x: 0, y: 0, z: 0 }
  out.x = vec.x < 0 ? 0 : vec.x > 1 ? 1 : vec.x
  out.y = vec.y < 0 ? 0 : vec.y > 1 ? 1 : vec.y
  out.z = vec.z < 0 ? 0 : vec.z > 1 ? 1 : vec.z
  return out
}

/**
 * Clamps components between the components of the min and max vectors
 *
 * @param out - The vector to clamp
 * @param min - Vector with the minimum component values
 * @param max - Vector with the maximum component values
 */
export function vec3$clamp(out: IVec3, min: IVec3, max: IVec3): IVec3 {
  out.x = clamp(out.x, min.x, max.x)
  out.y = clamp(out.y, min.y, max.y)
  out.z = clamp(out.z, min.z, max.z)
  return out
}

/**
 * Clamps components between the components of the min and max vectors
 *
 * @param vec - The vector to clamp
 * @param min - Vector with the minimum component values
 * @param max - Vector with the maximum component values
 * @param out - The vector to write to
 */
export function vec3Clamp(vec: IVec3, min: IVec3, max: IVec3, out?: IVec3): IVec3 {
  out ||= { x: 0, y: 0, z: 0 }
  out.x = clamp(vec.x, min.x, max.x)
  out.y = clamp(vec.y, min.y, max.y)
  out.z = clamp(vec.z, min.z, max.z)
  return out
}

/**
 * Clamps all components between min and max values
 *
 * @param out - The vector to clamp
 * @param min - The minimum value
 * @param max - The maximum value
 */
export function vec3$clampScalar(out: IVec3, min: number, max: number): IVec3 {
  out.x = out.x < min ? min : out.x > max ? max : out.x
  out.y = out.y < min ? min : out.y > max ? max : out.y
  out.z = out.z < min ? min : out.z > max ? max : out.z
  return out
}

/**
 * Clamps all components between min and max values
 *
 * @param vec - The vector to clamp
 * @param min - The minimum value
 * @param max - The maximum value
 * @param out - The vector to write to
 */
export function vec3ClampScalar(vec: IVec3, min: number, max: number, out?: IVec3): IVec3 {
  out ||= { x: 0, y: 0, z: 0 }
  out.x = vec.x < min ? min : vec.x > max ? max : vec.x
  out.y = vec.y < min ? min : vec.y > max ? max : vec.y
  out.z = vec.z < min ? min : vec.z > max ? max : vec.z
  return out
}

/**
 * Component wise min operation of two vectors
 *
 * @param a - The first vector
 * @param b - The second vector
 * @param out - The vector to write to
 */
export function vec3Min(a: IVec3, b: IVec3, out?: IVec3): IVec3 {
  out ||= { x: 0, y: 0, z: 0 }
  out.x = a.x < b.x ? a.x : b.x
  out.y = a.y < b.y ? a.y : b.y
  out.z = a.z < b.z ? a.z : b.z
  return out
}

/**
 * Component wise min operation of a vector and a value
 *
 * @param vec - The vector
 * @param value - The value
 * @param out - The vector to write to
 */
export function vec3MinScalar(vec: IVec3, value: number, out?: IVec3): IVec3 {
  out ||= { x: 0, y: 0, z: 0 }
  out.x = vec.x < value ? vec.x : value
  out.y = vec.y < value ? vec.y : value
  out.z = vec.z < value ? vec.z : value
  return out
}

/**
 * Component wise max operation of two vectors
 *
 * @param a - The first vector
 * @param b - The second vector
 * @param out - The vector to write to
 */
export function vec3Max(a: IVec3, b: IVec3, out?: IVec3): IVec3 {
  out ||= { x: 0, y: 0, z: 0 }
  out.x = a.x > b.x ? a.x : b.x
  out.y = a.y > b.y ? a.y : b.y
  out.z = a.z > b.z ? a.z : b.z
  return out
}

/**
 * Component wise max operation of a vector and a value
 *
 * @param vec - The vector
 * @param value - The value
 * @param out - The vector to write to
 */
export function vec3MaxScalar(vec: IVec3, value: number, out?: IVec3): IVec3 {
  out ||= { x: 0, y: 0, z: 0 }
  out.x = vec.x > value ? vec.x : value
  out.y = vec.y > value ? vec.y : value
  out.z = vec.z > value ? vec.z : value
  return out
}

/**
 * Component wise linear interpolation between two vectors
 *
 * @param a - The first vector
 * @param b - The second vector
 * @param t - The interpolation value. Assumed to be in range [0:1]
 * @param out - The vector to write to
 */
export function vec3Lerp(a: IVec3, b: IVec3, t: number, out?: IVec3): IVec3 {
  out ||= { x: 0, y: 0, z: 0 }
  out.x = a.x + (b.x - a.x) * t
  out.y = a.y + (b.y - a.y) * t
  out.z = a.z + (b.z - a.z) * t
  return out
}

/**
 * Component wise hermite interpolation between two vectors
 *
 * @param a - The first vector
 * @param ta - The tangent at the first vector
 * @param b - The second vector
 * @param tb - The tangent at the second vector
 * @param t - The interpolation value. Assumed to be in range [0:1]
 * @param out - The vector to write to
 */
export function vec3Hermite(a: IVec3, ta: IVec3, b: IVec3, tb: IVec3, t: number, out?: IVec3): IVec3 {
  out ||= { x: 0, y: 0, z: 0 }
  out.x = hermite(a.x, ta.x, b.x, tb.x, t)
  out.y = hermite(a.y, ta.y, b.y, tb.y, t)
  out.z = hermite(a.z, ta.z, b.z, tb.z, t)
  return out
}

/**
 * Component wise barycentric interpolation of three vectors
 *
 * @param a - The first vector
 * @param b - The second vector
 * @param c - The third vector
 * @param t1 - The first interpolation value. Assumed to be in range [0:1]
 * @param t2 - The second interpolation value. Assumed to be in range [0:1]
 * @param out - The vector to write to
 */
export function vec3Barycentric(a: IVec3, b: IVec3, c: IVec3, t1: number, t2: number, out?: IVec3): IVec3 {
  out ||= { x: 0, y: 0, z: 0 }
  out.x = a.x + t1 * (b.x - a.x) + t2 * (c.x - a.x)
  out.y = a.y + t1 * (b.y - a.y) + t2 * (c.y - a.y)
  out.z = a.z + t1 * (b.z - a.z) + t2 * (c.z - a.z)
  return out
}

/**
 * Formats a vector into a readable string
 *
 * @remarks
 * Mainly meant for debugging. Do not use this for serialization.
 *
 * @param vec - The vector to format
 * @param fractionDigits - Number of digits after decimal point
 */
export function vec3Format(vec: IVec3, fractionDigits: number = 5): string {
  return 'x: '.concat(
    vec.x.toFixed(fractionDigits),
    ', y: ',
    vec.y.toFixed(fractionDigits),
    ', z: ',
    vec.z.toFixed(fractionDigits),
  )
}
