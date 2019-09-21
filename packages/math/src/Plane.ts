import { BoundingBox } from './BoundingBox'
import { BoundingCapsule } from './BoundingCapsule'
import { BoundingSphere } from './BoundingSphere'
import { PlaneIntersectionType, planeIntersectsBox, planeIntersectsCapsule, planeIntersectsPoint, planeIntersectsSphere } from './Collision'
import { ArrayLike, IVec2, IVec3, IVec4 } from './Types'
import { Vec3 } from './Vec3'

const keyLookup = {
  0: 'x', 1: 'y', 2: 'z', 3: 'w',
  x: 'x', y: 'y', z: 'z', w: 'w',
}

/**
 * An infinite plane
 *
 * @public
 */
export class Plane implements IVec2, IVec3, IVec4 {
  /**
   * The X component of the plane normal
   */
  public x: number
  /**
   * The Y component of the plane normal
   */
  public y: number
  /**
   * The Z component of the plane normal
   */
  public z: number
  /**
   * The W component, used as shortest distance from plane to origin
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
   * Sets the W component
   */
  public setW(value: number): this {
    this.w = value
    return this
  }

  /**
   * Sets the component by using an index (or name)
   */
  public set(key: number|string, value: number): this {
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
  public clone(): Plane
  public clone<T>(out?: T): T & Plane
  public clone(out?: IVec4): IVec4 {
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
   * @returns the destination vector.
   */
  public static clone(src: IVec4): Plane
  public static clone<T>(src: IVec4, out?: T): T & IVec4
  public static clone(src: IVec4, out?: IVec4): IVec4 {
    out = out || new Plane()
    out.x = src.x
    out.y = src.y
    out.z = src.z
    out.w = src.w
    return out
  }

  /**
   * Copies the components successively into the given array.
   * @param buffer - The array to copy into
   * @param offset - Zero based index where to start writing in the array
   * @returns the given buffer parameter
   */
  public toArray(): number[]
  public toArray<T>(buffer: T, offset: number): T
  public toArray(buffer: number[] = [], offset: number= 0): number[] {
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
  public static toArray(src: IVec4): number[]
  public static toArray<T>(src: IVec4, buffer: T, offset: number): T
  public static toArray(src: IVec4, buffer: number[] = [], offset: number= 0): number[] {
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
   * Gets the xyz components
   * @param out - The value to write to
   */
  public getNormal(): Vec3
  public getNormal<T>(out?: T): T & IVec3
  public getNormal(out?: IVec3): IVec3 {
    out = out || new Vec3()
    out.x = this.x
    out.y = this.y
    out.z = this.z
    return out
  }

  /**
   * Calculates the distance from plane to a point
   *
   * @param p - the point
   */
  public distanceToPoint(p: IVec3): number {
    return this.x * p.x + this.y * p.y + this.z * p.z + this.w
  }

  public intersectsPoint(point: IVec3): PlaneIntersectionType {
    return planeIntersectsPoint(this, point)
  }

  public intersectsSphere(sphere: BoundingSphere): PlaneIntersectionType {
    return planeIntersectsSphere(this, sphere.center, sphere.radius)
  }

  public intersectsBox(box: BoundingBox): PlaneIntersectionType {
    return planeIntersectsBox(this, box.min, box.max)
  }

  public intersectsCapsule(capsule: BoundingCapsule): PlaneIntersectionType {
    return planeIntersectsCapsule(this, capsule.start, capsule.end, capsule.radius)
  }
}
