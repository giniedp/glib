import type { IMat, IVec2, IVec3, IVec4 } from './Types'
import { clamp, hermite, lerp } from './utils/common'

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
