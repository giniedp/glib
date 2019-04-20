import { Sampler } from '../types'
import { samplerArray } from '../utils'

export function scale(src: Sampler, ...scalar: number[]): Sampler {
  const smpScalar = samplerArray(...scalar)
  return (...x: number[]) => {
    for (let i = 0; i < x.length; i++) {
      x[i] *= scalar[i] != null ? scalar[i] : 1
    }
    return src(...x)
  }
}
