
export interface BezierOptions {
  degree: number
  points: number[]
  weights: number[]
}

export function bezier(data: BezierOptions) {

  function factorial(v: number) {
    let result = 1
    for (let i = 2; i <= v; i++) {
      result *= i
    }
    return result
  }

  function bc(n: number, i: number) {
    const numerator = factorial(n)
    const denominator = factorial(n - i) * factorial(i)
    return numerator / denominator
  }

  function f(i: number, n: number, t: number): number {
    return bc(n, i) * Math.pow(t, i) * Math.pow(1 - t, n - i)
  }

  return (t: number): number => {
    let result = 0
    for (let i = 0; i < data.points.length - 1; i++) {
      result += data.points[i] * f(i, data.degree, t)
    }
    return result
  }
}
