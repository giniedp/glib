import { Mat3 } from './Mat3'
import { Mat4 } from './Mat4'
import { ArrayLike, IVec2, IVec3, IVec4 } from './Types'
import { Vec3 } from './Vec3'

const keyLookup = {
  0: 'x', 1: 'y', 2: 'z', 3: 'w',
  x: 'x', y: 'y', z: 'z', w: 'w',
}

/**
 * A quaternion.
 *
 * @public
 */
export class Quat implements IVec2, IVec3, IVec4 {
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
   * Constructs a new instance of {@link Quat}
   *
   * @param x - Value for the X component
   * @param y - Value for the Y component
   * @param z - Value for the Z component
   * @param w - Value for the W component
   */
  constructor(x?: number, y?: number, z?: number, w?: number) {
    this.x = x || 0
    this.y = y || 0
    this.z = z || 0
    this.w = w || 0
  }

  /**
   * Sets the X component
   */
  public setX(value: number): Quat {
    this.x = value
    return this
  }

  /**
   * Sets the Y component
   */
  public setY(value: number): Quat {
    this.y = value
    return this
  }

  /**
   * Sets the Z component
   */
  public setZ(value: number): Quat {
    this.z = value
    return this
  }

  /**
   * Sets the W component
   */
  public setW(value: number): Quat {
    this.w = value
    return this
  }

