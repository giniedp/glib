
export interface BSplineOptions {
  degree: number
  points: number[]
  weights: number[]
  knots: number[]
}

export function bspline(data: BSplineOptions) {

  function f(i: number, n: number, t: number): number {
    const x = data.knots
    if (n === 0) {
      if (x[i] <= t && t < x[i + 1]) {
        return 1
      }
      return 0
    }

    const d1 = x[i + n] - x[i]
    const n1 = d1 === 0 ? 0 : f(i, n - 1, t) / d1
    const t1 = (t - x[i]) * n1

    const d2 = x[i + n + 1] - x[i + 1]
    const n2 = d2 === 0 ? 0 : f(i + 1, n - 1, t) / d2
    const t2 = (x[i + n + 1] - t) * n2

    return t1 + t2
  }

  return (t: number): number => {
    let result = 0
    for (let i = 0; i < data.points.length - 1; i++) {
      result += data.points[i] * f(i, data.degree, t)
    }
    return result
  }
}
