
import { Sampler } from '../types'
import { Permutation } from './utils'

const grad3 = [
  1, 1, 0,
  -1, 1, 0,
  1, -1, 0,
  -1, -1, 0,
  1, 0, 1,
  -1, 0, 1,
  1, 0, -1,
  -1, 0, -1,
  0, 1, 1,
  0, -1, 1,
  0, 1, -1,
  0, -1, -1,
]

/**
 * Generates a simplex noise sampler
 *
 * @public
 * @remarks
 * - http://staffwww.itn.liu.se/~stegu/aqsis/aqsis-newnoise/
 * - http://code.google.com/p/simplexnoise/
 * - http://webstaff.itn.liu.se/~stegu/simplexnoise/simplexnoise.pdf
 */
export function simplexNoise(): Sampler {
  return (...x: number[]) => {
    if (x.length === 1) {
      return simplexNoise2D(x[0], 0)
    }
    if (x.length === 2) {
      return simplexNoise2D(x[0], x[1])
    }
    if (x.length === 3) {
      return simplexNoise3D(x[0], x[1], x[2])
    }
  }
}

function simplexNoise2D(x: number, y: number) {
  const F2 = 0.366025403 // F2 = 0.5*(sqrt(3.0)-1.0)
  const G2 = 0.211324865 // G2 = (3.0-Math.sqrt(3.0))/6.0

  // Noise contributions from the three corners
  let n0
  let n1
  let n2

  // Skew the input space to determine which simplex cell we're in
  const s = (x + y) * F2 // Hairy factor for 2D
  const i = Math.floor(x + s)
  const j = Math.floor(y + s)

  const t = (i + j) * G2
  // Unskew the cell origin back to (x,y) space
  const X0 = i - t
  const Y0 = j - t
  // The x,y distances from the cell origin
  const x0 = x - X0
  const y0 = y - Y0

  // For the 2D case, the simplex shape is an equilateral triangle.
  // Determine which simplex we are in.
  let i1
  let j1 // Offsets for second (middle) corner of simplex in (interpolation,j) coords
  if (x0 > y0) {
    // lower triangle, XY order: (0,0)->(1,0)->(1,1)
    i1 = 1
    j1 = 0
  } else {
    // upper triangle, YX order: (0,0)->(0,1)->(1,1)
    i1 = 0
    j1 = 1
  }

  // A step of (1,0) in (interpolation,j) means a step of (1-c,-c) in (x,y), and
  // a step of (0,1) in (interpolation,j) means a step of (-c,1-c) in (x,y), where
  // c = (3-sqrt(3))/6

  // Offsets for middle corner in (x,y) unskewed coords
  const x1 = x0 - i1 + G2
  const y1 = y0 - j1 + G2
  // Offsets for last corner in (x,y) unskewed coords
  const x2 = x0 - 1.0 + 2.0 * G2
  const y2 = y0 - 1.0 + 2.0 * G2

  // Work out the hashed gradient indices of the three simplex corners
  const ii = i & 255
  const jj = j & 255
  let gi0 = Permutation[ii + Permutation[jj]] % 12
  let gi1 = Permutation[ii + i1 + Permutation[jj + j1]] % 12
  let gi2 = Permutation[ii + 1 + Permutation[jj + 1]] % 12

  gi0 *= 3
  gi1 *= 3
  gi2 *= 3

  // Calculate the contribution from the three corners
  let t0 = 0.5 - x0 * x0 - y0 * y0
  if (t0 < 0.0) {
    n0 = 0.0
  } else {
    t0 *= t0
    n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0)
  }

  let t1 = 0.5 - x1 * x1 - y1 * y1
  if (t1 < 0.0) {
    n1 = 0.0
  } else {
    t1 *= t1
    n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1)
  }

  let t2 = 0.5 - x2 * x2 - y2 * y2
  if (t2 < 0.0) {
    n2 = 0.0
  } else {
    t2 *= t2
    n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2)
  }

  // Add contributions from each corner to get the final noise value.
  // The result is scaled to return values in the interval [-1,1].
  return 70.0 * (n0 + n1 + n2)
}

