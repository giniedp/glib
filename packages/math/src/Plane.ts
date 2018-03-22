import { ArrayLike, IVec2, IVec3, IVec4 } from './Types'
import { Vec3 } from './Vec3'

const keys = ['x', 'y', 'z', 'w']
const keyLookup = {
  0: 'x', 1: 'y', 2: 'z', 3: 'w',
  x: 'x', y: 'y', z: 'z', w: 'w',
}

/**
 * Describes a plane with four components.
 *
 * @public
 */
export class Plane implements IVec2, IVec3, IVec4 {
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
   * The W component, used as distance
   */
  public w: number

  /**
   * Initializes a new vector
   * @param x - Value for the X component
   * @param y - Value for the Y component
   * @param z - Value for the Z component
   * @param w - Value for the W component
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
  public setX(value: number): Plane {
    this.x = value
    return this
  }

  /**
   * Sets the Y component
   */
  public setY(value: number): Plane {
    this.y = value
    return this
  }

  /**
   * Sets the Z component
   */
  public setZ(value: number): Plane {
    this.z = value
    return this
  }

  /**
   * Sets the W component
   */
  public setW(value: number): Plane {
    this.w = value
    return this
  }

  /**
   * Sets the component by using an index (or name)
   */
  public set(key: number|string, value: number): Plane {
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
   * Gets the xyz components
   * @param out - The value to write to
   */
  public getNormal<T extends IVec3 = Vec3>(out?: T|Vec3): T|Vec3 {
    out = out || new Vec3()
    out.x = this.x
    out.y = this.y
    out.z = this.z
    return out
  }

  /**
   * Initializes the components of this vector with given values.
   * @param x - value for X component
   * @param y - value for Y component
   * @param z - value for Z component
   * @param w - value for W component
   * @returns this vector for chaining
   */
  public init(x: number, y: number, z: number, w: number): Plane {
    this.x = x
    this.y = y
    this.z = z
    this.w = w
    return this
  }

  /**
   * Creates a new vector.
   * @param x - The x component
   * @param y - The y component
   * @param z - The z component
   * @param w - The w component
   * @returns A new vector.
   */
  public static create(x?: number, y?: number, z?: number, w?: number): Plane {
    return new Plane(x, y, z, w)
  }

  /**
   * Resets all components to zero
   * @returns this vector for chaining
   */
  public initZero(): Plane {
    this.x = 0
    this.y = 0
    this.z = 0
    this.w = 0
    return this
  }

  /**
   * Creates a new vector with all components set to 0.
   * @returns A new vector.
   */
  public static createZero(): Plane {
    return new Plane(0, 0, 0, 0)
  }

  /**
   * Initializes the components of this vector by taking the components from the given vector.
   * @param other - The vector to read from
   * @returns this vector for chaining
   */
  public initFrom(other: IVec4): Plane {
    this.x = other.x
    this.y = other.y
    this.z = other.z
    this.w = other.w
    return this
  }

  /**
   * Initializes the components of this vector by taking the components from the given vector.
   * @param other - The vector to read from
   * @returns this vector for chaining
   */
  public static createFrom(other: IVec4): Plane {
    return new Plane(
      other.x,
      other.y,
      other.z,
      other.w,
    )
  }

  /**
   * Initializes the components of this vector by taking values from the given array in successive order.
   * @param buffer - The array to read from
   * @param offset - The zero based index at which start reading the values
   * @returns this vector for chaining
   */
  public initFromBuffer(buffer: ArrayLike<number>, offset: number= 0): Plane {
    this.x = buffer[offset]
    this.y = buffer[offset + 1]
    this.z = buffer[offset + 2]
    this.w = buffer[offset + 3]
    return this
  }

  /**
   * Initializes the components of this vector by taking values from the given array in successive order.
   * @param buffer - The array to read from
   * @param offset - The zero based index at which start reading the values
   * @returns this vector for chaining
   */
  public static createFromBuffer(buffer: ArrayLike<number>, offset: number= 0): Plane {
    return new Plane(
      buffer[offset],
      buffer[offset + 1],
      buffer[offset + 2],
      buffer[offset + 3],
    )
  }

  /**
   * Creates a copy of this vector
   * @returns The cloned vector
   */
  public clone<T extends IVec4 = Plane>(out?: T|Plane): T|Plane {
    out = out || new Plane()
    out.x = this.x
    out.y = this.y
    out.z = this.z
    out.w = this.w
    return out
  }

  /**
   * Copies the source vector to the destination vector
   *
   *
   * @returns the destination vector.
   */
  public static clone<T extends IVec4 = Plane>(src: IVec4, dst?: T|Plane): T|Plane {
    dst = dst || new Plane()
    dst.x = src.x
    dst.y = src.y
    dst.z = src.z
    dst.w = src.w
    return dst
  }

  /**
   * Copies the components successively into the given array.
   * @param buffer - The array to copy into
   * @param offset - Zero based index where to start writing in the array
   * @returns the given buffer parameter
   */
  public copy<T extends ArrayLike<number>>(buffer: T, offset: number= 0): T {
    buffer[offset] = this.x
    buffer[offset + 1] = this.y
    buffer[offset + 2] = this.z
    buffer[offset + 3] = this.w
    return buffer
  }

  /**
   * Copies the components successively into the given array.
   * @param buffer - The array to copy into
   * @param offset - Zero based index where to start writing in the array
   * @returns the given buffer parameter
   */
  public static copy<T extends ArrayLike<number>>(src: IVec4, buffer: T, offset: number= 0): T {
    buffer[offset] = src.x
    buffer[offset + 1] = src.y
    buffer[offset + 2] = src.z
    buffer[offset + 3] = src.w
    return buffer
  }

  /**
   * Checks for component wise equality with given vector
   * @returns true if components are equal, false otherwise
   */
  public equals(other: IVec4): boolean {
    return ((this.x === other.x) && (this.y === other.y) && (this.z === other.z) && (this.w === other.w))
  }

  /**
   * Checks for component wise equality
   * @returns true if components are equal, false otherwise
   */
  public static equals(a: IVec4, b: IVec4): boolean {
    return ((a.x === b.x) && (a.y === b.y) && (a.z === b.z) && (a.w === b.w))
  }

  /**
   * Calculates the dot product with the `other` vector
   *
   * @returns The dot product.
   */
  public dot(other: IVec4): number {
    return this.x * other.x + this.y * other.y + this.z * other.z + this.w * other.w
  }

  /**
   * Calculates the dot product with the given vector
   *
   *
   * @returns The dot product.
   */
  public static dot(a: IVec4, b: IVec4): number {
    return a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w
  }

  /**
   * Calculates the dot product with the `other` vector
   *
   * @returns The dot product.
   */
  public dotCoordinate(other: IVec4): number {
    return this.x * other.x + this.y * other.y + this.z * other.z + this.w
  }

  /**
   * Calculates the dot product with the given vector
   *
   *
   * @returns The dot product.
   */
  public static dotCoordinate(plane: IVec4, b: IVec3): number {
    return plane.x * b.x + plane.y * b.y + plane.z * b.z + plane.w
  }

  /**
   * Calculates the dot product with the `other` vector
   *
   * @returns The dot product.
   */
  public dotNormal(other: IVec3): number {
    return this.x * other.x + this.y * other.y + this.z * other.z
  }

  /**
   * Calculates the dot product with the given vector
   *
   *
   * @returns The dot product.
   */
  public static dotNormal(plane: IVec4, b: IVec3): number {
    return plane.x * b.x + plane.y * b.y + plane.z * b.z
  }

  /**
   * Normalizes `this` vector. Applies the result to `this` vector.
   * @returns this vector for chaining
   */
  public normalize(): Plane {
    const x = this.x
    const y = this.y
    const z = this.z
    const w = this.w
    let d = Math.sqrt(x * x + y * y + z * z + w * w)
    if (Math.abs(d - 1) < Number.EPSILON) {
      return this
    }
    d = 1.0 / d
    this.x *= d
    this.y *= d
    this.z *= d
    this.w *= d
    return this
  }

  /**
   * Normalizes the given vector.
   * @param vec - The vector to normalize.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new instance.
   */
  public static normalize<T extends IVec4 = Plane>(vec: IVec4, out?: T|Plane): T|Plane {
    out = out || new Plane()
    const x = vec.x
    const y = vec.y
    const z = vec.z
    const w = vec.w
    let d = Math.sqrt(x * x + y * y + z * z + w * w)
    if (Math.abs(d - 1) < Number.EPSILON) {
      d = 1
    } else {
      d = 1.0 / d
    }
    out.x = x * d
    out.y = y * d
    out.z = z * d
    out.w = w * d
    return out
  }

}
