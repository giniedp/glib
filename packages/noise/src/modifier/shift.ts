import { Sampler } from '../types'

export function shift(src: Sampler, ...s: number[]): Sampler {
  return (...x: number[]) => {
    for (let i = 0; i < x.length; i++) {
      x[i] += s[i] != null ? s[i] : 1
    }
    return src(...x)
  }
}