function simplexNoise3D(x: number, y: number, z: number) {
  // Simple skewing factors for the 3D case
  const F3 = 0.333333333
  const G3 = 0.166666667

  // Noise contributions from the four corners
  let n0
  let n1
  let n2
  let n3

  // Skew the input space to determine which simplex cell we're in
  const s = (x + y + z) * F3 // Very nice and simple skew factor for 3D
  const xs = x + s
  const ys = y + s
  const zs = z + s
  const i = Math.floor(xs)
  const j = Math.floor(ys)
  const k = Math.floor(zs)

  const t = (i + j + k) * G3
  const X0 = i - t // Unskew the cell origin back to (x,y,z) space
  const Y0 = j - t
  const Z0 = k - t
  let x0 = x - X0 // The x,y,z distances from the cell origin
  let y0 = y - Y0
  let z0 = z - Z0

  // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
  // Determine which simplex we are in.
  let i1; let j1; let k1 // Offsets for second corner of simplex in (interpolation,j,k) coords
  let i2; let j2; let k2 // Offsets for third corner of simplex in (interpolation,j,k) coords

  if (x0 >= y0) {
    if (y0 >= z0) {
      // X Y Z order
      i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0
    } else if (x0 >= z0) {
      // X Z Y order
      i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1
    } else {
      // Z X Y order
      i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1
    }
  } else {
    if (y0 < z0) {
      // Z Y X order
      i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1
    } else if (x0 < z0) {
      // Y Z X order
      i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1
    } else {
      // Y X Z order
      i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0
    }
  }

  // A step of (1,0,0) in (interpolation,j,k) means a step of (1-c,-c,-c) in (x,y,z),
  // a step of (0,1,0) in (interpolation,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
  // a step of (0,0,1) in (interpolation,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
  // c = 1/6.

  const x1 = x0 - i1 + G3 // Offsets for second corner in (x,y,z) coords
  const y1 = y0 - j1 + G3
  const z1 = z0 - k1 + G3
  const x2 = x0 - i2 + 2.0 * G3 // Offsets for third corner in (x,y,z) coords
  const y2 = y0 - j2 + 2.0 * G3
  const z2 = z0 - k2 + 2.0 * G3
  const x3 = x0 - 1.0 + 3.0 * G3 // Offsets for last corner in (x,y,z) coords
  const y3 = y0 - 1.0 + 3.0 * G3
  const z3 = z0 - 1.0 + 3.0 * G3

  // Work out the hashed gradient indices of the four simplex corners
  const ii = i & 0xff
  const jj = j & 0xff
  const kk = k & 0xff
  let gi0 = Permutation[ii + Permutation[jj + Permutation[kk]]] % 12
  let gi1 = Permutation[ii + i1 + Permutation[jj + j1 + Permutation[kk + k1]]] % 12
  let gi2 = Permutation[ii + i2 + Permutation[jj + j2 + Permutation[kk + k2]]] % 12
  let gi3 = Permutation[ii + 1 + Permutation[jj + 1 + Permutation[kk + 1]]] % 12
  gi0 *= 3; gi1 *= 3; gi2 *= 3; gi3 *= 3

  // Calculate the contribution from the four corners
  let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0
  if (t0 < 0.0) {
    n0 = 0.0
  } else {
    t0 *= t0
    n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0 + grad3[gi0 + 2] * z0)
  }

  let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1
  if (t1 < 0.0) {
    n1 = 0.0
  } else {
    t1 *= t1
    n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1 + grad3[gi1 + 2] * z1)
  }

  let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2
  if (t2 < 0.0) {
    n2 = 0.0
  } else {
    t2 *= t2
    n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2 + grad3[gi2 + 2] * z2)
  }

  let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3
  if (t3 < 0.0) {
    n3 = 0.0
  } else {
    t3 *= t3
    n3 = t3 * t3 * (grad3[gi3] * x3 + grad3[gi3 + 1] * y3 + grad3[gi3 + 2] * z3)
  }

  // Add contributions from each corner to get the final noise value.
  // The result is scaled to stay just inside [-1,1]
  return 32.0 * (n0 + n1 + n2 + n3)
}
