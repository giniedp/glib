import type { IMat, IVec2, IVec3, IVec4 } from './Types'
import { clamp, hermite, lerp } from './utils/common'

export function vec4(): IVec4
export function vec4(xyzw: number | IVec2 | IVec3 | IVec4 | number[] | null): IVec4
export function vec4(xyz: number | IVec2 | IVec3 | IVec4 | number[] | null, w: number): IVec4
export function vec4(xy: number | IVec2 | IVec3 | IVec4 | number[] | null, z: number, w: number): IVec4
export function vec4(x: number | IVec2 | IVec3 | IVec4 | number[] | null, y: number, z: number, w: number): IVec4
export function vec4(a?: number | IVec2 | IVec3 | IVec4 | number[] | null, b?: number, c?: number, d?: number): IVec4 {
  let x = 0
  let y = 0
  let z = 0
  let w = 0

  if (a != null) {
    if (typeof a === 'number') {
      x = y = z = w = a
    } else if (Array.isArray(a)) {
      x = a[0] || 0
      y = a[1] || 0
      z = a[2] || 0
      w = a[3] || 0
    } else {
      x = a.x || 0
      y = a.y || 0
      z = (a as IVec3).z || 0
      w = (a as IVec4).w || 0
    }
  }

  // trailing explicit args always take precedence over whatever `a` provided
  if (d !== undefined) {
    // vec4(x, y, z, w)
    y = b as number
    z = c as number
    w = d
  } else if (c !== undefined) {
    // vec4(xy, z, w)
    z = b as number
    w = c
  } else if (b !== undefined) {
    // vec4(xyz, w)
    w = b
  }

  return { x, y, z, w }
}

/**
 * Temporary variable for short lived calculations. Do not store references to this variable.
 */
vec4.$0 = { x: 0, y: 0, z: 0, w: 0 }

/**
 * Temporary variable for short lived calculations. Do not store references to this variable.
 */
vec4.$1 = { x: 0, y: 0, z: 0, w: 0 }

/**
 * Temporary variable for short lived calculations. Do not store references to this variable.
 */
vec4.$2 = { x: 0, y: 0, z: 0, w: 0 }

/**
 * Readonly vector with all components set to one
 */
vec4.One = Object.freeze<IVec4>({ x: 1, y: 1, z: 1, w: 1 })
/**
 * Readonly vector with all components set to zero
 */
vec4.Zero = Object.freeze<IVec4>({ x: 0, y: 0, z: 0, w: 0 })
/**
 * Readonly vector x component set to one
 */
vec4.UnitX = Object.freeze<IVec4>({ x: 1, y: 0, z: 0, w: 0 })
/**
 * Readonly vector y component set to one
 */
vec4.UnitY = Object.freeze<IVec4>({ x: 0, y: 1, z: 0, w: 0 })
/**
 * Readonly vector z component set to one
 */
vec4.UnitZ = Object.freeze<IVec4>({ x: 0, y: 0, z: 1, w: 0 })
/**
 * Readonly vector w component set to one
 */
vec4.UnitW = Object.freeze<IVec4>({ x: 0, y: 0, z: 0, w: 1 })

/**
 * Creates a vector from array
 *
 * @param array - the array to create from
 * @param offset - the offset in array
 * @param stride - the stride between elements
 * @returns
 */
export function vec4FromArray(array: ArrayLike<number>, offset: number = 0, stride: number = 1): IVec4 {
  return {
    x: array[offset],
    y: array[offset + 1 * stride],
    z: array[offset + 2 * stride],
    w: array[offset + 3 * stride],
  }
}

/**
 * Initializes the given vector
 *
 * @param out - the vector to initialize
 * @param x - The x component
 * @param y - The y component
 * @param z - The z component
 * @param w - The w component
 */
export function vec4$init(out: IVec4, x: number, y: number, z: number, w: number): IVec4 {
  out.x = x
  out.y = y
  out.z = z
  out.w = w
  return out
}

/**
 * Initializes the given vector
 *
 * @param out - the vector to initialize
 * @param from - the vector to read from
 */
