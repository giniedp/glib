import { Sampler } from '../types'
import { Spline } from '../utils'
import { latticeNoise } from './latticeNoise'

/**
 * Generates a value noise sampler
 *
 * @public
 */
export function valueNoise(src: Sampler = latticeNoise()): Sampler {
  return (...x: number[]) => {
    if (x.length === 1) {
      return valueNoise1D(src, x[0])
    }
    if (x.length === 2) {
      return valueNoise2D(src, x[0], x[1])
    }
    if (x.length === 3) {
      return valueNoise3D(src, x[0], x[1], x[2])
    }
  }
}

function valueNoise1D(noise: Sampler, x: number) {
  const ix = Math.floor(x)
  const fx = x - ix
  const xknots = []
  for (let i = -1; i <= 2; i++) {
    xknots[i + 1] = noise(ix + i)
  }

  return Spline(fx, xknots[0], xknots[1], xknots[2], xknots[3])
}

function valueNoise2D(noise: Sampler, x: number, y: number) {
    const ix = Math.floor(x)
    const iy = Math.floor(y)

    const fx = x - ix
    const fy = y - iy

    const xknots = []
    const yknots = []
    for (let j = -1; j <= 2; j++) {
        for (let i = -1; i <= 2; i++) {
            xknots[i + 1] = noise(ix + i, iy + j)
        }
        yknots[j + 1] = Spline(fx, xknots[0], xknots[1], xknots[2], xknots[3])
    }
    return Spline(fy, yknots[0], yknots[1], yknots[2], yknots[3])
}

function valueNoise3D(noise: Sampler, x: number, y: number, z: number) {

  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const iz = Math.floor(z)

  const fx = x - ix
  const fy = y - iy
  const fz = z - iz

  const xknots = []
  const yknots = []
  const zknots = []

  for (let k = -1; k <= 2; k++) {
    for (let j = -1; j <= 2; j++) {
      for (let i = -1; i <= 2; i++) {
        xknots[i + 1] = noise(ix + i, iy + j, iz + k)
      }
      yknots[j + 1] = Spline(fx, xknots[0], xknots[1], xknots[2], xknots[3])
    }
    zknots[k + 1] = Spline(fy, yknots[0], yknots[1], yknots[2], yknots[3])
  }
  return Spline(fz, zknots[0], zknots[1], zknots[2], zknots[3])
}
