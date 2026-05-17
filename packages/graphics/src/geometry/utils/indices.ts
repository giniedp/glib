export function trianglesToLines(indices: number[]): number[] {
  const result: number[] = []
  const seen = new Set<string>()

  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i]
    const b = indices[i + 1]
    const c = indices[i + 2]

    addEdge(a, b)
    addEdge(b, c)
    addEdge(c, a)
  }

  function addEdge(a: number, b: number) {
    const key = a < b ? `${a}:${b}` : `${b}:${a}`
    if (!seen.has(key)) {
      result.push(a, b)
      seen.add(key)
    }
  }

  return result
}

export function flipWindingInPlace(indices: number[]): void {
  for (let i = 0; i < indices.length; i += 3) {
    const tmp = indices[i + 1]
    indices[i + 1] = indices[i + 2]
    indices[i + 2] = tmp
  }
}