export function vec4$initFrom(out: IVec4, from: IVec4): IVec4 {
  out.x = from.x
  out.y = from.y
  out.z = from.z
  out.w = from.w
  return out
}

/**
 * Initializes the vector from array
 *
 * @param out the vector to initialize
 * @param array the array to read from
 * @param offset the offset into the array
 */
export function vec4$initFromArray(out: IVec4, array: ArrayLike<number>, offset: number = 0): IVec4 {
  out.x = array[offset]
  out.y = array[offset + 1]
  out.z = array[offset + 2]
  out.w = array[offset + 3]
  return out
}

/**
 * Initializes the given vector
 *
 * @param out - the vector to initialize
 * @param value - The x, y, z and w component
 */
export function vec4$initFill(out: IVec4, value: number): IVec4 {
  out.x = value
  out.y = value
  out.z = value
  out.w = value
  return out
}

/**
 * Initializes the given vector with random values in range [0..1]
 *
 * @param out - the vector to initialize
 */
export function vec4$initRandom(out: IVec4, min: number = 0, max: number = 1): IVec4 {
  out.x = lerp(min, max, Math.random())
  out.y = lerp(min, max, Math.random())
  out.z = lerp(min, max, Math.random())
  out.w = lerp(min, max, Math.random())
  return out
}

/**
 * Creates a copy of a vector
 *
 * @param vec
 * @param out
 */