  /**
   * Sets the component by using an index (or name)
   */
  public set(key: number | string, value: number): Quat {
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
   * Creates a new instance
   *
   * @param x - The x component
   * @param y - The y component
   * @param z - The z component
   * @param w - The w component
   */
  public static create(x?: number, y?: number, z?: number, w?: number): Quat {
    return new Quat(x, y, z, w)
  }

  /**
   * Initializes the given instance
   *
   * @param out - the vector to initialize
   * @param x - The x component
   * @param y - The y component
   * @param z - The z component
   * @param w - The w component
   */
  public static init<T>(out: T, x: number, y: number, z: number, w: number): T & IVec4
  public static init(out: IVec4, x: number, y: number, z: number, w: number): IVec4 {
    out.x = x
    out.y = y
    out.z = z
    out.w = w
    return out
  }

  /**
   * Initializes components of the quaternion with given values.
   * @param x - value for X component
   * @param y - value for Y component
   * @param z - value for Z component
   * @param w - value for W component
   */
  public init(x: number, y: number, z: number, w: number): this {
    this.x = x
    this.y = y
    this.z = z
    this.w = w
    return this
  }

  /**
   * Creates a new vector with `x`, `y` and `z` components set to `0` and `w` component set to `1`.
   * @returns A new quaternion
   */
  public static createIdentity(): Quat {
    return new Quat(0, 0, 0, 1)
  }

  /**
   * Initializes the given instance
   *
   * @param out - the instance to initialize
   */
  public static initIdentity<T>(out: T): T & IVec4
  public static initIdentity(out: IVec4): IVec4 {
    out.x = 0
    out.y = 0
    out.z = 0
    out.w = 1
    return out
  }

  /**
   * Initializes the instance to `(0, 0, 0, 1)`.
   */
  public initIdentity(): this {
    this.y = 0
    this.x = 0
    this.z = 0
    this.w = 1
    return this
  }

  /**
   * Creates a new instance with all components set to 0.
   */
  public static createZero(): Quat {
    return new Quat(0, 0, 0, 0)
  }

  /**
   * Initializes all components of `out` to `0`
   *
   * @param out - the instance to initialize
   */
  public static initZero<T>(out: T): T & IVec4
  public static initZero(out: IVec4): IVec4 {
    out.x = 0
    out.y = 0
    out.z = 0
    out.w = 0
    return out
  }

  /**
   * Initializes all components of `this` to `0`
   */
  public initZero(): this {
    this.x = 0
    this.y = 0
    this.z = 0
    this.w = 0
    return this
  }

  /**
   * Creates a new instance by taking the components from the given quaternion or vector.
   *
   * @returns a new quaternion
   */
  public static createFrom(other: IVec4): Quat {
    return new Quat(
      other.x,
      other.y,
      other.z,
      other.w,
    )
  }

  /**
   * Initializes the components of this quaternion by taking the components from the given quaternion or vector.
   *
   */
  public initFrom(other: IVec4): Quat {
    this.x = other.x
    this.y = other.y
    this.z = other.z
    this.w = other.w
    return this
  }

  /**
   * Creates a new instance by extracting rotation from matrix
   */
  public static createFromMat3(m: Mat3): Quat {
    return new Quat().initFromMat3(m)
  }

  /**
   * Initializes this instance by extracting rotation from given materix
   */
  public initFromMat3(m: Mat3): this {
    // http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm
    const a = m.m
    const m00 = a[0]
    const m01 = a[1]
    const m02 = a[2]

    const m10 = a[3]
    const m11 = a[4]
    const m12 = a[5]

    const m20 = a[6]
    const m21 = a[7]
    const m22 = a[8]

    const tr = m00 + m11 + m22

    if (tr > 0) {
      const s = Math.sqrt(tr + 1.0) * 2 // S=4*qw
      this.w = 0.25 * s
      this.x = (m12 - m21) / s
      this.y = (m20 - m02) / s
      this.z = (m01 - m10) / s
    } else if ((m00 > m11) && (m00 > m22)) {
      const s = Math.sqrt(1.0 + m00 - m11 - m22) * 2 // S=4*qx
      this.w = (m12 - m21) / s
      this.x = 0.25 * s
      this.y = (m10 + m01) / s
      this.z = (m20 + m02) / s
    } else if (m11 > m22) {
      const s = Math.sqrt(1.0 + m11 - m00 - m22) * 2 // S=4*qy
      this.w = (m20 - m02) / s
      this.x = (m10 + m01) / s
      this.y = 0.25 * s
      this.z = (m21 + m12) / s
    } else {
      const s = Math.sqrt(1.0 + m22 - m00 - m11) * 2 // S=4*qz
      this.w = (m01 - m10) / s
      this.x = (m20 + m02) / s
      this.y = (m21 + m12) / s
      this.z = 0.25 * s
    }
    return this
  }

  /**
   * Creates a new instance by extracting rotation from matrix
   */
  public static createFromMat4(m: Mat4): Quat {
    return new Quat().initFromMat4(m)
  }

  /**
   * Initializes this instance by extracting rotation from given materix
   */
  public initFromMat4(m: Mat4): this {
    // http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm
    const a = m.m
    const m00 = a[0]
    const m01 = a[1]
    const m02 = a[2]

    const m10 = a[4]
    const m11 = a[5]
    const m12 = a[6]

    const m20 = a[8]
    const m21 = a[9]
    const m22 = a[10]

    const tr = m00 + m11 + m22

    if (tr > 0) {
      const s = Math.sqrt(tr + 1.0) * 2 // S=4*qw
      this.w = 0.25 * s
      this.x = (m12 - m21) / s
      this.y = (m20 - m02) / s
      this.z = (m01 - m10) / s
    } else if ((m00 > m11) && (m00 > m22)) {
      const s = Math.sqrt(1.0 + m00 - m11 - m22) * 2 // S=4*qx
      this.w = (m12 - m21) / s
      this.x = 0.25 * s
      this.y = (m10 + m01) / s
      this.z = (m20 + m02) / s
    } else if (m11 > m22) {
      const s = Math.sqrt(1.0 + m11 - m00 - m22) * 2 // S=4*qy
      this.w = (m20 - m02) / s
      this.x = (m10 + m01) / s
      this.y = 0.25 * s
      this.z = (m21 + m12) / s
    } else {
      const s = Math.sqrt(1.0 + m22 - m00 - m11) * 2 // S=4*qz
      this.w = (m01 - m10) / s
      this.x = (m20 + m02) / s
      this.y = (m21 + m12) / s
      this.z = 0.25 * s
    }
    return this
  }

  /**
   * Creates a new instance by taking values from the given array in successive order.
   *
   * @param array - The array to read from
   * @param offset - The zero based index at which to start reading
   */
  public static createFromArray(array: ArrayLike<number>, offset: number= 0): Quat {
    return new Quat(
      array[offset],
      array[offset + 1],
      array[offset + 2],
      array[offset + 3],
    )
  }

  /**
   * Initializes the components of this instance by taking values from the given array in successive order.
   *
   * @param array - The array to read from
   * @param offset - The zero based index at which to start reading
   */
  public initFromArray(array: ArrayLike<number>, offset: number= 0): this {
    this.x = array[offset]
    this.y = array[offset + 1]
    this.z = array[offset + 2]
    this.w = array[offset + 3]
    return this
  }

  /**
   * Creates a new instance from given axis vector and an angle
   *
   * @param axis - The axis vector
   * @param angle - The angle in radians
   */
  public static createAxisAngle(axis: IVec3, angle: number): Quat {
    return Quat.createIdentity().initAxisAngle(axis, angle)
  }

  /**
   * Initializes the instance from axis and an angle.
   *
   * @param axis - The axis as vector
   * @param angle - The angle in radians
   */
  public initAxisAngle(axis: IVec3, angle: number): this {
    const halfAngle = angle * 0.5
    const scale = Math.sin(halfAngle)
    this.x = axis.x * scale
    this.y = axis.y * scale
    this.z = axis.z * scale
    this.w = Math.cos(halfAngle)
    return this
  }

  /**
   * Initializes the instance from yaw pitch and roll angles.
   *
   * @param yaw - The yaw angle in radians
   * @param pitch - The pitch angle in radians
   * @param roll - The roll angle in radians
   */
  public initYawPitchRoll(yaw: number, pitch: number, roll: number): this {
    const xHalf = pitch * 0.5
    const xSin = Math.sin(xHalf)
    const xCos = Math.cos(xHalf)

    const yHalf = yaw * 0.5
    const ySin = Math.sin(yHalf)
    const yCos = Math.cos(yHalf)

    const zHalf = roll * 0.5
    const zSin = Math.sin(zHalf)
    const zCos = Math.cos(zHalf)

    this.x = yCos * xSin * zCos + ySin * xCos * zSin
    this.y = ySin * xCos * zCos - yCos * xSin * zSin
    this.z = yCos * xCos * zSin - ySin * xSin * zCos
    this.w = yCos * xCos * zCos + ySin * xSin * zSin
    return this
  }

  /**
   * Creates a new instance from given `yaw` `pitch` and `roll` angles
   *
   * @param yaw - The yaw angle in radians
   * @param pitch - The pitch angle in radians
   * @param roll - The roll angle in radians
   *
   */
  public static createYawPitchRoll(yaw: number, pitch: number, roll: number): Quat {
    return Quat.createIdentity().initYawPitchRoll(yaw, pitch, roll)
  }

  /**
   * Creates a copy of this instance
   *
   * @returns a new instance
   */
  public clone(): Quat
  /**
   * Copies this into the given `out` parameter
   *
   * @returns the given `out` parameter
   */
  public clone<T>(out: T): T & IVec4
  public clone(out?: IVec4): IVec4 {
    out = out || new Quat()
    out.x = this.x
    out.y = this.y
    out.z = this.z
    out.w = this.w
    return out
  }

  /**
   * Creates a copy of the given `src` value
   *
   * @returns a new instance
   */
  public static clone(src: IVec4): Quat
  /**
   * Creates a copy of the given `src` value but writes into `out`
   *
   * @returns the given `out` parameter
   */
  public static clone<T>(src: IVec4, out: T): T & IVec4
  public static clone(src: IVec4, out?: IVec4): IVec4 {
    out = out || new Quat()
    out.x = src.x
    out.y = src.y
    out.z = src.z
    out.w = src.w
    return out
  }

  /**
   * Copies the components successively into the given array.
   *
   * @param array - The array to copy into
   * @param offset - Zero based index where to start writing in the array
   */
  public toArray(): number[]
  public toArray<T>(array: T, offset?: number): T
  public toArray(array: number[] = [], offset: number= 0): number[] {
    array[offset] = this.x
    array[offset + 1] = this.y
    array[offset + 2] = this.z
    array[offset + 3] = this.w
    return array
  }

  /**
   * Copies the components successively into the given array.
   *
   * @param q - The quaternion to copy from
   * @param buffer - The array to copy into
   * @param offset - Zero based index where to start writing in the array
   */
  public static toArray(vec: IVec4): number[]
  public static toArray<T>(vec: IVec4, array: T, offset?: number): T
  public static toArray(q: IVec4, array: number[] = [], offset: number = 0): number[] {
    array[offset] = q.x
    array[offset + 1] = q.y
    array[offset + 2] = q.z
    array[offset + 3] = q.w
    return array
  }

  /**
   * Checks for component wise equality with given instance
   *
   * @param other - The quaternion to compare with
   */
  public equals(other: IVec4): boolean {
    return ((this.x === other.x) && (this.y === other.y) && (this.z === other.z) && (this.w === other.w))
  }

  /**
   * Checks for component wise equality with given quaternion
   *
   * @param q1 - First value to compare with
   * @param q2 - Second value to compare with
   */
  public static equals(q1: IVec4, q2: IVec4): boolean {
    return ((q1.x === q2.x) && (q1.y === q2.y) && (q1.z === q2.z) && (q1.w === q2.w))
  }

  /**
   * Calculates the length of this quaternion
   *
   * @returns The length.
   */
  public length(): number {
    const x = this.x
    const y = this.y
    const z = this.z
    const w = this.w
    return Math.sqrt(x * x + y * y + z * z + w * w)
  }

  /**
   * Calculates the length of a quaternion
   */
  public static len(q: IVec4): number {
    const x = q.x
    const y = q.y
    const z = q.z
    const w = q.w
    return Math.sqrt(x * x + y * y + z * z + w * w)
  }

  /**
   * Calculates the squared length of this quaternion
   */
  public lengthSquared(): number {
    const x = this.x
    const y = this.y
    const z = this.z
    const w = this.w
    return x * x + y * y + z * z + w * w
  }

  /**
   * Calculates the squared length of a quaternion
   */
  public static lengthSquared(q: IVec4): number {
    const x = q.x
    const y = q.y
    const z = q.z
    const w = q.w
    return x * x + y * y + z * z + w * w
  }

  /**
   * Calculates the dot product with the given quaternion
   */
  public dot(other: IVec4): number {
    return this.x * other.x + this.y * other.y + this.z * other.z + this.w * other.w
  }

  /**
   * Calculates the dot product with the given quaternion
   */
  public static dot(a: IVec4, b: IVec4): number {
    return a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w
  }

  /**
   * Negates the components of `this`
   */
  public negate(): this {
    this.x = -this.x
    this.y = -this.y
    this.z = -this.z
    this.w = -this.w
    return this
  }

  /**
   * Creates a new instance that is a negated version of given `value`
   *
   * @param value - The value to negate.
   * @returns a new instance
   */
  public static negate(value: IVec4): Quat
  /**
   * Negates the given value but writes the result into `out`
   *
   * @param value - The value to negate.
   * @param out - The value to write to.
   * @returns The given `out` parameter
   */
  public static negate<T>(value: IVec4, out: T): T & IVec4
  public static negate(value: IVec4, out?: IVec4): IVec4 {
    out = out || new Quat()
    out.x = -value.x
    out.y = -value.y
    out.z = -value.z
    out.w = -value.w
    return out
  }

  /**
   * Negates the `x`, `y` and `z` components of `this`
   */
  public conjugate(): this {
    this.x = -this.x
    this.y = -this.y
    this.z = -this.z
    return this
  }

  /**
   * Creates a new instance with negated `x`, `y` and `z` components of `value`
   *
   * @param value - The value to negate.
   * @returns a new instance
   */
  public static conjugate(value: IVec4): Quat
  /**
   * Negates `x`, `y` and `z` components `value` but writes the result into `out`
   *
   * @param value - The value to negate.
   * @param out - The value to write to.
   * @returns The given `out` parameter
   */
  public static conjugate<T>(value: IVec4, out: T): T & IVec4
  public static conjugate(value: IVec4, out?: IVec4): IVec4 {
    out = out || new Quat()
    out.x = -value.x
    out.y = -value.y
    out.z = -value.z
    out.w = value.w
    return out
  }

  /**
   * Normalizes `this` quaternion
   */
  public normalize(): this {
    const x = this.x
    const y = this.y
    const z = this.z
    const w = this.w
    const d = 1.0 / Math.sqrt(x * x + y * y + z * z + w * w)
    this.x = x * d
    this.y = y * d
    this.z = z * d
    this.w = w * d
    return this
  }

  /**
   * Normalizes the given quaternion
   *
   * @param value - The quaternion to normalize.
   * @param out - The quaternion to write to.
   * @returns The given `out` parameter or a new quaternion.
   */
  public static normalize(value: IVec4): Quat
  public static normalize<T>(value: IVec4, out: T): T & IVec4
  public static normalize(value: IVec4, out?: IVec4): IVec4 {
    out = out || new Quat()
    const x = value.x
    const y = value.y
    const z = value.z
    const w = value.w
    const d = 1.0 / Math.sqrt(x * x + y * y + z * z + w * w)
    out.x = x * d
    out.y = y * d
    out.z = z * d
    out.w = w * d
    return out
  }

  /**
   * Inverts `this` quaternion
   */
  public invert(): this {
    const x = this.x
    const y = this.y
    const z = this.z
    const w = this.w
    const d = 1.0 / Math.sqrt(x * x + y * y + z * z + w * w)
    this.x = -x * d
    this.y = -y * d
    this.z = -z * d
    this.w = w * d
    return this
  }

  /**
   * Creates a new instance that is the inverse of given `value`
   *
   * @param value - The quaternion to invert.
   */
  public static invert(value: IVec4): Quat
  /**
   * Creates a new instance that is the inverse of given `value` but writes result to `out`
   *
   * @param value - The quaternion to invert.
   * @param out - The quaternion to write to.
   */
  public static invert<T>(value: IVec4, out: T): T & IVec4
  public static invert(value: IVec4, out?: IVec4): IVec4 {
    out = out || new Quat()
    const x = value.x
    const y = value.y
    const z = value.z
    const w = value.w
    const d = 1.0 / Math.sqrt(x * x + y * y + z * z + w * w)
    out.x = -x * d
    out.y = -y * d
    out.z = -z * d
    out.w = w * d
    return out
  }

  /**
   * Performs a component wise addition with `other`
   */
  public add(other: IVec4): this {
    this.x += other.x
    this.y += other.y
    this.z += other.z
    this.w += other.w
    return this
  }

  /**
   * Creates a new instance by adding components of given quaternions
   *
   * @param quatA - The first quaternion
   * @param quatB - The second quaternion
   */
  public static add(quatA: IVec4, quatB: IVec4): Quat
  /**
   * Creates a new instance by adding components of given quaternions but writing result to `out`
   *
   * @param quatA - The first quaternion
   * @param quatB - The second quaternion
   * @param out - The quaternion to write to.
   */
  public static add<T>(quatA: IVec4, quatB: IVec4, out: T): T & IVec4
  public static add(quatA: IVec4, quatB: IVec4, out?: IVec4): IVec4 {
    out = out || new Quat()
    out.x = quatA.x + quatB.x
    out.y = quatA.y + quatB.y
    out.z = quatA.z + quatB.z
    out.w = quatA.w + quatB.w
    return out
  }

  /**
   * Performs a component wise subtraction with `other`
   *
   */
  public subtract(other: IVec4): this {
    this.x -= other.x
    this.y -= other.y
    this.z -= other.z
    this.w -= other.w
    return this
  }

  /**
   * Subtracts the second quaternion from the first.
   * @param quatA - The first quaternion
   * @param quatB - The second quaternion
   * @param out - The quaternion to write to.
   * @returns The given `out` parameter or a new quaternion.
   */
  public static subtract(quatA: IVec4, quatB: IVec4): Quat
  public static subtract<T>(quatA: IVec4, quatB: IVec4, out: T): T & IVec4
  public static subtract(quatA: IVec4, quatB: IVec4, out?: IVec4): IVec4 {
    out = out || new Quat()
    out.x = quatA.x - quatB.x
    out.y = quatA.y - quatB.y
    out.z = quatA.z - quatB.z
    out.w = quatA.w - quatB.w
    return out
  }

  /**
   * Performs a quaternion multiplication `this = this * other` meaning `other` is post-multiplied to `this`.
   *
   * @param other - The quaternion to post-multiply
   */
  public multiply(other: IVec4): this {
    const x1 = this.x
    const y1 = this.y
    const z1 = this.z
    const w1 = this.w

    const x2 = other.x
    const y2 = other.y
    const z2 = other.z
    const w2 = other.w

    this.x = x1 * w2 + x2 * w1 + y1 * z2 - z1 * y2
    this.y = y1 * w2 + y2 * w1 + z1 * x2 - x1 * z2
    this.z = z1 * w2 + z2 * w1 + x1 * y2 - y1 * x2
    this.w = w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2
    return this
  }

  /**
   * Performs a matrix multiplication `quatA * quatB` meaning `quatB` is post-multiplied on `quatA`.
   *
   * @param quatA - The first quaternion
   * @param quatB - The second quaternion
   */
  public static multiply(quatA: IVec4, quatB: IVec4): Quat
  /**
   * Performs a matrix multiplication `out = quatA * quatB` meaning `quatB` is post-multiplied on `quatA`.
   *
   * @param quatA - The first quaternion
   * @param quatB - The second quaternion
   * @param out - The quaternion to write to.
   */
  public static multiply<T>(quatA: IVec4, quatB: IVec4, out: T): T & IVec4
  public static multiply(quatA: IVec4, quatB: IVec4, out?: IVec4): IVec4 {
    out = out || new Quat()
    const x1 = quatA.x
    const y1 = quatA.y
    const z1 = quatA.z
    const w1 = quatA.w

    const x2 = quatB.x
    const y2 = quatB.y
    const z2 = quatB.z
    const w2 = quatB.w

    out.x = x1 * w2 + x2 * w1 + y1 * z2 - z1 * y2
    out.y = y1 * w2 + y2 * w1 + z1 * x2 - x1 * z2
    out.z = z1 * w2 + z2 * w1 + x1 * y2 - y1 * x2
    out.w = w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2
    return out
  }

  /**
   * Performs a quaternion multiplication `this = other * this` meaning `other` is pre-multiplied on `this`.
   *
   * @param other - The quaternion to pre-multiply
   */
  public preMultiply(other: IVec4): this {
    const x1 = other.x
    const y1 = other.y
    const z1 = other.z
    const w1 = other.w

    const x2 = this.x
    const y2 = this.y
    const z2 = this.z
    const w2 = this.w

    this.x = x1 * w2 + x2 * w1 + y1 * z2 - z1 * y2
    this.y = y1 * w2 + y2 * w1 + z1 * x2 - x1 * z2
    this.z = z1 * w2 + z2 * w1 + x1 * y2 - y1 * x2
    this.w = w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2
    return this
  }

  /**
   * Creates a new instance by multiplying `matB * matA` meaning `matB` is pre-multiplied on `matA`.
   *
   * @param quatA - The right value
   * @param quatB - The left value
   */
  public static preMultiply(quatA: IVec4, quatB: IVec4): Quat
  /**
   * Creates a new instance by multiplying `matB * matA` meaning `matB` is pre-multiplied on `matA`.
   *
   * @param quatA - The right value
   * @param quatB - The left value
   * @param out - The value to write to
   */
  public static preMultiply<T>(quatA: IVec4, quatB: IVec4, out: T): T & IVec4
  public static preMultiply(quatA: IVec4, quatB: IVec4, out?: IVec4): IVec4 {
    out = out || new Quat()
    const x1 = quatB.x
    const y1 = quatB.y
    const z1 = quatB.z
    const w1 = quatB.w

    const x2 = quatA.x
    const y2 = quatA.y
    const z2 = quatA.z
    const w2 = quatA.w

    out.x = x1 * w2 + x2 * w1 + y1 * z2 - z1 * y2
    out.y = y1 * w2 + y2 * w1 + z1 * x2 - x1 * z2
    out.z = z1 * w2 + z2 * w1 + x1 * y2 - y1 * x2
    out.w = w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2
    return out
  }

  /**
   * Performs a quaternion multiplication `this = this * inv(other)` meaning inverse of `other` is post-multiplied to `this`.
   *
   * @param other - The quaternion to invert and post-multiply
   */
  public divide(other: IVec4): this {
    const x1 = this.x
    const y1 = this.y
    const z1 = this.z
    const w1 = this.w

    let x2 = other.x
    let y2 = other.y
    let z2 = other.z
    let w2 = other.w

    // invert
    const s = 1.0 / Math.sqrt(x2 * x2 + y2 * y2 + z2 * z2 + w2 * w2)
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

  /**
   * Performs a matrix multiplication `quatA * inv(quatB)` meaning inverse of `quatB` is post-multiplied on `quatA`.
   *
   * @param quatA - The left value
   * @param quatB - The right value
   */
  public static divide(quatA: IVec4, quatB: IVec4): Quat
  /**
   * Performs a matrix multiplication `quatA * inv(quatB)` meaning inverse of `quatB` is post-multiplied on `quatA`.
   *
   * @param quatA - The left value
   * @param quatB - The right value
   * @param out - The value to write to.
   */
  public static divide<T>(quatA: IVec4, quatB: IVec4, out: T): T & IVec4
  public static divide(quatA: IVec4, quatB: IVec4, out?: IVec4): IVec4 {
    out = out || new Quat()
    const x1 = quatA.x
    const y1 = quatA.y
    const z1 = quatA.z
    const w1 = quatA.w

    let x2 = quatB.x
    let y2 = quatB.y
    let z2 = quatB.z
    let w2 = quatB.w

    // invert
    const s = 1.0 / Math.sqrt(x2 * x2 + y2 * y2 + z2 * z2 + w2 * w2)
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
   */
  public transform<T extends IVec3>(vec: T): T {
    const x = this.x
    const y = this.y
    const z = this.z
    const w = this.w

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

    vec.x = vx * (1 - yy2 - zz2) + vy * (xy2 - wz2) + vz * (xz2 + wy2)
    vec.y = vx * (xy2 + wz2) + vy * (1 - xx2 - zz2) + vz * (yz2 - wx2)
    vec.z = vx * (xz2 - wy2) + vy * (yz2 + wx2) + vz * (1 - xx2 - yy2)
    return vec
  }

  /**
   * Rotates a point or vector with given quaternion
   *
   * @param q - The rotation quaternion
   * @param v - The point or vector to rotate
   * @param out - The vector to write to
   * @returns The given `out` parameter or a new vector.
   */
  public static transform<T extends IVec3 = Vec3>(q: IVec4, v: IVec3, out?: T): T {
    const x = q.x
    const y = q.y
    const z = q.z
    const w = q.w

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

    const vx = v.x
    const vy = v.y
    const vz = v.z

    out = out || new Vec3() as any
    out.x = vx * (1 - yy2 - zz2) + vy * (xy2 - wz2) + vz * (xz2 + wy2)
    out.y = vx * (xy2 + wz2) + vy * (1 - xx2 - zz2) + vz * (yz2 - wx2)
    out.z = vx * (xz2 - wy2) + vy * (yz2 + wx2) + vz * (1 - xx2 - yy2)

    return out
  }

  /**
   * Performs a component wise linear interpolation between the given two values.
   *
   * @param a - The first value.
   * @param b - The second value.
   * @param t - The interpolation value. Assumed to be in range [0:1].
   * @param out - The value to write to.
   * @returns The given `out` parameter or a new instance.
   */
  public static slerp(a: IVec4, b: IVec4, t: number): Quat
  public static slerp<T>(a: IVec4, b: IVec4, t: number, out?: T): T & IVec4
  public static slerp(a: IVec4, b: IVec4, t: number, out?: IVec4): IVec4 {

    out = out || new Quat()

    let bx = b.x
    let by = b.y
    let bz = b.z
    let bw = b.w
    let dot = Quat.dot(a, b)
    if (dot < 0) {
      dot = -dot
      bx = -bx
      by = -by
      bz = -bz
      bw = -bw
    }

    if (dot > 0.9995) {
      // If the inputs are too close for comfort, linearly interpolate
      // and normalize the result.
      out.x = a.x + (bx - a.x) * t
      out.y = a.y + (by - a.y) * t
      out.z = a.z + (bz - a.z) * t
      out.w = a.w + (bw - a.w) * t
      Quat.normalize(out, out)
      return out
    }

    // Since dot is in range [0, DOT_THRESHOLD], acos is safe
    let theta0 = Math.acos(dot)        // theta_0 = angle between input vectors
    let theta = theta0 * t             // theta = angle between v0 and result
    let sinTheta0 = Math.sin(theta0)
    let sinTheta = Math.sin(theta)

    let s0 = Math.cos(theta) - dot * sinTheta / sinTheta0  // == sin(theta_0 - theta) / sin(theta_0)
    let s1 = sinTheta / sinTheta0

    out.x = a.x * s0 + bx * s1
    out.y = a.y * s0 + by * s1
    out.z = a.z * s0 + bz * s1
    out.w = a.w * s0 + bw * s1

    return out
  }

  /**
   * Tries to convert the given `data` into a quaternion
   *
   * @returns The created quaternion.
   */
  public static convert(data: number|number[]|IVec4): Quat {
    if (Array.isArray(data)) {
      return new Quat(data[0], data[1], data[2], data[3])
    }
    if (typeof data === 'number') {
      return new Quat(data, data, data, data)
    }
    return new Quat(data.x, data.y, data.z, data.w)
  }

  /**
   * Formats this into a readable string
   *
   * @remarks
   * Mainly meant for debugging. Do not use this for serialization.
   *
   * @param fractionDigits - Number of digits after decimal point
   */
  public format(fractionDigits: number = 5): string {
    return Quat.format(this, fractionDigits)
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
  public static format(vec: IVec4, fractionDigits: number = 5): string {
    return vec.x.toFixed(fractionDigits) +
      ',' + vec.y.toFixed(fractionDigits) +
      ',' + vec.z.toFixed(fractionDigits) +
      ',' + vec.w.toFixed(fractionDigits)
  }
}
