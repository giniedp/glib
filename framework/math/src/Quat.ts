import { ArrayLike, IVec2, IVec3, IVec4 } from './Types'
import { Vec3 } from './Vec3'

/**
 * Describes a quaternion.
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
   * Initializes a new quaternion
   * @param x Value for the X component
   * @param y Value for the Y component
   * @param z Value for the Z component
   * @param w Value for the W component
   */
  constructor(x?: number, y?: number, z?: number, w?: number) {
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
  public init(x: number, y: number, z: number, w: number): Quat {
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
  public initIdentity(): Quat {
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
  public initZero(): Quat {
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
  public initFrom(other: IVec4): Quat {
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
  public initFromBuffer(buffer: ArrayLike<number>, offset: number= 0): Quat {
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
  public initAxisAngle(axis: IVec3, angle: number): Quat {
    const halfAngle = angle * 0.5
    const scale = Math.sin(halfAngle)
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
  public initYawPitchRoll(yaw: number, pitch: number, roll: number): Quat {
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
   * Creates a copy of this quaternion
   * @return The cloned quaternion
   */
  public clone(): Quat {
    return new Quat(this.x, this.y, this.z, this.w)
  }

  /**
   * Copies the components successively into the given array.
   * @param buffer The array to copy into
   * @param [offset=0] Zero based index where to start writing in the array
   * @return Reference to `this` for chaining.
   */
  public copyTo(buffer: ArrayLike<number>, offset?: number) {
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
  public equals(other: IVec4): boolean {
    return ((this.x === other.x) && (this.y === other.y) && (this.z === other.z) && (this.w === other.w))
  }

  /**
   * Calculates the length of this quaternion
   * @return {Number} The length.
   */
  public length(): number {
    const x = this.x
    const y = this.y
    const z = this.z
    const w = this.w
    return Math.sqrt(x * x + y * y + z * z + w * w)
  }

  /**
   * Calculates the squared length of this quaternion
   * @return {Number} The squared length.
   */
  public lengthSquared(): number {
    const x = this.x
    const y = this.y
    const z = this.z
    const w = this.w
    return x * x + y * y + z * z + w * w
  }

  /**
   * Calculates the dot product with the given quaternion
   * @return {Number} The dot product.
   */
  public dot(other: IVec4): number {
    return this.x * other.x + this.y * other.y + this.z * other.z + this.w * other.w
  }

  /**
   * Negates the components of `this`
   * @return Reference to `this` for chaining.
   */
  public negate(): Quat {
    this.x = -this.x
    this.y = -this.y
    this.z = -this.z
    this.w = -this.w
    return this
  }

  public negateOut<T extends IVec4>(out?: T): T {
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
  public conjugate(): Quat {
    this.x = -this.x
    this.y = -this.y
    this.z = -this.z
    return this
  }

  public conjugateOut<T extends IVec4>(out?: T): T {
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
  public normalize(): Quat {
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

  public normalizeOut<T extends IVec4>(out?: T): T {
    out = out || new Quat() as any
    const x = this.x
    const y = this.y
    const z = this.z
    const w = this.w
    const d = 1.0 / Math.sqrt(x * x + y * y + z * z + w * w)
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
  public invert(): Quat {
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

  public invertOut<T extends IVec4>(out?: T): T {
    out = out || new Quat() as any
    const x = this.x
    const y = this.y
    const z = this.z
    const w = this.w
    const d = 1.0 / Math.sqrt(x * x + y * y + z * z + w * w)
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
  public add(other: IVec4): Quat {
    this.x += other.x
    this.y += other.y
    this.z += other.z
    this.w += other.w
    return this
  }
  public addOut<T extends IVec4>(other: IVec4, out?: T): T {
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
  public subtract(other: IVec4): Quat {
    this.x -= other.x
    this.y -= other.y
    this.z -= other.z
    this.w -= other.w
    return this
  }
  public subtractOut<T extends IVec4>(other: IVec4, out?: T): T {
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
  public multiply(other: IVec4): Quat {
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
  public  multiplyOut<T extends IVec4>(other: IVec4, out?: T): T {
    out = out || new Quat() as any
    const x1 = this.x
    const y1 = this.y
    const z1 = this.z
    const w1 = this.w

    const x2 = other.x
    const y2 = other.y
    const z2 = other.z
    const w2 = other.w

    out.x = x1 * w2 + x2 * w1 + y1 * z2 - z1 * y2
    out.y = y1 * w2 + y2 * w1 + z1 * x2 - x1 * z2
    out.z = z1 * w2 + z2 * w1 + x1 * y2 - y1 * x2
    out.w = w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2
    return out
  }

  /**
   * Performs a quaternion concatenation with `other`
   * @param other
   * @return Reference to `this` for chaining.
   */
  public concat(other: IVec4): Quat {
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
  public concatOut<T extends IVec4>(other: IVec4, out?: T): T {
    out = out || new Quat() as any
    const x1 = other.x
    const y1 = other.y
    const z1 = other.z
    const w1 = other.w

    const x2 = this.x
    const y2 = this.y
    const z2 = this.z
    const w2 = this.w

    out.x = x1 * w2 + x2 * w1 + y1 * z2 - z1 * y2
    out.y = y1 * w2 + y2 * w1 + z1 * x2 - x1 * z2
    out.z = z1 * w2 + z2 * w1 + x1 * y2 - y1 * x2
    out.w = w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2
    return out
  }
  /**
   * Performs a division with `other`
   * @param other
   * @return Reference to `this` for chaining.
   */
  public divide(other: IVec4): Quat {
    const x1 = this.x
    const y1 = this.y
    const z1 = this.z
    const w1 = this.w

    let x2 = other.x
    let y2 = other.y
    let z2 = other.z
    let w2 = other.w

    // invert
    const s = 1.0 / (x2 * x2 + y2 * y2 + z2 * z2 + w2 * w2)
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
  public divideOut<T extends IVec4>(other: IVec4, out?: T): T {
    out = out || new Quat() as any
    const x1 = this.x
    const y1 = this.y
    const z1 = this.z
    const w1 = this.w

    let x2 = other.x
    let y2 = other.y
    let z2 = other.z
    let w2 = other.w

    // invert
    const s = 1.0 / (x2 * x2 + y2 * y2 + z2 * z2 + w2 * w2)
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
    const zz2 = y * z2

    const vx = vec.x
    const vy = vec.y
    const vz = vec.z

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
  public static create(x?: number, y?: number, z?: number, w?: number): Quat {
    return new Quat(x, y, z, w)
  }

  /**
   * Creates a new vector with all components set to 0.
   * @return A new quaternion
   */
  public static zero(): Quat {
    return new Quat(0, 0, 0, 0)
  }

  /**
   * Creates a new vector with `x`, `y` and `z` components set to `0` and `w` component set to `1`.
   * @return A new quaternion
   */
  public static identity(): Quat {
    return new Quat(0, 0, 0, 1)
  }

  /**
   * Creates a new quaternion from given axis vector and an angle
   * @param axis The axis vector
   * @param angle The angle in degree
   * @return A new quaternion
   */
  public static fromAxisAngle(axis: IVec3, angle: number): Quat {
    return Quat.identity().initAxisAngle(axis, angle)
  }

  /**
   * Creates a new quaternion from given `yaw` `pitch` and `roll` angles
   * @param yaw The yaw angle in radians
   * @param pitch The pitch angle in radians
   * @param roll The roll angle in radians
   * @return
   */
  public static fromYawPitchRoll(yaw: number, pitch: number, roll: number): Quat {
    return Quat.identity().initYawPitchRoll(yaw, pitch, roll)
  }

  /**
   * Negates the given quaternion.
   * @param quat The quaternion to negate.
   * @param [out] The quaternion to write to.
   * @return The given `out` parameter or a new quaternion.
   */
  public static negate<T extends IVec4>(quat: IVec4, out?: T): T {
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
  public static conjugate<T extends IVec4>(quat: IVec4, out?: T): T {
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
  public static normalize<T extends IVec4>(quat: IVec4, out?: T): T {
    out = out || new Quat() as any
    const x = quat.x
    const y = quat.y
    const z = quat.z
    const w = quat.w
    const d = 1.0 / Math.sqrt(x * x + y * y + z * z + w * w)
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
  public static invert<T extends IVec4>(quat: IVec4, out?: T): T {
    out = out || new Quat() as any
    const x = quat.x
    const y = quat.y
    const z = quat.z
    const w = quat.w
    const d = 1.0 / Math.sqrt(x * x + y * y + z * z + w * w)
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
  public static add<T extends IVec4>(quatA: IVec4, quatB: IVec4, out?: T): T {
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
  public static subtract<T extends IVec4>(quatA: IVec4, quatB: IVec4, out?: T): T {
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
  public static multiply<T extends IVec4>(quatA: IVec4, quatB: IVec4, out?: T): T {
    out = out || new Quat() as any
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
   * Concatenates two quaternions
   * @param quatA The first quaternion
   * @param quatB The second quaternion
   * @param [out] The quaternion to write to.
   * @return The given `out` parameter or a new quaternion.
   */
  public static concat<T extends IVec4>(quatA: IVec4, quatB: IVec4, out?: T): T {
    out = out || new Quat() as any
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
   * Divides the first quaternion by the second
   * @param quatA The first quaternion
   * @param quatB The second quaternion
   * @param [out] The quaternion to write to.
   * @return The given `out` parameter or a new quaternion.
   */
  public static divide<T extends IVec4>(quatA: IVec4, quatB: IVec4, out?: T): T {
    out = out || new Quat() as any
    const x1 = quatA.x
    const y1 = quatA.y
    const z1 = quatA.z
    const w1 = quatA.w

    let x2 = quatB.x
    let y2 = quatB.y
    let z2 = quatB.z
    let w2 = quatB.w

    // invert
    const s = 1.0 / (x2 * x2 + y2 * y2 + z2 * z2 + w2 * w2)
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
  public static convert(data: any): Quat {
    if (Array.isArray(data)) {
      return new Quat(data[0], data[1], data[2], data[3])
    }
    if (typeof data === 'number') {
      return new Quat(data, data, data, data)
    }
    return new Quat(data.x, data.y, data.z, data.w)
  }

  /**
   * Rotates a point or vector with given quaternion
   * @param q The rotation quaternion
   * @param v The point or vector to rotate
   * @param [out] The vector to write to
   * @return The given `out` parameter or a new vector.
   */
  public static transform<T extends IVec3>(q: IVec4, v: IVec3, out?: T): T {
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
    const zz2 = y * z2

    const vx = v.x
    const vy = v.y
    const vz = v.z

    out = out || new Vec3() as any
    out.x = vx * (1 - yy2 - zz2) + vy * (xy2 - wz2) + vz * (xz2 + wy2)
    out.y = vx * (xy2 + wz2) + vy * (1 - xx2 - zz2) + vz * (yz2 - wx2)
    out.z = vx * (xz2 - wy2) + vy * (yz2 + wx2) + vz * (1 - xx2 - yy2)

    return out
  }
}
