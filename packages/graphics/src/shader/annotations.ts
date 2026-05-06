export function parseAnnotations(source: string | string[], out: Record<string, any> = {}): Record<string, any> {
  source = source || ''
  const lines = Array.isArray(source) ? source : source.split('\n')
  for (const line of lines) {
    const match = line.match(/^\s*@\s*(\w+)\s*(.*)\s*/)
    if (match) {
      out[match[1]] = match[2]
    }
  }
  return out
}
