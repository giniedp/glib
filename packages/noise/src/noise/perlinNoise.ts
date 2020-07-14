

import { easeCubic, easeLinear } from '../easing'
import { Ease, Sampler } from '../types'
import { lerp } from '../utils'
import { grad1D, grad2D, grad3D, Permutation } from './utils'

/**
 * Generates a perlin noise sampler
 *
 * @public
 */
export function perlinNoise(ease: Ease = easeCubic): Sampler {
  const p = new PerlinNoise(ease)
  return (...x: number[]) => {
    if (x.length === 1) {
      return p.sample1D(x[0])
    }
    if (x.length === 2) {
      return p.sample3D(x[0], x[1], 0)
    }
    if (x.length === 3) {
      return p.sample3D(x[0], x[1], x[2])
    }
  }
}

/**
 * Perlin noise implementation based on the Improved Noise reference implementation
 * http://mrl.nyu.edu/~perlin/noise/
 */
class PerlinNoise {

  constructor(private ease: Ease = easeLinear) {

  }

  public sample1D(x: number): number {
    // find unit cube that contains point
    let X = Math.floor(x) & 255

    // find relative x of point in cube
    x -= Math.floor(x)

    // compute fade curves for x
    const fx = this.ease(x)

    // hash coordinates of the corners
    const A = Permutation[X]

    // add and blend results from corners of cube
    const vx0 = grad1D(A, x)
    const vx1 = grad1D(A, x + 1)
    return lerp(vx0, vx1, fx)
  }

  public sample2D(x: number, y: number): number {
    // find unit cube that contains point
    const xi = Math.floor(x) & 255
    const yi = Math.floor(y) & 255

    // find relative x, y of point in cube
    x -= Math.floor(x)
    y -= Math.floor(y)

    // compute fade curves for each x, y
    const xf = this.ease(x)
    const yf = this.ease(y)

    // hash coordinates of the corners
    const A = Permutation[xi] + yi
    const B = Permutation[xi + 1] + yi

    // add and blend results from corners of cube
    let vx0 = grad2D(A, x, y)
    let vx1 = grad2D(B, x - 1, y)
    let vy0 = lerp(vx0, vx1, xf)
    vx0 = grad2D(A + 1, x, y - 1)
    vx1 = grad2D(B + 1, x - 1, y - 1)
    let vy1 = lerp(vx0, vx1, xf)
    return lerp(vy0, vy1, yf)
  }

  public sample3D(x: number, y: number, z: number) {
    // find unit cube that contains point
    const xi = Math.floor(x) & 255
    const yi = Math.floor(y) & 255
    const zi = Math.floor(z) & 255

    // find relative x, y, z of point in cube
    x -= Math.floor(x)
    y -= Math.floor(y)
    z -= Math.floor(z)

    // compute fade curves for each x, y, z
    const xf = this.ease(x)
    const yf = this.ease(y)
    const wf = this.ease(z)

    // hash coordinates of the 8 cube corners
    const A  = Permutation[xi    ] + yi
    const AA = Permutation[A     ] + zi
    const AB = Permutation[A  + 1] + zi
    const B  = Permutation[xi + 1] + yi
    const BA = Permutation[B     ] + zi
    const BB = Permutation[B  + 1] + zi

    // add and blend results from 8 corners of cube
    let vx0 = grad3D(AA, x, y, z)
    let vx1 = grad3D(BA, x - 1, y, z)
    let vy0 = lerp(vx0, vx1, xf)
    vx0 = grad3D(AB, x, y - 1, z)
    vx1 = grad3D(BB, x - 1, y - 1, z)
    let vy1 = lerp(vx0, vx1, xf)
    let vz0 = lerp(vy0, vy1, yf)

    vx0 = grad3D(AA + 1, x, y, z - 1)
    vx1 = grad3D(BA + 1, x - 1, y, z - 1)
    vy0 = lerp(vx0, vx1, xf)
    vx0 = grad3D(AB + 1, x, y - 1, z - 1)
    vx1 = grad3D(BB + 1, x - 1, y - 1, z - 1)
    vy1 = lerp(vx0, vx1, xf)
    let vz1 = lerp(vy0, vy1, yf)
    return lerp(vz0, vz1, wf)
  }
}
