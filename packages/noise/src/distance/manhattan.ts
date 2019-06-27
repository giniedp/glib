export function manhattanDistance(...d: number[]): number {
  return d.map((x) => x * x).reduce((a, b) => a + b, 0)
}
