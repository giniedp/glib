import type { IMat, IVec2, IVec3, IVec4 } from './Types'
import { clamp, lerp } from './utils/common'

export function vec2(): IVec2
export function vec2(xyz: number | IVec2 | IVec3 | IVec4 | number[] | null): IVec2
export function vec2(x: number | IVec2 | IVec3 | IVec4 | number[] | null, y: number): IVec2
export function vec2(a?: number | IVec2 | IVec3 | IVec4 | number[] | null, b?: number): IVec2 {
  let x = 0
  let y = 0

  if (a != null) {
    if (typeof a === 'number') {
      x = y = a
    } else if (Array.isArray(a)) {
      x = a[0] || 0
      y = a[1] || 0
    } else {
      x = a.x || 0
      y = a.y || 0
    }
  }

  // trailing explicit args always take precedence over whatever `a` provided
  if (b !== undefined) {
    // vec2(x, y)
    y = b as number
  }

  return { x, y }
}

/**
 * Temporary variable for short lived calculations. Do not store references to this variable.
 */
vec2.$0 = { x: 0, y: 0 }

/**
 * Temporary variable for short lived calculations. Do not store references to this variable.
 */
vec2.$1 = { x: 0, y: 0 }

/**
 * Temporary variable for short lived calculations. Do not store references to this variable.
 */
vec2.$2 = { x: 0, y: 0 }

/**
 * Initializes the given vector
 *
 * @param out - the vector to initialize
 * @param x - The x component
 * @param y - The y component
 */
export function vec2$init(out: IVec2, x: number, y: number): IVec2 {
  out.x = x
  out.y = y
  return out
}

/**
 * Initializes the given vector
 *
 * @param out - the vector to initialize
 * @param value - The x and y component
 */
export function vec2$initFill(out: IVec2, value: number): IVec2 {
  out.x = value
  out.y = value
  return out
}

/**
 * Initializes the given vector with random values in range [0..1]
 *
 * @param out - the vector to initialize
 */
export function vec2$initRandom(out: IVec2, min: number = 0, max: number = 1): IVec2 {
  out.x = lerp(min, max, Math.random())
  out.y = lerp(min, max, Math.random())
  return out
}

/**
 * Creates a copy of a vector
 *
 * @param vec
 * @param out
 */
