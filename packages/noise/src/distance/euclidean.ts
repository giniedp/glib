import { DistanceFunc } from './type'

export function euclideanDistance(...d: number[]): number {
  return d.map((x) => x * x).reduce((a, b) => a + b, 0)
}

export function euclideanStretched(...stretch: number[]): DistanceFunc {
  return (...d: number[]) => {
    return d.map((x, i) => x * x * (stretch[i] == null ? 1 : stretch[i])).reduce((a, b) => a + b, 0)
  }
}
