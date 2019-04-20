export interface TaylorOptions {
  degree: number
  points: number[]
  weights: number[]
}

export function taylor(data: TaylorOptions) {

  function f(i: number, n: number, t: number): number {
    n = 1
    while (i > 0) {
      n *= t
      i--
    }
    return n
  }

  return (t: number): number => {
    let result = 0
    for (let i = 0; i < data.points.length - 1; i++) {
      result += data.points[i] * f(i, data.degree, t)
    }
    return result
  }
}
