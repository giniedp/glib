export const ShaderAnnotations = {
  Block: 'block',
  Alias: 'alias',
}

export function parseAnnotations(source: string | string[], out: Record<string, any> = {}): Record<string, any> {
  source = source || ''
  const list = Array.isArray(source) ? source : source.split('\n')
  for (const item of list) {
    for (const line of item.split('\n')) {
      const match = line.match(/^\s*@\s*(\w+)\s*(.*)\s*/)
      if (match) {
        out[match[1]] = match[2].trim()
      }
    }
  }
  return out
}