export function vec4Copy(vec: IVec4, out?: IVec4): IVec4 {
  out ||= { x: 0, y: 0, z: 0, w: 0 }
  out.x = vec.x
  out.y = vec.y
  out.z = vec.z
  out.w = vec.w
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
export function vec4ToArray(vec: IVec4): [number, number, number, number]
export function vec4ToArray(vec: IVec4, array: number[], offset?: number): number[]
export function vec4ToArray(vec: IVec4, array: number[] = [], offset: number = 0): number[] {
  array[offset] = vec.x
  array[offset + 1] = vec.y
  array[offset + 2] = vec.z
  array[offset + 3] = vec.w
  return array
}

/**
 * Checks for component wise equality
 */
export function vec4Equals(a: IVec4, b: IVec4): boolean {
  return a.x === b.x && a.y === b.y && a.z === b.z && a.w === b.w
}

/**
 * Calculates the length of this vector
 */
export function vec4Length(vec: IVec4): number {
  const x = vec.x
  const y = vec.y
  const z = vec.z
  const w = vec.w
  return Math.sqrt(x * x + y * y + z * z + w * w)
}

/**
 * Calculates the squared length of this vector
 */
export function vec4LengthSquared(vec: IVec4): number {
  const x = vec.x
  const y = vec.y
  const z = vec.z
  const w = vec.w
  return x * x + y * y + z * z + w * w
}

/**
 * Calculates the distance between two vectors
 */
export function vec4Distance(a: IVec4, b: IVec4): number {
  const x = a.x - b.x
  const y = a.y - b.y
  const z = a.z - b.z
  const w = a.w - b.w
  return Math.sqrt(x * x + y * y + z * z + w * w)
}

/**
 * Calculates the squared distance between two vectors
 */
export function vec4DistanceSquared(a: IVec4, b: IVec4): number {
  const x = a.x - b.x
  const y = a.y - b.y
  const z = a.z - b.z
  const w = a.w - b.w
  return x * x + y * y + z * z + w * w
}

/**
 * Calculates the dot product of two vectors
 */
export function vec4Dot(a: IVec4, b: IVec4): number {
  return a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w
}

/**
 * Normalizes a vector.
 */
export function vec4$normalize(out: IVec4): IVec4 {
  const x = out.x
  const y = out.y
  const z = out.z
  const w = out.w
  const d = 1.0 / Math.sqrt(x * x + y * y + z * z + w * w)
  out.x = x * d
  out.y = y * d
  out.z = z * d
  out.w = w * d
  return out
}

/**
 * Normalizes a vector.
 */
export function vec4Normalize(vec: IVec4, out?: IVec4): IVec4 {
  const x = vec.x
  const y = vec.y
  const z = vec.z
  const w = vec.w
  const d = 1.0 / Math.sqrt(x * x + y * y + z * z + w * w)
  out ||= { x: 0, y: 0, z: 0, w: 0 }
  out.x = x * d
  out.y = y * d
  out.z = z * d
  out.w = w * d
  return out
}

/**
 * Inverts a vector.
 */
export function vec4$invert(out: IVec4): IVec4 {
  out.x = 1.0 / out.x
  out.y = 1.0 / out.y
  out.z = 1.0 / out.z
  out.w = 1.0 / out.w
  return out
}

/**
 * Inverts a vector.
 */
export function vec4Invert(vec: IVec4, out?: IVec4): IVec4 {
  out ||= { x: 0, y: 0, z: 0, w: 0 }
  out.x = 1.0 / vec.x
  out.y = 1.0 / vec.y
  out.z = 1.0 / vec.z
  out.w = 1.0 / vec.w
  return out
}

/**
 * Negates the components of a vector.
 */
export function vec4$negate(out: IVec4): IVec4 {
  out.x = -out.x
  out.y = -out.y
  out.z = -out.z
  out.w = -out.w
  return out
}

/**
 * Negates the components of a vector.
 */
export function vec4Negate(vec: IVec4, out?: IVec4): IVec4 {
  out ||= { x: 0, y: 0, z: 0, w: 0 }
  out.x = -vec.x
  out.y = -vec.y
  out.z = -vec.z
  out.w = -vec.w
  return out
}

/**
 * Adds components of two vectors
 *
 * @param out - The vector to add to
 * @param other - The vector to add
 */
export function vec4$add(out: IVec4, other: IVec4): IVec4 {
  out.x += other.x
  out.y += other.y
  out.z += other.z
  out.w += other.w
  return out
}

/**
 * Adds components of two vectors
 *
 * @param a - The first vector
 * @param b - The second vector
 * @param out - The vector to write to
 */
export function vec4Add(a: IVec4, b: IVec4, out?: IVec4): IVec4 {
  out ||= { x: 0, y: 0, z: 0, w: 0 }
  out.x = a.x + b.x
  out.y = a.y + b.y
  out.z = a.z + b.z
  out.w = a.w + b.w
  return out
}

/**
 * Adds a value to all components
 *
 * @param out - The vector to add to
 * @param value - The value to add
 */
export function vec4$addScalar(out: IVec4, value: number): IVec4 {
  out.x += value
  out.y += value
  out.z += value
  out.w += value
  return out
}

/**
 * Adds a value to all components
 *
 * @param vec - The vector
 * @param value - The value
 * @param out - The vector to write to
 */
export function vec4AddScalar(vec: IVec4, value: number, out?: IVec4): IVec4 {
  out ||= { x: 0, y: 0, z: 0, w: 0 }
  out.x = vec.x + value
  out.y = vec.y + value
  out.z = vec.z + value
  out.w = vec.w + value
  return out
}

/**
 * Adds components of two vectors
 *
 * @param out - The vector to add to
 * @param other - The vector to add
 * @param scale - The value to scale with
 */
export function vec4$addScaled(out: IVec4, other: IVec4, scale: number): IVec4 {
  out.x += other.x * scale
  out.y += other.y * scale
  out.z += other.z * scale
  out.w += other.w * scale
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
export function vec4AddScaled(a: IVec4, b: IVec4, scale: number, out?: IVec4): IVec4 {
  out ||= { x: 0, y: 0, z: 0, w: 0 }
  out.x = a.x + b.x * scale
  out.y = a.y + b.y * scale
  out.z = a.z + b.z * scale
  out.w = a.w + b.w * scale
  return out
}

/**
 * Subtracts components of two vectors
 *
 * @param out - The vector to subtract from
 * @param other - The vector to subtract
 */
export function vec4$subtract(out: IVec4, other: IVec4): IVec4 {
  out.x -= other.x
  out.y -= other.y
  out.z -= other.z
  out.w -= other.w
  return out
}

/**
 * Subtracts components of two vectors
 *
 * @param a - The first vector
 * @param b - The second vector
 * @param out - The vector to write to
 */
export function vec4Subtract(a: IVec4, b: IVec4, out?: IVec4): IVec4 {
  out ||= { x: 0, y: 0, z: 0, w: 0 }
  out.x = a.x - b.x
  out.y = a.y - b.y
  out.z = a.z - b.z
  out.w = a.w - b.w
  return out
}

/**
 * Subtracts a value from all components
 *
 * @param out - The vector to subtract from
 * @param value - The value to subtract
 */
export function vec4$subtractScalar(out: IVec4, value: number): IVec4 {
  out.x -= value
  out.y -= value
  out.z -= value
  out.w -= value
  return out
}

/**
 * Subtracts a value from all components
 *
 * @param vec - The vector
 * @param value - The value
 * @param out - The vector to write to
 */
export function vec4SubtractScalar(vec: IVec4, value: number, out?: IVec4): IVec4 {
  out ||= { x: 0, y: 0, z: 0, w: 0 }
  out.x = vec.x - value
  out.y = vec.y - value
  out.z = vec.z - value
  out.w = vec.w - value
  return out
}

/**
 * Subtracts components of two vectors
 *
 * @param out - The vector to subtract from
 * @param other - The vector to subtract
 * @param scale - The value to scale with
 */
export function vec4$subtractScaled(out: IVec4, other: IVec4, scale: number): IVec4 {
  out.x -= other.x * scale
  out.y -= other.y * scale
  out.z -= other.z * scale
  out.w -= other.w * scale
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
export function vec4SubtractScaled(a: IVec4, b: IVec4, scale: number, out?: IVec4): IVec4 {
  out ||= { x: 0, y: 0, z: 0, w: 0 }
  out.x = a.x - b.x * scale
  out.y = a.y - b.y * scale
  out.z = a.z - b.z * scale
  out.w = a.w - b.w * scale
  return out
}

/**
 * Multiplies components of two vectors
 *
 * @param out - The vector to multiply
 * @param other - The vector to multiply with
 */
export function vec4$multiply(out: IVec4, other: IVec4): IVec4 {
  out.x *= other.x
  out.y *= other.y
  out.z *= other.z
  out.w *= other.w
  return out
}

/**
 * Multiplies components of two vectors
 *
 * @param a - The first vector
 * @param b - The second vector
 * @param out - The vector to write to
 */
export function vec4Multiply(a: IVec4, b: IVec4, out?: IVec4): IVec4 {
  out ||= { x: 0, y: 0, z: 0, w: 0 }
  out.x = a.x * b.x
  out.y = a.y * b.y
  out.z = a.z * b.z
  out.w = a.w * b.w
  return out
}

/**
 * Multiplies all components with a value
 *
 * @param out - The vector to multiply
 * @param value - The value to multiply with
 */
export function vec4$multiplyScalar(out: IVec4, value: number): IVec4 {
  out.x *= value
  out.y *= value
  out.z *= value
  out.w *= value
  return out
}

/**
 * Multiplies all components with a value
 *
 * @param vec - The vector
 * @param value - The value
 * @param out - The vector to write to
 */
export function vec4MultiplyScalar(vec: IVec4, value: number, out?: IVec4): IVec4 {
  out ||= { x: 0, y: 0, z: 0, w: 0 }
  out.x = vec.x * value
  out.y = vec.y * value
  out.z = vec.z * value
  out.w = vec.w * value
  return out
}

/**
 * Divides components of two vectors
 *
 * @param out - The vector to divide
 * @param other - The vector to divide by
 */
export function vec4$divide(out: IVec4, other: IVec4): IVec4 {
  out.x /= other.x
  out.y /= other.y
  out.z /= other.z
  out.w /= other.w
  return out
}

/**
 * Divides components of two vectors
 *
 * @param a - The first vector
 * @param b - The second vector
 * @param out - The vector to write to
 */
export function vec4Divide(a: IVec4, b: IVec4, out?: IVec4): IVec4 {
  out ||= { x: 0, y: 0, z: 0, w: 0 }
  out.x = a.x / b.x
  out.y = a.y / b.y
  out.z = a.z / b.z
  out.w = a.w / b.w
  return out
}

/**
 * Divides all components by a value
 *
 * @param out - The vector to divide
 * @param value - The value to divide by
 */
export function vec4$divideScalar(out: IVec4, value: number): IVec4 {
  value = 1 / value
  out.x *= value
  out.y *= value
  out.z *= value
  out.w *= value
  return out
}

/**
 * Divides all components by a value
 *
 * @param vec - The vector
 * @param value - The value
 * @param out - The vector to write to
 */
export function vec4DivideScalar(vec: IVec4, value: number, out?: IVec4): IVec4 {
  value = 1 / value
  out ||= { x: 0, y: 0, z: 0, w: 0 }
  out.x = vec.x * value
  out.y = vec.y * value
  out.z = vec.z * value
  out.w = vec.w * value
  return out
}

/**
 * Transforms a vector with the given quaternion. The w component is kept untouched.
 *
 * @param out - The vector to transform
 * @param quat - The quaternion
 */
export function vec4$applyQuat(out: IVec4, quat: IVec4): IVec4 {
  return vec4ApplyQuat(out, quat, out)
}

/**
 * Transforms a vector with the given quaternion. The w component is copied untouched.
 *
 * @param vec - The vector to transform
 * @param quat - The quaternion
 * @param out - The vector to write to
 */
export function vec4ApplyQuat(vec: IVec4, quat: IVec4, out?: IVec4): IVec4 {
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

  out ||= { x: 0, y: 0, z: 0, w: 0 }
  out.x = vx * (1 - yy2 - zz2) + vy * (xy2 - wz2) + vz * (xz2 + wy2)
  out.y = vx * (xy2 + wz2) + vy * (1 - xx2 - zz2) + vz * (yz2 - wx2)
  out.z = vx * (xz2 - wy2) + vy * (yz2 + wx2) + vz * (1 - xx2 - yy2)
  out.w = vec.w
  return out
}

/**
 * Transforms a vector with the given 4x4 matrix. Does not perform a division by `w`.
 *
 * @param out - The vector to transform
 * @param mat - The matrix
 */
export function vec4$applyMat4(out: IVec4, mat: IMat): IVec4 {
  return vec4ApplyMat4(out, mat, out)
}

/**
 * Transforms a vector with the given 4x4 matrix. Does not perform a division by `w`.
 *
 * @param vec - The vector to transform
 * @param mat - The matrix
 * @param out - The vector to write to
 */
export function vec4ApplyMat4(vec: IVec4, mat: IMat, out?: IVec4): IVec4 {
  const x = vec.x
  const y = vec.y
  const z = vec.z
  const w = vec.w
  const d = mat
  out ||= { x: 0, y: 0, z: 0, w: 0 }
  out.x = x * d[0] + y * d[4] + z * d[8] + w * d[12]
  out.y = x * d[1] + y * d[5] + z * d[9] + w * d[13]
  out.z = x * d[2] + y * d[6] + z * d[10] + w * d[14]
  out.w = x * d[3] + y * d[7] + z * d[11] + w * d[15]
  return out
}

/**
 * Transforms a vector with the given 3x3 matrix. The w component is kept untouched.
 *
 * @param out - The vector to transform
 * @param mat - The matrix
 */
export function vec4$applyMat3(out: IVec4, mat: IMat): IVec4 {
  return vec4ApplyMat3(out, mat, out)
}

/**
 * Transforms a vector with the given 3x3 matrix. The w component is copied untouched.
 *
 * @param vec - The vector to transform
 * @param mat - The matrix
 * @param out - The vector to write to
 */
export function vec4ApplyMat3(vec: IVec4, mat: IMat, out?: IVec4): IVec4 {
  const x = vec.x
  const y = vec.y
  const z = vec.z
  const d = mat
  out ||= { x: 0, y: 0, z: 0, w: 0 }
  out.x = x * d[0] + y * d[3] + z * d[6]
  out.y = x * d[1] + y * d[4] + z * d[7]
  out.z = x * d[2] + y * d[5] + z * d[8]
  out.w = vec.w
  return out
}

/**
 * Transforms a vector with the given 2x2 matrix. The z and w components are kept untouched.
 *
 * @param out - The vector to transform
 * @param mat - The matrix
 */
export function vec4$applyMat2(out: IVec4, mat: IMat): IVec4 {
  return vec4ApplyMat2(out, mat, out)
}

/**
 * Transforms a vector with the given 2x2 matrix. The z and w components are copied untouched.
 *
 * @param vec - The vector to transform
 * @param mat - The matrix
 * @param out - The vector to write to
 */
export function vec4ApplyMat2(vec: IVec4, mat: IMat, out?: IVec4): IVec4 {
  const x = vec.x
  const y = vec.y
  const d = mat
  out ||= { x: 0, y: 0, z: 0, w: 0 }
  out.x = x * d[0] + y * d[2]
  out.y = x * d[1] + y * d[3]
  out.z = vec.z
  out.w = vec.w
  return out
}

/**
 * Clamps all components between 0 and 1
 *
 * @param out - The vector to clamp
 */
export function vec4$saturate(out: IVec4): IVec4 {
  out.x = out.x < 0 ? 0 : out.x > 1 ? 1 : out.x
  out.y = out.y < 0 ? 0 : out.y > 1 ? 1 : out.y
  out.z = out.z < 0 ? 0 : out.z > 1 ? 1 : out.z
  out.w = out.w < 0 ? 0 : out.w > 1 ? 1 : out.w
  return out
}

/**
 * Clamps all components between 0 and 1
 *
 * @param vec - The vector to clamp
 * @param out - The vector to write to
 */
export function vec4Saturate(vec: IVec4, out?: IVec4): IVec4 {
  out ||= { x: 0, y: 0, z: 0, w: 0 }
  out.x = vec.x < 0 ? 0 : vec.x > 1 ? 1 : vec.x
  out.y = vec.y < 0 ? 0 : vec.y > 1 ? 1 : vec.y
  out.z = vec.z < 0 ? 0 : vec.z > 1 ? 1 : vec.z
  out.w = vec.w < 0 ? 0 : vec.w > 1 ? 1 : vec.w
  return out
}

/**
 * Clamps components between the components of the min and max vectors
 *
 * @param out - The vector to clamp
 * @param min - Vector with the minimum component values
 * @param max - Vector with the maximum component values
 */
export function vec4$clamp(out: IVec4, min: IVec4, max: IVec4): IVec4 {
  out.x = clamp(out.x, min.x, max.x)
  out.y = clamp(out.y, min.y, max.y)
  out.z = clamp(out.z, min.z, max.z)
  out.w = clamp(out.w, min.w, max.w)
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
export function vec4Clamp(vec: IVec4, min: IVec4, max: IVec4, out?: IVec4): IVec4 {
  out ||= { x: 0, y: 0, z: 0, w: 0 }
  out.x = clamp(vec.x, min.x, max.x)
  out.y = clamp(vec.y, min.y, max.y)
  out.z = clamp(vec.z, min.z, max.z)
  out.w = clamp(vec.w, min.w, max.w)
  return out
}

/**
 * Clamps all components between min and max values
 *
 * @param out - The vector to clamp
 * @param min - The minimum value
 * @param max - The maximum value
 */
export function vec4$clampScalar(out: IVec4, min: number, max: number): IVec4 {
  out.x = out.x < min ? min : out.x > max ? max : out.x
  out.y = out.y < min ? min : out.y > max ? max : out.y
  out.z = out.z < min ? min : out.z > max ? max : out.z
  out.w = out.w < min ? min : out.w > max ? max : out.w
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
export function vec4ClampScalar(vec: IVec4, min: number, max: number, out?: IVec4): IVec4 {
  out ||= { x: 0, y: 0, z: 0, w: 0 }
  out.x = vec.x < min ? min : vec.x > max ? max : vec.x
  out.y = vec.y < min ? min : vec.y > max ? max : vec.y
  out.z = vec.z < min ? min : vec.z > max ? max : vec.z
  out.w = vec.w < min ? min : vec.w > max ? max : vec.w
  return out
}

/**
 * Component wise min operation of two vectors
 *
 * @param a - The first vector
 * @param b - The second vector
 * @param out - The vector to write to
 */
export function vec4Min(a: IVec4, b: IVec4, out?: IVec4): IVec4 {
  out ||= { x: 0, y: 0, z: 0, w: 0 }
  out.x = a.x < b.x ? a.x : b.x
  out.y = a.y < b.y ? a.y : b.y
  out.z = a.z < b.z ? a.z : b.z
  out.w = a.w < b.w ? a.w : b.w
  return out
}

/**
 * Component wise min operation of a vector and a value
 *
 * @param vec - The vector
 * @param value - The value
 * @param out - The vector to write to
 */
export function vec4MinScalar(vec: IVec4, value: number, out?: IVec4): IVec4 {
  out ||= { x: 0, y: 0, z: 0, w: 0 }
  out.x = vec.x < value ? vec.x : value
  out.y = vec.y < value ? vec.y : value
  out.z = vec.z < value ? vec.z : value
  out.w = vec.w < value ? vec.w : value
  return out
}

/**
 * Component wise max operation of two vectors
 *
 * @param a - The first vector
 * @param b - The second vector
 * @param out - The vector to write to
 */
export function vec4Max(a: IVec4, b: IVec4, out?: IVec4): IVec4 {
  out ||= { x: 0, y: 0, z: 0, w: 0 }
  out.x = a.x > b.x ? a.x : b.x
  out.y = a.y > b.y ? a.y : b.y
  out.z = a.z > b.z ? a.z : b.z
  out.w = a.w > b.w ? a.w : b.w
  return out
}

/**
 * Component wise max operation of a vector and a value
 *
 * @param vec - The vector
 * @param value - The value
 * @param out - The vector to write to
 */
export function vec4MaxScalar(vec: IVec4, value: number, out?: IVec4): IVec4 {
  out ||= { x: 0, y: 0, z: 0, w: 0 }
  out.x = vec.x > value ? vec.x : value
  out.y = vec.y > value ? vec.y : value
  out.z = vec.z > value ? vec.z : value
  out.w = vec.w > value ? vec.w : value
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
export function vec4Lerp(a: IVec4, b: IVec4, t: number, out?: IVec4): IVec4 {
  out ||= { x: 0, y: 0, z: 0, w: 0 }
  out.x = a.x + (b.x - a.x) * t
  out.y = a.y + (b.y - a.y) * t
  out.z = a.z + (b.z - a.z) * t
  out.w = a.w + (b.w - a.w) * t
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
export function vec4Hermite(a: IVec4, ta: IVec4, b: IVec4, tb: IVec4, t: number, out?: IVec4): IVec4 {
  out ||= { x: 0, y: 0, z: 0, w: 0 }
  out.x = hermite(a.x, ta.x, b.x, tb.x, t)
  out.y = hermite(a.y, ta.y, b.y, tb.y, t)
  out.z = hermite(a.z, ta.z, b.z, tb.z, t)
  out.w = hermite(a.w, ta.w, b.w, tb.w, t)
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
export function vec4Barycentric(a: IVec4, b: IVec4, c: IVec4, t1: number, t2: number, out?: IVec4): IVec4 {
  out ||= { x: 0, y: 0, z: 0, w: 0 }
  out.x = a.x + t1 * (b.x - a.x) + t2 * (c.x - a.x)
  out.y = a.y + t1 * (b.y - a.y) + t2 * (c.y - a.y)
  out.z = a.z + t1 * (b.z - a.z) + t2 * (c.z - a.z)
  out.w = a.w + t1 * (b.w - a.w) + t2 * (c.w - a.w)
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
export function vec4Format(vec: IVec4, fractionDigits: number = 5): string {
  return 'x: '.concat(
    vec.x.toFixed(fractionDigits),
    ', y: ',
    vec.y.toFixed(fractionDigits),
    ', z: ',
    vec.z.toFixed(fractionDigits),
    ', w: ',
    vec.w.toFixed(fractionDigits),
  )
}