export function vec2Copy(vec: IVec2, out?: IVec2): IVec2 {
  out ||= { x: 0, y: 0 }
  out.x = vec.x
  out.y = vec.y
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
export function vec2ToArray(vec: IVec2): [number, number]
export function vec2ToArray(vec: IVec2, array: number[], offset?: number): number[]
export function vec2ToArray(vec: IVec2, array: number[] = [], offset: number = 0): number[] {
  array[offset] = vec.x
  array[offset + 1] = vec.y
  return array
}

/**
 * Checks for component wise equality
 */
export function vec2Equals(a: IVec2, b: IVec2): boolean {
  return a.x === b.x && a.y === b.y
}

/**
 * Calculates the length of this vector
 */
export function vec2Length(vec: IVec2): number {
  const x = vec.x
  const y = vec.y
  return Math.sqrt(x * x + y * y)
}

/**
 * Calculates the squared length of this vector
 */
export function vec2LengthSquared(vec: IVec2): number {
  const x = vec.x
  const y = vec.y
  return x * x + y * y
}
/**
 * Calculates the distance between two vectors
 */
export function vec2Distance(a: IVec2, b: IVec2): number {
  const x = a.x - b.x
  const y = a.y - b.y
  return Math.sqrt(x * x + y * y)
}
/**
 * Calculates the squared distance between two vectors
 */
export function vec2DistanceSquared(a: IVec2, b: IVec2): number {
  const x = a.x - b.x
  const y = a.y - b.y
  return x * x + y * y
}
/**
 * Calculates the dot product of two vectors
 */
export function vec2Dot(a: IVec2, b: IVec2): number {
  return a.x * b.x + a.y * b.y
}

/**
 * Normalizes a vector.
 */
export function vec2$normalize(out: IVec2): IVec2 {
  const x = out.x
  const y = out.y
  const d = 1.0 / Math.sqrt(x * x + y * y)
  out.x = x * d
  out.y = y * d
  return out
}

/**
 * Normalizes a vector.
 */
export function vec2Normalize(vec: IVec2, out?: IVec2): IVec2 {
  const x = vec.x
  const y = vec.y
  const d = 1.0 / Math.sqrt(x * x + y * y)
  out ||= { x: 0, y: 0 }
  out.x = x * d
  out.y = y * d
  return out
}

/**
 * Inverts a vector.
 */
export function vec2$invert(out: IVec2): IVec2 {
  out.x = 1.0 / out.x
  out.y = 1.0 / out.y
  return out
}

/**
 * Inverts a vector.
 */
export function vec2Invert(vec: IVec2, out?: IVec2): IVec2 {
  out ||= { x: 0, y: 0 }
  out.x = 1.0 / vec.x
  out.y = 1.0 / vec.y
  return out
}

/**
 * Negates the components of a vector.
 */
export function vec2$negate(out: IVec2): IVec2 {
  out.x = -out.x
  out.y = -out.y
  return out
}

/**
 * Negates the components of a vector.
 */
export function vec2Negate(vec: IVec2, out?: IVec2): IVec2 {
  out ||= { x: 0, y: 0 }
  out.x = -vec.x
  out.y = -vec.y
  return out
}

/**
 * Adds components of two vectors
 *
 * @param out - The vector to add to
 * @param other - The vector to add
 */
export function vec2$add(out: IVec2, other: IVec2): IVec2 {
  out.x += other.x
  out.y += other.y
  return out
}

/**
 * Adds components of two vectors
 *
 * @param a - The first vector
 * @param b - The second vector
 * @param out - The vector to write to
 */
export function vec2Add(a: IVec2, b: IVec2, out?: IVec2): IVec2 {
  out ||= { x: 0, y: 0 }
  out.x = a.x + b.x
  out.y = a.y + b.y
  return out
}

/**
 * Adds a value to all components
 *
 * @param out - The vector to add to
 * @param value - The value to add
 */
export function vec2$addScalar(out: IVec2, value: number): IVec2 {
  out.x += value
  out.y += value
  return out
}

/**
 * Adds a value to all components
 *
 * @param vec - The vector
 * @param value - The value
 * @param out - The vector to write to
 */
export function vec2AddScalar(vec: IVec2, value: number, out?: IVec2): IVec2 {
  out ||= { x: 0, y: 0 }
  out.x = vec.x + value
  out.y = vec.y + value
  return out
}

/**
 * Adds components of two vectors
 *
 * @param out - The vector to add to
 * @param other - The vector to add
 * @param scale - The value to scale with
 */
export function vec2$addScaled(out: IVec2, other: IVec2, scale: number): IVec2 {
  out.x += other.x * scale
  out.y += other.y * scale
  return out
}

/**
 * Adds components of two vectors
 *
 * @param a - The first vector
 * @param b - The second vector
 * @param out - The vector to write to
 */
export function vec2AddScaled(a: IVec2, b: IVec2, scale: number, out?: IVec2): IVec2 {
  out ||= { x: 0, y: 0 }
  out.x = a.x + b.x * scale
  out.y = a.y + b.y * scale
  return out
}

/**
 * Subtracts components of two vectors
 *
 * @param out - The vector to subtract from
 * @param other - The vector to subtract
 */
export function vec2$subtract(out: IVec2, other: IVec2): IVec2 {
  out.x -= other.x
  out.y -= other.y
  return out
}

/**
 * Subtracts components of two vectors
 *
 * @param a - The first vector
 * @param b - The second vector
 * @param out - The vector to write to
 */
export function vec2Subtract(a: IVec2, b: IVec2, out?: IVec2): IVec2 {
  out ||= { x: 0, y: 0 }
  out.x = a.x - b.x
  out.y = a.y - b.y
  return out
}

/**
 * Subtracts a value from all components
 *
 * @param out - The vector to subtract from
 * @param value - The value to subtract
 */
export function vec2$subtractScalar(out: IVec2, value: number): IVec2 {
  out.x -= value
  out.y -= value
  return out
}

/**
 * Subtracts a value from all components
 *
 * @param vec - The vector
 * @param value - The value
 * @param out - The vector to write to
 */
export function vec2SubtractScalar(vec: IVec2, value: number, out?: IVec2): IVec2 {
  out ||= { x: 0, y: 0 }
  out.x = vec.x - value
  out.y = vec.y - value
  return out
}

/**
 * Subtracts components of two vectors
 *
 * @param out - The vector to subtract from
 * @param other - The vector to subtract
 * @param scale - The value to scale with
 */
export function vec2$subtractScaled(out: IVec2, other: IVec2, scale: number): IVec2 {
  out.x -= other.x * scale
  out.y -= other.y * scale
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
export function vec2SubtractScaled(a: IVec2, b: IVec2, scale: number, out?: IVec2): IVec2 {
  out ||= { x: 0, y: 0 }
  out.x = a.x - b.x * scale
  out.y = a.y - b.y * scale
  return out
}

/**
 * Multiplies components of two vectors
 *
 * @param out - The vector to multiply
 * @param other - The vector to multiply with
 */
export function vec2$multiply(out: IVec2, other: IVec2): IVec2 {
  out.x *= other.x
  out.y *= other.y
  return out
}

/**
 * Multiplies components of two vectors
 *
 * @param a - The first vector
 * @param b - The second vector
 * @param out - The vector to write to
 */
export function vec2Multiply(a: IVec2, b: IVec2, out?: IVec2): IVec2 {
  out ||= { x: 0, y: 0 }
  out.x = a.x * b.x
  out.y = a.y * b.y
  return out
}

/**
 * Multiplies all components with a value
 *
 * @param out - The vector to multiply
 * @param value - The value to multiply with
 */
export function vec2$multiplyScalar(out: IVec2, value: number): IVec2 {
  out.x *= value
  out.y *= value
  return out
}

/**
 * Multiplies all components with a value
 *
 * @param vec - The vector
 * @param value - The value
 * @param out - The vector to write to
 */
export function vec2MultiplyScalar(vec: IVec2, value: number, out?: IVec2): IVec2 {
  out ||= { x: 0, y: 0 }
  out.x = vec.x * value
  out.y = vec.y * value
  return out
}

/**
 * Divides components of two vectors
 *
 * @param out - The vector to divide
 * @param other - The vector to divide by
 */
export function vec2$divide(out: IVec2, other: IVec2): IVec2 {
  out.x /= other.x
  out.y /= other.y
  return out
}

/**
 * Divides components of two vectors
 *
 * @param a - The first vector
 * @param b - The second vector
 * @param out - The vector to write to
 */
export function vec2Divide(a: IVec2, b: IVec2, out?: IVec2): IVec2 {
  out ||= { x: 0, y: 0 }
  out.x = a.x / b.x
  out.y = a.y / b.y
  return out
}

/**
 * Divides all components by a value
 *
 * @param out - The vector to divide
 * @param value - The value to divide by
 */
export function vec2$divideScalar(out: IVec2, value: number): IVec2 {
  value = 1 / value
  out.x *= value
  out.y *= value
  return out
}

/**
 * Divides all components by a value
 *
 * @param vec - The vector
 * @param value - The value
 * @param out - The vector to write to
 */
export function vec2DivideScalar(vec: IVec2, value: number, out?: IVec2): IVec2 {
  value = 1 / value
  out ||= { x: 0, y: 0 }
  out.x = vec.x * value
  out.y = vec.y * value
  return out
}

/**
 * Transforms a vector with the given 4x4 matrix
 *
 * @param out - The vector to transform
 * @param mat - The matrix
 */
export function vec2$transformByMat4(out: IVec2, mat: IMat): IVec2 {
  const x = out.x
  const y = out.y
  const d = mat
  out.x = x * d[0] + y * d[4] + d[12]
  out.y = x * d[1] + y * d[5] + d[13]
  return out
}

/**
 * Transforms a vector with the given 4x4 matrix
 *
 * @param vec - The vector to transform
 * @param mat - The matrix
 * @param out - The vector to write to
 */
export function vec2TransformByMat4(vec: IVec2, mat: IMat, out?: IVec2): IVec2 {
  const x = vec.x
  const y = vec.y
  const d = mat
  out ||= { x: 0, y: 0 }
  out.x = x * d[0] + y * d[4] + d[12]
  out.y = x * d[1] + y * d[5] + d[13]
  return out
}

/**
 * Transforms a vector with the given 3x3 matrix
 *
 * @param out - The vector to transform
 * @param mat - The matrix
 */
export function vec2$transformByMat3(out: IVec2, mat: IMat): IVec2 {
  const x = out.x
  const y = out.y
  const d = mat
  out.x = x * d[0] + y * d[3]
  out.y = x * d[1] + y * d[4]
  return out
}

/**
 * Transforms a vector with the given 3x3 matrix
 *
 * @param vec - The vector to transform
 * @param mat - The matrix
 * @param out - The vector to write to
 */
export function vec2TransformByMat3(vec: IVec2, mat: IMat, out?: IVec2): IVec2 {
  const x = vec.x
  const y = vec.y
  const d = mat
  out ||= { x: 0, y: 0 }
  out.x = x * d[0] + y * d[3]
  out.y = x * d[1] + y * d[4]
  return out
}

/**
 * Transforms a vector with the given 2x2 matrix
 *
 * @param out - The vector to transform
 * @param mat - The matrix
 */
export function vec2$transformByMat2(out: IVec2, mat: IMat): IVec2 {
  const x = out.x
  const y = out.y
  const d = mat
  out.x = x * d[0] + y * d[2]
  out.y = x * d[1] + y * d[3]
  return out
}

/**
 * Transforms a vector with the given 2x2 matrix
 *
 * @param vec - The vector to transform
 * @param mat - The matrix
 * @param out - The vector to write to
 */
export function vec2TransformByMat2(vec: IVec2, mat: IMat, out?: IVec2): IVec2 {
  const x = vec.x
  const y = vec.y
  const d = mat
  out ||= { x: 0, y: 0 }
  out.x = x * d[0] + y * d[2]
  out.y = x * d[1] + y * d[3]
  return out
}

/**
 * Clamps all components between 0 and 1
 *
 * @param out - The vector to clamp
 */
export function vec2$saturate(out: IVec2): IVec2 {
  out.x = out.x < 0 ? 0 : out.x > 1 ? 1 : out.x
  out.y = out.y < 0 ? 0 : out.y > 1 ? 1 : out.y
  return out
}

/**
 * Clamps all components between 0 and 1
 *
 * @param vec - The vector to clamp
 * @param out - The vector to write to
 */
export function vec2Saturate(vec: IVec2, out?: IVec2): IVec2 {
  out ||= { x: 0, y: 0 }
  out.x = vec.x < 0 ? 0 : vec.x > 1 ? 1 : vec.x
  out.y = vec.y < 0 ? 0 : vec.y > 1 ? 1 : vec.y
  return out
}

/**
 * Clamps components between the components of the min and max vectors
 *
 * @param out - The vector to clamp
 * @param min - Vector with the minimum component values
 * @param max - Vector with the maximum component values
 */
export function vec2$clamp(out: IVec2, min: IVec2, max: IVec2): IVec2 {
  out.x = clamp(out.x, min.x, max.x)
  out.y = clamp(out.y, min.y, max.y)
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
export function vec2Clamp(vec: IVec2, min: IVec2, max: IVec2, out?: IVec2): IVec2 {
  out ||= { x: 0, y: 0 }
  out.x = clamp(vec.x, min.x, max.x)
  out.y = clamp(vec.y, min.y, max.y)
  return out
}

/**
 * Clamps all components between min and max values
 *
 * @param out - The vector to clamp
 * @param min - The minimum value
 * @param max - The maximum value
 * @param out - The vector to write to
 */
export function vec2$clampScalar(out: IVec2, min: number, max: number): IVec2 {
  out.x = out.x < min ? min : out.x > max ? max : out.x
  out.y = out.y < min ? min : out.y > max ? max : out.y
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
export function vec2ClampScalar(vec: IVec2, min: number, max: number, out?: IVec2): IVec2 {
  out ||= { x: 0, y: 0 }
  out.x = vec.x < min ? min : vec.x > max ? max : vec.x
  out.y = vec.y < min ? min : vec.y > max ? max : vec.y
  return out
}

/**
 * Component wise min operation of two vectors
 *
 * @param a - The first vector
 * @param b - The second vector
 * @param out - The vector to write to
 */
export function vec2Min(a: IVec2, b: IVec2, out?: IVec2): IVec2 {
  out ||= { x: 0, y: 0 }
  out.x = a.x < b.x ? a.x : b.x
  out.y = a.y < b.y ? a.y : b.y
  return out
}

/**
 * Component wise min operation of a vector and a value
 *
 * @param vec - The vector
 * @param value - The value
 * @param out - The vector to write to
 */
export function vec2MinScalar(vec: IVec2, value: number, out?: IVec2): IVec2 {
  out ||= { x: 0, y: 0 }
  out.x = vec.x < value ? vec.x : value
  out.y = vec.y < value ? vec.y : value
  return out
}

/**
 * Component wise max operation of two vectors
 *
 * @param a - The first vector
 * @param b - The second vector
 * @param out - The vector to write to
 */
export function vec2Max(a: IVec2, b: IVec2, out?: IVec2): IVec2 {
  out ||= { x: 0, y: 0 }
  out.x = a.x > b.x ? a.x : b.x
  out.y = a.y > b.y ? a.y : b.y
  return out
}

/**
 * Component wise max operation of a vector and a value
 *
 * @param vec - The vector
 * @param value - The value
 * @param out - The vector to write to
 */
export function vec2MaxScalar(vec: IVec2, value: number, out?: IVec2): IVec2 {
  out ||= { x: 0, y: 0 }
  out.x = vec.x > value ? vec.x : value
  out.y = vec.y > value ? vec.y : value
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
export function vec2Lerp(a: IVec2, b: IVec2, t: number, out?: IVec2): IVec2 {
  out ||= { x: 0, y: 0 }
  out.x = a.x + (b.x - a.x) * t
  out.y = a.y + (b.y - a.y) * t
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
export function vec2Barycentric(a: IVec2, b: IVec2, c: IVec2, t1: number, t2: number, out?: IVec2): IVec2 {
  out ||= { x: 0, y: 0 }
  out.x = a.x + t1 * (b.x - a.x) + t2 * (c.x - a.x)
  out.y = a.y + t1 * (b.y - a.y) + t2 * (c.y - a.y)
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
export function vec2Format(vec: IVec2, fractionDigits: number = 5): string {
  return 'x: '.concat(vec.x.toFixed(fractionDigits), ', y: ', vec.y.toFixed(fractionDigits))
}
