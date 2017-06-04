import { ArrayLike, IVec2, IVec3, IVec4 } from './Types'

const keys = ['x', 'y', 'z']
const keyLookup = {
  0: 'x', 1: 'y', 2: 'z',
  x: 'x', y: 'y', z: 'z',
}

/**
 * Describes a vector with three components.
 */
export class Vec3 implements IVec2, IVec3 {
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
   * Initializes a new vector
   * @param x Value for the X component
   * @param y Value for the Y component
   * @param z Value for the Z component
   */
  constructor(x?: number, y?: number, z?: number) {
    this.x = x == null ? 0 : x
    this.y = y == null ? 0 : y
    this.z = z == null ? 0 : z
  }

  /**
   * Sets the X component
   */
  public setX(value: number): Vec3 {
    this.x = value
    return this
  }
  /**
   * Sets the Y component
   */
  public setY(value: number): Vec3 {
    this.y = value
    return this
  }
  /**
   * Sets the Z component
   */
  public setZ(value: number): Vec3 {
    this.z = value
    return this
  }
  /**
   * Sets the component by using an index (or name)
   */
  public set(key: number|string, value: number): Vec3 {
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
   * @param x value for X component
   * @param y value for Y component
   * @param z value for Z component
   * @return this vector for chaining
   */
  public init(x: number, y: number, z: number): Vec3 {
    this.x = x
    this.y = y
    this.z = z
    return this
  }

  /**
   * Initializes the components of this vector by taking the components from the given vector.
   * @param other The vector to read from
   * @return
   */
  public initFrom(other: IVec3): Vec3 {
    this.x = other.x
    this.y = other.y
    this.z = other.z
    return this
  }

  /**
   * Initializes the components of this vector by taking values from the given array in successive order.
   * @param buffer The array to read from
   * @param [offset=0] The zero based index at which start reading the values
   * @return
   */
  public initFromBuffer(buffer: ArrayLike<number>, offset: number= 0): Vec3 {
    this.x = buffer[offset]
    this.y = buffer[offset + 1]
    this.z = buffer[offset + 2]
    return this
  }

  /**
   * Creates a copy of this vector
   * @return The cloned vector
   */
  public clone(): Vec3 {
    return new Vec3(this.x, this.y, this.z)
  }
  public cloneTo<T extends IVec3>(out?: T): T {
    out = (out || new Vec3()) as any
    out.x = this.x
    out.y = this.y
    out.z = this.z
    return out
  }
  /**
   * Copies the components successively into the given array.
   * @param buffer The array to copy into
   * @param offset Zero based index where to start writing in the array
   * @return {Array|Float32Array}
   */
  public copyTo<T extends ArrayLike<number>>(buffer: T, offset: number= 0): T {
    buffer[offset] = this.x
    buffer[offset + 1] = this.y
    buffer[offset + 2] = this.z
    return buffer
  }

  /**
   * Checks for component wise equality with given vector
   * @param other The vector to compare with
   * @return true if components are equal, false otherwise
   */
  public equals(other: IVec3): boolean {
    return ((this.x === other.x) && (this.y === other.y) && (this.z === other.z))
  }

  /**
   * Calculates the length of this vector
   * @return The length.
   */
  public length(): number {
    const x = this.x
    const y = this.y
    const z = this.z
    return Math.sqrt(x * x + y * y + z * z)
  }

  /**
   * Calculates the squared length of this vector
   * @return The squared length.
   */
  public lengthSquared(): number {
    const x = this.x
    const y = this.y
    const z = this.z
    return x * x + y * y + z * z
  }

  /**
   * Calculates the distance to the given vector
   * @param other The distant vector
   * @return The distance between the vectors.
   */
  public distance(other: IVec3): number {
    const x = this.x - other.x
    const y = this.y - other.y
    const z = this.z - other.z
    return Math.sqrt(x * x + y * y + z * z)
  }

  /**
   * Calculates the squared distance to the given vector
   * @param other The distant vector
   * @return The squared distance between the vectors.
   */
  public distanceSquared(other: IVec3): number {
    const x = this.x - other.x
    const y = this.y - other.y
    const z = this.z - other.z
    return x * x + y * y + z * z
  }

  /**
   * Calculates the dot product with the given vector
   * @param other
   * @return The dot product.
   */
  public dot(other: IVec3): number {
    return this.x * other.x + this.y * other.y + this.z * other.z
  }

  /**
   * Calculates the cross product with another vector.
   * @param other The second vector.
   * @return A new vector.
   */
  public cross(other: IVec3): Vec3 {
    const x = this.x
    const y = this.y
    const z = this.z
    this.x = y * other.z - z * other.y
    this.y = z * other.x - x * other.z
    this.z = x * other.y - y * other.x
    return this
  }
  /**
   * Calculates the cross product with another vector.
   * @param other The second vector.
   * @return A new vector.
   */
  public crossOut<T extends IVec3>(other: IVec3, out: T): T {
    out = (out || new Vec3()) as any
    const x = this.x
    const y = this.y
    const z = this.z
    out.x = y * other.z - z * other.y
    out.y = z * other.x - x * other.z
    out.z = x * other.y - y * other.x
    return out
  }

  /**
   * Normalizes `this` vector. Applies the result to `this` vector.
   * @return this vector for chaining
   */
  public normalize(): Vec3 {
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
   * Normalizes this vector. Applies the result to `out` vector.
   * @return the `out` parameter or new vector
   */
  public normalizeOut<T extends IVec3>(out?: T): T {
    out = (out || new Vec3()) as any
    const x = this.x
    const y = this.y
    const z = this.z
    const d = 1.0 / Math.sqrt(x * x + y * y + z * z)
    out.x = this.x * d
    out.y = this.y * d
    out.z = this.z * d
    return out
  }

  /**
   * Inverts this vector.
   * @return this vector for chaining
   */
  public invert(): Vec3 {
    this.x = 1.0 / this.x
    this.y = 1.0 / this.y
    this.z = 1.0 / this.z
    return this
  }
  /**
   * Inverts this vector. Applies the result to `out` vector.
   * @return the `out` parameter or new vector
   */
  public invertOut<T extends IVec3>(out?: T): T {
    out = (out || new Vec3()) as any
    out.x = 1.0 / this.x
    out.y = 1.0 / this.y
    out.z = 1.0 / this.z
    return out
  }

  /**
   * Negates the components of `this` vector. Applies the result to `this`
   * @return this vector for chaining
   */
  public negate(): Vec3 {
    this.x = -this.x
    this.y = -this.y
    this.z = -this.z
    return this
  }
  /**
   * Negates the components of `this` vector. Applies the result to `out`
   * @return the `out` parameter or new vector
   */
  public negateOut<T extends IVec3>(out?: T): T {
    out = (out || new Vec3()) as any
    out.x = -this.x
    out.y = -this.y
    out.z = -this.z
    return out
  }

  /**
   * Performs the calculation `this += other * scale`
   * @param other The vector to add
   * @return this vector for chaining
   */
  public addScaled(other: IVec3, scale: number): Vec3 {
    this.x += other.x * scale
    this.y += other.y * scale
    this.z += other.z * scale
    return this
  }

  /**
   * Performs the calculation `this += other`
   * @param other The vector to add
   * @return this vector for chaining
   */
  public add(other: IVec3): Vec3 {
    this.x += other.x
    this.y += other.y
    this.z += other.z
    return this
  }
  /**
   * Performs the calculation `out = this + other`
   * @param other The vector to add
   * @return the `out` parameter or new vector
   */
  public addOut<T extends IVec3>(other: IVec3, out?: T): T {
    out = (out || new Vec3()) as any
    out.x = this.x + other.x
    out.y = this.y + other.y
    out.z = this.z + other.z
    return out
  }

  /**
   * Performs the calculation `this += scalar`
   * @param scalar The value to add
   * @return this vector for chaining
   */
  public addScalar(scalar: number): Vec3 {
    this.x += scalar
    this.y += scalar
    this.z += scalar
    return this
  }
  /**
   * Performs the calculation `out = this + scalar`
   * @param scalar The value to add
   * @return the `out` parameter or new vector
   */
  public addScalarOut<T extends IVec3>(scalar: number, out?: T): T {
    out = (out || new Vec3()) as any
    out.x = this.x + scalar
    out.y = this.y + scalar
    out.z = this.z + scalar
    return out
  }

  /**
   * Performs the calculation `this -= other * scale`
   * @param other The vector to subtract
   * @param scale The value to multoply to `other`
   * @return this vector for chaining
   */
  public subtractScaled(other: IVec3, scale: number): Vec3 {
    this.x -= other.x * scale
    this.y -= other.y * scale
    this.z -= other.z * scale
    return this
  }
  /**
   * Performs the calculation `this -= other`
   * @param other The vector to subtract
   * @return this vector for chaining
   */
  public subtract(other: IVec3): Vec3 {
    this.x -= other.x
    this.y -= other.y
    this.z -= other.z
    return this
  }
  /**
   * Performs the calculation `out = this - other`
   * @param other The vector to subtract
   * @return the `out` parameter or new vector
   */
  public subtractOut<T extends IVec3>(other: IVec3, out?: T): T {
    out = (out || new Vec3()) as any
    out.x = this.x - other.x
    out.y = this.y - other.y
    out.z = this.z - other.z
    return out
  }

  /**
   * Performs the calculation `this -= scalar`
   * @param scalar The value to subtract
   * @return this vector for chaining
   */
  public subtractScalar(scalar: number): Vec3 {
    this.x -= scalar
    this.y -= scalar
    this.z -= scalar
    return this
  }

  /**
   * Performs the calculation `out = this - scalar`
   * @param scalar The value to subtract
   * @return the `out` parameter or new vector
   */
  public subtractScalarOut<T extends IVec3>(scalar: number, out?: T): T {
    out = (out || new Vec3()) as any
    out.x = this.x - scalar
    out.y = this.y - scalar
    out.z = this.z - scalar
    return out
  }

  /**
   * Performs the calculation `this *= other`
   * @param other The vector to multiply
   * @return this vector for chaining
   */
  public multiply(other: IVec3): Vec3 {
    this.x *= other.x
    this.y *= other.y
    this.z *= other.z
    return this
  }
  /**
   * Performs the calculation `out = this * other`
   * @param other The vector to multiply
   * @return the `out` parameter or new vector
   */
  public multiplyOut<T extends IVec3>(other: IVec3, out?: T): T {
    out = (out || new Vec3()) as any
    out.x = this.x * other.x
    out.y = this.y * other.y
    out.z = this.z * other.z
    return out
  }

  /**
   * Performs the calculation `this *= scalar`
   * @param scalar The value to multiply
   * @return this vector for chaining
   */
  public multiplyScalar(scalar: number): Vec3 {
    this.x *= scalar
    this.y *= scalar
    this.z *= scalar
    return this
  }
  /**
   * Performs the calculation `out = this * scalar`
   * @param scalar The value to multiply
   * @return the `out` parameter or new vector
   */
  public multiplyScalarOut<T extends IVec3>(scalar: number, out?: T): T {
    out = (out || new Vec3()) as any
    out.x = this.x * scalar
    out.y = this.y * scalar
    out.z = this.z * scalar
    return out
  }

  /**
   * Performs the calculation `this /= other`
   * @param other The vector to divide
   * @return this vector for chaining
   */
  public divide(other: IVec3): Vec3 {
    this.x /= other.x
    this.y /= other.y
    this.z /= other.z
    return this
  }
  /**
   * Performs the calculation `out = this / other`
   * @param other The vector to divide
   * @return the `out` parameter or new vector
   */
  public divideOut<T extends IVec3>(other: IVec3, out?: T): T {
    out = (out || new Vec3()) as any
    out.x = this.x / other.x
    out.y = this.y / other.y
    out.z = this.z / other.z
    return out
  }

  /**
   * Performs the calculation `this *= (1 / scalar)`
   * @param scalar The value to divide
   * @return this vector for chaining
   */
  public divideScalar(scalar: number): Vec3 {
    scalar = 1.0 / scalar
    this.x *= scalar
    this.y *= scalar
    this.z *= scalar
    return this
  }
  /**
   * Performs the calculation `out = this * (1 / scalar)`
   * @param scalar The value to divide
   * @return the `out` parameter or new vector
   */
  public divideScalarOut<T extends IVec3>(scalar: number, out?: T): T {
    out = (out || new Vec3()) as any
    scalar = 1.0 / scalar
    out.x = this.x * scalar
    out.y = this.y * scalar
    out.z = this.z * scalar
    return out
  }

  /**
   * Performs the calculation `this = this * a + b`
   * @param a The vector to multiply.
   * @param b The vector to add on top of the multiplication.
   * @return this vector for chaining
   */
  public multiplyAdd(a: IVec3, b: IVec3): Vec3 {
    this.x = this.x * a.x + b.x
    this.y = this.y * a.y + b.y
    this.z = this.z * a.z + b.z
    return this
  }

  /**
   * Transforms `this` with the given quaternion.
   * @param quat
   * @return this vector for chaining
   */
  public selfTransformQuat(quat: IVec4): Vec3 {
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
    const zz2 = y * z2

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
   * @return this vector for chaining
   */
  public selfTransformMat4(mat: { data: number[]|Float64Array }): Vec3 {
    const x = this.x
    const y = this.y
    const z = this.z
    const w = 1
    const d = mat.data
    this.x = x * d[0] + y * d[4] + z * d[8] + w * d[12]
    this.y = x * d[1] + y * d[5] + z * d[9] + w * d[13]
    this.z = x * d[2] + y * d[6] + z * d[10] + w * d[14]
    return this
  }

  /**
   * Transforms `this` with the given matrix.
   * @param mat
   * @return this vector for chaining
   */
  public selfTransformMat3(mat: { data: number[]|Float64Array }): Vec3 {
    const x = this.x
    const y = this.y
    const z = this.z
    const d = mat.data
    this.x = x * d[0] + y * d[3] + z * d[6]
    this.y = x * d[1] + y * d[4] + z * d[7]
    this.z = x * d[2] + y * d[5] + z * d[8]
    return this
  }

  /**
   * Transforms `this` with the given matrix. The `z` component of `this` keeps untouched.
   * @param mat
   * @return this vector for chaining
   */
  public selfTransformMat2(mat: { data: number[]|Float64Array }): Vec3 {
    const x = this.x
    const y = this.y
    const d = mat.data
    this.x = x * d[0] + y * d[2]
    this.y = x * d[1] + y * d[3]
    return this
  }

  /**
   * Readonly vector with all components set to zero
   */
  public static Zero = Object.freeze(new Vec3(0, 0, 0))
  /**
   * Readonly vector with all components set to one
   */
  public static One = Object.freeze(new Vec3(1, 1, 1))
  /**
   * Readonly vector x component set to one
   */
  public static Right = Object.freeze(new Vec3(1, 0, 0))
  /**
   * Readonly vector x component set to minus one
   */
  public static Left = Object.freeze(new Vec3(-1, 0, 0))
  /**
   * Readonly vector y component set to one
   */
  public static Up = Object.freeze(new Vec3(0, 1, 0))
  /**
   * Readonly vector y component set to minus one
   */
  public static Down = Object.freeze(new Vec3(0, -1, 0))
  /**
   * Readonly vector z component set to one
   */
  public static Backward = Object.freeze(new Vec3(0, 0, 1))
  /**
   * Readonly vector z component set to minus one
   */
  public static Forward = Object.freeze(new Vec3(0, 0, -1))
  /**
   * Readonly vector x component set to one
   */
  public static UnitX = Object.freeze(new Vec3(1, 0, 0))
  /**
   * Readonly vector y component set to one
   */
  public static UnitY = Object.freeze(new Vec3(0, 1, 0))
  /**
   * Readonly vector z component set to one
   */
  public static UnitZ = Object.freeze(new Vec3(0, 0, 1))

  /**
   * Creates a new vector. The method should be called with three or no arguments.
   * If less than three arguments are given
   * then some components of the resulting vector are going to be `undefined`.
   * @param [x] The x component
   * @param [y] The y component
   * @param [z] The z component
   * @return A new vector.
   */
  public static create(x?: number, y?: number, z?: number): Vec3 {
    return new Vec3(x || 0, y || 0, z || 0)
  }

  /**
   * Creates a new vector with all components set to 0.
   * @return A new vector.
   */
  public static zero(): Vec3 {
    return new Vec3(0, 0, 0)
  }

  /**
   * Creates a new vector with all components set to 1.
   * @return A new vector.
   */
  public static one(): Vec3 {
    return new Vec3(1, 1, 1)
  }

  /**
   * Copies the source vector to the destination vector
   * @param src
   * @param dst
   * @return the destination vector.
   */
  public static copy(src: IVec3, dst: IVec3): IVec3 {
    dst.x = src.x
    dst.y = src.y
    dst.z = src.z
    return dst
  }

  /**
   * Calculates the length of this vector
   * @param vec
   * @return The length.
   */
  public static len(vec: IVec3): number {
    const x = vec.x
    const y = vec.y
    const z = vec.z
    return Math.sqrt(x * x + y * y + z * z)
  }

  /**
   * Calculates the squared length of this vector
   * @param vec
   * @return The squared length.
   */
  public static lengthSquared(vec: IVec3): number {
    const x = vec.x
    const y = vec.y
    const z = vec.z
    return x * x + y * y + z * z
  }

  /**
   * Calculates the distance to the given vector
   * @param a
   * @param b
   * @return The distance between the vectors.
   */
  public static distance(a: IVec3, b: IVec3): number {
    const x = a.x - b.x
    const y = a.y - b.y
    const z = a.z - b.z
    return Math.sqrt(x * x + y * y + z * z)
  }

  /**
   * Calculates the squared distance to the given vector
   * @param a
   * @param b
   * @return The squared distance between the vectors.
   */
  public static distanceSquared(a: IVec3, b: IVec3): number {
    const x = a.x - b.x
    const y = a.y - b.y
    const z = a.z - b.z
    return x * x + y * y + z * z
  }

  /**
   * Calculates the dot product with the given vector
   * @param a
   * @param b
   * @return The dot product.
   */
  public static dot(a: IVec3, b: IVec3): number {
    return a.x * b.x + a.y * b.y + a.z * b.z
  }

  /**
   * Normalizes the given vector.
   * @param vec The vector to normalize.
   * @param [out] The vector to write to.
   * @return The given `out` parameter or a new vector.
   */
  public static normalize<T extends IVec3>(vec: IVec3, out?: T): T {
    out = (out || new Vec3()) as any
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
   * Calculates the cross product between two vectors.
   * @param vecA The first vector.
   * @param vecB The second vector.
   * @param [out] The vector to write to.
   * @return The given `out` argument or a new vector.
   */
  public static cross<T extends IVec3>(vecA: IVec3, vecB: IVec3, out?: T): T {
    out = (out || new Vec3()) as any
    const x = vecA.y * vecB.z - vecA.z * vecB.y
    const y = vecA.z * vecB.x - vecA.x * vecB.z
    const z = vecA.x * vecB.y - vecA.y * vecB.x
    out.x = x
    out.y = y
    out.z = z
    return out
  }

  /**
   * Inverts the given vector.
   * @param vec The vector to invert.
   * @param [out] The vector to write to.
   * @return The given `out` parameter or a new vector.
   */
  public static invert<T extends IVec3>(vec: IVec3, out?: T): T {
    out = (out || new Vec3()) as any
    out.x = 1.0 / vec.x
    out.y = 1.0 / vec.y
    out.z = 1.0 / vec.z
    return out
  }

  /**
   * Negates this vector.
   * @param vec The vector to negate.
   * @param [out] The vector to write to.
   * @return The given `out` parameter or a new vector.
   */
  public static negate<T extends IVec3>(vec: IVec3, out?: T): T {
    out = (out || new Vec3()) as any
    out.x = -vec.x
    out.y = -vec.y
    out.z = -vec.z
    return out
  }

  /**
   * Adds two vectors.
   * @param vecA The first vector.
   * @param vecB The second vector.
   * @param out The vector to write to.
   * @return The given `out` parameter or a new vector.
   */
  public static add<T extends IVec3>(vecA: IVec3, vecB: IVec3, out?: T): T {
    out = (out || new Vec3()) as any
    out.x = vecA.x + vecB.x
    out.y = vecA.y + vecB.y
    out.z = vecA.z + vecB.z
    return out
  }

  /**
   * Adds a scalar to each component of a vector.
   * @param vec The first vector.
   * @param scalar The scalar to add.
   * @param [out] The vector to write to.
   * @return The given `out` parameter or a new vector.
   */
  public static addScalar<T extends IVec3>(vec: IVec3, scalar: number, out?: T): T {
    out = (out || new Vec3()) as any
    out.x = vec.x + scalar
    out.y = vec.y + scalar
    out.z = vec.z + scalar
    return out
  }

  /**
   * Subtracts the second vector from the first.
   * @param vecA The first vector.
   * @param vecB The second vector.
   * @param [out] The vector to write to.
   * @return The given `out` parameter or a new vector.
   */
  public static subtract<T extends IVec3>(vecA: IVec3, vecB: IVec3, out?: T): T {
    out = (out || new Vec3()) as any
    out.x = vecA.x - vecB.x
    out.y = vecA.y - vecB.y
    out.z = vecA.z - vecB.z
    return out
  }

  /**
   * Subtracts a scalar from each component of a vector.
   * @param vec The first vector.
   * @param scalar The scalar to add.
   * @param [out] The vector to write to.
   * @return The given `out` parameter or a new vector.
   */
  public static subtractScalar<T extends IVec3>(vec: IVec3, scalar: number, out?: T): T {
    out = (out || new Vec3()) as any
    out.x = vec.x - scalar
    out.y = vec.y - scalar
    out.z = vec.z - scalar
    return out
  }

  /**
   * Multiplies two vectors.
   * @param vecA The first vector.
   * @param vecB The second vector.
   * @param [out] The vector to write to.
   * @return The given `out` parameter or a new vector.
   */
  public static multiply<T extends IVec3>(vecA: IVec3, vecB: IVec3, out?: T): T {
    out = (out || new Vec3()) as any
    out.x = vecA.x * vecB.x
    out.y = vecA.y * vecB.y
    out.z = vecA.z * vecB.z
    return out
  }

  /**
   * Multiplies a scalar to each component of a vector.
   * @param vec The first vector.
   * @param scalar The scalar to add.
   * @param [out] The vector to write to.
   * @return The given `out` parameter or a new vector.
   */
  public static multiplyScalar<T extends IVec3>(vec: IVec3, scalar: number, out?: T): T {
    out = (out || new Vec3()) as any
    out.x = vec.x * scalar
    out.y = vec.y * scalar
    out.z = vec.z * scalar
    return out
  }

  /**
   * Divides the components of the first vector by the components of the second vector.
   * @param vecA The first vector.
   * @param vecB The second vector.
   * @param [out] The vector to write to.
   * @return The given `out` parameter or a new vector.
   */
  public static divide<T extends IVec3>(vecA: IVec3, vecB: IVec3, out?: T): T {
    out = (out || new Vec3()) as any
    out.x = vecA.x / vecB.x
    out.y = vecA.y / vecB.y
    out.z = vecA.z / vecB.z
    return out
  }

  /**
   * Divides the components of the first vector by the scalar.
   * @param vec The first vector.
   * @param scalar The scalar to use for division.
   * @param out The vector to write to.
   * @return The given `out` parameter or a new vector.
   */
  public static divideScalar<T extends IVec3>(vec: IVec3, scalar: number, out?: T): T {
    out = (out || new Vec3()) as any
    scalar = 1.0 / scalar
    out.x = vec.x * scalar
    out.y = vec.y * scalar
    out.z = vec.z * scalar
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
  public static multiplyAdd<T extends IVec3>(vecA: IVec3, vecB: IVec3, add: IVec3, out?: T): T {
    out = (out || new Vec3()) as any
    out.x = vecA.x * vecB.x + add.x
    out.y = vecA.y * vecB.y + add.y
    out.z = vecA.z * vecB.z + add.z
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
  public static multiplyScalarAdd<T extends IVec3>(vecA: IVec3, mul: number, add: IVec3, out?: T): T {
    out = (out || new Vec3()) as any
    out.x = vecA.x * mul + add.x
    out.y = vecA.y * mul + add.y
    out.z = vecA.z * mul + add.z
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
  public static clamp<T extends IVec3>(a: IVec3, min: IVec3, max: IVec3, out?: T): T {
    out = (out || new Vec3()) as any
    const x = a.x
    const y = a.y
    const z = a.z
    const minX = min.x
    const minY = min.y
    const minZ = min.z
    const maxX = max.x
    const maxY = max.y
    const maxZ = max.z
    out.x = x < minX ? minX : (x > maxX ? maxX : x)
    out.y = y < minY ? minY : (y > maxY ? maxY : y)
    out.z = z < minZ ? minZ : (z > maxZ ? maxZ : z)
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
  public static clampScalar<T extends IVec3>(a: IVec3, min: number, max: number, out?: T): T {
    out = (out || new Vec3()) as any
    const x = a.x
    const y = a.y
    const z = a.z
    out.x = x < min ? min : (x > max ? max : x)
    out.y = y < min ? min : (y > max ? max : y)
    out.z = z < min ? min : (z > max ? max : z)
    return out
  }

  /**
   * Performs a component wise min operation on the the given vectors.
   * @param a The first vector.
   * @param b The second vector.
   * @param [out] The vector to write to.
   * @return The given `out` parameter or a new vector.
   */
  public static min<T extends IVec3>(a: IVec3, b: IVec3, out?: T): T {
    out = (out || new Vec3()) as any
    const aX = a.x
    const aY = a.y
    const aZ = a.z
    const bX = b.x
    const bY = b.y
    const bZ = b.z
    out.x = aX < bX ? aX : bX
    out.y = aY < bY ? aY : bY
    out.z = aZ < bZ ? aZ : bZ
    return out
  }

  /**
   * Performs a component wise min operation on the the given vector and a scalar value.
   * @param a The vector.
   * @param scalar The scalar.
   * @param [out] The vector to write to.
   * @return The given `out` parameter or a new vector.
   */
  public static minScalar<T extends IVec3>(a: IVec3, scalar: number, out?: T): T {
    out = (out || new Vec3()) as any
    const x = a.x
    const y = a.y
    const z = a.z
    out.x = x < scalar ? x : scalar
    out.y = y < scalar ? y : scalar
    out.z = z < scalar ? z : scalar
    return out
  }

  /**
   * Performs a component wise max operation on the the given vectors.
   * @param a The first vector.
   * @param b The second vector.
   * @param [out] The vector to write to.
   * @return The given `out` parameter or a new vector.
   */
  public static max<T extends IVec3>(a: IVec3, b: IVec3, out?: T): T {
    out = (out || new Vec3()) as any
    const aX = a.x
    const aY = a.y
    const aZ = a.z
    const bX = b.x
    const bY = b.y
    const bZ = b.z
    out.x = aX > bX ? aX : bX
    out.y = aY > bY ? aY : bY
    out.z = aZ > bZ ? aZ : bZ
    return out
  }

  /**
   * Performs a component wise max operation on the the given vector and a scalar value.
   * @param a The vector.
   * @param scalar The scalar.
   * @param [out] The vector to write to.
   * @return The given `out` parameter or a new vector.
   */
  public static maxScalar<T extends IVec3>(a: IVec3, scalar: number, out?: T): T {
    out = (out || new Vec3()) as any
    const x = a.x
    const y = a.y
    const z = a.z
    out.x = x > scalar ? x : scalar
    out.y = y > scalar ? y : scalar
    out.z = z > scalar ? z : scalar
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
  public static lerp<T extends IVec3>(a: IVec3, b: IVec3, t: number, out?: T): T {
    out = (out || new Vec3()) as any
    const x = a.x
    const y = a.y
    const z = a.z
    out.x = x + (b.x - x) * t
    out.y = y + (b.y - y) * t
    out.z = z + (b.z - z) * t
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
  public static barycentric<T extends IVec3>(a: IVec3, b: IVec3, c: IVec3, t1: number, t2: number, out?: T): T {
    out = (out || new Vec3()) as any
    const x = a.x
    const y = a.y
    const z = a.z
    out.x = x + t1 * (b.x - x) + t2 * (c.x - x)
    out.y = y + t1 * (b.y - y) + t2 * (c.y - y)
    out.z = z + t1 * (b.z - z) + t2 * (c.z - z)
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
  public static smooth<T extends IVec3>(a: IVec3, b: IVec3, t: number, out?: T): T {
    out = (out || new Vec3()) as any
    t = ((t > 1) ? 1 : ((t < 0) ? 0 : t))
    t = t * t * (3 - 2 * t)
    const x = a.x
    const y = a.y
    const z = a.z
    out.x = x + (b.x - x) * t
    out.y = y + (b.y - y) * t
    out.z = z + (b.z - z) * t
    return out
  }

  /**
   * Tries to converts the given data to a vector
   * @param {Vec2|Vec3|Vec4|Quat|Array|number} data
   * @return
   */
  public static convert(data: any): Vec3 {
    if (typeof data === 'number') {
      return new Vec3(data, data, data)
    }
    if (Array.isArray(data)) {
      return new Vec3(
        data[0] || 0,
        data[1] || 0,
        data[2] || 0,
      )
    }
    return new Vec3(
      data.x || 0,
      data.y || 0,
      data.z || 0,
    )
  }

  public static prettyString(vec: IVec3) {
    return [vec.x.toFixed(5), vec.y.toFixed(5), vec.z.toFixed(5)].join(', ')
  }

  public static randomNormal(vec: IVec3= new Vec3(), random: { random(): number }= Math): IVec3 {
    vec.x = random.random() - 0.5
    vec.y = random.random() - 0.5
    vec.z = random.random() - 0.5
    if (Vec3.lengthSquared(vec) > 0) {
      Vec3.normalize(vec, vec)
    }
    return vec
  }
}
